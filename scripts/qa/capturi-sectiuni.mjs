import { browser, BAZA } from "./comun.mjs";
const b = await browser();
const log = (...a) => console.log(...a);
const DIR = "/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/capturi";
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));

// Copiază: același element, înainte/după
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  await page.goto(BAZA + "/doneaza", { waitUntil: "networkidle" });
  const h = await page.$('#transfer button');
  await h.click();
  await page.waitForTimeout(150);
  log("Copiază (același element): buton=", (await h.innerText()).trim(), " sr-status=", JSON.stringify(await h.evaluate((b) => b.parentElement.querySelector('[role="status"]').innerText)), " clipboard=", await page.evaluate(() => navigator.clipboard.readText()));
  await page.waitForTimeout(2600);
  log("  după 2,6 s: buton=", (await h.innerText()).trim(), " sr-status=", JSON.stringify(await h.evaluate((b) => b.parentElement.querySelector('[role="status"]').innerText)));
  await ctx.close();
}

// Capturi de secțiuni pe telefon
const ctx = await b.newContext({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 1 });
await ctx.addInitScript(ACORD);
const page = await ctx.newPage();
async function captura(cale, selector, nume, w = 320) {
  await page.setViewportSize({ width: w, height: 640 });
  await page.goto(BAZA + cale, { waitUntil: "networkidle" });
  const el = await page.$(selector);
  if (!el) { log("lipsă", selector, "pe", cale); return; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await el.screenshot({ path: `${DIR}/${nume}.png` }).catch((e) => log("captura", nume, "a eșuat:", e.message.split("\n")[0]));
  log("captură:", nume);
}
await captura("/", "header", "s320-antet");
await captura("/", "main > section:first-of-type", "s320-erou");
await captura("/doneaza", "form", "s320-formular-donatie");
await captura("/doneaza", "#transfer", "s320-transfer");
await captura("/directioneaza-20", "form[aria-labelledby]", "s320-calculator");
await page.goto(BAZA + "/directioneaza-20", { waitUntil: "networkidle" });
await page.fill('input[name="cifra-de-afaceri"]', "123456789012");
await page.fill('input[name="impozit-pe-profit"]', "98765432");
await page.waitForTimeout(200);
const rez = await page.$('[aria-live="polite"]');
await rez.scrollIntoViewIfNeeded();
await rez.screenshot({ path: `${DIR}/s320-calculator-rezultat.png` });
log("captură: s320-calculator-rezultat");
await captura("/devino-voluntar", "form#formular", "s320-formular-voluntar");
await captura("/contact", "form", "s320-formular-contact");
await captura("/", "footer", "s320-subsol");
await captura("/proiecte", '[role="tablist"]', "s320-filtre");
await captura("/raport-de-activitate-2025", "p:has-text('Rezultat financiar')", "s320-rezultat-financiar");
await captura("/redirectioneaza-3-5", "#documente", "s390-documente", 390);
await captura("/", "main > section:first-of-type", "s1280-erou", 1280);
await captura("/doneaza", "main > section:first-of-type", "s1280-doneaza-sus", 1280);
await b.close();
