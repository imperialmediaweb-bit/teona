import type { ReactNode } from "react";
import Image from "next/image";
import Decor from "../Decor";
import Val from "../Val";

/**
 * Antetul unei pagini interioare.
 *
 * Caietul cere pentru fiecare pagină același lucru, în aceeași ordine: un
 * titlu, un subtitlu de o frază și o fotografie mare, reală, din activitatea
 * asociației (3.1, 4.1, 6.1, 7.1, 8.1, 10.1, 11.1). De aceea e o componentă,
 * nu un bloc copiat pe fiecare pagină: dacă se schimbă forma antetului, se
 * schimbă o dată.
 *
 * Fotografia nu stă în spatele textului. Textul peste poză e ieftin de făcut
 * și greu de citit — mai ales cu diacritice, care au nevoie de spațiu liber
 * deasupra literei. Aici poza stă lângă text, cu umbra caldă a restului
 * site-ului.
 */
export default function AntetPagina({
  titlu,
  subtitlu,
  poza,
  butoane,
  /** Culoarea secțiunii care urmează, pentru valul de închidere. */
  urmeaza = "text-hartie",
}: {
  titlu: string;
  subtitlu: string;
  poza: { cale: string; alt: string; legenda?: string };
  butoane?: ReactNode;
  urmeaza?: string;
}) {
  return (
    <>
      <section className="granulatie relative overflow-hidden bg-tenta-cald pt-10 pb-6 lg:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-12 right-[6%] size-8 text-miere-300 lg:size-11"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-16 left-[3%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-8">
          <div>
            <h1 className="text-h1 text-cerneala">{titlu}</h1>
            <p className="mt-5 max-w-xl text-amplu text-cerneala-moale">
              {subtitlu}
            </p>
            {butoane && (
              <div className="mt-9 flex flex-wrap gap-3">{butoane}</div>
            )}
          </div>

          <figure className="group relative">
            <div className="colt-a relative aspect-[5/4] overflow-hidden bg-hartie-calda shadow-[0_28px_55px_-24px_rgba(247,79,34,0.5)]">
              <Image
                src={poza.cale}
                alt={poza.alt}
                fill
                priority
                sizes="(min-width: 1024px) 640px, 94vw"
                className="object-cover"
              />
            </div>
            {poza.legenda && (
              <figcaption className="absolute -bottom-3.5 left-6 rounded-full bg-caramiziu-500 px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
                <span className="scris text-corp leading-none text-hartie">
                  {poza.legenda}
                </span>
              </figcaption>
            )}
          </figure>
        </div>
      </section>
      <Val culoare={urmeaza} />
    </>
  );
}
