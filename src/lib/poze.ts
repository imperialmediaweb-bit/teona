/**
 * Pozele preluate de pe fiecare pagină a site-ului WordPress.
 *
 * `continut/poze-pagini.json` e produs de `scripts/mapeaza-poze.py`, care scoate
 * imaginile demo ale temei Risehand și reduce miniaturile WordPress la originalul
 * lor. Cheile sunt slugurile vechi, așa cum erau pe teona-ariana.ro.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repara } from "./diacritice";

export type Poza = {
  /** Cale servită de Next, relativă la `public/`: `/poze/2024/11/nume.jpg`. */
  cale: string;
  /** Textul alternativ din biblioteca media WordPress. Deseori gol. */
  alt: string;
};

const brut: Record<string, Poza[]> = JSON.parse(
  readFileSync(join(process.cwd(), "continut", "poze-pagini.json"), "utf8"),
);

// Textul alternativ vine din biblioteca media WordPress, cu aceleași probleme
// de diacritice ca restul conținutului.
const harta: Record<string, Poza[]> = Object.fromEntries(
  Object.entries(brut).map(([slug, lista]) => [
    slug,
    lista.map((poza) => ({ ...poza, alt: repara(poza.alt) })),
  ]),
);

/** Pozele unei pagini vechi, în ordinea în care apăreau pe ea. */
export function pozePagina(slugVechi: string): Poza[] {
  return harta[slugVechi] ?? [];
}

/**
 * O poză anume, după bucata de nume de fișier.
 *
 * Aruncă dacă nu găsește: o poză lipsă trebuie să oprească build-ul, nu să
 * ajungă pe site ca pătrat gol.
 */
export function poza(bucataDinNume: string): Poza {
  for (const lista of Object.values(harta)) {
    const gasita = lista.find((p) => p.cale.includes(bucataDinNume));
    if (gasita) return gasita;
  }
  throw new Error(
    `Poza „${bucataDinNume}” nu există în continut/poze-pagini.json. ` +
      `Rulează scripts/mapeaza-poze.py sau verifică numele fișierului.`,
  );
}
