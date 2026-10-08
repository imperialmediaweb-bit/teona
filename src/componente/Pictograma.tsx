import type { SVGProps } from "react";

/**
 * Pictogramele site-ului, desenate aici.
 *
 * Linie de 1,75 px, colțuri rotunde, aceeași cutie de 24 — ca să arate ca o
 * familie, nu ca o colecție adunată din mai multe seturi.
 *
 * **Nu există piesă de puzzle.** E simbolul cel mai folosit pentru autism și,
 * tocmai de aceea, cel mai contestat chiar de oamenii autiști: sugerează o
 * piesă lipsă, un om incomplet, ceva de rezolvat. Multe asociații de
 * autoreprezentare îl resping explicit. Unde e nevoie de un semn, folosim
 * `infinit` — bucla neurodiversității, aleasă chiar de comunitate.
 */
const CAI: Record<string, string | string[]> = {
  // ── Sprijin și donații ──────────────────────────────────────────────────
  inima:
    "M12 20.5S4 15.6 4 10.3A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 8 2.4c0 5.3-8 10.2-8 10.2z",
  telefon:
    "M7.5 3.5h-2a2 2 0 0 0-2 2.2 16.5 16.5 0 0 0 14.8 14.8 2 2 0 0 0 2.2-2v-2a1.4 1.4 0 0 0-1.2-1.4l-2.4-.4a1.4 1.4 0 0 0-1.4.7l-.7 1.3a12.4 12.4 0 0 1-6.6-6.6l1.3-.7a1.4 1.4 0 0 0 .7-1.4l-.4-2.4A1.4 1.4 0 0 0 7.5 3.5z",
  document: [
    "M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5z",
    "M14 3.5V8h4.5M9 13h6M9 16.5h4",
  ],
  cladire: [
    "M4 20.5h16M5.5 20.5V6l6.5-2.5L18.5 6v14.5",
    "M9.5 10h1M13.5 10h1M9.5 13.5h1M13.5 13.5h1M10.5 20.5v-3.5h3v3.5",
  ],
  maini:
    "M8.5 12.5 6 10a2 2 0 0 0-2.8 2.8l4.6 4.6a4 4 0 0 0 2.8 1.2h4.6a3 3 0 0 0 3-3V9a1.6 1.6 0 0 0-3.2 0M15 9V6.5a1.6 1.6 0 0 0-3.2 0V9M11.8 9V5.5a1.6 1.6 0 0 0-3.2 0V12",

  // ── Ce se întâmplă la Casa Teona și în tabere ───────────────────────────
  /** Bucla neurodiversității. */
  infinit:
    "M12 12s-1.7-3.2-4-3.2a3.2 3.2 0 0 0 0 6.4c2.3 0 4-3.2 4-3.2s1.7-3.2 4-3.2a3.2 3.2 0 0 1 0 6.4c-2.3 0-4-3.2-4-3.2z",
  /** Joacă: mingea. */
  joaca: ["M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z", "M3.9 9.3 20.1 9.3M6 16.5h12M12 3.5v17"],
  /** Stimulare senzorială: mâna și undele. */
  senzorial: [
    "M9 20.5v-3.3A5.5 5.5 0 0 1 7 13V8.2a1.3 1.3 0 0 1 2.6 0v3.3M9.6 11.5V6.3a1.3 1.3 0 0 1 2.6 0v5.2M12.2 11.5V7.3a1.3 1.3 0 0 1 2.6 0v4.2M14.8 11.6V9.4a1.3 1.3 0 0 1 2.6 0V13a5.5 5.5 0 0 1-2 4.2v3.3",
    "M3.2 6.4A6.4 6.4 0 0 1 4.6 4M3.6 9.6a9 9 0 0 1 .3-2",
  ],
  /** Ateliere creative: pensula și paleta. */
  arta: [
    "M12 3.5a8.5 8.5 0 0 0 0 17c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.5-1.1a1.7 1.7 0 0 1 1.2-2.9h2A4.1 4.1 0 0 0 20.5 11c0-4.1-3.8-7.5-8.5-7.5z",
    "M7.5 11.5h.01M10 8h.01M14 8h.01M16.5 11h.01",
  ],
  /** Meloterapie: nota. */
  muzica: [
    "M9 18V6.8l10-2v10.4",
    "M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  ],
  /** Comunicare: două baloane de vorbire. */
  comunicare: [
    "M14.5 11.5a4.5 4.5 0 0 1-4.5 4.5H7l-3 2.5V11.5A4.5 4.5 0 0 1 8.5 7H10a4.5 4.5 0 0 1 4.5 4.5z",
    "M14 7V6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-.5",
  ],
  /** Familie: doi adulți și un copil. */
  familie: [
    "M7 11a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 7 11zM17 11a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
    "M3.5 20.5v-2.2A3.3 3.3 0 0 1 6.8 15h.4a3.3 3.3 0 0 1 3.3 3.3v2.2M13.5 20.5v-2.2a3.3 3.3 0 0 1 3.3-3.3h.4a3.3 3.3 0 0 1 3.3 3.3v2.2M12 20.5v-3.2a1.8 1.8 0 0 0-3.6 0",
  ],
  /** Odihnă pentru părinți: ceașca. */
  respiro: [
    "M4.5 9h12v5.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5V9z",
    "M16.5 10.5h1.8a2.2 2.2 0 0 1 0 4.4h-1.8M8 3.2c-.5.9-.5 1.7 0 2.6M12 3.2c-.5.9-.5 1.7 0 2.6",
  ],

  // ── Navigare ────────────────────────────────────────────────────────────
  stea: "M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5z",
  plic: ["M3.5 7a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7z", "M4 7l8 5.5L20 7"],
  harta: ["M12 20.5s6.5-5.4 6.5-10a6.5 6.5 0 1 0-13 0c0 4.6 6.5 10 6.5 10z", "M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  sageata: "M4.5 12h15M13.5 6l6 6-6 6",
};

export type NumePictograma = keyof typeof CAI;

export default function Pictograma({
  nume,
  ...rest
}: { nume: NumePictograma } & SVGProps<SVGSVGElement>) {
  const cale = CAI[nume];
  const cai = Array.isArray(cale) ? cale : [cale];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {cai.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
