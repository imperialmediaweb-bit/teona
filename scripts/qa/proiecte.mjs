import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(ACORD);
const page = await ctx.newPage();
const erori = urmaresteErori(page);
await page.goto(BAZA + "/proiecte", { waitUntil: "networkidle" });

const taburi = page.locator('[role="tablist"] [role="tab"]');
log("Filtre:", JSON.stringify(await taburi.evaluateAll((ts) => ts.map((t) => ({ text: t.innerText.replace(/\s+/g, " "), selected: t.getAttribute("aria-selected"), tabindex: t.getAttribute("tabindex") })))));
const toateLinkurile = new Set();
for (let i = 0; i < (await taburi.count()); i++) {
  await taburi.nth(i).click();
  await page.waitForTimeout(300);
  const text = (await taburi.nth(i).innerText()).replace(/\s+/g, " ");
  const carduri = await page.$$eval('#lista-proiecte a[href^="/proiecte/"]', (as) => as.map((a) => a.getAttribute("href")));
  carduri.forEach((c) => toateLinkurile.add(c));
  const gol = await page.locator("#lista-proiecte").innerText();
  log(`\nTab „${text}”: ${carduri.length} carduri`, carduri.length === 0 ? "— text: " + gol.replace(/\s+/g, " ").slice(0, 160) : "");
  if (carduri.length) {
    const info = await page.$$eval('#lista-proiecte li', (lis) => lis.slice(0, 3).map((li) => ({ titlu: li.querySelector("h3")?.innerText, data: li.querySelector("time")?.innerText, dt: li.querySelector("time")?.getAttribute("datetime"), poza: li.querySelector("img")?.getAttribute("src")?.slice(0, 80) ?? "fără poză", nrFoto: li.innerText.match(/\d+ fotografii/)?.[0] })));
    log("  primele:", JSON.stringify(info));
    // Ordinea: descrescătoare?
    const date = await page.$$eval("#lista-proiecte time", (ts) => ts.map((t) => t.getAttribute("datetime")));
    const sortate = [...date].sort().reverse();
    log("  ordine descrescătoare:", JSON.stringify(date) === JSON.stringify(sortate), " primele date:", date.slice(0, 4).join(", "));
  }
}
// Tastatură pe taburi
await taburi.first().focus();
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(100);
log("\nArrowRight pe tab → focus:", await page.evaluate(() => document.activeElement.innerText.replace(/\s+/g, " ")));
await page.keyboard.press("Tab");
log("Tab → focus:", await page.evaluate(() => document.activeElement.innerText.replace(/\s+/g, " ").slice(0, 40)));
// Filtrul se păstrează în URL? (reîncărcare)
await taburi.nth(3).click();
await page.waitForTimeout(200);
log("URL după alegerea tabului 4:", page.url());
await page.reload({ waitUntil: "networkidle" });
log("După reîncărcare, tab selectat:", await page.locator('[role="tab"][aria-selected="true"]').innerText().then((t) => t.replace(/\s+/g, " ")));

// Pagini de proiect: toate, cu verificare de poze
log("\n=== Paginile de proiect ===", toateLinkurile.size);
let problema = 0;
for (const href of toateLinkurile) {
  const localErori = [];
  const asculta = (r) => { if (r.status() >= 400) localErori.push(`${r.status()} ${r.url().replace(BAZA, "")}`); };
  page.on("response", asculta);
  await page.goto(BAZA + href, { waitUntil: "networkidle" });
  // derulează ca să se încarce pozele lazy
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await page.waitForLoadState("networkidle");
  page.off("response", asculta);
  const stricate = await page.$$eval("img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")?.slice(0, 100)));
  const h1 = await page.locator("h1").innerText();
  const nrPoze = await page.$$eval("main img", (i) => i.length);
  const categorie = await page.locator("main span.rounded-full.border-2").first().innerText().catch(() => "?");
  if (localErori.length || stricate.length) problema++;
  log(`${localErori.length || stricate.length ? "RĂU" : "ok "} ${href} — ${h1.slice(0, 50)} [${categorie}] ${nrPoze} img` + (localErori.length ? `\n     http: ${JSON.stringify(localErori)}` : "") + (stricate.length ? `\n     img stricate: ${JSON.stringify(stricate)}` : ""));
}
log(`\n${problema} pagini de proiect cu probleme.`);
// O categorie goală: textul
log("\nErori generale:", JSON.stringify([...new Set(erori)].filter((e) => !e.includes("404"))));
await b.close();
