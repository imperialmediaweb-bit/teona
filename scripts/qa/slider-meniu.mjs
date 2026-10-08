import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));

log("=== Sliderul de pe prima pagină ===");
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  const erori = urmaresteErori(page);
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  const activ = async () => {
    return page.evaluate(() => {
      const b = [...document.querySelectorAll('button[aria-label^="Fotografia"]')];
      const i = b.findIndex((x) => x.getAttribute("aria-current") === "true");
      const leg = document.querySelector('[aria-live="polite"] .scris')?.innerText;
      const imgs = [...document.querySelectorAll("section img")].slice(0, 3).map((im) => ({ hidden: im.getAttribute("aria-hidden"), op: getComputedStyle(im).opacity, z: getComputedStyle(im).zIndex }));
      const bara = document.querySelector('button[aria-current="true"] span span');
      return { activ: i, legenda: leg, imgs, baraAnim: bara ? getComputedStyle(bara).animationName : null, baraLatime: bara ? getComputedStyle(bara).width : null };
    });
  };
  log("La început:", JSON.stringify(await activ()));
  log("Butoane:", JSON.stringify(await page.$$eval('button[aria-label^="Fotografia"]', (bs) => bs.map((x) => ({ label: x.getAttribute("aria-label"), current: x.getAttribute("aria-current"), h: Math.round(x.getBoundingClientRect().height), w: Math.round(x.getBoundingClientRect().width) })))));
  // Mouse departe de slider; așteaptă 7,5 s
  await page.mouse.move(5, 5);
  await page.waitForTimeout(7600);
  log("După 7,6 s fără mouse:", JSON.stringify(await activ()));
  // Butonul 3
  await page.click('button[aria-label^="Fotografia 3"]');
  await page.waitForTimeout(300);
  log("După clic pe 3:", JSON.stringify(await activ()));
  // Mouse peste secțiune: se oprește?
  const sec = await page.$('section:has(button[aria-label^="Fotografia"])');
  const box = await sec.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  const inainte = await activ();
  await page.waitForTimeout(7600);
  const dupa = await activ();
  log("Cu mouse-ul peste, 7,6 s: înainte=", inainte.activ, "după=", dupa.activ, " bara:", dupa.baraAnim, dupa.baraLatime);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(7600);
  log("Mouse plecat, 7,6 s:", (await activ()).activ);
  // Tastatură: focus pe buton, Enter/Space; se oprește la focus?
  await page.focus('button[aria-label^="Fotografia 1"]');
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  log("Enter pe buton 1:", (await activ()).activ);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  log("Tab + Space (buton 2):", (await activ()).activ);
  const focal = await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return { outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor, label: a.getAttribute("aria-label") }; });
  log("Focus vizibil pe butonul sliderului:", JSON.stringify(focal));
  const inainteF = (await activ()).activ;
  await page.waitForTimeout(7600);
  log("Cu focus pe buton 7,6 s: înainte=", inainteF, "după=", (await activ()).activ);
  // Săgeți?
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  log("ArrowRight:", (await activ()).activ);
  // Reduced motion
  const ctxR = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctxR.addInitScript(ACORD);
  const pr = await ctxR.newPage();
  await pr.goto(BAZA + "/", { waitUntil: "networkidle" });
  const a0 = await pr.evaluate(() => [...document.querySelectorAll('button[aria-label^="Fotografia"]')].findIndex((x) => x.getAttribute("aria-current") === "true"));
  await pr.mouse.move(5, 5);
  await pr.waitForTimeout(7600);
  const a1 = await pr.evaluate(() => [...document.querySelectorAll('button[aria-label^="Fotografia"]')].findIndex((x) => x.getAttribute("aria-current") === "true"));
  log("Reduced motion: slider avansează singur?", a0, "→", a1);
  await pr.click('button[aria-label^="Fotografia 2"]');
  await pr.waitForTimeout(100);
  log("Reduced motion: clic manual merge?", await pr.evaluate(() => [...document.querySelectorAll('button[aria-label^="Fotografia"]')].findIndex((x) => x.getAttribute("aria-current") === "true")));
  const trans = await pr.evaluate(() => { const im = document.querySelector("section img"); return getComputedStyle(im).transitionDuration; });
  log("Reduced motion: transition-duration pe poze:", trans);
  await ctxR.close();
  log("Erori:", JSON.stringify([...new Set(erori)]));
  await ctx.close();
}

log("\n=== Meniul (desktop 1440) ===");
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  const sub = page.locator('header nav button[aria-expanded]');
  const stareSub = async () => ({
    expanded: await sub.getAttribute("aria-expanded"),
    vizibil: await page.evaluate(() => { const d = document.querySelector('header nav button[aria-expanded]').nextElementSibling; const s = getComputedStyle(d); return s.visibility + " " + s.transform; }),
  });
  log("Intrări meniu:", JSON.stringify(await page.$$eval("header nav > a, header nav > div > button", (els) => els.map((e) => e.innerText.trim()))));
  log("Submeniu închis:", JSON.stringify(await stareSub()));
  await sub.hover();
  await page.waitForTimeout(300);
  log("După hover:", JSON.stringify(await stareSub()));
  log("Linkuri submeniu:", JSON.stringify(await page.$$eval('header nav button[aria-expanded] + div a', (as) => as.map((a) => [a.innerText.trim(), a.getAttribute("href")]))));
  await page.mouse.move(5, 300);
  await page.waitForTimeout(300);
  log("După plecarea mouse-ului:", JSON.stringify(await stareSub()));
  await sub.click();
  await page.waitForTimeout(300);
  log("După clic:", JSON.stringify(await stareSub()));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  log("După Escape:", JSON.stringify(await stareSub()), " focus pe:", await page.evaluate(() => document.activeElement.innerText.trim()));
  // Tastatură: Tab până la Redirecționează, Enter, Tab în submeniu
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  log("Enter pe buton:", JSON.stringify(await stareSub()));
  await page.keyboard.press("Tab");
  log("Tab → focus:", await page.evaluate(() => document.activeElement.innerText.trim() + " " + document.activeElement.getAttribute("href")));
  await page.keyboard.press("Tab");
  log("Tab → focus:", await page.evaluate(() => document.activeElement.innerText.trim() + " " + document.activeElement.getAttribute("href")));
  await page.keyboard.press("Tab");
  log("Tab → focus:", await page.evaluate(() => document.activeElement.innerText.trim()), " submeniu:", JSON.stringify(await stareSub()));
  // ArrowDown deschide?
  await page.focus('header nav button[aria-expanded]');
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  log("ArrowDown pe buton:", JSON.stringify(await stareSub()));
  // Submeniu închis: linkurile sunt tabulabile? (visibility hidden => nu)
  await page.keyboard.press("Escape");
  // Submeniul rămâne deschis după navigare?
  await sub.click();
  await page.click('header nav button[aria-expanded] + div a[href="/directioneaza-20"]');
  await page.waitForURL("**/directioneaza-20");
  await page.waitForTimeout(300);
  log("După navigare prin submeniu:", JSON.stringify(await stareSub()), " aria-current pe link:", await page.$eval('header nav button[aria-expanded] + div a[href="/directioneaza-20"]', (a) => a.getAttribute("aria-current")), " buton evidențiat:", await sub.evaluate((b) => b.className.includes("text-caramiziu-600")));
  // Meniul rămâne lipit sus la derulare?
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(300);
  log("Antet la derulare: top=", await page.evaluate(() => Math.round(document.querySelector("header").getBoundingClientRect().top)), " position=", await page.evaluate(() => getComputedStyle(document.querySelector("header")).position));
  // Lățimi 1280: încape pe un rând?
  for (const w of [1280, 1366, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => { const h = document.querySelector("header > div"); const nav = document.querySelector("header nav"); return { inaltimeAntet: Math.round(h.getBoundingClientRect().height), navVizibil: getComputedStyle(nav).display !== "none", randuri: new Set([...nav.querySelectorAll(":scope > a, :scope > div > button")].map((e) => Math.round(e.getBoundingClientRect().top))).size, overflow: document.documentElement.scrollWidth > innerWidth }; });
    log(`  ${w}px:`, JSON.stringify(r));
  }
  await ctx.close();
}

log("\n=== Meniul de telefon (390) ===");
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  const ham = page.locator('button[aria-controls="meniu-ecran-mic"]');
  const st = async () => ({
    expanded: await ham.getAttribute("aria-expanded"),
    label: await ham.getAttribute("aria-label"),
    inert: await page.$eval("#meniu-ecran-mic", (d) => d.hasAttribute("inert")),
    inaltime: await page.$eval("#meniu-ecran-mic", (d) => Math.round(d.getBoundingClientRect().height)),
    bodyOverflow: await page.evaluate(() => document.body.style.overflow),
  });
  log("Închis:", JSON.stringify(await st()));
  await ham.click();
  await page.waitForTimeout(400);
  log("Deschis:", JSON.stringify(await st()));
  log("Linkuri:", JSON.stringify(await page.$$eval("#meniu-ecran-mic a", (as) => as.map((a) => a.innerText.trim().split("\n")[0]))));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  log("După Escape:", JSON.stringify(await st()));
  if ((await st()).expanded === "true") { await ham.click(); await page.waitForTimeout(400); }
  // Tab de la hamburger când e închis: sare peste meniu?
  await ham.focus();
  await page.keyboard.press("Tab");
  log("Închis, Tab după hamburger → ", await page.evaluate(() => document.activeElement.tagName + " " + (document.activeElement.innerText || document.activeElement.getAttribute("aria-label") || "").trim().slice(0, 30)));
  // Deschis: Tab intră în meniu?
  await ham.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await page.keyboard.press("Tab");
  log("Deschis, Tab → ", await page.evaluate(() => document.activeElement.tagName + " " + (document.activeElement.innerText || "").trim().slice(0, 30)));
  // Tab la sfârșitul meniului: iese în pagină (capcană?)
  let ultim = "";
  for (let i = 0; i < 25; i++) { await page.keyboard.press("Tab"); ultim = await page.evaluate(() => (document.activeElement.closest("#meniu-ecran-mic") ? "[meniu] " : "[pagină] ") + (document.activeElement.innerText || document.activeElement.getAttribute("aria-label") || document.activeElement.tagName).trim().slice(0, 30)); }
  log("După 25 Tab:", ultim, " meniu încă deschis:", (await st()).expanded);
  // Navigare: meniul se închide?
  await ham.click().catch(() => {});
  await page.waitForTimeout(300);
  if ((await st()).expanded !== "true") { await ham.click(); await page.waitForTimeout(300); }
  await page.click('#meniu-ecran-mic a[href="/contact"]');
  await page.waitForURL("**/contact");
  await page.waitForTimeout(400);
  log("După navigare la /contact:", JSON.stringify(await st()));
  // Pe 320
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  log("320px antet:", JSON.stringify(await page.evaluate(() => { const h = document.querySelector("header > div"); return { inaltime: Math.round(h.getBoundingClientRect().height), overflow: document.documentElement.scrollWidth > innerWidth, doneazaText: document.querySelector('header a[aria-label="Donează"]').innerText.trim() || "(doar inimă)" }; })));
  await ham.click();
  await page.waitForTimeout(400);
  const inM = await page.evaluate(() => { const m = document.querySelector("#meniu-ecran-mic > div > div"); return { maxH: getComputedStyle(m).maxHeight, scrollH: m.scrollHeight, clientH: m.clientHeight, overflowY: getComputedStyle(m).overflowY }; });
  log("320px meniu deschis:", JSON.stringify(inM));
  await page.screenshot({ path: "/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/meniu-320.png" });
  await ctx.close();
}
await b.close();
