/**
 * O poză de telefon, de peste 10 MB, pusă pe un șablon de e-mail.
 *
 * Pe 4 noiembrie 2026 fundraiserul a atașat una și a primit „Cerere
 * invalidă”: Next taie corpul cererii la 10 MB când există `proxy.ts`, iar
 * formularul ajungea rupt. Proba verifică amândouă apărările:
 *
 *   1. în browser, poza se micșorează la alegerea fișierului (sub 1,5 MB),
 *      iar sub câmp scrie de la cât la cât;
 *   2. direct la rută, fără browser: 12 MB trec de limita lui Next și primesc
 *      mesajul omenesc al rutei („prea mare”), nu „Cerere invalidă”; 38 MB
 *      primesc mesajul cu limita, înainte de orice citire.
 *
 *   BAZA=http://localhost:3120 PAROLA_ADMIN=… node scripts/qa/poza-mare.mjs
 * Cere un server pornit din build (`npm run start`).
 */
import { chromium } from "playwright";
import sharp from "sharp";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const PAROLA = process.env.PAROLA_ADMIN;
const IP = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}

let rele = 0;
const verifica = (ok, mesaj) => {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
};

// O „poză de telefon”: zgomot pe 5000×3750, JPEG de calitate mare.
async function pozaMare(latime, inaltime) {
  return sharp({
    create: { width: latime, height: inaltime, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 60 } },
  })
    .jpeg({ quality: 97 })
    .toBuffer();
}
const poza12 = await pozaMare(5000, 3750);
verifica(poza12.length > 10 * 1024 * 1024, `poza de probă are peste 10 MB (${(poza12.length / 1048576).toFixed(1)} MB)`);

// ─── 1. În browser: micșorarea la alegerea fișierului ────────────────────
const b = await chromium.launch({
  args: ["--no-sandbox"],
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
});
const ctx = await b.newContext({ extraHTTPHeaders: { "x-forwarded-for": IP() } });
const page = await ctx.newPage();
await page.goto(`${BAZA}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.fill('input[name="parola"]', PAROLA);
await Promise.all([page.waitForNavigation({ waitUntil: "load" }).catch(() => {}), page.click('button:has-text("Intră")')]);
await page.goto(`${BAZA}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
const camp = page.locator('input[type="file"][name="poza_fisier"]');
// Cu tipul pe care îl dă Windows unui fișier cu asociere ciudată: gol/necunoscut.
// Micșorarea trebuie să se uite în conținut, nu în eticheta asta.
await camp.setInputFiles({ name: "IMG_4231.jpg", mimeType: "application/octet-stream", buffer: poza12 });
await page.waitForFunction(() => document.querySelector("[data-nota-poza]")?.textContent?.includes("micșorată"), null, { timeout: 20000 }).catch(() => {});
const dupa = await camp.evaluate((el) => ({ marime: el.files?.[0]?.size ?? 0, tip: el.files?.[0]?.type ?? "", nume: el.files?.[0]?.name ?? "" }));
verifica(dupa.marime > 0 && dupa.marime < 1.5 * 1024 * 1024, `în browser, poza pleacă micșorată (${(dupa.marime / 1024).toFixed(0)} KB, ${dupa.tip})`);
const nota = await page.locator("[data-nota-poza]").innerText().catch(() => "");
verifica(/micșorată de la 1\d,\d MB la [01],\d MB/.test(nota), `sub câmp scrie de la cât la cât („${nota}”)`);
const dimensiuni = await camp.evaluate(async (el) => {
  const bmp = await createImageBitmap(el.files[0]);
  return { w: bmp.width, h: bmp.height };
});
verifica(dimensiuni.w === 2000 && dimensiuni.h === 1500, `latura mare e 2.000 px (${dimensiuni.w}×${dimensiuni.h})`);
// Previzualizarea de lângă formular arată poza micșorată, scrisă în pagină
// (`data:`), nu o adresă `blob:` care se poate rupe — cazul din 4 noiembrie.
await page.fill('input[name="poza_alt"]', "Sala Unirii");
await page
  .waitForFunction(
    () => {
      const img = document.querySelector("iframe")?.contentDocument?.querySelector('img[alt="Sala Unirii"]');
      return Boolean(img && img.complete && img.naturalWidth > 0 && img.getAttribute("src")?.startsWith("data:image/jpeg"));
    },
    null,
    { timeout: 20000 },
  )
  .catch(() => {});
const inCadru = await page.evaluate(() => {
  const img = document.querySelector("iframe")?.contentDocument?.querySelector('img[alt="Sala Unirii"]');
  return { src: img?.getAttribute("src")?.slice(0, 15) ?? "", latime: img?.naturalWidth ?? 0 };
});
verifica(inCadru.src === "data:image/jpeg" && inCadru.latime === 2000, `previzualizarea arată poza micșorată, scrisă în pagină (${inCadru.src}…, ${inCadru.latime} px)`);
const cookie = (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
await b.close();

// ─── 2. Direct la rută, fără micșorare ───────────────────────────────────
async function trimite(poza, nume) {
  const fd = new FormData();
  fd.set("fac", "vezi");
  fd.set("titlu", "Probă");
  fd.set("text", "Un text de probă pentru șablon.");
  fd.set("poza_fisier", new Blob([poza], { type: "image/jpeg" }), nume);
  const r = await fetch(`${BAZA}/api/admin/sablon?fel=persoane`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, origin: BAZA, "x-forwarded-for": IP() },
    body: fd,
  });
  return { stare: r.status, loc: r.headers.get("location") ?? "", corp: await r.text() };
}
const r12 = await trimite(poza12, "IMG_4231.jpg");
verifica(!r12.corp.includes("Cerere invalidă"), "12 MB nu mai dau „Cerere invalidă”");
verifica(r12.stare === 303 && r12.loc.includes("poza-mare"), `12 MB: ruta spune că poza e prea mare, cu limita ei (${r12.stare} ${r12.loc.slice(0, 60)})`);

const poza38 = Buffer.concat([poza12, poza12]);
const r38 = await trimite(poza38, "IMG_4232.jpg");
verifica(r38.stare === 413 && /prea mare/.test(r38.corp) && /30,0 MB/.test(r38.corp), `38 MB: mesaj omenesc cu limita, înainte de citire (${r38.stare})`);

console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
