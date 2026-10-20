/**
 * Fotografiile cerute de site există chiar în Cloudinary?
 *
 * **Greșeala pe care o prinde.** Cu `CLOUDINARY_CLOUD_NAME` setat,
 * `next.config.ts` montează un încărcător propriu, iar el traduce **orice**
 * cale `/poze/an/luna/nume.jpg` într-o adresă Cloudinary. Cele 389 de
 * fotografii moștenite au fost urcate odată, în bloc, deci traducerea nimerea
 * mereu — și nimeni nu s-a mai gândit la ea.
 *
 * O fotografie nouă pusă numai în depozit **nu există în Cloudinary**: adresa
 * dă 404 și pe pagină rămâne un dreptunghi gol. Nimic nu cade, nimic nu intră
 * în jurnal, `npm run build` trece, pagina se randează perfect. Singurul fel
 * de a afla e să deschizi pagina cu ochii — sau să rulezi asta.
 *
 * S-a întâmplat pe 19 octombrie 2026: unsprezece fotografii primite de la
 * asociație pe Drive au stat o zi rupte pe Casa Teona, pe Donează, la
 * „Scrisoarea pentru Moș Crăciun" și la siglele instituțiilor de pe Despre
 * noi. Remediul e `scripts/urca-poze-cloudinary.mjs`.
 *
 * Rulare — nu cere chei secrete, numai numele contului (e public, apare în
 * fiecare adresă de poză de pe site):
 *
 *     CLOUDINARY_CLOUD_NAME=… node scripts/qa/poze-lipsa.mjs
 *
 * Fără numele contului, proba spune că n-are ce verifica și iese cu zero:
 * fără Cloudinary, Next servește fișierele din depozit și ele există.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const CONT = process.env.CLOUDINARY_CLOUD_NAME;
const DOSAR = process.env.CLOUDINARY_FOLDER || "Teona";

if (!CONT) {
  console.log(
    "Fără CLOUDINARY_CLOUD_NAME nu e nimic de verificat:\n" +
      "fără el, Next servește fotografiile din depozit, iar ele există.",
  );
  process.exit(0);
}

/** Toate fișierele text din `src/` și `continut/`, oricât de adânc. */
async function fisiere(cale) {
  const ce = await stat(cale);
  if (ce.isFile()) return [cale];
  const intrari = await readdir(cale, { withFileTypes: true });
  const gasite = await Promise.all(
    intrari
      .filter((i) => i.name !== "node_modules")
      .map((i) => fisiere(join(cale, i.name))),
  );
  return gasite.flat();
}

const CITIBILE = /\.(ts|tsx|mjs|json|md)$/i;
const CALE = /\/poze\/\d{4}\/\d{2}\/[^"'\s`)]+\.(?:jpe?g|png|webp|gif|avif)/gi;

const cai = new Set();
for (const f of (await fisiere("src")).concat(await fisiere("continut"))) {
  if (!CITIBILE.test(f)) continue;
  const text = await readFile(f, "utf8");
  for (const m of text.matchAll(CALE)) cai.add(m[0]);
}

/*
  Se păstrează numai căile care chiar există în depozit.

  Regexul prinde și exemplele din comentarii — `/poze/2024/11/nume.jpg`,
  `…-2512x512-1-*.png`. Alea nu sunt fotografii, sunt explicații, și nu trebuie
  să fie nicăieri. Proba care strigă la patru lucruri inexistente e o probă pe
  care n-o mai citește nimeni după a treia rulare.
*/
const peDisc = [];
for (const c of cai) {
  try {
    await stat(join("public", c.replace(/^\//, "")));
    peDisc.push(c);
  } catch {
    /* Nu e un fișier: e un exemplu dintr-un comentariu. */
  }
}

console.log(
  `${peDisc.length} fotografii cerute de cod și existente în depozit` +
    ` (din ${cai.size} căi găsite în text).\n`,
);

function adresa(cale) {
  const id = `${DOSAR}/${cale.replace(/^\/poze\//, "").replace(/\.[a-z0-9]+$/i, "")}`;
  return `https://res.cloudinary.com/${CONT}/image/upload/f_auto,w_64/${id}`;
}

async function exista(cale) {
  try {
    const r = await fetch(adresa(cale), {
      method: "HEAD",
      signal: AbortSignal.timeout(20_000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/* Douăsprezece deodată: patru sute de cereri una după alta ar dura minute. */
const lista = peDisc.sort();
const rupte = [];
for (let i = 0; i < lista.length; i += 12) {
  const bucata = lista.slice(i, i + 12);
  const stari = await Promise.all(bucata.map(exista));
  bucata.forEach((c, j) => {
    if (!stari[j]) rupte.push(c);
  });
}

if (rupte.length === 0) {
  console.log("Tot bine — fiecare fotografie cerută există în Cloudinary.");
  process.exit(0);
}

console.log(`${rupte.length} fotografii lipsesc din Cloudinary:\n`);
for (const c of rupte) console.log(`  ${c}`);
console.log(
  "\nPe pagină apar ca dreptunghiuri goale. Se urcă cu:\n" +
    "  CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=… \\\n" +
    "    node scripts/urca-poze-cloudinary.mjs public/poze",
);
process.exit(1);
