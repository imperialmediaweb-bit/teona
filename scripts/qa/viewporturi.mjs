import { browser, BAZA } from "./comun.mjs";
import { mkdirSync } from "node:fs";

const b = await browser();
const log = (...a) => console.log(...a);
const DIR = "/tmp/claude-0/-home-user-teona/4a139e8f-245b-53d8-993d-5496bf182b26/scratchpad/capturi";
mkdirSync(DIR, { recursive: true });
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));
const PAGINI = ["/", "/despre-noi", "/casa-teona", "/proiecte", "/sponsori-si-parteneri", "/redirectioneaza-3-5", "/directioneaza-20", "/suntem-in-presa", "/devino-voluntar", "/contact", "/doneaza", "/politica-de-confidentialitate", "/raport-de-activitate-2025", "/proiecte/prima-tabara-respiro-asociatia-teona-ariana", "/pagina-inexistenta"];
const LATIMI = [320, 360, 390, 430, 1280, 1440, 1920];

for (const w of LATIMI) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 740 : 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(ACORD);
  const page = await ctx.newPage();
  for (const cale of PAGINI) {
    await page.goto(BAZA + cale, { waitUntil: "networkidle" });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 900) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    const r = await page.evaluate(() => {
      const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth;
      const vinovati = [];
      if (sw > cw) {
        for (const e of document.querySelectorAll("body *")) {
          const r = e.getBoundingClientRect();
          if (r.right > cw + 1 && r.width > 0 && getComputedStyle(e).position !== "fixed") { const o = e.closest("[class*='overflow-hidden']"); if (!o || o === e) vinovati.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join(".")} right=${Math.round(r.right)}`); }
          if (vinovati.length > 5) break;
        }
      }
      // text tăiat (clipped) sau ieșit din cutia părintelui: titluri
      const taiate = [];
      for (const e of document.querySelectorAll("h1,h2,h3,p,a,button,span")) {
        if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== "visible" && e.clientWidth > 0 && e.innerText?.trim()) taiate.push(`${e.tagName.toLowerCase()} "${e.innerText.trim().slice(0, 30)}" ${e.scrollWidth}>${e.clientWidth}`);
        if (taiate.length > 6) break;
      }
      // ținte de atins mici
      const mici = [];
      for (const e of document.querySelectorAll("a,button,input,select,textarea")) {
        const r = e.getBoundingClientRect(); if (r.width === 0) continue;
        if ((r.height < 24 || r.width < 24) && !e.closest("[inert]")) mici.push(`${e.tagName.toLowerCase()} "${(e.innerText || e.getAttribute("aria-label") || e.name || "").trim().slice(0, 25)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
        if (mici.length > 6) break;
      }
      return { scrollWidth: sw, clientWidth: cw, overflow: sw > cw, vinovati, taiate, mici, inaltime: document.body.scrollHeight };
    });
    log(`${w}px ${cale}: ${r.overflow ? "OVERFLOW " + r.scrollWidth + ">" + r.clientWidth + " " + JSON.stringify(r.vinovati) : "ok"}${r.taiate.length ? " | tăiate: " + JSON.stringify(r.taiate) : ""}${r.mici.length ? " | ținte mici: " + JSON.stringify(r.mici) : ""}`);
    if (w === 320 || w === 390 || w === 1280 || w === 1920) {
      await page.screenshot({ path: `${DIR}/${w}${cale.replace(/\//g, "_") || "_acasa"}.png`, fullPage: true }).catch(() => {});
    }
  }
  await ctx.close();
}
await b.close();
