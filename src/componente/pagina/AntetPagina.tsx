import type { ReactNode } from "react";
import Image from "next/image";
import Decor from "../Decor";
import Val, { VAL_PESTE } from "../Val";
import { taietura } from "@/date/taieturi";

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
 * Textul nu stă peste poză în varianta obișnuită. Textul peste poză e ieftin
 * de făcut și greu de citit — mai ales cu diacritice, care au nevoie de spațiu
 * liber deasupra literei.
 *
 * **Trei variante, aceeași componentă** (`varianta`):
 * - `standard` — titlul în stânga, poza mare în dreapta, cea mică peste ea.
 *   Acasă, Despre noi, Casa Teona, Proiecte și restul.
 * - `compact` — titlul și fraza, fără poză. Pentru paginile la care omul a
 *   venit să facă ceva anume (Contact, Donează): ce caută trebuie să fie în
 *   primul ecran, nu sub o fotografie.
 * - `lata` — fotografia pe toată lățimea, cu titlul peste ea. Aici textul
 *   stă pe poză, deci poza primește un văl întunecat dedesubt, cât să se
 *   citească titlul alb pe orice fotografie.
 */

const ACCENTE = {
  caramiziu: {
    bloc: "bg-caramiziu-100",
    umbra: "shadow-[0_32px_64px_-30px_rgba(247,79,34,0.55)]",
    scris: "text-caramiziu-700",
    pastila:
      "bg-caramiziu-700 text-hartie shadow-[0_12px_28px_-12px_rgba(247,79,34,0.9)]",
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
      "bg-turcoaz-600 text-hartie shadow-[0_12px_28px_-12px_rgba(42,159,163,0.9)]",
    pata: "bg-turcoaz-100/70",
  },
} as const;

export type Accent = keyof typeof ACCENTE;

type Poza = { cale: string; alt: string; legenda?: string };

export default function AntetPagina(props: {
  titlu: string;
  subtitlu: string;
  /** Rândul scris de mână de deasupra titlului. */
  scris?: string;
  butoane?: ReactNode;
  accent?: Accent;
  /** Culoarea secțiunii care urmează, pentru valul de închidere. */
  urmeaza?: string;
} & (
  | {
      varianta?: "standard";
      poza: Poza;
      /** A doua fotografie, mai mică, suprapusă peste colțul primei. */
      pozaMica?: { cale: string; alt: string };
    }
  | { varianta: "compact" }
  | { varianta: "lata"; poza: Poza }
)) {
  if (props.varianta === "compact") return <Compact {...props} />;
  if (props.varianta === "lata") return <Lata {...props} />;
  return <Standard {...props} />;
}

function Standard({
  titlu,
  subtitlu,
  poza,
  pozaMica,
  scris,
  butoane,
  accent = "caramiziu",
  urmeaza = "text-hartie",
}: {
  titlu: string;
  subtitlu: string;
  poza: Poza;
  pozaMica?: { cale: string; alt: string };
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
            className="pluteste-lent absolute top-8 right-[5%] size-10 text-miere-700 hidden opacity-50 md:block"
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
                  quality={86}
                  style={{ objectPosition: taietura(poza.cale) }}
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
                      quality={86}
                      style={{ objectPosition: taietura(pozaMica.cale) }}
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

/**
 * Titlul și fraza, fără fotografie. Fără val la capăt: secțiunea care
 * urmează continuă pe aceeași hârtie, ca formularul sau cardurile de contact
 * să înceapă imediat sub titlu.
 */
function Compact({
  titlu,
  subtitlu,
  scris,
  butoane,
  accent = "caramiziu",
}: {
  titlu: string;
  subtitlu: string;
  scris?: string;
  butoane?: ReactNode;
  accent?: Accent;
}) {
  const a = ACCENTE[accent];
  return (
    <section className="granulatie relative isolate overflow-hidden bg-hartie-calda pt-8 pb-8 lg:pt-14 lg:pb-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <span
          className={`pata absolute -top-40 right-[-6%] size-[26rem] rounded-full blur-3xl ${a.pata}`}
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {scris && <p className={`scris text-amplu ${a.scris}`}>{scris}</p>}
        <h1 className={`text-h1 text-cerneala ${scris ? "mt-2" : ""}`}>
          {titlu}
        </h1>
        <p className="mt-4 max-w-2xl text-amplu text-cerneala-moale">
          {subtitlu}
        </p>
        {butoane && <div className="mt-7 flex flex-wrap gap-3">{butoane}</div>}
      </div>
    </section>
  );
}

/** Fotografia pe toată lățimea, cu titlul jos, peste un văl întunecat. */
function Lata({
  titlu,
  subtitlu,
  poza,
  scris,
  butoane,
  urmeaza = "text-hartie",
}: {
  titlu: string;
  subtitlu: string;
  poza: Poza;
  scris?: string;
  butoane?: ReactNode;
  urmeaza?: string;
}) {
  return (
    <>
      <section className="relative isolate flex min-h-[34rem] items-end overflow-hidden bg-cerneala sm:min-h-[36rem] lg:min-h-[40rem]">
        <Image
          src={poza.cale}
          alt={poza.alt}
          fill
          priority
          sizes="100vw"
          quality={86}
          style={{ objectPosition: taietura(poza.cale) }}
          className="-z-10 object-cover"
        />
        {/* Vălul: de jos în sus, cât să țină textul lizibil oriunde. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-cerneala/90 via-cerneala/60 to-cerneala/15 lg:via-cerneala/45 lg:to-cerneala/5"
        />
        <div className="mx-auto w-full max-w-7xl px-4 pt-32 pb-24 sm:px-6 lg:px-8 lg:pb-32">
          {scris && (
            <p className="scris text-amplu text-miere-300">{scris}</p>
          )}
          <h1 className={`max-w-3xl text-h1 text-hartie ${scris ? "mt-2" : ""}`}>
            {titlu}
          </h1>
          <p className="mt-5 max-w-2xl text-amplu text-hartie/90">
            {subtitlu}
          </p>
          {butoane && (
            <div className="mt-8 flex flex-wrap gap-3">{butoane}</div>
          )}
          {poza.legenda && (
            <p className="mt-8 font-titlu text-nota font-bold tracking-wider text-hartie/70 uppercase">
              {poza.legenda}
            </p>
          )}
        </div>
      </section>
      <Val culoare={urmeaza} className={VAL_PESTE} />
    </>
  );
}
