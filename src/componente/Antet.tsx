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
import { MENIU, RUTE, ASOCIATIA, TELEFOANE } from "@/date/asociatie";
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

function Inima({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 20.5S4 15.6 4 10.3A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 8 2.4c0 5.3-8 10.2-8 10.2z" />
    </svg>
  );
}

function Sageata({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}

/**
 * Meniul principal (12.1). Alb, cu sigla în culorile ei, lipit sus la derulare.
 *
 * Mișcarea: o singură pastilă care alunecă dintr-un element în altul, în loc ca
 * fiecare să-și aprindă propriul fundal. Un obiect care se mută se urmărește cu
 * ochii mai ușor decât zece care clipesc pe rând — contează pentru oricine, dar
 * mai ales pentru copiii cărora li se adresează site-ul. 300 ms: destul cât să
 * se vadă traseul, prea puțin cât să încetinească.
 *
 * Nimic de aici nu pornește de la `opacity: 0`: submeniul și meniul de ecran
 * mic stau în pagină tot timpul și se deschid prin deplasare, respectiv prin
 * înălțime. Dacă o tranziție nu rulează, din orice motiv, meniul e tot acolo.
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

  const [submeniu, setSubmeniu] = useState<{ nume: string | null; pe: string }>(
    {
      nume: null,
      pe: cale,
    },
  );
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

  // Între 1280 și 1400 px, nouă intrări, sigla de 56 px și Donează încap cu
  // 2 px în minus la fiecare margine; de la 1400 primesc aerul întreg.
  const intrareDesktop =
    "relative flex items-center gap-1 rounded-full px-2.5 py-2 font-titlu text-mic font-semibold whitespace-nowrap transition-colors duration-200 hover:text-caramiziu-600 min-[1400px]:px-3";

  return (
    <header
      className={`sticky top-0 z-50 bg-hartie transition-shadow duration-300 ease-cald ${
        derulat
          ? "shadow-[0_1px_0_0_var(--color-hartie-umbra),0_10px_30px_-22px_rgba(35,35,35,0.45)]"
          : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 min-[380px]:px-4 sm:px-6 lg:px-8 lg:py-3">
        {/* Mărimea aripii, de la 320 px în sus: 40, 44, 48, 56. La 320 px
            sigla, butonul Donează și hamburgerul trebuie să încapă toate trei
            pe un rând; de aceea sub 380 px aripa scade, iar sub 360 Donează
            rămâne doar inimă. */}
        <Link
          href={RUTE.acasa}
          aria-label={`${ASOCIATIA.denumire} — prima pagină`}
          className="group flex shrink-0 rounded-full"
        >
          <Sigla className="text-[40px] transition-transform duration-300 ease-cald group-hover:scale-[1.02] motion-reduce:transition-none min-[380px]:text-[44px] sm:text-[48px] lg:text-[56px]" />
        </Link>

        {/* Nouă intrări plus butonul Donează nu încap sub 1280 px fără să se
            rupă pe două rânduri. Sub prag trece meniul de ecran mic. */}
        <nav
          ref={navigatie}
          aria-label="Meniu principal"
          onMouseLeave={() => setPastila(null)}
          className="relative mx-auto hidden items-center xl:flex min-[1400px]:gap-0.5"
        >
          {/* Pastila care alunecă. Decorativă: nu intră în ordinea de citire.
              Se scalează pe orizontală când nu are unde să stea, ca să nu
              pornească niciodată de la invizibil. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -z-10 rounded-full bg-tenta-cald transition-[left,width,transform] duration-300 ease-cald motion-reduce:transition-none"
            style={{
              left: pastila?.stanga ?? 0,
              width: pastila?.latime ?? 0,
              transform: pastila ? "scaleX(1)" : "scaleX(0)",
            }}
          />

          {MENIU.map((element) =>
            element.subpagini ? (
              <div
                key={element.eticheta}
                className="relative"
                onMouseEnter={(ev) => {
                  setSubmeniuDeschis(element.eticheta);
                  mutaPastila(
                    ev.currentTarget.firstElementChild as HTMLElement,
                  );
                }}
                onMouseLeave={() => setSubmeniuDeschis(null)}
                onKeyDown={(ev) => {
                  if (ev.key === "Escape") setSubmeniuDeschis(null);
                }}
                onBlur={(ev) => {
                  // Tastatura a plecat din grup: submeniul se închide singur.
                  if (!ev.currentTarget.contains(ev.relatedTarget as Node)) {
                    setSubmeniuDeschis(null);
                  }
                }}
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
                  className={`${intrareDesktop} ${
                    element.subpagini.some((s) => activ(s.href)) ||
                    submeniuDeschis === element.eticheta
                      ? "text-caramiziu-600"
                      : "text-cerneala"
                  }`}
                >
                  {element.eticheta}
                  <Sageata
                    className={`size-3 transition-transform duration-300 ease-cald motion-reduce:transition-none ${
                      submeniuDeschis === element.eticheta ? "rotate-180" : ""
                    }`}
                  />
                  {element.subpagini.some((s) => activ(s.href)) && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-caramiziu-500"
                    />
                  )}
                </button>

                {/* Submeniul stă mereu în pagină; deschis, coboară 6 px la
                    locul lui. `visibility` ține linkurile în afara ordinii de
                    tabulare cât e închis. */}
                <div
                  className={`absolute top-full left-0 w-64 pt-2 transition-[transform,visibility] duration-200 ease-cald motion-reduce:transition-none ${
                    submeniuDeschis === element.eticheta
                      ? "visible translate-y-0"
                      : "invisible -translate-y-1.5"
                  }`}
                >
                  <div className="overflow-hidden rounded-card border border-hartie-umbra bg-hartie p-1.5 shadow-[0_20px_50px_-24px_rgba(35,35,35,0.5)]">
                    {element.subpagini.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        aria-current={activ(sub.href) ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-moale px-3.5 py-2.5 font-titlu text-mic font-semibold whitespace-nowrap transition-colors duration-200 hover:bg-tenta-cald hover:text-caramiziu-600 ${
                          activ(sub.href)
                            ? "bg-tenta-cald text-caramiziu-600"
                            : "text-cerneala"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${
                            activ(sub.href)
                              ? "bg-caramiziu-500"
                              : "bg-miere-400"
                          }`}
                        />
                        {sub.eticheta}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={element.href}
                href={element.href!}
                aria-current={activ(element.href!) ? "page" : undefined}
                onMouseEnter={(ev) => mutaPastila(ev.currentTarget)}
                onFocus={(ev) => mutaPastila(ev.currentTarget)}
                className={`${intrareDesktop} ${
                  activ(element.href!) ? "text-caramiziu-600" : "text-cerneala"
                }`}
              >
                {element.eticheta}
                {/* Pagina curentă are liniuța ei, care rămâne pe loc și când
                    pastila pleacă în altă parte. */}
                {activ(element.href!) && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-caramiziu-500"
                  />
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 xl:ml-0 xl:gap-2 min-[1400px]:gap-3">
          {/* Linie subțire între meniu și Donează: butonul e o acțiune, nu a
              zecea pagină. */}
          <span
            aria-hidden="true"
            className="hidden h-7 w-px bg-hartie-umbra xl:block"
          />

          <Link
            href={RUTE.doneaza}
            aria-label="Donează"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-caramiziu-500 p-2.5 font-titlu text-mic font-bold text-hartie shadow-[0_2px_0_0_var(--color-caramiziu-700)] transition-all duration-200 ease-cald hover:translate-y-px hover:bg-caramiziu-600 hover:shadow-[0_1px_0_0_var(--color-caramiziu-700)] motion-reduce:hover:translate-y-0 min-[360px]:px-4 min-[360px]:py-2.5 lg:py-3 min-[1400px]:px-5"
          >
            <Inima className="size-5 min-[360px]:size-4" />
            <span className="hidden min-[360px]:inline">Donează</span>
          </Link>

          <button
            type="button"
            onClick={() => setMeniuDeschis(!meniuDeschis)}
            aria-expanded={meniuDeschis}
            aria-controls="meniu-ecran-mic"
            aria-label={meniuDeschis ? "Închide meniul" : "Deschide meniul"}
            className="grid size-11 place-items-center rounded-full text-cerneala transition-colors duration-200 hover:bg-tenta-cald xl:hidden"
          >
            {/* Trei linii care se strâng într-un X. Cea din mijloc se
                scurtează, nu se stinge. */}
            <span className="relative block h-4 w-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute left-0 block h-0.5 w-6 origin-center rounded-full bg-current transition-[top,transform] duration-300 ease-cald motion-reduce:transition-none"
                  style={{
                    top: meniuDeschis ? "50%" : `${i * 50}%`,
                    transform: meniuDeschis
                      ? i === 1
                        ? "translateY(-50%) scaleX(0)"
                        : `translateY(-50%) rotate(${i === 2 ? -45 : 45}deg)`
                      : "translateY(-50%)",
                  }}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      {/* Meniul de ecran mic. Stă în pagină tot timpul, cu înălțimea 0 când e
          închis: se desface în jos, în loc să apară din nimic. `inert` ține
          linkurile în afara tabulării și a cititoarelor de ecran cât e închis. */}
      <div
        id="meniu-ecran-mic"
        inert={!meniuDeschis}
        className={`grid transition-[grid-template-rows] duration-300 ease-cald motion-reduce:transition-none xl:hidden ${
          meniuDeschis ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-hartie-umbra bg-hartie-calda px-3 pt-3 pb-5 min-[380px]:px-4 sm:px-6">
            <nav
              aria-label="Meniu principal (ecran mic)"
              className="mx-auto grid max-w-7xl gap-0.5 sm:grid-cols-2 sm:gap-x-6"
            >
              {MENIU.map((element) =>
                element.subpagini ? (
                  <div key={element.eticheta} className="py-1">
                    <p className="px-3 pt-2 pb-1.5 font-titlu text-nota font-bold tracking-[0.08em] text-cerneala-slab uppercase">
                      {element.eticheta}
                    </p>
                    <div className="ml-4 grid gap-0.5 border-l-2 border-miere-200 pl-1">
                      {element.subpagini.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          aria-current={activ(sub.href) ? "page" : undefined}
                          className={`flex min-h-11 items-center rounded-moale px-3 py-2 font-titlu font-semibold transition-colors duration-200 hover:bg-hartie ${
                            activ(sub.href)
                              ? "bg-hartie text-caramiziu-600"
                              : "text-cerneala"
                          }`}
                        >
                          {sub.eticheta}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={element.href}
                    href={element.href!}
                    aria-current={activ(element.href!) ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-moale px-3 py-2 font-titlu font-semibold transition-colors duration-200 hover:bg-hartie ${
                      activ(element.href!)
                        ? "bg-hartie text-caramiziu-600 shadow-[inset_3px_0_0_0_var(--color-caramiziu-500)]"
                        : "text-cerneala"
                    }`}
                  >
                    {element.eticheta}
                    <Sageata className="size-3 -rotate-90 text-cerneala-slab" />
                  </Link>
                ),
              )}
            </nav>

            <div className="mx-auto mt-3 flex max-w-7xl flex-col gap-3 border-t border-hartie-umbra pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={RUTE.doneaza}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-caramiziu-500 px-6 py-3 font-titlu font-bold text-hartie shadow-[0_2px_0_0_var(--color-caramiziu-700)] transition-all duration-200 ease-cald hover:translate-y-px hover:bg-caramiziu-600 motion-reduce:hover:translate-y-0 sm:order-2"
              >
                <Inima className="size-4" />
                Donează
              </Link>
              {/* Telefoanele, ca să nu trebuiască deschisă pagina de contact
                  pentru un apel. */}
              <p className="flex flex-wrap items-center gap-x-3 text-mic text-cerneala-moale">
                <span>Sună-ne:</span>
                {TELEFOANE.map((telefon) => (
                  <a
                    key={telefon.apel}
                    href={`tel:${telefon.apel}`}
                    className="inline-flex min-h-10 items-center font-semibold text-cerneala transition-colors hover:text-caramiziu-600"
                  >
                    {telefon.afisat}
                  </a>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
