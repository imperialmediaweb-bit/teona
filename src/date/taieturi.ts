/**
 * Unde se taie fiecare fotografie.
 *
 * Pozele stau în cutii cu raport fix, tăiate cu `object-fit: cover`.
 * Implicit tăietura se face din centru — bine pentru o poză de grup, prost
 * pentru una făcută cu telefonul ținut vertical și pusă într-o cutie lată:
 * dintr-un 3:4 portret într-o cutie 4:3 se pierde 44% din înălțime, exact
 * banda de sus, unde sunt capetele.
 *
 * Măsurat pe site cu `scripts/qa/taieturi.mjs`: 29 de fotografii pierd peste
 * un sfert din cadru, toate tăiate din mijloc. La una — băiatul de pe podeaua
 * interactivă de la Casa Teona — se vedeau doar steaua proiectată și două
 * picioare; la alta, numai boluri și mâini dintr-un atelier plin de copii.
 *
 * **De ce o hartă, și nu o proprietate la fiecare chemare.** Aceeași poză
 * apare pe două-trei pagini, în cutii de forme diferite. Tăietura bună ține de
 * ce e în poză, nu de locul unde e pusă: dacă subiectul e în treimea de sus,
 * e în treimea de sus peste tot.
 *
 * Am încercat întâi o regulă CSS legată de numele fișierului, ca să prindă
 * toate cele 17 componente care randează poze deodată. N-a ajuns în pagină:
 * regulile scrise după `@import "tailwindcss"` nu se regăsesc în foaia
 * servită. Varianta asta e mai plictisitoare, dar se vede că merge.
 *
 * Valorile sunt `object-position`. `50% 25%` înseamnă „ține banda care începe
 * la un sfert de sus”. Ce nu e în hartă rămâne tăiat din centru.
 */
export const TAIETURI: Readonly<Record<string, string>> = {
  // Băiatul de pe podeaua interactivă: el e sus-stânga, steaua jos.
  "/poze/2024/11/WhatsApp-Image-2024-11-28-at-09.31.33-1.jpeg": "50% 25%",
  // Fetele la masa de lucru de la Casa Teona — capetele erau tăiate.
  "/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.17.jpeg": "50% 25%",
  // Fetița cu mingea portocalie: fața sus, mingea jos.
  "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg": "50% 25%",
  // Masa de atelier văzută de sus: ridicată, se văd și oamenii din jurul ei.
  "/poze/2024/11/438814270_2663080130535965_2029375574315086726_n-766x1024.jpg":
    "50% 25%",
};

/** Tăietura unei poze, sau `undefined` pentru cea implicită (din centru). */
export function taietura(cale: string): string | undefined {
  return TAIETURI[cale];
}
