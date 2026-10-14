/**
 * Categoriile și forma unui proiect.
 *
 * Fișier separat de `proiecte.ts` dintr-un motiv foarte concret: `proiecte.ts`
 * citește din `continut/` cu `node:fs`, iar grila de proiecte e o componentă
 * de browser. Dacă ea ar importa categoriile direct de acolo, `node:fs` ar
 * ajunge în pachetul trimis în browser și build-ul ar cădea. Aici nu există
 * nicio dependență — doar date și tipuri — deci îl pot folosi amândouă.
 */

export const CATEGORII = [
  { id: "2026", eticheta: "Proiecte 2026" },
  { id: "2025", eticheta: "Proiecte 2025" },
  { id: "2021-2024", eticheta: "Proiecte 2021 – 2024" },
  // Campaniile nu sunt legate de un an: „Banca pentru Alimente” se repetă, iar
  // aniversările se întâmplă tot timpul. Puse într-un an, ar spune un lucru pe
  // care nu-l știm.
  { id: "campanii", eticheta: "Campanii" },
  { id: "umanitare", eticheta: "Cazuri umanitare" },
] as const;

export type IdCategorie = (typeof CATEGORII)[number]["id"];

export type ProiectAfisat = {
  slug: string;
  titlu: string;
  /** `2023-09-04`, pentru `<time dateTime>`. */
  data: string;
  /**
   * „4 septembrie 2023”, pentru citit. `null` când data nu se știe.
   *
   * O campanie urcată ca folder de poze, fără nimic scris, n-are dată. Atunci
   * pagina nu arată niciuna, în loc să arate una inventată — `data` rămâne
   * doar pentru ordonare și nu se vede nicăieri.
   */
  dataCitita: string | null;
  categorie: IdCategorie;
  coperta: string | null;
  poze: string[];
  /**
   * Două-trei paragrafe despre proiect. Lipsesc la proiectele venite din
   * exportul WordPress: textele de acolo erau postări de Facebook, cu nume de
   * familii și diagnostice de copii, iar caietul interzice publicarea lor.
   */
  descriere?: readonly string[];
  /**
   * Numele folderului de poze din Cloudinary, scris explicit.
   *
   * Calea e față de rădăcina din Cloudinary (`Teona`):
   * `2026/TABĂRĂ ONCOLOGIE 2026`, `BANCA PENTRU ALIMENTE`.
   *
   * De obicei nu e nevoie: folderul se găsește singur, după zilele și luna
   * din numele lui. E nevoie în două cazuri: foldere fără nicio dată în nume
   * („TABĂRĂ ONCOLOGIE 2026”, „TABĂRĂ PERFORMANȚA 2026”), și campaniile, care
   * stau direct sub rădăcină, nu într-un an.
   */
  dosarCloud?: string;
};
