import { browser, BAZA, urmaresteErori } from "./comun.mjs";

/**
 * Blocul PayPal de pe /doneaza.
 *
 * Apare numai cu `PAYPAL_CLIENT_ID` și `PAYPAL_CLIENT_SECRET` în mediu, deci
 * scriptul se rulează așa:
 *
 *   PAYPAL_CLIENT_ID=test PAYPAL_CLIENT_SECRET=test npm run dev
 *   node scripts/qa/paypal.mjs
 *
 * Fără ele, constată că blocul lipsește și se oprește — asta e comportamentul
 * corect, nu o picătură.
 *
 * Ce verifică: suma scrisă în română (virgulă la zecimale, punct la mii),
 * pragurile, și că butonul nu promite o sumă pe care serverul ar refuza-o.
 */

const b = await browser();
const log = (...a) => console.log(...a);
let rele = 0;

function verifica(eticheta, conditie, detaliu = "") {
  log(`${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`);
  if (!conditie) rele++;
}

for (const latime of [1280, 390]) {
  log(`\n=== ${latime}px ===`);
  const page = await b.newPage({ viewport: { width: latime, height: 1000 } });
  const erori = urmaresteErori(page);
  await page.goto(BAZA + "/doneaza", { waitUntil: "networkidle" });
  await page.click('button:has-text("Acceptă toate")').catch(() => {});

  if ((await page.locator("#paypal").count()) === 0) {
    log("  blocul PayPal nu apare — lipsesc cheile din mediu. Corect.");
    await page.close();
    continue;
  }

  await page.locator("#paypal").scrollIntoViewIfNeeded();
  const buton = page.locator("#paypal button[type=button]");
  const alta = page.locator("#paypal input[type=text]");
  const text = async () => (await buton.innerText()).replace(/\s+/g, " ").trim();

  verifica("scrie clar că e în euro", /euro/i.test(await page.locator("#paypal").innerText()));
  verifica("suma implicită e pe buton", /^Donează 10 € prin PayPal$/.test(await text()), await text());

  // Butoanele radio sunt `sr-only`: utilizatorul apasă eticheta, nu intrarea.
  await page.locator('#paypal label:has-text("25 €")').click();
  verifica("alegerea unei sume se vede pe buton", (await text()) === "Donează 25 € prin PayPal", await text());

  for (const [scris, asteptat] of [
    ["12,50", "Donează 12,50 € prin PayPal"],
    ["12.50", "Donează 12,50 € prin PayPal"],
    ["7", "Donează 7 € prin PayPal"],
    ["1234", "Donează 1.234 € prin PayPal"],
  ]) {
    await alta.fill(scris);
    await page.waitForTimeout(120);
    verifica(`„${scris}" → ${asteptat}`, (await text()) === asteptat, await text());
  }

  for (const prea of ["1", "0", "20000", "abc"]) {
    await alta.fill(prea);
    await page.waitForTimeout(100);
    const promite = /\d/.test(await text());
    verifica(`„${prea}" nu promite o sumă`, !promite, await text());
    await buton.click();
    await page.waitForTimeout(200);
    const alerta = await page.locator("#paypal [role=alert]").allInnerTexts();
    verifica(`„${prea}" dă un mesaj`, alerta.length === 1, JSON.stringify(alerta));
  }

  const lat = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  verifica("fără derulare laterală", !lat);
  log("  erori consolă:", JSON.stringify(erori));
  await page.close();
}

log(`\nverificări picate: ${rele}`);
await b.close();
process.exit(rele === 0 ? 0 : 1);
