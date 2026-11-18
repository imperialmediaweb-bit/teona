/**
 * Spam în formularele publice: ofertele se opresc singure, iar „Spam: șterge
 * și blochează” din Cereri oprește adresa (sau tot domeniul) de acum încolo.
 *
 *   BAZA=http://localhost:4613 PAROLA_ADMIN=… PSQL="psql -h /tmp -p 5434 -U postgres teona" node scripts/qa/spam.mjs
 *
 * Numai pe o bază locală: scrie și șterge cereri.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const B = process.env.BAZA ?? "http://localhost:4613";
const PAROLA = process.env.PAROLA_ADMIN;
const PSQL = process.env.PSQL;
if (!PAROLA || !PSQL) {
  console.log("SĂRIT: lipsește PAROLA_ADMIN sau PSQL.");
  process.exit(0);
}
let rele = 0;
const v = (ok, m) => {
  console.log(`${ok ? "ok  " : "CADE"} ${m}`);
  if (!ok) rele++;
};
const sql = (q) => execSync(`${PSQL} -Atc "${q.replace(/"/g, '\\"')}"`).toString().trim();
const t = Date.now();
let ip = 0;
const trimite = (corp) =>
  fetch(`${B}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-deschis": "9000", "x-forwarded-for": `10.9.${t % 200}.${++ip}` },
    body: JSON.stringify({ fel: "contact", acord: true, ...corp }),
  });

// 1. Oferta: răspuns „Mulțumim”, dar nu intră la Cereri.
const oferta = `oferta-${t}@ailocal-proba.ro`;
let r = await trimite({
  nume: "AI Local",
  email: oferta,
  mesaj: "Auditul nostru GEO costă 19 € + TVA, față de prețul de listă de 199 € + TVA. Răspundeți astăzi, oferta este valabilă doar azi.",
});
v(r.status === 200, `oferta primește „Mulțumim” (${r.status})`);
v(sql(`SELECT count(*) FROM cereri WHERE email='${oferta}'`) === "0", "oferta NU intră la Cereri");
v(sql(`SELECT motiv FROM mesaje_oprite WHERE email='${oferta}'`) === "oferta", "…dar rămâne urma ei la „Mesaje oprite”");

// 2. Un mesaj obișnuit trece.
const om = `om-${t}@firma-spam-proba.ro`;
r = await trimite({ nume: "Ion Popescu", email: om, mesaj: "Bună ziua, vrem să ajutăm la tabăra din vară. Cu ce putem fi de folos?" });
v(sql(`SELECT count(*) FROM cereri WHERE email='${om}'`) === "1", `mesajul obișnuit intră la Cereri (${r.status})`);
const id = sql(`SELECT id FROM cereri WHERE email='${om}'`);

// 3. „Spam: șterge și blochează”, cu tot domeniul.
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
const p = await b.newPage();
const erori = [];
p.on("pageerror", (e) => erori.push(e.message));
await p.goto(`${B}/admin/cereri`);
await p.fill("input[type=password]", PAROLA);
await p.locator("form:has(input[type=password]) button[type=submit]").first().click();
await p.waitForLoadState("load");
await p.goto(`${B}/admin/cereri`);
const forma = p.locator(`form[data-spam]:has(input[name=id][value="${id}"])`);
v((await forma.count()) === 1, "cererea are butonul „Spam: șterge și blochează”");
await forma.locator("input[name=domeniu]").check();
let intrebare = "";
p.once("dialog", (d) => {
  intrebare = d.message();
  d.accept();
});
await forma.locator("button[type=submit]").click();
await p.waitForURL(/stare=blocat/, { timeout: 8000 }).catch(() => {});
v(/Ștergi mesajul și blochezi/.test(intrebare), "cere confirmare înainte");
v(sql(`SELECT count(*) FROM cereri WHERE id='${id}'`) === "0", "cererea e ștearsă");
v(sql(`SELECT count(*) FROM expeditori_blocati WHERE valoare='@firma-spam-proba.ro'`) === "1", "domeniul e blocat");
v(await p.getByText("Șters și blocat").isVisible(), "mesajul „Șters și blocat” se vede");

// 4. Altă adresă de pe același domeniu, mesaj nevinovat: oprit.
const alt = `alt-${t}@firma-spam-proba.ro`;
r = await trimite({ nume: "Maria", email: alt, mesaj: "Revin cu o întrebare despre voluntariat." });
v(r.status === 200 && sql(`SELECT count(*) FROM cereri WHERE email='${alt}'`) === "0", "a doua adresă de pe domeniu e oprită");

// 5. Gmail nu se poate bloca întreg.
const g = `gm-${t}@gmail.com`;
await trimite({ nume: "Ana", email: g, mesaj: "O întrebare simplă despre Casa Teona." });
const idg = sql(`SELECT id FROM cereri WHERE email='${g}'`);
await p.goto(`${B}/admin/cereri`);
v((await p.locator(`form[data-spam]:has(input[name=id][value="${idg}"]) input[name=domeniu]`).count()) === 0, "la Gmail nu apare „tot domeniul”");
sql(`DELETE FROM cereri WHERE id='${idg}'`);

// 6. Setări: lista și deblocarea.
await p.goto(`${B}/admin/setari#spam`);
await p.getByText("tot domeniul @firma-spam-proba.ro").waitFor({ timeout: 8000 }).catch(() => {});
v(await p.getByText("tot domeniul @firma-spam-proba.ro").isVisible(), "Setări: domeniul apare la „Adrese blocate”");
await p.locator(`form:has(input[name=valoare][value="@firma-spam-proba.ro"]) button`).click();
await p.waitForLoadState("load");
v(sql(`SELECT count(*) FROM expeditori_blocati WHERE valoare='@firma-spam-proba.ro'`) === "0", "„Deblochează” îl scoate");
r = await trimite({ nume: "Maria", email: alt, mesaj: "Revin cu o întrebare despre voluntariat." });
v(sql(`SELECT count(*) FROM cereri WHERE email='${alt}'`) === "1", "după deblocare, mesajele trec din nou");

sql(`DELETE FROM cereri WHERE email LIKE '%firma-spam-proba.ro'`);
sql(`DELETE FROM mesaje_oprite WHERE email LIKE '%-proba.ro'`);
v(erori.length === 0, `fără erori în browser (${erori.join(" | ")})`);
await b.close();
console.log(rele ? `${rele} CAD` : "TOATE TREC");
process.exit(rele ? 1 : 0);
