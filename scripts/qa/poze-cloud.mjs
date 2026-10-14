/**
 * Proba potrivirii dintre folderele de poze și paginile de proiect.
 *
 * **Ce verifică.** Taberele scrise de asociație n-au poze în cod: și le iau
 * din Cloudinary, din folderul cu aceeași dată în nume. Proba pornește un
 * server care imită API-ul Cloudinary, cu numele adevărate ale folderelor
 * („TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025”), și verifică trei lucruri:
 *
 *   1. pagina fiecărei tabere afișează pozele din folderul ei, nu din altul;
 *   2. adresele pozelor sunt adrese Cloudinary, cu diacriticele și spațiile
 *      din numele folderului codificate corect;
 *   3. un folder care nu se potrivește cu nicio dată nu ajunge pe nicio pagină.
 *
 * Fără asta, o greșeală în potrivire s-ar vedea abia pe site, ca pozele unei
 * tabere pe pagina altei tabere — adică alți copii pe pagina greșită.
 *
 * Rulare: `node scripts/qa/poze-cloud.mjs`
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";

const CONT = "cont-de-proba";
const PORT_API = 4311;
const PORT_SITE = 4312;

/** Folderele, exact cum le-a scris asociația în Cloudinary. */
const DOSARE = {
  "Teona/2025": [
    "TABĂRĂ AUTISM 15-19 SEPTEMBRIE 2025",
    "TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025",
    "TABĂRĂ NEVĂZĂTORI 9-13 IUNIE 2025",
    "TABĂRĂ SURDO-MUȚI 16-20 IUNIE 2025",
    "POZE NESORTATE",
  ],
  "Teona/2026": [
    "TABĂRĂ SUSȚINEM PERFORMANȚA 6-10 IULIE 2026",
    "RESPIRO ÎMPREUNĂ 31 AUGUST - 4 SEPTEMBRIE 2026",
    "TABĂRĂ EGGER 7-11 SEPTEMBRIE 2026",
  ],
};

/** Ce se așteaptă pe fiecare pagină: slugul proiectului și folderul lui. */
const ASTEPTAT = [
  ["tabara-respiro-mame-si-copii-cu-autism-septembrie-2025", "TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025"],
  ["tabara-respiro-copii-cu-autism-15-19-septembrie-2025", "TABĂRĂ AUTISM 15-19 SEPTEMBRIE 2025"],
  ["tabara-respiro-copii-cu-deficiente-grave-de-vedere-iunie-2025", "TABĂRĂ NEVĂZĂTORI 9-13 IUNIE 2025"],
  ["tabara-respiro-copii-cu-deficiente-de-auz-si-vorbire-iunie-2025", "TABĂRĂ SURDO-MUȚI 16-20 IUNIE 2025"],
  ["tabara-respiro-sustinem-performanta-iulie-2026", "TABĂRĂ SUSȚINEM PERFORMANȚA 6-10 IULIE 2026"],
  ["respiro-impreuna-a-32-a-tabara-septembrie-2026", "RESPIRO ÎMPREUNĂ 31 AUGUST - 4 SEPTEMBRIE 2026"],
  ["tabara-respiro-septembrie-2026", "TABĂRĂ EGGER 7-11 SEPTEMBRIE 2026"],
];

const api = createServer((cer, raspunde) => {
  const adresa = new URL(cer.url, "http://local");
  const trimite = (date) => {
    raspunde.writeHead(200, { "content-type": "application/json" });
    raspunde.end(JSON.stringify(date));
  };

  // `/v1_1/<cont>/folders/Teona/2025`
  const dosar = adresa.pathname.match(/\/folders(?:\/(.*))?$/);
  if (dosar) {
    const cale = decodeURIComponent(dosar[1] ?? "");
    const copii = cale === "" ? ["Teona"] : (DOSARE[cale] ?? []);
    return trimite({
      folders: copii.map((nume) => ({
        name: nume,
        path: cale ? `${cale}/${nume}` : nume,
      })),
    });
  }

  // `/v1_1/<cont>/resources/image?prefix=...`
  if (adresa.pathname.endsWith("/resources/image")) {
    const prefix = adresa.searchParams.get("prefix") ?? "";
    return trimite({
      resources: [1, 2, 3].map((i) => ({
        public_id: `${prefix}/poza-${i}`,
        secure_url: `https://res.cloudinary.com/${CONT}/image/upload/${prefix}/poza-${i}.jpg`,
        width: 2000,
        height: 1333,
        format: "jpg",
        bytes: 900_000,
        created_at: `2026-10-0${i}T10:00:00Z`,
      })),
    });
  }

  raspunde.writeHead(404);
  raspunde.end("{}");
});

function asteapta(adresa, secunde = 180) {
  return new Promise((rezolva, respinge) => {
    const pana = Date.now() + secunde * 1000;
    const incearca = async () => {
      try {
        const r = await fetch(adresa);
        if (r.ok) return rezolva();
      } catch {}
      if (Date.now() > pana) return respinge(new Error(`${adresa} nu pornește`));
      setTimeout(incearca, 1000);
    };
    incearca();
  });
}

const greseli = [];
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) greseli.push(mesaj);
}

await new Promise((r) => api.listen(PORT_API, r));

const site = spawn("npm", ["run", "dev"], {
  env: {
    ...process.env,
    PORT: String(PORT_SITE),
    CLOUDINARY_API: `http://127.0.0.1:${PORT_API}/v1_1`,
    CLOUDINARY_CLOUD_NAME: CONT,
    CLOUDINARY_API_KEY: "cheie-de-proba",
    CLOUDINARY_API_SECRET: "secret-de-proba",
  },
  stdio: "ignore",
});

try {
  await asteapta(`http://127.0.0.1:${PORT_SITE}/proiecte`);

  for (const [slug, dosar] of ASTEPTAT) {
    const r = await fetch(`http://127.0.0.1:${PORT_SITE}/proiecte/${slug}`);
    const html = await r.text();
    const asteptata = encodeURI(`${dosar}/poza-1`).replace(/#/g, "%23");

    verifica(r.ok, `${slug}: pagina răspunde`);
    verifica(
      html.includes("res.cloudinary.com"),
      `${slug}: pozele vin de la Cloudinary`,
    );
    verifica(
      html.includes(asteptata),
      `${slug}: pozele sunt din „${dosar}”`,
    );

    // Niciun alt folder din același an nu are voie să apară pe pagina asta.
    const an = slug.includes("2025") ? "Teona/2025" : "Teona/2026";
    const strainele = DOSARE[an]
      .filter((n) => n !== dosar)
      .filter((n) => html.includes(encodeURI(`${n}/poza-1`)));
    verifica(
      strainele.length === 0,
      `${slug}: nicio poză din altă tabără${strainele.length ? ` (a intrat „${strainele[0]}”)` : ""}`,
    );
  }

  // Folderul fără dată în nume nu are unde să ajungă.
  const lista = await (
    await fetch(`http://127.0.0.1:${PORT_SITE}/proiecte`)
  ).text();
  verifica(
    !lista.includes(encodeURI("POZE NESORTATE")),
    "un folder fără dată în nume nu ajunge pe nicio pagină",
  );
} finally {
  site.kill("SIGTERM");
  api.close();
}

console.log(
  greseli.length === 0
    ? "\ntoate probele trec"
    : `\n${greseli.length} probe cad`,
);
process.exit(greseli.length === 0 ? 0 : 1);
