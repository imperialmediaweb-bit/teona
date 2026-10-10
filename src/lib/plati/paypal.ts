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

const BAZA = () =>
  process.env.PAYPAL_MOD === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

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
  if (!raspuns.ok) throw new Error(`PayPal: jeton refuzat (${raspuns.status})`);

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
          custom_id: cerere.destinatie,
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
    throw new Error(`PayPal: comandă refuzată (${raspuns.status})`);
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
