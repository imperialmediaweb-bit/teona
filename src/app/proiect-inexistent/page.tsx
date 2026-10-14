import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import Buton from "@/componente/Buton";

export const metadata: Metadata = {
  title: "Proiectul nu a fost găsit",
  robots: { index: false, follow: true },
};

/**
 * Pagina arătată când adresa unui proiect nu există.
 *
 * **De ce o pagină separată de `not-found.tsx`.** Adresa cerută rămâne în bara
 * browserului, deci omul vede exact ce a greșit, iar textul poate fi despre
 * proiecte: „Toate proiectele” e locul în care vrea să ajungă cineva care a
 * dat pe un link stricat de tabără, nu prima pagină.
 *
 * Nu se ajunge aici direct: `src/proxy.ts` rescrie către ea, cu codul 404, și
 * numai pentru adresele de proiect care nu există. De asta e și `noindex`.
 */
export default function ProiectInexistent() {
  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <p className="scris text-h2 text-miere-700">404</p>
        <h1 className="mt-3 text-h1 text-cerneala">
          Proiectul nu a fost găsit
        </h1>
        <p className="mt-5 text-amplu text-cerneala-moale">
          Adresa asta nu duce la niciun proiect al asociației. Poate linkul e
          scris greșit, sau e un link vechi care s-a schimbat. Toate taberele și
          campaniile sunt în lista de proiecte.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Buton href={RUTE.proiecte}>Toate proiectele</Buton>
          <Buton href={RUTE.acasa} varianta="contur">
            Mergi la Home
          </Buton>
        </div>
      </div>
    </section>
  );
}
