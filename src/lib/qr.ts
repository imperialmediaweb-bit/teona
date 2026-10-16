import QRCode from "qrcode";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Codurile QR tipărite și linkurile lor etichetate.
 *
 * **La ce bun un cod QR cu etichetă.** Un afiș cu adresa site-ului scrisă pe
 * el aduce oameni care, în panou, apar ca „direct" — adică la fel cu cei care
 * și-o amintesc din memorie. Așa nu se poate ști niciodată dacă afișul a
 * adus pe cineva. Un link etichetat (`?utm_source=qr&utm_medium=offline`) îi
 * așază într-un rând al lor, iar numele locului (`utm_campaign`) îi desparte
 * între ei: cutia de la biserică, afișul din mall și fluturașul de la
 * concert nu mai sunt același lucru.
 *
 * **Fiecare loc își primește codul lui.** Un singur cod pentru toate ar fi
 * mai ușor de făcut și n-ar spune nimic: s-ar ști că „cineva a scanat ceva".
 */

export const LOCURI = [
  { cale: "/doneaza", nume: "Pagina de donații" },
  { cale: "/directioneaza-20", nume: "Direcționare 20% (firme)" },
  { cale: "/formular-230", nume: "Formularul 230" },
  { cale: "/devino-voluntar", nume: "Devino voluntar" },
  { cale: "/", nume: "Prima pagină" },
] as const;

/** „Afiș de Crăciun” → „afis-de-craciun”. Fără diacritice, fără semne. */
export function caNume(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ș|ş/gi, "s")
    .replace(/ț|ţ/gi, "t")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type Cerere = {
  /** Calea de pe site unde duce codul. */
  cale: string;
  /** Unde stă codul: „afiș biserică”, „cutie Casa Teona”. Poate lipsi. */
  loc?: string;
  /** Sumă preselectată în formular, dacă se vrea una. */
  suma?: number | null;
};

/**
 * Linkul din spatele codului.
 *
 * Etichetele sunt cele din `src/lib/atribuire.ts`, deci donația făcută după
 * scanare intră în panou pe rândul „Cod QR tipărit”. Nu se inventează alte
 * nume: dacă s-ar scrie aici `utm_source=afis`, rândul acela n-ar mai exista
 * nicăieri și banii ar cădea în „alt site”.
 */
export function linkEtichetat(c: Cerere): string {
  const adresa = new URL(c.cale || "/", ADRESA_SITE);
  adresa.searchParams.set("utm_source", "qr");
  adresa.searchParams.set("utm_medium", "offline");
  const loc = caNume(c.loc ?? "");
  if (loc) adresa.searchParams.set("utm_campaign", loc);
  if (c.suma && c.suma > 0) adresa.searchParams.set("suma", String(c.suma));
  return adresa.toString();
}

/**
 * Codul, ca SVG.
 *
 * Corecția de erori e pe „M": codul rămâne citibil cu o pătrime din el
 * acoperită. Pe hârtie asta contează — un afiș stă la soare, se îndoaie și
 * prinde degete. Marginea albă nu e podoabă: fără ea, telefonul nu știe unde
 * se termină codul și nu-l citește de pe un fundal colorat.
 */
export async function caSvg(link: string): Promise<string> {
  return QRCode.toString(link, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 1024,
    color: { dark: "#232323", light: "#ffffff" },
  });
}

export async function caPng(link: string): Promise<Buffer> {
  return QRCode.toBuffer(link, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 2048,
    color: { dark: "#232323", light: "#ffffff" },
  });
}
