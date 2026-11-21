import Image from "next/image";
import Link from "next/link";
import type { ProiectAfisat } from "@/date/proiecte-tipuri";
import Aparitie from "../Aparitie";
import Decor from "../Decor";
import Pictograma from "../Pictograma";

/**
 * Cardurile de proiect: poza cu un card de text tras peste marginea ei de
 * jos; primul ocupă jumătate de rând. Folosită de `/proiecte` (pe categorii)
 * și de `/campanii`, ca aceeași campanie să arate la fel în amândouă.
 */

const UMBRE = [
  "shadow-[0_26px_52px_-22px_rgba(247,79,34,0.55)]",
  "shadow-[0_26px_52px_-22px_rgba(255,172,0,0.55)]",
  "shadow-[0_26px_52px_-22px_rgba(42,159,163,0.5)]",
] as const;

const PASTILE = [
  "bg-caramiziu-700 text-hartie",
  "bg-miere-400 text-cerneala",
  "bg-turcoaz-600 text-hartie",
] as const;

export default function GrilaProiecte({
  proiecte,
}: {
  proiecte: ReadonlyArray<ProiectAfisat>;
}) {
  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
      {proiecte.map((proiect, i) => {
        const mare = i === 0;
        return (
          <li
            key={proiect.slug}
            className={
              mare ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3"
            }
          >
            <Aparitie
              intarziere={Math.min(i, 5) * 0.04}
              className="h-full"
            >
              <Link
                href={`/proiecte/${proiect.slug}`}
                className="group flex h-full flex-col"
              >
                <div
                  className={`relative overflow-hidden ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } bg-hartie-calda transition-transform duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0 ${
                    mare
                      ? "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10]"
                      : "aspect-[4/3] lg:aspect-[4/5]"
                  } ${UMBRE[i % 3]}`}
                >
                  {proiect.coperta ? (
                    /* Fotografia de copertă e decor: titlul proiectului e
                       chiar dedesubt, în același link, deci un text
                       alternativ ar repeta exact ce tocmai s-a citit. */
                    <Image
                      src={proiect.coperta}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes={
                        mare
                          ? "(min-width: 1024px) 620px, 92vw"
                          : "(min-width: 1024px) 300px, (min-width: 640px) 46vw, 92vw"
                      }
                      quality={86}
                      className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-miere-100">
                      <Decor
                        semn="soare"
                        strokeWidth={0.9}
                        className="absolute -right-10 -bottom-10 size-48 text-miere-300"
                      />
                      <Decor
                        semn="stea"
                        className="absolute top-8 left-8 size-10 text-caramiziu-300"
                      />
                    </span>
                  )}
                  {/* Campaniile n-au dată: pastila lipsește de tot, în
                      loc să stea goală peste colțul pozei. */}
                  {proiect.dataCitita && (
                    <span
                      className={`absolute top-4 left-4 rounded-full px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(35,35,35,0.5)] ${PASTILE[i % 3]}`}
                    >
                      <span className="scris text-corp leading-none">
                        <time dateTime={proiect.data}>
                          {proiect.dataCitita}
                        </time>
                      </span>
                    </span>
                  )}
                </div>

                {/* Cardul de text, tras peste poză; marginile laterale
                    lasă poza vizibilă pe laturi. */}
                <div
                  className={`relative z-10 -mt-10 mr-4 ml-4 flex flex-1 flex-col ${
                    i % 2 === 0 ? "colt-b" : "colt-a"
                  } border border-hartie-umbra bg-hartie p-5 shadow-[0_24px_48px_-26px_rgba(35,35,35,0.5)] sm:mr-6 sm:ml-6 ${
                    mare ? "lg:mr-10 lg:ml-10 lg:p-7" : ""
                  }`}
                >
                  <h3
                    className={`flex-1 leading-snug text-cerneala transition-colors duration-300 group-hover:text-caramiziu-700 ${
                      mare ? "text-h3" : "text-h4"
                    }`}
                  >
                    {proiect.titlu}
                  </h3>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                    {proiect.poze.length > 0 && (
                      <span>{proiect.poze.length} fotografii</span>
                    )}
                    <span className="inline-flex items-center gap-2 text-caramiziu-700 normal-case tracking-normal">
                      Vezi proiectul
                      <Pictograma nume="sageata" className="size-4" />
                    </span>
                  </p>
                </div>
              </Link>
            </Aparitie>
          </li>
        );
      })}
    </ul>
  );
}
