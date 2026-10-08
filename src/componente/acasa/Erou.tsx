"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ASOCIATIA, LINKURI_EXTERNE, RUTE, SMS } from "@/date/asociatie";
import Pictograma from "@/componente/Pictograma";
import ButonEditorial from "./ButonEditorial";
import { CONTINUT, GRILA, LINIE } from "./grila";

/**
 * Fotografiile din deschidere.
 *
 * Textul alternativ e scris după ce m-am uitat la fiecare poză — descrie ce se
 * vede, nu ce ne-am dori să se vadă. Prima poartă exact textul cerut de caiet
 * la 1.1.
 *
 * Două poze de pe site-ul vechi au fost scoase de aici fiindcă fișierele erau
 * deformate: WordPress le întinsese pe lățime, de la 4:3 la 2048×1211, și
 * fețele ieșeau late. Pentru parcul de aventură există originalul nedeformat
 * (`449517170…_n.jpg`, 2048×1536), deci el e folosit. Pentru copilul cu
 * curcubeul (`11zon_resized.webp`) nu există original — poza nu mai apare.
 */
const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/448953804_497190052881338_6639192819081512267_n-1.webp",
    alt: "Copii și voluntari ai Asociației Teona Ariana, într-o tabără",
    legenda: "Tabăra RESPIRO",
  },
  {
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură din tabără",
    legenda: "Parcul de aventură",
  },
  {
    cale: "/poze/2024/11/462119250_122094741458569469_941841061673534153_n.jpg",
    alt: "Copii, părinți și voluntari în tricouri albe, pe iarbă, în fața pensiunii din tabăra RESPIRO; câțiva copii fac cu mâna",
    legenda: "Familii în tabără",
  },
] as const;

const INTERVAL = 8000;

/**
 * Secțiunea principală (1.1), ca prima pagină dublă a unei reviste.
 *
 * Stânga: titlul, cât de mare încape pe cinci coloane, și cele trei elemente
 * cerute de caiet. Dreapta: fotografia, care pornește de la a șaptea coloană
 * și iese până la marginea ecranului. Nu stă într-o ramă cu colțuri
 * rotunjite și umbră colorată — e tăiată drept, ca o poză tipărită în
 * sângerare. Sub ea, pe o linie, numărul pozei și legenda, ca o legendă
 * foto de revistă.
 *
 * Pe telefon poza vine prima și ia toată lățimea, de la o margine la alta;
 * titlul urmează dedesubt.
 *
 * Fotografia se schimbă singură, la opt secunde: cea nouă apare lent peste
 * cea veche, care rămâne pe loc până e acoperită. Fără apropiere, fără
 * deplasare — forma și conținutul nu se mișcă sub ochi, doar se înlocuiesc.
 * Cu mouse-ul deasupra sau cu focalizarea înăuntru, schimbarea se oprește.
 */
export default function Erou() {
  const fara_miscare = useReducedMotion();
  // Activă și anterioară într-o singură stare: se schimbă mereu împreună.
  const [{ activ, anterior }, setPozitie] = useState<{
    activ: number;
    anterior: number | null;
  }>({ activ: 0, anterior: null });
  const [oprit, setOprit] = useState(false);

  function mergiLa(index: number) {
    const urmator = (index + FOTOGRAFII.length) % FOTOGRAFII.length;
    setPozitie((p) =>
      urmator === p.activ ? p : { activ: urmator, anterior: p.activ },
    );
  }

  useEffect(() => {
    if (fara_miscare || oprit) return;
    const ceas = setInterval(
      () =>
        setPozitie((p) => ({
          activ: (p.activ + 1) % FOTOGRAFII.length,
          anterior: p.activ,
        })),
      INTERVAL,
    );
    return () => clearInterval(ceas);
  }, [fara_miscare, oprit]);

  const fotografie = FOTOGRAFII[activ];

  return (
    <section
      className={`${GRILA} bg-hartie`}
      onMouseEnter={() => setOprit(true)}
      onMouseLeave={() => setOprit(false)}
      onFocusCapture={() => setOprit(true)}
      onBlurCapture={() => setOprit(false)}
    >
      {/* Linia de sus: numele asociației și motto-ul, ca antetul unei pagini
          tipărite. Textul de aici nu se citește ca titlu — e etichetă. */}
      <div
        className={`${CONTINUT} flex items-baseline justify-between gap-6 border-b ${LINIE} py-4`}
      >
        <p className="font-titlu text-nota font-bold tracking-[0.2em] text-cerneala-slab uppercase">
          {ASOCIATIA.denumire}
        </p>
        <p className="scris text-corp text-caramiziu-600 sm:text-amplu">
          „{ASOCIATIA.motto}”
        </p>
      </div>

      {/* Textul e primul în pagină (titlul rămâne primul lucru citit),
          dar pe telefon se vede sub poză: clientul a cerut poza sus. */}
      <div className="order-2 col-start-2 col-end-14 pt-10 pb-16 lg:order-1 lg:col-end-7 lg:row-start-2 lg:pt-16 lg:pr-12 lg:pb-20">
        {/* Mărimea e dată de lățimea coloanei, nu de ecran: pe cinci
            coloane, „aducem bucurie” umple rândul fără să se rupă. */}
        <h1 className="text-[clamp(2.75rem,10.5vw,4.5rem)] leading-[0.95] tracking-[-0.035em] text-cerneala lg:text-[4.75rem] xl:text-[5.6rem]">
          Împreună,
          <br />
          <span className="text-caramiziu-500">aducem bucurie</span>
        </h1>

        <p className="mt-8 max-w-md text-amplu leading-relaxed text-cerneala-moale lg:mt-10 lg:text-[1.375rem]">
          Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere,
          terapie prin joacă și consiliere. Alătură-te celor care schimbă vieți.
        </p>

        {/* Cele trei elemente din 1.1, în ordinea cerută: butonul, singur pe
            rândul lui; dedesubt, pe aceeași linie, blocul SMS (informație,
            nu buton — de aceea nu e nici link, nici <button>) și linkul
            pentru ziua de naștere. Sub ele nu urmează niciun text: „zona
            rămâne curată”. */}
        <div className="mt-10 lg:mt-12">
          <ButonEditorial href={RUTE.doneaza} marime="mare" className="w-full sm:w-auto sm:min-w-64">
            Donează acum
            <Pictograma nume="sageata" className="size-5" />
          </ButonEditorial>

          <div className={`mt-8 grid gap-6 border-t ${LINIE} pt-6 sm:grid-cols-2`}>
            <p className={`sm:border-r sm:pr-6 ${LINIE}`}>
              <span className="block font-titlu text-nota font-bold tracking-[0.16em] text-cerneala-slab uppercase">
                Prin SMS
              </span>
              <span className="mt-2 block font-titlu text-h4 leading-tight font-extrabold text-cerneala">
                Trimite {SMS.text} la {SMS.numar}
              </span>
              <span className="mt-1 block text-mic text-cerneala-moale">
                {SMS.sumaLunara} lunar, direct din telefon
              </span>
            </p>

            <a
              href={LINKURI_EXTERNE.galantomZiuaTa}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <span className="block font-titlu text-nota font-bold tracking-[0.16em] text-cerneala-slab uppercase">
                Pe Galantom
              </span>
              <span className="mt-2 flex items-start gap-2 font-titlu text-h4 leading-tight font-extrabold text-caramiziu-600 transition-colors group-hover:text-caramiziu-700">
                Donează-ți ziua de naștere
                <Pictograma
                  nume="sageata"
                  className="mt-1.5 size-5 shrink-0 text-caramiziu-500"
                />
              </span>
              <span className="mt-1 block text-mic text-cerneala-moale">
                Strânge fonduri de ziua ta
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="order-1 col-start-1 col-end-15 lg:order-2 lg:col-start-7 lg:row-start-2 lg:pt-16">
        {/*
          Rama pozei: 4:3 pe telefon, 3:2 pe ecran lat. Pozele sunt 16:9
          sau 4:3; la 3:2 niciuna nu pierde mai mult de o șesime. Fără
          colțuri rotunjite, fără umbră: marginea pozei e marginea paginii.
        */}
        <div className="relative aspect-[4/3] overflow-hidden bg-hartie-umbra lg:aspect-[3/2]">
          {FOTOGRAFII.map((f, i) => {
            // Poza activă deasupra; cea dinainte rămâne întreagă sub ea
            // cât timp cea nouă apare — fără clipire gri la mijloc.
            const stare =
              i === activ
                ? "z-20 opacity-100"
                : i === anterior
                  ? "z-10 opacity-100"
                  : "z-0 opacity-0";
            return (
              <Image
                key={f.cale}
                src={f.cale}
                alt={f.alt}
                aria-hidden={i !== activ || undefined}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className={`object-cover transition-opacity duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${stare}`}
              />
            );
          })}
        </div>

        {/* Legenda foto, pe o linie sub poză: numărul, numele, comenzile.
            Se oprește la ultima coloană de conținut, nu la marginea
            ecranului — doar poza are voie să iasă din grilă. Marginea din
            dreapta e aceeași cu a grilei (vezi `grila.ts`). */}
        <div
          className={`mx-4 flex items-center justify-between gap-4 border-b ${LINIE} py-3 sm:mx-6 lg:ml-0 lg:mr-[max(2rem,calc((100vw-76rem)/2))]`}
        >
          <p aria-live="polite" className="flex items-baseline gap-3 font-titlu">
            <span className="text-nota font-bold tracking-[0.2em] text-caramiziu-500 tabular-nums">
              {String(activ + 1).padStart(2, "0")}&thinsp;/&thinsp;
              {String(FOTOGRAFII.length).padStart(2, "0")}
            </span>
            <span className="text-mic font-bold text-cerneala">{fotografie.legenda}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => mergiLa(activ - 1)}
              aria-label="Fotografia anterioară"
              className="flex size-10 items-center justify-center text-cerneala transition-colors hover:text-caramiziu-600"
            >
              <Pictograma nume="sageata" className="size-5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => mergiLa(activ + 1)}
              aria-label="Fotografia următoare"
              className="flex size-10 items-center justify-center text-cerneala transition-colors hover:text-caramiziu-600"
            >
              <Pictograma nume="sageata" className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
