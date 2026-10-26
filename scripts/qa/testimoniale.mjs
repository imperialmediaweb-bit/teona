/**
 * Testimonialele de pe prima pagină, cu textul întreg de sub citat.
 *
 * Caietul (1.8) cere citate scurte, de 20–35 de cuvinte, și bine cere: un
 * paragraf lung într-un carusel nu se citește, se sare. Dar ce trimite o
 * familie după o tabără vine întreg, iar tăiat la o frază se pierde tocmai
 * partea pentru care cineva stă pe pagină. Deci citatul rămâne scurt, iar
 * scrisoarea întreagă se deschide la apăsare.
 *
 * Ce verifică, în ordinea importanței:
 *
 *   1. **coloana apare și pe un tabel care exista deja.** Tabelul e făcut cu
 *      `CREATE TABLE IF NOT EXISTS`, iar ăla nu se uită la coloane: pe baza de
 *      pe Railway, unde tabelul e creat de luna trecută, instrucțiunea trece
 *      tăcut. Fără `ALTER ... ADD COLUMN IF NOT EXISTS`, prima citire ar
 *      răspunde cu „column «text_lung» does not exist" — adică prima pagină ar
 *      da 500, nu doar panoul. Aceeași lecție ca la tabelul `contracte`, care
 *      a ținut panoul căzut două zile;
 *   2. **textul lung ajunge întreg la browser.** Dacă se pierde pe drum —
 *      aliasul din SELECT, maparea de pe prima pagină —, pe site n-apare
 *      nicio eroare: butonul „Citește tot" pur și simplu nu se mai arată, iar
 *      scrisoarea pe care a scris-o un om stă în baza de date, nevăzută;
 *   3. **un text prea lung e refuzat, nu tăiat.** `text()` întoarce `null` și
 *      când textul e prea lung, nu doar când lipsește. Scris fără verificare,
 *      o scrisoare de 7000 de semne s-ar fi salvat ca „niciun text lung": omul
 *      apasă Salvează, primește „Schimbat", și ce a lipit nu e nicăieri. Un
 *      loc care dispare în liniște e felul în care o frază ajunge pe site fără
 *      jumătate din ea;
 *   4. **câmpul gol îl scoate**, deci se poate și reveni la numai citat;
 *   5. **citatul scurt rămâne obligatoriu** — textul lung nu ocolește regula.
 *
 * Proba își face singură testimonialul de probă și îl șterge la final: unul
 * rămas în tabel ar ajunge pe prima pagină, între cuvintele unor oameni
 * adevărați.
 *
 * Rulare:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… DATABASE_URL=… \
 *       node scripts/qa/testimoniale.mjs
 */

import { Client } from "pg";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
if (!PAROLA || !DATABASE_URL) {
  console.error(
    "Lipsesc PAROLA_ADMIN sau DATABASE_URL. Proba are nevoie de amândouă:\n" +
      "  BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/testimoniale.mjs",
  );
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
let cookie = "";
async function cere(cale, optiuni = {}) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: {
      ...(optiuni.headers ?? {}),
      "x-forwarded-for": DE_LA,
      ...(cookie ? { cookie } : {}),
    },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  return r;
}

function post(date) {
  return cere("/api/admin/testimoniale", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(date),
  });
}

/** Codul scurt din adresa de întoarcere: `?stare=facut`. */
function stare(raspuns) {
  const unde = raspuns.headers.get("location") ?? "";
  return new URL(unde, BAZA).searchParams.get("stare");
}

/*
  Prima pagină se citește cu tot cu `<script>`, nu curățată de etichete.

  Caruselul arată un testimonial odată, și pe al nostru îl pune la coadă —
  deci citatul lui nu e în HTML-ul randat, ci în datele trimise componentei
  din browser, care stau într-un `<script>`. Ce verificăm aici e că textul a
  plecat întreg spre browser; că butonul se deschide la apăsare se vede în
  browser, nu dintr-o probă fără browser.
*/
async function ajunge(caut, incercari = 8) {
  for (let i = 0; i < incercari; i++) {
    const h = await (await cere("/")).text();
    if (h.includes(caut)) return true;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

const SEMN = `Probă ${Date.now().toString(36)}`;
const CITAT =
  "Am ajuns la tabără obosiți și speriați, iar a doua zi băiatul meu a " +
  "râs pentru prima dată după multe luni. Acasă vorbește încă despre ei.";
const LUNG =
  `Primul paragraf al probei ${SEMN}, scris ca să aibă ce se deschide.\n\n` +
  "Al doilea paragraf, despărțit de primul printr-un rând gol.";

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: /@(localhost|127\.0\.0\.1)/.test(DATABASE_URL)
    ? false
    : { rejectUnauthorized: false },
});
await client.connect();

async function curata() {
  await client
    .query("DELETE FROM testimoniale WHERE semnatura = $1", [SEMN])
    .catch(() => undefined);
}
await curata();

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/testimoniale" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// 1. Coloana, pe tabelul așa cum e el acum.
verifica(
  (await (await cere("/admin/testimoniale")).text()).includes("text_lung"),
  "panoul se deschide și are câmpul pentru textul întreg",
);
const { rows: coloane } = await client.query(
  `SELECT data_type FROM information_schema.columns
    WHERE table_name = 'testimoniale' AND column_name = 'text_lung'`,
);
verifica(
  coloane[0]?.data_type === "text",
  "coloana text_lung există, și pe un tabel făcut înainte de ea",
);

// 2. Se scrie și ajunge pe prima pagină.
verifica(
  stare(await post({ citat: CITAT, semnatura: SEMN, text_lung: LUNG })) ===
    "facut",
  "se adaugă un testimonial cu text întreg",
);
const { rows: scris } = await client.query(
  "SELECT citat, text_lung FROM testimoniale WHERE semnatura = $1",
  [SEMN],
);
verifica(scris.length === 1, "a intrat un singur rând");
verifica(scris[0]?.text_lung === LUNG, "textul întreg e în baza de date, neatins");
verifica(
  (await (await cere("/admin/testimoniale")).text()).includes(
    "Al doilea paragraf",
  ),
  "panoul îl arată înapoi în câmp, ca să poată fi schimbat",
);
verifica(
  await ajunge("Primul paragraf al probei"),
  "textul întreg pleacă spre browser, pe prima pagină",
);
verifica(
  await ajunge("a râs pentru prima dată"),
  "…și citatul scurt la fel",
);

// 3. Prea lung: refuzat, nu tăiat.
const id = (
  await client.query("SELECT id FROM testimoniale WHERE semnatura = $1", [SEMN])
).rows[0].id;
verifica(
  stare(
    await post({
      id,
      citat: CITAT,
      semnatura: SEMN,
      text_lung: "x".repeat(6001),
    }),
  ) === "lung",
  "un text întreg peste limită e refuzat, cu mesaj",
);
verifica(
  (
    await client.query("SELECT text_lung FROM testimoniale WHERE id = $1", [id])
  ).rows[0].text_lung === LUNG,
  "…și nu strică ce era scris acolo",
);

// 4. Câmpul gol îl scoate.
verifica(
  stare(await post({ id, citat: CITAT, semnatura: SEMN, text_lung: "" })) ===
    "schimbat",
  "câmpul lăsat gol se salvează",
);
verifica(
  (
    await client.query("SELECT text_lung FROM testimoniale WHERE id = $1", [id])
  ).rows[0].text_lung === null,
  "…și scoate textul întreg, deci rămâne numai citatul",
);

// 5. Citatul rămâne obligatoriu.
verifica(
  stare(await post({ citat: "scurt", semnatura: SEMN, text_lung: LUNG })) ===
    "citat",
  "un citat prea scurt e refuzat chiar dacă textul întreg e bun",
);

await curata();
verifica(
  (
    await client.query(
      "SELECT count(*)::int AS cate FROM testimoniale WHERE semnatura = $1",
      [SEMN],
    )
  ).rows[0].cate === 0,
  "testimonialul de probă nu rămâne pe site",
);
await client.end();

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
