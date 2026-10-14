import Link from "next/link";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";

/**
 * Cadrul comun al panoului.
 *
 * **De ce nu seamănă cu site-ul.** Aici se văd nume, adrese de e-mail și sume
 * de bani. Cu cât panoul seamănă mai puțin cu pagina publică, cu atât mai greu
 * e să confunzi una cu alta — să crezi că ești pe site când de fapt ești într-un
 * tabel cu donatori, sau să lași panoul deschis crezând că e pagina de pornire.
 * De aceea bara din stânga e închisă la culoare: se vede dintr-o privire, de la
 * doi metri, pe ce fel de pagină ești.
 *
 * **De ce în stânga și nu sus.** Varianta dinainte avea o linie de linkuri
 * deasupra, toate la fel de mari, fără grupare. Șapte pagini pe un rând arată
 * ca un meniu de site, nu ca un instrument: nu se vede unde ești, nu se vede
 * ce ține de ce, iar pe un ecran lat rămânea o bandă goală de 1.400 px lângă
 * ele. O coloană în stânga ține toate paginile la vedere tot timpul, le lasă
 * grupate pe înțelesul treburilor (banii, oamenii, trimisul) și eliberează
 * lățimea pentru tabele și grafice, care de asta au nevoie.
 *
 * Pe telefon coloana devine o bandă care se derulează lateral: o bară laterală
 * fixă ar mânca jumătate din ecran.
 */

type Intrare = {
  href: string;
  eticheta: string;
  pictograma: NumePictograma;
};

/**
 * Paginile, grupate pe treburi.
 *
 * Ordinea nu e alfabetică și nici întâmplătoare: e ordinea în care se umblă
 * prin ele într-o zi obișnuită — întâi vezi cum stai, apoi te uiți la bani,
 * apoi la oamenii care așteaptă un răspuns, și abia la urmă trimiți ceva.
 */
const GRUPURI: ReadonlyArray<{ titlu: string; pagini: readonly Intrare[] }> = [
  {
    titlu: "Privire de ansamblu",
    pagini: [
      { href: "/admin", eticheta: "Tablou de bord", pictograma: "panou" },
    ],
  },
  {
    titlu: "Banii",
    pagini: [
      { href: "/admin/donatii", eticheta: "Donații", pictograma: "inima" },
      { href: "/admin/donatori", eticheta: "Donatori", pictograma: "familie" },
      { href: "/admin/firme", eticheta: "Firme", pictograma: "cladire" },
    ],
  },
  {
    titlu: "De lucru",
    pagini: [
      { href: "/admin/cereri", eticheta: "Cereri", pictograma: "document" },
      { href: "/admin/campanii", eticheta: "Campanii", pictograma: "maini" },
      { href: "/admin/email", eticheta: "Trimite un e-mail", pictograma: "plic" },
    ],
  },
];

function Nav({ activ }: { activ?: string }) {
  return (
    <>
      {GRUPURI.map((grup) => (
        <div key={grup.titlu} className="lg:mt-7 lg:first:mt-0">
          <p className="hidden px-3 pb-2 font-titlu text-nota font-bold tracking-wide text-hartie/45 uppercase lg:block">
            {grup.titlu}
          </p>
          <ul className="flex gap-1 lg:flex-col">
            {grup.pagini.map((p) => {
              const aici = activ === p.href;
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={aici ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-titlu text-mic font-semibold whitespace-nowrap transition-colors ${
                      aici
                        ? "bg-caramiziu-600 text-hartie"
                        : "text-hartie/75 hover:bg-hartie/10 hover:text-hartie"
                    }`}
                  >
                    <Pictograma
                      nume={p.pictograma}
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    {p.eticheta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

export default function Cadru({
  titlu,
  descriere,
  activ,
  actiuni,
  children,
}: {
  titlu: string;
  /** O frază sub titlu: ce e pagina asta și la ce folosește. */
  descriere?: string;
  activ?: string;
  /** Butoane sau filtre, în dreapta titlului. */
  actiuni?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id="panou-admin" className="min-h-screen bg-hartie-calda lg:flex">
      {/* Bara laterală. Pe ecran lat stă lipită și nu se derulează cu pagina. */}
      <div className="bg-cerneala lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-4 lg:px-5 lg:py-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-caramiziu-600 text-hartie">
            <Pictograma nume="infinit" aria-hidden="true" className="size-5" />
          </span>
          <span className="font-titlu leading-tight font-extrabold text-hartie">
            Teona Ariana
            <span className="block font-semibold text-nota text-hartie/50">
              panou de administrare
            </span>
          </span>
        </div>

        <nav
          aria-label="Panou"
          className="overflow-x-auto px-3 pb-4 lg:overflow-visible lg:pb-8"
        >
          <Nav activ={activ} />
        </nav>
      </div>

      {/*
        `div`, nu `main`.

        Paginile panoului se randează înăuntrul aspectului site-ului, care are
        deja `<main id="continut">`. Două `main` imbricate sunt HTML invalid,
        iar un cititor de ecran care sare „la conținutul principal” nu mai
        știe unde să ducă omul. Prins de proba automată, care a dat peste două
        elemente acolo unde se aștepta la unul.
      */}
      <div className="min-w-0 flex-1">
        <div className="border-b border-hartie-umbra bg-hartie">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4 px-4 py-6 sm:px-8">
            <div>
              <h1 className="text-h3 text-cerneala">{titlu}</h1>
              {descriere && (
                <p className="mt-1 text-mic text-cerneala-moale">{descriere}</p>
              )}
            </div>
            {actiuni}
          </div>
        </div>

        {/*
          Zona de conținut are nume propriu, nu doar `#panou-admin`.

          Probele automate alegeau „primul `li` din panou" ca să ajungă la
          primul rând dintr-un tabel. De când meniul e o listă în stânga,
          primul `li` din panou e o intrare de meniu, iar proba de CRM a
          început să încerce să schimbe stadiul... linkului „Tablou de bord".
          Cu un nume separat, nu se mai pot confunda.
        */}
        <div
          id="continut-panou"
          className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
