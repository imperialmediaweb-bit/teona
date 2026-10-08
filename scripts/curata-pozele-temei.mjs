/**
 * Scoate din proiect pozele demo ale temei Risehand.
 *
 * Tema și-a copiat conținutul demo în biblioteca media a asociației, deci
 * fișierele au ajuns pe teona-ariana.ro și de acolo în `public/poze/`, deși nu
 * au nicio legătură cu asociația. Printre ele:
 *
 *   · siglele „Risehand Charity Foundation” și logourile demo ale temei;
 *   · siglele unor organizații inventate (Save Children, Blood, Poor Fund…);
 *   · **portrete stock de oameni necunoscuți**, puse ca „echipă”;
 *   · steaguri, hărți, texturi, fundaluri și capturi de ecran ale temei;
 *   · fotografii stock cu copii, folosite în sliderul demo.
 *
 * Caietul de sarcini cere eliminarea tuturor imaginilor demo. Portretele sunt
 * cazul cel mai serios: sunt chipuri de oameni reali, fără legătură cu
 * asociația, care n-au ce căuta pe site-ul ei.
 *
 * Șterge din trei locuri: Cloudinary, discul local și harta de poze.
 *
 * Rulare:
 *   node scripts/curata-pozele-temei.mjs --proba   # arată ce ar șterge
 *   node scripts/curata-pozele-temei.mjs           # șterge
 *
 * Pentru Cloudinary are nevoie de `CLOUDINARY_URL` sau de cele trei variabile.
 * Fără ele, șterge doar local și spune asta.
 */


import { readdir, rm } from "node:fs/promises";
import { basename, join } from "node:path";

const RADACINA = new URL("..", import.meta.url).pathname;
const POZE = join(RADACINA, "public", "poze");

const proba = process.argv.includes("--proba");

/**
 * Cele două foldere sunt aproape în întregime conținut al temei. În loc să
 * enumerăm 66 de fișiere de șters, enumerăm cele 6 de păstrat — lista scurtă e
 * și mai ușor de verificat cu ochiul, și mai greu de stricat.
 *
 * Toate șase sunt variante ale siglei asociației.
 */
const FOLDERE_TEMEI = ["2024/01", "2024/03"];

const DE_PASTRAT = new Set([
  "Screenshot_45-removebg-preview-3.png",
  "Screenshot_46-removebg-preview-1.png",
  "logo-8r-1.png",
  "logo7.jpeg",
  "WhatsApp-Image-2024-11-15-at-11.32.41-AM.jpeg",
  "WhatsApp_Image_2024-11-15_at_11.32.41_AM-removebg-preview.png",
]);

/** Fișiere demo aflate în afara celor două foldere. */
const DEMO_RAZLETE = ["woocommerce-placeholder.png"];

function dateDeAcces() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (m) return { cheie: m[1], secret: m[2], cont: m[3] };
  }
  const cont = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cheie = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cont && cheie && secret) return { cont, cheie, secret };
  return null;
}


/**
 * Șterge din Cloudinary, cel mult 100 de identificatori odată.
 *
 * Ștergerea e în API-ul de administrare, care se autentifică altfel decât cel
 * de încărcare: nu cu o semnătură SHA-1, ci cu autentificare Basic obișnuită,
 * `api_key:api_secret`. Cu semnătură răspunde „Invalid credentials”.
 */
async function stergeDinCloudinary(identificatori, acces) {
  const autentificare = Buffer.from(`${acces.cheie}:${acces.secret}`).toString(
    "base64",
  );
  let sterse = 0;

  for (let i = 0; i < identificatori.length; i += 100) {
    const grup = identificatori.slice(i, i + 100);
    const parametri = new URLSearchParams();
    for (const id of grup) parametri.append("public_ids[]", id);

    const raspuns = await fetch(
      `https://api.cloudinary.com/v1_1/${acces.cont}/resources/image/upload?${parametri}`,
      { method: "DELETE", headers: { Authorization: `Basic ${autentificare}` } },
    );
    const rezultat = await raspuns.json().catch(() => ({}));
    if (!raspuns.ok) {
      throw new Error(rezultat?.error?.message ?? `HTTP ${raspuns.status}`);
    }
    for (const stare of Object.values(rezultat.deleted ?? {})) {
      if (stare === "deleted") sterse++;
    }
  }
  return sterse;
}

// ── Adunăm ce e de șters ────────────────────────────────────────────────────
const deSters = [];

for (const folder of FOLDERE_TEMEI) {
  let intrari;
  try {
    intrari = await readdir(join(POZE, folder));
  } catch {
    continue; // folderul a fost deja curățat
  }
  for (const nume of intrari) {
    if (!DE_PASTRAT.has(nume)) deSters.push(`${folder}/${nume}`);
  }
}

for (const nume of DEMO_RAZLETE) {
  try {
    await readdir(POZE); // doar ca să confirmăm că folderul există
    deSters.push(nume);
  } catch {
    /* nimic */
  }
}

if (deSters.length === 0) {
  console.log("Nimic de curățat: pozele temei au fost deja scoase.");
  process.exit(0);
}

console.log(`${deSters.length} fișiere de la tema Risehand:\n`);
for (const f of deSters) console.log(`  ${f}`);
console.log(`\nRămân ${DE_PASTRAT.size} fișiere reale în folderele temei:`);
for (const f of DE_PASTRAT) console.log(`  ${f}`);

if (proba) {
  console.log("\n— probă, nu s-a șters nimic —");
  process.exit(0);
}

// ── Cloudinary ──────────────────────────────────────────────────────────────
const acces = dateDeAcces();
const folderCloudinary = (process.env.CLOUDINARY_FOLDER ?? "Teona").trim();

if (acces) {
  const identificatori = deSters.map(
    (f) => `${folderCloudinary}/${f.replace(/\.[^.]+$/, "")}`,
  );
  const sterse = await stergeDinCloudinary(identificatori, acces);
  console.log(`\nCloudinary: ${sterse} șterse din ${identificatori.length}.`);
} else {
  console.log(
    "\nCloudinary: sărit (lipsesc datele de acces). Rulează din nou cu " +
      "CLOUDINARY_URL ca să le scoți și de acolo.",
  );
}

// ── Discul local ────────────────────────────────────────────────────────────
for (const f of deSters) {
  await rm(join(POZE, f), { force: true });
}
console.log(`Local: ${deSters.length} șterse din public/poze/.`);
console.log(
  "\nAcum rulează:  python3 scripts/mapeaza-poze.py   (reface harta de poze)",
);
