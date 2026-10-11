import { cookies } from "next/headers";
import { COOKIE_CONT, VIATA_SESIUNE_S, cititSesiunea, semneaza } from "./cont";

/**
 * Cookie-ul de sesiune al donatorului.
 *
 * Separat de `cont.ts` fiindcă `next/headers` nu există în afara Next, iar
 * partea care chiar poate greși — verificarea semnăturii — trebuie să poată
 * fi pusă la probă fără server. Aici rămâne doar citit și scris.
 */

export async function deschideSesiunea(email: string): Promise<void> {
  const borcan = await cookies();
  borcan.set(COOKIE_CONT, `${email}|${semneaza(email)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // `lax`, nu `strict`: omul ajunge aici dintr-un link de e-mail, iar
    // `strict` n-ar trimite cookie-ul la prima navigare venită din afară.
    sameSite: "lax",
    path: "/",
    maxAge: VIATA_SESIUNE_S,
  });
}

export async function inchideSesiunea(): Promise<void> {
  (await cookies()).delete(COOKIE_CONT);
}

/** Adresa donatorului conectat, sau `null`. Verificată, nu doar citită. */
export async function donatorulConectat(): Promise<string | null> {
  return cititSesiunea((await cookies()).get(COOKIE_CONT)?.value);
}
