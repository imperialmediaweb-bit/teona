/**
 * Audit „mediu” (4 noiembrie 2026): baza de date veche de pe Railway.
 *
 * Simulează o bază care a trecut prin TOATE versiunile schemei din istoricul
 * depozitului, în ordinea commit-urilor, pornind de la tabelele „din altă
 * viață” (contracte cu pdf/amprenta/ip, formulare_230), cu rânduri în tabele
 * între versiuni. La final rulează versiunea de la HEAD de două ori și
 * verifică:
 *   - niciun bloc nu cade la HEAD;
 *   - fiecare tabel/coloană din HEAD există în baza „plimbată prin istorie”;
 *   - blocurile pot fi rulate de două ori;
 *   - ce se întâmplă când un rând din bloc cade (rollback la tot blocul).
 *
 *   node scripts/qa/audit-mediu-schema.mjs   (Postgres local 5434, baza teona_audit_5)
 */
import { execFileSync } from "node:child_process";
import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://postgres:x@127.0.0.1:5434/teona_audit_5";
if (/railway|teona-ariana/.test(DATABASE_URL)) {
  console.log("REFUZAT: proba șterge schema; numai pe o bază locală.");
  process.exit(1);
}

const FISIERE = [
  "src/lib/baza.ts",
  "src/lib/cifre.ts",
  "src/lib/sponsori.ts",
  "src/lib/texte-pagini.ts",
  "src/lib/utilizatori.ts",
  "src/lib/radar.ts",
  "src/lib/testimoniale.ts",
];

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

/** Blocurile SQL dintr-o versiune a unui fișier: [{ nume, sql }]. */
function blocuri(commit, fisier) {
  let text;
  try {
    text = git("show", `${commit}:${fisier}`);
  } catch {
    return [];
  }
  const gasite = [];
  const re = /const (DEFINITIE|ADAOSURI)\s*=\s*`([\s\S]*?)`;/g;
  let m;
  while ((m = re.exec(text))) gasite.push({ nume: m[1], sql: m[2] });
  // `${…}` neinterpolat într-un bloc ar ajunge la Postgres ca text brut.
  for (const b of gasite) {
    if (/\$\{/.test(b.sql)) console.log(`ATENȚIE ${fisier}@${commit} ${b.nume} conține \${`);
  }
  return gasite;
}

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();

async function ruleaza(sql) {
  try {
    await baza.query(sql);
    return null;
  } catch (e) {
    return `${e.code ?? "?"} ${e.message}`;
  }
}

/** Rânduri de probă, ca ALTER-urile să se lovească de date existente. */
async function seamana() {
  const incercari = [
    `INSERT INTO cereri (fel, nume, email, detalii) VALUES ('contact','Proba','p@exemplu.ro','{}') ON CONFLICT DO NOTHING`,
    `INSERT INTO donatii (procesator, referinta, suma_bani, moneda, frecventa, destinatie) VALUES ('manual','ref-${Date.now()}',100,'RON','o-data','oriunde') ON CONFLICT DO NOTHING`,
    `INSERT INTO texte (fel, slug, titlu, continut) VALUES ('noutate','proba','Proba','text') ON CONFLICT DO NOTHING`,
    `INSERT INTO firme (cui, denumire, persoana, email, cale) VALUES ('123','Firma','Om','f@exemplu.ro','20') ON CONFLICT DO NOTHING`,
    `INSERT INTO interactiuni (email, fel, rezumat) VALUES ('p@exemplu.ro','notita','x')`,
    `INSERT INTO utilizatori (email, nume) VALUES ('u@exemplu.ro','U') ON CONFLICT DO NOTHING`,
    `INSERT INTO testimoniale (citat, semnatura) VALUES ('c','s')`,
    `INSERT INTO sponsori (nume, cale) VALUES ('S','/cloud/x')`,
    `INSERT INTO abonati_buletin (email, sursa) VALUES ('a@exemplu.ro','formular') ON CONFLICT DO NOTHING`,
    `INSERT INTO contracte (an, numar, denumire) VALUES (2026, 1, 'Firma') ON CONFLICT DO NOTHING`,
  ];
  for (const s of incercari) await ruleaza(s);
}

// ─── 1. Baza „din altă viață” ────────────────────────────────────────────
await baza.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
await baza.query(`
  CREATE TABLE contracte (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firma_id uuid, pdf bytea, amprenta text, ip text,
    semnat_la timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE formulare_230 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nume text, fisier text, creat_la timestamptz DEFAULT now()
  );
`);
console.log("pornit de la: contracte (pdf, amprenta, ip), formulare_230");

// ─── 2. Toate versiunile, în ordine ──────────────────────────────────────
const commits = git("log", "--reverse", "--format=%h", "--", ...FISIERE)
  .trim()
  .split("\n")
  .filter(Boolean);
console.log(`${commits.length} versiuni ale schemei în istoric`);

const istoric = [];
for (const c of commits) {
  const data = git("log", "-1", "--format=%ad %s", "--date=short", c).trim().slice(0, 70);
  const erori = [];
  for (const f of FISIERE) {
    for (const b of blocuri(c, f)) {
      const e = await ruleaza(b.sql);
      if (e) erori.push(`${f.replace("src/lib/", "")}:${b.nume}: ${e}`);
    }
  }
  await seamana();
  istoric.push({ c, data, erori });
  console.log(`${erori.length ? "EROARE" : "ok    "} ${c} ${data}${erori.length ? "\n        " + erori.join("\n        ") : ""}`);
}

// ─── 3. HEAD, de două ori ────────────────────────────────────────────────
const head = git("rev-parse", "--short", "HEAD").trim();
for (const runda of [1, 2]) {
  const erori = [];
  for (const f of FISIERE) {
    for (const b of blocuri("HEAD", f)) {
      const e = await ruleaza(b.sql);
      if (e) erori.push(`${f}:${b.nume}: ${e}`);
    }
  }
  verifica(erori.length === 0, `HEAD (${head}) runda ${runda} pe baza plimbată prin istorie: ${erori.join("; ") || "fără erori"}`);
}

// ─── 4. Fiecare tabel și coloană din HEAD există ─────────────────────────
// Se citește ce ar face HEAD pe o schemă goală, și se compară.
await baza.query("CREATE SCHEMA audit_curat;");
await baza.query("SET search_path TO audit_curat;");
for (const f of FISIERE) for (const b of blocuri("HEAD", f)) {
  const e = await ruleaza(b.sql);
  if (e) verifica(false, `HEAD pe schemă goală ${f}:${b.nume}: ${e}`);
}
await baza.query("SET search_path TO public;");
const coloane = async (schema) =>
  (
    await baza.query(
      `SELECT table_name, column_name, is_nullable, data_type
         FROM information_schema.columns WHERE table_schema = $1`,
      [schema],
    )
  ).rows;
const curat = await coloane("audit_curat");
const plimbat = await coloane("public");
const cheie = (r) => `${r.table_name}.${r.column_name}`;
const are = new Map(plimbat.map((r) => [cheie(r), r]));
const lipsa = curat.filter((r) => !are.has(cheie(r)));
verifica(lipsa.length === 0, `toate coloanele din HEAD există și pe baza veche${lipsa.length ? ": lipsesc " + lipsa.map(cheie).join(", ") : ""}`);
const altfel = curat.filter((r) => are.has(cheie(r)) && (are.get(cheie(r)).is_nullable !== r.is_nullable || are.get(cheie(r)).data_type !== r.data_type));
verifica(altfel.length === 0, `coloanele au același tip/NOT NULL pe amândouă${altfel.length ? ": " + altfel.map((r) => `${cheie(r)} (vechi ${are.get(cheie(r)).data_type}/${are.get(cheie(r)).is_nullable} vs nou ${r.data_type}/${r.is_nullable})`).join(", ") : ""}`);

const indecsi = async (schema) =>
  new Set((await baza.query(`SELECT indexname FROM pg_indexes WHERE schemaname = $1`, [schema])).rows.map((r) => r.indexname));
const iC = await indecsi("audit_curat");
const iP = await indecsi("public");
const fara = [...iC].filter((i) => !iP.has(i));
verifica(fara.length === 0, `toți indecșii din HEAD există pe baza veche${fara.length ? ": lipsesc " + fara.join(", ") : ""}`);
const vechi = (await baza.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1`)).rows.map((r) => r.table_name);
console.log("tabele pe baza veche: " + vechi.join(", "));
verifica(vechi.includes("contracte_semnate_pe_ecran"), "tabelul vechi contracte a fost mutat la contracte_semnate_pe_ecran");

// ─── 5. Un rând stricat în bloc: ce rămâne necreat ───────────────────────
// Un tabel „din altă viață” cu numele unuia nou, dar fără coloana cerută de
// indexul de după el. Se vede cât din bloc se mai creează.
await baza.query("CREATE SCHEMA audit_stricat; SET search_path TO audit_stricat;");
await baza.query(`CREATE TABLE plati_esuate (id serial PRIMARY KEY, nota text);`);
const h = blocuri("HEAD", "src/lib/baza.ts");
const eDef = await ruleaza(h.find((b) => b.nume === "DEFINITIE").sql);
const eAd = await ruleaza(h.find((b) => b.nume === "ADAOSURI").sql);
const tabeleStricat = new Set((await baza.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='audit_stricat'`)).rows.map((r) => r.table_name));
const colStricat = new Set((await baza.query(`SELECT table_name||'.'||column_name AS c FROM information_schema.columns WHERE table_schema='audit_stricat'`)).rows.map((r) => r.c));
console.log(`cu plati_esuate „din altă viață”: DEFINITIE ${eDef ? "CADE: " + eDef : "ok"}; ADAOSURI ${eAd ? "CADE: " + eAd : "ok"}`);
console.log(`  create în ADAOSURI înainte de rândul stricat? abonati_buletin=${tabeleStricat.has("abonati_buletin")} contracte=${tabeleStricat.has("contracte")} contacte_presa=${tabeleStricat.has("contacte_presa")}; după: donatii.canal=${colStricat.has("donatii.canal")} texte.planificat_la=${colStricat.has("texte.planificat_la")} interactiuni.scris_de=${colStricat.has("interactiuni.scris_de")}`);
verifica(eAd !== null && !tabeleStricat.has("abonati_buletin"), "DOVADĂ: o eroare la un singur rând din ADAOSURI dă rollback la TOT blocul (nici măcar tabelele dinaintea rândului nu rămân)");

await baza.query("SET search_path TO public; DROP SCHEMA audit_curat CASCADE; DROP SCHEMA audit_stricat CASCADE;");
await baza.end();
console.log(rele ? `\n${rele} verificări căzute` : "\ntoate verificările au trecut");
process.exit(rele ? 1 : 0);
