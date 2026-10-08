import type { SVGProps } from "react";

/**
 * Pictogramele site-ului, desenate aici.
 *
 * Linie de 1,75 px, colțuri rotunde, aceeași cutie de 24 — ca să arate ca o
 * familie, nu ca o colecție adunată din mai multe seturi.
 */
const CAI = {
  inima: "M12 20.5S4 15.6 4 10.3A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 8 2.4c0 5.3-8 10.2-8 10.2z",
  telefon:
    "M7.5 3.5h-2a2 2 0 0 0-2 2.2 16.5 16.5 0 0 0 14.8 14.8 2 2 0 0 0 2.2-2v-2a1.4 1.4 0 0 0-1.2-1.4l-2.4-.4a1.4 1.4 0 0 0-1.4.7l-.7 1.3a12.4 12.4 0 0 1-6.6-6.6l1.3-.7a1.4 1.4 0 0 0 .7-1.4l-.4-2.4A1.4 1.4 0 0 0 7.5 3.5z",
  document:
    "M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5zM14 3.5V8h4.5M9 13h6M9 16.5h4",
  cladire:
    "M4 20.5h16M5.5 20.5V6l6.5-2.5L18.5 6v14.5M9.5 10h1M13.5 10h1M9.5 13.5h1M13.5 13.5h1M10.5 20.5v-3.5h3v3.5",
  maini:
    "M8.5 12.5 6 10a2 2 0 0 0-2.8 2.8l4.6 4.6a4 4 0 0 0 2.8 1.2h4.6a3 3 0 0 0 3-3V9a1.6 1.6 0 0 0-3.2 0M15 9V6.5a1.6 1.6 0 0 0-3.2 0V9M11.8 9V5.5a1.6 1.6 0 0 0-3.2 0V12",
  joaca:
    "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM8.5 10.5h.01M15.5 10.5h.01M8.8 14.5a4.2 4.2 0 0 0 6.4 0",
  stea: "M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5z",
  plic: "M3.5 7a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7zM4 7l8 5.5L20 7",
  harta: "M12 20.5s6.5-5.4 6.5-10a6.5 6.5 0 1 0-13 0c0 4.6 6.5 10 6.5 10zM12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  sageata: "M4.5 12h15M13.5 6l6 6-6 6",
} as const;

export type NumePictograma = keyof typeof CAI;

export default function Pictograma({
  nume,
  ...rest
}: { nume: NumePictograma } & SVGProps<SVGSVGElement>) {
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
      <path d={CAI[nume]} />
    </svg>
  );
}
