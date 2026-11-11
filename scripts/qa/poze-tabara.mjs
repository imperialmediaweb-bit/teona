/**
 * Proba urcării pozelor de galerie din panou (tabără, noutate, campanie).
 *
 * Asociația n-are cont în Cloudinary. Proba face exact ce face omul din
 * panou, într-un browser adevărat: deschide ciorna, alege trei poze (una de
 * telefon, de 9 MB, una mică și un fișier text redenumit în .jpg), apasă
 * „Urcă pozele”, salvează, publică, apoi caută pozele pe pagina publică.
 *
 * Cloudinary e imitat de un server local, care ține minte ce s-a urcat și în
 * ce folder, și le dă înapoi la listare — aceeași cale pe care o citește
 * site-ul. Pornește singură serverul de dezvoltare (`next dev`, fiindcă
 * `CLOUDINARY_API` e ignorată în producție).
 *
 * Rulare: `DATABASE_URL=… node scripts/qa/poze-tabara.mjs` — numai pe o bază
 * locală: face și șterge texte.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const CONT = "cont-de-proba";
const PORT_API = 4321;
const PORT_SITE = 4322;
const BAZA = `http://localhost:${PORT_SITE}`;
const PAROLA = "proba-locala-12345";

if (!process.env.DATABASE_URL) {
  console.error("Lipsește DATABASE_URL (o bază locală).");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

/* ---------- Cloudinary de mențiune ---------- */

/** folder → [{ public_id, width, height }] */
const urcate = new Map();
let nr = 0;

const api = createServer(async (cer, rasp) => {
  const url = new URL(cer.url, "http://x");
  const bucati = [];
  for await (const b of cer) bucati.push(b);
  const corp = Buffer.concat(bucati);
  const json = (o, s = 200) => {
    rasp.writeHead(s, { "content-type": "application/json" });
    rasp.end(JSON.stringify(o));
  };

  if (cer.method === "POST" && url.pathname === `/v1_1/${CONT}/image/upload`) {
    const f = await new Response(corp, {
      headers: { "content-type": cer.headers["content-type"] },
    }).formData();
    const folder = String(f.get("folder") ?? "");
    const fisier = f.get("file");
    // Planul gratuit Cloudinary refuză imaginile peste 10 MB.
    if (fisier.size > 10 * 1024 * 1024) {
      return json({ error: { message: `File size too large. Got ${fisier.size}. Maximum is 10485760.` } }, 400);
    }
    const meta = await sharp(Buffer.from(await fisier.arrayBuffer())).metadata().catch(() => null);
    if (!meta) return json({ error: { message: "Invalid image file" } }, 400);
    const p = { public_id: `poza${++nr}`, width: meta.width, height: meta.height, bytes: fisier.size };
    if (!urcate.has(folder)) urcate.set(folder, []);
    urcate.get(folder).push({ ...p, created_at: new Date(Date.now() + nr).toISOString() });
    return json(p);
  }

  const cale = decodeURIComponent(url.pathname.replace(`/v1_1/${CONT}/`, ""));
  if (cale === "resources/by_asset_folder") {
    const lista = urcate.get(url.searchParams.get("asset_folder")) ?? [];
    return json({
      resources: lista.map((p) => ({
        ...p,
        secure_url: `https://res.cloudinary.com/${CONT}/image/upload/${p.public_id}.jpg`,
        format: "jpg",
        resource_type: "image",
      })),
    });
  }
  if (cale.startsWith("resources/image")) return json({ resources: [] });
  if (cale === "folders" || cale.startsWith("folders/")) {
    const parinte = cale === "folders" ? "" : cale.slice("folders/".length);
    const copii = new Set();
    for (const k of urcate.keys()) {
      const rest = parinte ? (k.startsWith(parinte + "/") ? k.slice(parinte.length + 1) : null) : k;
      if (rest) copii.add(rest.split("/")[0]);
    }
    return json({
      folders: [...copii].map((n) => ({ name: n, path: parinte ? `${parinte}/${n}` : n })),
    });
  }
  json({ error: { message: "nu știu " + cale } }, 404);
});
await new Promise((r) => api.listen(PORT_API, "127.0.0.1", r));

/* ---------- site ---------- */

const site = spawn("node_modules/.bin/next", ["dev", "-p", String(PORT_SITE)], {
  detached: true,
  env: {
    ...process.env,
    PAROLA_ADMIN: PAROLA,
    SECRET_SESIUNE: "secret-de-proba-foarte-lung-pentru-verificare",
    CLOUDINARY_API: `http://127.0.0.1:${PORT_API}/v1_1`,
    CLOUDINARY_CLOUD_NAME: CONT,
    CLOUDINARY_API_KEY: "cheie-de-proba",
    CLOUDINARY_API_SECRET: "secret-de-proba",
  },
  stdio: ["ignore", process.env.JURNAL_SITE ? "inherit" : "ignore", process.env.JURNAL_SITE ? "inherit" : "ignore"],
});

async function asteapta(adresa) {
  for (let i = 0; i < 180; i++) {
    try {
      const r = await fetch(adresa);
      if (r.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("serverul n-a pornit");
}

const fisiere = {
  mare: "/tmp/poza-telefon-proba.jpg",
  mica: "/tmp/poza-mica-proba.png",
  falsa: "/tmp/nu-e-poza-proba.jpg",
};
await sharp({
  create: { width: 4000, height: 3000, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 60 } },
})
  .jpeg({ quality: 100 })
  .toFile(fisiere.mare);
await sharp({ create: { width: 300, height: 200, channels: 3, background: "#f74f22" } })
  .png()
  .toFile(fisiere.mica);
await import("node:fs").then((fs) => fs.writeFileSync(fisiere.falsa, "nu sunt o fotografie"));

let browser;
try {
  await asteapta(`${BAZA}/admin`);
  globalThis.__urm = true;
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const pag = await (await browser.newContext()).newPage();
  pag.on("response", async (r) => {
    if (r.status() >= 400 && !r.url().includes("_next")) {
      console.log("raspuns", r.status(), r.url(), (await r.text().catch(() => "")).slice(0, 300));
    }
  });

  // Intrare.
  await pag.goto(`${BAZA}/admin`);
  await pag.fill("input[name=parola]", PAROLA);
  await Promise.all([pag.waitForURL(/\/admin/), pag.press("input[name=parola]", "Enter")]);

  for (const fel of ["proiect", "noutate"]) {
    const titlu = `Tabără de probă ${fel} ${Date.now()}`;
    await pag.goto(`${BAZA}/admin/scrie/nou?fel=${fel}`, { timeout: 120_000 });
    await pag.fill("input[name=titlu]", titlu);
    await pag.locator("[data-editor]").click(); await pag.keyboard.type("Un text de probă, destul de lung cât să treacă verificarea.");
    if (fel === "proiect") {
      await pag.fill("input[name=dataInceput]", "2026-06-08");
    }
    // Ciorna întâi, ca să aibă id.
    await Promise.all([
      pag.waitForURL(/\/admin\/scrie\/[0-9a-f-]{36}/, { timeout: 120_000 }),
      // Panoul nu mai are buton de ciornă pentru un text nou (se publică
      // direct); ruta primește încă `salveaza`, iar proba are nevoie de un
      // text nepublicat ca să urce pozele înainte de „Publică”.
      pag.evaluate(() => {
        const f = document.querySelector('form[action="/api/admin/texte"]');
        const i = document.createElement("input");
        i.type = "hidden"; i.name = "actiune"; i.value = "salveaza";
        f.append(i); f.submit();
      }),
    ]);
    const id = pag.url().match(/scrie\/([0-9a-f-]{36})/)[1];

    const buton = pag.getByRole("button", { name: "Urcă pozele" });
    await buton.waitFor({ timeout: 120_000 }).catch(() => {});
    if (!(await buton.isVisible())) {
      await pag.screenshot({ path: "/tmp/poze-tabara-cade.png", fullPage: true });
      console.log("adresa:", pag.url());
    }
    verifica(await buton.isVisible(), `${fel}: butonul „Urcă pozele” e în ciornă`);
    await pag.setInputFiles("input[type=file][multiple]", [fisiere.mare, fisiere.mica, fisiere.falsa]);
    await buton.click();
    const stare = pag.locator("[role=status]").filter({ hasText: /Gata|Nicio/ });
    await stare.waitFor({ timeout: 120_000 });
    const text = await stare.textContent();
    verifica(/Gata: 2 poze urcate/.test(text), `${fel}: două poze urcate, cea falsă nu („${text}”)`);
    const greseala = await pag.locator("[data-greseli-poze] li").allTextContents();
    verifica(
      greseala.some((g) => g.includes("nu-e-poza-proba.jpg")),
      `${fel}: fișierul care nu e poză e numit pe față`,
    );

    const dosar = [...urcate.keys()].find((k) => k.includes(titlu.toLocaleUpperCase("ro-RO")));
    verifica(Boolean(dosar), `${fel}: folderul s-a făcut singur (${dosar})`);
    const mare = (urcate.get(dosar) ?? []).find((p) => p.width >= 1000);
    verifica(
      mare && Math.max(mare.width, mare.height) <= 2000 && mare.bytes < 5_000_000,
      `${fel}: poza de telefon a fost micșorată în browser (${mare?.width}×${mare?.height}, ${mare?.bytes} octeți)`,
    );

    // Câmpul din formular știe de folder: salvarea nu șterge legătura.
    const valoare = await pag.locator("[name=dosarCloud]").inputValue();
    verifica(valoare === dosar, `${fel}: ciorna arată folderul nou (${valoare})`);

    // Reîncărcare: legătura e în baza de date, nu doar în pagină.
    await pag.reload();
    await pag.locator("[name=dosarCloud]").first().waitFor({ state: "attached", timeout: 120_000 });
    verifica(
      (await pag.locator("[name=dosarCloud]").inputValue()) === dosar,
      `${fel}: după reîncărcare folderul e tot ales`,
    );

    // Publicare și pagina publică.
    await Promise.all([
      pag.waitForURL(/gata=publicat/, { timeout: 120_000 }),
      pag.click("button[name=actiune][value=publica]"),
    ]);
    const lista = await (await fetch(`${BAZA}/${fel === "proiect" ? "proiecte" : "noutati"}`)).text();
    const slug = (lista.match(new RegExp(`/${fel === "proiect" ? "proiecte" : "noutati"}/(tabara-de-proba-${fel}-\\d+)`)) ?? [])[1];
    verifica(Boolean(slug), `${fel}: textul publicat e în listă (${slug})`);
    const publica = await (await fetch(`${BAZA}/${fel === "proiect" ? "proiecte" : "noutati"}/${slug}`)).text();
    const gasite = (urcate.get(dosar) ?? []).filter((p) => publica.includes(p.public_id));
    verifica(gasite.length === 2, `${fel}: pagina publică arată cele două poze (${gasite.length})`);

    // Curățenie.
    const sterge = new FormData();
    sterge.set("id", id);
    sterge.set("actiune", "sterge");
    const cookie = (await pag.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
    await fetch(`${BAZA}/api/admin/texte`, {
      method: "POST",
      body: sterge,
      headers: { cookie, origin: BAZA },
      redirect: "manual",
    });
  }

  // Multe poze mari, ca de pe telefon: tot ce e fotografie trebuie să urce.
  {
    const fs = await import("node:fs");
    const dir = "/tmp/poze-multe-proba";
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir);
    const lista = [];
    const zgomot = (w, h) => sharp({ create: { width: w, height: h, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 70 } } });
    for (let i = 0; i < Number(process.env.CATE ?? 110); i++) {
      const p = `${dir}/IMG_${1000 + i}.jpg`;
      await zgomot(4032, 3024).jpeg({ quality: 98 }).toFile(p);
      lista.push(p);
    }
    for (let i = 0; i < 4; i++) {
      const p = `${dir}/captura-${i}.png`;
      await zgomot(2400, 1800).png({ compressionLevel: 0 }).toFile(p);
      lista.push(p);
    }
    for (let i = 0; i < 3; i++) {
      const p = `${dir}/poza-${i}.webp`;
      await zgomot(4000, 3000).webp({ quality: 100 }).toFile(p);
      lista.push(p);
    }
    const uriasa = `${dir}/48-megapixeli.jpg`;
    await zgomot(8000, 6000).jpeg({ quality: 95 }).toFile(uriasa);
    lista.push(uriasa);
    const rotita = `${dir}/telefon-vertical.jpg`;
    await zgomot(4032, 3024).jpeg({ quality: 98 }).withMetadata({ orientation: 6 }).toFile(rotita);
    lista.push(rotita);
    const marimi = lista.map((p) => fs.statSync(p).size);
    console.log(
      `     ${lista.length} poze, între ${(Math.min(...marimi) / 1e6).toFixed(1)} și ${(Math.max(...marimi) / 1e6).toFixed(1)} MB, în total ${(marimi.reduce((a, b) => a + b, 0) / 1e6).toFixed(0)} MB`,
    );

    const titlu = `Tabără multe poze ${Date.now()}`;
    await pag.goto(`${BAZA}/admin/scrie/nou?fel=proiect`, { timeout: 120_000 });
    await pag.waitForTimeout(1500);
    verifica(
      (await pag.inputValue("input[name=titlu]")) === "",
      "un text nou se deschide gol, fără titlul celui salvat înainte",
    );
    await pag.fill("input[name=titlu]", titlu);
    await pag.locator("[data-editor]").click(); await pag.keyboard.type("Un text de probă, destul de lung cât să treacă verificarea.");
    await pag.fill("input[name=dataInceput]", "2026-07-06");
    await Promise.all([
      pag.waitForURL(/\/admin\/scrie\/[0-9a-f-]{36}/, { timeout: 120_000 }),
      // Panoul nu mai are buton de ciornă pentru un text nou (se publică
      // direct); ruta primește încă `salveaza`, iar proba are nevoie de un
      // text nepublicat ca să urce pozele înainte de „Publică”.
      pag.evaluate(() => {
        const f = document.querySelector('form[action="/api/admin/texte"]');
        const i = document.createElement("input");
        i.type = "hidden"; i.name = "actiune"; i.value = "salveaza";
        f.append(i); f.submit();
      }),
    ]);
    const id = pag.url().match(/scrie\/([0-9a-f-]{36})/)[1];
    const buton = pag.getByRole("button", { name: "Urcă pozele" });
    await buton.waitFor({ timeout: 120_000 });
    await pag.setInputFiles("input[type=file][multiple]", lista);
    const inceput = Date.now();
    await buton.click();
    const stare = pag.locator("[role=status]").filter({ hasText: /Gata|Nicio/ });
    await stare.waitFor({ timeout: 900_000 });
    const text = await stare.textContent();
    const secunde = Math.round((Date.now() - inceput) / 1000);
    verifica(text.includes(`Gata: ${lista.length} poze urcate`), `multe: toate ${lista.length} au urcat, în ${secunde} s („${text}”)`);
    const greseli = await pag.locator("[data-greseli-poze] li").allTextContents();
    verifica(greseli.length === 0, `multe: nicio eroare (${greseli.join(" | ") || "—"})`);
    const dosar = [...urcate.keys()].find((k) => k.includes(titlu.toLocaleUpperCase("ro-RO")));
    const cele = urcate.get(dosar) ?? [];
    const maxim = Math.max(...cele.map((p) => p.bytes));
    verifica(maxim < 10 * 1024 * 1024, `multe: cea mai mare poză trimisă are ${(maxim / 1e6).toFixed(1)} MB, sub limita Cloudinary`);
    verifica(cele.every((p) => Math.max(p.width, p.height) <= 2000), "multe: toate micșorate la cel mult 2000 px");
    const vert = cele.find((p) => p.height > p.width);
    verifica(Boolean(vert), "multe: poza verticală de telefon a rămas verticală");

    await Promise.all([
      pag.waitForURL(/gata=publicat/, { timeout: 120_000 }),
      pag.click("button[name=actiune][value=publica]"),
    ]);
    const lst = await (await fetch(`${BAZA}/proiecte`)).text();
    const slug = (lst.match(/\/proiecte\/(tabara-multe-poze-\d+)/) ?? [])[1];
    if (!slug) console.log("     în listă:", [...lst.matchAll(/\/proiecte\/([a-z0-9-]*(?:proba|multe)[a-z0-9-]*)/g)].map((m) => m[1]).slice(0, 6), lst.includes("multe poze"), lst.length);
    const publica = await (await fetch(`${BAZA}/proiecte/${slug}`)).text();
    const gasite = cele.filter((p) => publica.includes(p.public_id + "\"") || publica.includes(p.public_id + "&") || publica.includes(p.public_id + "?") || publica.includes(p.public_id));
    verifica(gasite.length === lista.length, `multe: pagina publică are toate ${lista.length} poze (${gasite.length})`);

    // Ștearsă, nu mai e în listă nici la prima deschidere.
    {
      const st = new FormData();
      st.set("id", id);
      st.set("actiune", "sterge");
      const ck = (await pag.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
      await fetch(`${BAZA}/api/admin/texte`, { method: "POST", body: st, headers: { cookie: ck, origin: BAZA }, redirect: "manual" });
      const dupa = await (await fetch(`${BAZA}/proiecte`)).text();
      verifica(!dupa.includes(slug), "tabăra ștearsă dispare din listă pe loc");
    }

    // Un fișier peste 25 MB, nemicșorabil (nu e imagine): mesaj clar, nu cădere.
    const urias = `${dir}/arhiva.jpg`;
    fs.writeFileSync(urias, Buffer.alloc(26 * 1024 * 1024, 7));
    await pag.setInputFiles("input[type=file][multiple]", [urias]);
    await buton.click();
    await pag.locator("[role=status]").filter({ hasText: /Gata|Nicio/ }).waitFor({ timeout: 120_000 });
    const g2 = await pag.locator("[data-greseli-poze] li").allTextContents();
    verifica(g2.some((g) => g.includes("arhiva.jpg")), `fișier de 26 MB: mesaj cu numele lui (${g2.join(" | ")})`);

    const sterge = new FormData();
    sterge.set("id", id);
    sterge.set("actiune", "sterge");
    const cookie = (await pag.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
    await fetch(`${BAZA}/api/admin/texte`, { method: "POST", body: sterge, headers: { cookie, origin: BAZA }, redirect: "manual" });
  }

  // Fără sesiune: nimic nu urcă.
  const fara = new FormData();
  fara.set("nume", "ORICE");
  fara.set("poza", new Blob([new Uint8Array([0xff, 0xd8, 0xff])]), "x.jpg");
  const r = await fetch(`${BAZA}/api/admin/poze-tabara`, { method: "POST", body: fara, headers: { origin: BAZA } });
  verifica(r.status === 403, `fără sesiune, urcarea e refuzată (${r.status})`);
} finally {
  await browser?.close();
  try {
    process.kill(-site.pid);
  } catch {}
  api.close();
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
