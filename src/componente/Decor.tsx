import type { SVGProps } from "react";

/**
 * Semne desenate de mână, împrăștiate prin pagină.
 *
 * Nu sunt pictograme și nu înlocuiesc niciun text — sunt decor. Linia e
 * neregulată intenționat, ca tușa unui copil cu carioca: asta leagă pagina de
 * ce se întâmplă de fapt la Casa Teona, unde copiii desenează pe tablă și fac
 * curcubeie din bețișoare. Fotografiile preluate arată exact asta.
 *
 * Toate sunt `aria-hidden`: un cititor de ecran nu are ce face cu ele.
 */
const SEMNE = {
  /** Steluță cu cinci colțuri, trasă dintr-o mișcare. */
  stea: "M12 2.5l2.4 6.1 6.6.3-5.1 4.2 1.7 6.4-5.6-3.5-5.6 3.7 1.5-6.5-5.2-4.1 6.6-.5z",
  /** Inimioară. */
  inima:
    "M12 21c-.6-.4-8.2-5-8.6-10.3C3.1 7.4 5.6 4.6 8.7 4.9c1.5.2 2.7 1.2 3.3 2.5.7-1.3 1.9-2.2 3.4-2.3 3.1-.2 5.5 2.6 5.2 5.9C20.2 16.2 12.6 20.6 12 21z",
  /** Linie șerpuită. */
  unda: "M2 14c2.6-5.4 5.2-5.6 7.8-.5 2.6 5 5.2 4.8 7.8-.6 1.1-2.2 2.2-3 3.4-2.4",
  /** Spirală, din aceeași mișcare continuă. */
  spirala:
    "M14.6 12a2.7 2.7 0 1 1-2.8-2.7 4.6 4.6 0 0 1 4.5 4.8 7 7 0 0 1-7.2 6.6A9.6 9.6 0 0 1 2.2 11 12.2 12.2 0 0 1 14.7 2.6",
  /** Soare cu raze inegale. */
  soare:
    "M12 16.3a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6zM12 2v2.6M12 19.4V22M4.2 4.6l1.9 1.8M17.9 17.8l1.9 1.9M2 12.2h2.6M19.4 12h2.6M4.4 19.6l1.8-1.9M18 6.3l1.8-1.9",
} as const;

export type NumeSemn = keyof typeof SEMNE;

export default function Decor({
  semn,
  ...rest
}: { semn: NumeSemn } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={SEMNE[semn]} />
    </svg>
  );
}
