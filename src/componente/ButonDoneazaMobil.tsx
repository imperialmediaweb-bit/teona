"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RUTE } from "@/date/asociatie";

/**
 * Butonul Donează plutitor pe telefon (12.8): „mereu vizibil”.
 *
 * Nu apare pe pagina Donează — acolo ar duce în locul în care ești deja.
 */
export default function ButonDoneazaMobil() {
  const cale = usePathname();
  if (cale.startsWith(RUTE.doneaza)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 sm:hidden">
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
