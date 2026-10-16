import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { raspuns } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import {
  evenimentNou,
  marcheazaPlatita,
  scrieInitiata,
  type DonatieIncasata,
} from "@/lib/plati/donatii";
import { citesteEveniment } from "@/lib/plati/stripe";
import { laBuletin } from "@/lib/buletin";
import { trimiteMultumirea } from "@/lib/email/donatie";
import { trimiteVesteaReinnoirii } from "@/lib/email/reinnoire";

/**
 * Confirmarea plăților, de la Stripe.
 *
 * Asta e singura sursă de adevăr pentru „s-a donat”. Pagina de mulțumire nu
 * dovedește nimic: adresa ei o poate deschide oricine, oricând. O donație se
 * consideră încasată doar când sosește aici un mesaj semnat de Stripe.
 *
 * Corpul se citește ca text brut, nu ca JSON: semnătura se calculează peste
 * octeții exacți, iar o trecere prin `JSON.parse` și înapoi i-ar schimba.
 */
export async function POST(cerere: Request) {
  const semnatura = cerere.headers.get("stripe-signature");
  if (!semnatura) return raspuns("Lipsește semnătura.", 400);

  const corp = await cerere.text();

  let eveniment: Stripe.Event;
  try {
    eveniment = citesteEveniment(corp, semnatura);
  } catch {
    // Semnătură greșită înseamnă fie o cheie nepotrivită, fie cineva care
    // încearcă să inventeze donații. Oricum, nu scriem nimic.
    return raspuns("Semnătură invalidă.", 400);
  }

  if (!areBazaDeDate()) {
    // Fără bază de date n-avem unde scrie, dar răspundem 200: altfel Stripe
    // reîncearcă la nesfârșit un eveniment pe care oricum nu-l putem folosi.
    return NextResponse.json({ primit: true });
  }

  // Același eveniment poate sosi de mai multe ori. Prima dată câștigă.
  if (!(await evenimentNou("stripe", eveniment.id))) {
    return NextResponse.json({ primit: true, repetat: true });
  }

  try {
    await prelucreaza(eveniment);
  } catch {
    // Răspuns 500: Stripe reîncearcă, iar rândul din `evenimente_plati`
    // rămâne — deci la reîncercare am ieși pe „repetat” și n-am mai scrie
    // niciodată. De aceea îl ștergem înainte să cerem reîncercarea.
    await stergeEveniment(eveniment.id);
    return raspuns("Nu am putut prelucra evenimentul.", 500);
  }

  return NextResponse.json({ primit: true });
}

async function stergeEveniment(id: string) {
  const { intreaba } = await import("@/lib/baza");
  await intreaba(
    "DELETE FROM evenimente_plati WHERE procesator = 'stripe' AND eveniment = $1",
    [id],
  ).catch(() => undefined);
}

async function prelucreaza(eveniment: Stripe.Event) {
  switch (eveniment.type) {
    /* Plată unică, sau prima plată a unui abonament. */
    case "checkout.session.completed": {
      const sesiune = eveniment.data.object as Stripe.Checkout.Session;
      if (sesiune.payment_status !== "paid") return;
      const rand = await marcheazaPlatita(
        "stripe",
        sesiune.id,
        sesiune.amount_total ?? undefined,
      );
      await dupaIncasare(rand);
      return;
    }

    /*
      Reînnoirile lunare. Fiecare e o donație nouă, cu referința ei — altfel
      a doua lună ar suprascrie-o pe prima și evidența ar arăta o singură
      donație de la un om care dă în fiecare lună.
    */
    case "invoice.paid": {
      const factura = eveniment.data.object as Stripe.Invoice;
      // Prima factură a abonamentului e deja numărată la `checkout.session
      // .completed`; aici ne interesează doar reînnoirile.
      if (factura.billing_reason === "subscription_create") return;

      const date = metadateleAbonamentului(factura);

      await scrieInitiata({
        procesator: "stripe",
        referinta: factura.id ?? `factura-${eveniment.id}`,
        sumaBani: factura.amount_paid,
        moneda: (factura.currency ?? "ron").toUpperCase(),
        frecventa: "lunar",
        destinatie: date.destinatie ?? "oriunde",
        email: factura.customer_email ?? null,
        prenume: date.prenume || null,
        nume: date.nume || null,
        telefon: date.telefon || null,
        acordBuletin: date.acord_buletin === "da",
        campanieSlug: date.campanie || null,
        canal: date.canal || null,
        sursa: date.sursa || null,
      });
      const randReinnoire = await marcheazaPlatita(
        "stripe",
        factura.id ?? `factura-${eveniment.id}`,
        factura.amount_paid,
      );
      await dupaIncasare(randReinnoire, true);
      return;
    }

    /*
      Vestea de dinaintea reînnoirii.

      Stripe trimite `invoice.upcoming` cu câteva zile înainte să ia suma.
      **Câte zile se alege din contul Stripe**, nu de aici: Billing →
      Subscriptions and emails → „Upcoming invoice" webhook. Implicit sunt 3;
      pentru două zile, se schimbă acolo. Am ales evenimentul lui, nu o
      treabă programată de noi, fiindcă el știe singur data fiecărei
      reînnoiri, îl trimite o dată pe factură și nu trebuie ținut în viață
      niciun ceas pe server.

      Factura asta n-are încă bani în ea și nu se scrie nimic în evidență: e
      doar un mesaj către om. Dacă trimiterea cade, donația merge înainte
      neatinsă — de aceea nu cerem reîncercarea.
    */
    case "invoice.upcoming": {
      const factura = eveniment.data.object as Stripe.Invoice;
      const abonament = idAbonamentului(factura);
      const catre = factura.customer_email;
      if (!abonament || !catre) return;

      const date = metadateleAbonamentului(factura);
      const rand = factura.lines?.data?.[0];
      await trimiteVesteaReinnoirii({
        email: catre,
        prenume: date.prenume || null,
        sumaBani: factura.amount_due ?? rand?.amount ?? 0,
        moneda: (factura.currency ?? "ron").toUpperCase(),
        destinatie: date.destinatie || "oriunde",
        cand: new Date(
          (factura.next_payment_attempt ??
            rand?.period?.end ??
            Math.floor(Date.now() / 1000)) * 1000,
        ).toISOString(),
        abonament,
      }).catch(() => undefined);
      return;
    }

    default:
      // Restul evenimentelor nu ne privesc. Răspundem 200 ca Stripe să nu
      // le retrimită.
      return;
  }
}

/**
 * Datele campaniei, din factura reînnoirii.
 *
 * Stripe a mutat locul lor între versiuni de API, iar versiunea e aleasă în
 * contul asociației, nu aici: în cele noi stau sub `parent
 * .subscription_details`, în cele mai vechi direct sub `subscription_details`,
 * iar unele le aduc doar pe linia de factură. Le căutăm în toate trei, în
 * ordine.
 *
 * Dacă n-am face-o, o reînnoire s-ar înregistra tăcut cu destinația greșită
 * și fără numele donatorului — nu o eroare, ci o evidență stricată, care se
 * observă abia peste luni.
 */
function metadateleAbonamentului(
  factura: Stripe.Invoice,
): Record<string, string> {
  const f = factura as unknown as {
    parent?: {
      subscription_details?: {
        metadata?: Record<string, string> | null;
      } | null;
    } | null;
    subscription_details?: { metadata?: Record<string, string> | null } | null;
    lines?: { data?: Array<{ metadata?: Record<string, string> | null }> };
  };
  return (
    f.parent?.subscription_details?.metadata ??
    f.subscription_details?.metadata ??
    f.lines?.data?.[0]?.metadata ??
    {}
  );
}

/**
 * Ce se întâmplă după ce banii au intrat.
 *
 * `marcheazaPlatita` întoarce un rând **doar prima dată**, pentru că schimbă
 * starea; la o a doua livrare a aceluiași eveniment întoarce `null`. De aceea
 * nimic de aici nu se poate întâmpla de două ori: nici mulțumirea, nici
 * urcarea pe listă.
 *
 * Mulțumirea nu oprește nimic dacă pică. Banii au intrat și sunt înregistrați;
 * un e-mail netrimis e supărător, dar a cere procesatorului să retrimită tot
 * evenimentul pentru atât ar risca o dublă înregistrare.
 */
async function dupaIncasare(
  rand: DonatieIncasata | null,
  reinnoire = false,
): Promise<void> {
  if (!rand?.email) return;

  await trimiteMultumirea({
    email: rand.email,
    prenume: rand.prenume,
    nume: rand.nume,
    sumaBani: Number(rand.suma_bani),
    moneda: rand.moneda,
    frecventa: rand.frecventa,
    destinatie: rand.destinatie,
    reinnoire,
  }).catch(() => undefined);

  // Pe lista de buletin ajunge doar cine a bifat el acordul.
  if (rand.acord_buletin) {
    await laBuletin(rand.email).catch(() => undefined);
  }
}

/**
 * Abonamentul de pe o factură.
 *
 * Ca și metadatele, Stripe l-a mutat între versiuni de API: în cele noi stă
 * sub `parent.subscription_details.subscription`, în cele vechi direct în
 * `subscription`. Versiunea e aleasă în contul asociației, nu aici, deci se
 * citesc amândouă.
 */
function idAbonamentului(factura: Stripe.Invoice): string | null {
  const f = factura as unknown as {
    parent?: {
      subscription_details?: { subscription?: string | { id: string } };
    };
    subscription?: string | { id: string } | null;
  };
  const brut = f.parent?.subscription_details?.subscription ?? f.subscription;
  if (!brut) return null;
  return typeof brut === "string" ? brut : brut.id;
}
