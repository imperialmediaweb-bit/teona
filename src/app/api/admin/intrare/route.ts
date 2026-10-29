import { limitaDeRata, raspuns, trimiteLa, formularCuLimita } from "@/lib/api";
import {
  COOKIE_ADMIN,
  COOKIE_DISPOZITIV,
  VIATA_DISPOZITIV_S,
  VIATA_LUNGA_S,
  cititDispozitivul,
  parolaCorecta,
  valoareaCookieului,
  valoareaCookieuluiUtilizator,
  valoareaDispozitivului,
} from "@/lib/admin";
import { cookies } from "next/headers";
import {
  PAGINI,
  intraCuCodRapid,
  intraCuParola,
  poateVedea,
} from "@/lib/utilizatori";
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

  const formular = await formularCuLimita(cerere, 8 * 1024);

  /*
    Intrarea cu codul rapid. Omul nu scrie e-mailul: îl știe cookie-ul de
    dispozitiv, pus la o intrare cu parola de pe același aparat. Fără el,
    codul nu duce nicăieri. Cinci coduri greșite la rând închid codul până la
    următoarea intrare cu parola, iar dispozitivul e uitat.
  */
  if (formular?.get("fel") === "cod") {
    const id = cititDispozitivul((await cookies()).get(COOKIE_DISPOZITIV)?.value);
    const pagina = unde(formular, "fundraising");
    if (!id) return trimiteLa(`${pagina}?gresit=1`);
    const rez = await intraCuCodRapid(
      id,
      String(formular.get("cod") ?? "").trim(),
    ).catch(() => "gresit" as const);
    if (rez === "gresit") return trimiteLa(`${pagina}?gresit=cod`);
    if (rez === "blocat") {
      const r = trimiteLa(`${pagina}?gresit=blocat`);
      r.cookies.set(COOKIE_DISPOZITIV, "", { path: "/", maxAge: 0 });
      // Un semn de un minut, ca pagina de intrare să spună de ce cere parola.
      r.cookies.set("teona_cod_blocat", "1", { ...optiuni(60), httpOnly: true });
      return r;
    }
    const valoare = valoareaCookieuluiUtilizator(rez.id, VIATA_LUNGA_S);
    const r = trimiteLa(unde(formular, rez.rol));
    if (valoare) r.cookies.set(COOKIE_ADMIN, valoare, optiuni(VIATA_LUNGA_S));
    return r;
  }

  const parola = formular ? String(formular.get("parola") ?? "") : "";
  const tineMinte = formular?.get("tine_minte") === "da";
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
      ? valoareaCookieuluiUtilizator(
          intrat.id,
          tineMinte ? VIATA_LUNGA_S : undefined,
        )
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
    return trimiteLa(`${pagina}?gresit=1`);
  }

  const raspunsul = trimiteLa(pagina);
  /*
    „Ține-mă minte”: sesiune de treizeci de zile și dispozitivul ținut minte
    pentru codul rapid. Numai pentru conturi; parola asociației rămâne la
    douăsprezece ore, oricum ar fi bifat.
  */
  if (intrat && tineMinte) {
    const d = valoareaDispozitivului(intrat.id);
    if (d) raspunsul.cookies.set(COOKIE_DISPOZITIV, d, optiuni(VIATA_DISPOZITIV_S));
  }
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
    maxAge: intrat && tineMinte ? VIATA_LUNGA_S : 12 * 60 * 60,
  });
  return raspunsul;
}

function optiuni(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
