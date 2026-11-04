/**
 * Audit „fisiere” (4 noiembrie 2026): formularele din panou care urcă fișiere,
 * lovite direct la rută, cu fișiere cum le trimit oamenii adevărați.
 *
 *   BAZA=http://127.0.0.1:4401 MENTIUNE=http://127.0.0.1:4402 PAROLA_ADMIN=… \
 *     node scripts/qa/audit-fisiere-rute.mjs
 *
 * Serverul: pornit din build, cu EMAIL_API/MAILERLITE_API spre mențiune,
 * fără chei Cloudinary/R2 (ca să nu urce nimic nicăieri).
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import net from "node:net";

const BAZA = process.env.BAZA ?? "http://127.0.0.1:4401";
const MENTIUNE = process.env.MENTIUNE ?? "http://127.0.0.1:4402";
const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN.");
  process.exit(2);
}
const IP = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
let rele = 0;
const verifica = (ok, mesaj) => {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
};
const nota = (m) => console.log(`     ${m}`);

// Antetele cu care ajunge o cerere pe Railway, din spatele Cloudflare.
const RAILWAY = {
  host: "localhost:8080",
  "x-forwarded-host": "teona-ariana.ro",
  "x-forwarded-proto": "https",
  "x-real-ip": "104.16.1.1",
  "cf-connecting-ip": "86.120.1.1",
  origin: "https://teona-ariana.ro",
};

// ─── Fișierele de probă ──────────────────────────────────────────────────
const zgomot = (w, h, canale, extra = {}) =>
  sharp({ create: { width: w, height: h, channels: canale, noise: { type: "gaussian", mean: 128, sigma: 60 }, ...extra } });
const jpeg1 = await zgomot(1400, 1000, 3).jpeg({ quality: 90 }).toBuffer();
const jpeg15 = await zgomot(5600, 4200, 3).jpeg({ quality: 98 }).toBuffer();
const png3 = await zgomot(1100, 800, 4).png().toBuffer();
const pngMeta = await sharp(png3).metadata();
const svg = Buffer.from(`<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120"><rect width="300" height="120" fill="#1a73e8"/><text x="20" y="75" font-size="48" fill="#fff">EGGER</text></svg>`);
// HEIC: „ftypheic” la octetul 4, apoi gunoi.
const heic = (mb) => Buffer.concat([Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]), Buffer.alloc(mb * 1024 * 1024, 7)]);
const pdf = (mb) => Buffer.concat([Buffer.from("%PDF-1.4\n%âãÏÓ\n"), Buffer.alloc(mb * 1024 * 1024, 0x41)]);
const mb = (b) => (b.length / 1048576).toFixed(1);
nota(`jpeg1 ${mb(jpeg1)} MB · jpeg15 ${mb(jpeg15)} MB · png3 ${mb(png3)} MB (alpha: ${pngMeta.hasAlpha}) · svg ${svg.length} B`);
verifica(jpeg15.length > 14 * 1048576 && jpeg15.length < 30 * 1048576, "poza de telefon are 14–30 MB");
verifica(png3.length > 2.5 * 1048576 && pngMeta.hasAlpha, "PNG-ul are peste 2,5 MB și transparență");

// ─── Sesiunea ────────────────────────────────────────────────────────────
let cookie = "";
async function cere(cale, optiuni = {}, railway = false) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: {
      ...(railway ? RAILWAY : { origin: BAZA, "x-forwarded-for": IP() }),
      ...(cookie ? { cookie } : {}),
      ...(optiuni.headers ?? {}),
    },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) if (c.startsWith("teona_verificare=")) cookie = c.split(";")[0];
  return r;
}
const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/sabloane" }),
});
verifica(intrare.status === 303 && cookie, `intrare în panou (${intrare.status})`);

const fd = (campuri, fisiere = []) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campuri)) f.set(k, v);
  for (const [camp, octeti, nume, tip] of fisiere) f.append(camp, new Blob([octeti], { type: tip }), nume);
  return f;
};
const jurnal = async () => (await fetch(`${MENTIUNE}/__jurnal`)).json();
const goleste = () => fetch(`${MENTIUNE}/__goleste`);
const loc = (r) => r.headers.get("location") ?? "";

// ═══ 1. /api/admin/sablon ═════════════════════════════════════════════════
console.log("\n── /api/admin/sablon");
const sablon = (campuri, fisiere, cale = "/api/admin/sablon", railway = false) =>
  cere(cale, { method: "POST", body: fd({ fel: "persoane", titlu: "Probă", text: "Un text de probă.", ...campuri }, fisiere) }, railway);

{
  // 1a. JPEG de 1 MB cu `File.type` gol (Windows). Blob cu type "" → partea
  // multipart pleacă cu application/octet-stream, exact ca din Chrome pe Windows.
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", jpeg1, "IMG_4231.jpg", ""]]);
  nota(`JPEG 1 MB, type gol: ${r.status} ${loc(r)}`);
  verifica(r.status === 200, "JPEG adevărat cu type gol e primit ca fotografie (nu „nu e o fotografie”)");
}
{
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", jpeg1, "IMG_4231.jpg", "application/octet-stream"]]);
  nota(`JPEG 1 MB, application/octet-stream: ${r.status} ${loc(r)}`);
  verifica(r.status === 200, "JPEG cu type octet-stream e primit ca fotografie");
}
{
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", jpeg15, "IMG_4231.jpg", ""]]);
  nota(`JPEG 15 MB, type gol: ${r.status} ${loc(r)}`);
  verifica(r.status === 303 && loc(r).includes("ratat=poza-mare"), "15 MB fără micșorare: „poza-mare”, nu „Cerere invalidă”");
  verifica(/^\/admin\/sabloane/.test(loc(r)), "Location e relativ");
}
{
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", png3, "sigla.png", "image/png"]]);
  nota(`PNG 3 MB cu transparență: ${r.status} ${loc(r)}`);
  verifica(r.status === 303 && loc(r).includes("ratat=fara-cloudinary"), "PNG cu alpha trece validarea (se oprește doar la lipsa Cloudinary)");
}
{
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", heic(2), "IMG_0001.heic", "image/heic"]]);
  nota(`HEIC 2 MB: ${r.status} ${loc(r)}`);
  verifica(r.status === 303 && loc(r).includes("ratat=poza-tip"), "HEIC de 2 MB: „nu e o fotografie (JPG/PNG/WebP)”");
  const r8 = await sablon({ fac: "vezi" }, [["poza_fisier", heic(8), "IMG_0002.heic", "image/heic"]]);
  nota(`HEIC 8 MB: ${r8.status} ${loc(r8)}`);
  verifica(loc(r8).includes("ratat=poza-tip"), "HEIC de 8 MB: spune că e formatul greșit, nu „micșoreaz-o întâi”");
}
{
  const nume = "Tabără, copii – iunie „2025”.jpg";
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", jpeg1, nume, "image/jpeg"]]);
  nota(`nume cu diacritice și virgulă: ${r.status} ${loc(r)}`);
  verifica(r.status === 303 && loc(r).includes("fara-cloudinary"), "numele cu diacritice/virgulă nu strică citirea formularului");
}
{
  // Alt gol → titlul; titlu foarte lung → ?
  const lung = "T".repeat(161);
  const r = await sablon({ titlu: lung, poza: "Teona/x/y", poza_alt: "" }, [], "/api/admin/sablon?previzualizare=1");
  const html = await r.text();
  const h1 = html.match(/<h1[^>]*>([^<]*)</)?.[1] ?? "";
  nota(`titlu de 161 de semne → titlul din e-mail: „${h1.slice(0, 50)}…”`);
  verifica(!html.includes("Titlul campaniei — îl scrii tu"), "un titlu de 161 de semne nu e înlocuit în tăcere cu exemplul");
  verifica(html.includes('alt="' + (h1 || "x")), "alt gol → poza poartă titlul");
}
{
  // Text lipit din Word: ghilimele tipografice, en-dash, nbsp.
  const text = "Dragi prieteni, „cu drag” – pentru copii.\r\n\r\nAl doilea paragraf.";
  const r = await sablon({ text }, [], "/api/admin/sablon?previzualizare=1");
  const html = await r.text();
  verifica(html.includes("„cu drag”") && html.includes(" – pentru") && (html.includes(" ") || html.includes("&nbsp;")), "caracterele din Word ajung întregi în e-mail");
  verifica((html.match(/Al doilea paragraf/g) ?? []).length === 1 && /<p[^>]*>[^<]*Al doilea paragraf/.test(html), "\\r\\n\\r\\n desparte paragrafele");
}
{
  // Titlul lipsă + „fă ciorna”: ce primește MailerLite?
  await goleste();
  const r = await sablon({ fac: "ciorna", titlu: "", text: "", grup: "g-pers" }, []);
  const j = await jurnal();
  const camp = j.find((x) => x.cale.startsWith("/campaigns") && x.metoda === "POST");
  nota(`ciornă fără titlu și fără text: ${r.status} ${loc(r)}; MailerLite a primit numele „${camp?.corp?.name}”`);
  verifica(!camp || !/îl scrii tu/.test(camp.corp?.name ?? ""), "ciorna fără titlu nu pleacă cu „Titlul campaniei — îl scrii tu”");
  const htmlTrimis = JSON.stringify(camp?.corp ?? {});
  verifica(!/Aici intră textul tău/.test(htmlTrimis), "ciorna fără text nu pleacă cu „Aici intră textul tău”");
}
{
  // Trimiterea campaniei, fără titlu, cu bifa și lista: pleacă?
  await goleste();
  const r = await sablon({ fac: "trimite", titlu: "", text: "", grup: "g-pers", confirm: "da" }, []);
  const j = await jurnal();
  const plecat = j.find((x) => /\/campaigns\/[^/]+\/schedule/.test(x.cale));
  nota(`„Trimite campania acum” fără titlu: ${r.status} ${loc(r)}; schedule la MailerLite: ${plecat ? "DA" : "nu"}`);
  verifica(!plecat, "campania fără titlu și text NU pleacă spre listă");
}
{
  // Proba cu poză, fără Cloudinary: ce mesaj?
  const r = await sablon({ fac: "proba", catre: "eu@exemplu.ro" }, [["poza_fisier", jpeg1, "a.jpg", "image/jpeg"]]);
  nota(`probă cu poză fără Cloudinary: ${r.status} ${loc(r)}`);
  verifica(loc(r).includes("ratat=fara-cloudinary"), "proba cu poză fără Cloudinary spune că urcarea nu e configurată");
  const pagina = await (await cere(loc(r))).text();
  verifica(/Urcarea fotografiilor nu e configurată/.test(pagina), "…și pagina arată mesajul");
}
{
  // Proba fără poză: linkurile din e-mail nu poartă localhost; Location relativ, în condiții Railway.
  await goleste();
  const r = await sablon({ fac: "proba", catre: "eu@exemplu.ro, colega@exemplu.ro" }, [], "/api/admin/sablon", true);
  const j = await jurnal();
  const emailuri = j.filter((x) => x.cale.startsWith("/emails"));
  nota(`probă (Railway): ${r.status} ${loc(r)}; e-mailuri plecate: ${emailuri.length}`);
  verifica(r.status === 303 && loc(r).startsWith("/admin/sabloane?facut=proba"), "proba: Location relativ, „a plecat”");
  verifica(emailuri.length === 2, "două adrese → două e-mailuri separate");
  const html = emailuri[0]?.corp?.html ?? "";
  verifica(!/localhost/.test(html) && /https:\/\/www\.teona-ariana\.ro\/politica-de-confidentialitate/.test(html), "dezabonarea din probă e pe ADRESA_SITE, nu localhost");
  verifica(!/\{\$unsubscribe\}/.test(html), "variabila MailerLite nu ajunge în proba trimisă prin Resend");
}
{
  // Previzualizarea, în condiții Railway, cu semnul de loc al pozei alese.
  const semn = "blob:https://teona-ariana.ro/7c1a1b2c-aaaa-4bbb-8ccc-000000000001";
  const r = await sablon({ poza_locala: semn, poza_alt: "Sala Unirii" }, [], "/api/admin/sablon?previzualizare=1", true);
  const html = await r.text();
  nota(`previzualizare (Railway): ${r.status}, ${html.length} B`);
  verifica(r.status === 200 && html.includes(`src="${semn}"`), "semnul de loc al pozei alese ajunge întreg în HTML");
  verifica(!/localhost/.test(html), "previzualizarea nu conține localhost");
  const srcuri = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  const straine = srcuri.filter((s) => !s.startsWith("https://www.teona-ariana.ro/") && !s.startsWith("blob:") && !s.startsWith("https://res.cloudinary.com/"));
  verifica(straine.length === 0, `toate pozele din e-mail sunt pe ADRESA_SITE / Cloudinary (${srcuri.length} src)`);
  // Ce face browserul cu HTML-ul ăsta (htmlPentruCadru), cu poza scrisă în pagină.
  const ts = (await import("typescript")).default;
  const sursa = readFileSync("src/lib/poza-browser.ts", "utf8");
  const js = ts.transpileModule(sursa, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { htmlPentruCadru } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const inCadru = htmlPentruCadru(html, semn, "data:image/jpeg;base64,/9j/AAAA");
  const srcCadru = [...inCadru.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  verifica(srcCadru.some((s) => s.startsWith("data:image/jpeg")) && !inCadru.includes("blob:"), "în cadru: poza aleasă e `data:`");
  verifica(srcCadru.filter((s) => !s.startsWith("data:")).every((s) => s.startsWith("/") || s.startsWith("https://res.cloudinary.com/")), "în cadru: pozele site-ului sunt relative");
  verifica(/<head><base target="_blank">/.test(inCadru), "în cadru: linkurile se deschid în altă filă (base target=_blank)");
  const hrefuri = [...inCadru.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  verifica(hrefuri.some((h) => h.startsWith("/doneaza")), `linkurile site-ului sunt relative în cadru (${hrefuri.length} href)`);
  // Un cadru `srcdoc` cu sandbox fără scripturi: HTML-ul n-are <script>.
  verifica(!/<script/i.test(inCadru), "e-mailul n-are script");
}

// ═══ 2. formularAdmin: 31 MB, corp rupt, chunked ══════════════════════════
console.log("\n── formularAdmin");
{
  const mare = Buffer.concat([jpeg15, jpeg15, jpeg15]);
  const r = await sablon({ fac: "vezi" }, [["poza_fisier", mare, "mare.jpg", "image/jpeg"]]);
  const corp = await r.text();
  nota(`${mb(mare)} MB cu Content-Length: ${r.status} — „${corp.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160)}”`);
  verifica(r.status === 413 && /prea mare/.test(corp) && /30,0 MB/.test(corp) && !/Cerere invalidă/.test(corp), "31+ MB anunțat: mesaj omenesc cu limita, 413");
}
// Corp rupt: multipart fără marginea de închidere (ca o rețea căzută în mijloc), cu Content-Length corect.
async function brut(cale, antete, corp) {
  const u = new URL(BAZA + cale);
  return new Promise((rezolva, respinge) => {
    const s = net.connect(Number(u.port), u.hostname, () => {
      const linii = [`POST ${u.pathname}${u.search} HTTP/1.1`, `Host: ${u.host}`, `Origin: ${BAZA}`, `Cookie: ${cookie}`, `X-Forwarded-For: ${IP()}`, ...Object.entries(antete).map(([k, v]) => `${k}: ${v}`), "Connection: close", "", ""];
      s.write(linii.join("\r\n"));
      s.write(corp);
    });
    let date = "";
    s.on("data", (d) => (date += d));
    s.on("end", () => rezolva(date));
    s.on("error", respinge);
    setTimeout(() => { s.destroy(); rezolva(date); }, 15000);
  });
}
{
  const marg = "----AuditTeona";
  const corp = Buffer.concat([
    Buffer.from(`--${marg}\r\nContent-Disposition: form-data; name="fel"\r\n\r\npersoane\r\n--${marg}\r\nContent-Disposition: form-data; name="poza_fisier"; filename="rupt.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    jpeg1.subarray(0, 200000),
    // fără \r\n--marg-- la final
  ]);
  const rasp = await brut("/api/admin/sablon", { "Content-Type": `multipart/form-data; boundary=${marg}`, "Content-Length": String(corp.length) }, corp);
  const stare = rasp.match(/^HTTP\/1\.1 (\d+)/)?.[1];
  const text = rasp.split("\r\n\r\n").slice(1).join("").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200);
  nota(`corp rupt (fără marginea de final): ${stare} — „${text}”`);
  verifica(stare === "400" && /N-am putut citi/.test(rasp) && !/Cerere invalidă/.test(rasp), "corpul rupt primește mesajul omenesc, nu „Cerere invalidă”");
}
{
  // 12 MB fără Content-Length (chunked): trece de formularAdmin?
  const r = await cere("/api/admin/sablon", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=----Chunk" },
    body: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(`------Chunk\r\nContent-Disposition: form-data; name="fel"\r\n\r\npersoane\r\n------Chunk\r\nContent-Disposition: form-data; name="poza_fisier"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`));
        c.enqueue(jpeg15);
        c.enqueue(new TextEncoder().encode(`\r\n------Chunk--\r\n`));
        c.close();
      },
    }),
    duplex: "half",
  });
  nota(`15 MB chunked, fără Content-Length: ${r.status} ${loc(r)}`);
  verifica(r.status === 303 && loc(r).includes("poza-mare"), "15 MB chunked: ruta îl citește și răspunde „poza-mare”");
}
{
  // 31 MB chunked, fără Content-Length: formularAdmin nu vede lungimea; Next taie la 30 MB.
  const mare = Buffer.concat([jpeg15, jpeg15, jpeg15]);
  const r = await cere("/api/admin/sablon", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=----Chunk" },
    body: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(`------Chunk\r\nContent-Disposition: form-data; name="fel"\r\n\r\npersoane\r\n------Chunk\r\nContent-Disposition: form-data; name="poza_fisier"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`));
        c.enqueue(mare);
        c.enqueue(new TextEncoder().encode(`\r\n------Chunk--\r\n`));
        c.close();
      },
    }),
    duplex: "half",
  }).catch((e) => ({ status: `eroare ${e.cause?.code ?? e.message}`, headers: new Headers(), text: async () => "" }));
  const corp = await r.text();
  nota(`${mb(mare)} MB chunked: ${r.status} — „${corp.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160)}”`);
  verifica(!/Cerere invalidă/.test(corp), "31 MB chunked: nu „Cerere invalidă”");
}
{
  // Rutele din panou fără formularAdmin: 31 MB la /api/admin/cereri.
  const mare = Buffer.concat([jpeg15, jpeg15, jpeg15]);
  const r = await cere("/api/admin/cereri", { method: "POST", body: fd({ actiune: "adauga" }, [["fisier", mare, "x.jpg", "image/jpeg"]]) });
  const corp = await r.text();
  nota(`/api/admin/cereri cu 31 MB: ${r.status} — „${corp.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 120)}”`);
  verifica(!/Cerere invalidă/.test(corp), "rutele fără fișiere nu mai răspund „Cerere invalidă” la un corp prea mare");
}

// ═══ 3. /api/admin/texte ═══════════════════════════════════════════════════
console.log("\n── /api/admin/texte");
const texte = (campuri, fisiere) =>
  cere("/api/admin/texte", { method: "POST", body: fd({ fel: "noutate", actiune: "salveaza", titlu: "Audit noutate", continut: "Un text de probă destul de lung ca să treacă.", ...campuri }, fisiere) });
{
  const r = await texte({ poza_alt: "Copii la masă" }, [["poza", jpeg1, "IMG_1.jpg", ""]]);
  const corp = await r.text();
  nota(`JPEG 1 MB type gol: ${r.status} ${loc(r)} ${corp.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 100)}`);
  verifica(!/nu pare o fotografie/.test(corp), "noutate: JPEG cu type gol nu e refuzat ca „nu pare o fotografie”");
}
{
  const r = await texte({ poza_alt: "Copii la masă" }, [["poza", jpeg15, "IMG_1.jpg", "image/jpeg"]]);
  const corp = await r.text();
  verifica(r.status === 400 && /prea mare/.test(corp), `noutate: 15 MB fără micșorare → „Poza e prea mare” (${r.status})`);
}
{
  const r = await texte({ titlu: "T".repeat(201) }, []);
  const corp = await r.text();
  verifica(r.status === 400 && /prea lung/.test(corp), "noutate: titlu de 201 semne → mesaj");
}
{
  const r = await texte({ poza_alt: "" }, [["poza", jpeg1, "IMG_1.jpg", "image/jpeg"]]);
  const corp = await r.text();
  verifica(r.status === 400 && /ce se vede în poză/i.test(corp), "noutate: poză fără descriere → mesaj omenesc");
}

// ═══ 4. /api/admin/sponsori ════════════════════════════════════════════════
console.log("\n── /api/admin/sponsori");
const sponsor = (campuri, fisiere) =>
  cere("/api/admin/sponsori", { method: "POST", body: fd({ nume: "Firma de probă", ...campuri }, fisiere) });
for (const [eticheta, octeti, nume, tip, asteptat] of [
  ["SVG cu type image/svg+xml", svg, "sigla.svg", "image/svg+xml", "depozit"],
  ["SVG cu type gol (Windows)", svg, "sigla.svg", "", "depozit"],
  ["PNG 3 MB cu alpha", png3, "sigla.png", "image/png", "depozit"],
  ["PNG cu type gol (Windows)", png3, "sigla.png", "", "depozit"],
  ["JPEG cu type gol (Windows)", jpeg1, "sigla.jpg", "", "depozit"],
  ["HEIC", heic(1), "sigla.heic", "image/heic", "imagine"],
  ["nume cu diacritice/virgulă", jpeg1, "Siglă, mare.jpg", "image/jpeg", "depozit"],
]) {
  const r = await sponsor({}, [["poza", octeti, nume, tip]]);
  nota(`${eticheta}: ${r.status} ${loc(r)}`);
  verifica(loc(r).includes(`stare=${asteptat}`), `${eticheta} → „${asteptat}” (${asteptat === "depozit" ? "trece validarea" : "refuzat ca imagine"})`);
}

// ═══ 5. /api/admin/documente și /api/admin/formulare ═══════════════════════
console.log("\n── /api/admin/documente, /api/admin/formulare");
{
  const r = await cere("/api/admin/documente", { method: "POST", body: fd({ slug: "contract-sponsorizare" }, [["fisier", pdf(12), "Contract 2026, model – nou.pdf", "application/pdf"]]) });
  nota(`PDF 12 MB: ${r.status} ${loc(r)}`);
  verifica(r.status === 303 && loc(r).includes("stare=mare"), "documente: PDF de 12 MB → „prea mare (peste 10 MB)”");
  const pagina = await (await cere(loc(r))).text();
  verifica(/prea mare \(peste 10 MB\)/.test(pagina), "…mesajul se vede pe pagină");
}
{
  const r = await cere("/api/admin/documente", { method: "POST", body: fd({ slug: "contract-sponsorizare" }, [["fisier", pdf(1), "Contract, nou – 2026.pdf", "application/pdf"]]) });
  nota(`PDF 1 MB: ${r.status} ${loc(r)}`);
  verifica(loc(r).includes("stare=depozit"), "documente: PDF bun trece validarea (se oprește la lipsa R2)");
}
{
  const r = await cere("/api/admin/documente", { method: "POST", body: fd({ slug: "contract-sponsorizare" }, [["fisier", pdf(31), "mare.pdf", "application/pdf"]]) });
  const corp = await r.text();
  verifica(r.status === 413 && /prea mare/.test(corp), `documente: PDF de 31 MB → 413 cu mesaj (${r.status})`);
}
{
  const r = await cere("/api/admin/formulare", { method: "POST", body: fd({ actiune: "urca-gol" }, [["fisier", pdf(12), "F230.pdf", "application/pdf"]]) });
  const corp = await r.text();
  nota(`formulare, PDF 12 MB: ${r.status} — „${corp.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 80)}”`);
  verifica(r.status === 400 && /prea mare/.test(corp), "formulare: PDF de 12 MB → „Fișierul e prea mare.”");
}
{
  const r = await cere("/api/admin/formulare", { method: "POST", body: fd({ actiune: "urca-gol" }, [["fisier", jpeg1, "F230.pdf", "application/pdf"]]) });
  const corp = await r.text();
  verifica(r.status === 400 && /nu e un PDF/.test(corp), "formulare: JPEG redenumit .pdf → „nu e un PDF”");
}

// ═══ 6. /api/admin/presa/trimite ═══════════════════════════════════════════
console.log("\n── /api/admin/presa/trimite");
// Sămânța se pune la prima deschidere a paginii.
await cere("/admin/presa");
const paginaPresa = await (await cere("/admin/presa")).text();
const contacte = [...paginaPresa.matchAll(/name="contact" value="([^"]+)"/g)].map((m) => m[1]);
nota(`redacții cu e-mail în formular: ${contacte.length}`);
const presa = (campuri, fisiere) => {
  const f = fd({ subiect: "Comunicat de probă", text: "Un comunicat de probă, destul de lung ca să treacă de verificarea de lungime a rutei.", confirm: "da", ...campuri }, fisiere);
  for (const c of contacte.slice(0, 2)) f.append("contact", c);
  return cere("/api/admin/presa/trimite", { method: "POST", body: f });
};
{
  await goleste();
  const r = await presa({}, [
    ["fisier", jpeg1, "Tabără, iunie – copii.jpg", "image/jpeg"],
    ["fisier", pdf(1), "Comunicat „oficial”.pdf", "application/pdf"],
    ["fisier", png3, "sigla.png", ""],
  ]);
  const j = await jurnal();
  const em = j.filter((x) => x.cale.startsWith("/emails"));
  nota(`3 atașamente (6 MB): ${r.status} ${loc(r)}; e-mailuri: ${em.length}; atașamente în primul: ${em[0]?.corp?.attachments?.map((a) => a.filename).join(" | ")}`);
  verifica(r.status === 303 && loc(r).includes("trimis=2"), "comunicat cu 3 atașamente → 2 e-mailuri, unul pe redacție");
  verifica(em[0]?.corp?.attachments?.length === 3 && em[0].corp.attachments[0].filename === "Tabără, iunie – copii.jpg", "numele cu diacritice/virgulă ajung întregi la Resend");
  verifica(em.every((e) => e.corp.to.length === 1), "fiecare e-mail are o singură adresă la „Către”");
}
{
  const r = await presa({}, [["fisier", jpeg15, "mare.jpg", "image/jpeg"]]);
  const corp = await r.text();
  verifica(r.status === 400 && /10 MB împreună/.test(corp), "presă: 15 MB într-un atașament → mesaj cu limita");
}
{
  const r = await presa({}, [["fisier", heic(1), "IMG.heic", "image/heic"]]);
  const corp = await r.text();
  verifica(r.status === 400 && /numai PDF, Word sau poze/.test(corp), "presă: HEIC refuzat cu mesaj");
}
{
  const r = await presa({}, [["fisier", jpeg1, "IMG_1.jpg", ""]]);
  nota(`presă: JPEG cu type gol: ${r.status} ${loc(r)}`);
  verifica(r.status === 303, "presă: type gol nu contează (se uită la nume)");
}
{
  const r = await presa({}, [["fisier", Buffer.from("MZ\x90\x00gunoi"), "virus.exe.jpg", "image/jpeg"]]);
  nota(`presă: fișier .exe.jpg: ${r.status} ${loc(r)}`);
  verifica(r.status === 400, "presă: un fișier care nu e poză, cu extensie .jpg, e refuzat");
}

console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
