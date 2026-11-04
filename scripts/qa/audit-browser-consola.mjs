// Audit „browser”: erori de consolă, resurse blocate (CSP), HTTP ≥ 400 pe
// fiecare pagină publică și de panou, la trei lățimi; pe telefon, dacă
// butoanele de trimitere sunt acoperite de elemente fixe.
import { chromium } from "playwright";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4411";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const PUBLICE = ["/", "/despre-noi", "/casa-teona", "/proiecte", "/sponsori-si-parteneri", "/redirectioneaza-3-5", "/directioneaza-20", "/noutati", "/campanii", "/suntem-in-presa", "/devino-voluntar", "/contact", "/doneaza", "/politica-de-confidentialitate", "/termeni-si-conditii", "/politica-de-cookieuri", "/doneaza-ti-ziua", "/contul-meu", "/multumim", "/multumim?sesiune=cs_test_x", "/proiecte/scrisoare-pentru-mos-craciun", "/proiecte/tabara-respiro-septembrie-2026", "/proiecte/prima-tabara-respiro", "/opreste-donatia", "/actualizeaza-cardul", "/invitatie", "/proiect-inexistent", "/proiecte/nu-exista-deloc", "/doneaza?destinatie=casa-teona&suma=75&frecventa=o-data&utm_source=facebook&utm_medium=cpc"];
const ADMIN = ["/admin", "/admin/poze", "/admin/cereri", "/admin/voluntari", "/admin/abonati", "/admin/abonati/incarca", "/admin/pagini", "/admin/cauta?q=ana", "/admin/qr", "/admin/facebook", "/admin/utilizatori", "/admin/testimoniale", "/admin/parola", "/admin/presa", "/admin/emailuri", "/admin/sabloane", "/admin/rapoarte", "/admin/scrie", "/admin/analiza", "/admin/donatii", "/admin/donatori", "/admin/contracte", "/admin/texte", "/admin/radar", "/admin/cifre", "/admin/aniversari", "/admin/calendar", "/admin/firme", "/admin/sponsori", "/admin/formulare", "/admin/documente"];
const VIEWPORTS = [
  { nume: "desktop", viewport: { width: 1280, height: 900 } },
  { nume: "iphone", viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" },
  { nume: "android", viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36" },
];
const ANTETE = { "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": "203.0.113.7" };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const probleme = [];
for (const vp of VIEWPORTS) {
  const ctx = await b.newContext({ ...vp, extraHTTPHeaders: ANTETE, locale: "ro-RO" });
  await ctx.addInitScript(() => { try { localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })); } catch {} });
  const page = await ctx.newPage();
  // intrare în panou
  await page.goto(BAZA + "/admin");
  await page.fill("#parola", PAROLA);
  await page.click('button:has-text("Intră")');
  await page.waitForLoadState("load");
  for (const cale of [...PUBLICE, ...ADMIN]) {
    const erori = [];
    const asc = (m) => { if (m.type() === "error" || m.type() === "warning") erori.push(`consola ${m.type()}: ${m.text().slice(0, 260)}`); };
    const pe = (e) => erori.push(`pageerror: ${e.message.slice(0, 260)}`);
    const rf = (r) => erori.push(`request failed: ${r.url().slice(0, 160)} ${r.failure()?.errorText}`);
    const rs = (r) => { if (r.status() >= 400 && !(cale.includes("nu-exista") || cale === "/proiect-inexistent")) erori.push(`http ${r.status()}: ${r.url().slice(0, 160)}`); };
    page.on("console", asc); page.on("pageerror", pe); page.on("requestfailed", rf); page.on("response", rs);
    let stare = "";
    try {
      const r = await page.goto(BAZA + cale, { waitUntil: "load", timeout: 30000 });
      stare = String(r?.status());
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      // interacțiuni mici: deschide asistentul, derulează până jos
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      if (vp.nume !== "desktop") {
        // butoanele de trimitere: acoperite de ceva fix?
        const acoperite = await page.evaluate(() => {
          const out = [];
          for (const b of document.querySelectorAll('button[type="submit"], form button:not([type="button"])')) {
            if (!(b instanceof HTMLElement) || b.offsetParent === null) continue;
            b.scrollIntoView({ block: "center" });
            const r = b.getBoundingClientRect();
            if (r.width === 0) continue;
            const puncte = [[r.left + r.width / 2, r.top + r.height / 2], [r.right - 4, r.bottom - 4], [r.left + 4, r.top + 4]];
            for (const [x, y] of puncte) {
              const el = document.elementFromPoint(x, y);
              if (el && !b.contains(el) && !el.contains(b)) out.push(`${(b.textContent || "").trim().slice(0, 30)} acoperit de <${el.tagName.toLowerCase()} class="${(el.className || "").toString().slice(0, 60)}">`);
            }
          }
          return [...new Set(out)];
        });
        for (const a of acoperite) erori.push(`buton acoperit: ${a}`);
        const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (scrollX > 2) erori.push(`derulare orizontală: +${scrollX}px`);
      }
    } catch (e) { erori.push(`navigare: ${e.message.slice(0, 200)}`); }
    page.off("console", asc); page.off("pageerror", pe); page.off("requestfailed", rf); page.off("response", rs);
    if (erori.length) probleme.push({ vp: vp.nume, cale, stare, erori: [...new Set(erori)] });
    else console.log(`ok   ${vp.nume.padEnd(8)} ${stare} ${cale}`);
  }
  await ctx.close();
}
for (const p of probleme) { console.log(`\nPROB ${p.vp.padEnd(8)} ${p.stare} ${p.cale}`); for (const e of p.erori) console.log("     " + e); }
await b.close();
