/**
 * Urcă în Cloudinary fotografiile din `public/poze/`.
 *
 * **De ce există.** Cu `CLOUDINARY_CLOUD_NAME` setat, `next.config.ts` pune un
 * încărcător propriu de imagini, iar el traduce **orice** cale `/poze/an/luna/
 * nume.jpg` într-o adresă Cloudinary: `Teona/an/luna/nume`. Cele 389 de
 * fotografii moștenite din WordPress au fost urcate odată, în bloc, deci
 * traducerea nimerea mereu.
 *
 * O fotografie nouă pusă numai în depozit **nu există în Cloudinary**, deci
 * adresa dă 404 și pe pagină apare un dreptunghi gol. Nimic nu cade, nimic nu
 * se scrie în jurnal: pagina se randează perfect, numai că fotografia lipsește.
 * S-a întâmplat pe 19 octombrie 2026, cu cele unsprezece fotografii primite de
 * la asociație pe Drive — Casa Teona, Donează, „Scrisoarea pentru Moș Crăciun"
 * și siglele instituțiilor de pe Despre noi au stat o zi cu pozele rupte.
 *
 * Rulare — cheile se dau din mediu, niciodată scrise într-un fișier:
 *
 *     CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=… \
 *       node scripts/urca-poze-cloudinary.mjs public/poze/2026/10
 *
 * Fără argument ia tot `public/poze`. Sare peste ce e deja acolo, deci se
 * poate rula de câte ori vrei: întreabă întâi adresa publică și urcă numai ce
 * lipsește.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const CONT = process.env.CLOUDINARY_CLOUD_NAME;
const CHEIE = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const DOSAR = process.env.CLOUDINARY_FOLDER || "Teona";

if (!CONT || !CHEIE || !SECRET) {
  console.error(
    "Lipsesc cheile. Dă-le din mediu:\n" +
      "  CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=… node scripts/urca-poze-cloudinary.mjs [cale]",
  );
  process.exit(2);
}

const RADACINA = "public/poze";
const unde = process.argv[2] ?? RADACINA;
const POZE = /\.(jpe?g|png|webp|gif|avif)$/i;

/** Toate fișierele de imagine de sub o cale, oricât de adânc. */
async function fisiere(cale) {
  const ce = await stat(cale);
  if (ce.isFile()) return POZE.test(cale) ? [cale] : [];
  const intrari = await readdir(cale, { withFileTypes: true });
  const gasite = await Promise.all(
    intrari.map((i) => fisiere(join(cale, i.name))),
  );
  return gasite.flat();
}

/** `public/poze/2026/10/x.jpg` -> `Teona/2026/10/x` — exact ce cere încărcătorul. */
function identificator(cale) {
  return `${DOSAR}/${relative(RADACINA, cale).replace(/\.[a-z0-9]+$/i, "")}`;
}

function semnatura(parametri) {
  const sir = Object.keys(parametri)
    .sort()
    .map((c) => `${c}=${parametri[c]}`)
    .join("&");
  return createHash("sha1")
    .update(sir + SECRET)
    .digest("hex");
}

/** E deja acolo? Se întreabă adresa publică, nu API-ul: e gratis și sigur. */
async function exista(id) {
  const adresa = `https://res.cloudinary.com/${CONT}/image/upload/f_auto,w_64/${id}`;
  try {
    const r = await fetch(adresa, {
      method: "HEAD",
      signal: AbortSignal.timeout(20_000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function urca(cale) {
  const id = identificator(cale);
  const octeti = await readFile(cale);

  /*
    `public_id` cu bare în el, nu `folder`.

    Contul e pe „dynamic folders", unde folderul e un câmp separat de
    identificator. Dar încărcătorul de imagini construiește adresa din cale —
    `Teona/2026/10/nume` —, iar aia e identificatorul, nu folderul. Urcate cu
    `folder`, pozele ar ajunge în locul potrivit din panoul Cloudinary și
    adresa de pe site ar da tot 404.
  */
  const parametri = {
    public_id: id,
    overwrite: "false",
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  const corp = new FormData();
  for (const [k, v] of Object.entries(parametri)) corp.append(k, v);
  corp.append("api_key", CHEIE);
  corp.append("signature", semnatura(parametri));
  corp.append("file", new Blob([new Uint8Array(octeti)]), "poza");

  const r = await fetch(
    `https://api.cloudinary.com/v1_1/${CONT}/image/upload`,
    { method: "POST", body: corp },
  );
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${r.status} ${text.slice(0, 200)}`);
  }
  const date = await r.json();
  return { id: date.public_id, latime: date.width, inaltime: date.height };
}

const toate = await fisiere(unde);
console.log(`${toate.length} fotografii sub ${unde}\n`);

let urcate = 0;
let sarite = 0;
let rele = 0;

for (const cale of toate.sort()) {
  const id = identificator(cale);
  if (await exista(id)) {
    sarite++;
    continue;
  }
  try {
    const r = await urca(cale);
    console.log(`urcat   ${r.id}  (${r.latime}×${r.inaltime})`);
    urcate++;
  } catch (eroare) {
    console.log(`CADE    ${id}  — ${eroare.message}`);
    rele++;
  }
}

console.log(
  `\n${urcate} urcate · ${sarite} erau deja acolo · ${rele} n-au mers.`,
);
process.exit(rele === 0 ? 0 : 1);
