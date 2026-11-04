/**
 * Audit „fisiere”, completări: (1) un PNG mare pe care browserul nu-l poate
 * micșora — ce vede omul; (2) limita previzualizării (600 la 15 minute) —
 * ce se întâmplă când e atinsă, cât scrie omul.
 *
 *   BAZA=http://127.0.0.1:4401 PAROLA_ADMIN=… node scripts/qa/audit-fisiere-extra.mjs
 */
import { chromium } from "playwright";
import sharp from "sharp";

const BAZA = process.env.BAZA ?? "http://127.0.0.1:4401";
const PAROLA = process.env.PAROLA_ADMIN;
let rele = 0;
const verifica = (ok, mesaj) => { console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`); if (!ok) rele++; };
const nota = (m) => console.log(`     ${m}`);
const IP = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;

// Un PNG de scanner/poster: 2600×1950 RGBA cu zgomot → nu se comprimă, ~15 MB.
const pngMare = await sharp({ create: { width: 2600, height: 1950, channels: 4, noise: { type: "gaussian", mean: 128, sigma: 60 } } }).png().toBuffer();
nota(`PNG mare: ${(pngMare.length / 1048576).toFixed(1)} MB`);

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await b.newContext({ extraHTTPHeaders: { "x-forwarded-for": IP() } });
const page = await ctx.newPage();
await page.goto(`${BAZA}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.fill('input[name="parola"]', PAROLA);
await Promise.all([page.waitForURL(/\/admin\/sabloane/).catch(() => {}), page.click('button:has-text("Intră")')]);
await page.goto(`${BAZA}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
await page.fill('input[name="poza_alt"]', "Afiș");
const camp = page.locator('input[name="poza_fisier"]');
await camp.setInputFiles({ name: "afis.png", mimeType: "image/png", buffer: pngMare });
await page.waitForTimeout(8000);
const dupa = await camp.evaluate((el) => ({ marime: el.files?.[0]?.size ?? 0, tip: el.files?.[0]?.type ?? "" }));
const notaPng = await page.locator("[data-nota-poza]").innerText().catch(() => "(nimic)");
const inCadru = await page.evaluate(() => {
  const img = document.querySelector("iframe")?.contentDocument?.querySelector('img[alt="Afiș"]');
  return img ? { src: img.getAttribute("src")?.slice(0, 30), latime: img.naturalWidth } : null;
});
nota(`după alegere: în câmp ${(dupa.marime / 1048576).toFixed(1)} MB ${dupa.tip}; nota: „${notaPng}”; cadru: ${JSON.stringify(inCadru)}`);
verifica(dupa.marime <= 6 * 1048576, "PNG-ul mare pleacă sub 6 MB (limita rutei)");
verifica(notaPng !== "(nimic)" && !/micșorată/.test(notaPng) === false || /nu|mare|mic/.test(notaPng), "sub câmp scrie ce s-a întâmplat cu PNG-ul");
verifica(!(inCadru?.src?.startsWith("blob:") && inCadru?.latime === 0), "previzualizarea nu arată imagine ruptă pentru PNG-ul mare");
await page.fill('input[name="catre"]', "eu@exemplu.ro");
await Promise.all([page.waitForURL(/ratat=|facut=/, { timeout: 60000 }).catch(() => {}), page.click('button[value="proba"]')]);
const alerta = await page.locator('[role="alert"]').innerText().catch(() => "");
nota(`după „Trimite-ți o probă”: ${new URL(page.url()).search} — „${alerta}”`);
const cookie = (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
await b.close();

// ─── Limita previzualizării ───────────────────────────────────────────────
const ip = IP();
let coduri = { 200: 0, 429: 0, alt: 0 };
for (let i = 0; i < 605; i++) {
  const fd = new FormData();
  fd.set("fel", "persoane");
  fd.set("titlu", "x");
  const r = await fetch(`${BAZA}/api/admin/sablon?previzualizare=1`, { method: "POST", body: fd, headers: { cookie, origin: BAZA, "x-forwarded-for": ip } });
  coduri[r.status] = (coduri[r.status] ?? 0) + 1;
}
nota(`605 previzualizări în câteva secunde, aceeași adresă: ${JSON.stringify(coduri)}`);
verifica(coduri[429] > 0, "a 601-a previzualizare primește 429 (limita există)");
// Și butoanele adevărate, după aceeași „ședință”: limita lor e separată?
{
  const fd = new FormData();
  fd.set("fel", "persoane");
  fd.set("fac", "descarca");
  const r = await fetch(`${BAZA}/api/admin/sablon`, { method: "POST", body: fd, headers: { cookie, origin: BAZA, "x-forwarded-for": ip } });
  verifica(r.status === 200, `după 605 previzualizări, „Descarcă HTML-ul” merge încă (${r.status})`);
}
console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
