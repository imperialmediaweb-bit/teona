import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Intrarea în zona de verificare a campaniilor.
 *
 * O singură parolă, ținută în `PAROLA_ADMIN`, pentru omul din asociație care
 * se uită peste campanii. Nu e un sistem de conturi și nici nu pretinde să
 * fie: pentru o listă pe care o verifică una-două persoane, un sistem de
 * utilizatori ar fi mai mult de întreținut decât de câștigat.
 *
 * Parola nu umblă niciodată prin adresă — ar ajunge în istoricul browserului
 * și în jurnalele serverului. Se trimite prin POST, iar ce rămâne în browser
 * e un cookie `httpOnly` cu o semnătură, nu parola.
 */

export const COOKIE_ADMIN = "teona_verificare";

function cheie(): string | null {
  const parola = process.env.PAROLA_ADMIN;
  return parola && parola.length >= 12 ? parola : null;
}

/** Semnătura pusă în cookie. Schimbarea parolei invalidează sesiunile vechi. */
function semnatura(parola: string): string {
  return createHmac("sha256", parola)
    .update("verificare-campanii")
    .digest("hex");
}

/** Comparație în timp constant: altfel durata răspunsului trădează parola. */
export function parolaCorecta(incercare: string): boolean {
  const parola = cheie();
  if (!parola) return false;
  const a = Buffer.from(semnatura(incercare));
  const b = Buffer.from(semnatura(parola));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function valoareaCookieului(): string | null {
  const parola = cheie();
  return parola ? semnatura(parola) : null;
}

export function areParolaConfigurata(): boolean {
  return cheie() !== null;
}

export async function esteAutentificat(): Promise<boolean> {
  const asteptat = valoareaCookieului();
  if (!asteptat) return false;
  const gasit = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!gasit || gasit.length !== asteptat.length) return false;
  return timingSafeEqual(Buffer.from(gasit), Buffer.from(asteptat));
}
