import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { raspuns } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import {
  evenimentNou,
  marcheazaPlatita,
  scrieInitiata,
} from "@/lib/plati/donatii";
import { citesteEveniment } from "@/lib/plati/stripe";
import { laBuletin } from "@/lib/buletin";

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
      await poateLaBuletin(rand);
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

      const date = (factura.parent as { subscription_details?: { metadata?: Record<string, string> } } | null)
        ?.subscription_details?.metadata ?? {};

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
      });
      await marcheazaPlatita(
        "stripe",
        factura.id ?? `factura-${eveniment.id}`,
        factura.amount_paid,
      );
      return;
    }

    default:
      // Restul evenimentelor nu ne privesc. Răspundem 200 ca Stripe să nu
      // le retrimită.
      return;
  }
}

/** Donatorul ajunge pe lista de buletin doar dacă a bifat el acordul. */
async function poateLaBuletin(
  rand: { email: string | null; acord_buletin: boolean } | null,
) {
  if (!rand?.email || !rand.acord_buletin) return;
  await laBuletin(rand.email).catch(() => undefined);
}
