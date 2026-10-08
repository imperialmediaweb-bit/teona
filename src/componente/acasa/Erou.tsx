"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ASOCIATIA, LINKURI_EXTERNE, RUTE, SMS } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";

/**
 * Fotografiile din sliderul de sus.
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

const INTERVAL = 7000;

/**
 * Secțiunea principală (1.1).
 *
 * Fotografia nu mai stă sub text, ci lângă el. Varianta dinainte întindea poza
 * pe toată lățimea ecranului, o tăia într-o fâșie joasă și punea peste ea trei
 * straturi de portocaliu închis ca textul alb să se poată citi. Rezultatul:
 * o poză cafenie, ca una veche, și turtită. Clientul a spus-o exact așa.
 *
 * Aici poza stă în rama ei, în proporții apropiate de cele originale, fără
 * niciun voal — iarba e verde, cerul albastru, tricourile albe. Textul are
 * coloana lui, pe hârtie caldă, și nu mai are nevoie de niciun strat ca să
 * se vadă. Pe telefon poza vine prima, mare, apoi titlul.
 *
 * Fotografia se schimbă singură, la șapte secunde: cea nouă apare lent peste
 * cea veche, care rămâne pe loc până e acoperită. Fără apropiere, fără
 * deplasare — forma și conținutul nu se mișcă sub ochi, doar se înlocuiesc.
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
      className="granulatie relative isolate overflow-hidden bg-hartie-calda"
      onMouseEnter={() => setOprit(true)}
      onMouseLeave={() => setOprit(false)}
      onFocusCapture={() => setOprit(true)}
      onBlurCapture={() => setOprit(false)}
    >
      {/* Două pete de culoare, foarte spălate, în loc de un fundal plat.
          Se mișcă la limita observabilului (vezi `.pata` în globals.css). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className="pata absolute -top-32 right-[-8%] size-[30rem] rounded-full bg-miere-100/70 blur-3xl" />
        <span className="pata pata-2 absolute bottom-[-10rem] left-[-8rem] size-[26rem] rounded-full bg-caramiziu-100/60 blur-3xl" />
        <Decor semn="stea" className="pluteste-lent absolute top-5 right-[4%] hidden size-10 text-miere-400 lg:block" />
        <Decor semn="soare" className="pluteste-lent absolute right-[3%] bottom-8 size-9 text-caramiziu-300 lg:bottom-14 lg:size-12" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-14 lg:px-8 lg:pt-16 lg:pb-32">
        {/* Textul e primul în pagină (titlul rămâne primul lucru citit),
            dar pe telefon se vede sub poză: clientul a cerut poza sus. */}
        <div className="order-2 lg:order-1">
          <p className="scris text-amplu text-caramiziu-600">„{ASOCIATIA.motto}”</p>

          {/* Mărimea e aleasă ca „aducem bucurie” să stea pe un singur rând
              în coloana lui, de la 1024 px în sus. */}
          <h1 className="mt-3 text-h1 text-cerneala lg:text-[3.25rem] xl:text-[4rem]">
            Împreună,
            <br />
            <span className="relative inline-block text-caramiziu-500">
              aducem bucurie
              <svg
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-3 w-full text-miere-400 sm:-bottom-2 sm:h-4"
              >
                <path
                  d="M3 11C70 4 150 3 215 6c30 1.5 55 4 82 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-amplu text-cerneala-moale">
            Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere,
            terapie prin joacă și consiliere. Alătură-te celor care schimbă vieți.
          </p>

          {/* Cele trei elemente din 1.1, în ordinea cerută. Blocul SMS e
              informație, nu buton — de aceea nu e nici link, nici <button>.
              Sub ele nu mai urmează niciun text: „zona rămâne curată”. */}
          <div className="mt-9 flex flex-wrap items-stretch gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează acum
            </Buton>

            <p className="flex flex-col justify-center rounded-full border-2 border-miere-300 bg-miere-50 px-6 py-2 leading-tight">
              <span className="font-titlu font-bold text-cerneala">
                Trimite {SMS.text} la {SMS.numar}
              </span>
              <span className="text-nota text-cerneala-moale">
                {SMS.sumaLunara} lunar, direct din telefon
              </span>
            </p>

            <Buton
              href={LINKURI_EXTERNE.galantomZiuaTa}
              varianta="contur"
              className="gap-3 text-left leading-tight"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6 shrink-0 text-caramiziu-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10.5h16v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-8zM3.5 7.5h17v3h-17v-3zM12 7.5v12M12 7.5S10.5 3 8.2 3a2.1 2.1 0 0 0 0 4.5H12zM12 7.5S13.5 3 15.8 3a2.1 2.1 0 0 1 0 4.5H12z" />
              </svg>
              <span>
                <span className="block">Donează-ți ziua de naștere</span>
                <span className="block text-nota font-normal text-cerneala-moale">
                  Strânge fonduri de ziua ta
                </span>
              </span>
            </Buton>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative">
            {/*
              Rama pozei: 4:3 pe telefon, 3:2 pe ecran lat. Pozele sunt 16:9
              sau 4:3; la 3:2 niciuna nu pierde mai mult de o șesime, în loc
              de jumătate ca înainte. Umbra e colorată, nu gri, ca la restul
              fotografiilor din site.
            */}
            <div className="colt-a relative aspect-[4/3] overflow-hidden bg-hartie-umbra shadow-[0_32px_64px_-32px_rgba(247,79,34,0.5)] lg:aspect-[3/2]">
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
                    sizes="(min-width: 1280px) 640px, (min-width: 1024px) 52vw, 100vw"
                    className={`object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${stare}`}
                  />
                );
              })}
            </div>

            <p
              aria-live="polite"
              className="colt-mic-b absolute -bottom-4 left-5 z-30 bg-caramiziu-500 px-5 py-2 shadow-[0_12px_28px_-12px_rgba(247,79,34,0.9)]"
            >
              <span className="scris text-amplu leading-none text-hartie">
                {fotografie.legenda}
              </span>
            </p>
          </div>

          {/* Comenzile stau sub poză, nu peste ea. */}
          <div className="mt-9 flex items-center justify-end gap-3 pr-1">
            {FOTOGRAFII.map((f, i) => (
              <button
                key={f.cale}
                type="button"
                onClick={() => mergiLa(i)}
                aria-label={`Fotografia ${i + 1}: ${f.legenda}`}
                aria-current={i === activ}
                // Zona de atins e de 44 px, cât cere degetul; bara colorată rămâne
                // subțire. Fără asta, ținta avea 16×22 px și se rata.
                className="group grid h-11 place-items-center px-1"
              >
                {/* Bara care se umple arată și unde ești, și cât mai e. */}
                <span
                  className={`block h-1.5 overflow-hidden rounded-full transition-all duration-500 ease-cald ${
                    i === activ
                      ? "w-16 bg-caramiziu-100"
                      : "w-4 bg-cerneala/15 group-hover:bg-caramiziu-300"
                  }`}
                >
                  {i === activ && (
                    <span
                      key={`${activ}-${oprit}`}
                      className={`block h-full rounded-full bg-caramiziu-500 ${
                        fara_miscare || oprit ? "w-full" : "umple"
                      }`}
                      style={{ animationDuration: `${INTERVAL}ms` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
