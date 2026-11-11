/*
  Echipa de pe „Despre noi”, cum era la lansare. De la 11 noiembrie 2026 e
  doar punctul de plecare: lista adevărată se ține din panou
  (`/admin/echipa`, `lib/echipa.ts`), iar asta se folosește numai cât
  baza de date nu răspunde.
*/

/**
 * 3.4 — Echipa, în ordinea cerută de caiet: conducerea, apoi echipa
 * operațională.
 *
 * Numele și rolurile sunt cele din caietul de sarcini, nu cele din exportul
 * WordPress (unde rolurile erau goale). Frazele scurte vin din `echipa.json`.
 *
 * Două lipsuri, lăsate vizibile în loc să fie umplute cu text inventat:
 * Mihaela Sfichi nu are nici fotografie, nici descriere (nu există nici pe
 * site-ul actual), iar conducerea nu are fotografii în arhiva preluată.
 * Cardul fără poză afișează inițialele pe un câmp de culoare, nu o siluetă
 * de stoc.
 *
 * **Paula Tolontan a fost scoasă** la cererea asociației (precizările din
 * 16 octombrie 2026). Fusese adăugată aici fiindcă apărea pe site-ul vechi,
 * cu descriere și fotografie, iar caietul n-o pomenea — dar cine e în echipă
 * hotărăște asociația, nu arhiva WordPress. Fotografia ei rămâne în
 * `public/poze/2023/12/`, nefolosită, ca toate celelalte fișiere moștenite.
 *
 * **Rolurile lui Daniel și al Eudochiei** sunt cele trimise de asociație în
 * aceleași precizări, nu cele deduse din exportul WordPress (unde toate
 * rolurile erau goale).
 */
export type MembruEchipa = {
  nume: string;
  rol?: string;
  descriere?: string;
  poza?: string;
};

export const ECHIPA: ReadonlyArray<MembruEchipa> = [
  {
    nume: "Cristea Costiuc",
    rol: "Președinte",
    descriere:
      "Lider dedicat, ghidează cu pasiune misiunea asociației pentru a sprijini copiii cu dizabilități și familiile lor.",
  },
  {
    nume: "Iuliana Costiuc",
    rol: "Vicepreședinte",
    descriere:
      "Cu empatie și dedicare, sprijină echipa în realizarea obiectivelor asociației și în oferirea unui sprijin real.",
  },
  {
    nume: "Ștefan Roșu",
    rol: "Vicepreședinte",
    descriere:
      "Implicat activ în proiectele asociației, contribuie la organizarea și succesul inițiativelor pentru comunitate.",
  },
  {
    nume: "Mihaela Sfichi",
    rol: "Manager fundraising",
    descriere:
      "Cu idei noi și multă energie, construiește parteneriate cu firme și cu oamenii din comunitate, pentru ca tot mai mulți copii să se bucure de sprijinul asociației.",
  },
  {
    nume: "Eudochia Pîțu",
    rol: "Asistent social, coordonator voluntari",
    descriere:
      "Profesionist dedicat în domeniul asistenței sociale, cu experiență în coordonarea voluntarilor și organizarea taberelor.",
    poza: "/poze/2023/12/Screenshot_27__1_-removebg-preview__1_-removebg-preview.png",
  },
  {
    nume: "Daniel Strîmbu",
    rol: "Asistent social, terapeut",
    descriere:
      "Îmbină asistența socială cu terapia, pentru ca fiecare copil să primească ajutorul de care are nevoie.",
    poza: "/poze/2023/12/Strimbu-Daniel-1.jpeg",
  },
];

