import Link from "next/link";
import { adresaPoza } from "@/lib/poza-urcata";
import type { Text } from "@/lib/texte";
import { scrieSuma } from "@/lib/suma";
import Aparitie from "../Aparitie";

/**
 * Lista noutăților sau a campaniilor, în carduri.
 *
 * Aceeași componentă pentru amândouă: diferă doar adresa și, la campanii,
 * rândul cu ținta. Două grile aproape identice ar fi însemnat două locuri în
 * care să repari aceeași nepotrivire de spațiere.
 *
 * **Pozele vin din Cloudinary, nu din `public/`**, pentru că sunt urcate din
 * panou după ce site-ul a fost construit. De aceea `img` cu `srcset` scris de
 * mână, nu `next/image`: adresele nu se știu la construire.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const UMBRE = [
  "shadow-[0_24px_50px_-26px_rgba(247,79,34,0.5)]",
  "shadow-[0_24px_50px_-26px_rgba(255,172,0,0.55)]",
  "shadow-[0_24px_50px_-26px_rgba(42,159,163,0.45)]",
] as const;

export default function ListaScrise({
  texte,
  cale,
  gol,
}: {
  texte: readonly Text[];
  /** `/noutati` sau `/campanii`. */
  cale: string;
  /** Ce scrie când nu e nimic publicat încă. */
  gol: string;
}) {
  if (texte.length === 0) {
    return (
      <p className="mx-auto max-w-2xl text-center text-amplu text-cerneala-moale">
        {gol}
      </p>
    );
  }

  return (
    <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
      {texte.map((text, i) => (
        <li key={text.id}>
          <Aparitie intarziere={Math.min(i, 5) * 0.05} className="h-full">
            <article
              className={`group relative flex h-full flex-col overflow-hidden ${
                i % 2 === 0 ? "colt-a" : "colt-b"
              } border border-hartie-umbra bg-hartie ${UMBRE[i % 3]}`}
            >
              {text.poza && (
                <div className="relative aspect-[16/10] overflow-hidden bg-hartie-calda">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={adresaPoza(text.poza.id, 800)}
                    srcSet={`${adresaPoza(text.poza.id, 480)} 480w, ${adresaPoza(
                      text.poza.id,
                      800,
                    )} 800w, ${adresaPoza(text.poza.id, 1200)} 1200w`}
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 46vw, 92vw"
                    alt={text.poza.alt}
                    loading={i < 3 ? "eager" : "lazy"}
                    width={text.poza.latime}
                    height={text.poza.inaltime}
                    className="size-full object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-6">
                {text.publicatLa && (
                  <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                    <time dateTime={text.publicatLa.slice(0, 10)}>
                      {CAND.format(new Date(text.publicatLa))}
                    </time>
                  </p>
                )}

                <h2 className="text-h4 text-cerneala">
                  <Link
                    href={`${cale}/${text.slug}`}
                    className="after:absolute after:inset-0 hover:text-caramiziu-700"
                  >
                    {text.titlu}
                  </Link>
                </h2>

                {text.rezumat && (
                  <p className="text-corp text-cerneala-moale">
                    {text.rezumat}
                  </p>
                )}

                {text.tintaBani !== null && (
                  <p className="mt-auto pt-2 font-titlu text-mic font-bold text-caramiziu-700">
                    Țintă: {scrieSuma(text.tintaBani / 100)}
                  </p>
                )}
              </div>
            </article>
          </Aparitie>
        </li>
      ))}
    </ul>
  );
}
