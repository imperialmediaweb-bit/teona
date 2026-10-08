/**
 * Verifică paginile randate, nu fișierele sursă.
 *
 * Pe site-ul vechi, o secțiune a afișat „Sorem ipsum dolor sit amet…” pentru că
 * un câmp n-a fost completat și tema a folosit valoarea din fabrică. Nimeni n-a
 * observat luni de zile. Scriptul ăsta se uită la textul pe care îl vede
 * vizitatorul și cade dacă găsește:
 *
 *   · text de umplutură sau rămășițe în engleză ale temei Risehand;
 *   · sedile (ş/ţ turcesc) sau cuvinte românești fără diacritice;
 *   · linkuri și butoane fără destinație — caietul cere ca „niciun buton sau
 *     link să nu rămână fără destinație”;
 *   · imagini fără text alternativ.
 *
 * Rulare:  node scripts/verifica-pagini.mjs [adresa]
 *          (implicit http://localhost:3000)
 */

const ADRESA = process.argv[2] ?? "http://localhost:3000";
const PAGINI = [
  "/",
  "/despre-noi",
  "/casa-teona",
  "/proiecte",
  "/sponsori-si-parteneri",
  "/redirectioneaza-3-5",
  "/directioneaza-20",
  "/suntem-in-presa",
  "/devino-voluntar",
  "/contact",
  "/doneaza",
  "/raport-de-activitate-2025",
  "/politica-de-confidentialitate",
  "/termeni-si-conditii",
  "/politica-de-cookieuri",
];

const UMPLUTURA = [
  /lorem ipsum/i,
  /sorem ipsum/i,
  /dolor sit amet/i,
  /support@gmail\.com/i,
  /\+1800900122/,
  /575 Main Street/i,
  /themepanthers/i,
  /i am text block/i,
  /click edit button/i,
  /Non profit Charity Fundation/i,
  /Raise Your Hands/i,
  /Lift up your two hands/i,
  /\bRead more\b/,
  /\bLearn More\b/,
  /\bYour Donation\b/i,
];

const SEDILE = /[ŞşŢţ]/g;

/**
 * `SUSTIN` nu e un cuvânt, e textul pe care donatorul îl trimite prin SMS la
 * 8835. Scris cu diacritice, operatorul nu-l mai recunoaște. Comparația e pe
 * forma exactă, cu majuscule, ca „sustin” din proză să fie în continuare prins.
 */
const CODURI = new Set(["SUSTIN", "STOP"]);

const FARA_DIACRITICE = [
  "asociatia", "asociatie", "asociatiei", "activitati", "conditii",
  "confidentialitate", "dizabilitati", "directioneaza", "donatie", "donatii",
  "educational", "fara", "impreuna", "incredere", "intalniri", "invata",
  "joaca", "multumim", "parinti", "parintii", "rabdarea", "redirectioneaza",
  "sanatate", "scoala", "sedinta", "situatii", "sustin", "sustine", "tabara",
];

const probleme = [];
const nota = (pagina, fel, detaliu) =>
  probleme.push({ pagina, fel, detaliu });

for (const cale of PAGINI) {
  const url = `${ADRESA}${cale}`;
  const raspuns = await fetch(url);
  if (!raspuns.ok) {
    nota(cale, "pagina nu răspunde", `HTTP ${raspuns.status}`);
    continue;
  }
  const html = await raspuns.text();

  // Doar textul vizibil: fără <script>, <style> și fără etichete.
  const vizibil = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ");

  for (const tipar of UMPLUTURA) {
    const gasit = vizibil.match(tipar);
    if (gasit) nota(cale, "text de umplutură sau engleză", gasit[0]);
  }

  const sedile = vizibil.match(SEDILE);
  if (sedile) {
    nota(cale, "sedile în loc de virgulă dedesubt", [...new Set(sedile)].join(" "));
  }

  for (const cuvant of FARA_DIACRITICE) {
    // `\p{L}` ca graniță: `\b` din JavaScript nu știe de ă, â, î, ș, ț.
    const tipar = new RegExp(`(?<!\\p{L})${cuvant}(?!\\p{L})`, "giu");
    const gasit = (vizibil.match(tipar) ?? []).filter((g) => !CODURI.has(g));
    if (gasit.length) {
      nota(cale, "cuvânt fără diacritice", `${gasit[0]} (×${gasit.length})`);
    }
  }

  // Linkuri fără destinație reală
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
    if (href === "" || href === "#" || href === "undefined" || href === "null") {
      nota(cale, "link fără destinație", `href="${href}"`);
    }
  }
  const fara_href = [...html.matchAll(/<a\b(?![^>]*\bhref=)[^>]*>/gi)];
  if (fara_href.length) {
    nota(cale, "link fără atribut href", `${fara_href.length} bucăți`);
  }

  // Imagini fără text alternativ.
  //
  // `alt=""` e corect pentru o imagine pur decorativă — o copie dintr-o bandă
  // care se repetă, de pildă — dar numai dacă e spus limpede, cu
  // `aria-hidden="true"` pe aceeași etichetă. Un `alt` gol nemarcat rămâne o
  // scăpare și e semnalat.
  for (const [eticheta] of html.matchAll(/<img\b[^>]*>/gi)) {
    const alt = eticheta.match(/\balt="([^"]*)"/i);
    const decorativa = /\baria-hidden="true"/i.test(eticheta);
    if (!alt) nota(cale, "imagine fără atribut alt", eticheta.slice(0, 80));
    else if (!alt[1].trim() && !decorativa) {
      nota(cale, "imagine cu alt gol, nemarcată ca decorativă", eticheta.slice(0, 90));
    }
  }
}

if (probleme.length === 0) {
  console.log(`✓ ${PAGINI.length} pagină/pagini verificate, nicio problemă.`);
  process.exit(0);
}

console.error(`✗ ${probleme.length} probleme:\n`);
for (const { pagina, fel, detaliu } of probleme) {
  console.error(`  ${pagina}  ${fel}: ${detaliu}`);
}
process.exit(1);
