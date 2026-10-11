import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { intreaba } from "./baza";

/**
 * Contul donatorului: intrare fără parolă, prin link trimis pe e-mail.
 *
 * **De ce fără parolă.** Un donator intră de două-trei ori pe an. Ar uita
 * parola oricum, iar o bază de parole e o răspundere pe care o asociație
 * mică n-are cum s-o poarte: oamenii refolosesc parole, deci o scurgere de
 * aici le-ar deschide conturi pe alte site-uri. Adresa de e-mail o avem deja,
 * verificată — a plătit cu ea. Linkul trimis acolo dovedește exact atât cât
 * trebuie: că persoana are acces la cutia poștală cu care a donat.
 *
 * **Nu există înregistrare.** Nimeni nu-și face cont; contul *este* istoricul
 * donațiilor, iar cheia lui e adresa de e-mail. Cine n-a donat niciodată
 * n-are ce vedea, și nu primește niciun link.
 *
 * Ce apără codul ăsta, punct cu punct:
 *
 * - jetonul se păstrează ca amprentă SHA-256, nu în clar. Cine ar citi
 *   tabelul n-ar putea intra în niciun cont;
 * - merge **o singură dată** și expiră în 20 de minute. Un link uitat într-o
 *   cutie poștală veche nu e o cheie permanentă;
 * - răspunsul e identic fie că adresa există sau nu. Altfel formularul ar
 *   deveni un instrument de aflat cine a donat la o asociație de copii cu
 *   dizabilități — o listă pe care nu trebuie s-o poată face nimeni;
 * - sesiunea nu ține minte nimic despre om, doar adresa semnată. Nu există
 *   „cont" de furat.
 */

export const COOKIE_CONT = "teona_cont";

/** Cât trăiește linkul din e-mail. Destul să-l deschizi, prea puțin să-l uiți. */
const VIATA_JETON_MS = 20 * 60 * 1000;

/** Cât ține sesiunea după ce a intrat. O lună — nu sunt date de plată aici. */
export const VIATA_SESIUNE_S = 30 * 24 * 3600;

function amprenta(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

/**
 * Cheia cu care se semnează sesiunea.
 *
 * Fără ea, oricine și-ar putea scrie singur un cookie cu adresa altcuiva.
 * De aceea lipsa ei oprește funcția cu totul, în loc să treacă pe o valoare
 * implicită — o cheie implicită e aceeași pe toate instalările, deci publică.
 */
function cheieSesiune(): string | null {
  const cheie = process.env.SECRET_SESIUNE ?? process.env.PAROLA_ADMIN;
  return cheie && cheie.length >= 16 ? cheie : null;
}

export function areConturi(): boolean {
  return cheieSesiune() !== null;
}

export function semneaza(email: string): string {
  const cheie = cheieSesiune();
  if (!cheie) throw new Error("Lipsește cheia de sesiune.");
  return createHash("sha256").update(`${cheie}:cont:${email}`).digest("hex");
}

/**
 * Creează un jeton de intrare pentru o adresă.
 *
 * Întoarce jetonul **o singură dată**, ca să poată fi pus în e-mail. După
 * asta nu mai există nicăieri în formă citibilă.
 */
export async function ceareJeton(email: string): Promise<string> {
  const jeton = randomBytes(32).toString("base64url");
  await intreaba(
    `INSERT INTO jetoane_cont (amprenta, email, expira_la)
     VALUES ($1, $2, now() + make_interval(secs => $3))`,
    [amprenta(jeton), email, VIATA_JETON_MS / 1000],
  );
  return jeton;
}

/**
 * Consumă un jeton. Întoarce adresa dacă era bun, altfel `null`.
 *
 * `folosit_la IS NULL` în `WHERE`, nu într-o verificare separată: altfel două
 * clicuri în același timp — ceea ce fac clienții de e-mail care verifică
 * linkurile înainte să ți le arate — ar trece amândouă.
 */
export async function foloseșteJeton(jeton: string): Promise<string | null> {
  if (!jeton) return null;
  const randuri = await intreaba<{ email: string }>(
    `UPDATE jetoane_cont
        SET folosit_la = now()
      WHERE amprenta = $1
        AND folosit_la IS NULL
        AND expira_la > now()
      RETURNING email`,
    [amprenta(jeton)],
  );
  return randuri[0]?.email ?? null;
}

/** Scoate jetoanele vechi. Chemat din când în când, nu la fiecare cerere. */
export async function curataJetoane(): Promise<void> {
  await intreaba(
    "DELETE FROM jetoane_cont WHERE expira_la < now() - interval '7 days'",
  ).catch(() => undefined);
}

/**
 * Verifică valoarea unui cookie de sesiune și scoate adresa din ea.
 *
 * Stă aici, nu lângă `cookies()`, ca să poată fi pusă la probă fără Next.
 * Partea care greșește într-o verificare de sesiune nu e citirea
 * cookie-ului, e compararea semnăturii.
 */
export function cititSesiunea(brut: string | undefined): string | null {
  if (!brut || !areConturi()) return null;

  // Despicăm de la ultima apariție a separatorului: dacă vreodată ar intra
  // un „|” în adresă, semnătura rămâne întreagă și verificarea pică cinstit,
  // în loc să compare bucăți greșite.
  const taiere = brut.lastIndexOf("|");
  if (taiere <= 0) return null;
  const email = brut.slice(0, taiere);
  const semnatura = brut.slice(taiere + 1);

  let asteptat: string;
  try {
    asteptat = semneaza(email);
  } catch {
    return null;
  }
  if (semnatura.length !== asteptat.length) return null;
  // Comparație în timp constant: altfel durata răspunsului trădează semnătura.
  return timingSafeEqual(Buffer.from(semnatura), Buffer.from(asteptat))
    ? email
    : null;
}
