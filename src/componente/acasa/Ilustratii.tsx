import type { SVGProps } from "react";

/**
 * Desenele primei pagini: hârtie tăiată, nu pictograme.
 *
 * Toate formele de aici sunt tăiate dintr-o singură mișcare, fără detalii
 * mărunte, ca formele decupate din hârtie colorată pe care le fac copiii la
 * atelierul creativ de la Casa Teona. Marginile sunt ușor inegale, deliberat:
 * o formă perfect geometrică arată a șablon, una tăiată de mână arată a
 * carte de povești.
 *
 * Nimic de aici nu se mișcă. Publicul site-ului sunt copii cu autism, pentru
 * care un soare care pulsează sau un zmeu care zboară prin pagină e zgomot,
 * nu bucurie. Desenele stau pe loc, ca într-o carte; pagina se derulează, nu
 * ilustrația.
 *
 * Toate sunt `aria-hidden`: niciuna nu înlocuiește un text.
 */

type Proprietati = SVGProps<SVGSVGElement>;

const comune = {
  "aria-hidden": true,
  focusable: "false",
} as const;

/**
 * Dealurile care leagă două secțiuni.
 *
 * Trei straturi de hârtie, unul peste altul, ca într-un decor de teatru de
 * hârtie: dealul din spate și cel din mijloc sunt în nuanțe spălate, iar cel
 * din față are exact culoarea secțiunii de dedesubt, ca trecerea să fie
 * fără cusătură. Așa pagina nu mai e o stivă de benzi, ci un peisaj care
 * coboară de sus în jos.
 */
export function Dealuri({
  /** Culoarea secțiunii de dedesubt — dealul din față. */
  fata,
  /** Dealul din mijloc, de obicei o tentă din aceeași familie. */
  mijloc,
  /** Dealul din spate, cel mai spălat. */
  spate,
  className = "",
}: {
  fata: string;
  mijloc: string;
  spate: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative z-10 -mb-px w-full ${className}`}
    >
      <svg
        viewBox="0 0 1440 170"
        preserveAspectRatio="none"
        className="block h-20 w-full sm:h-28 lg:h-[11rem]"
        {...comune}
      >
        <path
          className={spate}
          fill="currentColor"
          d="M0 170V92C150 58 290 46 450 66c130 16 230 54 380 44 150-10 240-68 390-72 90-2 160 14 220 38v64H0z"
        />
        <path
          className={mijloc}
          fill="currentColor"
          d="M0 170v-52c190-26 330-14 520 20 140 26 260 28 420 6 160-22 300-62 500-28v54H0z"
        />
        <path
          className={fata}
          fill="currentColor"
          d="M0 170v-28c200-24 380-24 580-6 190 18 330 36 520 14 130-14 240-26 340-10v30H0z"
        />
      </svg>
    </div>
  );
}

/** Un nor tăiat din hârtie albă, cu o margine abia conturată. */
export function Nor(props: Proprietati) {
  return (
    <svg viewBox="0 0 160 70" {...comune} {...props}>
      <path
        fill="currentColor"
        d="M24 64c-12 0-20-8-20-18 0-9 7-16 16-18 3-14 15-23 29-23 11 0 21 6 26 15 3-1 6-2 9-2 12 0 22 9 23 21 7 1 13 7 13 14 0 7-6 11-13 11H24z"
      />
    </svg>
  );
}

/**
 * Soarele: un disc și raze inegale, trase cu mâna.
 *
 * Razele nu sunt la distanțe egale și nu au aceeași lungime — exact cum
 * desenează un copil soarele. Culoarea rămâne a mierii, nu portocaliul tare:
 * portocaliul tare e păstrat pentru butoane.
 */
export function Soare(props: Proprietati) {
  return (
    <svg viewBox="0 0 120 120" {...comune} {...props}>
      <circle cx="60" cy="60" r="27" fill="currentColor" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path d="M60 8v16M60 96v18M8 60h17M95 62h18M23 22l12 12M85 86l11 11M20 98l13-12M86 34l11-12" />
      </g>
    </svg>
  );
}

/**
 * Zmeul: un romb în două culori și o coadă cu fundițe.
 *
 * Singura formă din pagină desenată în două culori odată, ca să fie
 * personajul mic al poveștii: apare o dată sus, lângă titlu, și atât.
 */
export function Zmeu(props: Proprietati) {
  return (
    <svg viewBox="0 0 120 200" {...comune} {...props}>
      <path d="M60 6 100 58 60 128Z" className="text-miere-400" fill="currentColor" />
      <path d="M60 6 20 58l40 70Z" className="text-caramiziu-500" fill="currentColor" />
      <path
        d="M60 6v122M20 58h80"
        className="text-hartie"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.6"
      />
      <path
        d="M60 128c-10 14 12 24-2 38s12 26-4 34"
        className="text-cerneala-moale"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g className="text-turcoaz-400" fill="currentColor">
        <path d="M50 152l12-6-2 12z" />
        <path d="M62 180l-12-4 10-8z" />
      </g>
    </svg>
  );
}

/** Trei baloane legate cu sfoară, în cele trei culori ale casei. */
export function Baloane(props: Proprietati) {
  return (
    <svg viewBox="0 0 140 220" {...comune} {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-cerneala-moale"
      >
        <path d="M46 92c10 30 20 60 24 120M92 82c-6 40-18 70-22 130M68 104c2 30 4 70 2 108" />
      </g>
      <ellipse cx="44" cy="58" rx="30" ry="36" className="text-caramiziu-400" fill="currentColor" />
      <ellipse cx="94" cy="48" rx="28" ry="34" className="text-miere-400" fill="currentColor" />
      <ellipse cx="68" cy="74" rx="26" ry="31" className="text-turcoaz-400" fill="currentColor" />
      <g className="text-hartie" fill="currentColor" fillOpacity="0.45">
        <ellipse cx="34" cy="42" rx="7" ry="11" transform="rotate(-20 34 42)" />
        <ellipse cx="85" cy="32" rx="6" ry="10" transform="rotate(-20 85 32)" />
        <ellipse cx="59" cy="62" rx="6" ry="9" transform="rotate(-20 59 62)" />
      </g>
    </svg>
  );
}

/**
 * Căsuța cu inimă: ilustrația pentru „Cazuri umanitare”.
 *
 * Caietul cere acolo o imagine fără chipuri recognoscibile; până vine una
 * verificată de la asociație, locul ei îl ține un desen — nu o fotografie
 * de arhivă la întâmplare, nici un bloc gol.
 */
export function Casuta(props: Proprietati) {
  return (
    <svg viewBox="0 0 320 400" {...comune} {...props}>
      {/* cerul */}
      <rect width="320" height="400" className="text-tenta-miere" fill="currentColor" />
      <circle cx="252" cy="78" r="34" className="text-miere-300" fill="currentColor" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-miere-300"
      >
        <path d="M252 26v12M252 118v12M200 78h12M292 80h12M216 42l8 8M280 108l8 8M214 114l8-8M288 50l8-8" />
      </g>
      <g className="text-hartie" fill="currentColor">
        <path d="M48 118c-9 0-15-6-15-13s5-12 12-13c2-10 11-17 22-17 8 0 15 4 19 11 2-1 4-1 6-1 9 0 16 7 17 15 5 1 9 5 9 10 0 5-4 8-10 8H48z" />
      </g>
      {/* dealurile */}
      <path
        d="M0 400V290c70-30 130-30 190-8 50 18 90 20 130 2v116z"
        className="text-turcoaz-200"
        fill="currentColor"
      />
      <path
        d="M0 400v-72c90-28 170-20 240 4 30 10 55 12 80 6v62z"
        className="text-turcoaz-300"
        fill="currentColor"
      />
      {/* casa */}
      <path d="M96 300V208l64-52 64 52v92z" className="text-hartie" fill="currentColor" />
      <path d="M78 214l82-70 82 70" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" className="text-caramiziu-500" />
      <rect x="140" y="248" width="40" height="52" rx="4" className="text-caramiziu-400" fill="currentColor" />
      <rect x="108" y="226" width="26" height="24" rx="3" className="text-turcoaz-300" fill="currentColor" />
      <rect x="186" y="226" width="26" height="24" rx="3" className="text-turcoaz-300" fill="currentColor" />
      <path
        d="M160 200c-2-2-13-7-14-15-1-6 4-11 9-10 2 0 4 2 5 4 1-2 3-4 5-4 5-1 10 4 9 10-1 8-12 13-14 15z"
        className="text-caramiziu-500"
        fill="currentColor"
      />
      {/* copăcei */}
      <g className="text-turcoaz-500" fill="currentColor">
        <circle cx="52" cy="278" r="22" />
        <circle cx="270" cy="286" r="18" />
      </g>
      <g className="text-miere-700" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M52 300v24M270 304v20" />
      </g>
    </svg>
  );
}

/**
 * O săgeată trasă cu mâna, care leagă o adnotare de lucrul despre care
 * vorbește. Curba e deliberat neregulată; vârful e desenat din două linii,
 * nu dintr-un triunghi.
 */
export function SageataDesenata({
  intoarsa = false,
  ...props
}: Proprietati & { intoarsa?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...comune}
      {...props}
    >
      <g transform={intoarsa ? "translate(120 0) scale(-1 1)" : undefined}>
        <path d="M6 10c16 30 48 50 96 52" />
        <path d="M86 50l18 12-16 10" />
      </g>
    </svg>
  );
}

/**
 * Bandă adezivă: ține pozele și cărțile de hârtie lipite în album.
 *
 * E ușor translucidă și cu capetele tăiate strâmb, ca banda ruptă cu mâna.
 * Doar decor; nu are nevoie de niciun text.
 */
export function Banda({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-7 w-24 bg-miere-200/70 [clip-path:polygon(2%_0,98%_4%,100%_96%,1%_100%)] shadow-[0_1px_2px_rgba(35,35,35,0.12)] ${className}`}
    />
  );
}

/**
 * O bifă trasă cu carioca, pentru listele scurte.
 */
export function Bifa(props: Proprietati) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...comune}
      {...props}
    >
      <path d="M6 17l7 7L27 8" />
    </svg>
  );
}

/**
 * O pată de culoare tăiată din hârtie — fundalul unei cifre sau al unei
 * pictograme. Patru forme, ca vecinele să nu fie identice.
 */
const PETE = [
  "M44 4c18-4 42 2 50 20 6 14-2 32-12 44-12 14-34 22-54 16C10 78 0 60 2 42 4 22 24 8 44 4z",
  "M50 2c20 0 42 10 46 30 4 18-8 36-24 48-14 10-36 14-52 4C6 76-2 56 4 38 10 18 28 2 50 2z",
  "M38 6c22-10 48 2 56 22 6 16 0 34-14 46-14 12-36 16-54 8C10 76 2 58 6 40c4-16 16-28 32-34z",
  "M52 4c20 2 40 16 44 36 4 18-10 34-26 44-16 10-38 10-54-2C2 70-2 50 6 32 14 14 32 2 52 4z",
] as const;

export function Pata({
  varianta = 0,
  ...props
}: Proprietati & { varianta?: number }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...comune} {...props}>
      <path d={PETE[varianta % PETE.length]} fill="currentColor" />
    </svg>
  );
}

/** Un copăcel rotund, pentru dealuri. */
export function Copac(props: Proprietati) {
  return (
    <svg viewBox="0 0 60 90" {...comune} {...props}>
      <path d="M30 86V58" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-miere-700" />
      <path
        d="M30 4c16 0 28 14 28 30 0 14-10 28-28 28S2 48 2 34C2 18 14 4 30 4z"
        fill="currentColor"
      />
    </svg>
  );
}
