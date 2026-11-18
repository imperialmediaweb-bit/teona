"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Building2,
  Cake,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileSignature,
  FileText,
  HandCoins,
  Heart,
  HeartHandshake,
  Home,
  Image as Imagine,
  Inbox,
  KeyRound,
  LayoutTemplate,
  LineChart,
  ListTodo,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Newspaper,
  QrCode,
  Radar,
  Search,
  Settings,
  Share2,
  Tent,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ButonCautare, deschideCautarea } from "@/componente/admin/CautareRapida";
import { CULORI_SECTIUNI, eActiva, type GrupaMeniu, type IntrareMeniu, type NumeIconita } from "@/componente/admin/meniu-date";

/**
 * Meniul panoului. Stă în `admin/layout.tsx`, deci rămâne pe loc de la o
 * pagină la alta (nu se mai redesenează, nu-și pierde derularea): se schimbă
 * numai elementul activ, citit din adresă, și bulinele, cerute din nou la
 * fiecare schimbare de pagină — ca să spună același lucru ca pagina deschisă.
 *
 * Pe ecran lat: bara din stânga, care se poate restrânge la iconițe (alegerea
 * se ține minte). Pe telefon: sertarul din stânga, peste pagină, și o bară
 * de scurtături jos (Acasă · De făcut · Firme · Cereri · Caută).
 */

const ICONITE: Record<NumeIconita, LucideIcon> = {
  acasa: Home,
  donatii: HandCoins,
  donatori: Users,
  formular: FileText,
  firme: Building2,
  contracte: FileSignature,
  radar: Radar,
  cereri: Inbox,
  voluntari: HeartHandshake,
  aniversari: Cake,
  blog: Newspaper,
  campanii: Heart,
  tabere: Tent,
  pagini: LayoutTemplate,
  poze: Imagine,
  calendar: CalendarDays,
  emailuri: Mail,
  abonati: UserPlus,
  facebook: Share2,
  presa: Megaphone,
  qr: QrCode,
  rapoarte: BarChart3,
  analiza: LineChart,
  setari: Settings,
};

export type Semne = { pe: Record<string, number>; total: number };

/*
  „Restrâns” stă în `localStorage`, citit ca un magazin extern: pe server și
  la prima desenare meniul e lat; dacă stocarea e blocată, rămâne lat.
*/
const CHEIE = "teona-meniu-restrans";
const ascultatori = new Set<() => void>();
function citesteRestrans(): boolean {
  try {
    return localStorage.getItem(CHEIE) === "1";
  } catch {
    return false;
  }
}
function scrieRestrans(da: boolean) {
  try {
    localStorage.setItem(CHEIE, da ? "1" : "0");
  } catch {}
  ascultatori.forEach((f) => f());
}
const asculta = (f: () => void) => {
  ascultatori.add(f);
  return () => {
    ascultatori.delete(f);
  };
};

function Bulina({ nr, aici }: { nr: number; aici: boolean }) {
  if (!nr) return null;
  return (
    <span
      role="img"
      aria-label={`${nr} de făcut`}
      className={`ml-auto grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full px-1.5 text-[11px] leading-none font-bold group-data-[restrans=true]/bara:absolute group-data-[restrans=true]/bara:top-0.5 group-data-[restrans=true]/bara:right-1 group-data-[restrans=true]/bara:h-4 group-data-[restrans=true]/bara:min-w-4 group-data-[restrans=true]/bara:px-1 ${
        aici ? "bg-white text-caramiziu-800" : "bg-caramiziu-600 text-white"
      }`}
    >
      {nr}
    </span>
  );
}

function Element({ p, culoare, aici, nr }: { p: IntrareMeniu; culoare: string; aici: boolean; nr: number }) {
  const router = useRouter();
  const I = ICONITE[p.iconita];
  const href = p.cuSemn && nr > 0 ? p.cuSemn : p.href;
  return (
    <Link
      href={href}
      /* Fără preîncărcare la vedere (fiecare pagină interoghează baza), dar da la trecerea mouse-ului. */
      prefetch={false}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      aria-current={aici ? "page" : undefined}
      title={p.eticheta}
      style={{ "--sectiune": culoare } as React.CSSProperties}
      data-meniu={p.href}
      className={`relative flex h-9 items-center gap-3 rounded-[10px] px-3 font-titlu text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-150 group-data-[restrans=true]/bara:justify-center group-data-[restrans=true]/bara:px-0 ${
        aici
          ? "bg-[color-mix(in_srgb,var(--sectiune)_16%,transparent)] text-white before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-[var(--sectiune)]"
          : "text-white/70 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <I aria-hidden="true" className={`size-[18px] shrink-0 ${aici ? "text-[var(--sectiune)]" : ""}`} strokeWidth={1.9} />
      <span className="min-w-0 truncate group-data-[restrans=true]/bara:sr-only">{p.eticheta}</span>
      <Bulina nr={nr} aici={aici} />
    </Link>
  );
}

export default function MeniuPanou({
  sigla,
  grupuri,
  acasa,
  setari,
  semneInitiale,
  cont,
}: {
  sigla: React.ReactNode;
  grupuri: readonly GrupaMeniu[];
  acasa: IntrareMeniu;
  setari: IntrareMeniu | null;
  semneInitiale: Semne;
  cont: { nume: string; rol: string; initiale: string; parola: boolean };
}) {
  const restrans = useSyncExternalStore(asculta, citesteRestrans, () => false);
  const [deschis, setDeschis] = useState(false);
  const cale = usePathname();
  const fel = useSearchParams().get("fel");
  const [semne, setSemne] = useState<Semne>(semneInitiale);

  // La fiecare schimbare de pagină, bulinele din nou: spun ce spune pagina deschisă.
  useEffect(() => {
    const opreste = new AbortController();
    fetch("/api/admin/semne", { signal: opreste.signal, credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Semne | null) => {
        if (j && typeof j.total === "number") setSemne(j);
      })
      .catch(() => {});
    return () => opreste.abort();
  }, [cale, fel]);

  const nr = (p: IntrareMeniu) => (p.href.includes("?") ? 0 : (semne.pe[p.href] ?? 0));
  const inchide = () => setDeschis(false);

  return (
    <>
      {/* Telefon: bara de sus, cu meniul și căutarea. */}
      <div className="sticky top-0 z-40 flex items-center gap-2 bg-[#272320] px-3 py-2 lg:hidden">
        <button type="button" onClick={() => setDeschis(true)} aria-label="Deschide meniul" className="relative grid size-10 place-items-center rounded-[10px] text-white/80 hover:bg-white/[0.06]">
          <Menu className="size-5" />
          {semne.total > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full border-2 border-[#272320] bg-caramiziu-500" />}
        </button>
        <div className="min-w-0 flex-1">{sigla}</div>
        <button type="button" onClick={deschideCautarea} aria-label="Caută" className="grid size-10 place-items-center rounded-[10px] text-white/80 hover:bg-white/[0.06]">
          <Search className="size-5" />
        </button>
      </div>

      {deschis && <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={inchide} aria-hidden="true" />}

      <aside
        data-restrans={restrans}
        aria-label="Meniul panoului"
        onClick={(e) => {
          // Pe telefon, un clic pe un link din sertar îl închide.
          if ((e.target as HTMLElement).closest("a")) inchide();
        }}
        className={`group/bara fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#272320] text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0 lg:shrink-0 lg:shadow-none lg:transition-[width] ${
          deschis ? "translate-x-0" : "-translate-x-full"
        } ${restrans ? "lg:w-[68px]" : "lg:w-64"}`}
      >
        <button type="button" onClick={inchide} aria-label="Închide meniul" className="absolute top-3 right-3 grid size-9 place-items-center rounded-[10px] text-white/70 hover:bg-white/[0.06] lg:hidden">
          <X className="size-5" />
        </button>

        <div className="px-4 pt-4 pb-3 group-data-[restrans=true]/bara:px-2">
          <div className="group-data-[restrans=true]/bara:hidden">{sigla}</div>
          <Link
            href="/admin"
            prefetch={false}
            aria-label="Acasă"
            className="mx-auto hidden size-10 place-items-center rounded-xl bg-caramiziu-600 font-titlu text-sm font-bold text-white group-data-[restrans=true]/bara:grid"
          >
            TA
          </Link>
        </div>
        <div className="px-3 pb-3">
          <ButonCautare />
        </div>

        <nav aria-label="Panou" className="bara-subtire min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid gap-4">
            <ul>
              <li>
                <Element p={acasa} culoare={CULORI_SECTIUNI.acasa} aici={eActiva(acasa, cale, fel)} nr={semne.total} />
              </li>
            </ul>
            {grupuri.map((g) => (
              <div key={g.titlu}>
                <p className="mb-1 px-3 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-white/40 uppercase group-data-[restrans=true]/bara:sr-only">
                  {g.titlu}
                </p>
                <div aria-hidden="true" className="mx-3 mb-2 hidden h-px bg-white/10 group-data-[restrans=true]/bara:block" />
                <ul className="grid gap-0.5">
                  {g.pagini.map((p) => (
                    <li key={p.href}>
                      <Element p={p} culoare={g.culoare} aici={eActiva(p, cale, fel)} nr={nr(p)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="grid gap-1 border-t border-white/10 px-3 pt-3 pb-2">
          {setari && <Element p={setari} culoare={CULORI_SECTIUNI.rapoarte} aici={eActiva(setari, cale, fel)} nr={0} />}
          {/* Contul: avatar și rol; la clic, un meniu mic. */}
          <details className="relative">
            <summary
              title={`${cont.nume} · ${cont.rol}`}
              className="flex h-11 cursor-pointer list-none items-center gap-2.5 rounded-[10px] px-2 hover:bg-white/[0.06] group-data-[restrans=true]/bara:justify-center [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-caramiziu-600 text-[11px] font-bold text-white">
                {cont.initiale}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/70 group-data-[restrans=true]/bara:sr-only">
                {cont.nume} · {cont.rol}
              </span>
            </summary>
            <div className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-xl bg-[#34302c] p-1.5 shadow-2xl ring-1 ring-white/10">
              <Link href="/" prefetch={false} className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-white/80 hover:bg-white/[0.08]">
                <ExternalLink className="size-4" aria-hidden="true" /> Vezi site-ul
              </Link>
              {cont.parola && (
                <Link href="/admin/parola" prefetch={false} className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-white/80 hover:bg-white/[0.08]">
                  <KeyRound className="size-4" aria-hidden="true" /> Parola mea
                </Link>
              )}
              {/* Ieșirea prin POST: un link s-ar deschide din greșeală (sau dintr-o imagine străină). */}
              <form action="/api/admin/iesire" method="post">
                <button type="submit" className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-white/80 hover:bg-white/[0.08]">
                  <LogOut className="size-4" aria-hidden="true" /> Ieși din panou
                </button>
              </form>
            </div>
          </details>
          <button
            type="button"
            onClick={() => scrieRestrans(!restrans)}
            aria-label={restrans ? "Lărgește meniul" : "Restrânge meniul la iconițe"}
            title={restrans ? "Lărgește meniul" : "Restrânge meniul"}
            className="hidden h-8 items-center gap-2 rounded-[10px] px-2 text-[12px] font-semibold text-white/45 hover:bg-white/[0.06] hover:text-white/80 lg:flex group-data-[restrans=true]/bara:justify-center"
          >
            {restrans ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            <span className="group-data-[restrans=true]/bara:hidden">Restrânge</span>
          </button>
        </div>
      </aside>

      {/* Telefon: bara de jos. */}
      <nav aria-label="Scurtături" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#272320] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[
          { href: "/admin", eticheta: "Acasă", I: Home, n: 0 },
          { href: "/admin#de-facut", eticheta: "De făcut", I: ListTodo, n: semne.total },
          { href: "/admin/firme", eticheta: "Firme", I: Building2, n: 0 },
          { href: "/admin/cereri", eticheta: "Cereri", I: Inbox, n: 0 },
        ].map(({ href, eticheta, I, n }) => (
          <Link key={href} href={href} prefetch={false} className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-white/70 active:text-white">
            <I className="size-5" aria-hidden="true" />
            {eticheta}
            {n > 0 && (
              <span className="absolute top-1 left-[calc(50%+6px)] grid h-4 min-w-4 place-items-center rounded-full bg-caramiziu-600 px-1 text-[10px] font-bold text-white">
                {n}
              </span>
            )}
          </Link>
        ))}
        <button type="button" onClick={deschideCautarea} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-white/70 active:text-white">
          <Search className="size-5" aria-hidden="true" />
          Caută
        </button>
      </nav>
    </>
  );
}
