import Image from "next/image";
import Aparitie from "../Aparitie";
import Decor from "../Decor";
import TitluSectiune from "./TitluSectiune";

export type PozaGalerie = { cale: string; alt: string; legenda?: string };

/**
 * Galeria de fotografii (4.4, 11.6).
 *
 * Nu e o grilă de pătrate egale. Prima fotografie e mare, pe două coloane și
 * două rânduri, a patra se întinde pe lățime, iar restul sunt pătrate: așa se
 * citește ca o pagină de album, nu ca un tabel de miniaturi. Colțurile
 * decupate alternează și umbrele sunt calde, pe rând, în cele trei culori.
 *
 * `alt` e obligatoriu prin tipuri. Pe site-ul vechi, 199 din 216 de fotografii
 * aveau textul alternativ gol; aici o poză fără descriere nu compilează.
 */

const UMBRE = [
  "shadow-[0_20px_42px_-22px_rgba(247,79,34,0.5)]",
  "shadow-[0_20px_42px_-22px_rgba(255,172,0,0.55)]",
  "shadow-[0_20px_42px_-22px_rgba(42,159,163,0.45)]",
] as const;

const PASTILE = [
  "bg-caramiziu-500 text-hartie",
  "bg-miere-400 text-cerneala",
  "bg-turcoaz-500 text-hartie",
] as const;

type Forma = { celula: string; raport: string; dimensiuni: string };

/**
 * Forma fiecărei celule, calculată o dată pentru toată galeria.
 *
 * Grila are două coloane pe telefon și patru pe ecran lat. Prima poză
 * ocupă 2×2, a patra se lățește pe două coloane, iar ultimele se lățesc
 * cât e nevoie ca rândul de jos să se termine drept: o galerie cu o gaură
 * în colț arată ca un album cu o poză lipsă.
 */
function forme(n: number, primaMare: boolean): Forma[] {
  const PATRAT = "aspect-square";
  const LAT = "lg:aspect-[2/1]";
  const rezultat: Forma[] = [];

  // Pe telefon: poza mare ia 4 celule, restul câte una; dacă rămâne una
  // singură pe ultimul rând, se lățește.
  const singureTelefon = primaMare ? n - 1 : n;
  const ultimaLataTelefon = singureTelefon % 2 === 1;

  // Pe ecran lat: primele patru poze umplu exact două rânduri (4+1+1+2);
  // restul se așază câte patru, iar coada se întinde cât lipsește.
  const inCoada = (primaMare ? n - 4 : n) % 4;

  for (let i = 0; i < n; i++) {
    const mare = primaMare && i === 0;
    const aPatra = primaMare && i === 3;
    const ultima = i === n - 1;
    const penultima = i === n - 2;

    let celula = "";
    let raport = PATRAT;
    let dimensiuni = "(min-width: 1024px) 310px, 46vw";

    if (mare) {
      celula = "col-span-2 row-span-2";
      dimensiuni = "(min-width: 1024px) 640px, 94vw";
    } else {
      const latTelefon = ultima && ultimaLataTelefon && !(primaMare && n === 1);
      const latEcran =
        aPatra ||
        (inCoada === 3 && ultima) ||
        (inCoada === 2 && (ultima || penultima));
      const foarteLatEcran = inCoada === 1 && ultima && !aPatra;

      celula = [
        latTelefon ? "col-span-2" : "",
        foarteLatEcran
          ? "lg:col-span-4"
          : latEcran
            ? "lg:col-span-2"
            : "lg:col-span-1",
      ].join(" ");
      raport = [
        latTelefon ? "aspect-[2/1]" : "aspect-square",
        foarteLatEcran
          ? "lg:aspect-[4/1]"
          : latEcran
            ? LAT
            : "lg:aspect-square",
      ].join(" ");
      dimensiuni = foarteLatEcran
        ? "(min-width: 1024px) 1280px, 94vw"
        : latEcran
          ? "(min-width: 1024px) 640px, 94vw"
          : "(min-width: 1024px) 310px, 46vw";
    }
    rezultat.push({ celula: celula.trim(), raport, dimensiuni });
  }
  return rezultat;
}

export default function Galerie({
  titlu,
  scris,
  text,
  poze,
  /** Prima fotografie ocupă două coloane, ca într-un album. */
  primaMare = true,
}: {
  titlu: string;
  scris?: string;
  text?: string;
  poze: ReadonlyArray<PozaGalerie>;
  primaMare?: boolean;
}) {
  if (poze.length === 0) return null;
  const FORME = forme(poze.length, primaMare);

  return (
    <section className="relative overflow-hidden bg-hartie pt-10 pb-24 lg:pt-16 lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="soare"
          className="pluteste-lent absolute top-12 right-[5%] size-9 text-miere-300 lg:size-12"
        />
        <Decor
          semn="stea"
          className="pluteste-lent absolute bottom-16 left-[3%] size-7 text-caramiziu-200 lg:size-10"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TitluSectiune scris={scris} titlu={titlu} text={text} />

        <ul className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {poze.map((poza, i) => {
            const forma = FORME[i];
            return (
              <li key={poza.cale} className={forma.celula}>
                <Aparitie intarziere={Math.min(i, 5) * 0.04} className="h-full">
                  <figure
                    className={`group relative h-full overflow-hidden ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } ${forma.raport} bg-hartie-calda ${UMBRE[i % 3]}`}
                  >
                    <Image
                      src={poza.cale}
                      alt={poza.alt}
                      fill
                      sizes={forma.dimensiuni}
                      className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                    />
                    {poza.legenda && (
                      <figcaption
                        className={`absolute bottom-3 left-3 rounded-full px-3.5 py-1.5 ${PASTILE[i % 3]}`}
                      >
                        <span className="scris text-mic leading-none sm:text-corp">
                          {poza.legenda}
                        </span>
                      </figcaption>
                    )}
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
