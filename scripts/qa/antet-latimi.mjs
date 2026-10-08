import { browser, BAZA } from "./comun.mjs";
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 1280, height: 300 } });
await ctx.addInitScript(() => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })));
const page = await ctx.newPage();
for (const w of [1279, 1280, 1300, 1340, 1366, 1400, 1440, 1470, 1500, 1536, 1600]) {
  await page.setViewportSize({ width: w, height: 300 });
  await page.goto(BAZA + "/casa-teona", { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const h = document.querySelector("header > div"); const d = h.querySelector("div.ml-auto"); const nav = h.querySelector("nav");
    return { container: Math.round(h.getBoundingClientRect().right), doneazaDreapta: Math.round(d.getBoundingClientRect().right), navLatime: Math.round(nav.getBoundingClientRect().width), navDisplay: getComputedStyle(nav).display, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
  });
  console.log(w, JSON.stringify(r), r.scrollW > r.clientW ? "← DERULARE ORIZONTALĂ, Donează tăiat" : r.doneazaDreapta > r.container ? "← Donează iese din container" : "ok");
  if (w === 1280) await page.screenshot({ path: "/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/antet-1280-curat.png", clip: { x: 0, y: 0, width: w, height: 90 } });
}
await b.close();
