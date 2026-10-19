import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import {
  COOKIE_ADMIN,
  parolaCorecta,
  valoareaCookieului,
  valoareaCookieuluiUtilizator,
} from "@/lib/admin";
import { PAGINI, intraCuParola, poateVedea } from "@/lib/utilizatori";
import type { Rol } from "@/lib/utilizatori";

/**
 * Unde poate duce intrarea.
 *
 * Lista vine din `utilizatori.ts`, aceeași din care se hotărăște cine vede
 * ce. Înainte era scrisă aici a doua oară, și rămăsese în urmă: cinci pagini
 * adăugate de atunci — contracte, calendar, presă, QR, Facebook — nu erau în
 * ea, deci cine se autentifica de pe ele ajungea la tabloul de bord și
 * trebuia să navigheze înapoi, după ce tocmai își scrisese parola.
 *
 * Verificarea rămâne necesară: `unde` vine dintr-un câmp al formularului,
 * adică din afară. Fără ea, cineva ar putea trimite un formular cu `unde` pus
 * pe alt sit, iar răspunsul nostru ar deveni o trambulină de redirecționare,
 * semnată cu domeniul asociației.
 */
function unde(formular: FormData | null, rol: Rol): string {
  const cerut = formular ? String(formular.get("unde") ?? "") : "";
  const exista = PAGINI.some((p) => p.cale === cerut);
  // Cerută și permisă. Un om de fundraising care deschide Formularele 230 și
  // se autentifică ajunge pe tabloul de bord, nu pe un refuz.
  if (exista && poateVedea(rol, cerut)) return cerut;
  return "/admin";
}

/** Intrarea în panou. Parola vine prin POST, niciodată prin adresă. */
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
  const email = formular ? String(formular.get("email") ?? "").trim() : "";

  /*
    Cu e-mail: cont propriu. Fără: cheia asociației.

    Se încearcă una, nu amândouă. Dacă s-ar încerca și cheia după ce contul a
    picat, cine știe `PAROLA_ADMIN` ar intra scriind orice adresă, iar
    panoul ar spune că e omul acela.
  */
  const intrat = email
    ? await intraCuParola(email, parola).catch(() => null)
    : null;

  const valoare = email
    ? intrat
      ? valoareaCookieuluiUtilizator(intrat.id)
      : null
    : parolaCorecta(parola)
      ? valoareaCookieului()
      : null;

  const rol: Rol = intrat?.rol ?? "administrator";
  const pagina = unde(formular, rol);

  if (!valoare) {
    /*
      Același mesaj pentru orice nepotrivire — adresă necunoscută, cont oprit,
      parolă greșită. Altfel formularul de intrare devine un instrument de
      aflat cine lucrează la asociație.
    */
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
