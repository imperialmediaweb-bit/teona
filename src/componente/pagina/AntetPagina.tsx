import type { ReactNode } from "react";
import Image from "next/image";
import Decor from "../Decor";
import Val, { VAL_PESTE } from "../Val";

/**
 * Antetul unei pagini interioare.
 *
 * Caietul cere pentru fiecare pagină același lucru, în aceeași ordine: un
 * titlu, un subtitlu de o frază și o fotografie mare, reală, din activitatea
 * asociației (3.1, 4.1, 6.1, 7.1, 8.1, 10.1, 11.1). De aceea e o componentă,
 * nu un bloc copiat pe fiecare pagină: dacă se schimbă forma antetului, se
 * schimbă o dată.
 *
 * E construit ca eroul primei pagini, nu ca o variantă mai săracă a lui:
 * aceeași hârtie caldă cu pete de culoare, aceeași ramă cu umbră colorată,
 * aceeași legendă scrisă de mână. Fotografia stă pe un bloc de culoare
 * decalat și, unde pagina are două poze bune, a doua se suprapune peste
 * prima, ca o poză pusă peste alta. Pe telefon poza vine prima, apoi titlul
 * — așa a cerut clientul la erou, și la fel se așteaptă și aici.
 *
 * Textul nu stă peste poză. Textul peste poză e ieftin de făcut și greu de
 * citit — mai ales cu diacritice, care au nevoie de spațiu liber deasupra
 * literei.
 */

const ACCENTE = {
  caramiziu: {
    bloc: "bg-caramiziu-100",
    umbra: "shadow-[0_32px_64px_-30px_rgba(247,79,34,0.55)]",
    scris: "text-caramiziu-600",
    pastila:
      "bg-caramiziu-500 text-hartie shadow-[0_12px_28px_-12px_rgba(247,79,34,0.9)]",
    pata: "bg-caramiziu-100/60",
  },
  miere: {
    bloc: "bg-miere-200",
    umbra: "shadow-[0_32px_64px_-30px_rgba(255,172,0,0.6)]",
    scris: "text-miere-700",
    pastila:
      "bg-miere-400 text-cerneala shadow-[0_12px_28px_-12px_rgba(255,172,0,0.9)]",
    pata: "bg-miere-100/70",
  },
  turcoaz: {
    bloc: "bg-turcoaz-100",
    umbra: "shadow-[0_32px_64px_-30px_rgba(42,159,163,0.5)]",
    scris: "text-turcoaz-700",
    pastila:
      "bg-turcoaz-500 text-hartie shadow-[0_12px_28px_-12px_rgba(42,159,163,0.9)]",
    pata: "bg-turcoaz-100/70",
  },
} as const;

export type Accent = keyof typeof ACCENTE;

export default function AntetPagina({
  titlu,
  subtitlu,
  poza,
  pozaMica,
  scris,
  butoane,
  accent = "caramiziu",
  /** Culoarea secțiunii care urmează, pentru valul de închidere. */
  urmeaza = "text-hartie",
}: {
  titlu: string;
  subtitlu: string;
  poza: { cale: string; alt: string; legenda?: string };
  /** A doua fotografie, mai mică, suprapusă peste colțul primei. */
  pozaMica?: { cale: string; alt: string };
  /** Rândul scris de mână de deasupra titlului. */
  scris?: string;
  butoane?: ReactNode;
  accent?: Accent;
  urmeaza?: string;
}) {
  const a = ACCENTE[accent];

  return (
    <>
      <section className="granulatie relative isolate overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-14 lg:pb-32">
        {/* Pete de culoare foarte spălate, în loc de un fundal plat; se
            mișcă la limita observabilului (vezi `.pata` în globals.css). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span
            className={`pata absolute -top-32 right-[-8%] size-[28rem] rounded-full blur-3xl ${a.pata}`}
          />
          <span className="pata pata-2 absolute bottom-[-8rem] left-[-8rem] size-[24rem] rounded-full bg-miere-100/60 blur-3xl" />
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-8 right-[5%] hidden size-10 text-miere-400 lg:block"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-20 left-[3%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
          {/* Titlul rămâne primul lucru citit; pe telefon se vede sub poză. */}
          <div className="order-2 lg:order-1">
            {scris && <p className={`scris text-amplu ${a.scris}`}>{scris}</p>}
            <h1 className={`text-h1 text-cerneala ${scris ? "mt-3" : ""}`}>
              {titlu}
            </h1>
            <p className="mt-6 max-w-xl text-amplu text-cerneala-moale">
              {subtitlu}
            </p>
            {butoane && (
              <div className="mt-9 flex flex-wrap gap-3">{butoane}</div>
            )}
          </div>

          <div
            className={`order-1 lg:order-2 ${pozaMica ? "pb-10 sm:pb-12" : ""}`}
          >
            <figure className="relative mx-auto max-w-2xl lg:max-w-none">
              {/* Hârtia colorată de dedesubt, decalată: poza stă pe ceva. */}
              <span
                aria-hidden="true"
                className={`absolute -top-4 -left-3 h-[70%] w-[62%] colt-b sm:-top-5 sm:-left-5 ${a.bloc}`}
              />
              <div
                className={`colt-a relative aspect-[4/3] overflow-hidden bg-hartie-umbra lg:aspect-[5/4] ${a.umbra}`}
              >
                <Image
                  src={poza.cale}
                  alt={poza.alt}
                  fill
                  priority
                  sizes="(min-width: 1280px) 660px, (min-width: 1024px) 54vw, 94vw"
                  className="object-cover"
                />
              </div>

              {poza.legenda && (
                <figcaption
                  className={`colt-mic-b absolute -bottom-4 left-5 z-20 px-5 py-2 ${a.pastila}`}
                >
                  <span className="scris text-amplu leading-none">
                    {poza.legenda}
                  </span>
                </figcaption>
              )}

              {pozaMica && (
                <div className="absolute -right-1 -bottom-10 z-10 w-[40%] sm:-bottom-12 sm:w-[38%]">
                  <div className="relative aspect-square overflow-hidden colt-b border-[6px] border-hartie bg-hartie shadow-[0_22px_44px_-18px_rgba(35,35,35,0.5)]">
                    <Image
                      src={pozaMica.cale}
                      alt={pozaMica.alt}
                      fill
                      sizes="(min-width: 1024px) 260px, 40vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </figure>
          </div>
        </div>
      </section>
      <Val culoare={urmeaza} className={VAL_PESTE} />
    </>
  );
}
