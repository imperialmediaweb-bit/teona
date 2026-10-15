"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { RUTE } from "@/date/asociatie";
import { abonareLaAcord, areAcord } from "@/lib/cookieuri";

/**
 * Butonul Donează plutitor pe telefon (12.8): „mereu vizibil”.
 *
 * Două excepții, amândouă din motive practice:
 *
 * · pe pagina Donează ar duce unde ești deja;
 * · cât timp bannerul de cookie-uri cere o alegere, se dă la o parte. Pe un
 *   telefon de 390 de pixeli stau amândouă fixate în josul ecranului și se
 *   acopereau — butoanele bannerului ajungeau tăiate de marginea de jos.
 *
 * **E o pastilă, nu o bară cât ecranul.** Era lat cât pagina și acoperea
 * textul de sub el: pe prima pagină tăia titlul în două, exact peste „aducem
 * bucurie”. Plus că antetul e lipit sus și are și el un buton Donează, deci
 * pe un ecran de telefon se vedeau două butoane identice, unul mare cât o
 * bară de sistem. Acum stă în dreapta jos, cât scrisul din el, și lasă
 * textul să se citească pe lângă.
 */
export default function ButonDoneazaMobil() {
  const cale = usePathname();
  // „necunoscut” pe server: butonul intră în HTML, ca să existe și fără
  // JavaScript. Dacă bannerul chiar e deschis, dispare la prima randare.
  const acord = useSyncExternalStore(
    abonareLaAcord,
    areAcord,
    () => "1" as const,
  );

  if (cale.startsWith(RUTE.doneaza)) return null;
  if (acord === "0") return null;

  return (
    <div className="doar-site pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end p-4 sm:hidden">
      <Link
        href={RUTE.doneaza}
        className="pointer-events-auto flex min-h-12 items-center justify-center gap-2 rounded-full bg-caramiziu-700 px-5 py-3 font-titlu font-bold text-hartie shadow-[0_10px_26px_-8px_rgba(35,35,35,0.55)] transition active:translate-y-px"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 21s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6.3a5.4 5.4 0 0 1 9.6 5.7C19.5 16.4 12 21 12 21z" />
        </svg>
        Donează
      </Link>
    </div>
  );
}
