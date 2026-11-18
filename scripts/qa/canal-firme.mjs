/**
 * De unde a venit firma: canalul se scrie la formularul de sponsorizare, la
 * contractul făcut pe site și la 3,5%, și se vede în panou (pagina firmei,
 * lista de donații).
 *
 *   BAZA=http://localhost:4613 PAROLA_ADMIN=… PSQL="psql …" node scripts/qa/canal-firme.mjs
 *
 * Numai pe o bază locală: scrie firme, cereri și o donație.
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
const antet = () => ({ "x-deschis": "9000", "x-forwarded-for": `10.8.${t % 200}.${++ip}` });

// 1. Formularul de sponsorizare, venit din codul QR.
const eSpons = `spons-${t}@firma-canal.ro`;
let r = await fetch(`${B}/api/formulare`, {
  method: "POST",
  headers: { "content-type": "application/json", ...antet() },
  body: JSON.stringify({ fel: "sponsorizare", firma: "Firma Canal QR SRL", cui: "RO43533953".replace("RO", ""), persoana: "Ion Test", email: eSpons, cale: "Declarația 177", acord: true, canal: "qr" }),
});
v(sql(`SELECT canal FROM firme WHERE email='${eSpons}'`) === "qr", `sponsorizare: canalul „qr” e pe firmă (${r.status})`);
const idFirma = sql(`SELECT id FROM firme WHERE email='${eSpons}'`);

// 2. A doua oară, din alt canal: rămâne prima urmă.
r = await fetch(`${B}/api/formulare`, {
  method: "POST",
  headers: { "content-type": "application/json", ...antet() },
  body: JSON.stringify({ fel: "sponsorizare", firma: "Firma Canal QR SRL", cui: "43533953", persoana: "Ion Test", email: eSpons, cale: "Declarația 177", acord: true, canal: "facebook" }),
});
v(sql(`SELECT canal FROM firme WHERE email='${eSpons}'`) === "qr", "a doua cerere, din Facebook: rămâne „qr” (prima urmă)");

// 3. Un canal inventat nu intră.
const eRau = `rau-${t}@firma-canal.ro`;
await fetch(`${B}/api/formulare`, {
  method: "POST",
  headers: { "content-type": "application/json", ...antet() },
  body: JSON.stringify({ fel: "sponsorizare", firma: "Firma Rea SRL", cui: "14399840", persoana: "Ana Test", email: eRau, cale: "Declarația 177", acord: true, canal: "reclama-inventata" }),
});
v(sql(`SELECT coalesce(canal,'nimic') FROM firme WHERE email='${eRau}'`) === "nimic", "un canal inventat nu se scrie");

// 4. Contractul făcut pe site, venit din Google.
const fd = new FormData();
for (const [k, val] of Object.entries({ cui: "18547290", denumire: "Firma Contract Google SRL", reprezentant: "Maria Test", calitate: "Administrator", email: `contr-${t}@firma-canal.ro`, valoare: "1000", sediu: "Suceava", regCom: "J33/1/2020", canal: "google-organic", fel: "pdf" })) fd.set(k, val);
r = await fetch(`${B}/api/contract/descarca`, { method: "POST", headers: antet(), body: fd });
v(sql(`SELECT canal FROM firme WHERE email='contr-${t}@firma-canal.ro'`) === "google-organic", `contract pe site: canalul „google-organic” (${r.status})`);

// 5. 3,5%: canalul intră în detaliile cererii.
const eRed = `red-${t}@gmail.com`;
await fetch(`${B}/api/formulare`, {
  method: "POST",
  headers: { "content-type": "application/json", ...antet() },
  body: JSON.stringify({ fel: "redirectionare", nume: "Elena Canal", email: eRed, preferinta: "Completez online", acord: true, canal: "direct" }),
});
v(sql(`SELECT detalii->>'A venit din' FROM cereri WHERE email='${eRed}'`) === "Direct", "3,5%: „A venit din: Direct” în cerere");

// 6. În panou: pagina firmei și lista de donații.
sql(`INSERT INTO donatii (procesator,referinta,suma_bani,moneda,frecventa,destinatie,email,nume,stare,platita_la,canal) VALUES ('stripe','canal-${t}',5000,'RON','o-data','oriunde','don-${t}@gmail.com','Donator Canal','platita',now(),'qr')`);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
const p = await b.newPage();
await p.goto(`${B}/admin`);
await p.fill("input[type=password]", PAROLA);
await p.locator("form:has(input[type=password]) button[type=submit]").first().click();
await p.waitForLoadState("load");
await p.goto(`${B}/admin/firme/${idFirma}/mesaje`);
await p.locator("[data-canal]").first().waitFor({ timeout: 8000 }).catch(() => {});
v(/A venit din: Cod QR/i.test(await p.locator("[data-canal]").first().innerText().catch(() => "")), "pagina firmei: „A venit din: Cod QR…”");
await p.goto(`${B}/admin/donatii`);
await p.locator("[data-lista-donatii]").waitFor({ timeout: 8000 }).catch(() => {});
const rand = p.locator("[data-donatie]", { hasText: "Donator Canal" });
v(/QR/i.test(await rand.locator("[data-canal]").innerText().catch(() => "")), "lista de donații: donația arată canalul");
sql(`INSERT INTO donatii (procesator,referinta,suma_bani,moneda,frecventa,destinatie,email,nume,stare,platita_la) VALUES ('manual-transfer','mana-${t}',7000,'RON','o-data','oriunde','mana-${t}@gmail.com','Donator Mana','platita',now())`);
await p.goto(`${B}/admin/donatii`);
await p.locator("[data-lista-donatii]").waitFor({ timeout: 8000 }).catch(() => {});
v((await p.locator("[data-donatie]", { hasText: "Donator Mana" }).locator("[data-canal]").innerText().catch(() => "")) === "Adăugată din panou", "donația adăugată din panou: „Adăugată din panou”");
v((await p.locator("[data-donatie]").count()) === (await p.locator("[data-donatie] [data-canal]").count()), "fiecare donație din listă are eticheta sursei");
await p.goto(`${B}/admin/analiza?fila=vizite`);
await p.getByText("adăugat", { exact: false }).first().waitFor({ timeout: 8000 }).catch(() => {});
v(/donați[ei] adăugat[eă] din panou/.test(await p.locator("main").innerText()), "Analiză: cele adăugate din panou se numără separat");
sql(`DELETE FROM donatii WHERE referinta='mana-${t}'`);
await b.close();

sql(`DELETE FROM donatii WHERE referinta='canal-${t}'`);
sql(`DELETE FROM cereri WHERE email='${eRed}'`);
sql(`DELETE FROM interactiuni WHERE firma_id IN (SELECT id FROM firme WHERE email LIKE '%-${t}@firma-canal.ro')`);
sql(`DELETE FROM contracte WHERE firma_id IN (SELECT id FROM firme WHERE email LIKE '%-${t}@firma-canal.ro')`);
sql(`DELETE FROM firme WHERE email LIKE '%-${t}@firma-canal.ro'`);
console.log(rele ? `${rele} CAD` : "TOATE TREC");
process.exit(rele ? 1 : 0);
