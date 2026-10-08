import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));
const PAGINI = ["/", "/despre-noi", "/casa-teona", "/proiecte", "/sponsori-si-parteneri", "/redirectioneaza-3-5", "/directioneaza-20", "/suntem-in-presa", "/devino-voluntar", "/contact", "/doneaza", "/politica-de-confidentialitate", "/termeni-si-conditii", "/politica-de-cookieuri", "/raport-de-activitate-2025", "/proiecte/prima-tabara-respiro-asociatia-teona-ariana", "/pagina-inexistenta"];

log("=== Navigare cu tastatura ===");
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  for (const cale of PAGINI) {
    await page.goto(BAZA + cale, { waitUntil: "networkidle" });
    // Sari la conținut
    await page.keyboard.press("Tab");
    const primul = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const s = getComputedStyle(a); return { text: a.innerText.trim(), vizibil: r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.clipPath !== "inset(50%)" && s.position !== "static" ? true : r.width > 1 && r.height > 1, w: Math.round(r.width), h: Math.round(r.height), clip: s.clip }; });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const dupaSkip = await page.evaluate(() => ({ activ: document.activeElement.id || document.activeElement.tagName, hash: location.hash, scrollY: Math.round(scrollY), mainTop: Math.round(document.getElementById("continut").getBoundingClientRect().top) }));
    // Tab prin toată pagina
    const vizitate = []; let faraFocusVizibil = []; let capcana = null; const vazut = new Map();
    for (let i = 0; i < 400; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const a = document.activeElement; if (!a || a === document.body) return { body: true };
        const s = getComputedStyle(a); const r = a.getBoundingClientRect();
        const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
        const ring = s.boxShadow !== "none" && /0px 0px 0px \d/.test(s.boxShadow);
        const cheie = (a.tagName + "|" + (a.getAttribute("href") || a.id || a.name || "") + "|" + (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 30));
        return { cheie, tag: a.tagName.toLowerCase(), text: (a.innerText || a.getAttribute("aria-label") || a.value || "").trim().split("\n")[0].slice(0, 40), inEcran: r.bottom > 0 && r.top < innerHeight, vizibil: r.width > 0 && r.height > 0, outline: outline || ring, hasFocusVisible: a.matches(":focus-visible"), inHeader: !!a.closest("header"), inMain: !!a.closest("main"), inFooter: !!a.closest("footer") };
      });
      if (info.body) { break; }
      vazut.set(info.cheie, (vazut.get(info.cheie) || 0) + 1);
      if (vazut.get(info.cheie) > 2) { capcana = info.text; break; }
      vizitate.push(info);
      if (info.hasFocusVisible && !info.outline && info.vizibil) faraFocusVizibil.push(`${info.tag}:${info.text}`);
      if (!info.vizibil) faraFocusVizibil.push(`INVIZIBIL ${info.tag}:${info.text}`);
    }
    const inMain = vizitate.filter((v) => v.inMain).length;
    log(`\n${cale}: primul Tab="${primul.text}" (${primul.w}×${primul.h}) → Enter: activ=${dupaSkip.activ} hash=${dupaSkip.hash} mainTop=${dupaSkip.mainTop}; ${vizitate.length} opriri (antet ${vizitate.filter((v) => v.inHeader).length}, main ${inMain}, subsol ${vizitate.filter((v) => v.inFooter).length})${capcana ? " CAPCANĂ la: " + capcana : ""}`);
    if (faraFocusVizibil.length) log("   fără inel de focus / invizibile:", JSON.stringify([...new Set(faraFocusVizibil)].slice(0, 12)));
  }
  await ctx.close();
}

log("\n=== Fără JavaScript ===");
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  for (const cale of PAGINI) {
    await page.goto(BAZA + cale, { waitUntil: "load" });
    const r = await page.evaluate(() => {
      const txt = (sel) => document.querySelector(sel)?.innerText?.replace(/\s+/g, " ").slice(0, 60);
      const imgs = [...document.querySelectorAll("img")];
      const goale = imgs.filter((i) => !i.getAttribute("src") || i.getAttribute("src").startsWith("data:")).length;
      const ascunse = [...document.querySelectorAll("main *")].filter((e) => { const s = getComputedStyle(e); return (s.opacity === "0" || s.visibility === "hidden") && e.innerText?.trim(); }).length;
      const forme = [...document.querySelectorAll("form")].map((f) => ({ action: f.getAttribute("action"), method: f.getAttribute("method"), butoane: [...f.querySelectorAll("button")].map((b) => b.innerText.trim()).slice(0, 2) }));
      return {
        titlu: document.title.slice(0, 40), h1: txt("h1"), banner: !!document.querySelector('[role="dialog"]'), baraAnunt: !!document.querySelector('a[href*="tel:"]') && document.body.innerText.includes("SUSTIN la 8835"),
        meniuMobil: !!document.getElementById("meniu-ecran-mic"), nav: document.querySelectorAll("header nav a").length,
        imgs: imgs.length, imgsGoale: goale, textAscuns: ascunse, forme, detalii: document.querySelectorAll("details").length,
        calculator: !!document.querySelector('input[name="cifra-de-afaceri"]'), f230: document.body.innerText.includes("Completează Formularul 230 direct aici") || document.body.innerText.includes("Se încarcă formularul"),
        copiaza: document.querySelectorAll('button:has(svg)').length, lungimeText: document.body.innerText.length,
        plutitor: !!document.querySelector('div.fixed a[href="/doneaza"]'),
      };
    });
    log(`${cale}: ${JSON.stringify(r)}`);
  }
  // Pe telefon fără JS: meniul se poate deschide?
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BAZA + "/", { waitUntil: "load" });
  const m = await page.evaluate(() => { const d = document.getElementById("meniu-ecran-mic"); return { inert: d?.hasAttribute("inert"), inaltime: Math.round(d?.getBoundingClientRect().height ?? -1), hamburger: !!document.querySelector('button[aria-controls="meniu-ecran-mic"]'), linkuriSubsol: document.querySelectorAll("footer nav a").length }; });
  log("Telefon fără JS, meniu:", JSON.stringify(m));
  await page.screenshot({ path: "/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/fara-js-390.png", fullPage: false });
  await ctx.close();
}

log("\n=== prefers-reduced-motion: reduce ===");
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  for (const cale of ["/", "/doneaza", "/proiecte", "/devino-voluntar", "/casa-teona", "/despre-noi"]) {
    await page.goto(BAZA + cale, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const anim = [];
      for (const e of document.querySelectorAll("*")) {
        const s = getComputedStyle(e);
        if (s.animationName !== "none" && s.animationDuration !== "0s" && s.animationPlayState !== "paused") anim.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join(".")} → ${s.animationName} ${s.animationDuration}`);
      }
      const transLungi = [];
      for (const e of document.querySelectorAll("*")) {
        const s = getComputedStyle(e);
        const d = s.transitionDuration.split(",").map((x) => parseFloat(x));
        if (Math.max(...d) >= 0.5 && s.transitionProperty !== "none") transLungi.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join(".")} ${s.transitionProperty.slice(0, 30)} ${s.transitionDuration}`);
      }
      const smooth = getComputedStyle(document.documentElement).scrollBehavior;
      return { animatiiActive: [...new Set(anim)], tranzitiiLungi: [...new Set(transLungi)].slice(0, 8), scrollBehavior: smooth };
    });
    log(`${cale}: animații active = ${r.animatiiActive.length}`, r.animatiiActive.length ? JSON.stringify(r.animatiiActive.slice(0, 10)) : "", "\n   tranziții ≥0,5 s:", r.tranzitiiLungi.length, r.tranzitiiLungi.length ? JSON.stringify(r.tranzitiiLungi.slice(0, 5)) : "", " scroll-behavior:", r.scrollBehavior);
  }
  await ctx.close();
}
await b.close();
