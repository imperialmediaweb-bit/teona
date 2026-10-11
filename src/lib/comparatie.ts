import { timingSafeEqual } from "node:crypto";

/**
 * Compară două semnături în timp constant, fără să poată arunca.
 *
 * `timingSafeEqual` cere două zone de memorie de aceeași lungime și aruncă
 * `RangeError` dacă nu sunt. Verificarea evidentă — „au același număr de
 * caractere?” — nu e de ajuns: un șir de 64 de caractere cu diacritice sau
 * emoji dă mai mult de 64 de **octeți**, deci trece de verificare și cade la
 * comparație. Rezultatul era un 500 în loc de un „nu ești conectat”.
 *
 * Se compară lungimile **bufferelor**, după codare, și abia apoi conținutul.
 *
 * Ieșirea devreme pe lungimi diferite scurge doar lungimea semnăturii
 * așteptate, care e publică și fixă (64 de caractere hexazecimale). Ce
 * trebuie să rămână secret e conținutul, iar acolo comparația e în timp
 * constant.
 */
export function egale(primit: string, asteptat: string): boolean {
  const a = Buffer.from(primit, "utf8");
  const b = Buffer.from(asteptat, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
