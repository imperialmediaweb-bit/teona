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
  /*
    Folderele din 2026, exact cum le-a numit asociația — citite din jurnalul
    Railway, nu ghicite. Două n-au nicio dată în nume, deci nu pot fi găsite
    prin potrivire: proiectele lor scriu numele folderului explicit, prin
    `dosarCloud`.
  */
  "Teona/2026": [
    "TABĂRĂ AUTISM 20-24 APRILIE 2026",
    "TABĂRĂ AUTISM 7-11 SEPTEMBRIE 2026",
    "TABĂRĂ ONCOLOGIE 2026",
    "TABĂRĂ PERFORMANȚA 2026",
  ],
  // Taberele mari au pozele împărțite pe subfoldere. Prima versiune citea
  // doar ce era direct în folder, iar tabăra a 32-a a ajuns pe site cu două
  // fotografii din câteva sute.
  "Teona/2026/TABĂRĂ ONCOLOGIE 2026": ["ZIUA 1", "GRUP"],
  // Campaniile stau direct sub rădăcină, nu într-un folder de an.
  Teona: ["2025", "2026", "BANCA PENTRU ALIMENTE", "aniversari"],
};

/** Ce se așteaptă pe fiecare pagină: slugul proiectului și folderul lui. */
const ASTEPTAT = [
  ["tabara-respiro-mame-si-copii-cu-autism-septembrie-2025", "TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025"],
  ["tabara-respiro-copii-cu-autism-15-19-septembrie-2025", "TABĂRĂ AUTISM 15-19 SEPTEMBRIE 2025"],
  ["tabara-respiro-copii-cu-deficiente-grave-de-vedere-iunie-2025", "TABĂRĂ NEVĂZĂTORI 9-13 IUNIE 2025"],
  ["tabara-respiro-copii-cu-deficiente-de-auz-si-vorbire-iunie-2025", "TABĂRĂ SURDO-MUȚI 16-20 IUNIE 2025"],
  ["tabara-respiro-sustinem-performanta-iulie-2026", "TABĂRĂ PERFORMANȚA 2026"],
  ["respiro-impreuna-a-32-a-tabara-septembrie-2026", "TABĂRĂ ONCOLOGIE 2026"],
  ["tabara-respiro-septembrie-2026", "TABĂRĂ AUTISM 7-11 SEPTEMBRIE 2026"],
  ["tabara-respiro-copii-cu-autism-aprilie-2026", "TABĂRĂ AUTISM 20-24 APRILIE 2026"],
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

  /*
    `/v1_1/<cont>/resources/by_asset_folder?asset_folder=...`

    Contul asociației e pe „dynamic folders”, unde folderul e un câmp separat
    de identificator. Serverul de probă se purta ca un cont în modul vechi, de
    aceea proba trecea în timp ce producția raporta toate folderele goale. Acum
    imită modul nou: răspunde pe folder, iar căutarea pe identificator
    (`prefix`) întoarce zero, exact ca Cloudinary.
  */
  if (adresa.pathname.endsWith("/resources/by_asset_folder")) {
    const dosar = adresa.searchParams.get("asset_folder") ?? "";
    return trimite({
      resources: [
        /*
          Fișierul care nu e o fotografie, pus dinadins primul.

          În folderele adevărate ale taberelor au ajuns fișiere
          `New_Text_Document_….txt`, urcate din greșeală odată cu pozele.
          Cloudinary le întoarce ca orice altă resursă, cu
          `resource_type: "raw"` și fără lățime. Ajungeau în galerie ca un
          dreptunghi gol — și, fiindcă lista se sortează cu cea mai nouă
          prima, tocmai pe locul mare din capul ei. Asta era „eroarea la
          poze" semnalată de asociație la taberele din septembrie 2025.

          Stă primul și e cel mai nou: dacă filtrul dispare, proba cade pe
          fotografia de copertă, nu pe o numărătoare pe care ar putea-o
          trece din întâmplare.
        */
        {
          public_id: `New_Text_Document_probă.txt`,
          secure_url: `https://res.cloudinary.com/${CONT}/raw/upload/New_Text_Document_probă.txt`,
          resource_type: "raw",
          format: "txt",
          bytes: 12,
          created_at: "2026-10-09T10:00:00Z",
        },
        ...[1, 2, 3].map((i) => ({
          public_id: `${dosar}/poza-${i}`,
          secure_url: `https://res.cloudinary.com/${CONT}/image/upload/${dosar}/poza-${i}.jpg`,
          resource_type: "image",
          width: 2000,
          height: 1333,
          format: "jpg",
          bytes: 900_000,
          created_at: `2026-10-0${i}T10:00:00Z`,
        })),
      ],
    });
  }

  // Căutarea pe identificator nu întoarce nimic într-un cont „dynamic”.
  if (adresa.pathname.endsWith("/resources/image")) {
    return trimite({ resources: [] });
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

/** Portul e liber? Dacă nu, acolo stă un server străin și proba n-are sens. */
async function liber(port) {
  try {
    await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(2000),
    });
    return false;
  } catch {
    return true;
  }
}

if (!(await liber(PORT_SITE))) {
  console.error(
    `Portul ${PORT_SITE} e deja ocupat. Oprește serverul de acolo: proba ar verifica alt cod decât cel de acum.`,
  );
  process.exit(1);
}

await new Promise((r) => api.listen(PORT_API, r));

/*
  Serverul de probă pornește într-un grup de procese separat.

  `npm run dev` pornește la rândul lui `next dev`. Un `kill` pe npm îl lasă pe
  `next` în viață, cu portul ocupat: la rulările următoare proba se conecta la
  serverul rămas de la rularea dinainte și verifica o versiune veche a
  codului. A dat două „căderi” care nu existau, pe foldere care între timp
  fuseseră redenumite în probă. Cu `detached`, `kill` pe grup îi ia pe
  amândoi.
*/
const site = spawn("npm", ["run", "dev"], {
  detached: true,
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
    const gasite = [
      ...new Set(
        (html.match(/res\.cloudinary\.com\/[^"\\ ]+/g) ?? []).map((u) =>
          u.replace(/^.*\/upload\/[^/]+\//, ""),
        ),
      ),
    ];
    verifica(
      html.includes(asteptata),
      `${slug}: pozele sunt din „${dosar}”${
        html.includes(asteptata) ? "" : ` (am găsit: ${gasite.join(", ")})`
      }`,
    );

    // Niciun alt folder din același an nu are voie să apară pe pagina asta.
    const an = slug.includes("2025") ? "Teona/2025" : "Teona/2026";
    const strainele = DOSARE[an]
      .filter((n) => n !== dosar)
      .filter((n) => html.includes(encodeURI(`${n}/poza-1`)));
    /*
      Fișierul care nu e fotografie n-are voie în pagină.

      Serverul de probă îl întoarce primul și cel mai nou, deci fără filtru
      ar ajunge tocmai pe locul mare din capul galeriei — exact cum s-a
      întâmplat pe site la taberele din septembrie 2025.
    */
    verifica(
      !html.includes("New_Text_Document"),
      `${slug}: fișierul care nu e poză nu intră în galerie`,
    );

    verifica(
      strainele.length === 0,
      `${slug}: nicio poză din altă tabără${strainele.length ? ` (a intrat „${strainele[0]}”)` : ""}`,
    );
  }

  // Campaniile: folder scris explicit, direct sub rădăcină.
  for (const [slug, dosar] of [
    ["banca-pentru-alimente", "BANCA PENTRU ALIMENTE"],
    ["aniversari", "aniversari"],
  ]) {
    const html = await (
      await fetch(`http://127.0.0.1:${PORT_SITE}/proiecte/${slug}`)
    ).text();
    verifica(
      html.includes(encodeURI(`Teona/${dosar}/poza-1`)),
      `${slug}: pozele vin din „${dosar}”`,
    );
    // Fără dată cunoscută, pagina nu are voie să arate una.
    verifica(
      !/<time dateTime="[^"]+">[^<]+<\/time>/.test(html),
      `${slug}: nu arată nicio dată`,
    );
  }

  // Pozele din subfoldere ajung și ele pe pagina taberei.
  const oncologie = await (
    await fetch(
      `http://127.0.0.1:${PORT_SITE}/proiecte/respiro-impreuna-a-32-a-tabara-septembrie-2026`,
    )
  ).text();
  for (const sub of DOSARE["Teona/2026/TABĂRĂ ONCOLOGIE 2026"]) {
    verifica(
      oncologie.includes(encodeURI(`${sub}/poza-1`)),
      `a 32-a tabără: pozele din subfolderul „${sub}” sunt pe pagină`,
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
  try {
    process.kill(-site.pid, "SIGTERM");
  } catch {
    site.kill("SIGTERM");
  }
  api.close();
}

console.log(
  greseli.length === 0
    ? "\ntoate probele trec"
    : `\n${greseli.length} probe cad`,
);
process.exit(greseli.length === 0 ? 0 : 1);
