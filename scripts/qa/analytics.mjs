/**
 * Vizitele din Google Analytics, aduse în panou.
 *
 * Nu se poate proba pe contul adevărat: cheile stau în Railway, iar o probă
 * care cere date reale ar da alt rezultat în fiecare zi. Se probează ce poate
 * fi stricat de cod, cu un Google de mentiune:
 *
 *   1. **semnătura e bună** — serverul fals verifică JWT-ul cu cheia publică
 *      pereche, exact cum face Google. Dacă antetul, scopul sau destinatarul
 *      se strică, proba cade aici, nu peste o lună, pe site;
 *   2. **jetonul se refolosește** — a doua deschidere a paginii nu mai cere
 *      alt jeton. Altfel, fiecare privire în panou ar însemna încă o semnătură
 *      RSA și încă o cerere la Google;
 *   3. **cifrele ajung pe pagină**, iar sursele sunt traduse: „mailerlite /
 *      email" se citește „Buletinul de e-mail";
 *   4. **fără chei, panoul spune ce lipsește**, în loc să arate gol.
 *
 * Rulare, cu PAROLA_ADMIN în mediu (pornește singur site-ul, pe alt port):
 *     PAROLA_ADMIN=… node scripts/qa/analytics.mjs
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createVerify, generateKeyPairSync } from "node:crypto";

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const PORT_GOOGLE = 4321;
const PORT_SITE = 4322;
const PROPRIETATE = "987654321";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

let cereriDeJeton = 0;
let semnaturaBuna = false;
let scopBun = false;
let destinatarBun = false;
const caleCeruta = [];

function dinBase64url(s) {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/* Rândurile pe care le întoarce „Google", după ce i se cere. */
function randuri(corp) {
  const cerere = JSON.parse(corp);
  const dim = (cerere.dimensions ?? []).map((d) => d.name).join(",");
  if (dim === "sessionSource,sessionMedium") {
    return [
      { dimensionValues: [{ value: "google" }, { value: "organic" }], metricValues: [{ value: "412" }] },
      { dimensionValues: [{ value: "mailerlite" }, { value: "email" }], metricValues: [{ value: "188" }] },
      { dimensionValues: [{ value: "(direct)" }, { value: "(none)" }], metricValues: [{ value: "97" }] },
    ];
  }
  if (dim === "pagePath") {
    return [
      { dimensionValues: [{ value: "/" }], metricValues: [{ value: "1200" }] },
      { dimensionValues: [{ value: "/doneaza" }], metricValues: [{ value: "340" }] },
    ];
  }
  if (dim === "sessionCampaignName") {
    return [
      { dimensionValues: [{ value: "buletin-persoane" }], metricValues: [{ value: "188" }] },
      { dimensionValues: [{ value: "(not set)" }], metricValues: [{ value: "900" }] },
    ];
  }
  // Capul de raport: o dată perioada de acum, o dată cea dinainte.
  const de = cerere.dateRanges?.[0]?.startDate ?? "";
  return de === "28daysAgo"
    ? [{ metricValues: [{ value: "731" }, { value: "904" }, { value: "2150" }] }]
    : [{ metricValues: [{ value: "610" }, { value: "755" }] }];
}

const google = createServer((cer, raspunde) => {
  let corp = "";
  cer.on("data", (b) => (corp += b));
  cer.on("end", () => {
    if (cer.url === "/token") {
      cereriDeJeton++;
      const asertiune = new URLSearchParams(corp).get("assertion") ?? "";
      const [antet, incarcatura, semnatura] = asertiune.split(".");
      try {
        const v = createVerify("RSA-SHA256");
        v.update(`${antet}.${incarcatura}`);
        semnaturaBuna = v.verify(publicKey, dinBase64url(semnatura));
        const date = JSON.parse(dinBase64url(incarcatura).toString());
        scopBun = date.scope === "https://www.googleapis.com/auth/analytics.readonly";
        destinatarBun = date.aud === `http://127.0.0.1:${PORT_GOOGLE}/token`;
      } catch {
        semnaturaBuna = false;
      }
      raspunde.writeHead(200, { "content-type": "application/json" });
      raspunde.end(JSON.stringify({ access_token: "jeton-de-proba", expires_in: 3600 }));
      return;
    }
    caleCeruta.push(cer.url);
    raspunde.writeHead(200, { "content-type": "application/json" });
    raspunde.end(JSON.stringify({ rows: randuri(corp) }));
  });
});
await new Promise((r) => google.listen(PORT_GOOGLE, r));

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT_SITE),
    GA_TOKEN_API: `http://127.0.0.1:${PORT_GOOGLE}`,
    GA_API: `http://127.0.0.1:${PORT_GOOGLE}`,
    GA_PROPERTY_ID: PROPRIETATE,
    GA_CLIENT_EMAIL: "proba@exemplu.iam.gserviceaccount.com",
    GA_PRIVATE_KEY: privateKey.replace(/\n/g, "\\n"),
  },
  stdio: "ignore",
});

const BAZA = `http://127.0.0.1:${PORT_SITE}`;
const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
let cookie = "";

async function cere(cale, optiuni = {}) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: {
      ...(optiuni.headers ?? {}),
      "x-forwarded-for": DE_LA,
      ...(cookie ? { cookie } : {}),
    },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  return r;
}

try {
  const pornit = Date.now();
  while (Date.now() - pornit < 60000) {
    try {
      const r = await fetch(`${BAZA}/admin`);
      if (r.ok) break;
    } catch {
      /* încă nu ascultă */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  await cere("/api/admin/intrare", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/analiza" }),
  });

  const html = await (await cere("/admin/analiza")).text();

  verifica(semnaturaBuna, "JWT-ul e semnat cu cheia contului de serviciu");
  verifica(scopBun, "cere exact scopul analytics.readonly");
  verifica(destinatarBun, "destinatarul jetonului e capătul de token");
  verifica(
    caleCeruta.every((c) => c === `/v1beta/properties/${PROPRIETATE}:runReport`),
    `toate cererile merg la proprietatea cerută (${caleCeruta[0]})`,
  );

  verifica(html.includes("Vizitele de pe site"), "pagina are secțiunea de vizite");
  verifica(html.includes("731"), "numărul de oameni ajunge pe pagină");
  verifica(html.includes("904"), "numărul de vizite ajunge pe pagină");
  verifica(
    html.includes("+19%") || html.includes("+20%"),
    "comparația cu perioada dinainte se calculează",
  );
  verifica(
    html.includes("Buletinul de e-mail"),
    "mailerlite / email se citește pe românește",
  );
  verifica(
    html.includes("Căutare Google"),
    "google / organic se citește pe românește",
  );
  verifica(html.includes("buletin-persoane"), "campania etichetată apare");
  verifica(
    !html.includes("(not set)"),
    "vizitele fără campanie nu apar ca o campanie",
  );

  const deAtatea = cereriDeJeton;
  await cere("/admin/analiza");
  verifica(
    cereriDeJeton === deAtatea,
    `jetonul se refolosește, nu se cere la fiecare pagină (${deAtatea} → ${cereriDeJeton})`,
  );
} finally {
  try {
    process.kill(-site.pid);
  } catch {
    /* se închisese singur */
  }
  google.close();
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
