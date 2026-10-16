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
  /** Canalul din care a venit donatorul, dus mai departe în metadate. */
  canal?: string | null;
  sursa?: string | null;
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
  const numeProdus = DESTINATII[cerere.destinatie] ?? DESTINATII.oriunde;

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
    /*
      Canalul merge în metadatele abonamentului, nu doar ale primei plăți:
      altfel a doua lună a unui donator adus de o reclamă s-ar înregistra fără
      canal, iar „cât au adus reclamele" ar arăta numai prima lună din fiecare
      donație lunară — adică exact pe dos de cum stau lucrurile.
    */
    canal: cerere.canal ?? "",
    sursa: cerere.sursa ?? "",
  };
}

/** Verifică semnătura webhookului. Fără secret, nu acceptăm nimic. */
export function citesteEveniment(
  corp: string,
  semnatura: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET lipsește");
  return ia().webhooks.constructEvent(corp, semnatura, secret);
}

/**
 * Donațiile lunare active ale unui om, luate direct de la Stripe.
 *
 * **De ce de la Stripe și nu din baza noastră.** Baza știe ce s-a plătit, nu
 * ce e încă pornit: un abonament oprit acum trei luni lasă în urmă aceleași
 * rânduri ca unul care se ia și mâine. Adevărul despre ce se mai ia de pe
 * card e la procesator, iar un panou care spune „ai o donație lunară" despre
 * una oprită e mai rău decât niciun panou.
 *
 * Căutarea se face pe adresa de e-mail a clientului. Adresa vine din
 * sesiunea semnată a donatorului, nu dintr-un formular, deci nu se poate
 * cere lista altcuiva.
 */
export type AbonamentDonator = {
  id: string;
  sumaBani: number;
  moneda: string;
  destinatie: string;
  /** Ziua următoarei plăți, ISO, sau `null` dacă Stripe n-o dă. */
  urmatoareaLa: string | null;
};

export async function abonamenteleLui(
  email: string,
): Promise<AbonamentDonator[]> {
  if (!areStripe()) return [];
  const stripe = ia();

  const clienti = await stripe.customers.list({ email, limit: 10 });
  const gasite: AbonamentDonator[] = [];

  for (const client of clienti.data) {
    const abonamente = await stripe.subscriptions.list({
      customer: client.id,
      status: "active",
      limit: 20,
    });
    for (const a of abonamente.data) {
      const rand = a.items.data[0];
      if (!rand) continue;
      /*
        `current_period_end` stă pe rândul abonamentului, nu pe abonament:
        din 2025 Stripe l-a mutat acolo, fiindcă un abonament poate avea
        rânduri cu perioade diferite. Citim ambele locuri, ca să mergem și cu
        versiuni mai vechi ale API-ului.
      */
      const sfarsit =
        rand.current_period_end ??
        (a as unknown as { current_period_end?: number }).current_period_end ??
        null;
      gasite.push({
        id: a.id,
        sumaBani: rand.price.unit_amount ?? 0,
        moneda: (rand.price.currency ?? "ron").toUpperCase(),
        destinatie: a.metadata?.destinatie ?? "oriunde",
        urmatoareaLa: sfarsit ? new Date(sfarsit * 1000).toISOString() : null,
      });
    }
  }
  return gasite;
}

/**
 * Oprește o donație lunară.
 *
 * **Verifică întâi că e a lui.** Identificatorul vine dintr-un formular, deci
 * poate fi schimbat în browser; fără verificarea asta, cine are un cont ar
 * putea opri donația altcuiva scriind alt `sub_…`. Se compară cu lista lui,
 * cerută din nou de la Stripe pe adresa din sesiune.
 *
 * Se oprește pe loc, nu la sfârșitul lunii plătite. Nu e un abonament la
 * ceva de care omul se mai folosește până atunci: a cerut să nu mai dea bani,
 * deci de la apăsarea butonului nu se mai ia nimic. Luna deja plătită rămâne
 * donată — asta scrie și pe buton.
 */
export async function opresteAbonamentul(
  email: string,
  id: string,
): Promise<boolean> {
  if (!areStripe()) return false;
  const aleLui = await abonamenteleLui(email);
  if (!aleLui.some((a) => a.id === id)) return false;
  await ia().subscriptions.cancel(id);
  return true;
}

/**
 * Oprește un abonament știut deja ca fiind al cui trebuie.
 *
 * Fără verificarea de proprietar din `opresteAbonamentul`, pentru că aici
 * dovada e alta și e deja făcută: semnătura din linkul trimis pe e-mail
 * (`oprire-lunara.ts`), care acoperă chiar identificatorul ăsta. A cere și
 * adresa ar însemna să-i cerem omului să intre în cont pentru un gest pe care
 * asociația îl face la un telefon, fără să întrebe de ce.
 *
 * Nu se cheamă niciodată cu un identificator venit direct dintr-un formular.
 */
export async function opresteAbonamentulDupaId(id: string): Promise<boolean> {
  if (!areStripe()) return false;
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) return false;
  await ia().subscriptions.cancel(id);
  return true;
}
