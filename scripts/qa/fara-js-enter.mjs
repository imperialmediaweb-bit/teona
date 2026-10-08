import { browser, BAZA } from "./comun.mjs";
const b = await browser();
const log = (...a) => console.log(...a);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
const page = await ctx.newPage();
// Contact: Enter în câmp, fără JS
await page.goto(BAZA + "/contact", { waitUntil: "load" });
await page.fill('input[name="nume"]', "Ana Pop");
await page.fill('input[name="email"]', "ana@example.com");
await page.press('input[name="email"]', "Enter");
await page.waitForTimeout(1500);
log("Contact fără JS, Enter în email → URL:", page.url());
await page.goto(BAZA + "/contact", { waitUntil: "load" });
await page.fill('input[name="nume"]', "Ana Pop");
await page.click('button:has-text("Trimite mesajul")');
await page.waitForTimeout(1500);
log("Contact fără JS, clic Trimite → URL:", page.url());
// Newsletter
await page.goto(BAZA + "/", { waitUntil: "load" });
const nf = page.locator("form").filter({ hasText: "Abonează-mă" });
await nf.locator('input[name="email"]').fill("ana@example.com");
await nf.locator('input[name="acord"]').check();
await nf.locator("button").click();
await page.waitForTimeout(1500);
log("Newsletter fără JS, clic Abonează-mă → URL:", page.url());
// Donație
await page.goto(BAZA + "/doneaza", { waitUntil: "load" });
await page.fill('input[name="alta"]', "50");
await page.fill('input[name="email"]', "ana@example.com");
await page.press('input[name="email"]', "Enter");
await page.waitForTimeout(1500);
log("Donație fără JS, Enter → URL:", page.url());
// Voluntar
await page.goto(BAZA + "/devino-voluntar", { waitUntil: "load" });
await page.fill('input[name="nume"]', "Ion Pop");
await page.fill('input[name="email"]', "ion@example.com");
await page.press('input[name="email"]', "Enter");
await page.waitForTimeout(1500);
log("Voluntar fără JS, Enter → URL:", page.url());
// Proiecte fără JS: filtrele
await page.goto(BAZA + "/proiecte", { waitUntil: "load" });
log("Proiecte fără JS: carduri vizibile =", await page.locator('#lista-proiecte a[href^="/proiecte/"]').count(), " taburi:", await page.locator('[role="tab"]').count());
// Proiect fără poze: textul
await ctx.close();
const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p2 = await ctx2.newPage();
for (const s of ["/proiecte/pastram-amintirile-frumoase-in-inimile-noastre-multumim-pentru-implicare", "/proiecte/daruieste-din-inima-si-ajuta-o-inima-bolnava", "/proiecte/prima-tabara-respiro-asociatia-teona-ariana"]) {
  await p2.goto(BAZA + s, { waitUntil: "networkidle" });
  const t = await p2.evaluate(() => ({ imgMain: document.querySelectorAll("main img").length, fotografii: document.querySelector("main")?.innerText.match(/\d+ fotografii/)?.[0] ?? "(fără mențiune)", text: [...document.querySelectorAll("main p")].map((p) => p.innerText.replace(/\s+/g, " ")).find((t) => t.includes("Descrierea")) }));
  log(s.slice(0, 60), JSON.stringify(t));
}
// Cardul din listă pentru aceleași proiecte
await p2.goto(BAZA + "/proiecte", { waitUntil: "networkidle" });
await p2.click('[role="tab"]:has-text("Cazuri umanitare")');
await p2.waitForTimeout(300);
log("Card „Dăruiește…” în listă:", JSON.stringify(await p2.$eval('#lista-proiecte a[href*="daruieste"]', (a) => ({ img: !!a.querySelector("img"), src: a.querySelector("img")?.getAttribute("src")?.slice(0, 70), fotografii: a.innerText.match(/\d+ fotografii/)?.[0] ?? "(fără)" }))));
await p2.click('[role="tab"]:has-text("2021")');
await p2.waitForTimeout(300);
log("Card „Păstrăm…” în listă:", JSON.stringify(await p2.$eval('#lista-proiecte a[href*="pastram"]', (a) => ({ img: !!a.querySelector("img"), src: a.querySelector("img")?.getAttribute("src")?.slice(0, 70), fotografii: a.innerText.match(/\d+ fotografii/)?.[0] ?? "(fără)" }))));
// Antetul la 1280 și 1440: capturi
for (const w of [1280, 1440]) {
  await p2.setViewportSize({ width: w, height: 300 });
  await p2.goto(BAZA + "/", { waitUntil: "networkidle" });
  const r = await p2.evaluate(() => { const h = document.querySelector("header > div"); const d = h.querySelector("div.ml-auto"); const fam = getComputedStyle(document.querySelector("header nav a")).fontFamily; return { headerRight: Math.round(h.getBoundingClientRect().right), doneazaRight: Math.round(d.getBoundingClientRect().right), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, font: fam.slice(0, 60) }; });
  log(`Antet la ${w}:`, JSON.stringify(r));
  await p2.screenshot({ path: `/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/antet-${w}.png`, clip: { x: 0, y: 0, width: w, height: 130 } });
}
await b.close();
