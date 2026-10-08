"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { MENIU, RUTE, ASOCIATIA } from "@/date/asociatie";
import Buton from "./Buton";

const SIGLA =
  "/poze/2024/03/WhatsApp_Image_2024-11-15_at_11.32.41_AM-removebg-preview.png";

/**
 * Meniul capătă umbră abia după ce pagina a fost derulată câțiva pixeli.
 *
 * Citit cu `useSyncExternalStore`, nu cu `useEffect` + `setState`: valoarea
 * există doar în browser, iar React se ocupă singur de abonare. Pe server
 * pornim de la „nederulat”, ceea ce e adevărat la deschiderea paginii.
 */
function abonareLaDerulare(reciteste: () => void) {
  window.addEventListener("scroll", reciteste, { passive: true });
  return () => window.removeEventListener("scroll", reciteste);
}

/** Meniul principal (12.1). Rămâne vizibil la derulare. */
export default function Antet() {
  const cale = usePathname();
  const derulat = useSyncExternalStore(
    abonareLaDerulare,
    () => window.scrollY > 8,
    () => false,
  );
  // Meniul de ecran mic ține minte și pagina pe care a fost deschis. La
  // navigare, calea se schimbă și meniul se consideră închis — fără să-l
  // închidem dintr-un efect, care ar costa o randare în plus la fiecare pagină.
  const [meniu, setMeniu] = useState<{ deschis: boolean; pe: string }>({
    deschis: false,
    pe: cale,
  });
  const meniuDeschis = meniu.deschis && meniu.pe === cale;
  const setMeniuDeschis = (deschis: boolean) => setMeniu({ deschis, pe: cale });

  const [submeniu, setSubmeniu] = useState<{ nume: string | null; pe: string }>({
    nume: null,
    pe: cale,
  });
  const submeniuDeschis = submeniu.pe === cale ? submeniu.nume : null;
  const setSubmeniuDeschis = (nume: string | null) => setSubmeniu({ nume, pe: cale });

  // Cu meniul de telefon deschis, pagina din spate nu se derulează.
  useEffect(() => {
    document.body.style.overflow = meniuDeschis ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [meniuDeschis]);

  const activ = (href: string) =>
    href === RUTE.acasa ? cale === href : cale.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-cald ${
        derulat
          ? "bg-hartie/95 shadow-[0_1px_0_0_var(--color-hartie-umbra),0_8px_24px_-16px_rgba(35,35,35,0.3)] backdrop-blur-md"
          : "bg-hartie"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={RUTE.acasa}
          className="shrink-0"
          aria-label={`${ASOCIATIA.denumire} — prima pagină`}
        >
          <Image
            src={SIGLA}
            alt={ASOCIATIA.denumire}
            width={436}
            height={161}
            priority
            className="h-11 w-auto sm:h-12"
          />
        </Link>

        {/* Nouă intrări de meniu plus butonul Donează nu încap sub 1280 px fără
            să se rupă pe două rânduri. Sub pragul ăsta trece meniul de telefon. */}
        <nav
          aria-label="Meniu principal"
          className="ml-auto hidden items-center gap-0.5 xl:flex"
        >
          {MENIU.map((element) =>
            element.subpagini ? (
              <div
                key={element.eticheta}
                className="relative"
                onMouseEnter={() => setSubmeniuDeschis(element.eticheta)}
                onMouseLeave={() => setSubmeniuDeschis(null)}
              >
                <button
                  type="button"
                  aria-expanded={submeniuDeschis === element.eticheta}
                  onClick={() =>
                    setSubmeniuDeschis(
                      submeniuDeschis === element.eticheta ? null : element.eticheta,
                    )
                  }
                  className="flex items-center gap-1 rounded-full px-2.5 py-2 font-titlu text-mic font-semibold whitespace-nowrap text-cerneala transition hover:bg-hartie-calda hover:text-caramiziu-600"
                >
                  {element.eticheta}
                  <svg
                    viewBox="0 0 12 12"
                    className={`size-3 transition-transform duration-200 ${
                      submeniuDeschis === element.eticheta ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" />
                  </svg>
                </button>
                {submeniuDeschis === element.eticheta && (
                  <div className="absolute top-full left-0 w-64 pt-2">
                    <div className="overflow-hidden rounded-moale border border-hartie-umbra bg-hartie py-1.5 shadow-[0_16px_40px_-20px_rgba(35,35,35,0.45)]">
                      {element.subpagini.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block px-4 py-2.5 font-titlu text-mic font-semibold whitespace-nowrap transition hover:bg-hartie-calda hover:text-caramiziu-600 ${
                            activ(sub.href) ? "text-caramiziu-600" : "text-cerneala"
                          }`}
                        >
                          {sub.eticheta}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={element.href}
                href={element.href!}
                aria-current={activ(element.href!) ? "page" : undefined}
                className={`relative rounded-full px-2.5 py-2 font-titlu text-mic font-semibold whitespace-nowrap transition hover:bg-hartie-calda hover:text-caramiziu-600 ${
                  activ(element.href!) ? "text-caramiziu-600" : "text-cerneala"
                }`}
              >
                {element.eticheta}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-2">
          <Buton href={RUTE.doneaza} marime="mic" className="hidden sm:inline-flex">
            Donează
          </Buton>

          <button
            type="button"
            onClick={() => setMeniuDeschis(!meniuDeschis)}
            aria-expanded={meniuDeschis}
            aria-controls="meniu-telefon"
            aria-label={meniuDeschis ? "Închide meniul" : "Deschide meniul"}
            className="rounded-full p-2.5 text-cerneala transition hover:bg-hartie-calda xl:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              {meniuDeschis ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {meniuDeschis && (
        <div
          id="meniu-telefon"
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-hartie-umbra bg-hartie px-4 pb-8 xl:hidden"
        >
          <nav aria-label="Meniu principal (ecran mic)" className="flex flex-col py-2">
            {MENIU.map((element) =>
              element.subpagini ? (
                <div key={element.eticheta} className="py-1">
                  <p className="px-3 pt-3 pb-1 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                    {element.eticheta}
                  </p>
                  {element.subpagini.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block rounded-moale px-3 py-3 pl-6 font-titlu font-semibold text-cerneala transition hover:bg-hartie-calda"
                    >
                      {sub.eticheta}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={element.href}
                  href={element.href!}
                  aria-current={activ(element.href!) ? "page" : undefined}
                  className={`rounded-moale px-3 py-3 font-titlu font-semibold transition hover:bg-hartie-calda ${
                    activ(element.href!) ? "text-caramiziu-600" : "text-cerneala"
                  }`}
                >
                  {element.eticheta}
                </Link>
              ),
            )}
          </nav>
          <Buton href={RUTE.doneaza} className="w-full">
            Donează
          </Buton>
        </div>
      )}
    </header>
  );
}
