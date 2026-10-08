import Image from "next/image";
import Aparitie from "../Aparitie";

export type PozaGalerie = { cale: string; alt: string };

/**
 * Galeria de fotografii (4.4, 11.6).
 *
 * Nu e o grilă de pătrate egale. Fotografiile alternează colțurile decupate și
 * primesc umbre calde pe rând, iar prima e mai mare: așa se citește ca un
 * album, nu ca un tabel de miniaturi.
 *
 * `alt` e obligatoriu prin tipuri. Pe site-ul vechi, 199 din 216 de fotografii
 * aveau textul alternativ gol; aici o poză fără descriere nu compilează.
 */

const UMBRE = [
  "shadow-[0_20px_42px_-22px_rgba(247,79,34,0.5)]",
  "shadow-[0_20px_42px_-22px_rgba(255,172,0,0.5)]",
  "shadow-[0_20px_42px_-22px_rgba(42,159,163,0.45)]",
] as const;

export default function Galerie({
  titlu,
  poze,
  /** Prima fotografie ocupă două coloane, ca într-un album. */
  primaMare = true,
}: {
  titlu: string;
  poze: ReadonlyArray<PozaGalerie>;
  primaMare?: boolean;
}) {
  if (poze.length === 0) return null;

  return (
    <section className="bg-hartie pb-20 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-h2 text-cerneala">{titlu}</h2>

        <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {poze.map((poza, i) => {
            const mare = primaMare && i === 0;
            return (
              <li
                key={poza.cale}
                className={mare ? "col-span-2 row-span-2" : undefined}
              >
                <Aparitie intarziere={Math.min(i, 5) * 0.04} className="h-full">
                  <figure
                    className={`group relative h-full overflow-hidden ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } ${mare ? "aspect-[4/3]" : "aspect-square"} bg-hartie-calda ${UMBRE[i % 3]}`}
                  >
                    <Image
                      src={poza.cale}
                      alt={poza.alt}
                      fill
                      sizes={
                        mare
                          ? "(min-width: 1024px) 640px, 94vw"
                          : "(min-width: 1024px) 320px, 46vw"
                      }
                      className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                    />
                  </figure>
                </Aparitie>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
