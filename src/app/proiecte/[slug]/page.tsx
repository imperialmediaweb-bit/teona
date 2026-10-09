import type { Metadata } from "next";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RUTE } from "@/date/asociatie";
import { proiectDupaSlug, proiecteAfisate } from "@/date/proiecte";
import { CATEGORII, type ProiectAfisat } from "@/date/proiecte-tipuri";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import Galerie from "@/componente/pagina/Galerie";

export function generateStaticParams() {
  return proiecteAfisate().map((proiect) => ({ slug: proiect.slug }));
}

/** Textul alternativ al unei fotografii din proiect: numerotat, ca niciunul să nu fie identic cu vecinul. */
function altFotografie(titlu: string, index: number, total: number) {
  return `${titlu} — fotografia ${index} din ${total}`;
}

/**
 * Toate fotografiile unui proiect, coperta inclusă.
 *
 * Două proiecte au `pozaPrincipala`, dar lista `poze` goală: pagina lor
 * rămânea fără nicio imagine, deși cardul din listă afișa coperta, iar textul
 * de dedesubt promitea fotografii.
 */
function pozeleProiectului(proiect: ProiectAfisat): string[] {
  return proiect.coperta && !proiect.poze.includes(proiect.coperta)
    ? [proiect.coperta, ...proiect.poze]
    : proiect.poze;
}

export async function generateMetadata({
  params,
}: PageProps<"/proiecte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const proiect = proiectDupaSlug(slug);
  // Un slug inexistent ajunge la 404; pagina aceea nu se indexează.
  if (!proiect)
    return { title: "Proiect", robots: { index: false, follow: false } };

  // Fără dată: `data` e data postării în WordPress, care nu e mereu data
  // taberei (câteva proiecte au fost publicate abia în noiembrie 2024).
  // Într-un rezumat de căutare ar trece drept data evenimentului.
  const total = pozeleProiectului(proiect).length;
  const fotografii =
    total === 0 ? "" : total === 1 ? " O fotografie." : ` ${total} fotografii.`;
  return metadate({
    titlu: proiect.titlu,
    descriere: `${proiect.titlu} — proiect al Asociației Teona Ariana Suceava.${fotografii}`,
    cale: `/proiecte/${proiect.slug}`,
    // Fotografia proiectului spune mai mult decât imaginea generală a site-ului.
    imagine: proiect.coperta
      ? { cale: proiect.coperta, alt: altFotografie(proiect.titlu, 1, total) }
      : undefined,
  });
}

/**
 * Pagina unui proiect (capitolul 5).
 *
 * Caietul cere titlu, dată, categorie, două-trei fraze de descriere și o
 * galerie. Descrierile nu sunt încă scrise: textele vechi sunt postări de
 * Facebook importate, cu nume de familii, localități și diagnostice de copii,
 * iar caietul interzice publicarea lor. Se scriu din listele pe care le
 * pregătește asociația. Până atunci pagina arată ce avem verificat — titlu,
 * dată, categorie și fotografiile proiectului — și spune deschis ce lipsește,
 * în loc să umple locul cu text inventat.
 */
export default async function PaginaProiect({
  params,
}: PageProps<"/proiecte/[slug]">) {
  const { slug } = await params;
  const proiect = proiectDupaSlug(slug);
  if (!proiect) notFound();

  const categorie = CATEGORII.find((c) => c.id === proiect.categorie);
  const toatePozele = pozeleProiectului(proiect);
  const [prima, ...restul] = toatePozele;
  const total = toatePozele.length;

  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Proiecte", cale: RUTE.proiecte },
          { nume: proiect.titlu, cale: `/proiecte/${proiect.slug}` },
        ])}
      />
      <section className="granulatie relative isolate overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-12 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span className="pata absolute -top-32 right-[-8%] size-[26rem] rounded-full bg-miere-100/70 blur-3xl" />
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-10 right-[6%] hidden size-10 text-miere-400 lg:block"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-16 left-[3%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href={RUTE.proiecte}
            className="inline-flex min-h-10 items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600 transition hover:text-caramiziu-700"
          >
            <Pictograma nume="sageata" className="size-4 rotate-180" />
            Toate proiectele
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="colt-mic-a bg-caramiziu-500 px-4 py-1.5 text-hartie shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
              <span className="scris text-corp leading-none">
                <time dateTime={proiect.data}>{proiect.dataCitita}</time>
              </span>
            </span>
            {categorie && (
              <span className="rounded-full border-2 border-miere-300 bg-miere-50 px-4 py-1 font-titlu text-mic font-bold text-miere-800">
                {categorie.eticheta}
              </span>
            )}
            {toatePozele.length > 0 && (
              <span className="font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                {toatePozele.length} fotografii
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-4xl text-h1 text-cerneala">
            {proiect.titlu}
          </h1>
        </div>
      </section>

      <Val culoare="text-hartie" className={VAL_PESTE} />

      <section className="relative bg-hartie pb-24 lg:pb-32">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {prima && (
            <figure className="relative z-20 -mt-6 sm:-mt-10 lg:-mt-16">
              <span
                aria-hidden="true"
                className="absolute -top-4 -left-3 h-[60%] w-[40%] colt-b bg-miere-200 sm:-top-5 sm:-left-5"
              />
              <div className="colt-a relative aspect-[4/3] overflow-hidden bg-hartie-calda shadow-[0_34px_70px_-30px_rgba(247,79,34,0.55)] sm:aspect-[16/10]">
                <Image
                  src={prima}
                  alt={altFotografie(proiect.titlu, 1, total)}
                  fill
                  priority
                  sizes="(min-width: 1024px) 1100px, 94vw"
                  className="object-cover"
                />
              </div>
            </figure>
          )}

          {/* Locul descrierii. Vizibil, nu ascuns: cine deschide pagina vede
              că textul e în pregătire, nu că site-ul e gol. */}
          <div className="granulatie relative mt-12 overflow-hidden colt-b bg-miere-100 px-7 py-7 shadow-[0_24px_50px_-26px_rgba(255,172,0,0.7)] sm:px-9 lg:mt-16">
            <Decor
              semn="soare"
              strokeWidth={0.8}
              className="absolute -top-10 -right-10 size-40 text-miere-300/80"
            />
            <p className="relative flex items-start gap-4 text-amplu text-miere-900">
              <span className="colt-mic-a flex size-11 shrink-0 items-center justify-center bg-miere-400 text-cerneala">
                <Pictograma nume="document" className="size-5" />
              </span>
              <span>
                Descrierea acestui proiect se scrie împreună cu asociația.
                {toatePozele.length > 0 &&
                  " Până atunci, îl poți vedea în fotografii."}
              </span>
            </p>
          </div>
        </div>
      </section>

      {restul.length > 0 && (
        <Galerie
          scris="În fotografii"
          titlu="Galerie"
          poze={restul.map((poza, i) => ({
            cale: poza,
            alt: altFotografie(proiect.titlu, i + 2, total),
          }))}
          primaMare={false}
        />
      )}

      <IndemnFinal
        peste
        butoane="doua"
        titlu="Astfel de zile se întâmplă pentru că cineva ajută"
      />
    </>
  );
}
