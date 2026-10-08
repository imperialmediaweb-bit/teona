"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CIFRE } from "@/date/asociatie";

/** 1.500 se scrie cu punct în română; 33 și 80 rămân cum sunt. */
const formateaza = new Intl.NumberFormat("ro-RO").format;

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
      duration: 1.4,
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
 * Caietul cere ca aceeași bandă să apară pe prima pagină și pe Despre noi,
 * „preluată automat din aceleași date, ca să nu apară variante diferite”.
 * De aceea componenta nu primește cifrele ca proprietăți: le citește din sursă.
 */
export default function Cifre({ pe = "deschis" }: { pe?: "deschis" | "inchis" }) {
  const inchis = pe === "inchis";

  return (
    <ul
      className={`grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 ${
        inchis ? "text-hartie" : "text-cerneala"
      }`}
    >
      {CIFRE.map((cifra) => (
        <li key={cifra.eticheta} className="text-center">
          <p
            className={`font-titlu text-[2.75rem] leading-none font-bold lg:text-[3.5rem] ${
              inchis ? "text-miere-300" : "text-caramiziu-500"
            }`}
          >
            <Numar valoare={cifra.valoare} sufix={cifra.sufix} />
          </p>
          <p
            className={`mt-2 font-titlu text-mic font-semibold ${
              inchis ? "text-hartie/70" : "text-cerneala-moale"
            }`}
          >
            {cifra.eticheta}
          </p>
        </li>
      ))}
    </ul>
  );
}
