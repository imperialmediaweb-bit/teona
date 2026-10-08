/**
 * Curățarea titlurilor de proiect și facerea slugurilor.
 *
 * Fișier separat, în JavaScript simplu, pentru că e nevoie de el în două
 * locuri care nu se pot importa unul pe altul: `src/date/proiecte.ts`, care
 * face paginile, și `next.config.ts`, care face redirecționările de pe
 * adresele vechi.
 *
 * **Trebuie să fie una singură.** Au fost două copii, și au apucat să difere:
 * cea din redirecționări tăia „- Asociatia Teona Ariana” din titlul brut, cea
 * din pagini primea titlul cu diacriticele deja reparate („Asociația”) și nu
 * mai tăia nimic. Rezultatul: adresa veche a primei tabere RESPIRO trimitea
 * la `/proiecte/prima-tabara-respiro`, o pagină care nu există, în loc de
 * `/proiecte/prima-tabara-respiro-asociatia-teona-ariana`.
 */

/**
 * Emoji și semne decorative.
 *
 * Nu merge pe o listă de emoji — apar mereu altele. Merge pe intervalele de
 * caractere: simboluri, pictograme, steaguri, modificatori de ton al pielii.
 *
 * Exportat și pentru redirecționări, care înlocuiesc fiecare emoji dintr-un
 * slug vechi cu un parametru de potrivire. Folosit doar cu `String.replace`,
 * care pornește de fiecare dată de la început — un `RegExp` global partajat
 * ar fi altfel o capcană.
 */
export const SEMNE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{E0020}-\u{E007F}]/gu;

/**
 * Coada „- Asociatia Teona Ariana” din titlurile vechi.
 *
 * Scrisă cu și fără diacritice: titlul brut din export n-are diacritice,
 * titlul trecut prin `repara()` are. Amândouă trebuie tăiate, altfel cele
 * două locuri scot sluguri diferite.
 */
const COADA = /\s*-\s*Asocia[țţt]ia Teona Ariana\s*$/i;

export function curataTitlu(titlu) {
  return titlu
    .replace(SEMNE, " ")
    .replace(COADA, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

export function faSlug(text) {
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
