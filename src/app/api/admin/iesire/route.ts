import { raspuns, trimiteLa } from "@/lib/api";
import { COOKIE_ADMIN } from "@/lib/admin";

/**
 * Ieșirea din panou.
 *
 * Parola panoului e una singură, pentru toți cei din asociație, iar cookie-ul
 * ține douăsprezece ore. Pe calculatorul din birou, sau pe un laptop
 * împrumutat, asta însemna că oricine se așeza după tine vedea donatorii,
 * sumele și adresele de e-mail. Până acum nu exista nicio cale de a încheia
 * sesiunea: se închidea browserul și se spera.
 *
 * **Numai POST.** Un `GET` ar putea fi declanșat de orice — o imagine cu
 * adresa asta pusă într-un e-mail, un link apăsat din greșeală, un
 * preîncărcător de browser — și omul ar fi dat afară din panou în mijlocul
 * treburilor. Cookie-ul e oricum `sameSite: strict`, deci un formular de pe
 * alt sit nu l-ar trimite; POST-ul ține la distanță și restul.
 */
export async function POST(cerere: Request) {
  const raspunsul = trimiteLa("/admin");
  /*
    Ștersul se face pe aceeași cale pe care a fost pus (`/`). Cu altă cale,
    browserul păstrează cookie-ul original și omul rămâne înăuntru, deși
    pagina îi arată formularul de intrare.
  */
  raspunsul.cookies.set(COOKIE_ADMIN, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return raspunsul;
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
