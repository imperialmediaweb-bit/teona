import { existsSync } from "node:fs";
import { join } from "node:path";
import { pozaLocala, proiecte as proiecteBrute } from "@/lib/continut";
import { curataTitlu, faSlug } from "@/lib/slug-proiecte.mjs";
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

function dataCitita(iso: string): string {
  const [an, luna, zi] = iso.slice(0, 10).split("-").map(Number);
  return `${zi} ${LUNI[luna - 1]} ${an}`;
}

/**
 * Calea unei poze, dacă fișierul chiar există pe disc.
 *
 * WordPress genera pentru fiecare imagine mai multe mărimi
 * (`…_n-1024x485.jpg`), iar unele proiecte trimit la o astfel de variantă, nu
 * la original. Variantele n-au fost descărcate toate, așa că una dintre ele
 * cerea un fișier inexistent: galeria proiectului „Prima tabără Respiro”
 * afișa un pătrat gol, iar serverul răspundea 404.
 *
 * Aici, dacă varianta lipsește, cădem pe originalul fără sufixul de mărime.
 * Dacă nici el nu există, poza iese din listă: mai bine o galerie cu o poză
 * mai puțin decât un dreptunghi gol pe pagină.
 */
function pozaCareExista(cale: string | null): string | null {
  if (!cale) return null;
  const peDisc = (c: string) => existsSync(join(process.cwd(), "public", c));
  if (peDisc(cale)) return cale;

  const original = cale.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, "$1");
  return original !== cale && peDisc(original) ? original : null;
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
        .map(pozaCareExista)
        .filter((p): p is string => Boolean(p));

      return {
        slug,
        titlu,
        data,
        dataCitita: dataCitita(data),
        categorie,
        coperta: pozaCareExista(pozaLocala(proiect.pozaPrincipala)) ?? poze[0] ?? null,
        poze,
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function proiectDupaSlug(slug: string): ProiectAfisat | undefined {
  return proiecteAfisate().find((p) => p.slug === slug);
}
