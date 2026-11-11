import { headers } from "next/headers";
import { mediu } from "./mediu";
import { ANTET_PROBA, cheieProbaValida } from "./admin";

/**
 * E cererea asta o probă automată, pe site-ul adevărat?
 *
 * Cu intrarea de probă (vezi `lib/admin.ts`) se pot încerca și formularele
 * publice cap-coadă: contact, voluntar, transfer anunțat. Fără apărarea de
 * aici, fiecare probă ar ajunge în căsuța asociației și a fundraiserului și
 * pe telefoanele lor. Așa că o cerere de probă:
 *
 * - trimite **toate** e-mailurile la `PROBA_EMAIL`, oricui ar fi fost adresate
 *   (`lib/email/trimite.ts`) — niciun om adevărat nu primește nimic;
 * - nu trimite notificări pe telefon;
 * - nu pune adresa în MailerLite.
 *
 * Fără `PROBA_EMAIL` setat, o probă nu trimite niciun e-mail.
 * În afara unei cereri (o treabă în fundal), răspunsul e „nu”.
 */
export async function esteProba(): Promise<boolean> {
  try {
    return cheieProbaValida((await headers()).get(ANTET_PROBA));
  } catch {
    return false;
  }
}

export function adresaDeProba(): string | null {
  const a = mediu("PROBA_EMAIL");
  return a && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a) ? a : null;
}
