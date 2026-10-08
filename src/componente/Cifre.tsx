"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CIFRE } from "@/date/asociatie";

/** 1.500 se scrie cu punct în română; 33 și 80 rămân cum sunt. */
const formateaza = new Intl.NumberFormat("ro-RO").format;

/** Culorile se rotesc, ca cele patru cifre să nu arate ca un singur bloc. */
const CULORI = [
  { cifra: "text-caramiziu-500", linie: "text-caramiziu-200" },
  { cifra: "text-miere-500", linie: "text-miere-200" },
  { cifra: "text-turcoaz-500", linie: "text-turcoaz-200" },
  { cifra: "text-caramiziu-600", linie: "text-caramiziu-200" },
] as const;

function Numar({ valoare, sufix }: { valoare: number; sufix: string }) {
  const referinta = useRef<HTMLSpanElement>(null);
  const vizibil = useInView(referinta, { once: true, margin: "-80px" });
  const fara_miscare = useReducedMotion();
  const [afisat, setAfisat] = useState(fara_miscare ? valoare : 0);

  useEffect(() => {
    if (!vizibil || fara_miscare) return;
    // Numărul crește doar pentru cifre reale — niciuna nu e inventată aici,
    // toate vin din `src/date/asociatie.ts`.
    const comanda = animate(0, valoare, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setAfisat(Math.round(v)),
    });
    return () => comanda.stop();
  }, [vizibil, valoare, fara_miscare]);

  return (
    <span ref={referinta} className="tabular-nums">
      {formateaza(afisat)}
      {sufix}
    </span>
  );
}

/**
 * Banda cu cele patru cifre.
 *
 * Nu e bara întunecată cu contoare pe care o are orice șablon de ONG. Cifrele
 * stau pe hârtie, mari, fiecare în culoarea ei, cu o linie trasă de mână
 * dedesubt — ca într-un carnet, nu ca într-un raport.
 *
 * Caietul cere ca aceeași bandă să apară pe prima pagină și pe Despre noi,
 * „preluată automat din aceleași date, ca să nu apară variante diferite”.
 * De aceea componenta nu primește cifrele ca proprietăți: le citește din sursă.
 */
export default function Cifre() {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
      {CIFRE.map((cifra, i) => (
        <li key={cifra.eticheta} className="group text-center">
          <p
            className={`font-titlu text-[3.25rem] leading-none font-extrabold transition-transform duration-500 ease-cald group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0 lg:text-[4.25rem] ${CULORI[i].cifra}`}
          >
            <Numar valoare={cifra.valoare} sufix={cifra.sufix} />
          </p>

          {/* Linia de sub cifră, desenată: nu o bară dreaptă, ci o tușă. */}
          <svg
            viewBox="0 0 160 10"
            preserveAspectRatio="none"
            aria-hidden="true"
            className={`mx-auto mt-2 h-2 w-24 ${CULORI[i].linie}`}
          >
            <path
              d="M4 6.5C40 2.5 80 2 120 4.5c12 .7 22 1.6 36 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          <p className="mt-3 font-titlu text-mic font-semibold text-cerneala-moale">
            {cifra.eticheta}
          </p>
        </li>
      ))}
    </ul>
  );
}
