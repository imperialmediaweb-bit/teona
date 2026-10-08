"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { LINKURI_EXTERNE, RUTE, SMS } from "@/date/asociatie";
import Buton from "@/componente/Buton";

/**
 * Fotografiile din sliderul de sus, preluate de pe site-ul WordPress.
 *
 * Textul alternativ e scris după ce m-am uitat la fiecare poză — descrie ce se
 * vede, nu ce ne-am dori să se vadă. Legenda e scurtă și verificabilă din poză.
 *
 * Al treilea slide al site-ului vechi publica prenumele unui copil și lista lui
 * de diagnostice. Caietul de sarcini interzice asta („nu se publică nume și nici
 * diagnostice”). Poza rămâne, povestea nu.
 */
const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/448953804_497190052881338_6639192819081512267_n-1.webp",
    alt: "Copii, părinți și voluntari ai Asociației Teona Ariana, în tricouri albe, într-o tabără RESPIRO la munte",
    legenda: "Tabăra RESPIRO",
  },
  {
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n-1.webp",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură din tabără",
    legenda: "Parc de aventură, în tabără",
  },
  {
    cale: "/poze/2025/04/11zon_resized.webp",
    alt: "Un copil arată curcubeul pe care l-a făcut din bețișoare colorate, în sala de joacă de la Casa Teona",
    legenda: "Atelier creativ la Casa Teona",
  },
] as const;

const INTERVAL = 6000;

export default function Erou() {
  const fara_miscare = useReducedMotion();
  const [activ, setActiv] = useState(0);
  const [oprit, setOprit] = useState(false);

  const mergiLa = useCallback((index: number) => {
    setActiv((index + FOTOGRAFII.length) % FOTOGRAFII.length);
  }, []);

  useEffect(() => {
    // Cine a cerut mai puțină mișcare primește o poză fixă, nu un carusel.
    if (fara_miscare || oprit) return;
    const ceas = setInterval(() => setActiv((i) => (i + 1) % FOTOGRAFII.length), INTERVAL);
    return () => clearInterval(ceas);
  }, [fara_miscare, oprit]);

  const fotografie = FOTOGRAFII[activ];

  return (
    <section
      className="relative isolate overflow-hidden bg-cerneala"
      onMouseEnter={() => setOprit(true)}
      onMouseLeave={() => setOprit(false)}
      onFocusCapture={() => setOprit(true)}
      onBlurCapture={() => setOprit(false)}
    >
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          <motion.div
            key={fotografie.cale}
            initial={{ opacity: 0, scale: fara_miscare ? 1 : 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: fara_miscare ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: fara_miscare ? 0 : INTERVAL / 1000 + 1.1, ease: "linear" },
            }}
            className="absolute inset-0"
          >
            <Image
              src={fotografie.cale}
              alt={fotografie.alt}
              fill
              priority={activ === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
        {/* Două straturi: unul care întunecă uniform, altul care îngroașă
            stânga, unde stă textul. Contrastul trebuie să țină pe orice poză. */}
        <div className="absolute inset-0 bg-cerneala/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-cerneala/85 via-cerneala/45 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-16 pb-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16 lg:px-8 lg:pt-28 lg:pb-20">
        <div className="max-w-2xl">
          <p className="scris text-h4 text-miere-300">„Nimic fără Dumnezeu”</p>

          <h1 className="mt-3 text-[2.6rem] leading-[1.05] text-hartie sm:text-h1 lg:text-afis">
            Împreună,{" "}
            <span className="relative inline-block">
              aducem bucurie
              <svg
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-caramiziu-500 sm:-bottom-2 sm:h-3.5"
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
              informație, nu buton — de aceea nu e nici link, nici <button>.
              Donația și SMS-ul stau pe primul rând, ziua de naștere pe al
              doilea: înghesuite toate trei, se rupeau oricum, dar urât. */}
          <div className="mt-9 flex flex-wrap items-stretch gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează acum
            </Buton>

            <p className="flex flex-col justify-center rounded-full border border-hartie/25 bg-hartie/10 px-6 py-2.5 text-hartie backdrop-blur-sm">
              <span className="font-titlu font-bold text-miere-300">
                Trimite {SMS.text} la {SMS.numar}
              </span>
              <span className="text-mic text-hartie/75">
                {SMS.sumaLunara} lunar, direct din telefon
              </span>
            </p>
          </div>

          <a
            href={LINKURI_EXTERNE.galantomZiuaTa}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex items-center gap-3 text-hartie"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-hartie/30 transition group-hover:border-miere-300 group-hover:bg-miere-300 group-hover:text-cerneala">
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10.5h16v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-8zM3.5 7.5h17v3h-17v-3zM12 7.5v12M12 7.5S10.5 3 8.2 3a2.1 2.1 0 0 0 0 4.5H12zM12 7.5S13.5 3 15.8 3a2.1 2.1 0 0 1 0 4.5H12z" />
              </svg>
            </span>
            <span>
              <span className="block font-titlu font-bold underline-offset-4 group-hover:underline">
                Donează-ți ziua de naștere
              </span>
              <span className="block text-mic text-hartie/70">
                Strânge fonduri de ziua ta
              </span>
            </span>
          </a>
        </div>

        {/* Comenzile sliderului. Legenda spune ce se vede în poza curentă. */}
        <div className="flex items-center gap-4 lg:justify-end lg:pb-2">
          <div className="min-w-0 flex-1 lg:flex-none lg:text-right">
            <p
              aria-live="polite"
              className="truncate font-titlu text-mic font-semibold text-hartie/90"
            >
              {fotografie.legenda}
            </p>
            <p className="text-nota text-hartie/55">
              {activ + 1} din {FOTOGRAFII.length}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {FOTOGRAFII.map((f, i) => (
              <button
                key={f.cale}
                type="button"
                onClick={() => mergiLa(i)}
                aria-label={`Fotografia ${i + 1}: ${f.legenda}`}
                aria-current={i === activ}
                className={`h-1.5 rounded-full transition-all duration-300 ease-cald ${
                  i === activ
                    ? "w-8 bg-caramiziu-500"
                    : "w-3 bg-hartie/40 hover:bg-hartie/70"
                }`}
              />
            ))}
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => mergiLa(activ - 1)}
              aria-label="Fotografia anterioară"
              className="flex size-10 items-center justify-center rounded-full border border-hartie/25 text-hartie transition hover:border-hartie/60 hover:bg-hartie/10"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 4L6 10l6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => mergiLa(activ + 1)}
              aria-label="Fotografia următoare"
              className="flex size-10 items-center justify-center rounded-full border border-hartie/25 text-hartie transition hover:border-hartie/60 hover:bg-hartie/10"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 4l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
