/**
 * Repară diacriticele în textele preluate din WordPress.
 *
 * Caietul de sarcini cere ca tot conținutul să fie „în limba română, cu
 * diacritice”. Site-ul vechi le pune inconsecvent: pe aceeași bară de meniu
 * scrie și „Redirecționează”, și „Redirectioneaza”.
 *
 * Două operații, în ordinea asta:
 *
 * 1. **Sedilele.** `ş` și `ţ` (U+015F, U+0163) sunt litere turcești care arată
 *    aproape ca `ș` și `ț` (U+0219, U+021B). Înlocuirea e mereu corectă în text
 *    românesc, deci se face fără excepții.
 *
 * 2. **Cuvintele.** O listă închisă de cuvinte care au o singură scriere corectă
 *    în română. Lista e scurtă *intenționat*: aici intră doar cuvinte fără
 *    ambiguitate. „fara” e întotdeauna „fără”, dar „tari” poate fi și „tari”
 *    (gust), și „țări” (state) — un corector automat ar strica textul, așa că
 *    astfel de cuvinte nu intră în listă și rămân de verificat de om.
 *
 * Ce nu face: nu ghicește, nu folosește un model de limbă, nu atinge cuvinte
 * care nu sunt în listă.
 */

const SEDILE: ReadonlyArray<[RegExp, string]> = [
  [/ş/g, "ș"], // ş -> ș
  [/Ş/g, "Ș"], // Ş -> Ș
  [/ţ/g, "ț"], // ţ -> ț
  [/Ţ/g, "Ț"], // Ţ -> Ț
];

/**
 * Cuvinte cu o singură scriere corectă în română. Cheia e forma fără
 * diacritice, cu litere mici; valoarea e forma corectă.
 */
const CUVINTE: Readonly<Record<string, string>> = {
  asociatia: "asociația",
  asociatie: "asociație",
  asociatiei: "asociației",
  activitati: "activități",
  activitatile: "activitățile",
  atentia: "atenția",
  conditii: "condiții",
  confidentialitate: "confidențialitate",
  dizabilitati: "dizabilități",
  directioneaza: "direcționează",
  directionare: "direcționare",
  donatie: "donație",
  donatii: "donații",
  donatiile: "donațiile",
  educational: "educațional",
  educationala: "educațională",
  fara: "fără",
  impreuna: "împreună",
  incredere: "încredere",
  intalniri: "întâlniri",
  invata: "învață",
  joaca: "joacă",
  multumim: "mulțumim",
  parinti: "părinți",
  parintii: "părinții",
  parintilor: "părinților",
  rabdarea: "răbdarea",
  redirectioneaza: "redirecționează",
  redirectionare: "redirecționare",
  sanatate: "sănătate",
  scoala: "școală",
  sedinta: "ședință",
  situatii: "situații",
  sustin: "susțin",
  sustine: "susține",
  tabara: "tabără",
  informatii: "informații",
};

/**
 * Coduri care se scriu exact așa, fără diacritice, pentru că nu sunt cuvinte:
 * `SUSTIN` e textul pe care donatorul îl trimite prin SMS la 8835. Scris
 * „SUSȚIN”, mesajul nu mai e recunoscut de operator și donația nu se activează.
 * Comparația e pe forma exactă, cu majuscule.
 */
const CODURI = new Set(["SUSTIN", "SUSTIN STOP", "STOP"]);

/** „fara” -> „Fără” când originalul era „Fara”; „FARA” -> „FĂRĂ”. */
function potriveste(original: string, corect: string): string {
  if (original === original.toUpperCase() && original.length > 1) {
    return corect.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return corect[0].toUpperCase() + corect.slice(1);
  }
  return corect;
}

// `\p{L}` cu steagul `u`: granița de cuvânt a JavaScriptului nu știe de
// diacritice, iar `\bfara\b` ar prinde și „fara” din „farafara”.
const CUVANT = /\p{L}+/gu;

/** Textul, cu sedilele și cuvintele cunoscute corectate. */
export function repara(text: string): string {
  let rezultat = text;
  for (const [tipar, inlocuire] of SEDILE) {
    rezultat = rezultat.replace(tipar, inlocuire);
  }
  return rezultat.replace(CUVANT, (cuvant) => {
    if (CODURI.has(cuvant)) return cuvant;
    const corect = CUVINTE[cuvant.toLowerCase()];
    return corect ? potriveste(cuvant, corect) : cuvant;
  });
}

/**
 * Textele rămase cu probleme, pentru verificarea de dinainte de publicare.
 *
 * Întoarce lista de motive; goală înseamnă curat. Nu repară nimic — spune doar
 * ce a mai rămas, ca să nu publicăm un text pe care credeam că l-am corectat.
 */
export function problemeRamase(text: string): string[] {
  const probleme: string[] = [];

  const sedile = text.match(/[ŞşŢţ]/g);
  if (sedile) {
    probleme.push(`sedile rămase: ${[...new Set(sedile)].join(" ")}`);
  }

  const gresite = new Set<string>();
  for (const [cuvant] of text.matchAll(CUVANT)) {
    if (!CODURI.has(cuvant) && CUVINTE[cuvant.toLowerCase()])
      gresite.add(cuvant);
  }
  if (gresite.size > 0) {
    probleme.push(`cuvinte fără diacritice: ${[...gresite].join(", ")}`);
  }

  return probleme;
}
