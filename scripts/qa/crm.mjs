import { browser, BAZA, urmaresteErori } from "./comun.mjs";

/**
 * Panoul CRM: tabloul de bord, firmele, cererile.
 *
 * Se rulează cu baza de date și parola în mediu:
 *
 *   DATABASE_URL=… PAROLA_ADMIN=… npm run dev
 *   PAROLA_ADMIN=… node scripts/qa/crm.mjs
 *
 * Verifică fluxurile care chiar schimbă date — mutarea unei firme între
 * stadii, scrierea în jurnal, filtrele — nu doar că paginile se încarcă.
 * Majoritatea greșelilor de până acum în panou au fost de felul ăsta: pagina
 * arăta bine, dar butonul nu făcea nimic.
 */

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.log("Lipsește PAROLA_ADMIN. Nu se poate intra în panou.");
  process.exit(0);
}

const b = await browser();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 1200 },
  // Intrarea e limitată la 5 încercări pe adresă; scriptul își ia adresa lui.
  extraHTTPHeaders: { "x-forwarded-for": "198.51.100.77" },
});
const page = await ctx.newPage();
const erori = urmaresteErori(page);
let rele = 0;

function verifica(eticheta, conditie, detaliu = "") {
  console.log(`${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`);
  if (!conditie) rele++;
}

// ─── Intrare ──────────────────────────────────────────────────────────────
await page.goto(BAZA + "/admin", { waitUntil: "networkidle" });
await page.fill('input[name="parola"]', PAROLA);
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");
verifica("intrarea duce la tabloul de bord", new URL(page.url()).pathname === "/admin", page.url());

// ─── Tabloul de bord ──────────────────────────────────────────────────────
console.log("\n=== Tabloul de bord ===");
const carduri = await page.locator("#panou-admin section").count();
verifica("are carduri de grafice", carduri >= 6, `${carduri} carduri`);

// Tabelele ascunse: cifrele trebuie să ajungă și la cititoarele de ecran.
const tabele = await page.locator("table.sr-only").count();
verifica("graficele au tabel citibil cu voce tare", tabele >= 3, `${tabele} tabele`);
const captions = await page.locator("table.sr-only caption").allInnerTexts();
verifica("fiecare tabel are titlu", captions.every((c) => c.trim().length > 3), JSON.stringify(captions));

// Fără derulare laterală.
for (const w of [1280, 390]) {
  await page.setViewportSize({ width: w, height: 1200 });
  await page.waitForTimeout(200);
  const lat = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  verifica(`fără derulare laterală la ${w}px`, !lat);
}
await page.setViewportSize({ width: 1280, height: 1200 });

// Etichetele graficelor nu ies din cardul lor.
const iesite = await page.evaluate(() => {
  const rele = [];
  for (const s of document.querySelectorAll("#panou-admin section")) {
    const c = s.getBoundingClientRect();
    for (const e of s.querySelectorAll("span")) {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1))
        rele.push(e.textContent.trim().slice(0, 20));
    }
  }
  return rele;
});
verifica("nicio etichetă nu iese din card", iesite.length === 0, JSON.stringify(iesite));

// ─── Firme: filtre, căutare, mutare între stadii ──────────────────────────
console.log("\n=== Firme ===");
await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
const toate = await page.locator("#panou-admin ul > li").count();
verifica("lista are firme", toate >= 2, `${toate} firme`);

await page.click('a:has-text("Contract semnat")');
await page.waitForLoadState("networkidle");
const semnate = await page.locator("#panou-admin ul > li").count();
verifica("filtrul pe stadiu reduce lista", semnate < toate && semnate >= 1, `${semnate} din ${toate}`);

await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
await page.fill('input[name="cauta"]', "lemnul");
await page.click('button:has-text("Caută")');
await page.waitForLoadState("networkidle");
verifica("căutarea după denumire", (await page.locator("#panou-admin ul > li").count()) === 1);
await page.fill('input[name="cauta"]', "zzzz");
await page.click('button:has-text("Caută")');
await page.waitForLoadState("networkidle");
verifica("căutare fără rezultat spune asta", (await page.locator("#panou-admin").innerText()).includes("Nicio firmă"));

// Mutarea unei firme + suma încasată.
await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
const primul = page.locator("#panou-admin ul > li").first();
const numeFirma = await primul.locator("p").first().innerText();
await primul.locator('select[name="stadiu"]').selectOption("incasat");
await primul.locator('input[name="suma"]').fill("12.500");
await primul.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");
verifica("mutarea duce înapoi la lista de firme", new URL(page.url()).pathname === "/admin/firme", page.url());

const dupa = page.locator("#panou-admin ul > li").filter({ hasText: numeFirma }).first();
const textDupa = await dupa.innerText();
verifica("stadiul s-a schimbat", textDupa.includes("Bani încasați"), textDupa.split("\n")[0]);
verifica("suma scrisă cu punct de mii s-a citit corect", textDupa.includes("12.500 lei"), textDupa.replace(/\n/g, " | ").slice(0, 160));

// Suma scrisă aiurea nu trebuie să piardă mutarea stadiului.
await dupa.locator('select[name="stadiu"]').selectOption("contract_trimis");
await dupa.locator('input[name="suma"]').fill("aiurea");
await dupa.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");
const dupa2 = await page.locator("#panou-admin ul > li").filter({ hasText: numeFirma }).first().innerText();
verifica("o sumă scrisă greșit nu anulează mutarea", dupa2.includes("Contract trimis"), dupa2.split("\n")[0]);
verifica("și nu șterge suma dinainte", dupa2.includes("12.500 lei"));

// ─── Jurnalul discuțiilor ─────────────────────────────────────────────────
console.log("\n=== Jurnal ===");
await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
await page.locator("#panou-admin ul > li").first().locator('a:has-text("Discuții și notițe")').click();
await page.waitForLoadState("networkidle");
verifica("jurnalul se deschide", (await page.locator('form[action="/api/admin/jurnal"]').count()) === 1);
verifica("și spune că e gol", (await page.locator("#panou-admin").innerText()).includes("Nimic scris încă"));

await page.selectOption('form[action="/api/admin/jurnal"] select[name="fel"]', "telefon");
await page.fill('input[name="rezumat"]', "L-am sunat pe Andrei: trimite actele până vineri.");
await page.click('form[action="/api/admin/jurnal"] button:has-text("Adaugă")');
await page.waitForLoadState("networkidle");
const cuJurnal = await page.locator("#panou-admin").innerText();
verifica("intrarea se salvează și se vede", cuJurnal.includes("trimite actele până vineri"));
verifica("cu felul ei", cuJurnal.includes("Telefon"));
verifica("jurnalul rămâne deschis după salvare", (await page.locator('form[action="/api/admin/jurnal"]').count()) === 1);

// Rezumat gol — nu se salvează.
await page.fill('input[name="rezumat"]', "");
const golAcceptat = await page.evaluate(() => {
  const f = document.querySelector('form[action="/api/admin/jurnal"]');
  return f.checkValidity();
});
verifica("rezumatul gol e oprit de browser", !golAcceptat);

// ─── Cereri ───────────────────────────────────────────────────────────────
console.log("\n=== Cereri ===");
await page.goto(BAZA + "/admin/cereri", { waitUntil: "networkidle" });
const nrCereri = await page.locator("#panou-admin ul > li").count();
verifica("lista are cereri", nrCereri >= 2, `${nrCereri} cereri`);

await page.click('a:has-text("Voluntariat")');
await page.waitForLoadState("networkidle");
verifica("filtrul pe fel", (await page.locator("#panou-admin ul > li").count()) === 1);

await page.goto(BAZA + "/admin/cereri", { waitUntil: "networkidle" });
const cerere = page.locator("#panou-admin ul > li").first();
await cerere.locator('select[name="stadiu"]').selectOption("rezolvat");
await cerere.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");
await page.goto(BAZA + "/admin/cereri?stadiu=rezolvat", { waitUntil: "networkidle" });
verifica("cererea s-a mutat în „rezolvat”", (await page.locator("#panou-admin ul > li").count()) >= 1);

// ─── Fără sesiune, nimic nu merge ─────────────────────────────────────────
console.log("\n=== Fără sesiune ===");
const anonim = await b.newPage();
for (const cale of ["/admin", "/admin/firme", "/admin/cereri"]) {
  await anonim.goto(BAZA + cale, { waitUntil: "networkidle" });
  const text = await anonim.locator("#panou-admin").innerText();
  verifica(`${cale} cere parola`, text.includes("Parola") && !text.includes("CUI"), text.slice(0, 40).replace(/\n/g, " "));
}
const r = await anonim.request.post(BAZA + "/api/admin/firme", { form: { id: "00000000-0000-0000-0000-000000000000", stadiu: "incasat" } });
verifica("ruta de firme refuză fără sesiune", r.status() === 403, String(r.status()));
const r2 = await anonim.request.post(BAZA + "/api/admin/jurnal", { form: { email: "x@y.ro", fel: "telefon", rezumat: "x" } });
verifica("ruta de jurnal refuză fără sesiune", r2.status() === 403, String(r2.status()));

console.log("\nerori consolă/rețea:", JSON.stringify(erori));
console.log(`\nverificări picate: ${rele}`);
await b.close();
process.exit(rele === 0 ? 0 : 1);
