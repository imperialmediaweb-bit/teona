import { createSign } from "node:crypto";

/**
 * Intrarea în API-ul Google Analytics, cu un cont de serviciu.
 *
 * **De ce scrisă de mână și nu cu biblioteca Google.** `google-auth-library` și
 * `@google-analytics/data` aduc împreună câteva zeci de pachete și vreo 20 MB
 * în imaginea de pe Railway, pentru ce încape în pagina asta: un JWT semnat cu
 * cheia contului de serviciu, schimbat pe un jeton de acces. Aceeași alegere
 * ca la semnătura AWS pentru R2, din aceleași motive.
 *
 * **Ce trebuie făcut o dată, în Google**, ca să meargă:
 *
 *   1. un proiect în Google Cloud, cu `analyticsdata.googleapis.com` pornit;
 *   2. un cont de serviciu în el, cu o cheie JSON;
 *   3. contul acela adăugat ca **Vizualizator** pe proprietatea GA4 a
 *      asociației — altfel API-ul răspunde 403 oricât de bună ar fi cheia;
 *   4. în Railway: `GA_PROPERTY_ID` (numărul proprietății, nu „G-…"),
 *      `GA_CLIENT_EMAIL` și `GA_PRIVATE_KEY` din fișierul JSON.
 *
 * Cheia privată din JSON are rândurile scrise ca `\n`. Le întoarcem la loc:
 * altfel semnătura iese dintr-o cheie pe care OpenSSL n-o poate citi, iar
 * eroarea nu seamănă deloc cu „cheia e scrisă greșit în variabile".
 */

const SCOP = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN =
  process.env.GA_TOKEN_API?.replace(/\/+$/, "") ??
  "https://oauth2.googleapis.com";

export function arePropietate(): boolean {
  return Boolean(
    process.env.GA_PROPERTY_ID &&
    process.env.GA_CLIENT_EMAIL &&
    process.env.GA_PRIVATE_KEY,
  );
}

export function proprietatea(): string {
  return (process.env.GA_PROPERTY_ID ?? "").replace(/[^0-9]/g, "");
}

function base64url(date: Buffer | string): string {
  return Buffer.from(date)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/*
  Jetonul ține o oră; îl păstrăm până mai are un minut de trăit.

  Fiecare deschidere a paginii ar fi altfel încă o cerere către Google, plus
  o semnătură RSA — pentru un panou deschis de două-trei persoane, risipă
  curată. Un minut de margine acoperă ceasurile care nu bat la fix.
*/
let pastrat: { jeton: string; pana: number } | null = null;

export async function jetonDeAcces(): Promise<string | null> {
  if (!arePropietate()) return null;
  if (pastrat && pastrat.pana > Date.now()) return pastrat.jeton;

  const email = process.env.GA_CLIENT_EMAIL as string;
  const cheie = (process.env.GA_PRIVATE_KEY as string).replace(/\\n/g, "\n");
  const acum = Math.floor(Date.now() / 1000);

  const antet = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corp = base64url(
    JSON.stringify({
      iss: email,
      scope: SCOP,
      aud: `${TOKEN}/token`,
      iat: acum,
      exp: acum + 3600,
    }),
  );

  let semnatura: string;
  try {
    const semnator = createSign("RSA-SHA256");
    semnator.update(`${antet}.${corp}`);
    semnatura = base64url(semnator.sign(cheie));
  } catch {
    // Cheia nu se poate citi — aproape sigur a fost lipită greșit în Railway.
    return null;
  }

  try {
    const raspuns = await fetch(`${TOKEN}/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${antet}.${corp}.${semnatura}`,
      }),
    });
    if (!raspuns.ok) return null;
    const date = (await raspuns.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!date.access_token) return null;
    pastrat = {
      jeton: date.access_token,
      pana: Date.now() + ((date.expires_in ?? 3600) - 60) * 1000,
    };
    return pastrat.jeton;
  } catch {
    return null;
  }
}
