import { browser, BAZA } from "./comun.mjs";
const b = await browser();
const log = (...a) => console.log(...a);
const ACORD = () => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }));
const PAGINI = ["/redirectioneaza-3-5", "/directioneaza-20", "/devino-voluntar", "/doneaza"];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(ACORD);
const page = await ctx.newPage();
for (const cale of PAGINI) {
  await page.goto(BAZA + cale, { waitUntil: "networkidle" });
  await page.evaluate(() => { let n = 0; for (const e of document.querySelectorAll("a,button,input,select,textarea,summary,iframe,[tabindex]")) e.dataset.qa = String(n++); });
  const secv = []; let capcana = null; const vazut = new Map(); let corp = 0;
  for (let i = 0; i < 500; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const a = document.activeElement; if (!a || a === document.body) return { body: true };
      const r = a.getBoundingClientRect(); const s = getComputedStyle(a);
      return { id: a.dataset.qa, tag: a.tagName.toLowerCase(), text: (a.innerText || a.getAttribute("aria-label") || a.name || "").trim().split("\n")[0].slice(0, 28), vizibil: r.width > 0 && r.height > 0 && s.visibility !== "hidden", zona: a.closest("header") ? "antet" : a.closest("footer") ? "subsol" : a.closest("main") ? "main" : a.closest("[role=dialog]") ? "banner" : "alt", ascunsPtr: !!a.closest("[hidden],[inert]") };
    });
    if (info.body) { corp++; if (corp > 1) break; secv.push({ tag: "BODY" }); continue; }
    const deCateOri = (vazut.get(info.id) || 0) + 1; vazut.set(info.id, deCateOri);
    if (deCateOri > 3 || (deCateOri > 1 && info.tag !== "input")) { capcana = info; break; }
    if (deCateOri === 1) secv.push(info);
  }
  const invizibile = secv.filter((s) => s.tag !== "BODY" && (!s.vizibil || s.ascunsPtr));
  const peZona = (z) => secv.filter((s) => s.zona === z).length;
  log(`\n${cale}: ${secv.length} opriri (antet ${peZona("antet")}, main ${peZona("main")}, subsol ${peZona("subsol")}, alt ${peZona("alt")})${capcana ? ` CAPCANĂ/CICLU la ${capcana.tag} "${capcana.text}"` : ""}${invizibile.length ? " INVIZIBILE: " + JSON.stringify(invizibile.map((s) => s.tag + ":" + s.text)) : ""}`);
  if (["/devino-voluntar", "/doneaza", "/redirectioneaza-3-5"].includes(cale)) log("   secvența main:", secv.filter((s) => s.zona === "main").map((s) => `${s.tag}:${s.text}`).join(" → "));
}
await b.close();
