// Capturi pentru butoanele raportate „acoperite” pe Android + cine dă derulare orizontală.
import { chromium } from "playwright";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4411";
const OUT = "/tmp/claude-0/-home-user-teona/c2a62746-a2a4-5b65-85f6-659c402ace1b/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "ro-RO", userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36", extraHTTPHeaders: { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": "203.0.113.77" } });
await ctx.addInitScript(() => { try { localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })); } catch {} });
const p = await ctx.newPage();
await p.goto(BAZA + "/admin"); await p.fill("#parola", "proba-locala-12345"); await p.click('button:has-text("Intră")'); await p.waitForLoadState("load");
const cazuri = [["/contact", "Trimite mesajul"], ["/doneaza", "Am făcut transferul"], ["/proiecte/scrisoare-pentru-mos-craciun", "Abonează-mă"], ["/admin/cereri", "Salvează"]];
for (const [cale, text] of cazuri) {
  const erori418 = [];
  p.on("pageerror", (e) => erori418.push(e.message.slice(0, 80)));
  await p.goto(BAZA + cale, { waitUntil: "load" }); await p.waitForTimeout(1200);
  const info = await p.evaluate((text) => {
    const b = [...document.querySelectorAll("button, a")].find((x) => x.textContent.trim().startsWith(text) && x.offsetParent !== null);
    if (!b) return "buton negăsit";
    b.scrollIntoView({ block: "center" });
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const el2 = document.elementFromPoint(r.left + 4, r.top + 4);
    const d = (e) => e ? `<${e.tagName.toLowerCase()} ${(e.className || "").toString().slice(0, 50)}>` : null;
    return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight, vh: innerHeight, centru: d(el), coltStS: d(el2), coltRect: el2 && JSON.stringify(el2.getBoundingClientRect()).slice(0, 120) };
  }, text);
  await p.waitForTimeout(300);
  const nume = cale.replace(/\W+/g, "_");
  await p.screenshot({ path: `${OUT}/cap${nume}.png` });
  console.log(cale, text, JSON.stringify(info), "pageerror:", JSON.stringify(erori418));
  p.removeAllListeners("pageerror");
}
// derulare orizontală la /admin/documente
await p.goto(BAZA + "/admin/documente", { waitUntil: "load" }); await p.waitForTimeout(800);
const late = await p.evaluate(() => { const w = document.documentElement.clientWidth; return [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > w + 2).map((e) => `<${e.tagName.toLowerCase()} class="${(e.className || "").toString().slice(0, 60)}"> right=${Math.round(e.getBoundingClientRect().right)} text=${e.textContent.trim().slice(0, 40)}`).slice(0, 8); });
console.log("/admin/documente lat:", JSON.stringify(late, null, 1));
await p.screenshot({ path: `${OUT}/cap_admin_documente.png`, fullPage: true });
// 418 pe /doneaza-ti-ziua, repetat
for (let i = 0; i < 3; i++) { const e = []; p.on("pageerror", (x) => e.push(x.message.slice(0, 60))); await p.goto(BAZA + "/doneaza-ti-ziua", { waitUntil: "load" }); await p.waitForTimeout(1500); console.log("418 încercarea", i, JSON.stringify(e)); p.removeAllListeners("pageerror"); }
await b.close();
