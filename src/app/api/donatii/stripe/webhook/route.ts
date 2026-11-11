import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { octetiCuLimita, raspuns } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import {
  evenimentNou,
  marcheazaRambursata,
  marcheazaPlatita,
  scrieInitiata,
} from "@/lib/plati/donatii";
import { citesteEveniment, referinteleIncasarii } from "@/lib/plati/stripe";
import { dupaIncasare, inregistreazaSesiuneaStripe } from "@/lib/plati/confirmare";
import { trimiteVesteaReinnoirii } from "@/lib/email/reinnoire";
import {
  anuntaPlataEsuata,
  trimitePlataEsuata,
} from "@/lib/email/plata-esuata";
import {
  rezolvaPlatileEsuate,
  scriePlataEsuata,
} from "@/lib/plati/esuate";

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

  // Brut, ca semnătura să se potrivească, dar cu limită: un eveniment Stripe
  // are câțiva kiloocteți, nu megaocteți.
  const octeti = await octetiCuLimita(cerere, 512 * 1024).catch(() => null);
  if (!octeti) return raspuns("Cerere prea mare.", 413);
  const corp = octeti.toString("utf8");

  let eveniment: Stripe.Event;
  try {
    eveniment = citesteEveniment(corp, semnatura);
  } catch (e) {
    // Semnătură greșită înseamnă fie o cheie nepotrivită, fie cineva care
    // încearcă să inventeze donații. Oricum, nu scriem nimic — dar spunem în
    // jurnal: un secret lipit cu un spațiu la capăt respingea toate plățile.
    console.error(`[stripe] semnătură invalidă la webhook: ${(e as Error).message}`);
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
    case "checkout.session.completed":
    // Plățile cu confirmare întârziată (transfer SEPA, unele portofele) vin
    // „plătite” abia aici; cardurile, cu 3D Secure cu tot, vin direct mai sus.
    case "checkout.session.async_payment_succeeded": {
      const sesiune = eveniment.data.object as Stripe.Checkout.Session;
      await inregistreazaSesiuneaStripe(sesiune);
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
      /*
        Plata a trecut, deci eșecurile abonamentului se închid.

        Fie omul și-a schimbat cardul, fie a trecut o reîncercare a lui
        Stripe. Oricum, nu mai e nimeni de sunat — iar o listă de telefoane
        în care jumătate din rânduri sunt rezolvate nu se mai deschide.
      */
      const abonamentPlatit = idAbonamentului(factura);
      if (abonamentPlatit) {
        await rezolvaPlatileEsuate(abonamentPlatit).catch(() => undefined);
      }
      await dupaIncasare(randReinnoire, true);
      return;
    }

    /*
      Plata lunară n-a trecut.

      Cea mai tăcută pierdere de bani dintr-un ONG cu donații recurente: un
      card expiră, plata cade, Stripe mai încearcă de câteva ori și apoi
      oprește abonamentul. Donatorul crede că donează în continuare;
      asociația află peste luni, din raport, că „a scăzut ce vine lunar".

      Nu se scrie nimic în evidența donațiilor: banii ăștia n-au intrat.
      Rândul din `plati_esuate` e o listă de telefoane, nu o donație.
    */
    case "invoice.payment_failed": {
      const factura = eveniment.data.object as Stripe.Invoice;
      const date = metadateleAbonamentului(factura);
      const abonament = idAbonamentului(factura);
      const client =
        typeof factura.customer === "string"
          ? factura.customer
          : (factura.customer?.id ?? null);
      const rand = factura.lines?.data?.[0];
      const suma = factura.amount_due ?? rand?.amount ?? 0;
      const moneda = (factura.currency ?? "ron").toUpperCase();

      const intaiaOara = await scriePlataEsuata({
        factura: factura.id ?? `factura-${eveniment.id}`,
        abonament,
        client,
        email: factura.customer_email ?? null,
        prenume: date.prenume || null,
        sumaBani: suma,
        moneda,
        destinatie: date.destinatie || null,
        motiv: motivul(factura),
      });

      /*
        Mesajul pleacă o singură dată pe factură, la prima cădere. Stripe
        reîncearcă de câteva ori; patru mesaje despre același card nu se
        citesc, al treilea se marchează ca spam — și pierdem și donatorul,
        și adresa.
      */
      if (intaiaOara) {
        const pentru = {
          email: factura.customer_email ?? "",
          prenume: date.prenume || null,
          sumaBani: suma,
          moneda,
          destinatie: date.destinatie || "oriunde",
          client,
          motiv: motivul(factura),
        };
        if (pentru.email) {
          await trimitePlataEsuata(pentru).catch(() => undefined);
        }
        await anuntaPlataEsuata(pentru).catch(() => undefined);
      }
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

    /*
      Rambursarea, făcută din contul Stripe. Evenimentul trebuie bifat acolo,
      la destinația webhook-ului (`charge.refunded`); fără el, nimic din ce e
      mai jos nu rulează. Dacă donația nu se găsește, se scrie în jurnal: o
      rambursare care nu scade nimic trebuie să se vadă undeva.
    */
    case "charge.refunded": {
      const incasare = eveniment.data.object as Stripe.Charge;
      const referinte = await referinteleIncasarii(
        incasare as unknown as Parameters<typeof referinteleIncasarii>[0],
      );
      const ramas = Math.max(0, incasare.amount - incasare.amount_refunded);
      const cate = await marcheazaRambursata("stripe", referinte, ramas);
      if (cate === 0) {
        console.warn(
          `[stripe] rambursarea ${incasare.id} n-a găsit nicio donație (${referinte.join(", ") || "fără referințe"})`,
        );
      }
      return;
    }

    default:
      // Restul evenimentelor nu ne privesc. Răspundem 200 ca Stripe să nu
      // le retrimită.
      return;
  }
}

/**
 * Ce a spus banca, dacă a spus ceva de înțeles.
 *
 * Stripe pune motivul în `last_finalization_error` sau pe plata atașată, în
 * câmpuri care s-au mutat între versiuni de API. Îl căutăm unde e, și dacă
 * nu-l găsim nu inventăm nimic: mesajul merge și fără el.
 */
function motivul(factura: Stripe.Invoice): string | null {
  const f = factura as unknown as {
    last_finalization_error?: { message?: string };
    charge?: { failure_message?: string } | string;
    payment_intent?: { last_payment_error?: { message?: string } } | string;
  };
  const dinFinalizare = f.last_finalization_error?.message;
  const dinPlata =
    typeof f.charge === "object" ? f.charge?.failure_message : undefined;
  const dinIntentie =
    typeof f.payment_intent === "object"
      ? f.payment_intent?.last_payment_error?.message
      : undefined;
  const gasit = dinFinalizare ?? dinPlata ?? dinIntentie;
  return gasit ? gasit.slice(0, 300) : null;
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
