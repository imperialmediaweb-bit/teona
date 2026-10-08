"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CIFRE } from "@/date/asociatie";
import { Pata } from "./Ilustratii";

/** 1.500 se scrie cu punct în română; 33 și 80 rămân cum sunt. */
const formateaza = new Intl.NumberFormat("ro-RO").format;

/** Culorile se rotesc, ca cele patru cifre să nu arate ca un singur bloc. */
const CULORI = [
  { cifra: "text-caramiziu-600", pata: "text-caramiziu-100" },
  { cifra: "text-miere-600", pata: "text-miere-100" },
  { cifra: "text-turcoaz-600", pata: "text-turcoaz-100" },
  { cifra: "text-caramiziu-600", pata: "text-miere-100" },
] as const;

/**
 * `useLayoutEffect` rulează după ce React a scris în DOM, dar **înainte** ca
 * browserul să deseneze. Pe server nu există desenare, iar React se plânge
 * dacă îl găsește acolo — de aceea pe server folosim varianta care nu face
 * nimic.
 */
const inainteDeDesenare =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function Numar({ valoare, sufix }: { valoare: number; sufix: string }) {
  const referinta = useRef<HTMLSpanElement>(null);
  const vizibil = useInView(referinta, { once: true, margin: "-80px" });
  const fara_miscare = useReducedMotion();

  /*
    Pornim de la cifra adevărată, nu de la zero.

    HTML-ul trimis de server conține cifra corectă; numărătoarea e doar un
    adaos, care se coboară la zero abia în browser, înainte de prima desenare.
    Dacă scriptul cade sau întârzie, omul citește „33 tabere”, nu „0 tabere” —
    pe site-ul unei asociații, asta contează mai mult decât orice animație.
  */
  const [afisat, setAfisat] = useState(valoare);

  inainteDeDesenare(() => {
    if (!fara_miscare) setAfisat(0);
    // Numai la montare: după ce numărătoarea a pornit, nu mai resetăm nimic.
  }, []);

  useEffect(() => {
    if (!vizibil || fara_miscare) return;
    // Cifrele vin din `src/date/asociatie.ts`; niciuna nu e inventată aici.
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
 * Bara cu cifre (1.2), ca patru pete de hârtie colorată lipite pe pagină.
 *
 * Fiecare cifră stă pe o pată tăiată de mână, cu eticheta scrisă dedesubt cu
 * scrisul de mână al site-ului. Cele patru pete au forme diferite, ca și cum
 * ar fi fost tăiate pe rând, nu ștanțate.
 *
 * Caietul cere ca aceeași bandă să apară pe prima pagină și pe Despre noi,
 * „preluată automat din aceleași date”. De aceea componenta nu primește
 * cifrele ca proprietăți: le citește din sursă.
 */
export default function CifreIlustrate() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
      {CIFRE.map((cifra, i) => (
        <li key={cifra.eticheta} className="relative isolate text-center">
          <div className="relative mx-auto flex aspect-square w-36 items-center justify-center sm:w-44 lg:w-48">
            <Pata
              varianta={i}
              className={`absolute inset-0 -z-10 size-full ${CULORI[i].pata} ${
                i % 2 === 0 ? "-rotate-3" : "rotate-6"
              }`}
            />
            <p
              className={`font-titlu text-[2.75rem] leading-none font-extrabold sm:text-[3.25rem] lg:text-[3.75rem] ${CULORI[i].cifra}`}
            >
              <Numar valoare={cifra.valoare} sufix={cifra.sufix} />
            </p>
          </div>
          <p className="scris mt-2 text-amplu text-cerneala">{cifra.eticheta}</p>
        </li>
      ))}
    </ul>
  );
}
