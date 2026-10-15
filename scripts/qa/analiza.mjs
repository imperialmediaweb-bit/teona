/**
 * Analiza din panou: profilurile și ce pleacă spre model.
 *
 * Proba se uită la un singur lucru cu adevărat: **ce iese din asociație**.
 * Cifrele agregate pot pleca spre serverele altcuiva; numele donatorilor, nu.
 * Restul verificărilor sunt de bun-simț — pagina răspunde, nu merge fără
 * parolă, butonul nu face nimic fără cheie.
 *
 * Verificarea cea importantă se face la nivel de rețea, nu citind codul: se
 * pornește un server care imită API-ul Anthropic, i se dă site-ului adresa
 * lui prin `ANTHROPIC_API`, și se citește ce a primit. Dacă vreodată cineva
 * adaugă în rezumat o coloană cu e-mailuri, proba cade aici.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/analiza.mjs
 *
 * Partea cu serverul fals rulează doar dacă `DATABASE_URL` e în mediu — ea
 * pornește al doilea site, pe alt port, cu aceeași bază de date.
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

/*
  O adresă nouă la fiecare rulare.

  Intrarea în panou e limitată la cinci încercări la cincisprezece minute, pe
  adresă, iar în dezvoltare toate cererile vin de la aceeași. Fără antetul
  ăsta, proba merge o dată și la a doua rulare pică cu 429 — care arată ca o
  defecțiune a panoului, nu ca limita făcându-și treaba. (`198.51.100.0/24` e
  rezervat pentru documentație.)
*/
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

// ─── 1. Fără sesiune, nimic ───────────────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/analiza`, {
  method: "POST",
  redirect: "manual",
  // Și cererea asta are nevoie de adresa proaspătă: analiza e limitată la
  // trei pe oră, iar fără ea a doua rulare primește 429 în loc de 403.
  headers: { "x-forwarded-for": DE_LA },
});
verifica(
  peFurate.status === 403,
  `fără sesiune, analiza e refuzată (${peFurate.status})`,
);

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/analiza" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 2. Pagina ────────────────────────────────────────────────────────────
const html = await (await cere("/admin/analiza")).text();
for (const bucata of [
  "Profilul donatorilor",
  "Profilul firmelor",
  "Ce se vede în cifre",
]) {
  verifica(html.includes(bucata), `pagina are „${bucata}"`);
}

/*
  Rezumatul de pe pagină — același text care pleacă spre model.

  Se citește din blocul „Vezi exact ce s-ar trimite", care e acolo tocmai ca
  să poată fi citit, și de un om, și de proba asta.
*/
const rezumat = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)?.[1] ?? "";
verifica(rezumat.length > 200, `rezumatul se vede pe pagină (${rezumat.length} caractere)`);
verifica(
  !rezumat.includes("@"),
  "în rezumat nu e nicio adresă de e-mail",
);
verifica(
  !/\b0[0-9]{9}\b/.test(rezumat),
  "în rezumat nu e niciun număr de telefon",
);

/*
  Numele donatorilor, luate din exportul panoului, căutate în rezumat.

  Nu o listă scrisă aici — aceea ar merge o dată, pe baza de date de atunci.
  Se iau din export, nu din pagină: exportul are coloane, deci se știe care
  celulă e un nume de om. Prima încercare citea numele dintr-un link de pe
  pagina de donatori și a cules „Casa Teona", care e o destinație de donație,
  nu un om — proba cădea pe o scurgere care nu exista.
*/
const csv = await (await cere("/api/admin/export?ce=donatori")).text();
const [capete, ...randuri] = csv
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .map((rand) => rand.split(";").map((c) => c.replace(/^"|"$/g, "").trim()));
const coloanaNume = (capete ?? []).indexOf("Nume");
const nume = [
  ...new Set(
    randuri
      .map((r) => (coloanaNume >= 0 ? (r[coloanaNume] ?? "") : ""))
      .filter((n) => n.length > 3),
  ),
].slice(0, 10);
if (nume.length > 0) {
  const scapate = nume.filter((n) => rezumat.includes(n));
  verifica(
    scapate.length === 0,
    `niciunul dintre cele ${nume.length} nume din panou nu e în rezumat${
      scapate.length ? ` — scăpate: ${scapate.join(", ")}` : ""
    }`,
  );
} else {
  console.log("~~~ n-am găsit nume în panou, sar peste verificarea lor");
}

// ─── 3. Ce ajunge chiar la model ──────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.log(
    "~~~ fără DATABASE_URL nu pornesc al doilea site; sar peste proba cu serverul fals",
  );
} else {
  const PORT_API = 4311;
  const PORT_SITE = 4312;
  let primit = "";

  const fals = createServer((cer, raspunde) => {
    let corp = "";
    cer.on("data", (b) => (corp += b));
    cer.on("end", () => {
      primit = corp;
      raspunde.writeHead(200, { "content-type": "application/json" });
      raspunde.end(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: "## Ce spun cifrele\nUn răspuns de probă.\n\n## De făcut în următoarele patru săptămâni\n- Nimic, e doar o probă.",
            },
          ],
        }),
      );
    });
  });
  await new Promise((r) => fals.listen(PORT_API, r));

  const site = spawn("npm", ["run", "start"], {
    detached: true,
    env: {
      ...process.env,
      PORT: String(PORT_SITE),
      ANTHROPIC_API: `http://127.0.0.1:${PORT_API}`,
      ANTHROPIC_API_KEY: "cheie-de-proba",
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
    const intra = await fetch(`http://127.0.0.1:${PORT_SITE}/api/admin/intrare`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": DE_LA,
      },
      body: new URLSearchParams({ parola: PAROLA, unde: "/admin/analiza" }),
    });
    for (const c of intra.headers.getSetCookie?.() ?? [])
      cookie2 = c.split(";")[0];

    const facuta = await fetch(`http://127.0.0.1:${PORT_SITE}/api/admin/analiza`, {
      method: "POST",
      redirect: "manual",
      headers: { cookie: cookie2, "x-forwarded-for": DE_LA },
    });
    verifica(
      facuta.status === 303 &&
        !new URL(facuta.headers.get("location"), BAZA).searchParams.has("ratat"),
      `analiza se face și întoarce pe pagină (${facuta.status} → ${facuta.headers.get("location")})`,
    );

    verifica(primit.length > 0, "serverul fals a primit o cerere");
    verifica(
      primit.includes("DONATORI") && primit.includes("FIRME"),
      "cererea conține cifrele agregate",
    );
    verifica(
      !primit.includes("@"),
      "în cererea trimisă nu e nicio adresă de e-mail",
    );
    const scapate = nume.filter((n) => primit.includes(n));
    verifica(
      scapate.length === 0,
      `niciun nume de donator în cererea trimisă${
        scapate.length ? ` — scăpate: ${scapate.join(", ")}` : ""
      }`,
    );

    const dupa = await fetch(`http://127.0.0.1:${PORT_SITE}/admin/analiza`, {
      headers: { cookie: cookie2 },
    });
    const htmlDupa = await dupa.text();
    verifica(
      htmlDupa.includes("Un răspuns de probă"),
      "analiza salvată se vede pe pagină",
    );
  } finally {
    try {
      process.kill(-site.pid);
    } catch {
      /* se închisese singur */
    }
    fals.close();
  }
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
