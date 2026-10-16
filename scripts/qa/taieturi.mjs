import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

// Adresa serverului, ca la toate celelalte probe. Era scrisă de mână
// „localhost:3000", deci proba cădea pe orice alt port.
const BAZA = process.env.BAZA ?? "http://localhost:3000";

/*
  Dosarul în care scrie proba.

  Era scris de patru ori ca `process.env.IESIRE ?? "/tmp" + "/fisier"`, ceea
  ce înseamnă altceva decât pare: `+` leagă mai strâns decât `??`, deci cu
  IESIRE nesetat ieșea calea bună din întâmplare, iar cu el setat ieșea
  dosarul fără nume de fișier. La linia cu `"file://" + process.env.IESIRE ??
  …` ieșea de-a dreptul `file://undefined`, și proba cădea acolo de fiecare
  dată.
*/
const IESIRE = process.env.IESIRE ?? "/tmp";
const PAGINI = ["/","/despre-noi","/casa-teona","/proiecte","/doneaza","/redirectioneaza-3-5",
  "/directioneaza-20","/devino-voluntar","/contact","/sponsori-si-parteneri","/doneaza-ti-ziua","/suntem-in-presa"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
const rau = new Map();
for (const cale of PAGINI) {
  await p.goto(BAZA + cale, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() =>
    [...document.querySelectorAll("#continut img")].flatMap((i) => {
      const c = i.getBoundingClientRect();
      if (c.width < 60 || !i.naturalWidth) return [];
      if (getComputedStyle(i).objectFit !== "cover") return [];
      const sursa = i.naturalWidth / i.naturalHeight, cutie = c.width / c.height;
      const pierdut = sursa > cutie ? 1 - cutie / sursa : 1 - sursa / cutie;
      if (pierdut < 0.25 || sursa >= cutie) return [];   // doar portret în cutie lată
      const m = (i.getAttribute("src") || "").match(/url=([^&]+)/);
      return [{ f: m ? decodeURIComponent(m[1]) : i.getAttribute("src"), cutie: +cutie.toFixed(2) }];
    }),
  );
  for (const x of r) if (!rau.has(x.f + x.cutie)) rau.set(x.f + x.cutie, x);
}
await p.close();
const l = [...rau.values()];
const cel = (x, poz, et) =>
  `<figure><div class="c" style="aspect-ratio:${x.cutie}">
     <img src="http://localhost:3000${x.f}" style="object-position:${poz}"></div>
   <figcaption>${et}</figcaption></figure>`;
const html = `<!doctype html><meta charset="utf-8"><style>
 body{margin:0;background:#161616;font:11px system-ui;color:#bbb;padding:8px}
 .p{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:12px}
 .c{width:100%;background:#000;overflow:hidden}
 img{width:100%;height:100%;object-fit:cover;display:block}
 figure{margin:0}.r{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
 h3{color:#f74f22;font-size:12px;margin:0 0 3px}
</style><div class="r">
${l.map((x, i) => `<div><h3>${i + 1}. ${x.f.split("/").pop().slice(0, 26)}</h3>
  <div class="p">${cel(x, "50% 50%", "acum")}${cel(x, "50% 25%", "sus 25%")}</div></div>`).join("")}
</div>`;
writeFileSync(IESIRE + "/inainte-dupa.html", html);
const pg = await b.newPage({ viewport: { width: 1340, height: 1000 } });
await pg.goto("file://" + IESIRE + "/inainte-dupa.html", { waitUntil: "networkidle" });
await pg.waitForTimeout(1800);
await pg.screenshot({ path: IESIRE + "/inainte-dupa.png", fullPage: true });
writeFileSync(IESIRE + "/taiate.json", JSON.stringify(l, null, 1));
console.log("portret în cutie lată:", l.length);
await b.close();
