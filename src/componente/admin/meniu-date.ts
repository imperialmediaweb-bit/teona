import type { NumePictograma } from "@/componente/Pictograma";

/**
 * Meniul panoului, ca date: îl citesc și serverul (drepturile, bulinele), și
 * browserul (care element e activ, restrângerea, căutarea rapidă). Iconițele
 * sunt nume, nu componente: o funcție nu trece de la server la browser.
 *
 * Grupat pe treburi (noiembrie 2026), cu nume scurte, toate grupele deschise.
 * Fiecare secțiune are culoarea ei, folosită discret: bara de 3 px a
 * elementului activ și fundalul lui. Bani verde · Sponsori portocaliu ·
 * Oameni albastru · Site violet · Promovare roz · Rapoarte gri-albastru.
 */

export type NumeIconita =
  | "acasa" | "donatii" | "donatori" | "formular" | "firme" | "contracte" | "radar"
  | "cereri" | "voluntari" | "aniversari" | "blog" | "campanii" | "tabere" | "pagini"
  | "poze" | "calendar" | "emailuri" | "abonati" | "facebook" | "presa" | "qr"
  | "rapoarte" | "analiza" | "setari";

export type IntrareMeniu = {
  href: string;
  eticheta: string;
  iconita: NumeIconita;
  /** Alte adrese pe care intrarea e „aici”. */
  si?: readonly string[];
  /** Unde duce intrarea când are bulină (lucrul nou, filtrat). */
  cuSemn?: string;
};

export type GrupaMeniu = { titlu: string; culoare: string; pagini: readonly IntrareMeniu[] };

export const CULORI_SECTIUNI = {
  acasa: "#f97341",
  bani: "#34d399",
  sponsori: "#fb923c",
  oameni: "#60a5fa",
  site: "#a78bfa",
  promovare: "#f472b6",
  rapoarte: "#94a3b8",
} as const;

export const ACASA: IntrareMeniu = { href: "/admin", eticheta: "Acasă", iconita: "acasa" };

export const GRUPURI_MENIU: readonly GrupaMeniu[] = [
  {
    titlu: "Bani",
    culoare: CULORI_SECTIUNI.bani,
    pagini: [
      { href: "/admin/donatii", eticheta: "Donații", iconita: "donatii" },
      { href: "/admin/donatori", eticheta: "Donatori", iconita: "donatori" },
      { href: "/admin/formulare", eticheta: "Formular 230", iconita: "formular" },
    ],
  },
  {
    titlu: "Sponsori și finanțări",
    culoare: CULORI_SECTIUNI.sponsori,
    pagini: [
      { href: "/admin/firme", eticheta: "Firme", iconita: "firme", cuSemn: "/admin/firme?fila=raspuns&necitite=1" },
      { href: "/admin/contracte", eticheta: "Contracte", iconita: "contracte" },
      { href: "/admin/radar", eticheta: "Radar finanțări", iconita: "radar" },
    ],
  },
  {
    titlu: "Oameni",
    culoare: CULORI_SECTIUNI.oameni,
    pagini: [
      { href: "/admin/cereri", eticheta: "Cereri", iconita: "cereri" },
      { href: "/admin/voluntari", eticheta: "Voluntari", iconita: "voluntari" },
      { href: "/admin/aniversari", eticheta: "Aniversări", iconita: "aniversari" },
    ],
  },
  {
    titlu: "Site",
    culoare: CULORI_SECTIUNI.site,
    pagini: [
      { href: "/admin/scrie?fel=noutate", eticheta: "Blog", iconita: "blog", si: ["/admin/scrie"] },
      { href: "/admin/scrie?fel=campanie", eticheta: "Campanii", iconita: "campanii" },
      { href: "/admin/scrie?fel=proiect", eticheta: "Tabere", iconita: "tabere" },
      {
        href: "/admin/pagini",
        eticheta: "Pagini",
        iconita: "pagini",
        si: ["/admin/texte", "/admin/cifre", "/admin/documente", "/admin/sponsori", "/admin/testimoniale", "/admin/echipa", "/admin/aparitii"],
      },
      { href: "/admin/poze", eticheta: "Poze", iconita: "poze" },
    ],
  },
  {
    titlu: "Promovare",
    culoare: CULORI_SECTIUNI.promovare,
    pagini: [
      { href: "/admin/calendar", eticheta: "Calendar", iconita: "calendar" },
      { href: "/admin/emailuri", eticheta: "E-mailuri", iconita: "emailuri", si: ["/admin/sabloane"] },
      { href: "/admin/abonati", eticheta: "Abonați", iconita: "abonati" },
      { href: "/admin/facebook", eticheta: "Facebook", iconita: "facebook" },
      { href: "/admin/presa", eticheta: "Presă", iconita: "presa" },
      { href: "/admin/qr", eticheta: "Coduri QR", iconita: "qr" },
    ],
  },
  {
    titlu: "Rapoarte",
    culoare: CULORI_SECTIUNI.rapoarte,
    pagini: [
      { href: "/admin/rapoarte", eticheta: "Rapoarte", iconita: "rapoarte" },
      { href: "/admin/analiza", eticheta: "Analiză", iconita: "analiza" },
    ],
  },
];

export const SETARI: IntrareMeniu = { href: "/admin/setari", eticheta: "Setări", iconita: "setari", si: ["/admin/utilizatori", "/admin/parola"] };

/**
 * E intrarea activă pentru adresa de acum? Adresa exactă, una din `si`, sau o
 * pagină de sub ea (`/admin/firme/<id>/mesaje` → Firme). Intrările cu `?fel=`
 * se potrivesc numai cu același `fel` (Blog / Campanii / Tabere).
 */
export function eActiva(p: IntrareMeniu, cale: string, fel: string | null): boolean {
  const [baza, interogare] = p.href.split("?");
  const felCerut = interogare ? new URLSearchParams(interogare).get("fel") : null;
  if (p.si?.includes(cale) && !(felCerut && fel && fel !== felCerut)) return true;
  if (baza === "/admin") return cale === "/admin";
  const sub = cale === baza || cale.startsWith(`${baza}/`);
  if (!sub) return false;
  return felCerut ? fel === felCerut : true;
}

/** Acțiunile din căutarea rapidă, cu pagina care trebuie să fie deschisă rolului. */
export const ACTIUNI_RAPIDE: ReadonlyArray<{ eticheta: string; detaliu: string; href: string; pictograma: NumePictograma; drept: string }> = [
  { eticheta: "Donație nouă", detaliu: "Trece o donație de mână", href: "/admin/donatii?de-mana=1#de-mana", pictograma: "inima", drept: "/admin/donatii" },
  { eticheta: "E-mail nou către o firmă", detaliu: "Una, mai multe sau una nouă", href: "/admin/firme/scrie", pictograma: "plic", drept: "/admin/firme" },
  { eticheta: "Articol nou", detaliu: "Pe blog", href: "/admin/scrie/nou?fel=noutate", pictograma: "document", drept: "/admin/scrie" },
  { eticheta: "Campanie nouă", detaliu: "Pe site", href: "/admin/scrie/nou?fel=campanie", pictograma: "inima", drept: "/admin/scrie" },
  { eticheta: "Comunicat de presă", detaliu: "Către redacții", href: "/admin/presa#trimite", pictograma: "comunicare", drept: "/admin/presa" },
  { eticheta: "Raport lunar", detaliu: "PDF pentru o lună încheiată", href: "/admin/rapoarte#raport-luna", pictograma: "grafic", drept: "/admin/rapoarte" },
];

/** Paginile pentru căutarea rapidă (și cele strânse sub „Pagini” și „Setări”, care altfel n-ar avea nume). */
export const PAGINI_RAPIDE: ReadonlyArray<{ eticheta: string; detaliu: string; href: string; pictograma: NumePictograma }> = [
  { eticheta: "Acasă", detaliu: "Tabloul de bord, de făcut acum", href: "/admin", pictograma: "panou" },
  ...GRUPURI_MENIU.flatMap((g) => g.pagini.map((p) => ({ eticheta: p.eticheta, detaliu: g.titlu, href: p.href, pictograma: "sageata" as const }))),
  { eticheta: "Șabloane de e-mail", detaliu: "Promovare · E-mailuri", href: "/admin/sabloane", pictograma: "plic" },
  { eticheta: "Încarcă abonați", detaliu: "Promovare · Abonați", href: "/admin/abonati/incarca", pictograma: "familie" },
  { eticheta: "Textele paginilor", detaliu: "Site · Pagini", href: "/admin/texte", pictograma: "document" },
  { eticheta: "Cifrele de pe site", detaliu: "Site · Pagini", href: "/admin/cifre", pictograma: "grafic" },
  { eticheta: "Documente de descărcat", detaliu: "Site · Pagini", href: "/admin/documente", pictograma: "document" },
  { eticheta: "Sponsori (sigle)", detaliu: "Site · Pagini", href: "/admin/sponsori", pictograma: "cladire" },
  { eticheta: "Testimoniale", detaliu: "Site · Pagini", href: "/admin/testimoniale", pictograma: "comunicare" },
  { eticheta: "Echipa", detaliu: "Site · Pagini", href: "/admin/echipa", pictograma: "familie" },
  { eticheta: "Apariții în presă", detaliu: "Site · Pagini", href: "/admin/aparitii", pictograma: "document" },
  { eticheta: "Setări", detaliu: "Cont, utilizatori, parolă", href: "/admin/setari", pictograma: "panou" },
  { eticheta: "Utilizatori", detaliu: "Setări", href: "/admin/utilizatori", pictograma: "familie" },
  { eticheta: "Parola mea", detaliu: "Setări", href: "/admin/parola", pictograma: "stea" },
];
