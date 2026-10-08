import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const erori = urmaresteErori(page);

async function deschide() {
  await page.goto(BAZA + "/devino-voluntar", { waitUntil: "networkidle" });
}
const form = () => page.locator("form#formular");
async function stare(eticheta) {
  const pas = await form().locator('[aria-current="step"]').innerText().catch(() => "?");
  const titlu = await form().locator("h3:visible").first().innerText().catch(() => "?");
  const mesaje = await form().locator("p.text-caramiziu-700:visible").allInnerTexts();
  const alert = await form().locator('[role="alert"]').allInnerTexts();
  const activ = await page.evaluate(() => {
    const a = document.activeElement;
    return a ? `${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""} "${(a.innerText || a.value || "").slice(0, 30)}"` : null;
  });
  log(`\n[${eticheta}] pas="${pas.replace(/\s+/g, " ")}" titlu="${titlu}" erori=${JSON.stringify(mesaje)} alert=${JSON.stringify(alert)} focus=${activ}`);
}

const azi = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const cu18 = new Date(azi.getFullYear() - 18, azi.getMonth(), azi.getDate());
const ieri18 = new Date(cu18); ieri18.setDate(ieri18.getDate() - 1); // ziua de naștere a fost ieri -> 18 ani și o zi
const maine18 = new Date(cu18); maine18.setDate(maine18.getDate() + 1); // împlinește 18 mâine -> 17

log("Azi (browser):", await page.evaluate(() => new Date().toString()));
log("Date de test: exact 18 =", iso(cu18), " 18+1 zi =", iso(ieri18), " 17 ani 364 zile =", iso(maine18));

// A. Sar peste pasul 1 (Continuă fără nimic)
await deschide();
await page.click('button:has-text("Continuă")');
await stare("Continuă cu pasul 1 gol");

// B. Enter în câmpul nume la pasul 1 (gol)
await deschide();
await page.fill('input[name="nume"]', "");
await page.press('input[name="nume"]', "Enter");
await page.waitForTimeout(300);
await stare("Enter la pasul 1, câmpuri goale");

// C. Enter la pasul 1 cu date valide
await deschide();
await page.fill('input[name="nume"]', "Ion Popescu");
await page.fill('input[name="email"]', "ion@example.com");
await page.fill('input[name="nastere"]', "1990-05-05");
await page.press('input[name="nume"]', "Enter");
await page.waitForTimeout(400);
await stare("Enter la pasul 1 cu date valide (unde ajung?)");

// D. Datele de naștere
for (const [d, nume] of [[iso(cu18), "exact 18 ani azi"], [iso(ieri18), "18 ani + 1 zi"], [iso(maine18), "cu o zi înainte de 18"], ["2030-01-01", "în viitor"], ["0001-01-01", "anul 1"], ["1900-02-30", "dată invalidă"], ["", "goală"]]) {
  await deschide();
  await page.fill('input[name="nume"]', "Ion Popescu");
  await page.fill('input[name="email"]', "ion@example.com");
  if (d) await page.fill('input[name="nastere"]', d).catch((e) => log("  (fill a eșuat:", e.message.split("\n")[0], ")"));
  await page.click('button:has-text("Continuă")');
  await page.waitForTimeout(300);
  await stare(`naștere = ${d || "(gol)"} — ${nume}`);
}

// E. Înapoi și schimb ceva; valorile se păstrează?
await deschide();
await page.fill('input[name="nume"]', "Ion Popescu");
await page.fill('input[name="email"]', "ion@example.com");
await page.fill('input[name="telefon"]', "0700000000");
await page.fill('input[name="nastere"]', "1990-05-05");
await page.fill('input[name="localitate"]', "Suceava");
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
await page.click('label:has-text("Zilnic")');
await page.fill('input[name="limbi"]', "engleză");
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
await page.fill('textarea[name="motiv"]', "Vreau să ajut.");
await page.click('button:has-text("Înapoi")');
await page.waitForTimeout(200);
await page.click('button:has-text("Înapoi")');
await page.waitForTimeout(200);
log("\nDupă două Înapoi: nume=", await page.inputValue('input[name="nume"]'), " telefon=", await page.inputValue('input[name="telefon"]'), " localitate=", await page.inputValue('input[name="localitate"]'));
await page.fill('input[name="nastere"]', iso(maine18)); // devin minor
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
await stare("schimb data la minor și Continuă");
await page.fill('input[name="nastere"]', "1990-05-05");
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
log("Pas 2 păstrat: Zilnic=", await page.isChecked('input[name="disponibilitate"][value="Zilnic"]'), " limbi=", await page.inputValue('input[name="limbi"]'));
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
log("Pas 3 păstrat: motiv=", await page.inputValue('textarea[name="motiv"]'));

// F. Trimit fără acord
await page.click('button[type="submit"]:has-text("Trimite")');
await page.waitForTimeout(300);
await stare("Trimite fără acord");

// G. Trimit cu acord; de două ori rapid
await page.check('input[name="acord"]');
const cereri = [];
page.on("request", (r) => { if (r.url().includes("/api/contact")) cereri.push(r.method()); });
const btn = form().locator('button[type="submit"]');
await btn.click();
await btn.click({ force: true }).catch(() => {});
await page.waitForTimeout(1500);
log("\nCereri POST /api/contact după două clicuri rapide:", cereri.length);
await stare("după Trimite cu acord");
const text = await page.locator("#formular").innerText();
log("Text zona formular:", text.replace(/\s+/g, " ").slice(0, 400));

// H. Modific datele la pasul 1 după ce am ajuns la pasul 3 și trimit cu email invalid: unde ajunge eroarea?
await deschide();
await page.fill('input[name="nume"]', "Ion Popescu");
await page.fill('input[name="email"]', "ion@example.com");
await page.fill('input[name="nastere"]', "1990-05-05");
await page.click('button:has-text("Continuă")');
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
await page.click('button:has-text("Înapoi")');
await page.click('button:has-text("Înapoi")');
await page.fill('input[name="email"]', "gresit");
// mă duc din nou la pasul 3 direct? nu se poate; doar prin Continuă (care validează). Deci testez: Continuă blochează?
await page.click('button:has-text("Continuă")');
await page.waitForTimeout(200);
await stare("email stricat la întoarcere, Continuă");

// I. Fără JavaScript: ce se vede
const ctx2 = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
const p2 = await ctx2.newPage();
await p2.goto(BAZA + "/devino-voluntar");
const vizibil = await p2.evaluate(() => {
  const f = document.querySelector("form#formular");
  if (!f) return "fără formular";
  const pasi = [...f.querySelectorAll("div[hidden]")].length;
  const butoane = [...f.querySelectorAll("button")].map((b) => b.innerText.trim());
  return { pasiAscunsi: pasi, butoane, actiune: f.getAttribute("action"), metoda: f.getAttribute("method") };
});
log("\nFără JS, formular voluntar:", JSON.stringify(vizibil));

log("\nErori consolă/rețea:", JSON.stringify([...new Set(erori)]));
await b.close();
