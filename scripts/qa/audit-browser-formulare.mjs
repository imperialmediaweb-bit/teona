// Audit „browser”: formularele publice, în browser, cu antete ca pe Railway.
import { chromium } from "playwright";
import sharp from "sharp";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4411";
const MOCK = "http://127.0.0.1:4412";
const ip = () => `203.0.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const IPHONE = { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" };
async function ctx(extra = {}) {
  const c = await b.newContext({ locale: "ro-RO", extraHTTPHeaders: { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": ip() }, ...extra });
  await c.addInitScript(() => { try { localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })); } catch {} });
  return c;
}
const log = (...a) => console.log(...a);
const jurnal = async () => (await fetch(MOCK + "/__jurnal")).json();

// ── 1. Donația: sume ciudate ────────────────────────────────────────────
{
  const c = await ctx(); const p = await c.newPage();
  for (const suma of ["0", "-5", "0,5", "1000000", "10,50", "1.000", "abc", "5"]) {
    await p.goto(BAZA + "/doneaza"); await p.waitForSelector('input[name="alta"]');
    await p.waitForTimeout(1200);
    const cereri = [];
    p.on("request", (r) => { if (r.url().includes("/api/donatii/stripe")) cereri.push(r.postData()); });
    await p.fill('input[name="alta"]', suma);
    await p.fill('input[name="email"]', "ana@example.com");
    await p.check('input[name="acord"]');
    const buton = p.locator('button[type="submit"]').filter({ hasText: /Donează/ }).first();
    const eticheta = await buton.textContent();
    await buton.click();
    await p.waitForTimeout(1500);
    const eroare = await p.locator('[role="alert"], p:has-text("Suma"), p:has-text("sumă")').allTextContents();
    log(`[donație] suma „${suma}” → buton „${eticheta.trim()}” → cereri: ${JSON.stringify(cereri)} · erori: ${JSON.stringify(eroare.filter((x) => /sum|Sum|lei|valid/.test(x)).map((x) => x.trim().slice(0, 100)))} · url: ${p.url().slice(0, 60)}`);
    p.removeAllListeners("request");
  }
  // apăsare dublă
  await p.goto(BAZA + "/doneaza"); await p.waitForSelector('input[name="alta"]'); await p.waitForTimeout(1200);
  let nr = 0; p.on("request", (r) => { if (r.url().includes("/api/donatii/stripe")) nr++; });
  await p.fill('input[name="alta"]', "50"); await p.fill('input[name="email"]', "ana@example.com"); await p.check('input[name="acord"]');
  const bt = p.locator('button[type="submit"]').filter({ hasText: /Donează/ }).first();
  await bt.dblclick();
  await p.waitForTimeout(2500);
  log(`[donație] apăsare dublă → ${nr} cereri · a ajuns la: ${p.url().slice(0, 50)}`);
  // Back după plecarea spre Stripe
  await p.goBack().catch(() => {}); await p.waitForTimeout(1500);
  const stareButon = await p.locator('button[type="submit"]').filter({ hasText: /Donează|Se trimite/ }).first().evaluate((b) => ({ text: b.textContent.trim(), disabled: b.disabled })).catch(() => "lipsă");
  log(`[donație] Back de la Stripe → url ${p.url().slice(0, 50)} · buton: ${JSON.stringify(stareButon)}`);
  await c.close();
}

// ── 2. Voluntar: 15 ani și 364 de zile / exact 16 ────────────────────────
{
  const c = await ctx(); const p = await c.newPage();
  const azi = new Date();
  const cazuri = [["15 ani 364 zile", new Date(azi.getFullYear() - 16, azi.getMonth(), azi.getDate() + 1)], ["exact 16", new Date(azi.getFullYear() - 16, azi.getMonth(), azi.getDate())]];
  for (const [nume, d] of cazuri) {
    await p.goto(BAZA + "/devino-voluntar"); await p.waitForSelector('input[name="nume"]'); await p.waitForTimeout(1200);
    await p.fill('input[name="nume"]', "Ion Popescu"); await p.fill('input[name="email"]', "ion@example.com"); await p.fill('input[name="telefon"]', "0754000000");
    await p.selectOption('select[aria-label="Ziua nașterii"]', String(d.getDate()));
    await p.selectOption('select[aria-label="Luna nașterii"]', String(d.getMonth() + 1));
    await p.selectOption('select[aria-label="Anul nașterii"]', String(d.getFullYear()));
    const ascuns = await p.inputValue('input[name="nastere"]');
    await p.click('button:has-text("Continuă")'); await p.waitForTimeout(500);
    const pas = await p.locator('[aria-current="step"]').textContent();
    const msg = await p.locator('p:has-text("16 ani")').allTextContents();
    log(`[voluntar] ${nume} (${ascuns}) → pasul „${pas.trim().replace(/\s+/g, " ")}” · mesaj: ${JSON.stringify(msg.map((m) => m.trim().slice(0, 80)))}`);
  }
  // pașii ascunși chiar sunt ascunși?
  await p.goto(BAZA + "/devino-voluntar"); await p.waitForSelector('input[name="nume"]');
  const vizibile = await p.evaluate(() => [...document.querySelectorAll("form#formular div[hidden]")].map((d) => getComputedStyle(d).display));
  log(`[voluntar] pașii cu hidden: display = ${JSON.stringify(vizibile)}`);
  await c.close();
}

// ── 3. Newsletter cu spații; contul cu #email= ───────────────────────────
{
  const c = await ctx(); const p = await c.newPage();
  await p.goto(BAZA + "/"); await p.waitForTimeout(1200);
  const nf = p.locator("form").filter({ hasText: "Abonează-mă" });
  await nf.locator('input[name="email"]').fill("  ana.spatii2@example.com  ");
  await nf.locator('input[name="acord"]').check();
  await nf.locator("button[type=submit]").click(); await p.waitForTimeout(1500);
  const txt = await p.locator('[role="status"], [role="alert"]').allTextContents();
  const j = (await jurnal()).filter((x) => x.cale.startsWith("/subscribers") && x.metoda === "POST").map((x) => x.corp.email);
  log(`[newsletter] „  ana.spatii2@…  ” → ${JSON.stringify(txt.map((t) => t.trim().slice(0, 60)))} · la MailerLite: ${JSON.stringify(j.slice(-1))}`);
  await p.goto(BAZA + "/contul-meu#email=ana%40example.com"); await p.waitForTimeout(800);
  log(`[cont] #email= → câmpul: „${await p.inputValue('input[name="email"]')}”`);
  await p.goto(BAZA + "/contul-meu?email=ana%40example.com"); await p.waitForTimeout(800);
  log(`[cont] ?email= → câmpul: „${await p.inputValue('input[name="email"]')}”`);
  await c.close();
}

// ── 4. Contact: apăsare dublă; robot sub 1 s ─────────────────────────────
{
  const c = await ctx(); const p = await c.newPage();
  await p.goto(BAZA + "/contact"); await p.waitForTimeout(1200);
  let nr = 0; p.on("request", (r) => { if (r.url().includes("/api/contact")) nr++; });
  await p.fill('input[name="nume"]', "Ana Pop"); await p.fill('input[name="email"]', "ana.dublu@example.com"); await p.fill('textarea[name="mesaj"]', "Bună ziua, am o întrebare despre tabere."); await p.check('input[name="acord"]');
  await p.locator('form:has(textarea[name="mesaj"]) button[type="submit"]').dblclick(); await p.waitForTimeout(2000);
  log(`[contact] apăsare dublă → ${nr} cereri · stare: ${JSON.stringify((await p.locator('[role="status"]').allTextContents()).map((t) => t.trim().slice(0, 50)))}`);
  // omul care trimite în prima secundă (x-deschis = 0)
  await p.goto(BAZA + "/contact");
  const r = await p.evaluate(async () => {
    const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json", "x-deschis": "0" }, body: JSON.stringify({ fel: "contact", nume: "Ana Pop", email: "ana.robot@example.com", mesaj: "Bună ziua, am o întrebare despre tabere.", acord: true }) });
    return { status: r.status, ok: r.ok, corp: await r.text() };
  });
  log(`[contact] trimis cu x-deschis:0 → ${JSON.stringify(r)} → formularul ar arăta ${r.ok ? "„Mulțumim”" : "eroare"}`);
  await c.close();
}

// ── 5. Aniversare: previzualizarea pozei cu încărcătorul Cloudinary ──────
{
  const c = await ctx(); const p = await c.newPage();
  const jpg = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#2a9fa3" } }).jpeg().toBuffer();
  const cazute = [];
  p.on("requestfailed", (r) => cazute.push(r.url().slice(0, 140)));
  p.on("response", (r) => { if (r.status() >= 400) cazute.push(`${r.status()} ${r.url().slice(0, 140)}`); });
  await p.goto(BAZA + "/doneaza-ti-ziua"); await p.waitForTimeout(1000);
  await p.setInputFiles("#an-poza", { name: "IMG_0042.JPG", mimeType: "image/jpeg", buffer: jpg });
  await p.locator("details summary:has-text('Vezi cum va arăta')").click();
  await p.waitForTimeout(1500);
  const img = await p.locator('details img[alt="Poza aleasă pentru campanie"]').evaluate((i) => ({ src: i.currentSrc || i.src, natural: i.naturalWidth, complete: i.complete })).catch((e) => "lipsă: " + e.message.slice(0, 60));
  log(`[aniversare] previzualizarea pozei: ${JSON.stringify(img)} · cereri căzute: ${JSON.stringify(cazute)}`);
  // poză cu tip gol (Windows)
  await p.goto(BAZA + "/doneaza-ti-ziua"); await p.waitForTimeout(1000);
  await p.setInputFiles("#an-poza", { name: "IMG_0043.JPG", mimeType: "application/octet-stream", buffer: jpg });
  await p.locator("details summary:has-text('Vezi cum va arăta')").click(); await p.waitForTimeout(800);
  log(`[aniversare] poză cu File.type gol → previzualizare: ${await p.locator('details img[alt="Poza aleasă pentru campanie"]').count()} imagini · „Ai ales”: ${await p.locator("text=Ai ales").count()}`);
  await c.close();
}

// ── 6. iPhone: asistentul și „Donează” plutitor ──────────────────────────
{
  const c = await ctx(IPHONE); const p = await c.newPage();
  await p.goto(BAZA + "/casa-teona"); await p.waitForTimeout(1500);
  const cutii = await p.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    return { intreaba: q('button:has(svg) >> nth=-1') ?? [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("Întreabă-ne")).map((b) => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })[0], doneaza: [...document.querySelectorAll('a[href="/doneaza"]')].filter((a) => a.textContent.trim() === "Donează" && getComputedStyle(a.parentElement).position === "fixed").map((a) => { const r = a.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })[0], vw: innerWidth, vh: innerHeight };
  });
  log(`[iphone] butoane plutitoare: ${JSON.stringify(cutii)}`);
  const areIntreaba = await p.locator('button:has-text("Întreabă-ne")').count();
  if (areIntreaba) {
    await p.locator('button:has-text("Întreabă-ne")').click(); await p.waitForTimeout(600);
    const caseta = await p.locator('#intrebarea-mea').evaluate((i) => { const r = i.closest("form").parentElement.getBoundingClientRect(); const c = i.getBoundingClientRect(); return { caseta: { y: Math.round(r.y), jos: Math.round(r.bottom), h: Math.round(r.height) }, camp: { y: Math.round(c.y), jos: Math.round(c.bottom) }, vh: innerHeight }; });
    const peste = await p.evaluate(() => { const i = document.querySelector("#intrebarea-mea"); const r = i.getBoundingClientRect(); const el = document.elementFromPoint(r.x + 10, r.y + r.height / 2); return el === i ? "liber" : `acoperit de <${el?.tagName} ${el?.textContent?.trim().slice(0, 20)}>`; });
    log(`[iphone] caseta deschisă: ${JSON.stringify(caseta)} · câmpul: ${peste}`);
  } else log("[iphone] caseta „Întreabă-ne” nu e pe pagină (ANTHROPIC_API_KEY lipsă?)");
  await c.close();
}
await b.close();
