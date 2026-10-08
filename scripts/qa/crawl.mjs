import { browser, BAZA, urmaresteErori } from "./comun.mjs";
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const vazute = new Set();
const coada = ["/"];
const rezultate = {};
const extern = new Set();
const ancore = {};
while (coada.length) {
  const cale = coada.shift();
  if (vazute.has(cale)) continue;
  vazute.add(cale);
  const erori = urmaresteErori(page);
  const r = await page
    .goto(BAZA + cale, { waitUntil: "networkidle" })
    .catch((e) => ({ status: () => "ERR " + e.message }));
  await page.waitForTimeout(500);
  const titlu = await page.title().catch(() => "");
  const linkuri = await page.$$eval("a[href]", (as) =>
    as.map((a) => a.getAttribute("href")),
  );
  const ids = new Set(await page.$$eval("[id]", (els) => els.map((e) => e.id)));
  const interne = [];
  const ancoreLipsa = [];
  for (const h of linkuri) {
    if (!h) continue;
    if (h.startsWith("http") && !h.startsWith(BAZA)) {
      extern.add(h);
      continue;
    }
    if (/^(mailto|tel|sms):/.test(h)) continue;
    const [calePura, frag] = h.replace(BAZA, "").split("#");
    let p = calePura.split("?")[0];
    if (frag !== undefined && (p === "" || p === cale)) {
      if (frag && !ids.has(frag)) ancoreLipsa.push("#" + frag);
      continue;
    }
    if (p === "") continue;
    if (!p.startsWith("/")) p = "/" + p;
    interne.push(p);
    if (frag) (ancore[p] ??= new Set()).add(frag);
    if (!vazute.has(p)) coada.push(p);
  }
  rezultate[cale] = {
    status: r.status(),
    titlu,
    erori: [...new Set(erori)],
    nrLinkuri: interne.length,
    ancoreLipsa,
    ids: [...ids],
  };
  page.removeAllListeners();
}
// ancore spre alte pagini
const ancoreGresite = [];
for (const [p, frags] of Object.entries(ancore)) {
  const ids = new Set(rezultate[p]?.ids ?? []);
  for (const f of frags) if (!ids.has(f)) ancoreGresite.push(`${p}#${f}`);
}
for (const r of Object.values(rezultate)) delete r.ids;
console.log(
  JSON.stringify({ pagini: rezultate, ancoreGresite, externe: [...extern] }, null, 1),
);
await b.close();
