/**
 * Audit „fisiere” (4 noiembrie 2026): formularele cu fișiere din panou, în
 * browser, **pe adresa adevărată**. Chromium deschide https://teona-ariana.ro,
 * iar fiecare cerere e dusă la serverul local cu antetele pe care le pune
 * Railway (Host: localhost:8080, x-forwarded-host, x-forwarded-proto). Așa
 * se văd și cele trei lucruri pe care localhost le ascundea: `blob:` cu
 * domeniu, cookie-uri Secure, CSP pe origin-ul real.
 *
 *   BAZA=http://127.0.0.1:4401 MENTIUNE=http://127.0.0.1:4402 \
 *   DATABASE_URL=postgres://postgres:x@127.0.0.1:5434/teona_audit_1 \
 *   PAROLA_ADMIN=… node scripts/qa/audit-fisiere-browser.mjs
 */
import { chromium } from "playwright";
import sharp from "sharp";
import pg from "pg";

const BAZA = process.env.BAZA ?? "http://127.0.0.1:4401";
const MENTIUNE = process.env.MENTIUNE ?? "http://127.0.0.1:4402";
const PAROLA = process.env.PAROLA_ADMIN;
const SITE = "https://teona-ariana.ro";
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN.");
  process.exit(2);
}
let rele = 0;
const verifica = (ok, mesaj) => {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
};
const nota = (m) => console.log(`     ${m}`);
const jurnal = async () => (await fetch(`${MENTIUNE}/__jurnal`)).json();
const goleste = () => fetch(`${MENTIUNE}/__goleste`);
const dorm = (ms) => new Promise((r) => setTimeout(r, ms));

const zgomot = (w, h, c) => sharp({ create: { width: w, height: h, channels: c, noise: { type: "gaussian", mean: 128, sigma: 60 } } });
const jpeg1 = await zgomot(1400, 1000, 3).jpeg({ quality: 90 }).toBuffer();
const jpeg15 = await zgomot(5200, 3900, 3).jpeg({ quality: 93 }).toBuffer();
const png3 = await zgomot(1100, 800, 4).png().toBuffer();
const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]), Buffer.alloc(2 * 1024 * 1024, 7)]);
nota(`jpeg15: ${(jpeg15.length / 1048576).toFixed(1)} MB`);

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true });
// Adresa adevărată → serverul local, cu antetele de pe Railway.
await ctx.route(`${SITE}/**`, async (route) => {
  const cerere = route.request();
  const u = new URL(cerere.url());
  try {
    const r = await route.fetch({
      url: BAZA + u.pathname + u.search,
      maxRedirects: 0,
      headers: {
        ...cerere.headers(),
        host: "localhost:8080",
        "x-forwarded-host": "teona-ariana.ro",
        "x-forwarded-proto": "https",
        "x-real-ip": "104.16.1.1",
        "cf-connecting-ip": "86.120.1.1",
      },
    });
    await route.fulfill({ response: r });
  } catch (e) {
    await route.abort();
  }
});
const page = await ctx.newPage();
const consola = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consola.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => consola.push(`[pageerror] ${e.message.slice(0, 200)}`));

/** Pune în câmpul de fișier un File făcut în pagină, cu `type` ales de noi (gol = Windows). */
async function puneFisier(selector, octeti, nume, tip) {
  await page.evaluate(
    async ({ selector, b64, nume, tip }) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const f = new File([bin], nume, { type: tip });
      const dt = new DataTransfer();
      dt.items.add(f);
      const input = document.querySelector(selector);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { selector, b64: octeti.toString("base64"), nume, tip },
  );
}
const imgDinCadru = (alt) =>
  page.evaluate((alt) => {
    const doc = document.querySelector("iframe")?.contentDocument;
    const img = doc?.querySelector(`img[alt="${alt}"]`) ?? doc?.querySelector("img[width='600']");
    return img ? { src: img.getAttribute("src")?.slice(0, 40) ?? "", latime: img.naturalWidth, complet: img.complete, alt: img.getAttribute("alt") } : null;
  }, alt);
const asteaptaCadru = (fn, ms = 20000) => page.waitForFunction(fn, null, { timeout: ms }).then(() => true).catch(() => false);

// ─── Intrarea, pe adresa adevărată ──────────────────────────────────────
await page.goto(`${SITE}/admin/sabloane`, { waitUntil: "load" });
await page.fill('input[name="parola"]', PAROLA);
await Promise.all([page.waitForURL(/\/admin\/sabloane/, { timeout: 15000 }).catch(() => {}), page.click('button:has-text("Intră")')]);
const cookies = await ctx.cookies(SITE);
const sesiune = cookies.find((c) => c.name === "teona_verificare");
verifica(Boolean(sesiune), `intrare pe ${SITE} (cookie de sesiune: ${sesiune ? "da" : "NU"}; url: ${page.url()})`);
verifica(sesiune?.secure === true && sesiune?.httpOnly === true, `cookie-ul e Secure și HttpOnly (${JSON.stringify({ secure: sesiune?.secure, httpOnly: sesiune?.httpOnly, sameSite: sesiune?.sameSite })})`);
await page.goto(`${SITE}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
await page.fill('input[name="poza_alt"]', "Sala Unirii");
await page.fill('input[name="titlu"]', "Tabăra de iarnă");

// ─── 1. JPEG de 1 MB cu type gol (Windows): previzualizarea îl arată, trimiterea îl refuză ──
console.log("\n── JPEG 1 MB cu File.type gol");
await puneFisier('input[name="poza_fisier"]', jpeg1, "IMG_4231.jpg", "");
const tipInCamp = await page.locator('input[name="poza_fisier"]').evaluate((el) => el.files[0]?.type);
nota(`File.type în câmp: „${tipInCamp}”`);
const gata1 = await asteaptaCadru(() => {
  const img = document.querySelector("iframe")?.contentDocument?.querySelector('img[alt="Sala Unirii"]');
  return Boolean(img && img.complete && img.naturalWidth > 0 && img.getAttribute("src")?.startsWith("data:image/jpeg"));
});
const img1 = await imgDinCadru("Sala Unirii");
verifica(gata1, `previzualizarea arată poza (${JSON.stringify(img1)})`);
await page.fill('input[name="catre"]', "eu@exemplu.ro");
await goleste();
await Promise.all([page.waitForURL(/ratat=|facut=/, { timeout: 20000 }).catch(() => {}), page.click('button[value="proba"]')]);
const alerta1 = await page.locator('[role="alert"]').innerText().catch(() => "");
nota(`după „Trimite-ți o probă”: ${page.url().replace(SITE, "")} — „${alerta1}”`);
verifica(!/ratat=poza-tip/.test(page.url()), "proba cu un JPEG adevărat (type gol) nu e refuzată ca „nu e o fotografie”");
const em1 = (await jurnal()).filter((x) => x.cale.startsWith("/emails"));
nota(`e-mailuri plecate: ${em1.length}`);

// ─── 2. Poza de telefon de 15 MB cu type octet-stream, apoi PNG cu alpha, apoi scoasă ──
console.log("\n── 15 MB → PNG 3 MB cu transparență → scoasă");
await page.goto(`${SITE}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
await page.fill('input[name="poza_alt"]', "Sala Unirii");
const camp = page.locator('input[name="poza_fisier"]');
await camp.setInputFiles({ name: "IMG_4231.jpg", mimeType: "application/octet-stream", buffer: jpeg15 });
await page.waitForFunction(() => document.querySelector("[data-nota-poza]")?.textContent?.includes("micșorată"), null, { timeout: 30000 }).catch(() => {});
const nota15 = await page.locator("[data-nota-poza]").innerText().catch(() => "");
const dupa15 = await camp.evaluate((el) => ({ marime: el.files?.[0]?.size ?? 0, tip: el.files?.[0]?.type ?? "" }));
verifica(dupa15.marime > 0 && dupa15.marime < 1.5 * 1048576 && dupa15.tip === "image/jpeg", `15 MB: micșorată în browser (${(dupa15.marime / 1024).toFixed(0)} KB, ${dupa15.tip}) — „${nota15}”`);
const gata15 = await asteaptaCadru(() => {
  const img = document.querySelector("iframe")?.contentDocument?.querySelector('img[alt="Sala Unirii"]');
  return Boolean(img && img.complete && img.naturalWidth === 2000 && img.getAttribute("src")?.startsWith("data:image/jpeg"));
});
verifica(gata15, `previzualizarea arată poza micșorată, data:image/jpeg, 2000 px (${JSON.stringify(await imgDinCadru("Sala Unirii"))})`);

await camp.setInputFiles({ name: "sigla.png", mimeType: "image/png", buffer: png3 });
const gataPng = await asteaptaCadru(() => {
  const img = document.querySelector("iframe")?.contentDocument?.querySelector('img[alt="Sala Unirii"]');
  return Boolean(img && img.complete && img.naturalWidth === 1100 && img.getAttribute("src")?.startsWith("data:image/png"));
});
const notaPng = await page.locator("[data-nota-poza]").innerText().catch(() => "");
verifica(gataPng, `PNG 3 MB cu alpha înlocuiește poza: data:image/png, 1100 px (${JSON.stringify(await imgDinCadru("Sala Unirii"))})`);
nota(`nota de sub câmp după PNG: „${notaPng}” (PNG-ul de 3,3 MB e peste pragul de 1,5 MB)`);
const tipPng = await camp.evaluate((el) => ({ marime: el.files?.[0]?.size ?? 0, tip: el.files?.[0]?.type ?? "" }));
nota(`în câmp după PNG: ${(tipPng.marime / 1024).toFixed(0)} KB ${tipPng.tip}`);

await camp.setInputFiles([]);
await page.fill('input[name="titlu"]', "Tabăra de iarnă 2");
const gataFara = await asteaptaCadru(() => {
  const doc = document.querySelector("iframe")?.contentDocument;
  const img = doc?.querySelector("img[width='600']");
  return Boolean(img && img.complete && img.naturalWidth > 0 && img.getAttribute("src")?.startsWith("/poze/"));
});
const imgFara = await imgDinCadru("—");
verifica(gataFara, `poza scoasă: previzualizarea revine la poza implicită, relativă și încărcată (${JSON.stringify(imgFara)})`);
const notaFara = await page.locator("[data-nota-poza]").innerText().catch(() => "");
nota(`nota de sub câmp după ce poza a fost scoasă: „${notaFara}”`);
verifica(!/micșorată de la 16/.test(notaFara), "nota „micșorată de la 16,5 MB” nu rămâne sub câmp după ce poza e alta / scoasă");

// ─── 3. HEIC de 2 MB: ce vede omul în previzualizare și sub câmp ──────────
console.log("\n── HEIC 2 MB");
await camp.setInputFiles({ name: "IMG_0001.heic", mimeType: "image/heic", buffer: heic });
await dorm(2500);
const imgHeic = await imgDinCadru("Sala Unirii");
const notaHeic = await page.locator("[data-nota-poza]").innerText().catch(() => "");
nota(`cadru: ${JSON.stringify(imgHeic)}; nota sub câmp: „${notaHeic}”`);
verifica(!(imgHeic?.src.startsWith("blob:") && imgHeic?.latime === 0), "HEIC: previzualizarea nu arată o imagine ruptă (blob: fără conținut)");
verifica(/HEIC|nu e|JPG/.test(notaHeic), "HEIC: sub câmp scrie că formatul nu merge");

// ─── 4. Două apăsări pe „Trimite-ți o probă” ──────────────────────────────
console.log("\n── apăsări duble");
await camp.setInputFiles([]);
await page.fill('input[name="catre"]', "eu@exemplu.ro");
await goleste();
await page.dblclick('button[value="proba"]');
await page.waitForURL(/facut=proba/, { timeout: 20000 }).catch(() => {});
await dorm(1500);
const emDuble = (await jurnal()).filter((x) => x.cale.startsWith("/emails"));
verifica(emDuble.length === 1, `dublu-clic pe „Trimite-ți o probă” → ${emDuble.length} e-mail(uri) (ar trebui 1)`);

// Comunicatul de presă, dublu-clic.
await page.goto(`${SITE}/admin/presa`, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
const nrRedactii = await page.locator('input[name="contact"]:checked').count();
await page.fill('input[name="subiect"]', "Comunicat de probă");
await page.fill('textarea[name="text"]', "Un comunicat de probă, destul de lung ca să treacă de verificarea de lungime a rutei.");
await page.check('input[name="confirm"]');
await goleste();
await page.dblclick('form[action="/api/admin/presa/trimite"] button[type="submit"]');
await page.waitForURL(/trimis=/, { timeout: 20000 }).catch(() => {});
await dorm(2000);
const emPresa = (await jurnal()).filter((x) => x.cale.startsWith("/emails"));
verifica(emPresa.length === nrRedactii, `dublu-clic pe „Trimite comunicatul” → ${emPresa.length} e-mailuri pentru ${nrRedactii} redacții (ar trebui ${nrRedactii})`);

// Noutate nouă, dublu-clic pe „Salvează ciorna”.
const baza = new pg.Client({ connectionString: process.env.DATABASE_URL });
await baza.connect();
const inainte = Number((await baza.query("select count(*) from texte where titlu = 'Audit dublu-clic'")).rows[0].count);
await page.goto(`${SITE}/admin/scrie/nou?fel=noutate`, { waitUntil: "load" });
await page.fill('input[name="titlu"]', "Audit dublu-clic");
await page.fill('textarea[name="continut"]', "Un text de probă destul de lung ca să treacă de verificare.");
await page.dblclick('button[name="actiune"][value="salveaza"]');
await page.waitForURL(/gata=/, { timeout: 20000 }).catch(() => {});
await dorm(1500);
const dupa = Number((await baza.query("select count(*) from texte where titlu = 'Audit dublu-clic'")).rows[0].count);
verifica(dupa - inainte === 1, `dublu-clic pe „Salvează ciorna” → ${dupa - inainte} noutăți create (ar trebui 1)`);
await baza.query("delete from texte where titlu = 'Audit dublu-clic'");

// ─── 5. Eroarea de la server + „Înapoi”: rămâne ce ai scris? ─────────────
console.log("\n── eroare de la server, apoi „Înapoi”");
await page.goto(`${SITE}/admin/scrie/nou?fel=noutate`, { waitUntil: "load" });
await page.fill('input[name="titlu"]', "Ab");
await page.fill('textarea[name="continut"]', "Un text de probă destul de lung ca să treacă de verificare, scris cu grijă.");
await page.evaluate(() => document.querySelector('input[name="titlu"]').removeAttribute("minlength"));
await Promise.all([page.waitForLoadState("load"), page.click('button[name="actiune"][value="salveaza"]')]);
const eroare = await page.locator("main p").first().innerText().catch(() => "");
nota(`răspunsul: „${eroare}” (${page.url().replace(SITE, "")})`);
verifica(/titlu/.test(eroare), "titlul scurt dă pagina „Nu s-a salvat încă”");
await page.click('a:has-text("Înapoi")');
await dorm(1500);
const dupaInapoi = await page.evaluate(() => ({
  titlu: document.querySelector('input[name="titlu"]')?.value ?? null,
  text: document.querySelector('textarea[name="continut"]')?.value?.length ?? null,
  fisier: document.querySelector('input[name="poza"]')?.files?.length ?? null,
  url: location.pathname,
}));
nota(`după „Înapoi”: ${JSON.stringify(dupaInapoi)}`);
verifica(dupaInapoi.titlu === "Ab" && dupaInapoi.text > 20, "„Ce ai completat e tot acolo”: titlul și textul sunt înapoi după „Înapoi”");

// ─── 6. Sesiune expirată cât scriai ──────────────────────────────────────
console.log("\n── sesiune expirată");
await page.goto(`${SITE}/admin/sabloane?fel=persoane`, { waitUntil: "load" });
await page.fill('input[name="titlu"]', "Campanie scrisă două ore");
await page.fill('textarea[name="text"]', "Mult text scris cu grijă.");
await page.fill('input[name="catre"]', "eu@exemplu.ro");
await ctx.clearCookies();
await Promise.all([page.waitForLoadState("load"), page.click('button[value="proba"]')]);
const corpExpirat = await page.evaluate(() => document.body.innerText.slice(0, 200));
nota(`după expirare, „Trimite-ți o probă” arată: „${corpExpirat}” (${page.url().replace(SITE, "")})`);
verifica(!/^\s*\{"mesaj"/.test(corpExpirat), "sesiunea expirată nu duce la un JSON gol în fereastră");

const csp = consola.filter((c) => /Content Security Policy|CSP/i.test(c));
nota(`erori CSP în consolă: ${csp.length}${csp.length ? "\n     " + csp.slice(0, 5).join("\n     ") : ""}`);
verifica(csp.length === 0, "nicio încălcare CSP în panou pe adresa adevărată");
const alte = consola.filter((c) => !/Content Security Policy|CSP/i.test(c));
if (alte.length) nota(`alte erori în consolă: ${alte.slice(0, 6).join(" | ")}`);

await baza.end();
await b.close();
console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
