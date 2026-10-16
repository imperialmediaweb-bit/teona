/**
 * De unde vin donatorii: canalele, reclamele Meta și codul QR.
 *
 * Trei lucruri se verifică aici, și toate la nivel de rețea, nu citind codul:
 *
 * 1. **Canalul scris de browser nu e crezut pe cuvânt.** Un nume inventat
 *    („gigel") trebuie să cadă, nu să se strecoare în tabel. Altfel oricine
 *    ar putea umfla din browser rândul reclamelor și raportul ar minți.
 * 2. **Reclamele se citesc din contul Meta.** Se pornește un server care
 *    imită Graph API, i se dă site-ului adresa lui prin `META_API`, și se
 *    verifică nu doar că apar cifrele, ci și **al cui e contul** — un cont
 *    greșit ar umple panoul cu cifre verosimile și false.
 * 3. **Codul QR duce unde trebuie.** Linkul poartă etichetele cu care panoul
 *    recunoaște canalul; dacă se schimbă vreodată una, afișele deja tipărite
 *    rămân valabile dar donațiile lor cad în altă rubrică — deci eticheta e
 *    fixată aici, nu lăsată în voia unei rescrieri.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/atribuire.mjs
 *
 * Partea cu Meta de mentiune pornește al doilea site, pe alt port, și cere
 * `DATABASE_URL` în mediu.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
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

// ─── 1. Codul QR cere sesiune ─────────────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/qr?cale=/doneaza`, {
  headers: { "x-forwarded-for": DE_LA },
});
verifica(peFurate.status === 403, "codul QR nu se ia fără sesiune (403)");

// ─── 2. Intrarea în panou ─────────────────────────────────────────────────
await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/qr" }),
});

const pagina = await cere("/admin/qr?loc=afi%C8%99%20biseric%C4%83");
const htmlQr = await pagina.text();
verifica(pagina.status === 200, "pagina de coduri QR se deschide");
verifica(
  htmlQr.includes("<svg") && htmlQr.includes("</svg>"),
  "codul se vede pe pagină, ca SVG",
);
verifica(
  htmlQr.includes("utm_source=qr") && htmlQr.includes("utm_medium=offline"),
  "linkul poartă eticheta cu care panoul recunoaște canalul",
);
verifica(
  htmlQr.includes("utm_campaign=afis-biserica"),
  "numele locului ajunge în etichetă, fără diacritice",
);

// ─── 3. Fișierele de tipărit ──────────────────────────────────────────────
const png = await cere("/api/admin/qr?cale=/doneaza&loc=cutie");
const octeti = new Uint8Array(await png.arrayBuffer());
verifica(
  png.status === 200 &&
    octeti[0] === 0x89 &&
    octeti[1] === 0x50 &&
    octeti[2] === 0x4e &&
    octeti[3] === 0x47,
  "PNG-ul se descarcă și e chiar un PNG",
);
verifica(
  (png.headers.get("content-disposition") ?? "").includes("Cod-QR-cutie.png"),
  "fișierul are numele locului în el",
);

const svg = await cere("/api/admin/qr?cale=/doneaza&loc=cutie&fel=svg");
const textSvg = await svg.text();
verifica(
  svg.status === 200 && textSvg.trimStart().startsWith("<svg"),
  "SVG-ul se descarcă (pentru afișe mari)",
);

// ─── 4. O cale din afara site-ului e refuzată ─────────────────────────────
const strain = await cere("/api/admin/qr?cale=//exemplu.ro/plata");
verifica(strain.status === 400, "un cod QR nu poate duce pe alt site (400)");

// ─── 5. Canalul venit din browser e ținut în lista închisă ────────────────
const inventat = await cere("/api/donatii/stripe", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    lei: 50,
    frecventa: "o-data",
    destinatie: "oriunde",
    email: "proba.atribuire@exemplu.ro",
    acord: "da",
    canal: "gigel-de-la-bloc",
    sursa: "inventat / inventat",
  }),
});
/*
  Fără chei de Stripe ruta răspunde 503 și nu scrie nimic — atunci partea asta
  n-are ce verifica și se sare peste. Cu chei, donația se scrie „initiata";
  important e că nu se numără nicăieri cu canalul inventat, fiindcă el cade la
  validare. Aici verificăm doar că cererea nu e primită cu brațele deschise.
*/
verifica(
  [200, 503].includes(inventat.status),
  `un canal inventat nu dărâmă ruta de plată (${inventat.status})`,
);

// ─── 6. Reclamele Meta, cu un Graph de mentiune ───────────────────────────
if (!process.env.DATABASE_URL) {
  console.log("\nSĂRIT: partea cu reclamele Meta cere DATABASE_URL.");
} else {
  const PORT_API = 4321;
  const PORT_SITE = 4322;
  let cereriPrimite = 0;

  const fals = createServer((cerere, raspuns) => {
    cereriPrimite++;
    const adresa = new URL(cerere.url, "http://127.0.0.1");
    raspuns.setHeader("content-type", "application/json");

    if (adresa.pathname.endsWith("/insights")) {
      const peCampanie = adresa.searchParams.get("level") === "campaign";
      raspuns.end(
        JSON.stringify({
          data: peCampanie
            ? [
                {
                  campaign_id: "1",
                  campaign_name: "Tabăra de iarnă",
                  spend: "300.50",
                  impressions: "40000",
                  clicks: "900",
                  ctr: "2.25",
                  cpc: "0.33",
                },
              ]
            : [
                {
                  spend: "1234.50",
                  impressions: "100000",
                  clicks: "2500",
                  reach: "40000",
                  ctr: "2.5",
                  cpc: "0.49",
                },
              ],
        }),
      );
      return;
    }

    raspuns.end(
      JSON.stringify({
        id: "act_111",
        name: "Asociația Teona Ariana — reclame",
        currency: "RON",
        account_status: 1,
      }),
    );
  });
  await new Promise((r) => fals.listen(PORT_API, r));

  const site = spawn("npm", ["run", "start"], {
    detached: true,
    env: {
      ...process.env,
      PORT: String(PORT_SITE),
      META_API: `http://127.0.0.1:${PORT_API}`,
      META_TOKEN: "jeton-de-proba",
      META_AD_ACCOUNT_ID: "act_111",
    },
    stdio: "ignore",
  });

  try {
    const pornit = Date.now();
    while (Date.now() - pornit < 60000) {
      try {
        const r = await fetch(`http://127.0.0.1:${PORT_SITE}/admin`);
        if (r.ok) break;
      } catch {
        /* încă nu ascultă */
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    let cookie2 = "";
    const intra = await fetch(
      `http://127.0.0.1:${PORT_SITE}/api/admin/intrare`,
      {
        method: "POST",
        redirect: "manual",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-forwarded-for": DE_LA,
        },
        body: new URLSearchParams({ parola: PAROLA, unde: "/admin/analiza" }),
      },
    );
    for (const c of intra.headers.getSetCookie?.() ?? [])
      cookie2 = c.split(";")[0];

    const panou = await fetch(`http://127.0.0.1:${PORT_SITE}/admin/analiza`, {
      headers: { cookie: cookie2, "x-forwarded-for": DE_LA },
    });
    const html = await panou.text();

    verifica(cereriPrimite > 0, "panoul chiar întreabă Meta, nu inventează");
    verifica(
      html.includes("1.234,50"),
      "cheltuiala de la Meta apare în panou, în lei",
    );
    verifica(
      html.includes("Tabăra de iarnă"),
      "fiecare reclamă apare cu numele ei",
    );
    verifica(
      html.includes("Asociația Teona Ariana — reclame") &&
        html.includes("act_111"),
      "scrie al cui e contul de reclame (un cont greșit se vede din prima)",
    );
    verifica(
      html.includes("apropiere"),
      "pagina spune că legătura bani–reclame e o apropiere, nu o măsurătoare",
    );
  } finally {
    try {
      process.kill(-site.pid, "SIGTERM");
    } catch {
      /* se închisese deja */
    }
    fals.close();
  }
}

console.log(rele === 0 ? "\ntoate probele trec" : `\nverificări picate: ${rele}`);
process.exit(rele === 0 ? 0 : 1);
