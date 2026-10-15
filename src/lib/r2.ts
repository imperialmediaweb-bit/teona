import "server-only";
import { createHash, createHmac } from "node:crypto";

/**
 * Depozitul privat de fișiere, pe Cloudflare R2.
 *
 * **De ce aici și nu în Cloudinary.** Cloudinary e o rețea de livrare a
 * imaginilor: treaba ei e să servească poze lumii întregi, repede. Aici ajung
 * fotografii ale Formularului 230 — nume, adresă, CNP și o semnătură. Astea
 * n-au ce căuta pe o rețea publică de livrare, oricât de greu ar fi de ghicit
 * adresa. R2 ține fișierele private, iar fiecare vizionare din panou cere o
 * legătură semnată, valabilă câteva minute.
 *
 * **De ce fără SDK.** `@aws-sdk/client-s3` aduce câteva zeci de megaocteți
 * pentru patru cereri HTTP. Semnătura AWS v4 e o funcție de o pagină, iar
 * depozitul ăsta nu face nimic exotic: pune un fișier, dă o legătură, șterge.
 *
 * **Cheile stau în Railway**, niciodată în depozit:
 *   R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY · R2_BUCKET
 *
 * **R2_ENDPOINT, când depozitul e într-o jurisdicție.** Un depozit creat în
 * jurisdicția Uniunii Europene — alegerea potrivită pentru fișiere cu CNP pe
 * ele — nu răspunde la adresa obișnuită, ci la `<cont>.eu.r2.cloudflarestorage.com`,
 * și numai la ea. Fără variabila asta, totul ar fi semnat corect și trimis la
 * adresa greșită, iar răspunsul n-ar spune de ce.
 */

const REGIUNE = "auto";
const SERVICIU = "s3";

function config() {
  const cont = process.env.R2_ACCOUNT_ID;
  const cheie = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const galeata = process.env.R2_BUCKET;
  if (!cont || !cheie || !secret || !galeata) return null;
  const adresa = process.env.R2_ENDPOINT?.trim();
  return {
    cheie,
    secret,
    galeata,
    gazda: adresa
      ? adresa.replace(/^https?:\/\//, "").replace(/\/+$/, "")
      : `${cont}.r2.cloudflarestorage.com`,
  };
}

export function areR2(): boolean {
  return config() !== null;
}

const sha256 = (date: string | Uint8Array) =>
  createHash("sha256").update(date).digest("hex");

const hmac = (cheie: Buffer | string, date: string) =>
  createHmac("sha256", cheie).update(date).digest();

/** Cheia de semnare, derivată pe zi, regiune și serviciu, ca la AWS. */
function cheieDeSemnare(
  secret: string,
  zi: string,
  regiune = REGIUNE,
  serviciu = SERVICIU,
) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, zi), regiune), serviciu), "aws4_request");
}

/**
 * Semnătura AWS v4 a unei cereri.
 *
 * Scoasă afară ca să poată fi verificată: fără chei de R2 la îndemână, singura
 * cale de a ști că semnătura e bună înainte de a o lega de un depozit adevărat
 * e s-o calculezi pe exemplele publicate de AWS și să compari. Asta face
 * `scripts/qa/semnatura-r2.mjs`.
 *
 * O semnătură greșită nu dă un rezultat parțial: nu merge nimic, iar R2
 * răspunde „SignatureDoesNotMatch" fără să spună ce lipsește.
 */
export function semnaturaV4(c: {
  metoda: string;
  cale: string;
  interogare: string;
  antete: Record<string, string>;
  hashCorp: string;
  lung: string;
  zi: string;
  regiune: string;
  serviciu: string;
  secret: string;
}): { semnatura: string; semnate: string; domeniu: string } {
  const nume = Object.keys(c.antete).sort();
  const canonic = [
    c.metoda,
    c.cale,
    c.interogare,
    nume.map((n) => `${n}:${c.antete[n]}\n`).join(""),
    nume.join(";"),
    c.hashCorp,
  ].join("\n");

  const domeniu = `${c.zi}/${c.regiune}/${c.serviciu}/aws4_request`;
  const deSemnat = ["AWS4-HMAC-SHA256", c.lung, domeniu, sha256(canonic)].join(
    "\n",
  );

  return {
    semnatura: createHmac(
      "sha256",
      cheieDeSemnare(c.secret, c.zi, c.regiune, c.serviciu),
    )
      .update(deSemnat)
      .digest("hex"),
    semnate: nume.join(";"),
    domeniu,
  };
}

/** `2026-10-15T03:12:00Z` → `20261015T031200Z` și `20261015`. */
function momente() {
  const acum = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  return { lung: acum, zi: acum.slice(0, 8) };
}

/**
 * Fiecare bucată din cale se codifică separat.
 *
 * Numele fișierelor conțin diacritice și spații, iar `/` dintre bucăți trebuie
 * să rămână `/` — altfel semnătura se calculează pe altă cale decât cea
 * cerută, iar R2 răspunde „SignatureDoesNotMatch", fără să spună de ce.
 */
function caleCodificata(cheie: string): string {
  return cheie
    .split("/")
    .map((bucata) => encodeURIComponent(bucata).replace(/[!'()*]/g, (c) =>
      `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    ))
    .join("/");
}

/** Urcă un fișier. Întoarce cheia lui, sau `null` dacă n-a mers. */
export async function urcaInR2(
  cheie: string,
  octeti: Uint8Array,
  tip: string,
): Promise<string | null> {
  const c = config();
  if (!c) return null;

  const { lung, zi } = momente();
  const cale = `/${c.galeata}/${caleCodificata(cheie)}`;
  const hash = sha256(octeti);

  const antete: Record<string, string> = {
    host: c.gazda,
    "content-type": tip,
    "x-amz-content-sha256": hash,
    "x-amz-date": lung,
  };

  const { semnatura, semnate, domeniu } = semnaturaV4({
    metoda: "PUT",
    cale,
    interogare: "",
    antete,
    hashCorp: hash,
    lung,
    zi,
    regiune: REGIUNE,
    serviciu: SERVICIU,
    secret: c.secret,
  });

  try {
    const raspuns = await fetch(`https://${c.gazda}${cale}`, {
      method: "PUT",
      headers: {
        ...antete,
        Authorization: `AWS4-HMAC-SHA256 Credential=${c.cheie}/${domeniu}, SignedHeaders=${semnate}, Signature=${semnatura}`,
      },
      body: new Uint8Array(octeti),
      signal: AbortSignal.timeout(20_000),
    });
    if (!raspuns.ok) {
      console.warn(`[r2] ${raspuns.status} la urcarea ${cheie}`);
      return null;
    }
    return cheie;
  } catch (eroare) {
    console.warn(
      `[r2] urcarea ${cheie} a căzut:`,
      eroare instanceof Error ? eroare.message : eroare,
    );
    return null;
  }
}

/**
 * O legătură care deschide fișierul, valabilă câteva minute.
 *
 * Semnată în adresă, nu în antete: așa poate fi pusă într-un `<a href>` sau
 * într-un `<img src>` din panou, fără ca fișierul să devină public. După ce
 * expiră, aceeași adresă nu mai deschide nimic.
 */
export function legaturaSemnata(cheie: string, secunde = 600): string | null {
  const c = config();
  if (!c) return null;

  const { lung, zi } = momente();
  const cale = `/${c.galeata}/${caleCodificata(cheie)}`;
  const domeniu = `${zi}/${REGIUNE}/${SERVICIU}/aws4_request`;

  const parametri = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${c.cheie}/${domeniu}`,
    "X-Amz-Date": lung,
    "X-Amz-Expires": String(secunde),
    "X-Amz-SignedHeaders": "host",
  });
  // Ordinea contează la semnătură, iar `URLSearchParams` nu sortează singur.
  parametri.sort();

  const { semnatura } = semnaturaV4({
    metoda: "GET",
    cale,
    interogare: parametri.toString(),
    antete: { host: c.gazda },
    hashCorp: "UNSIGNED-PAYLOAD",
    lung,
    zi,
    regiune: REGIUNE,
    serviciu: SERVICIU,
    secret: c.secret,
  });

  return `https://${c.gazda}${cale}?${parametri.toString()}&X-Amz-Signature=${semnatura}`;
}

/** Șterge un fișier. `true` dacă nu mai e acolo. */
export async function stergeDinR2(cheie: string): Promise<boolean> {
  const c = config();
  if (!c) return false;

  const { lung, zi } = momente();
  const cale = `/${c.galeata}/${caleCodificata(cheie)}`;
  const gol = sha256("");

  const antete: Record<string, string> = {
    host: c.gazda,
    "x-amz-content-sha256": gol,
    "x-amz-date": lung,
  };
  const { semnatura, semnate, domeniu } = semnaturaV4({
    metoda: "DELETE",
    cale,
    interogare: "",
    antete,
    hashCorp: gol,
    lung,
    zi,
    regiune: REGIUNE,
    serviciu: SERVICIU,
    secret: c.secret,
  });

  try {
    const raspuns = await fetch(`https://${c.gazda}${cale}`, {
      method: "DELETE",
      headers: {
        ...antete,
        Authorization: `AWS4-HMAC-SHA256 Credential=${c.cheie}/${domeniu}, SignedHeaders=${semnate}, Signature=${semnatura}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
    return raspuns.ok || raspuns.status === 404;
  } catch {
    return false;
  }
}
