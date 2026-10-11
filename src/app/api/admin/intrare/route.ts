import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { COOKIE_ADMIN, parolaCorecta, valoareaCookieului } from "@/lib/admin";

/**
 * Unde poate duce intrarea.
 *
 * Lista e închisă dinadins: `unde` vine dintr-un câmp al formularului, adică
 * din afară. Fără ea, cineva ar putea trimite un formular cu `unde` pus pe
 * alt sit, iar răspunsul nostru ar deveni o trambulină de redirecționare,
 * semnată cu domeniul asociației.
 */
const PAGINI = new Set(["/admin/campanii", "/admin/donatori", "/admin/email"]);

function unde(formular: FormData | null): string {
  const cerut = formular ? String(formular.get("unde") ?? "") : "";
  return PAGINI.has(cerut) ? cerut : "/admin/campanii";
}

/** Intrarea în zona de verificare. Parola vine prin POST, niciodată prin adresă. */
export async function POST(cerere: Request) {
  // Limită strânsă: o parolă se ghicește prin încercări repetate.
  const prea = limitaDeRata(cerere, {
    cheie: "admin-intrare",
    maxim: 5,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  const parola = formular ? String(formular.get("parola") ?? "") : "";
  const valoare = valoareaCookieului();

  // Omul se întoarce de unde a plecat. Înainte ajungea întotdeauna la
  // campanii, chiar dacă voia să scrie un e-mail — și trebuia să navigheze
  // înapoi, după ce tocmai își scrisese parola.
  const pagina = unde(formular);

  if (!valoare || !parolaCorecta(parola)) {
    return NextResponse.redirect(new URL(`${pagina}?gresit=1`, cerere.url), {
      status: 303,
    });
  }

  const raspunsul = NextResponse.redirect(new URL(pagina, cerere.url), {
    status: 303,
  });
  raspunsul.cookies.set(COOKIE_ADMIN, valoare, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    /*
      Calea e `/`, nu `/admin`.

      Paginile panoului stau sub `/admin`, dar rutele care fac efectiv treaba
      — publică o campanie, șterge un donator, creează o ciornă — stau sub
      `/api/admin`. Cu cookie-ul limitat la `/admin`, browserul nu-l trimitea
      la ele, iar fiecare apăsare de buton răspundea 403. Prins de proba pe
      site-ul viu, nu de citirea codului.

      Nu scade protecția: cookie-ul rămâne `httpOnly` (JavaScript nu-l poate
      citi) și `sameSite: strict` (nu pleacă la cereri venite de pe alt sit).
    */
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return raspunsul;
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
