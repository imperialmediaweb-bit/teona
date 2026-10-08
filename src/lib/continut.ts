// Conținutul preluat din site-ul WordPress se află în `continut/`.
// Îl citim aici o singură dată, la build, cu tipuri clare.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repara } from "./diacritice";

const dir = join(process.cwd(), "continut");
const citeste = <T>(fisier: string): T =>
  JSON.parse(readFileSync(join(dir, fisier), "utf8")) as T;

/** Un text scos din arborele Elementor, cu numele câmpului din care vine. */
export type TextElementor = { camp: string; text: string };

export type Pagina = {
  id: string;
  titlu: string;
  slug: string;
  adresa: string;
  sablon: string;
  textHtml: string;
  texteElementor: TextElementor[];
  poze: string[];
};

export type Proiect = {
  id: string;
  titlu: string;
  slug: string;
  adresa: string;
  data: string;
  categorii: string[];
  etichete: string[];
  text: string;
  texteElementor: TextElementor[];
  poze: string[];
  pozaPrincipala: string | null;
};

export type MembruEchipa = {
  id: string;
  nume: string;
  slug: string;
  rol: string;
  descriere: string;
  poza: string | null;
};

export type Articol = {
  id: string;
  titlu: string;
  slug: string;
  data: string;
  adresa: string;
  categorii: string[];
  etichete: string[];
  rezumat: string;
  html: string;
  text: string;
  pozaPrincipala: string | null;
};

export type FisierMedia = {
  id: string;
  titlu: string;
  slug: string;
  data: string;
  fisier: string;
  alt: string;
};

/**
 * Trece orice șir dintr-o structură prin `repara`, păstrând forma structurii.
 *
 * Textele vin din WordPress cu diacritice puse inconsecvent — pe aceeași bară
 * de meniu scria și „Redirecționează”, și „Redirectioneaza”. Corectura se face
 * aici, într-un singur loc, nu la fiecare afișare: așa nu există cale prin care
 * un text să ajungă pe pagină nereparat.
 */
function reparaAdanc<T>(nod: T): T {
  if (typeof nod === "string") return repara(nod) as T;
  if (Array.isArray(nod)) return nod.map(reparaAdanc) as T;
  if (nod && typeof nod === "object") {
    return Object.fromEntries(
      Object.entries(nod).map(([cheie, valoare]) => [cheie, reparaAdanc(valoare)]),
    ) as T;
  }
  return nod;
}

const citesteReparat = <T>(fisier: string): T => reparaAdanc(citeste<T>(fisier));

export const pagini = () => citesteReparat<Pagina[]>("pagini.json");
export const proiecte = () => citesteReparat<Proiect[]>("proiecte.json");
export const echipa = () => citesteReparat<MembruEchipa[]>("echipa.json");
export const articole = () => citesteReparat<Articol[]>("articole.json");
export const media = () => citesteReparat<FisierMedia[]>("media.json");

/**
 * În conținut, adresele pozelor sunt încă cele de pe teona-ariana.ro.
 * Fișierele sunt descărcate în `public/poze/<an>/<luna>/...`,
 * deci traducem adresa veche în calea locală.
 *
 * Întoarce null dacă adresa nu vine din biblioteca media WordPress.
 */
export function pozaLocala(adresa: string | null | undefined): string | null {
  if (!adresa) return null;
  const marcaj = "/wp-content/uploads/";
  const i = adresa.indexOf(marcaj);
  if (i === -1) return adresa.startsWith("/poze/") ? adresa : null;
  return "/poze/" + adresa.slice(i + marcaj.length);
}
