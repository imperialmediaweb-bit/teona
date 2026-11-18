import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Info, Plus } from "lucide-react";

/**
 * Piesele comune ale panoului (etapa 2, noiembrie 2026): aceleași peste tot,
 * ca o pagină să semene cu alta și omul să nu reînvețe fiecare ecran.
 *
 * **Culorile au sens** și înseamnă mereu același lucru:
 * - portocaliu-roșu (asociația): acțiunea principală, „nou / necitit”;
 * - verde: bani încasați, rezolvat, contract semnat;
 * - chihlimbar: e rândul nostru să facem ceva;
 * - albastru: așteptăm după ei, în lucru;
 * - gri: arhivat, a renunțat, fără activitate (fără text tăiat).
 * Etichetele au fundal foarte deschis și text închis din aceeași nuanță
 * (contrast AA).
 *
 * **Cardurile**: fundal alb pe pagina gri deschis, colțuri de 16 px, umbră
 * fină în loc de bordură groasă, ridicare de 1–2 px la hover în 150 ms.
 */

export type Ton = "nou" | "bani" | "deFacut" | "asteptam" | "gri";

const TON_ETICHETA: Record<Ton, string> = {
  nou: "bg-caramiziu-50 text-caramiziu-800",
  bani: "bg-emerald-50 text-emerald-800",
  deFacut: "bg-amber-50 text-amber-900",
  asteptam: "bg-sky-50 text-sky-900",
  gri: "bg-slate-100 text-slate-600",
};
const TON_PUNCT: Record<Ton, string> = {
  nou: "bg-caramiziu-600",
  bani: "bg-emerald-500",
  deFacut: "bg-amber-500",
  asteptam: "bg-sky-500",
  gri: "bg-slate-400",
};

/** Accentul fiecărei secțiuni a meniului, folosit discret (cerc cu iconița, bara de 3 px). */
export type Sectiune = "bani" | "sponsori" | "oameni" | "site" | "promovare" | "rapoarte";
const SECTIUNE: Record<Sectiune, { cerc: string; bara: string }> = {
  bani: { cerc: "bg-emerald-50 text-emerald-700", bara: "bg-emerald-400" },
  sponsori: { cerc: "bg-orange-50 text-orange-700", bara: "bg-orange-400" },
  oameni: { cerc: "bg-sky-50 text-sky-700", bara: "bg-sky-400" },
  site: { cerc: "bg-violet-50 text-violet-700", bara: "bg-violet-400" },
  promovare: { cerc: "bg-pink-50 text-pink-700", bara: "bg-pink-400" },
  rapoarte: { cerc: "bg-slate-100 text-slate-600", bara: "bg-slate-400" },
};

/** Clasa unui card: alb, colțuri 16 px, umbră fină. */
export const CARD =
  "rounded-2xl bg-hartie shadow-[0_1px_2px_rgb(30_20_10/0.05),0_4px_12px_rgb(30_20_10/0.05)]";
/** Același card, care se ridică puțin sub mouse (pentru cele pe care se apasă). */
export const CARD_ACTIV = `${CARD} transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgb(30_20_10/0.06),0_8px_20px_rgb(30_20_10/0.08)]`;

/** Eticheta de stadiu: un punct și un cuvânt, în culoarea sensului ei. */
export function Eticheta({ ton, children }: { ton: Ton; children: React.ReactNode }) {
  return (
    <span data-eticheta={ton} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-titlu text-[12.5px] font-bold whitespace-nowrap ${TON_ETICHETA[ton]}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${TON_PUNCT[ton]}`} />
      {children}
    </span>
  );
}

/** Butonul principal din antet: plin, „+ …”. */
export function ButonPrincipal({ href, children, ...rest }: { href: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      prefetch={false}
      {...rest}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-caramiziu-700 px-5 font-titlu text-[14px] font-bold whitespace-nowrap text-hartie shadow-sm transition-colors duration-150 hover:bg-caramiziu-800"
    >
      <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
      {children}
    </Link>
  );
}

/**
 * Cardul cu o cifră: eticheta mică sus, cifra mare (cifre tabulare), contextul
 * dedesubt și iconița secțiunii în colț. Cu `href`, e și filtru: clic pe el
 * arată numai ce numără.
 */
export function CardCifra({
  eticheta,
  valoare,
  context,
  sectiune,
  I,
  href,
  activ,
}: {
  eticheta: string;
  valoare: React.ReactNode;
  context?: React.ReactNode;
  sectiune: Sectiune;
  I?: LucideIcon;
  href?: string;
  activ?: boolean;
}) {
  const s = SECTIUNE[sectiune];
  const continut = (
    <>
      <span aria-hidden="true" className={`absolute inset-x-5 top-0 h-[3px] rounded-b ${s.bara}`} />
      {I && (
        <span aria-hidden="true" className={`absolute top-4 right-4 grid size-9 place-items-center rounded-full ${s.cerc}`}>
          <I className="size-[18px]" strokeWidth={1.9} />
        </span>
      )}
      <span className="block pr-10 text-[13px] font-semibold text-cerneala-moale">{eticheta}</span>
      <span className="mt-1 block font-titlu text-[30px] leading-tight font-semibold text-cerneala tabular-nums">{valoare}</span>
      {context && <span className="mt-0.5 block text-[13px] text-cerneala-slab">{context}</span>}
    </>
  );
  const clasa = `relative block overflow-hidden p-5 ${href ? CARD_ACTIV : CARD} ${activ ? "ring-2 ring-caramiziu-600" : ""}`;
  return href ? (
    <Link href={href} prefetch={false} aria-current={activ ? "true" : undefined} data-card-cifra className={clasa}>
      {continut}
    </Link>
  ) : (
    <div data-card-cifra className={clasa}>
      {continut}
    </div>
  );
}

/** Rândul cu cifre: 3–4 carduri, două pe rând pe telefon. */
export function CifreSus({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>;
}

/**
 * Rândul-card dintr-o listă: [iconiță sau inițiale] [titlu + o linie] [eticheta]
 * [data]. Tot rândul e un link; nimic nu se arată întreg aici.
 */
export function RandCard({
  href,
  semn,
  titlu,
  linie,
  eticheta,
  data,
  nou,
  ...date
}: {
  href: string;
  semn: React.ReactNode;
  titlu: React.ReactNode;
  linie?: React.ReactNode;
  eticheta?: React.ReactNode;
  data?: React.ReactNode;
  nou?: boolean;
} & { [k: `data-${string}`]: string | undefined }) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        {...date}
        className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-hartie-calda/70 sm:gap-4 sm:px-5 ${nou ? "bg-caramiziu-50/40" : ""}`}
      >
        <span className="relative shrink-0">
          {semn}
          {nou && <span aria-label="nou" role="img" className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-hartie bg-caramiziu-600" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-titlu text-[15px] text-cerneala ${nou ? "font-extrabold" : "font-bold"}`}>{titlu}</span>
          {linie && <span className="block truncate text-[13px] text-cerneala-moale">{linie}</span>}
        </span>
        {eticheta && <span className="hidden shrink-0 sm:block">{eticheta}</span>}
        {data && <span className="w-20 shrink-0 text-right text-[13px] text-cerneala-slab tabular-nums">{data}</span>}
      </Link>
    </li>
  );
}

/** Lista de rânduri-card, într-un singur card, cu linii subțiri între rânduri. */
export function ListaCarduri({ children }: { children: React.ReactNode }) {
  return <ul className={`${CARD} divide-y divide-hartie-umbra/70 overflow-hidden`}>{children}</ul>;
}

/** Semnul din stânga unui rând: o iconiță în cerc, în culoarea secțiunii. */
export function SemnIconita({ I, sectiune }: { I: LucideIcon; sectiune: Sectiune }) {
  return (
    <span aria-hidden="true" className={`grid size-10 place-items-center rounded-full ${SECTIUNE[sectiune].cerc}`}>
      <I className="size-[18px]" strokeWidth={1.9} />
    </span>
  );
}

/** Starea goală: iconiță mare, deschisă la culoare, o propoziție și acțiunea. */
export function StareGoala({ I, text, actiune }: { I: LucideIcon; text: React.ReactNode; actiune?: React.ReactNode }) {
  return (
    <div data-stare-goala className={`${CARD} grid place-items-center gap-3 px-6 py-12 text-center`}>
      <span aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-hartie-calda text-cerneala-slab/70">
        <I className="size-8" strokeWidth={1.5} />
      </span>
      <p className="max-w-md text-[15px] text-cerneala-moale">{text}</p>
      {actiune}
    </div>
  );
}

/** Filele de stadiu: un singur rând, cu numărul alături. */
export function File({ file }: { file: ReadonlyArray<{ eticheta: string; href: string; numar?: number; activ: boolean }> }) {
  return (
    <nav aria-label="Filtre" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {file.map((f) => (
        <Link
          key={f.href}
          href={f.href}
          prefetch={false}
          aria-current={f.activ ? "page" : undefined}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-titlu text-[14px] font-bold whitespace-nowrap transition-colors duration-150 ${
            f.activ ? "bg-cerneala text-hartie" : "text-cerneala-moale hover:bg-hartie hover:text-cerneala"
          }`}
        >
          {f.eticheta}
          {f.numar !== undefined && (
            <span className={`rounded-full px-1.5 text-[12px] font-semibold ${f.activ ? "bg-hartie/20" : "bg-hartie-umbra/70 text-cerneala-slab"}`}>{f.numar}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** „ⓘ Cum funcționează”: explicațiile lungi stau pliate, nu ca paragraf mare pe pagină. */
export function CumFunctioneaza({ titlu = "Cum funcționează", children }: { titlu?: string; children: React.ReactNode }) {
  return (
    <details data-cum-functioneaza className="group/cum mt-6 max-w-3xl text-[14px] text-cerneala-moale">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold text-cerneala-moale hover:text-cerneala [&::-webkit-details-marker]:hidden">
        <Info className="size-4" aria-hidden="true" />
        {titlu}
      </summary>
      <div className={`${CARD} mt-3 grid gap-2 p-5 leading-relaxed`}>{children}</div>
    </details>
  );
}
