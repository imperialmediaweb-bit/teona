import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);

async function acordSalvat(page) {
  return page.evaluate(() => localStorage.getItem("teona:acord-cookieuri"));
}
async function banner(page) {
  const d = page.locator('[role="dialog"][aria-labelledby="cookieuri-titlu"]');
  if ((await d.count()) === 0) return "absent";
  const butoane = await d.locator("button").allInnerTexts();
  const bife = await d.locator('input[type="checkbox"]').evaluateAll((els) => els.map((e) => `${e.id}=${e.checked}`));
  return { butoane, bife };
}

log("=== Bannerul de cookie-uri ===");
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const erori = urmaresteErori(page);
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  log("La prima vizită:", JSON.stringify(await banner(page)));
  log("Textul bannerului:", (await page.locator('[role="dialog"] p').first().innerText()).replace(/\s+/g, " "));
  log("Link politică:", await page.locator('[role="dialog"] a').getAttribute("href"));
  // Setări
  await page.click('[role="dialog"] button:has-text("Setări")');
  log("După Setări:", JSON.stringify(await banner(page)));
  await page.check("#cookie-statistici");
  await page.click('[role="dialog"] button:has-text("Salvează alegerea")');
  await page.waitForTimeout(200);
  log("După Salvează (statistici bifat):", JSON.stringify(await banner(page)), " salvat=", await acordSalvat(page));
  await page.reload({ waitUntil: "networkidle" });
  log("După reîncărcare:", JSON.stringify(await banner(page)));
  // Redeschidere din subsol
  await page.click('footer button:has-text("Setări cookie-uri")');
  await page.waitForTimeout(200);
  log("Redeschis din subsol:", JSON.stringify(await banner(page)));
  await page.click('[role="dialog"] button:has-text("Refuz")');
  await page.waitForTimeout(200);
  log("După Refuz:", JSON.stringify(await banner(page)), " salvat=", await acordSalvat(page));
  await page.reload({ waitUntil: "networkidle" });
  log("După reîncărcare (refuz):", JSON.stringify(await banner(page)));
  await page.click('footer button:has-text("Setări cookie-uri")');
  await page.click('[role="dialog"] button:has-text("Acceptă toate")');
  await page.waitForTimeout(200);
  log("După Acceptă toate:", await acordSalvat(page));
  // Navigare între pagini: bannerul nu reapare
  await page.click('header nav a[href="/contact"]');
  await page.waitForURL("**/contact");
  await page.waitForTimeout(300);
  log("Pe /contact după acord:", JSON.stringify(await banner(page)));
  // Escape pe banner?
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  log("Banner după Escape (fără alegere):", JSON.stringify(await banner(page)));
  // Focus: unde e focusul la prima vizită? Bannerul e în ordinea de tabulare?
  const ordine = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const a = document.activeElement;
      return `${a.tagName.toLowerCase()} ${(a.innerText || a.getAttribute("aria-label") || "").trim().split("\n")[0].slice(0, 25)}${a.closest("[role=dialog]") ? " [în banner]" : ""}`;
    });
    ordine.push(info);
    if (info.includes("[în banner]")) break;
  }
  log("Taburi până la banner:", ordine.length, "—", ordine.slice(-3).join(" | "));
  // Pe telefon, bannerul vs butonul plutitor
  const ctxM = await b.newContext({ viewport: { width: 320, height: 568 } });
  const pm = await ctxM.newPage();
  await pm.goto(BAZA + "/", { waitUntil: "networkidle" });
  const geo = await pm.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const r = d.getBoundingClientRect();
    const butoane = [...d.querySelectorAll("button")].map((b) => { const q = b.getBoundingClientRect(); return `${b.innerText}: y=${Math.round(q.top)}-${Math.round(q.bottom)}`; });
    return { bannerTop: Math.round(r.top), bannerBottom: Math.round(r.bottom), inaltimeEcran: innerHeight, butoane, plutitor: !!document.querySelector('div.fixed a[href="/doneaza"]') };
  });
  log("Banner pe 320×568:", JSON.stringify(geo));
  await pm.screenshot({ path: "/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/banner-320.png" });
  await ctxM.close();
  log("Erori:", JSON.stringify([...new Set(erori)]));
  await ctx.close();
}

log("\n=== Formularul 230 încorporat ===");
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const erori = urmaresteErori(page);
  const cereriExterne = [];
  page.on("request", (r) => { if (r.url().includes("formular230")) cereriExterne.push(r.url()); });
  await page.goto(BAZA + "/redirectioneaza-3-5", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const zona = async () => {
    const t = await page.locator('section[aria-labelledby^="formular230"]').allInnerTexts();
    return t.map((x) => x.replace(/\s+/g, " ").slice(0, 120));
  };
  log("Fără acord — secțiuni:", JSON.stringify(await zona()), "\n  cereri spre formular230.ro:", cereriExterne.length, " script în pagină:", await page.locator('script[src*="formular230"]').count());
  // Acceptă din banner „Refuz” → tot fără formular
  await page.click('[role="dialog"] button:has-text("Refuz")');
  await page.waitForTimeout(500);
  log("După Refuz în banner:", JSON.stringify(await zona()), " cereri:", cereriExterne.length);
  // Apasă butonul propriu
  await page.click('button:has-text("Accept și încarcă formularul")');
  await page.waitForTimeout(3000);
  log("După „Accept și încarcă”:", JSON.stringify(await zona()), "\n  cereri:", JSON.stringify(cereriExterne), " script:", await page.locator('script[src*="formular230"]').count(), " iframe:", await page.locator(".f230ro-formular iframe").count());
  log("  localStorage acord-formular230:", await page.evaluate(() => localStorage.getItem("teona:acord-formular230")));
  await page.waitForTimeout(13000);
  log("După 16 s:", JSON.stringify(await zona()), " iframe:", await page.locator(".f230ro-formular iframe").count());
  // Refuz ulterior din subsol anulează
  await page.click('footer button:has-text("Setări cookie-uri")');
  await page.waitForTimeout(100);
  await page.click('[role="dialog"] button:has-text("Refuz")');
  await page.waitForTimeout(500);
  log("După refuz ulterior:", JSON.stringify(await zona()));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  log("După reîncărcare (refuz ulterior):", JSON.stringify(await zona()));
  // Acceptă toate -> se încarcă
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[role="dialog"] button:has-text("Acceptă toate")');
  await page.waitForTimeout(2000);
  log("După Acceptă toate:", JSON.stringify(await zona()), " script:", await page.locator('script[src*="formular230"]').count());
  // Setări: doar statistici → nu e suficient
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[role="dialog"] button:has-text("Setări")');
  await page.check("#cookie-marketing");
  await page.click('[role="dialog"] button:has-text("Salvează alegerea")');
  await page.waitForTimeout(800);
  log("Doar marketing bifat:", JSON.stringify(await zona()));
  // Fără localStorage (privat / blocat)
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocat"); } }); });
  await page.click('button:has-text("Accept și încarcă formularul")').catch((e) => log("  clic a eșuat:", e.message.split("\n")[0]));
  await page.waitForTimeout(1500);
  log("Cu localStorage blocat, după Accept:", JSON.stringify(await zona()));
  log("Erori (filtrate):", JSON.stringify([...new Set(erori)].filter((e) => !e.includes("formular230"))));
  log("Erori legate de formular230:", JSON.stringify([...new Set(erori)].filter((e) => e.includes("formular230"))));
  await ctx.close();
}

log("\n=== Butoanele Copiază ===");
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  await page.goto(BAZA + "/doneaza", { waitUntil: "networkidle" });
  await page.click('[role="dialog"] button:has-text("Refuz")');
  const butoane = page.locator('#transfer button:has-text("Copiază")');
  log("Butoane Copiază în #transfer:", await butoane.count());
  for (let i = 0; i < (await butoane.count()); i++) {
    const btn = butoane.nth(i);
    const afisat = await btn.evaluate((b) => b.closest("div.flex").querySelector("span.select-all").innerText);
    await btn.click();
    await page.waitForTimeout(100);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const eticheta = (await btn.innerText()).trim();
    const anunt = await btn.evaluate((b) => b.parentElement.querySelector('[role="status"]').innerText);
    log(`  afișat="${afisat}" copiat="${clip}" buton="${eticheta}" anunț="${anunt}"`);
  }
  await page.waitForTimeout(2700);
  log("  După 2,5 s butonul revine la:", (await butoane.first().innerText()).trim());
  // Pe 3,5%: denumire, CIF, IBAN
  await page.goto(BAZA + "/redirectioneaza-3-5", { waitUntil: "networkidle" });
  const toate = page.locator('button:has-text("Copiază")');
  const n = await toate.count();
  log("Butoane Copiază pe /redirectioneaza-3-5:", n);
  for (let i = 0; i < n; i++) {
    await toate.nth(i).click();
    await page.waitForTimeout(80);
    log("  copiat:", JSON.stringify(await page.evaluate(() => navigator.clipboard.readText())));
  }
  await page.goto(BAZA + "/directioneaza-20", { waitUntil: "networkidle" });
  const t2 = page.locator('button:has-text("Copiază")');
  log("Butoane Copiază pe /directioneaza-20:", await t2.count());
  for (let i = 0; i < (await t2.count()); i++) {
    await t2.nth(i).click();
    await page.waitForTimeout(80);
    log("  copiat:", JSON.stringify(await page.evaluate(() => navigator.clipboard.readText())));
  }
  await ctx.close();

  // Browserul refuză
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { get: () => ({ writeText: () => Promise.reject(new DOMException("Write permission denied.", "NotAllowedError")) }) });
  });
  await p2.goto(BAZA + "/doneaza", { waitUntil: "networkidle" });
  const btn = p2.locator('#transfer button:has-text("Copiază")').first();
  await btn.click();
  await p2.waitForTimeout(200);
  const dupa = await btn.evaluate((b) => b.parentElement.innerText.replace(/\s+/g, " "));
  log("Clipboard refuzat → zona butonului:", JSON.stringify(dupa));
  log("  mesajul de eroare are role/aria-live?", await btn.evaluate((b) => { const p = b.parentElement.querySelector("p"); return p ? `${p.getAttribute("role")}/${p.getAttribute("aria-live")}` : "fără p"; }));
  // Fără clipboard deloc
  const ctx3 = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p3 = await ctx3.newPage();
  await p3.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { get: () => undefined }); });
  const erori3 = urmaresteErori(p3);
  await p3.goto(BAZA + "/doneaza", { waitUntil: "networkidle" });
  await p3.locator('#transfer button:has-text("Copiază")').first().click();
  await p3.waitForTimeout(200);
  log("navigator.clipboard lipsă →", JSON.stringify(await p3.locator('#transfer button:has-text("Copiază")').first().evaluate((b) => b.parentElement.innerText.replace(/\s+/g, " "))), " erori:", JSON.stringify(erori3.filter((e) => e.includes("pageerror"))));
  await ctx2.close(); await ctx3.close();
}
await b.close();
