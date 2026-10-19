import Link from "next/link";
import Cadru from "./Cadru";
import { cineEsteConectat } from "@/lib/admin";
import { NUMELE_ROLULUI } from "@/lib/utilizatori";

/**
 * Pagina pe care n-o vede rolul tău.
 *
 * Nu e un ecran de eroare și nu arată ca unul. Omul n-a greșit nimic: a
 * apăsat un link vechi, a scris adresa din memorie sau i-a trimis-o un coleg.
 * Mesajul spune cu ce rol e înăuntru și pe cine să întrebe, nu „403
 * Forbidden" — care nu spune nimic și sună a vină.
 *
 * **De ce n-o ascundem de tot.** Varianta cu „pagina nu există" ar fi ținut
 * ascuns că mai e ceva acolo, dar ar fi pus omul să se întrebe dacă e stricat
 * site-ul. Paginile panoului nu sunt un secret unele față de altele — ce e
 * secret e ce scrie în ele, iar aici nu scrie nimic.
 */
export default async function FaraDrept({
  titlu,
  activ,
}: {
  titlu: string;
  activ: string;
}) {
  const cine = await cineEsteConectat();
  const rol = cine ? NUMELE_ROLULUI[cine.rol] : null;

  return (
    <Cadru titlu={titlu} activ={activ}>
      <div className="max-w-2xl">
        <p className="text-amplu text-cerneala-moale">
          Pagina asta nu e deschisă pentru rolul tău
          {rol ? <> — „{rol}”</> : null}.
        </p>
        <p className="mt-3 text-cerneala-moale">
          Dacă ai nevoie de ea ca să-ți faci treaba, cere-i unui administrator
          al asociației să-ți schimbe rolul.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie"
        >
          Înapoi la tabloul de bord
        </Link>
      </div>
    </Cadru>
  );
}
