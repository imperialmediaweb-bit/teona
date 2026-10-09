import Stripe from "stripe";
import { DESTINATII, type Frecventa, inBani } from "@/date/plati";

/**
 * Plata cu cardul, prin Stripe Checkout.
 *
 * Folosim pagina găzduită de Stripe, nu câmpuri de card pe site-ul nostru.
 * Trei motive, în ordinea greutății:
 *
 * 1. Niciun număr de card nu trece prin serverul asociației, deci site-ul nu
 *    intră în sfera PCI-DSS. Pentru o asociație fără echipă de securitate,
 *    asta nu e o comoditate, e singura variantă responsabilă.
 * 2. Apple Pay și Google Pay apar singure, pe telefoanele care le au, fără
 *    nicio linie de cod în plus.
 * 3. Donația lunară e un abonament Stripe adevărat, cu reînnoire și oprire,
 *    nu o plată repetată pe care ar trebui s-o programăm noi.
 *
 * Prețul e o redirecționare în afara site-ului. Merită.
 */

let client: Stripe | null = null;

export function areStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function ia(): Stripe {
  const cheie = process.env.STRIPE_SECRET_KEY;
  if (!cheie) throw new Error("STRIPE_SECRET_KEY lipsește");
  client ??= new Stripe(cheie);
  return client;
}

export type CerereDonatie = {
  lei: number;
  frecventa: Frecventa;
  destinatie: string;
  email: string;
  prenume: string | null;
  nume: string | null;
  telefon: string | null;
  acordBuletin: boolean;
  campanieSlug: string | null;
  adresaSite: string;
};

/**
 * Deschide o sesiune de plată și întoarce adresa unde trebuie trimis omul.
 *
 * `metadata` cară mai departe tot ce avem nevoie la confirmare. Nu ne bazăm
 * pe ce se întoarce în adresa paginii de mulțumire: aia o poate scrie
 * oricine. Adevărul vine din webhook, semnat de Stripe.
 */
export async function deschideSesiune(
  cerere: CerereDonatie,
): Promise<{ id: string; adresa: string }> {
  const stripe = ia();
  const bani = inBani(cerere.lei);
  const lunar = cerere.frecventa === "lunar";
  const numeProdus =
    DESTINATII[cerere.destinatie] ?? DESTINATII.oriunde;

  const sesiune = await stripe.checkout.sessions.create({
    mode: lunar ? "subscription" : "payment",
    customer_email: cerere.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "ron",
          unit_amount: bani,
          product_data: {
            name: numeProdus,
            description: lunar
              ? "Donație lunară către Asociația Teona Ariana Suceava"
              : "Donație către Asociația Teona Ariana Suceava",
          },
          ...(lunar ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    // Tot ce ne trebuie la confirmare călătorește cu sesiunea. La abonament
    // se pune și pe abonamentul însuși, altfel reînnoirile de peste o lună
    // n-ar mai ști pentru ce sunt.
    metadata: metadate(cerere),
    ...(lunar
      ? { subscription_data: { metadata: metadate(cerere) } }
      : { payment_intent_data: { metadata: metadate(cerere) } }),
    success_url: `${cerere.adresaSite}/multumim?sesiune={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cerere.adresaSite}/doneaza?anulat=1`,
    locale: "ro",
  });

  if (!sesiune.url) throw new Error("Stripe n-a întors o adresă de plată");
  return { id: sesiune.id, adresa: sesiune.url };
}

function metadate(cerere: CerereDonatie): Record<string, string> {
  return {
    destinatie: cerere.destinatie,
    frecventa: cerere.frecventa,
    prenume: cerere.prenume ?? "",
    nume: cerere.nume ?? "",
    telefon: cerere.telefon ?? "",
    acord_buletin: cerere.acordBuletin ? "da" : "nu",
    campanie: cerere.campanieSlug ?? "",
  };
}

/** Verifică semnătura webhookului. Fără secret, nu acceptăm nimic. */
export function citesteEveniment(corp: string, semnatura: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET lipsește");
  return ia().webhooks.constructEvent(corp, semnatura, secret);
}
