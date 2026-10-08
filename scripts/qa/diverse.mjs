import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));

log("=== Linkurile „Susține” cu ?destinatie= ===");
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  for (const d of ["tabere", "casa-teona", "cazuri-umanitare"]) {
    await page.goto(BAZA + "/doneaza?destinatie=" + d, { waitUntil: "networkidle" });
    log(`/doneaza?destinatie=${d} → bifat: ${await page.locator('input[name="destinatie"]:checked').inputValue()}`);
  }
  // De pe prima pagină, prin clic
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  await page.click('a[href="/doneaza?destinatie=casa-teona"]');
  await page.waitForURL("**/doneaza?destinatie=casa-teona");
  await page.waitForTimeout(300);
  log("Prin clic din Campanii (Casa Teona) → bifat:", await page.locator('input[name="destinatie"]:checked').inputValue());

  log("\n=== Newsletter ===");
  await page.goto(BAZA + "/contact", { waitUntil: "networkidle" });
  const nf = page.locator("form").filter({ hasText: "Abonează-mă" });
  const st = async (e) => log(`[${e}] alert=${JSON.stringify(await nf.locator('[role="alert"]').allInnerTexts().then((t) => t.map((x) => x.replace(/\s+/g, " "))))} buton="${(await nf.locator("button").innerText()).trim()}"`);
  await nf.locator("button").click(); await page.waitForTimeout(800); await st("gol");
  await nf.locator('input[name="email"]').fill("abc"); await nf.locator("button").click(); await page.waitForTimeout(800); await st("email abc");
  await nf.locator('input[name="email"]').fill("a@b.ro"); await nf.locator("button").click(); await page.waitForTimeout(800); await st("email ok, fără acord");
  await nf.locator('input[name="acord"]').check(); await nf.locator("button").click(); await page.waitForTimeout(800); await st("email ok, acord");
  log("Erorile newsletter sunt lângă câmp?", await nf.locator("p.text-caramiziu-700").count(), "mesaje la câmp; aria-invalid:", await nf.locator('[aria-invalid="true"]').count());

  log("\n=== Bara de anunț ===");
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  const bara = () => page.locator('button[aria-label="Închide anunțul"]').count();
  log("Vizibilă la început:", await bara());
  await page.click('button[aria-label="Închide anunțul"]');
  await page.waitForTimeout(200);
  log("După închidere:", await bara());
  await page.click('header nav a[href="/contact"]'); await page.waitForURL("**/contact"); await page.waitForTimeout(300);
  log("Pe altă pagină:", await bara());
  await page.reload({ waitUntil: "networkidle" });
  log("După reîncărcare:", await bara());
  const p2 = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p2.goto(BAZA + "/", { waitUntil: "networkidle" });
  log("Într-o sesiune nouă:", await p2.locator('button[aria-label="Închide anunțul"]').count());
  log("Textul barei:", (await p2.locator('button[aria-label="Închide anunțul"]').evaluate((b) => b.parentElement.innerText)).replace(/\s+/g, " "));
  await p2.context().close();

  log("\n=== Meniu desktop: hover apoi clic ===");
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  const sub = page.locator('header nav button[aria-expanded]');
  await sub.hover(); await page.waitForTimeout(400);
  log("După hover:", await sub.getAttribute("aria-expanded"));
  await sub.click(); await page.waitForTimeout(300);
  log("După clic (mouse-ul rămâne deasupra):", await sub.getAttribute("aria-expanded"), " submeniu vizibil:", await page.evaluate(() => getComputedStyle(document.querySelector('header nav button[aria-expanded]').nextElementSibling).visibility));
  await sub.click(); await page.waitForTimeout(300);
  log("Al doilea clic:", await sub.getAttribute("aria-expanded"));
  // Clic pe buton apoi mută mouse-ul în submeniu
  await page.mouse.move(5, 400); await page.waitForTimeout(300);
  await sub.hover(); await page.waitForTimeout(300);
  const link = page.locator('header nav button[aria-expanded] + div a').first();
  await link.hover(); await page.waitForTimeout(200);
  log("Hover pe linkul din submeniu, submeniu:", await sub.getAttribute("aria-expanded"));
  await ctx.close();
}

log("\n=== Butoanele Copiază, listă completă ===");
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  for (const cale of ["/doneaza", "/redirectioneaza-3-5", "/directioneaza-20", "/contact"]) {
    await page.goto(BAZA + cale, { waitUntil: "networkidle" });
    const n = await page.locator('button:has-text("Copiază")').count();
    log(`${cale}: ${n} butoane`);
    for (let i = 0; i < n; i++) {
      const btn = page.locator('button:has-text("Copiază")').nth(i);
      const { eticheta, afisat } = await btn.evaluate((b) => { const c = b.closest("div.flex"); return { eticheta: c.querySelector("span.uppercase").innerText, afisat: c.querySelector("span.select-all").innerText }; });
      await page.evaluate(() => navigator.clipboard.writeText("(gol)"));
      await btn.click();
      await page.waitForTimeout(250);
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      const text = (await btn.innerText()).trim();
      const anunt = await btn.evaluate((b) => b.parentElement.querySelector('[role="status"]')?.innerText ?? "(fără)");
      log(`   ${eticheta}: afișat="${afisat}" copiat="${clip}" buton="${text}" anunț sr="${anunt}"`);
    }
  }
  await ctx.close();
}

log("\n=== HTML: 404 încorporat, og:image, metadataBase ===");
{
  const html = await (await fetch(BAZA + "/proiecte/prima-tabara-respiro-asociatia-teona-ariana")).text();
  const i = html.indexOf("Pagina nu a fost găsită");
  log("Pagină validă de proiect conține „Pagina nu a fost găsită”?", i >= 0, i >= 0 ? "context: …" + html.slice(Math.max(0, i - 400), i + 80).replace(/\s+/g, " ").slice(-480) : "");
  const h = await (await fetch(BAZA + "/")).text();
  log("og:image pe /:", (h.match(/<meta property="og:image"[^>]*>/g) || []).join(" | "));
  log("twitter:image:", (h.match(/<meta name="twitter:image"[^>]*>/g) || []).join(" | "));
  log("canonical:", (h.match(/<link rel="canonical"[^>]*>/g) || []).join(" | ") || "(lipsă)");
  const r404 = await fetch(BAZA + "/proiecte/nu-exista");
  log("/proiecte/nu-exista: status", r404.status, " x-nextjs?", JSON.stringify([...r404.headers].filter(([k]) => k.startsWith("x-"))));
  const r404b = await fetch(BAZA + "/adresa-inventata");
  log("/adresa-inventata: status", r404b.status);
  const rs = await fetch(BAZA + "/robots.txt"); log("/robots.txt:", rs.status, (await rs.text()).slice(0, 100).replace(/\n/g, " ") );
  const sm = await fetch(BAZA + "/sitemap.xml"); log("/sitemap.xml:", sm.status);
  const fav = await fetch(BAZA + "/favicon.ico"); log("/favicon.ico:", fav.status);
  const og = await fetch(BAZA + "/opengraph-image.jpg"); log("/opengraph-image.jpg:", og.status, og.headers.get("content-type"));
}
await b.close();
