// Audit „browser”: panoul — sesiune expirată în tab deschis, apăsări duble pe
// trimiteri de e-mail, PWA (sw/manifest/instalare/notificări), poze mari pe
// șabloane, fără JavaScript, caseta de întrebări pe iPhone.
import { chromium } from "playwright";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4411";
const MOCK = "http://127.0.0.1:4412";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const T = Date.now();
const S = new Set((process.env.SECT ?? "1,2,3,4,5,6,7").split(",").map(Number));
const log = (...a) => console.log(...a);
const ip = () => `203.0.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const emailuri = async () => (await (await fetch(MOCK + "/__jurnal")).json()).filter((x) => x.cale.startsWith("/emails"));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const IPHONE = { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" };
async function ctx(extra = {}) {
  const c = await b.newContext({ locale: "ro-RO", viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": ip() }, ...extra });
  await c.addInitScript(() => { try { localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })); } catch {} });
  return c;
}
async function intra(p, email = "", parola = PAROLA) {
  await p.goto(BAZA + "/admin"); if (email) await p.fill("#email", email); await p.fill("#parola", parola); await p.click('button:has-text("Intră")'); await p.waitForLoadState("load");
}

// ── 1. Sesiune expirată în tab deschis: /admin/texte și /admin/scrie/nou ─
if (S.has(1)) {
  const c = await ctx(); const p = await c.newPage(); await intra(p);
  await p.goto(BAZA + "/admin/texte"); await p.waitForTimeout(500);
  const ta = p.locator('textarea[name="continut"]').first();
  const marcaj = `Text scris ore întregi ${T}`;
  await ta.fill(marcaj);
  await c.clearCookies();
  const form = ta.locator("xpath=ancestor::form[1]");
  await form.locator('button[type="submit"]').first().click();
  await p.waitForLoadState("load"); await p.waitForTimeout(500);
  log(`[sesiune] /admin/texte, Salvează după expirare → url ${p.url().replace(BAZA, "")} · pagina arată: „${(await p.evaluate(() => document.body.innerText.trim().slice(0, 120))).replace(/\n/g, " ")}”`);
  await p.goBack(); await p.waitForLoadState("load"); await p.waitForTimeout(800);
  const dupa = await p.locator('textarea[name="continut"]').first().inputValue().catch(() => "(fără câmp)");
  log(`[sesiune] Back → câmpul: ${dupa === marcaj ? "textul e tot acolo" : `PIERDUT („${dupa.slice(0, 40)}”)`} · url ${p.url().replace(BAZA, "")}`);
  // scrie/nou
  await intra(p);
  await p.goto(BAZA + "/admin/scrie/nou?fel=noutate"); await p.waitForTimeout(500);
  await p.fill('input[name="titlu"]', `Noutate ${T}`); await p.fill('textarea[name="continut"]', `Un articol lung scris o oră ${T}.\n\nAl doilea paragraf.`);
  await c.clearCookies();
  const bs = p.locator('form:has(textarea[name="continut"]) button[type="submit"]').first();
  log(`[sesiune] /admin/scrie/nou: apăs „${(await bs.textContent()).trim()}”`);
  await bs.click(); await p.waitForLoadState("load"); await p.waitForTimeout(500);
  log(`[sesiune] → url ${p.url().replace(BAZA, "")} · pagina: „${(await p.evaluate(() => document.body.innerText.trim().slice(0, 100))).replace(/\n/g, " ")}”`);
  await p.goBack(); await p.waitForLoadState("load"); await p.waitForTimeout(800);
  const t2 = await p.locator('textarea[name="continut"]').inputValue().catch(() => "(fără câmp)");
  log(`[sesiune] Back → textul articolului: ${t2.includes(String(T)) ? "tot acolo" : `PIERDUT („${t2.slice(0, 30)}”)`}`);
  // Asistentul (fetch) cu sesiunea expirată
  await intra(p); await p.goto(BAZA + "/admin/scrie/nou?fel=noutate"); await p.waitForTimeout(400);
  await c.clearCookies();
  await p.fill('textarea[id$="-despre"]', "Tabăra RESPIRO de la Vama, din septembrie, cu douăzeci de copii.");
  await p.click('button:has-text("Scrie ciorna")'); await p.waitForTimeout(1500);
  log(`[sesiune] Asistent după expirare → ${JSON.stringify((await p.locator('[role="alert"]').allTextContents()).map((x) => x.trim().slice(0, 80)))}`);
  await c.close();
}

// ── 2. Apăsare dublă pe „Trimite comunicatul” ────────────────────────────
if (S.has(2)) {
  const c = await ctx(); const p = await c.newPage(); await intra(p);
  await p.goto(BAZA + "/admin/presa"); await p.waitForTimeout(500);
  let cate = await p.locator('input[name="contact"]').count();
  if (cate === 0) {
    await p.fill('input[name="publicatie"]', "Ziarul de probă"); await p.fill('input[name="email"]', `redactie-${T}@example.com`);
    await p.locator('form:has(input[name="publicatie"]) button[type="submit"]').click(); await p.waitForLoadState("load");
    cate = await p.locator('input[name="contact"]').count();
  }
  const inainte = (await emailuri()).length;
  await p.fill('input[name="subiect"]', `Comunicat ${T}`); await p.fill('textarea[name="text"]', "Asociația Teona Ariana anunță o nouă tabără.\n\nDetalii la telefon.");
  await p.check('input[name="confirm"]');
  const bt = p.locator('button[type="submit"]:has-text("Trimite comunicatul")');
  log(`[presă] redacții bifate: ${cate} · buton: „${(await bt.textContent()).trim()}” disabled=${await bt.isDisabled()}`);
  await bt.dblclick(); await p.waitForTimeout(4000);
  const dupa = (await emailuri()).slice(inainte);
  log(`[presă] apăsare dublă → ${dupa.length} e-mailuri plecate pentru ${cate} redacții · subiecte: ${JSON.stringify([...new Set(dupa.map((e) => e.corp.subject))])} · url ${p.url().replace(BAZA, "").slice(0, 60)}`);
  await c.close();
}

// ── 3. Apăsare dublă pe „Trimite apelul” către voluntari ─────────────────
if (S.has(3)) {
  const c = await ctx(); const p = await c.newPage(); await intra(p);
  await p.goto(BAZA + "/contact");
  await p.evaluate(async (T) => { for (const n of ["Ana", "Ion"]) await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json", "x-deschis": "9" }, body: JSON.stringify({ fel: "voluntariat", nume: `${n} Voluntar ${T}`, email: `${n.toLowerCase()}.vol.${T}@example.com`, telefon: "0754000000", contact: "E-mail", nastere: "1990-05-05", experienta: "Nu", disponibilitate: "Ocazional", motiv: "Vreau să ajut copiii.", acord: true }) }); }, T);
  await p.goto(BAZA + "/admin/voluntari"); await p.waitForTimeout(500);
  await p.locator("summary:has-text('Cere ajutor')").click();
  await p.fill('input[name="titlu"]', `Apel ${T}`); await p.fill('input[name="cand"]', "Sâmbătă, 15 noiembrie"); await p.fill('input[name="unde"]', "Casa Teona"); await p.fill('textarea[name="mesaj"]', "Avem nevoie de patru oameni la ateliere.");
  const bifa = p.locator('input[name="pe_email"]'); if (await bifa.count()) await bifa.check();
  const inainte = (await emailuri()).length;
  const bt = p.locator('button[type="submit"]:has-text("Trimite apelul")');
  const nr = await p.locator('input[name="voluntar"]:checked').count();
  await bt.dblclick(); await p.waitForTimeout(4000);
  const dupa = (await emailuri()).slice(inainte);
  log(`[voluntari] ${nr} bifați, apăsare dublă → ${dupa.length} e-mailuri · subiecte: ${JSON.stringify([...new Set(dupa.map((e) => e.corp.subject))])} · apeluri în pagină cu titlul: ${await p.locator(`text=Apel ${T}`).count()}`);
  await c.close();
}

// ── 4. PWA: sw nu păstrează nimic; instalarea pe iPhone; notificările ─────
if (S.has(4)) {
  const c = await ctx(); const p = await c.newPage(); await intra(p);
  await p.goto(BAZA + "/admin"); await p.waitForTimeout(1500);
  const gata = (p) => p.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => "ready s-a rezolvat"), new Promise((r) => setTimeout(() => r("ready NU se rezolvă în 6 s"), 6000))]));
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration("/admin/"); return { scope: r?.scope, activ: !!r?.active }; });
  log(`[pwa] pe /admin: ${await gata(p)}`);
  await p.goto(BAZA + "/admin/cereri"); await p.waitForTimeout(500); log(`[pwa] pe /admin/cereri: ${await gata(p)}`);
  await p.goto(BAZA + "/admin/cereri"); await p.waitForTimeout(800); await p.goto(BAZA + "/admin/formulare"); await p.waitForTimeout(800);
  const cache = await p.evaluate(async () => ({ chei: await caches.keys(), controlat: !!navigator.serviceWorker.controller }));
  log(`[pwa] sw: ${JSON.stringify(reg)} · după 2 pagini: ${JSON.stringify(cache)} · „Instalează aplicația” pe desktop fără prompt: ${await p.locator('button:has-text("Instalează aplicația")').count()}`);
  log(`[pwa] notificări cu parola asociației: „Notificări pe telefon” apare de ${await p.locator("text=Notificări pe telefon").count()} ori`);
  // cont cu nume
  const email = `proba.audit.${T}@example.com`;
  const r = await p.request.post(BAZA + "/api/admin/utilizatori", { form: { fel: "adauga", nume: "Proba Audit", email, rol: "fundraising", parola: "ParolaDeProba-12345" }, maxRedirects: 0, headers: { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https" } });
  log(`[pwa] cont de probă: ${r.status()} ${r.headers().location ?? ""}`);
  await c.close();
  const c2 = await ctx(); const p2 = await c2.newPage(); await intra(p2, email, "ParolaDeProba-12345"); await p2.waitForTimeout(1200);
  log(`[pwa] notificări cu cont cu nume: apare de ${await p2.locator("text=Notificări pe telefon").count()} ori · stare: „${(await p2.locator("text=Notificări pe telefon").locator("xpath=following-sibling::p[1]").textContent().catch(() => "?")).trim().slice(0, 90)}” · buton: ${await p2.locator('button:has-text("Primește notificări aici")').count()} · PushManager: ${await p2.evaluate(() => "PushManager" in window)}`);
  if (await p2.locator('button:has-text("Primește notificări aici")').count()) {
    await c2.grantPermissions(["notifications"], { origin: BAZA });
    await p2.locator('button:has-text("Primește notificări aici")').click();
    for (const s of [3, 8, 15]) { await p2.waitForTimeout(s === 3 ? 3000 : s === 8 ? 5000 : 7000); log(`[pwa] după ${s} s de la apăsare: „${(await p2.locator("text=Notificări pe telefon").locator("xpath=following-sibling::p[1]").textContent()).trim().slice(0, 80)}” · butoane: ${JSON.stringify(await p2.locator("div:has(> p:text('Notificări pe telefon')) button").allTextContents())}`); }
  }
  // oprirea contului de probă
  const lista = await (await p2.request.get(BAZA + "/admin/utilizatori")).text();
  await c2.close();
  const c3 = await ctx(); const p3 = await c3.newPage(); await intra(p3);
  const id = lista.match(new RegExp(`name="id" value="([^"]+)"[^]{0,600}?${email.replace(/\./g, "\\.")}`))?.[1] ?? (await p3.evaluate(async (email) => { const h = await (await fetch("/admin/utilizatori")).text(); const i = h.indexOf(email); const m = h.slice(i).match(/name="id" value="([^"]+)"/); return m?.[1]; }, email));
  if (id) { const o = await p3.request.post(BAZA + "/api/admin/utilizatori", { form: { fel: "opreste", id }, maxRedirects: 0 }); log(`[pwa] cont de probă oprit: ${o.status()}`); } else log("[pwa] n-am găsit id-ul contului de probă ca să-l opresc");
  await c3.close();
  // iPhone: instalarea
  const ci = await ctx(IPHONE); const pi = await ci.newPage();
  await pi.goto(BAZA + "/admin"); await pi.waitForTimeout(800);
  const peIntrare = await pi.locator('button:has-text("Instalează aplicația")').count();
  if (peIntrare) { await pi.locator('button:has-text("Instalează aplicația")').first().click(); await pi.waitForTimeout(300); }
  log(`[pwa] iPhone, pagina de intrare: buton ${peIntrare} · pași Safari: ${await pi.locator("text=Adaugă pe ecranul principal").count()}`);
  await intra(pi); await pi.goto(BAZA + "/admin/cifre"); await pi.waitForTimeout(600);
  const inBara = pi.locator('button:has-text("Instalează aplicația")');
  log(`[pwa] iPhone, în panou: buton în bară ${await inBara.count()} (vizibil: ${await inBara.first().isVisible().catch(() => false)})`);
  if (await inBara.count()) { await pi.evaluate(() => { const m = document.querySelector('button[aria-label*="eniu"], button[aria-expanded]'); m?.click(); }); await pi.waitForTimeout(400); const vis = await inBara.first().isVisible(); if (vis) { await inBara.first().click(); await pi.waitForTimeout(300); } log(`[pwa] iPhone, după deschiderea meniului: vizibil ${vis} · pași: ${await pi.locator("text=Adaugă pe ecranul principal").count()}`); }
  await ci.close();
}

// ── 5. Șabloane: poză de telefon de 12 MB; poză cu File.type gol ─────────
if (S.has(5)) {
  const c = await ctx(); const p = await c.newPage(); await intra(p);
  const mare = await sharp(randomBytes(4000 * 3000 * 3), { raw: { width: 4000, height: 3000, channels: 3 } }).jpeg({ quality: 100 }).toBuffer();
  log(`[șablon] poza de probă: ${(mare.length / 1048576).toFixed(1)} MB`);
  for (const tip of ["image/jpeg", ""]) {
    const cazute = []; p.on("requestfailed", (r) => cazute.push(r.url().slice(0, 100)));
    await p.goto(BAZA + "/admin/sabloane"); await p.waitForTimeout(800);
    await p.setInputFiles("#poza_fisier", { name: "IMG_1234.JPG", mimeType: tip, buffer: mare });
    await p.waitForTimeout(6000);
    const nota = await p.locator("[data-nota-poza]").textContent().catch(() => "(fără notă)");
    const marime = await p.evaluate(() => { const f = document.querySelector("#poza_fisier").files[0]; return f ? `${f.name} ${(f.size / 1048576).toFixed(2)} MB ${f.type}` : "nimic"; });
    const cadru = await p.locator('iframe[title="Previzualizarea e-mailului"]').evaluate((f) => { const d = f.srcdoc || ""; const imgs = [...(f.contentDocument?.querySelectorAll("img") ?? [])].map((i) => i.getAttribute("src")); return { lungime: d.length, areData: d.includes("data:image/"), areBlob: d.includes("blob:"), areLocalhost: /localhost|127\.0\.0\.1/.test(d), imgs: imgs.map((s) => (s || "").slice(0, 60)) }; });
    log(`[șablon] File.type=„${tip}” → ${marime} · notă: „${nota.trim()}” · previzualizare: ${JSON.stringify(cadru)} · căzute: ${cazute.length}`);
    p.removeAllListeners("requestfailed");
  }
  await c.close();
}

// ── 6. Fără JavaScript ───────────────────────────────────────────────────
if (S.has(6)) {
  const c = await b.newContext({ javaScriptEnabled: false, extraHTTPHeaders: { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": ip() } }); const p = await c.newPage();
  await p.goto(BAZA + "/doneaza-ti-ziua");
  await p.fill("#an-titlu", "Ziua mea"); await p.fill("#an-nume", "Ana"); await p.fill("#an-mesaj", "Vreau să strâng bani pentru o tabără de vară."); await p.fill("#an-email", "ana.farajs@example.com"); await p.check('input[name="acord"]');
  await p.click('button:has-text("Trimite campania")'); await p.waitForLoadState("load");
  log(`[fără JS] aniversare trimisă → url ${p.url().replace(BAZA, "")} · pagina: „${(await p.evaluate(() => document.body.innerText.trim().slice(0, 80))).replace(/\n/g, " ")}”`);
  await p.goto(BAZA + "/contact"); const fc = await p.locator('form:has(textarea[name="mesaj"])').evaluate((f) => ({ action: f.getAttribute("action"), method: f.getAttribute("method") }));
  log(`[fără JS] formularul de contact: ${JSON.stringify(fc)} (fără action → Enter/clic reîncarcă pagina cu datele în adresă?)`);
  await p.fill('input[name="nume"]', "Ana"); await p.fill('input[name="email"]', "a@b.ro"); await p.fill('textarea[name="mesaj"]', "Salut, am o întrebare."); await p.check('input[name="acord"]'); await p.locator('form:has(textarea[name="mesaj"]) button[type="submit"]').click(); await p.waitForTimeout(1000);
  log(`[fără JS] contact → url ${p.url().replace(BAZA, "").slice(0, 120)}`);
  await p.goto(BAZA + "/admin"); await p.fill("#parola", PAROLA); await p.click('button:has-text("Intră")'); await p.waitForLoadState("load");
  log(`[fără JS] intrare în panou → ${p.url().replace(BAZA, "")} · titlu: „${(await p.locator("h1").first().textContent()).trim()}”`);
  await p.goto(BAZA + "/admin/presa"); log(`[fără JS] /admin/presa: butonul de trimis: ${await p.locator('button:has-text("Trimite comunicatul")').count()} · /admin/voluntari: ${await (await p.goto(BAZA + "/admin/voluntari"), p.locator('button:has-text("Trimite apelul")').count())}`);
  await c.close();
}

// ── 7. iPhone: caseta de întrebări deschisă ──────────────────────────────
if (S.has(7)) {
  const c = await ctx(IPHONE); const p = await c.newPage();
  await p.goto(BAZA + "/despre-noi"); await p.waitForTimeout(1200);
  const are = await p.locator('button:has-text("Întreabă-ne")').count();
  if (!are) log("[iphone] caseta „Întreabă-ne” lipsește (fără ANTHROPIC_API_KEY la build?)");
  else {
    await p.locator('button:has-text("Întreabă-ne")').click(); await p.waitForTimeout(600);
    const r = await p.evaluate(() => { const i = document.querySelector("#intrebarea-mea"); const ci = i.getBoundingClientRect(); const cas = i.closest("form").parentElement.getBoundingClientRect(); const el = document.elementFromPoint(ci.x + 10, ci.y + ci.height / 2); const d = [...document.querySelectorAll('a[href="/doneaza"]')].find((a) => getComputedStyle(a.parentElement).position === "fixed"); const rd = d?.getBoundingClientRect(); return { caseta: [Math.round(cas.y), Math.round(cas.bottom)], camp: [Math.round(ci.y), Math.round(ci.bottom)], campLiber: el === i, doneaza: rd ? [Math.round(rd.x), Math.round(rd.y), Math.round(rd.right), Math.round(rd.bottom)] : null, vh: innerHeight, suprapune: rd ? !(rd.bottom < cas.y || rd.y > cas.bottom || rd.right < cas.x || rd.x > cas.right) : false }; });
    log(`[iphone] caseta deschisă: ${JSON.stringify(r)}`);
    await p.fill("#intrebarea-mea", "Cum donez lunar?"); await p.click('form:has(#intrebarea-mea) button[type="submit"]'); await p.waitForTimeout(2500);
    log(`[iphone] răspuns: „${(await p.locator('[role="log"] li').last().textContent()).trim().slice(0, 60)}”`);
    await p.screenshot({ path: "/tmp/claude-0/-home-user-teona/c2a62746-a2a4-5b65-85f6-659c402ace1b/scratchpad/iphone-intreaba.png" });
  }
  await c.close();
}
await b.close();
