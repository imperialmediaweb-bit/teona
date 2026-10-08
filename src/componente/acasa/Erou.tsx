"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { ASOCIATIA, LINKURI_EXTERNE, RUTE, SMS } from "@/date/asociatie";
import Buton from "@/componente/Buton";

/**
 * Fotografiile din sliderul de sus, preluate de pe site-ul WordPress.
 *
 * Textul alternativ e scris după ce m-am uitat la fiecare poză — descrie ce se
 * vede, nu ce ne-am dori să se vadă.
 *
 * Al treilea slide al site-ului vechi publica prenumele unui copil și lista lui
 * de diagnostice. Caietul de sarcini interzice asta („nu se publică nume și
 * nici diagnostice”). Poza rămâne, povestea nu.
 */
const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/448953804_497190052881338_6639192819081512267_n-1.webp",
    alt: "Copii, părinți și voluntari ai Asociației Teona Ariana, în tricouri albe, într-o tabără RESPIRO la munte",
    legenda: "Tabăra RESPIRO",
    /* Unde stau oamenii în poză, ca textul să nu cadă peste fețe. */
    incadrare: "center 28%",
  },
  {
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n-1.webp",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură din tabără",
    legenda: "Parcul de aventură",
    incadrare: "center 30%",
  },
  {
    cale: "/poze/2025/04/11zon_resized.webp",
    alt: "Un copil arată curcubeul pe care l-a făcut din bețișoare colorate, în sala de joacă de la Casa Teona",
    legenda: "Atelier la Casa Teona",
    incadrare: "70% center",
  },
] as const;

const INTERVAL = 7000;

/**
 * Secțiunea principală (1.1): o fotografie mare, pe toată lățimea, cu textul
 * peste ea.
 *
 * Fotografia se schimbă singură, cu o trecere lentă și o apropiere abia
 * perceptibilă — nu cu tăieturi bruște. Mișcarea rapidă și contrastul care sare
 * obosesc pe oricine și sunt greu de suportat pentru copiii cu
 * hipersensibilitate vizuală, cărora li se adresează asociația.
 *
 * Textul rămâne pe loc; se schimbă doar poza și legenda ei. Așa titlul cerut de
 * caiet e citibil tot timpul, nu doar o treime din el.
 */
export default function Erou() {
  const fara_miscare = useReducedMotion();
  const [activ, setActiv] = useState(0);
  const [oprit, setOprit] = useState(false);

  const mergiLa = useCallback((index: number) => {
    setActiv((index + FOTOGRAFII.length) % FOTOGRAFII.length);
  }, []);

  useEffect(() => {
    if (fara_miscare || oprit) return;
    const ceas = setInterval(
      () => setActiv((i) => (i + 1) % FOTOGRAFII.length),
      INTERVAL,
    );
    return () => clearInterval(ceas);
  }, [fara_miscare, oprit]);

  const fotografie = FOTOGRAFII[activ];

  return (
    <section
      className="relative isolate flex min-h-[min(44rem,88svh)] items-end overflow-hidden bg-cerneala"
      onMouseEnter={() => setOprit(true)}
      onMouseLeave={() => setOprit(false)}
      onFocusCapture={() => setOprit(true)}
      onBlurCapture={() => setOprit(false)}
    >
      {/* Fotografia */}
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          <motion.div
            key={fotografie.cale}
            initial={{ opacity: 0, scale: fara_miscare ? 1 : 1.07 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: fara_miscare ? 0 : 1.3, ease: [0.4, 0, 0.2, 1] },
              scale: {
                duration: fara_miscare ? 0 : INTERVAL / 1000 + 1.3,
                ease: "linear",
              },
            }}
            className="absolute inset-0"
          >
            <Image
              src={fotografie.cale}
              alt={fotografie.alt}
              fill
              priority={activ === 0}
              sizes="100vw"
              style={{ objectPosition: fotografie.incadrare }}
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Trei straturi, nu unul: un voal uniform fade poza; aici doar baza se
            întunecă, destul cât textul să aibă contrast, cât să rămână poza. */}
        <div className="absolute inset-0 bg-gradient-to-t from-cerneala via-cerneala/55 to-cerneala/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-cerneala/75 via-cerneala/25 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cerneala/45 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-24 pb-10 sm:px-6 lg:px-8 lg:pt-32 lg:pb-12">
        <div className="max-w-3xl">
          <p className="scris text-h4 text-miere-300">„{ASOCIATIA.motto}”</p>

          <h1 className="mt-3 text-[2.75rem] leading-[1.02] text-hartie sm:text-h1 lg:text-[5rem]">
            Împreună,{" "}
            <span className="relative inline-block">
              aducem bucurie
              <svg
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-caramiziu-500 sm:-bottom-2 sm:h-4"
              >
                <path
                  d="M2 9C60 3 120 2 180 5c40 2 80 5 118 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-amplu text-hartie/85">
            Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere,
            terapie prin joacă și consiliere. Alătură-te celor care schimbă vieți.
          </p>

          {/* Cele trei elemente din 1.1, în ordinea cerută. Blocul SMS e
              informație, nu buton — de aceea nu e nici link, nici <button>. */}
          <div className="mt-9 flex flex-wrap items-stretch gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează acum
            </Buton>

            <p className="flex flex-col justify-center rounded-card border border-hartie/20 bg-hartie/10 px-6 py-3 backdrop-blur-md">
              <span className="font-titlu font-bold text-miere-300">
                Trimite {SMS.text} la {SMS.numar}
              </span>
              <span className="text-mic text-hartie/75">
                {SMS.sumaLunara} lunar, direct din telefon
              </span>
            </p>

            <a
              href={LINKURI_EXTERNE.galantomZiuaTa}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-card border border-hartie/20 px-5 py-3 text-hartie transition-colors duration-300 hover:border-miere-300 hover:bg-hartie/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6 shrink-0 text-miere-300"
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
                <span className="block font-titlu font-bold">
                  Donează-ți ziua de naștere
                </span>
                <span className="block text-mic text-hartie/70">
                  Strânge fonduri de ziua ta
                </span>
              </span>
            </a>
          </div>
        </div>

        {/* Legenda pozei și comenzile, pe acelaşi rând, jos */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-hartie/15 pt-5">
          <p aria-live="polite" className="scris text-amplu text-miere-300">
            {fotografie.legenda}
          </p>

          <div className="flex items-center gap-3">
            {FOTOGRAFII.map((f, i) => (
              <button
                key={f.cale}
                type="button"
                onClick={() => mergiLa(i)}
                aria-label={`Fotografia ${i + 1}: ${f.legenda}`}
                aria-current={i === activ}
                className="group py-2"
              >
                {/* Bara care se umple arată și unde ești, și cât mai e. */}
                <span
                  className={`block h-1 overflow-hidden rounded-full transition-all duration-500 ease-cald ${
                    i === activ ? "w-16 bg-hartie/25" : "w-7 bg-hartie/25 group-hover:bg-hartie/50"
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
