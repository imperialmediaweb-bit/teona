import { DESTINATII, type Frecventa } from "@/date/plati";

/**
 * Plata prin PayPal, în euro.
 *
 * PayPal nu suportă leul — nici ca monedă de plată, nici ca sold. Lista lor
 * oficială are 24 de monede; zlotul, coroana cehă și forintul sunt acolo,
 * leul nu. De aceea blocul PayPal de pe site e separat, scris în euro de la
 * cap la coadă, și nu face nicio conversie inventată: donatorul vede exact
 * suma care îi apare pe extras.
 *
 * Nu folosim SDK: API-ul REST e două cereri (jeton, apoi comandă), iar o
 * dependență în plus pentru atât n-ar plăti întreținerea.
 */

// `PAYPAL_API` numai pentru probe (un PayPal de mențiune, pe 127.0.0.1).
const BAZA = () =>
  process.env.PAYPAL_API ||
  (process.env.PAYPAL_MOD === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com");

export function arePayPal(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
}

/** Jetonul de acces. Durează ore; îl ținem minte cât e valabil. */
let jeton: { valoare: string; expiraLa: number } | null = null;

async function iaJeton(): Promise<string> {
  if (jeton && Date.now() < jeton.expiraLa - 60_000) return jeton.valoare;

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Cheile PayPal lipsesc");

  const raspuns = await fetch(`${BAZA()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!raspuns.ok) {
    const spus = await raspuns.text().catch(() => "");
    throw new Error(
      `PayPal: jeton refuzat (${raspuns.status}) ${spus.slice(0, 200)}`,
    );
  }

  const date = (await raspuns.json()) as {
    access_token: string;
    expires_in: number;
  };
  jeton = {
    valoare: date.access_token,
    expiraLa: Date.now() + date.expires_in * 1000,
  };
  return jeton.valoare;
}

export type CerereEuro = {
  euro: number;
  destinatie: string;
  /** Canalul din care a venit donatorul (`src/lib/atribuire.ts`). */
  canal?: string | null;
  adresaSite: string;
};

/** Deschide o comandă și întoarce adresa de aprobare. */
export async function deschideComanda(
  cerere: CerereEuro,
): Promise<{ id: string; adresa: string }> {
  const acces = await iaJeton();
  const raspuns = await fetch(`${BAZA()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${acces}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            // PayPal cere suma ca șir cu două zecimale, nu ca număr.
            value: cerere.euro.toFixed(2),
          },
          description: (
            DESTINATII[cerere.destinatie] ?? DESTINATII.oriunde
          ).slice(0, 127),
          /*
            Destinația și canalul, într-un singur câmp.

            PayPal ne întoarce la confirmare numai ce i-am dat noi aici; alt
            loc pentru date de-ale noastre nu există. De aceea stau amândouă
            în `custom_id`, despărțite de o bară — webhookul le desparte
            înapoi. Fără asta, orice donație prin PayPal ar rămâne fără canal.
          */
          custom_id: [cerere.destinatie, cerere.canal ?? ""]
            .join("|")
            .slice(0, 127),
        },
      ],
      application_context: {
        brand_name: "Asociația Teona Ariana Suceava",
        locale: "ro-RO",
        user_action: "PAY_NOW",
        return_url: `${cerere.adresaSite}/multumim?paypal=1`,
        cancel_url: `${cerere.adresaSite}/doneaza?anulat=1`,
      },
    }),
  });

  if (!raspuns.ok) {
    /*
      Și ce-a spus PayPal, nu doar codul.

      Un 422 de la ei poate însemna zece lucruri — contul nu poate primi
      euro, moneda nu e pornită, suma e prost scrisă —, iar fără motivul lor
      se caută pe ghicite. Corpul erorii conține coduri și un `debug_id`,
      niciodată chei; se taie oricum, ca să nu umple jurnalul.
    */
    const spus = await raspuns.text().catch(() => "");
    throw new Error(
      `PayPal: comandă refuzată (${raspuns.status}) ${spus.slice(0, 400)}`,
    );
  }

  const date = (await raspuns.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };
  const aprobare = date.links.find((l) => l.rel === "approve")?.href;
  if (!aprobare) throw new Error("PayPal n-a întors adresa de aprobare");
  return { id: date.id, adresa: aprobare };
}

/**
 * Verifică semnătura unui webhook PayPal.
 *
 * PayPal nu dă o semnătură pe care s-o putem verifica singuri, ca Stripe: se
 * întreabă serverul lor dacă antetele primite sunt bune. O cerere în plus la
 * fiecare eveniment, dar e singura verificare adevărată. Fără
 * `PAYPAL_WEBHOOK_ID` nu acceptăm nimic.
 */
export async function semnaturaEValida(
  antete: Headers,
  corp: string,
): Promise<boolean> {
  /*
    `PAYPAL_WEBHOOK_ID` poate conține mai multe ID-uri, despărțite prin
    virgulă.

    În perioada de tranziție există două webhookuri în PayPal: unul către
    adresa de previzualizare, cu care se testează, și unul către domeniul
    final, care prinde viață în ziua mutării. Fiecare are ID-ul lui, iar
    verificarea semnăturii se face per ID — cu unul singur configurat,
    jumătate din notificări ar fi respinse ca nesemnate.

    Se încearcă pe rând; prima potrivire oprește căutarea.
  */
  const idUri = (process.env.PAYPAL_WEBHOOK_ID ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (idUri.length === 0) return false;

  const necesare = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];
  if (necesare.some((a) => !antete.get(a))) return false;

  const acces = await iaJeton();
  const eveniment = JSON.parse(corp);

  for (const webhookId of idUri) {
    const raspuns = await fetch(
      `${BAZA()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acces}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: antete.get("paypal-auth-algo"),
          cert_url: antete.get("paypal-cert-url"),
          transmission_id: antete.get("paypal-transmission-id"),
          transmission_sig: antete.get("paypal-transmission-sig"),
          transmission_time: antete.get("paypal-transmission-time"),
          webhook_id: webhookId,
          webhook_event: eveniment,
        }),
      },
    );
    if (!raspuns.ok) continue;
    const date = (await raspuns.json()) as { verification_status?: string };
    if (date.verification_status === "SUCCESS") return true;
  }

  return false;
}

export type { Frecventa };

export type Incasare = {
  /** Identificatorul încasării (capture), aceeași referință ca în webhook. */
  id: string;
  bani: number;
  moneda: string;
  email: string | null;
  customId: string;
};

/**
 * Încasează o comandă aprobată de donator.
 *
 * Cu `intent: "CAPTURE"`, aprobarea omului pe pagina PayPal **nu ia banii**:
 * comanda stă „APPROVED” până o încasează vânzătorul, iar dacă n-o încasează
 * nimeni, expiră. Până în noiembrie 2026 site-ul nu făcea pasul ăsta, deci
 * nicio donație prin PayPal nu s-a încasat vreodată și nici webhook-ul
 * `PAYMENT.CAPTURE.COMPLETED` n-a avut de ce să vină.
 *
 * Se cheamă din pagina de mulțumire (PayPal adaugă `token=<comanda>` la
 * adresa de întoarcere) și din webhook-ul `CHECKOUT.ORDER.APPROVED`, pentru
 * omul care închide fila înainte să se încarce pagina. O comandă încasată deja
 * răspunde 422 `ORDER_ALREADY_CAPTURED`; atunci se citește încasarea din ea.
 */
export async function incaseazaComanda(comanda: string): Promise<Incasare | null> {
  if (!/^[A-Z0-9]{8,40}$/.test(comanda)) return null;
  const acces = await iaJeton();
  const antete = {
    Authorization: `Bearer ${acces}`,
    "Content-Type": "application/json",
  };
  let raspuns = await fetch(`${BAZA()}/v2/checkout/orders/${comanda}/capture`, {
    method: "POST",
    headers: { ...antete, "PayPal-Request-Id": `incasare-${comanda}` },
  });
  if (raspuns.status === 422) {
    raspuns = await fetch(`${BAZA()}/v2/checkout/orders/${comanda}`, { headers: antete });
  }
  if (!raspuns.ok) {
    const spus = await raspuns.text().catch(() => "");
    throw new Error(`PayPal: încasare refuzată (${raspuns.status}) ${spus.slice(0, 300)}`);
  }
  const date = (await raspuns.json()) as {
    status?: string;
    payer?: { email_address?: string };
    purchase_units?: Array<{
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          custom_id?: string;
          amount?: { value?: string; currency_code?: string };
        }>;
      };
    }>;
  };
  const unitate = date.purchase_units?.[0];
  const incasare = unitate?.payments?.captures?.find((c) => c.status === "COMPLETED");
  if (!incasare) return null;
  return {
    id: incasare.id,
    bani: Math.round(Number(incasare.amount?.value ?? 0) * 100),
    moneda: incasare.amount?.currency_code ?? "EUR",
    email: date.payer?.email_address ?? null,
    customId: incasare.custom_id ?? unitate?.custom_id ?? "",
  };
}
