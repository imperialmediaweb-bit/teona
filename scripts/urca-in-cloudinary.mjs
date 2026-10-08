/**
 * Urcă în Cloudinary toate pozele preluate de pe site-ul WordPress.
 *
 * Fișierele sunt în `public/poze/<an>/<luna>/...`. Structura se păstrează în
 * Cloudinary, sub folderul ales, pentru că aplicația construiește adresele
 * exact din ea: `/poze/2024/11/nume.webp` -> `<folder>/2024/11/nume`.
 *
 * Nu are nevoie de biblioteca `cloudinary`: semnătura e un SHA-1, iar
 * încărcarea e un POST obișnuit.
 *
 * ── Ce îi trebuie ────────────────────────────────────────────────────────
 * Una din două, în mediu:
 *
 *   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 *
 * sau, separat:
 *
 *   CLOUDINARY_CLOUD_NAME=...
 *   CLOUDINARY_API_KEY=...
 *   CLOUDINARY_API_SECRET=...
 *
 * Șirul `CLOUDINARY_URL` se ia din Cloudinary, din tabloul de bord, la
 * „API Keys” / „Product environment credentials”.
 *
 * ── Rulare ───────────────────────────────────────────────────────────────
 *   node scripts/urca-in-cloudinary.mjs            # urcă ce lipsește
 *   node scripts/urca-in-cloudinary.mjs --proba    # arată ce ar urca, fără să urce
 *   node scripts/urca-in-cloudinary.mjs --rescrie  # suprascrie și ce există deja
 *
 * Folderul țintă: `CLOUDINARY_FOLDER`, implicit `Teona`.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const RADACINA = new URL("..", import.meta.url).pathname;
const SURSA = join(RADACINA, "public", "poze");

const proba = process.argv.includes("--proba");
const rescrie = process.argv.includes("--rescrie");

/** Citește datele de acces din mediu, în oricare din cele două forme. */
function dateDeAcces() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!m) {
      throw new Error(
        "CLOUDINARY_URL nu are forma cloudinary://<api_key>:<api_secret>@<cloud_name>",
      );
    }
    return { cheie: m[1], secret: m[2], cont: m[3] };
  }

  const cont = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cheie = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cont || !cheie || !secret) {
    throw new Error(
      "Lipsesc datele de acces. Pune în mediu fie CLOUDINARY_URL, fie toate trei:\n" +
        "  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET\n" +
        "Le găsești în Cloudinary, la „API Keys” / „Product environment credentials”.",
    );
  }
  return { cheie, secret, cont };
}

/** Toate fișierele din `public/poze`, recursiv. */
async function fisiere(dir) {
  const gasite = [];
  for (const intrare of await readdir(dir, { withFileTypes: true })) {
    const cale = join(dir, intrare.name);
    if (intrare.isDirectory()) gasite.push(...(await fisiere(cale)));
    else if (/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(intrare.name)) gasite.push(cale);
  }
  return gasite;
}

/**
 * Semnătura cerută de Cloudinary: parametrii sortați alfabetic, lipiți cu `&`,
 * plus secretul la capăt, totul trecut prin SHA-1.
 */
function semneaza(parametri, secret) {
  const sir = Object.keys(parametri)
    .sort()
    .map((cheie) => `${cheie}=${parametri[cheie]}`)
    .join("&");
  return createHash("sha1").update(sir + secret).digest("hex");
}

async function urca(fisier, { cheie, secret, cont }, folder) {
  // `/poze/2024/11/nume.webp` -> `Teona/2024/11/nume`, fără extensie: Cloudinary
  // o alege singur la livrare, după ce acceptă browserul.
  const rel = relative(SURSA, fisier).replace(/\\/g, "/");
  const idPublic = `${folder}/${rel.replace(/\.[^.]+$/, "")}`;

  if (proba) return { idPublic, stare: "ar urca" };

  const acum = Math.floor(Date.now() / 1000);
  const deSemnat = { public_id: idPublic, timestamp: acum };
  if (rescrie) {
    deSemnat.invalidate = "true";
    deSemnat.overwrite = "true";
  }

  const corp = new FormData();
  corp.append("file", new Blob([await readFile(fisier)]), rel);
  corp.append("api_key", cheie);
  corp.append("public_id", idPublic);
  corp.append("timestamp", String(acum));
  if (rescrie) {
    corp.append("overwrite", "true");
    corp.append("invalidate", "true");
  }
  corp.append("signature", semneaza(deSemnat, secret));

  const raspuns = await fetch(
    `https://api.cloudinary.com/v1_1/${cont}/image/upload`,
    { method: "POST", body: corp },
  );
  const rezultat = await raspuns.json().catch(() => ({}));

  if (!raspuns.ok) {
    // „already exists” nu e o eroare când nu cerem rescrierea.
    const mesaj = rezultat?.error?.message ?? `HTTP ${raspuns.status}`;
    if (/exists/i.test(mesaj) && !rescrie) return { idPublic, stare: "există deja" };
    throw new Error(`${rel}: ${mesaj}`);
  }
  return { idPublic, stare: "urcat", octeti: rezultat.bytes };
}

const acces = dateDeAcces();
const folder = (process.env.CLOUDINARY_FOLDER ?? "Teona").trim();
const toate = (await fisiere(SURSA)).sort();

let octetiTotal = 0;
for (const f of toate) octetiTotal += (await stat(f)).size;

console.log(`cont Cloudinary : ${acces.cont}`);
console.log(`folder țintă    : ${folder}`);
console.log(`fișiere         : ${toate.length} (${(octetiTotal / 1e6).toFixed(1)} MB)`);
console.log(proba ? "\n— probă, nu se urcă nimic —\n" : "");

const numarate = { urcat: 0, "există deja": 0, "ar urca": 0 };
const esuate = [];

// Opt deodată: destul cât să fie rapid, puțin cât să nu fim limitați.
const DEODATA = 8;
for (let i = 0; i < toate.length; i += DEODATA) {
  const grup = toate.slice(i, i + DEODATA);
  const rezultate = await Promise.allSettled(
    grup.map((f) => urca(f, acces, folder)),
  );
  for (const r of rezultate) {
    if (r.status === "fulfilled") numarate[r.value.stare]++;
    else esuate.push(r.reason.message);
  }
  process.stdout.write(
    `\r  ${Math.min(i + DEODATA, toate.length)} / ${toate.length}`,
  );
}

console.log("\n");
for (const [stare, n] of Object.entries(numarate)) {
  if (n) console.log(`  ${stare.padEnd(14)} ${n}`);
}
if (esuate.length) {
  console.error(`\n  eșuate: ${esuate.length}`);
  for (const e of esuate.slice(0, 10)) console.error(`    ${e}`);
  process.exit(1);
}
console.log("\nGata. Pune CLOUDINARY_CLOUD_NAME în Railway și site-ul servește de acolo.");
