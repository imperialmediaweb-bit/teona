import { intreaba } from "@/lib/baza";
import { laBuletin } from "@/lib/buletin";
import { anuntaDonatia, trimiteMultumirea } from "@/lib/email/donatie";
import { notificaPanoul } from "@/lib/notificari";
import { scrieSuma } from "@/lib/suma";
import {
  type DonatieIncasata,
  marcheazaPlatita,
  scrieInitiata,
} from "./donatii";
import { incaseazaComanda } from "./paypal";
import type Stripe from "stripe";
import { sesiuneaDeLaStripe } from "./stripe";

/**
 * Ce se întâmplă după ce o donație a fost încasată, oricare ar fi drumul
 * (webhook Stripe, pagina de mulțumire, verificarea din panou, PayPal).
 *
 * Un singur loc, ca toate căile să facă același lucru: înainte, webhook-ul
 * Stripe trimitea mulțumirea, cel PayPal n-anunța asociația, iar nimeni nu
 * trimitea nimic pe telefon. Rândul vine din `marcheazaPlatita`, care îl
 * întoarce **numai prima dată**, deci oricâte căi ajung la aceeași donație,
 * e-mailurile și notificarea pleacă o singură dată.
 */
export async function dupaIncasare(
  rand: DonatieIncasata | null,
  reinnoire = false,
): Promise<void> {
  if (!rand) return;
  const date = {
    email: rand.email ?? "",
    prenume: rand.prenume,
    nume: rand.nume,
    sumaBani: Number(rand.suma_bani),
    moneda: rand.moneda,
    frecventa: rand.frecventa,
    destinatie: rand.destinatie,
  };

  let multumireTrimisa = false;
  if (rand.email) {
    multumireTrimisa = await trimiteMultumirea({
      ...date,
      email: rand.email,
      reinnoire,
    }).catch(() => false);
  }

  // Asociația află de fiecare donație nouă: pe e-mail și pe telefon.
  // Reînnoirile lunare nu: ar fi același om în fiecare lună.
  if (!reinnoire) {
    if (rand.email) {
      await anuntaDonatia({ ...date, email: rand.email, multumireTrimisa }).catch(
        () => undefined,
      );
    }
    const suma = `${scrieSuma(date.sumaBani / 100)}${rand.moneda === "EUR" ? " €" : " lei"}`;
    await notificaPanoul({
      titlu: "Donație nouă",
      text: `${rand.prenume?.trim() || "Cineva"} a donat ${suma}${rand.frecventa === "lunar" ? " pe lună" : ""}.`,
      adresa: "/admin/donatii",
    }).catch(() => 0);
  }

  // Pe lista de buletin ajunge doar cine a bifat el acordul.
  if (rand.acord_buletin && rand.email) {
    await laBuletin(rand.email).catch(() => undefined);
  }
}

/**
 * Înregistrează o sesiune Stripe plătită: rândul și starea „plătită”.
 *
 * Rândul se scrie **din sesiune**, nu doar se caută. În mod obișnuit el există
 * deja (îl scrie site-ul când pornește plata), iar `ON CONFLICT DO NOTHING`
 * îl lasă cum e. Dar dacă scrierea de atunci a picat — baza n-a răspuns o
 * secundă —, fără pasul ăsta confirmarea n-ar fi avut ce marca: banii în
 * Stripe, nimic în panou, niciun e-mail, nicio eroare. Datele vin din
 * metadatele pe care le-am pus noi pe sesiune și din adresa văzută de Stripe.
 */
export async function inregistreazaSesiuneaStripe(
  sesiune: Stripe.Checkout.Session,
): Promise<boolean> {
  if (sesiune.payment_status !== "paid") return false;
  const m = sesiune.metadata ?? {};
  const email = sesiune.customer_details?.email ?? sesiune.customer_email ?? null;
  await scrieInitiata({
    procesator: "stripe",
    referinta: sesiune.id,
    sumaBani: sesiune.amount_total ?? 0,
    moneda: (sesiune.currency ?? "ron").toUpperCase(),
    frecventa: sesiune.mode === "subscription" ? "lunar" : "o-data",
    destinatie: m.destinatie || "oriunde",
    email,
    prenume: m.prenume || null,
    nume: m.nume || null,
    telefon: m.telefon || null,
    acordBuletin: m.acord_buletin === "da",
    campanieSlug: m.campanie || null,
    canal: m.canal || null,
    sursa: m.sursa || null,
  });
  const rand = await marcheazaPlatita("stripe", sesiune.id, sesiune.amount_total ?? undefined);
  await dupaIncasare(rand);
  return true;
}

/**
 * Confirmă o sesiune Stripe întrebând chiar Stripe. Întoarce „platita”,
 * „neplatita” sau „necunoscuta” (sesiunea nu e una de-a noastră).
 */
export async function confirmaSesiuneaStripe(
  id: string,
): Promise<"platita" | "neplatita" | "necunoscuta"> {
  const sesiune = await sesiuneaDeLaStripe(id);
  if (!sesiune) return "necunoscuta";
  // O plată abandonată (sesiunea a expirat la Stripe, după 24 de ore) se
  // închide, ca verificarea din panou să n-o mai întrebe la nesfârșit.
  if (sesiune.status === "expired" && sesiune.payment_status !== "paid") {
    await intreaba(
      "UPDATE donatii SET stare = 'expirata' WHERE procesator = 'stripe' AND referinta = $1 AND stare = 'initiata'",
      [id],
    );
    return "neplatita";
  }
  return (await inregistreazaSesiuneaStripe(sesiune)) ? "platita" : "neplatita";
}

/*
  Plasa de siguranță: plățile cu cardul rămase „inițiate”.

  Fiecare plată pornită de pe site lasă un rând „inițiat”; webhook-ul Stripe îl
  trece pe „plătit”. Dacă anunțul nu ajunge, rândul rămâne așa pentru
  totdeauna, deși banii au intrat — exact ce s-a întâmplat pe 3 noiembrie
  2026. Aici se întreabă Stripe despre toate rândurile inițiate din ultimele
  30 de zile. Rulează singură, din panou, la deschiderea tabloului de bord și
  a donațiilor, cel mult o dată la cinci minute. Nu e nimic de apăsat.
*/
let ultimaVerificare = 0;
let inCurs: Promise<{ verificate: number; confirmate: number }> | null = null;

export async function verificaPlatileStripe(
  fortat = false,
): Promise<{ verificate: number; confirmate: number }> {
  // Una singură odată: dacă Stripe e lent, verificările nu se adună.
  if (inCurs) return inCurs;
  if (!fortat && Date.now() - ultimaVerificare < 5 * 60 * 1000) {
    return { verificate: 0, confirmate: 0 };
  }
  ultimaVerificare = Date.now();
  inCurs = verificaAcum().finally(() => {
    inCurs = null;
  });
  return inCurs;
}

async function verificaAcum(): Promise<{ verificate: number; confirmate: number }> {
  const randuri = await intreaba<{ referinta: string }>(
    `SELECT referinta FROM donatii
      WHERE procesator = 'stripe' AND stare = 'initiata'
        AND referinta LIKE 'cs\\_%'
        AND creat_la > now() - interval '30 days'
      ORDER BY creat_la DESC
      LIMIT 50`,
  );
  let confirmate = 0;
  for (const r of randuri) {
    try {
      if ((await confirmaSesiuneaStripe(r.referinta)) === "platita") confirmate++;
    } catch {
      // O sesiune pe care Stripe n-o mai găsește nu oprește restul.
    }
  }
  return { verificate: randuri.length, confirmate };
}

/**
 * Înregistrează o încasare PayPal: rândul (dacă nu există) și „plătită”.
 * Referința e identificatorul încasării, același pe care îl aduce și
 * webhook-ul `PAYMENT.CAPTURE.COMPLETED`, deci cele două căi nu se dublează.
 */
export async function inregistreazaPayPal(inc: {
  id: string;
  bani: number;
  moneda: string;
  email: string | null;
  customId: string;
}): Promise<boolean> {
  const [destinatie, canal] = inc.customId.split("|");
  await scrieInitiata({
    procesator: "paypal",
    referinta: inc.id,
    sumaBani: inc.bani,
    moneda: inc.moneda,
    frecventa: "o-data",
    destinatie: destinatie || "oriunde",
    email: inc.email,
    prenume: null,
    nume: null,
    telefon: null,
    // PayPal nu ne poate transmite o bifă pe care omul n-a văzut-o pe
    // site-ul nostru. Fără acord explicit, nimeni nu ajunge pe listă.
    acordBuletin: false,
    canal: canal || null,
  });
  const rand = await marcheazaPlatita("paypal", inc.id, inc.bani);
  await dupaIncasare(rand);
  return true;
}

/** Încasează o comandă PayPal aprobată și o înregistrează. */
export async function incaseazaSiInregistreaza(comanda: string): Promise<boolean> {
  const inc = await incaseazaComanda(comanda);
  if (!inc) return false;
  return inregistreazaPayPal(inc);
}

/**
 * Verificarea de la deschiderea panoului: cel mult o dată la cinci minute și
 * cel mult patru secunde, ca pagina să nu stea după Stripe. Ce nu se termină
 * în patru secunde se termină în fundal și apare la următoarea deschidere.
 */
export async function verificaInainte(): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return;
  await Promise.race([
    verificaPlatileStripe().catch(() => undefined),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
}
