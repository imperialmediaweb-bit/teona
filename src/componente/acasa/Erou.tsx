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
    incadrare: "center 30%",
  },
  {
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n-1.webp",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură din tabără",
    legenda: "Parcul de aventură",
    incadrare: "center 32%",
  },
  {
    cale: "/poze/2025/04/11zon_resized.webp",
    alt: "Un copil arată curcubeul pe care l-a făcut din bețișoare colorate, în sala de joacă de la Casa Teona",
    legenda: "Atelier la Casa Teona",
    incadrare: "62% center",
  },
] as const;

const INTERVAL = 7000;

/**
 * Secțiunea principală (1.1).
 *
 * Deliberat **nu** e banda cu fotografie pe toată lățimea și text alb peste ea:
 * aia e exact așezarea șablonului de ONG de pe care plecăm, și arată la fel pe
 * o mie de site-uri. Aici textul stă pe hârtie, la mărimea lui, iar fotografia
 * e mare, într-o arcadă care iese din pagină pe dreapta.
 *
 * Arcada nu e un capriciu: o formă rotunjită sus citește a poartă, a intrare —
 * potrivit pentru o casă în care copiii sunt primiți. Și o deosebește imediat
 * de dreptunghiul plin al oricărui șablon.
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
    <section className="granulatie relative overflow-hidden bg-hartie">
      {/* Pete moi de culoare, foarte palide, care plutesc încet. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="pata pata-1 absolute -top-32 -left-32 size-[30rem] rounded-full bg-tenta-cald blur-2xl" />
        <span className="pata pata-3 absolute bottom-0 left-1/3 size-96 rounded-full bg-tenta-turcoaz blur-2xl" />
      </div>

      <div
        className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-center lg:gap-10 lg:px-8 lg:pt-14 lg:pb-20"
        onMouseEnter={() => setOprit(true)}
        onMouseLeave={() => setOprit(false)}
        onFocusCapture={() => setOprit(true)}
        onBlurCapture={() => setOprit(false)}
      >
        {/* ── Textul ─────────────────────────────────────────────────────── */}
        <div className="order-2 max-w-2xl lg:order-1">
          <p className="scris text-h4 text-caramiziu-600">„{ASOCIATIA.motto}”</p>

          <h1 className="mt-2 text-[2.9rem] leading-[0.98] text-cerneala sm:text-[4rem] lg:text-[4.75rem]">
            Împreună,
            <br />
            <span className="relative inline-block">
              aducem
              <svg
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-2 left-0 h-3 w-full text-miere-300"
              >
                <path
                  d="M3 11C70 4 150 3 215 6c30 1.5 55 4 82 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            <span className="text-caramiziu-500">bucurie</span>
          </h1>

          <p className="mt-8 max-w-lg text-amplu text-cerneala-moale">
            Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere,
            terapie prin joacă și consiliere. Alătură-te celor care schimbă vieți.
          </p>

          {/* Cele trei elemente din 1.1, în ordinea cerută. Blocul SMS e
              informație, nu buton — de aceea nu e nici link, nici <button>. */}
          <div className="mt-9 flex flex-wrap items-stretch gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează acum
            </Buton>

            <p className="flex flex-col justify-center rounded-card border-2 border-miere-200 bg-tenta-miere px-5 py-2.5">
              <span className="font-titlu font-bold text-miere-700">
                Trimite {SMS.text} la {SMS.numar}
              </span>
              <span className="text-mic text-cerneala-moale">
                {SMS.sumaLunara} lunar, direct din telefon
              </span>
            </p>
          </div>

          <a
            href={LINKURI_EXTERNE.galantomZiuaTa}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex items-center gap-3"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-turcoaz-100 text-turcoaz-700 transition-all duration-300 ease-cald group-hover:scale-110 group-hover:bg-turcoaz-500 group-hover:text-hartie motion-reduce:group-hover:scale-100">
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
              <span className="block font-titlu font-bold text-cerneala underline-offset-4 group-hover:underline">
                Donează-ți ziua de naștere
              </span>
              <span className="block text-mic text-cerneala-moale">
                Strânge fonduri de ziua ta
              </span>
            </span>
          </a>
        </div>

        {/* ── Arcada cu fotografia ───────────────────────────────────────── */}
        <div className="relative order-1 lg:order-2 lg:-mr-16 xl:-mr-24">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
            {/* Conturul gros, decalat — ca o umbră desenată, nu estompată. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-full rounded-b-amplu border-2 border-caramiziu-300"
            />

            <div className="relative size-full overflow-hidden rounded-t-full rounded-b-amplu bg-hartie-calda">
              <AnimatePresence initial={false}>
                <motion.div
                  key={fotografie.cale}
                  initial={{ opacity: 0, scale: fara_miscare ? 1 : 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: {
                      duration: fara_miscare ? 0 : 1.2,
                      ease: [0.4, 0, 0.2, 1],
                    },
                    scale: {
                      duration: fara_miscare ? 0 : INTERVAL / 1000 + 1.2,
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
                    sizes="(min-width: 1024px) 520px, 92vw"
                    style={{ objectPosition: fotografie.incadrare }}
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Legenda, pe o pastilă care iese din arcadă. */}
            <p
              aria-live="polite"
              className="absolute -bottom-3 left-6 rounded-full bg-cerneala px-5 py-2 shadow-[0_10px_26px_-12px_rgba(35,35,35,0.6)]"
            >
              <span className="scris text-corp leading-none text-miere-300">
                {fotografie.legenda}
              </span>
            </p>
          </div>

          {/* Comenzile, sub arcadă */}
          <div className="mt-9 flex items-center justify-center gap-3">
            {FOTOGRAFII.map((f, i) => (
              <button
                key={f.cale}
                type="button"
                onClick={() => mergiLa(i)}
                aria-label={`Fotografia ${i + 1}: ${f.legenda}`}
                aria-current={i === activ}
                className="group py-2"
              >
                <span
                  className={`block h-1.5 overflow-hidden rounded-full transition-all duration-500 ease-cald ${
                    i === activ
                      ? "w-14 bg-hartie-umbra"
                      : "w-3 bg-hartie-umbra group-hover:bg-caramiziu-200"
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
