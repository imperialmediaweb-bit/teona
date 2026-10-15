import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { RUTE } from "@/date/asociatie";
import Buton from "@/componente/Buton";

/**
 * Titlul spune ce anume n-a fost găsit.
 *
 * Nu e cosmetică: titlul e ce se vede în fila browserului și în istoric. Cine
 * a dat pe un link stricat de tabără și se întoarce peste o oră în istoric
 * trebuie să recunoască pagina.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ce?: string }>;
}): Promise<Metadata> {
  const { ce } = await searchParams;
  return {
    title: (FELURI[ce ?? ""] ?? FELURI.proiect).titlu,
    robots: { index: false, follow: true },
  };
}

/**
 * Pagina arătată când o adresă de proiect, noutate sau campanie nu există.
 *
 * **De ce o pagină separată de `not-found.tsx`.** Adresa cerută rămâne în bara
 * browserului, deci omul vede exact ce a greșit, iar textul poate trimite
 * unde trebuie: cineva care a dat pe un link stricat de tabără caută o tabără,
 * nu prima pagină.
 *
 * Nu se ajunge aici direct: `src/proxy.ts` cere pagina asta și îi întoarce
 * corpul cu codul 404, numai pentru adresele care nu există. De asta e și
 * `noindex`.
 */

const FELURI: Record<
  string,
  { titlu: string; text: string; eticheta: string; unde: string }
> = {
  proiect: {
    titlu: "Proiectul nu a fost găsit",
    text: "Adresa asta nu duce la niciun proiect al asociației. Poate linkul e scris greșit, sau e unul vechi care s-a schimbat. Toate taberele și activitățile sunt în lista de proiecte.",
    eticheta: "Toate proiectele",
    unde: RUTE.proiecte,
  },
  noutate: {
    titlu: "Noutatea nu a fost găsită",
    text: "Adresa asta nu duce la nicio noutate. Poate linkul e scris greșit, sau textul nu mai e publicat.",
    eticheta: "Toate noutățile",
    unde: RUTE.noutati,
  },
  campanie: {
    titlu: "Campania nu a fost găsită",
    text: "Adresa asta nu duce la nicio campanie. Poate s-a încheiat, sau linkul e scris greșit.",
    eticheta: "Toate campaniile",
    unde: RUTE.campanii,
  },
};

export default function PaginaInexistenta({
  searchParams,
}: {
  searchParams: Promise<{ ce?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ ce?: string }>;
}) {
  await connection();
  const { ce } = await searchParams;
  const fel = FELURI[ce ?? ""] ?? FELURI.proiect;

  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <p className="scris text-h2 text-miere-700">404</p>
        <h1 className="mt-3 text-h1 text-cerneala">{fel.titlu}</h1>
        <p className="mt-5 text-amplu text-cerneala-moale">{fel.text}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Buton href={fel.unde}>{fel.eticheta}</Buton>
          <Buton href={RUTE.acasa} varianta="contur">
            Mergi la Home
          </Buton>
        </div>
      </div>
    </section>
  );
}
