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

/**
 * Cheia de probă lucrează numai pe rândurile ei.
 *
 * `RUTE_PROBA` deschide rutele de fundraising ca să poată fi încercate pe
 * site-ul adevărat, dar nimic nu oprea cheia să uite datele unui donator
 * adevărat, să-i confirme transferul (cu mulțumirea plecată la adresa de
 * probă, o singură dată) sau să-i respingă campania — auditul din 11
 * noiembrie 2026 le-a rulat pe toate. Fiecare rută de mai jos întreabă
 * întâi aici: într-o cerere de probă, rândul trebuie să poarte adresa de
 * probă. O cerere obișnuită trece neatinsă.
 *
 * `tabel` vine numai din cod, niciodată din formular.
 */
export async function probaAreVoie(
  tabel: "donatii" | "cereri" | "firme" | "campanii_aniversare" | "contracte" | "email",
  cheie: string,
): Promise<boolean> {
  if (!(await esteProba())) return true;
  const proba = adresaDeProba();
  if (!proba) return false;
  if (tabel === "email") return cheie.trim().toLowerCase() === proba.toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(cheie)) return false;
  const { intreaba } = await import("./baza");
  const sql =
    tabel === "contracte"
      ? "SELECT f.email FROM contracte c JOIN firme f ON f.id = c.firma_id WHERE c.id = $1"
      : `SELECT email FROM ${tabel} WHERE id = $1`;
  const r = await intreaba<{ email: string | null }>(sql, [cheie]).catch(() => []);
  return r.length > 0 && (r[0].email ?? "").toLowerCase() === proba.toLowerCase();
}
