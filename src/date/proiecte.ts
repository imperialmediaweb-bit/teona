import { pozaLocala, proiecte as proiecteBrute } from "@/lib/continut";
import type { IdCategorie, ProiectAfisat } from "./proiecte-tipuri";

export { CATEGORII } from "./proiecte-tipuri";
export type { IdCategorie, ProiectAfisat } from "./proiecte-tipuri";

/**
 * Proiectele, pregătite pentru pagina Proiecte (capitolul 5 din caiet).
 *
 * Trei lucruri se întâmplă aici, și fiecare are un motiv:
 *
 * 1. **Titlurile se curăță.** În WordPress erau titluri de postare de
 *    Facebook, cu emoji în mijloc („…autism🪐 04-08 septembrie 2023”). Unul
 *    dintre ele folosea chiar piesa de puzzle — simbol respins de comunitatea
 *    autistă și evitat peste tot pe site-ul ăsta.
 *
 * 2. **Slugurile se regenerează.** Cele din export erau tăiate la 40 de
 *    caractere, așa că nouă proiecte diferite aveau toate slugul
 *    `tabara-respiro-dedicata-copiilor-cu-auti`. Aici slugul se face din titlu
 *    plus data, deci e unic și stabil.
 *
 * 3. **Textele NU se preiau.** Sunt postări de Facebook importate cu tot cu
 *    marcajul `[ad_1]`, iar mai multe conțin nume de familii, localități și
 *    diagnostice ale unor copii. Caietul interzice explicit publicarea lor:
 *    „La Cazuri umanitare nu se publică nume și nici diagnostice.” Descrierile
 *    de două-trei fraze le scrie asociația, din listele pe care urmează să ni
 *    le trimită. Până atunci, un proiect are titlu, dată, categorie și poze.
 */

/** Categoriile vechi din WordPress care înseamnă „caz umanitar”. */
const CATEGORII_UMANITARE = new Set(["Cazuri medicale", "Strângere Fonduri"]);

const LUNI = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

/**
 * Scoate emoji și semnele decorative dintr-un titlu de postare.
 *
 * Nu merge pe o listă de emoji — apar mereu altele. Merge pe intervalele de
 * caractere: simboluri, pictograme, steaguri, modificatori de ton al pielii.
 */
function curataTitlu(titlu: string): string {
  return titlu
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{E0020}-\u{E007F}]/gu,
      " ",
    )
    .replace(/\s*-\s*Asociatia Teona Ariana\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function faSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ș|ş/g, "s")
    .replace(/ț|ţ/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

function dataCitita(iso: string): string {
  const [an, luna, zi] = iso.slice(0, 10).split("-").map(Number);
  return `${zi} ${LUNI[luna - 1]} ${an}`;
}

/** Proiectele preluate, curățate și cu slug unic. */
export function proiecteAfisate(): ProiectAfisat[] {
  const folosite = new Set<string>();

  return proiecteBrute()
    .map((proiect) => {
      const titlu = curataTitlu(proiect.titlu);
      const data = proiect.data.slice(0, 10);
      const an = Number(data.slice(0, 4));

      // Slug unic: titlul curățat, plus anul dacă titlul singur se repetă.
      let slug = faSlug(titlu);
      if (folosite.has(slug)) slug = `${slug}-${data}`;
      folosite.add(slug);

      const umanitar = proiect.categorii.some((c) => CATEGORII_UMANITARE.has(c));
      const categorie: IdCategorie = umanitar
        ? "umanitare"
        : an >= 2026
          ? "2026"
          : an === 2025
            ? "2025"
            : "2021-2024";

      const poze = proiect.poze
        .map(pozaLocala)
        .filter((p): p is string => Boolean(p));

      return {
        slug,
        titlu,
        data,
        dataCitita: dataCitita(data),
        categorie,
        coperta: pozaLocala(proiect.pozaPrincipala) ?? poze[0] ?? null,
        poze,
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function proiectDupaSlug(slug: string): ProiectAfisat | undefined {
  return proiecteAfisate().find((p) => p.slug === slug);
}
