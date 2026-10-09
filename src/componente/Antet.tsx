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
import {
  MENIU,
  RUTE,
  ASOCIATIA,
  TELEFOANE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import Pictograma from "./Pictograma";
import Sigla from "./Sigla";

/**
 * Antetul se strânge la derulare, dar nu la primul pixel.
 *
 * Două praguri, nu unul: devine compact după 72 px și se desface la loc abia
 * sub 24 px. Cu un singur prag, o derulare mică exact pe valoarea lui ar face
 * antetul să sară între cele două mărimi la fiecare rotiță de mouse.
 *
 * Starea stă în modulul ăsta, nu în componentă, pentru că `useSyncExternalStore`
 * cere o citire care dă același răspuns pentru aceeași poziție — și dă.
 */
let compactCurent = false;

function citesteCompact(): boolean {
  const y = window.scrollY;
  if (y > 72) compactCurent = true;
  else if (y < 24) compactCurent = false;
  return compactCurent;
}

function abonareLaDerulare(reciteste: () => void) {
  window.addEventListener("scroll", reciteste, { passive: true });
  return () => window.removeEventListener("scroll", reciteste);
}

/**
 * Pastila ține minte și starea antetului în care a fost măsurată.
 *
 * Când antetul se strânge, intrările își schimbă mărimea, deci poziția
 * măsurată înainte nu mai e bună. În loc s-o ștergem dintr-un efect — ceea ce
 * cere încă o randare — o comparăm la randare cu starea curentă: dacă nu se
 * potrivesc, pastila nu se desenează, iar următoarea trecere cu mouse-ul o
 * remăsoară.
 */
type Pastila = {
  stanga: number;
  latime: number;
  accent: number;
  laCompact: boolean;
} | null;

/**
 * Cele trei culori ale mărcii, pe rând, pentru intrările din meniu.
 *
 * Regula din `globals.css` — culoarea tare doar pe bucăți mici, suprafețele
 * mari în tenta spălată — se respectă aici: fundalul care alunecă e tenta
 * palidă, iar textul ia nuanța închisă a aceleiași culori, care are contrast
 * bun pe ea. Pagina curentă rămâne însă mereu portocalie: „ești aici” e un
 * semn de orientare, nu un loc de jucat cu culorile.
 */
const ACCENTE = [
  { tenta: "bg-caramiziu-100", text: "hover:text-caramiziu-700" },
  { tenta: "bg-miere-100", text: "hover:text-miere-700" },
  { tenta: "bg-turcoaz-100", text: "hover:text-turcoaz-700" },
] as const;

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
 * Meniul principal (12.1). Lipit sus la derulare, cum cere caietul.
 *
 * De ce două rânduri de la 1280 px în sus: meniul are nouă intrări, iar
 * etichetele cerute de caiet sunt cuvinte lungi în română — „Sponsori și
 * parteneri”, „Redirecționează”, „Devino voluntar”. Măsurate la 17 px, ele
 * ocupă singure peste 1100 px. Pe un singur rând, lângă siglă și lângă
 * butonul Donează, nu mai rămâne loc decât pentru litere de 15 px, lipite
 * una de alta. Rândul separat e singurul mod ca meniul să fie mare de-adevărat
 * fără să tăiem din etichete.
 *
 * Mișcarea: o singură pastilă care alunecă dintr-un element în altul, în loc ca
 * fiecare să-și aprindă propriul fundal. Un obiect care se mută se urmărește cu
 * ochii mai ușor decât zece care clipesc pe rând — contează pentru oricine, dar
 * mai ales pentru copiii cărora li se adresează site-ul. 300 ms: destul cât să
 * se vadă traseul, prea puțin cât să încetinească. Pastila își schimbă și
 * culoarea, după intrarea pe care stă.
 *
 * Nimic de aici nu pornește de la `opacity: 0`: submeniul și meniul de ecran
 * mic stau în pagină tot timpul și se deschid prin deplasare, respectiv prin
 * înălțime. Dacă o tranziție nu rulează, din orice motiv, meniul e tot acolo.
 */
export default function Antet() {
  const cale = usePathname();
  const compact = useSyncExternalStore(
    abonareLaDerulare,
    citesteCompact,
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
  const hamburger = useRef<HTMLButtonElement>(null);
  const [pastila, setPastila] = useState<Pastila>(null);

  const mutaPastila = useCallback(
    (tinta: HTMLElement | null, accent: number) => {
      const container = navigatie.current;
      if (!container || !tinta) return setPastila(null);
      const c = container.getBoundingClientRect();
      const t = tinta.getBoundingClientRect();
      setPastila({
        stanga: t.left - c.left,
        latime: t.width,
        accent,
        laCompact: compact,
      });
    },
    [compact],
  );

  const pastilaDeDesenat = pastila?.laCompact === compact ? pastila : null;

  // Cu meniul de ecran mic deschis, pagina din spate nu se derulează.
  useEffect(() => {
    document.body.style.overflow = meniuDeschis ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [meniuDeschis]);

  // Escape închide meniul de ecran mic și dă focusul înapoi pe buton, ca
  // tastatura să nu rămână într-un meniu închis.
  useEffect(() => {
    if (!meniuDeschis) return;
    const laTasta = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      setMeniu({ deschis: false, pe: cale });
      hamburger.current?.focus();
    };
    document.addEventListener("keydown", laTasta);
    return () => document.removeEventListener("keydown", laTasta);
  }, [meniuDeschis, cale]);

  const activ = (href: string) =>
    href === RUTE.acasa ? cale === href : cale.startsWith(href);

  /*
    Mărimea siglei. Pe telefon nu se schimbă la derulare: ecranul e mic, iar
    un antet care își schimbă înălțimea sub deget se simte instabil. De la
    1280 px în sus, sigla scade de la 64 la 46 px când antetul se strânge.
  */
  const marimeSigla = `text-[44px] min-[412px]:text-[48px] sm:text-[54px] ${
    compact ? "xl:text-[46px]" : "xl:text-[64px]"
  }`;

  // Rândul de jos (meniul propriu-zis) are tot spațiul lui, deci literele pot
  // fi de 17 px. Strâns, coboară la 15 px și la o pastilă mai joasă.
  const intrareDesktop = `relative flex items-center gap-1.5 rounded-full font-titlu font-bold whitespace-nowrap transition-[color,background-color,padding,font-size] duration-300 ease-cald ${
    compact ? "px-3 py-1.5 text-mic" : "px-4 py-2 text-corp"
  }`;

  /*
    Pagina curentă e o pastilă plină, nu o liniuță sub text: pe o pistă albă,
    un singur element colorat se vede dintr-o privire. Portocaliul e cel
    închis (`caramiziu-700`), nu cel de brand: alb pe #F74F22 dă 3,44:1, sub
    pragul AA, iar textul meniului are 17 px, adică prea puțin pentru
    excepția de „text mare”. Pe 700 raportul urcă la 5,90:1.
  */
  const INTRARE_ACTIVA =
    "bg-caramiziu-700 text-hartie shadow-[0_8px_18px_-8px_rgba(184,43,9,0.95)]";

  return (
    <header
      className={`sticky top-0 z-50 bg-hartie transition-shadow duration-300 ease-cald ${
        compact
          ? "shadow-[0_1px_0_0_var(--color-hartie-umbra),0_14px_34px_-24px_rgba(35,35,35,0.5)]"
          : ""
      }`}
    >
      {/* Panglica mărcii: cele trei culori, una în alta, pe toată lățimea.
          Patru pixeli de culoare care spun al cui e site-ul înainte de orice
          text. Decorativă, deci în afara ordinii de citire. */}
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-caramiziu-500 via-miere-400 to-turcoaz-500"
      />

      {/* ——— Rândul de sus: sigla, datele de contact, Donează ——— */}
      <div
        className={`mx-auto flex max-w-7xl items-center gap-3 px-3 transition-[padding] duration-300 ease-cald min-[380px]:px-4 sm:px-6 lg:px-8 ${
          compact ? "py-1.5 xl:py-2" : "py-2.5 xl:py-3"
        }`}
      >
        {/* Mărimea aripii: 44 px până la 412, apoi 48, apoi 54 de la 640.
            Pragul de 412 e măsurat, nu ales: sub el, sigla, butonul Donează
            și hamburgerul lasă între ele exact spațiul minim dintre
            elemente, iar o aripă mai mare le-ar lipi una de alta. Sub 360 px
            Donează rămâne doar inimă, altfel nu încap toate trei. */}
        <Link
          href={RUTE.acasa}
          aria-label={`${ASOCIATIA.denumire} — prima pagină`}
          className="group flex shrink-0 rounded-full focus-visible:outline-caramiziu-500"
        >
          <Sigla
            className={`${marimeSigla} transition-[font-size] duration-300 ease-cald [&>img]:transition-transform [&>img]:duration-500 [&>img]:ease-cald group-hover:[&>img]:-rotate-6 group-hover:[&>img]:scale-110 motion-reduce:transition-none motion-reduce:[&>img]:transition-none`}
          />
        </Link>

        {/*
          Un singur telefon în antet, nu toate datele de contact.

          Înainte stăteau aici două numere unul sub altul la 15 px, plus
          e-mailul, plus trei pictograme de rețele: șase lucruri mărunte
          înghesuite care se citeau ca un bloc de text, nu ca un îndemn să
          suni. Acum e un singur număr, mare, cu eticheta lui — iar al doilea
          număr, e-mailul și rețelele sunt în subsol și pe pagina de contact,
          unde caietul le cere oricum (12.3). Rețelele chiar n-aveau ce căuta
          sus: trimit omul de pe site, exact în locul de unde vrem să nu
          plece.
        */}
        <a
          href={`tel:${TELEFON_PRINCIPAL.apel}`}
          className="group/tel ml-auto hidden items-center gap-3 rounded-full py-1.5 pr-5 pl-1.5 transition-colors duration-200 hover:bg-tenta-cald xl:flex"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 text-hartie shadow-[0_10px_20px_-10px_rgba(247,79,34,0.95)]">
            <Pictograma nume="telefon" className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-titlu text-nota font-bold tracking-[0.1em] text-cerneala-slab uppercase">
              Sună-ne
            </span>
            <span className="mt-1 font-titlu text-amplu font-extrabold text-cerneala transition-colors group-hover/tel:text-caramiziu-700">
              {TELEFON_PRINCIPAL.afisat}
            </span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-1.5 xl:ml-0 xl:gap-4">
          <span
            aria-hidden="true"
            className="hidden h-8 w-px bg-hartie-umbra xl:block"
          />
          {/*
            Alb pe portocaliul de brand (#F74F22) dă 3,44:1 — sub pragul AA de
            4,5:1 pentru text normal. De la 18,66 px aldin, WCAG cere doar
            3:1, iar 20 px trece. Pe ecran mic eticheta nu poate crește:
            măsurat la 360 px, între siglă și buton rămân exact 12 px, deci
            orice literă în plus ar împinge hamburgerul afară. Acolo rămâne
            sub prag, ca peste tot pe site unde un buton portocaliu are text
            mic — se rezolvă odată, pentru toate butoanele, când asociația
            decide (fie portocaliu mai închis, fie etichete mai mari).
          */}
          <Link
            href={RUTE.doneaza}
            aria-label="Donează"
            className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-2.5 font-titlu font-bold text-hartie shadow-[0_2px_0_0_var(--color-caramiziu-700),0_12px_28px_-12px_rgba(247,79,34,0.9)] transition-all duration-200 ease-cald hover:translate-y-px hover:shadow-[0_1px_0_0_var(--color-caramiziu-700),0_10px_30px_-8px_rgba(247,79,34,1)] motion-reduce:hover:translate-y-0 min-[360px]:px-3.5 min-[360px]:py-2.5 min-[412px]:px-4 ${
              compact ? "text-mic xl:py-2.5" : "xl:px-6 xl:py-3 xl:text-amplu"
            }`}
          >
            <Inima className="bate-la-hover size-5 min-[360px]:size-4" />
            <span className="hidden min-[360px]:inline">Donează</span>
          </Link>

          <button
            ref={hamburger}
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

      {/* ——— Rândul de jos: meniul, de la 1280 px în sus ———

          Meniul stă într-o pistă albă rotunjită, pe o bandă pastel. Înainte
          erau nouă cuvinte răsfirate pe un fundal aproape alb: se citeau ca
          un rând de text rămas acolo, nu ca un meniu. Pista le adună într-un
          singur obiect, iar banda colorată din spate o scoate în evidență —
          culoarea tare rămâne, ca peste tot pe site, doar pe bucăți mici. */}
      <div
        className={`hidden border-t border-hartie-umbra bg-gradient-to-r from-caramiziu-100 via-miere-100 to-turcoaz-100 transition-[padding] duration-300 ease-cald xl:block ${
          compact ? "py-1" : "py-2"
        }`}
      >
        <div className="mx-auto flex max-w-7xl justify-center px-4">
          <nav
            ref={navigatie}
            aria-label="Meniu principal"
            onMouseLeave={() => setPastila(null)}
            className={`relative flex items-center rounded-full border border-hartie/80 bg-hartie shadow-[0_12px_34px_-18px_rgba(35,35,35,0.5)] transition-[padding] duration-300 ease-cald ${
              compact ? "p-1" : "p-1.5"
            }`}
          >
            {/* Pastila care alunecă. Decorativă: nu intră în ordinea de citire.
              Se scalează pe orizontală când nu are unde să stea, ca să nu
              pornească niciodată de la invizibil. */}
            <span
              aria-hidden="true"
              /*
              Fără `-z-10`: un copil cu z-index negativ se desenează sub
              fundalul blocului părinte, iar banda meniului are fundal, deci
              pastila dispărea complet sub el. Lăsată pe `auto`, se desenează
              în ordinea din DOM — prima, deci sub etichete, exact unde
              trebuie.
            */
              className={`pointer-events-none absolute inset-y-0 rounded-full shadow-[0_6px_16px_-10px_rgba(35,35,35,0.6)] transition-[left,width,transform,background-color] duration-300 ease-cald motion-reduce:transition-none ${
                ACCENTE[pastilaDeDesenat?.accent ?? 0].tenta
              }`}
              style={{
                left: pastilaDeDesenat?.stanga ?? 0,
                width: pastilaDeDesenat?.latime ?? 0,
                transform: pastilaDeDesenat ? "scaleX(1)" : "scaleX(0)",
              }}
            />

            {MENIU.map((element, i) => {
              const accent = ACCENTE[i % ACCENTE.length];

              return element.subpagini ? (
                <div
                  key={element.eticheta}
                  className="relative"
                  onMouseEnter={(ev) => {
                    setSubmeniuDeschis(element.eticheta);
                    mutaPastila(
                      ev.currentTarget.firstElementChild as HTMLElement,
                      i % ACCENTE.length,
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
                    onFocus={(ev) =>
                      mutaPastila(ev.currentTarget, i % ACCENTE.length)
                    }
                    onClick={() =>
                      setSubmeniuDeschis(
                        submeniuDeschis === element.eticheta
                          ? null
                          : element.eticheta,
                      )
                    }
                    className={`${intrareDesktop} ${
                      element.subpagini.some((s) => activ(s.href))
                        ? INTRARE_ACTIVA
                        : `${accent.text} text-cerneala`
                    }`}
                  >
                    {element.eticheta}
                    <Sageata
                      className={`size-3 transition-transform duration-300 ease-cald motion-reduce:transition-none ${
                        submeniuDeschis === element.eticheta ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Submeniul stă mereu în pagină; deschis, coboară 6 px la
                    locul lui. `visibility` ține linkurile în afara ordinii de
                    tabulare cât e închis. */}
                  <div
                    className={`absolute top-full left-1/2 w-72 -translate-x-1/2 pt-2.5 transition-[transform,visibility] duration-200 ease-cald motion-reduce:transition-none ${
                      submeniuDeschis === element.eticheta
                        ? "visible translate-y-0"
                        : "invisible -translate-y-1.5"
                    }`}
                  >
                    <div className="overflow-hidden rounded-card border border-hartie-umbra bg-hartie p-2 shadow-[0_24px_60px_-26px_rgba(35,35,35,0.55)]">
                      {element.subpagini.map((sub, j) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          aria-current={activ(sub.href) ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-moale px-3.5 py-3 font-titlu font-bold whitespace-nowrap transition-[background-color,color,padding-left] duration-200 hover:pl-4.5 ${
                            activ(sub.href)
                              ? "bg-tenta-cald text-caramiziu-700"
                              : j % 2 === 0
                                ? "text-cerneala hover:bg-tenta-miere hover:text-miere-700"
                                : "text-cerneala hover:bg-tenta-turcoaz hover:text-turcoaz-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`size-2 shrink-0 rounded-full ${
                              activ(sub.href)
                                ? "bg-caramiziu-500"
                                : j % 2 === 0
                                  ? "bg-miere-400"
                                  : "bg-turcoaz-400"
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
                  onMouseEnter={(ev) =>
                    mutaPastila(ev.currentTarget, i % ACCENTE.length)
                  }
                  onFocus={(ev) =>
                    mutaPastila(ev.currentTarget, i % ACCENTE.length)
                  }
                  className={`${intrareDesktop} ${
                    activ(element.href!)
                      ? INTRARE_ACTIVA
                      : `${accent.text} text-cerneala`
                  }`}
                >
                  {element.eticheta}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Meniul de ecran mic. Stă în pagină tot timpul, cu înălțimea 0 când e
          închis: se desface în jos, în loc să apară din nimic. `inert` ține
          linkurile în afara tabulării și a cititoarelor de ecran cât e închis.
          Intrările vin pe rând, dar numai prin deplasare, niciodată din
          transparent: dacă tranziția nu rulează, rândurile sunt tot acolo. */}
      <div
        id="meniu-ecran-mic"
        inert={!meniuDeschis}
        className={`grid transition-[grid-template-rows] duration-300 ease-cald motion-reduce:transition-none xl:hidden ${
          meniuDeschis ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-hartie-umbra bg-gradient-to-b from-tenta-cald to-hartie-calda px-3 pt-3 pb-5 min-[380px]:px-4 sm:px-6">
            <nav
              aria-label="Meniu principal (ecran mic)"
              className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2 sm:gap-x-6"
            >
              {MENIU.map((element, i) => {
                const culoare = [
                  "bg-caramiziu-500",
                  "bg-miere-400",
                  "bg-turcoaz-500",
                ][i % 3];
                const miscare = {
                  transitionDelay: meniuDeschis ? `${i * 35}ms` : "0ms",
                };

                return element.subpagini ? (
                  <div
                    key={element.eticheta}
                    style={miscare}
                    className={`py-1 transition-transform duration-300 ease-cald motion-reduce:transition-none ${
                      meniuDeschis ? "translate-x-0" : "-translate-x-3"
                    }`}
                  >
                    <p className="flex items-center gap-2 px-3 pt-2 pb-1.5 font-titlu text-nota font-extrabold tracking-[0.08em] text-cerneala-slab uppercase">
                      <span
                        aria-hidden="true"
                        className={`size-2 rounded-full ${culoare}`}
                      />
                      {element.eticheta}
                    </p>
                    <div className="ml-4 grid gap-1 border-l-2 border-miere-200 pl-1">
                      {element.subpagini.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          aria-current={activ(sub.href) ? "page" : undefined}
                          className={`flex min-h-12 items-center rounded-moale px-3 py-2 font-titlu text-amplu font-bold transition-colors duration-200 hover:bg-hartie ${
                            activ(sub.href)
                              ? "bg-hartie text-caramiziu-700"
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
                    style={miscare}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-moale border border-transparent px-3 py-2 font-titlu text-amplu font-bold transition-[transform,background-color,color,border-color] duration-300 ease-cald hover:border-hartie-umbra hover:bg-hartie motion-reduce:transition-none ${
                      meniuDeschis ? "translate-x-0" : "-translate-x-3"
                    } ${
                      activ(element.href!)
                        ? "border-hartie-umbra bg-hartie text-caramiziu-700"
                        : "text-cerneala"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`size-2.5 shrink-0 rounded-full ${culoare}`}
                      />
                      {element.eticheta}
                    </span>
                    <Sageata className="size-3 -rotate-90 text-cerneala-slab" />
                  </Link>
                );
              })}
            </nav>

            <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-3 border-t border-hartie-umbra pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={RUTE.doneaza}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 px-6 py-3 font-titlu text-amplu font-bold text-hartie shadow-[0_2px_0_0_var(--color-caramiziu-700),0_12px_28px_-12px_rgba(247,79,34,0.9)] transition-all duration-200 ease-cald hover:translate-y-px motion-reduce:hover:translate-y-0 sm:order-2"
              >
                <Inima className="bate-la-hover size-5" />
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
                    className="inline-flex min-h-10 items-center font-titlu font-bold text-cerneala transition-colors hover:text-caramiziu-600"
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
