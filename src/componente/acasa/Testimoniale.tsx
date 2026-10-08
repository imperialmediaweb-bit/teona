"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

export type Testimonial = {
  /** Citat scurt, 20–35 de cuvinte (1.8). */
  citat: string;
  /** Doar prenumele și rolul: „Maria, mama unui băiat din tabără”. */
  semnatura: string;
};

/**
 * „Ce spun familiile și voluntarii noștri” (1.8).
 *
 * Fără derulare automată, fără fotografii, fără nume de familie — așa cere
 * caietul. Se răsfoiește cu „Anterior” și „Următorul”; pe telefon se vede unul
 * odată.
 *
 * Secțiunea nu se randează dacă nu există testimoniale. Nu inventăm cuvinte pe
 * care nu ni le-a spus niciun părinte.
 */
export default function Testimoniale({
  testimoniale,
}: {
  testimoniale: Testimonial[];
}) {
  const [activ, setActiv] = useState(0);
  const [directie, setDirectie] = useState(1);
  const fara_miscare = useReducedMotion();

  if (testimoniale.length === 0) return null;

  function muta(pas: number) {
    setDirectie(pas);
    setActiv((i) => (i + pas + testimoniale.length) % testimoniale.length);
  }

  const curent = testimoniale[activ];

  return (
    <section className="bg-hartie py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Rândul scris de mână și fraza de sub titlu sunt textele de la
            testimonialele de pe site-ul vechi; titlul e cel din caiet. */}
        <p className="scris text-center text-amplu text-caramiziu-600">
          Oameni frumoși, cuvinte de suflet
        </p>
        <h2 className="mt-2 text-center text-h2 text-cerneala">
          Ce spun familiile și voluntarii noștri
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-cerneala-moale">
          Fiecare cuvânt reflectă emoție, recunoștință și bucuria de a face
          parte din această misiune.
        </p>

        <div className="relative mt-12 min-h-56">
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={activ}
              initial={
                fara_miscare ? false : { opacity: 0, x: directie * 24 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={fara_miscare ? undefined : { opacity: 0, x: directie * -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <svg
                viewBox="0 0 32 24"
                aria-hidden="true"
                className="mx-auto h-7 w-auto text-miere-300"
                fill="currentColor"
              >
                <path d="M13 24V13.5C13 6 8.5 1 1 0v5c4 1 6 4 6 8H1v11h12zm18 0V13.5C31 6 26.5 1 19 0v5c4 1 6 4 6 8h-6v11h12z" />
              </svg>
              <blockquote className="mt-5 font-titlu text-h4 leading-snug text-cerneala sm:text-h3">
                „{curent.citat}”
              </blockquote>
              <figcaption className="mt-6 font-titlu font-semibold text-caramiziu-600">
                {curent.semnatura}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {testimoniale.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => muta(-1)}
              className="flex items-center gap-2 rounded-full border-2 border-cerneala/15 px-5 py-2.5 font-titlu text-mic font-semibold text-cerneala transition hover:border-caramiziu-500 hover:text-caramiziu-600"
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
              Anterior
            </button>
            <p className="font-titlu text-mic text-cerneala-moale tabular-nums">
              {activ + 1} / {testimoniale.length}
            </p>
            <button
              type="button"
              onClick={() => muta(1)}
              className="flex items-center gap-2 rounded-full border-2 border-cerneala/15 px-5 py-2.5 font-titlu text-mic font-semibold text-cerneala transition hover:border-caramiziu-500 hover:text-caramiziu-600"
            >
              Următorul
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
        )}
      </div>
    </section>
  );
}
