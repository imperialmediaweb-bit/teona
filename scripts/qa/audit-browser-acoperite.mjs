// Butoane de trimitere acoperite de elemente fixe pe telefon (cu derulare instantanee),
// suprapuneri între casetele plutitoare, elementul care dă derulare orizontală,
// și eroarea de hidratare #418 pe /doneaza-ti-ziua (unde anume).
import { chromium } from "playwright";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4411";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const VP = [
  ["iphone", { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" }],
  ["android", { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36" }],
  ["desktop", { viewport: { width: 1280, height: 900 } }],
];
const PAGINI = ["/", "/contact", "/doneaza", "/devino-voluntar", "/redirectioneaza-3-5", "/directioneaza-20", "/doneaza-ti-ziua", "/contul-meu", "/proiecte/scrisoare-pentru-mos-craciun", "/admin/cereri", "/admin/cifre", "/admin/texte", "/admin/scrie", "/admin/presa", "/admin/voluntari", "/admin/sabloane", "/admin/documente"];
for (const [nume, opt] of VP) {
  const ctx = await b.newContext({ ...opt, locale: "ro-RO", extraHTTPHeaders: { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": "203.0.113.78" } });
  await ctx.addInitScript(() => { try { localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })); } catch {} });
  const p = await ctx.newPage();
  await p.goto(BAZA + "/admin"); await p.fill("#parola", "proba-locala-12345"); await p.click('button:has-text("Intră")'); await p.waitForLoadState("load");
  for (const cale of PAGINI) {
    const erori = []; p.on("pageerror", (e) => erori.push(e.message.slice(0, 40)));
    await p.goto(BAZA + cale, { waitUntil: "load" }); await p.waitForTimeout(1000);
    await p.addStyleTag({ content: "html,body{scroll-behavior:auto!important}" });
    const rez = await p.evaluate(async () => {
      const out = [];
      const butoane = [...document.querySelectorAll('button[type="submit"], form button:not([type="button"])')].filter((b) => b.offsetParent !== null);
      for (const b of butoane) {
        b.scrollIntoView({ block: "center", behavior: "instant" });
        await new Promise((r) => setTimeout(r, 120));
        const r = b.getBoundingClientRect();
        if (r.width === 0) continue;
        for (const [x, y] of [[r.left + r.width / 2, r.top + r.height / 2], [r.right - 3, r.bottom - 3], [r.left + 3, r.top + 3], [r.right - 3, r.top + 3]]) {
          const el = document.elementFromPoint(x, y);
          if (el && !b.contains(el) && !el.contains(b)) out.push(`„${(b.textContent || "").trim().slice(0, 28)}” la (${Math.round(x)},${Math.round(y)}) sub <${el.tagName.toLowerCase()} ${(el.className || "").toString().slice(0, 40)}| ${el.textContent.trim().slice(0, 20)}>`);
        }
      }
      const w = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const late = sw > w + 2 ? [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > w + 2 && e.children.length === 0).map((e) => `<${e.tagName.toLowerCase()} ${(e.className || "").toString().slice(0, 40)}> right=${Math.round(e.getBoundingClientRect().right)} „${e.textContent.trim().slice(0, 40)}”`).slice(0, 4) : [];
      return { acoperite: [...new Set(out)], late, sw, w };
    });
    p.removeAllListeners("pageerror");
    const gol = rez.acoperite.length === 0 && rez.late.length === 0 && erori.length === 0;
    console.log(`${gol ? "ok  " : "PROB"} ${nume.padEnd(7)} ${cale}` + (gol ? "" : ` ${JSON.stringify({ ...rez, erori })}`));
  }
  // suprapunere între cele două butoane plutitoare + caseta deschisă
  if (nume !== "desktop") {
    await p.goto(BAZA + "/despre-noi", { waitUntil: "load" }); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const q = (f) => { const e = [...document.querySelectorAll("a,button")].find(f); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.right), Math.round(r.bottom)]; }; return { intreaba: q((e) => e.textContent.trim() === "Întreabă-ne"), doneaza: q((e) => e.textContent.trim() === "Donează" && getComputedStyle(e.parentElement).position === "fixed"), vw: innerWidth, vh: innerHeight }; });
    console.log(`     ${nume} plutitoare: ${JSON.stringify(r)}`);
  }
  await ctx.close();
}
// 418: ce diferă între HTML-ul de la server și DOM-ul după hidratare, pe android
{
  const opt = VP[1][1];
  const a = await b.newContext({ ...opt, javaScriptEnabled: false }); const pa = await a.newPage();
  await pa.goto(BAZA + "/doneaza-ti-ziua", { waitUntil: "load" });
  const server = await pa.evaluate(() => document.querySelector("main").outerHTML);
  const c = await b.newContext(opt); const pc = await c.newPage();
  await pc.goto(BAZA + "/doneaza-ti-ziua", { waitUntil: "load" }); await pc.waitForTimeout(1500);
  const client = await pc.evaluate(() => document.querySelector("main").outerHTML);
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/claude-0/-home-user-teona/c2a62746-a2a4-5b65-85f6-659c402ace1b/scratchpad/418-server.html", server);
  writeFileSync("/tmp/claude-0/-home-user-teona/c2a62746-a2a4-5b65-85f6-659c402ace1b/scratchpad/418-client.html", client);
  console.log("418: lungimi server/client", server.length, client.length);
  await a.close(); await c.close();
}
await b.close();
