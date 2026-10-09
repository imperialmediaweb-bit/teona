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
    <div className="doar-site pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 sm:hidden">
      <Link
        href={RUTE.doneaza}
        className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full bg-caramiziu-500 px-6 py-4 font-titlu text-amplu font-bold text-hartie shadow-[0_8px_30px_-6px_rgba(247,79,34,0.6)] transition active:translate-y-px"
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
