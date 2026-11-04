// Deschide pagini în Chromium și scrie ce vede omul (textul din <main>), pentru auditul „erori”.
//   node scripts/qa/audit-erori-browser.mjs /admin /admin/sponsori ...
import { chromium } from "playwright";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4431";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const erori = [];
page.on("pageerror", (e) => erori.push(`[pageerror] ${e.message.slice(0, 200)}`));
page.on("console", (m) => { if (m.type() === "error") erori.push(`[consola] ${m.text().slice(0, 200)}`); });
if (!process.env.FARA_INTRARE) {
  await page.goto(`${BAZA}/admin`);
  await page.fill('input[name="parola"]', PAROLA);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}
for (const cale of process.argv.slice(2)) {
  erori.length = 0;
  const t0 = Date.now();
  await page.goto(`${BAZA}${cale}`, { waitUntil: "networkidle", timeout: 120000 }).catch((e) => console.log(`  (goto: ${e.message.slice(0, 80)})`));
  const main = await page.locator("main").first().innerText().catch(() => page.locator("body").innerText());
  const stare = await page.locator('[role="status"], [role="alert"], #stare').allInnerTexts().catch(() => []);
  console.log(`\n=== ${cale}  (${Date.now() - t0} ms, titlu: ${await page.title()})`);
  console.log(`  stare: ${stare.map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean).join(" | ") || "(niciuna)"}`);
  console.log(`  main: ${main.replace(/\s+/g, " ").slice(0, 700)}`);
  if (erori.length) console.log(`  erori browser: ${erori.slice(0, 4).join(" ; ")}`);
}
await browser.close();
