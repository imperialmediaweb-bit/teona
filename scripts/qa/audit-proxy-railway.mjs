/**
 * Auditul zonei `proxy` (4 noiembrie 2026): tot ce depinde de felul în care
 * cererea ajunge pe Railway — `Host: localhost:8080`, `x-forwarded-host`,
 * `x-forwarded-proto: https`, `x-real-ip` (și `cf-connecting-ip`).
 *
 * Cere un site pornit din build (`next start`) cu mențiunea
 * `scripts/qa/audit-proxy-mentiune.mjs` pentru Stripe/PayPal/Resend:
 *
 *   PORT=4421 … STRIPE_API=http://127.0.0.1:4422 PAYPAL_API=http://127.0.0.1:4422
 *   PAYPAL_WEBHOOK_ID=WH-AUDIT RADAR_SECRET=radar-secret-de-proba-1234 node_modules/.bin/next start
 *   BAZA=http://127.0.0.1:4421 MENTIUNE=http://127.0.0.1:4422 PAROLA_ADMIN=… \
 *   DATABASE_URL=postgres://…/teona_audit_3 node scripts/qa/audit-proxy-railway.mjs
 *
 * Numai pe o bază locală: scrie donații și cereri de probă.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import pg from "pg";

const BAZA = process.env.BAZA ?? "http://127.0.0.1:4421";
const MENTIUNE = process.env.MENTIUNE ?? "http://127.0.0.1:4422";
const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
const RADAR_SECRET = process.env.RADAR_SECRET ?? "radar-secret-de-proba-1234";
if (!PAROLA || !DATABASE_URL) {
  console.log("SĂRIT: cere PAROLA_ADMIN și DATABASE_URL (o bază locală).");
  process.exit(0);
}
if (/railway|teona-ariana/.test(DATABASE_URL)) {
  console.log("REFUZAT: scrie în baza de date; numai local.");
  process.exit(1);
}

let rele = 0;
const verifica = (ok, mesaj) => {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
};
const T = Date.now();
let ipN = 0;
const ipNou = () => `203.0.113.${(ipN++ % 200) + 10}`;

/** Antetele cu care ajunge o cerere pe Railway, în spatele Cloudflare. */
function railway(gazda = "teona-ariana.ro", extra = {}) {
  return {
    Host: "localhost:8080",
    "x-forwarded-host": gazda,
    "x-forwarded-proto": "https",
    "x-real-ip": ipNou(),
    ...extra,
  };
}
async function cere(cale, { metoda = "GET", gazda, antete = {}, corp, ip } = {}) {
  const h = railway(gazda, antete);
  if (ip) h["x-real-ip"] = ip;
  return fetch(`${BAZA}${cale}`, { method: metoda, headers: h, body: corp, redirect: "manual" });
}
const cookieDin = (r, nume) =>
  (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(`${nume}=`)) ?? null;
const locatie = (r) => r.headers.get("location") ?? "";
const relativ = (l) => /^\/(?![\/\\])/.test(l);

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();

try {
  // ─── 1. Intrarea, cookie-urile, ieșirea ─────────────────────────────
  const intra = await cere("/api/admin/intrare", {
    metoda: "POST",
    antete: { "content-type": "application/x-www-form-urlencoded", Origin: "https://teona-ariana.ro" },
    corp: new URLSearchParams({ parola: PAROLA, unde: "/admin/cifre" }),
  });
  verifica(intra.status === 303 && locatie(intra) === "/admin/cifre", `intrare: 303 cu Location relativ (${locatie(intra)})`);
  const sesiune = cookieDin(intra, "teona_verificare");
  verifica(
    !!sesiune && /; ?Secure/i.test(sesiune) && /HttpOnly/i.test(sesiune) && /SameSite=strict/i.test(sesiune) && /Path=\//.test(sesiune),
    "intrare: cookie Secure + HttpOnly + SameSite=strict + Path=/",
  );
  const COOKIE = sesiune?.split(";")[0] ?? "";

  const iese = await cere("/api/admin/iesire", { metoda: "POST", antete: { Cookie: COOKIE, Origin: "https://teona-ariana.ro" } });
  const sters = cookieDin(iese, "teona_verificare");
  verifica(iese.status === 303 && relativ(locatie(iese)) && /Max-Age=0/.test(sters ?? "") && /Secure/.test(sters ?? ""), "ieșire: Location relativ, cookie șters cu Secure");

  // ─── 2. TOATE rutele POST din /api/admin: Location relativ ──────────
  const radacina = new URL("../../src/app/api/admin", import.meta.url).pathname;
  const rute = [];
  (function umbla(d) {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) umbla(p);
      else if (n === "route.ts" && /export (async )?function POST/.test(readFileSync(p, "utf8"))) {
        rute.push("/api/admin" + d.slice(radacina.length));
      }
    }
  })(radacina);
  let absolute = [];
  for (const ruta of rute) {
    const r = await cere(ruta, {
      metoda: "POST",
      antete: { Cookie: COOKIE, Origin: "https://teona-ariana.ro", "content-type": "application/x-www-form-urlencoded" },
      corp: new URLSearchParams({ ce: "audit", id: "00000000-0000-0000-0000-000000000000" }),
    });
    const l = locatie(r);
    if (l && !relativ(l)) absolute.push(`${ruta} -> ${l}`);
    if (r.status >= 300 && r.status < 400 && !l) absolute.push(`${ruta} -> ${r.status} fără Location`);
  }
  verifica(absolute.length === 0, `${rute.length} rute POST din /api/admin: niciun Location absolut ${absolute.join("; ")}`);

  // ─── 3. www. și up.railway.app ──────────────────────────────────────
  for (const gazda of ["www.teona-ariana.ro", "site-production-641f.up.railway.app"]) {
    const g = await cere("/doneaza?x=1", { gazda });
    verifica(g.status === 308 && locatie(g) === "https://teona-ariana.ro/doneaza?x=1", `GET pe ${gazda} -> 308 spre canonic, cu query`);
    const h = await cere("/doneaza", { gazda, metoda: "HEAD" });
    verifica(h.status === 308, `HEAD pe ${gazda} -> 308`);
  }
  const webhookWww = await cere("/api/donatii/stripe/webhook", {
    gazda: "www.teona-ariana.ro",
    metoda: "POST",
    antete: { "stripe-signature": "t=1,v1=abc", "content-type": "application/json" },
    corp: "{}",
  });
  verifica(webhookWww.status === 400, `POST webhook Stripe pe www. nu se redirecționează: ${webhookWww.status} (400 = semnătură refuzată de rută)`);
  const apiGetWww = await cere("/api/contract/descarca", { gazda: "www.teona-ariana.ro" });
  verifica(apiGetWww.status !== 308, `GET /api/... pe www. nu se redirecționează (${apiGetWww.status})`);

  // ─── 4. Origin ──────────────────────────────────────────────────────
  const strain = await cere("/api/contact", { metoda: "POST", antete: { Origin: "https://evil.example", "content-type": "application/json" }, corp: "{}" });
  verifica(strain.status === 403, "POST /api cu Origin străin -> 403");
  const nul = await cere("/api/contact", { metoda: "POST", antete: { Origin: "null", "content-type": "application/json" }, corp: "{}" });
  verifica(nul.status === 403, "POST /api cu Origin: null -> 403");
  const wh = await cere("/api/donatii/stripe/webhook", { metoda: "POST", antete: { Origin: "https://evil.example", "stripe-signature": "t=1,v1=x" }, corp: "{}" });
  verifica(wh.status === 400, "webhook cu Origin străin trece de proxy (400 din rută)");
  const radarStrain = await cere("/api/radar", { metoda: "POST", antete: { Origin: "https://evil.example", "x-radar": "nu" } });
  verifica(radarStrain.status === 403 && (await radarStrain.text()).includes("Nu ai acces"), "/api/radar cu Origin străin trece de proxy (403 din rută, nu din proxy)");
  /*
    `fetch` din Node nu lasă antetul `Host` să fie suprascris, deci pentru
    verificarea asta cererea pleacă prin `node:http`, cu `Host: localhost:8080`
    chiar — cum vede serverul de pe Railway fiecare cerere.
  */
  const originGazda = await new Promise((rezolva, respinge) => {
    const u = new URL(BAZA);
    const r = http.request(
      {
        host: u.hostname,
        port: u.port,
        method: "POST",
        path: "/api/contact",
        headers: { ...railway(), Origin: "https://localhost:8080", "content-type": "application/json", "x-deschis": "5", "content-length": "2" },
      },
      (res) => { res.resume(); res.on("end", () => rezolva(res.statusCode)); },
    );
    r.on("error", respinge);
    r.end("{}");
  });
  verifica(originGazda === 403, `Origin: https://localhost:8080 (adresa internă a Railway) e refuzat (${originGazda}; 400 = a trecut de proxy și a ajuns în rută)`);

  // ─── 5. Limita de rată: pe x-real-ip, nu pe x-forwarded-for ────────
  const ipFix = ipNou();
  let coduri = [];
  for (let i = 1; i <= 6; i++) {
    const r = await cere("/api/admin/intrare", {
      metoda: "POST",
      ip: ipFix,
      antete: { "x-forwarded-for": `10.0.0.${i}`, "content-type": "application/x-www-form-urlencoded" },
      corp: new URLSearchParams({ parola: "gresit" }),
    });
    coduri.push(r.status);
  }
  verifica(coduri[5] === 429, `x-forwarded-for rotit nu ocolește limita (a 6-a: ${coduri[5]})`);
  coduri = [];
  for (let i = 1; i <= 6; i++) {
    const r = await cere("/api/admin/intrare", {
      metoda: "POST",
      ip: "104.16.1.9",
      antete: { "cf-connecting-ip": `198.51.100.${i}`, "content-type": "application/x-www-form-urlencoded" },
      corp: new URLSearchParams({ parola: "gresit" }),
    });
    coduri.push(r.status);
  }
  verifica(coduri[5] === 303, `în spatele Cloudflare se numără pe cf-connecting-ip (a 6-a: ${coduri[5]})`);
  coduri = [];
  for (let i = 1; i <= 6; i++) {
    const r = await cere("/api/admin/intrare", {
      metoda: "POST",
      ip: ipNou() && "203.0.113.250",
      antete: { "cf-connecting-ip": `198.51.100.${i}`, "content-type": "application/x-www-form-urlencoded" },
      corp: new URLSearchParams({ parola: "gresit" }),
    });
    coduri.push(r.status);
  }
  verifica(coduri[5] === 429, `cf-connecting-ip fără Cloudflare în față e ignorat (a 6-a: ${coduri[5]})`);

  // ─── 6. Radar ───────────────────────────────────────────────────────
  const faraSecret = await cere("/api/radar", { metoda: "POST" });
  verifica(faraSecret.status === 403 || faraSecret.status === 503, `/api/radar fără secret -> ${faraSecret.status}`);

  // ─── 7. 404 adevărat pentru sluguri ─────────────────────────────────
  const n404 = await cere(`/proiecte/nu-exista-${T}`);
  const corp404 = await n404.text();
  verifica(n404.status === 404 && corp404.includes("<title>") && n404.headers.get("cache-control") === "no-store", "/proiecte/<inexistent> -> 404 cu pagină HTML, no-store");
  const n404b = await cere(`/noutati/nu-exista-${T}`);
  verifica(n404b.status === 404, "/noutati/<inexistent> -> 404");
  const harta = await (await cere("/sitemap.xml")).text();
  const sluguri = [...harta.matchAll(/<loc>https?:\/\/[^/]+(\/proiecte\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  let rupte = 0;
  for (const s of sluguri) if ((await cere(s)).status !== 200) rupte++;
  verifica(sluguri.length > 0 && rupte === 0, `toate cele ${sluguri.length} proiecte din sitemap răspund 200 sub antetele Railway`);

  // ─── 8. Plăți: confirmare străină, PayPal de două ori, transfer de două ori ──
  const conf = await cere("/api/donatii/confirma", {
    metoda: "POST",
    antete: { Origin: "https://teona-ariana.ro", "x-deschis": "5", "content-type": "application/json" },
    corp: JSON.stringify({ sesiune: "cs_test_strain" + T }),
  });
  verifica(conf.status === 200 && (await conf.json()).stare === "necunoscuta", "confirma cu sesiune Stripe străină -> necunoscuta, 200");

  const comanda = `AUD${String(T).slice(-9)}`;
  await fetch(`${MENTIUNE}/__comanda?id=${comanda}&captura=CAP${comanda}&email=dublu.${T}@exemplu.ro`);
  await fetch(`${MENTIUNE}/__goleste`);
  const pp = { "paypal-auth-algo": "x", "paypal-cert-url": "x", "paypal-transmission-id": "x", "paypal-transmission-sig": "x", "paypal-transmission-time": "x", "content-type": "application/json" };
  for (const ev of ["A", "B"]) {
    await cere("/api/donatii/paypal/webhook", { gazda: "www.teona-ariana.ro", metoda: "POST", antete: pp, corp: JSON.stringify({ id: `WH-${T}-${ev}`, event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: comanda } }) });
  }
  await cere("/api/donatii/confirma", { metoda: "POST", antete: { Origin: "https://teona-ariana.ro", "x-deschis": "5", "content-type": "application/json" }, corp: JSON.stringify({ paypal: comanda }) });
  const randuriPP = await baza.query("SELECT stare FROM donatii WHERE procesator='paypal' AND referinta=$1", [`CAP${comanda}`]);
  const jurnal = await (await fetch(`${MENTIUNE}/__jurnal`)).json();
  const multumiri = jurnal.filter((j) => j.cale.startsWith("/emails") && JSON.stringify(j.corp.to ?? "").includes(`dublu.${T}`)).length;
  verifica(randuriPP.rows.length === 1 && randuriPP.rows[0].stare === "platita" && multumiri === 1, `PayPal APPROVED de două ori + pagina de mulțumire: o donație, o mulțumire (${randuriPP.rows.length} rânduri, ${multumiri} e-mailuri)`);

  const transfer = () =>
    cere("/api/donatii/transfer", {
      metoda: "POST",
      antete: { Origin: "https://teona-ariana.ro", "x-deschis": "5", "content-type": "application/x-www-form-urlencoded" },
      corp: new URLSearchParams({ nume: `Audit Transfer ${T}`, confirm: "da", suma: "150", destinatie: "tabere", data: "2026-11-03", email: `transfer.${T}@exemplu.ro` }),
    });
  await transfer();
  const t2 = await transfer();
  const randuriT = await baza.query("SELECT 1 FROM donatii WHERE nume=$1", [`Audit Transfer ${T}`]);
  verifica(t2.status === 200 && (await t2.json()).mesaj.includes("deja") && randuriT.rows.length === 1, "transfer anunțat de două ori: un singur rând, mesaj „deja notat”");

  // ─── 9. trimiteLa cu destinații rele ────────────────────────────────
  const rau = async (inapoi) =>
    cere("/api/admin/cereri", {
      metoda: "POST",
      antete: { Cookie: COOKIE, Origin: "https://teona-ariana.ro", "content-type": "application/x-www-form-urlencoded" },
      corp: new URLSearchParams({ actiune: "adauga", nume: "Audit Inapoi", telefon: "0700000001", fel: "contact", inapoi }),
    });
  for (const v of ["//evil.example", "/\\evil.example", "https://evil.example/x"]) {
    const r = await rau(v);
    verifica(r.status === 303 && locatie(r) === "/", `inapoi=${v} -> Location "/"`);
  }
  const crlf = await rau("/admin/cereri\r\nX-Injected: 1");
  verifica(crlf.status === 303, `inapoi cu CR LF nu dă 500 (acum: ${crlf.status})`);
  const diacritice = await rau("/admin/cereri?cauta=Ștefan");
  verifica(diacritice.status === 303, `inapoi cu diacritice nu dă 500 (acum: ${diacritice.status})`);
} finally {
  await baza.query("DELETE FROM donatii WHERE nume LIKE 'Audit Transfer %' OR email LIKE 'dublu.%@exemplu.ro'").catch(() => undefined);
  await baza.query("DELETE FROM cereri WHERE nume = 'Audit Inapoi'").catch(() => undefined);
  await baza.end();
}

console.log(rele ? `\n${rele} verificări CAD` : "\nToate verificările trec.");
process.exit(rele ? 1 : 0);
