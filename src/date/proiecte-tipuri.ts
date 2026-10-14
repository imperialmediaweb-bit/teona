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
  { id: "umanitare", eticheta: "Cazuri umanitare" },
] as const;

export type IdCategorie = (typeof CATEGORII)[number]["id"];

export type ProiectAfisat = {
  slug: string;
  titlu: string;
  /** `2023-09-04`, pentru `<time dateTime>`. */
  data: string;
  /** „4 septembrie 2023”, pentru citit. */
  dataCitita: string;
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
   * De obicei nu e nevoie: folderul se găsește singur, după zilele și luna
   * din numele lui. Dar două foldere din 2026 n-au nicio dată în nume —
   * „TABĂRĂ ONCOLOGIE 2026” și „TABĂRĂ PERFORMANȚA 2026” — iar pentru ele
   * potrivirea pe dată nu are de ce să se prindă. Aici se scrie numele, ca să
   * nu fie nevoie ca asociația să redenumească ce a urcat deja.
   */
  dosarCloud?: string;
};
