"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MENIU, RUTE, ASOCIATIA } from "@/date/asociatie";
import Buton from "./Buton";
import Sigla from "./Sigla";

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

type Pastila = { stanga: number; latime: number } | null;

/**
 * Meniul principal (12.1). Alb, cu sigla în culorile ei, lipit sus la derulare.
 *
 * Mișcarea: o singură pastilă care alunecă dintr-un element în altul, în loc ca
 * fiecare să-și aprindă propriul fundal. Un obiect care se mută se urmărește cu
 * ochii mai ușor decât zece care clipesc pe rând — contează pentru oricine, dar
 * mai ales pentru copiii cărora li se adresează site-ul. 300 ms: destul cât să
 * se vadă traseul, prea puțin cât să încetinească.
 */
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
  const setSubmeniuDeschis = (nume: string | null) =>
    setSubmeniu({ nume, pe: cale });

  const navigatie = useRef<HTMLElement>(null);
  const [pastila, setPastila] = useState<Pastila>(null);

  const mutaPastila = useCallback((tinta: HTMLElement | null) => {
    const container = navigatie.current;
    if (!container || !tinta) return setPastila(null);
    const c = container.getBoundingClientRect();
    const t = tinta.getBoundingClientRect();
    setPastila({ stanga: t.left - c.left, latime: t.width });
  }, []);

  // Cu meniul de ecran mic deschis, pagina din spate nu se derulează.
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
      className={`sticky top-0 z-50 bg-hartie transition-shadow duration-300 ease-cald ${
        derulat
          ? "shadow-[0_1px_0_0_var(--color-hartie-umbra),0_10px_30px_-22px_rgba(35,35,35,0.45)]"
          : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Sub 380 px, numele din siglă se micșorează: la 320 px (ecranele
            vechi mici, încă în uz) altfel împingea bara peste marginea
            ecranului și pagina se derula lateral. */}
        <Link
          href={RUTE.acasa}
          aria-label={`${ASOCIATIA.denumire} — prima pagină`}
          className="group shrink-0"
        >
          <Sigla className="text-[0.82rem] transition-transform duration-300 ease-cald group-hover:scale-[1.03] min-[380px]:text-[0.95rem] sm:text-[1.05rem]" />
        </Link>

        {/* Nouă intrări plus butonul Donează nu încap sub 1280 px fără să se
            rupă pe două rânduri. Sub prag trece meniul de ecran mic. */}
        <nav
          ref={navigatie}
          aria-label="Meniu principal"
          onMouseLeave={() => setPastila(null)}
          className="relative ml-auto hidden items-center gap-0.5 xl:flex"
        >
          {/* Pastila care alunecă. Decorativă: nu intră în ordinea de citire. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -z-10 h-9 -translate-y-1/2 rounded-full bg-hartie-calda transition-all duration-300 ease-cald motion-reduce:transition-none"
            style={{
              left: pastila?.stanga ?? 0,
              width: pastila?.latime ?? 0,
              opacity: pastila ? 1 : 0,
            }}
          />

          {MENIU.map((element) =>
            element.subpagini ? (
              <div
                key={element.eticheta}
                className="relative"
                onMouseEnter={(ev) => {
                  setSubmeniuDeschis(element.eticheta);
                  mutaPastila(ev.currentTarget.firstElementChild as HTMLElement);
                }}
                onMouseLeave={() => setSubmeniuDeschis(null)}
              >
                <button
                  type="button"
                  aria-expanded={submeniuDeschis === element.eticheta}
                  onFocus={(ev) => mutaPastila(ev.currentTarget)}
                  onClick={() =>
                    setSubmeniuDeschis(
                      submeniuDeschis === element.eticheta
                        ? null
                        : element.eticheta,
                    )
                  }
                  className="flex items-center gap-1 rounded-full px-2.5 py-2 font-titlu text-mic font-semibold whitespace-nowrap text-cerneala transition-colors duration-200 hover:text-caramiziu-600"
                >
                  {element.eticheta}
                  <svg
                    viewBox="0 0 12 12"
                    className={`size-3 transition-transform duration-300 ease-cald ${
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
                    <div className="submeniu overflow-hidden rounded-card border border-hartie-umbra bg-hartie p-1.5 shadow-[0_20px_50px_-24px_rgba(35,35,35,0.5)]">
                      {element.subpagini.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block rounded-moale px-3.5 py-2.5 font-titlu text-mic font-semibold whitespace-nowrap transition-colors duration-200 hover:bg-hartie-calda hover:text-caramiziu-600 ${
                            activ(sub.href)
                              ? "text-caramiziu-600"
                              : "text-cerneala"
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
                onMouseEnter={(ev) => mutaPastila(ev.currentTarget)}
                onFocus={(ev) => mutaPastila(ev.currentTarget)}
                className={`relative rounded-full px-2.5 py-2 font-titlu text-mic font-semibold whitespace-nowrap transition-colors duration-200 hover:text-caramiziu-600 ${
                  activ(element.href!) ? "text-caramiziu-600" : "text-cerneala"
                }`}
              >
                {element.eticheta}
                {/* Pagina curentă are liniuța ei, care rămâne pe loc și când
                    pastila pleacă în altă parte. */}
                {activ(element.href!) && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-caramiziu-500"
                  />
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-3">
          <Buton href={RUTE.doneaza} marime="mic" className="hidden sm:inline-flex">
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 20.5S4 15.6 4 10.3A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 8 2.4c0 5.3-8 10.2-8 10.2z" />
            </svg>
            Donează
          </Buton>

          <button
            type="button"
            onClick={() => setMeniuDeschis(!meniuDeschis)}
            aria-expanded={meniuDeschis}
            aria-controls="meniu-ecran-mic"
            aria-label={meniuDeschis ? "Închide meniul" : "Deschide meniul"}
            className="rounded-full p-2.5 text-cerneala transition hover:bg-hartie-calda xl:hidden"
          >
            {/* Trei linii care se strâng într-un X, fiecare pe traseul ei. */}
            <span className="relative block size-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute left-0 block h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-cald motion-reduce:transition-none"
                  style={{
                    top: meniuDeschis ? "50%" : `${25 + i * 25}%`,
                    transform: meniuDeschis
                      ? `translateY(-50%) rotate(${i === 2 ? -45 : 45}deg)`
                      : "none",
                    opacity: meniuDeschis && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      {meniuDeschis && (
        <div
          id="meniu-ecran-mic"
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-hartie-umbra bg-hartie px-4 pb-8 xl:hidden"
        >
          <nav
            aria-label="Meniu principal (ecran mic)"
            className="flex flex-col py-2"
          >
            {MENIU.map((element, i) =>
              element.subpagini ? (
                <div
                  key={element.eticheta}
                  className="intrare-meniu py-1"
                  style={{ "--rand": i } as React.CSSProperties}
                >
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
                  style={{ "--rand": i } as React.CSSProperties}
                  className={`intrare-meniu rounded-moale px-3 py-3 font-titlu font-semibold transition hover:bg-hartie-calda ${
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
