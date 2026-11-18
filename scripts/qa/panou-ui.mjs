/**
 * Etapa 2 a refacerii panoului: piesele comune (antet, carduri cu cifre,
 * sertar, butoane) pe paginile pe care au intrat deja.
 *
 *   BAZA=http://localhost:4613 PAROLA_ADMIN=… node scripts/qa/panou-ui.mjs
 *
 * Numai citește și deschide; nu scrie nimic în baza de date.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const B = process.env.BAZA ?? "http://localhost:4613";
const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.log("SĂRIT: lipsește PAROLA_ADMIN.");
  process.exit(0);
}
let rele = 0;
const v = (ok, m) => {
  console.log(`${ok ? "ok  " : "CADE"} ${m}`);
  if (!ok) rele++;
};

const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium" });
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
const erori = [];
p.on("pageerror", (e) => erori.push(e.message));
await p.goto(`${B}/admin`);
await p.fill("input[type=password]", PAROLA);
await p.locator("form:has(input[type=password]) button[type=submit]").first().click();
await p.waitForLoadState("load");

// Donații: acțiunea principală e butonul din antet și deschide sertarul.
await p.goto(`${B}/admin/donatii`);
await p.waitForFunction(() => document.querySelectorAll("aside").length === 1);
await p.waitForTimeout(800);
v(await p.locator("details#de-mana").count() === 0, "Donații: formularul nu mai stă într-o secțiune pliată");
const buton = p.getByRole("button", { name: "Donație de mână" });
v((await buton.count()) === 1, "Donații: „+ Donație de mână” e butonul din antet");
v(!(await p.locator("[data-sertar]").isVisible().catch(() => false)), "sertarul e închis din start");
await buton.click();
await p.locator("[data-sertar]").waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
v(await p.locator("[data-sertar]").isVisible(), "clic: sertarul se deschide");
v(await p.locator("[data-sertar] form[action='/api/admin/donatii'] input[name=suma]").count() === 1, "…cu formularul de donație în el");
await p.keyboard.press("Escape");
await p.waitForTimeout(300);
v(!(await p.locator("[data-sertar]").isVisible()), "Esc îl închide");
await p.goto(`${B}/admin/donatii?de-mana=1`);
await p.locator("[data-sertar]").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
v(await p.locator("[data-sertar]").isVisible(), "acțiunea „Donație nouă” (?de-mana=1) îl deschide direct");
// Salvarea din sertar chiar scrie donația (numai pe o bază locală).
if (process.env.SCRIE === "1") {
  const ref = `proba-sertar-${Date.now()}`;
  await p.fill("[data-sertar] input[name=suma]", "37");
  await p.fill("[data-sertar] input[name=referinta]", ref);
  await p.locator("[data-sertar] button[type=submit]").first().click();
  await p.waitForLoadState("load");
  await p.waitForTimeout(1000);
  v((await p.content()).includes(ref) || (await p.locator("text=37").count()) > 0, "donația din sertar s-a salvat și apare în listă");
  await p.goto(`${B}/admin/donatii`);
}
// „Descarcă pentru Excel”, contur, în antet
v(/Descarcă pentru Excel/.test(await p.locator("h1 >> xpath=../..").innerText()), "„Descarcă pentru Excel” în antet");

// Abonați: carduri cu cifre și butonul principal
await p.goto(`${B}/admin/abonati`);
await p.waitForTimeout(1200);
v(await p.locator("[data-card-cifra]").count() === 3, "Abonați: trei carduri cu cifre");
v(await p.getByRole("link", { name: "Încarcă abonați" }).count() >= 1, "Abonați: „+ Încarcă abonați” în antet");

// Antetul și conținutul pe aceeași lățime
for (const u of ["/admin/donatii", "/admin/firme", "/admin/abonati"]) {
  await p.goto(`${B}${u}`);
  await p.waitForTimeout(800);
  const h = await p.locator("h1").first().boundingBox();
  const cont = await p.locator("#continut-panou").boundingBox();
  const pad = await p.locator("#continut-panou").evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft));
  v(Math.abs(h.x - (cont.x + pad)) <= 1, `${u}: titlul și conținutul încep la aceeași margine`);
}

// Telefon: sertarul ocupă tot ecranul, nimic nu iese în lateral
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await c.storageState() })).newPage();
await m.goto(`${B}/admin/donatii`);
await m.waitForTimeout(1200);
await m.getByRole("button", { name: "Donație de mână" }).click();
await m.waitForTimeout(400);
const s = await m.locator("[data-sertar]").boundingBox();
v(s && s.width >= 389, `telefon: sertarul are toată lățimea (${s?.width})`);
for (const u of ["/admin/donatii", "/admin/abonati", "/admin/firme"]) {
  await m.goto(`${B}${u}`);
  await m.waitForTimeout(800);
  v((await m.evaluate(() => document.documentElement.scrollWidth)) <= 390, `telefon: ${u} fără derulare laterală`);
}

v(erori.length === 0, `fără erori în browser (${erori.join(" | ")})`);
await b.close();
console.log(rele ? `${rele} CAD` : "TOATE TREC");
process.exit(rele ? 1 : 0);
