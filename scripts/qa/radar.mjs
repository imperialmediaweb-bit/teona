/**
 * Radarul de finanțări, pus la probă cu un API de mențiune.
 *
 * Radarul caută singur pe internet și scrie în baza de date, fără ca nimeni
 * să apese nimic. Asta face din el lucrul cel mai ușor de stricat în tăcere:
 * dacă începe să inventeze linkuri, sau dacă moare de tot, panoul arată
 * exact la fel — o listă liniștită. Patru lucruri trebuie să fie adevărate și
 * să rămână adevărate:
 *
 *   1. **o adresă care n-a apărut într-un rezultat de căutare se aruncă.**
 *      Ăsta e singurul lucru care stă între un model care scrie un link
 *      verosimil și un om care sună o fundație care nu există. Proba pune
 *      API-ul de mențiune să întoarcă o pistă cu adresă inventată, pe lângă
 *      una adevărată, și verifică în baza de date că a intrat numai a doua;
 *   2. **o căutare picată se vede ca eroare**, nu ca „n-am găsit nimic".
 *      Unealta de căutare nu aruncă excepții: la eroare întoarce HTTP 200 și
 *      un `content` care e *obiect* în loc de *listă*. Fără verificarea
 *      `Array.isArray`, scanarea ar raporta liniștit zero piste;
 *   3. **conversația oprită la jumătate se reia.** Cu unelte pe server, API-ul
 *      se oprește după zece pași cu `pause_turn`. Dacă reluarea nu merge,
 *      radarul vede doar prima jumătate din internet, fără să spună nimic;
 *   4. **o pistă respinsă de un om nu învie.** Altfel lista ar fi, după o
 *      lună, aceleași rânduri respinse care se întorc în fiecare luni.
 *
 * Plus capătul de cron, care cheltuiește bani la fiecare apel: fără secret și
 * cu secret greșit trebuie să refuze.
 *
 * Rulare (nu cere chei adevărate și nu atinge internetul):
 *     PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/radar.mjs
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { Client } from "pg";

const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
const SECRET = "secret-de-proba-pentru-radar-lung";

if (!PAROLA || !DATABASE_URL) {
  console.error(
    "Lipsesc PAROLA_ADMIN sau DATABASE_URL.\n" +
      "  PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/radar.mjs",
  );
  process.exit(2);
}

const PORT_API = 4321;
const PORT_SITE = 4322;

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const ADEVARATA = "https://exemplu-finantator.invalid/apel-2027";
const A_DOUA = "https://exemplu-fundatie.invalid/program-copii";
const INVENTATA = "https://nu-a-fost-niciodata-in-rezultate.invalid/apel";

/** Un bloc de rezultate de căutare, cum îl întoarce unealta când merge. */
const rezultate = (adrese) => ({
  type: "web_search_tool_result",
  tool_use_id: "srvtoolu_probă",
  content: adrese.map((url) => ({
    type: "web_search_result",
    url,
    title: "Pagină de probă",
    encrypted_content: "x",
    page_age: null,
  })),
});

/** Același bloc, dar la eroare: `content` e obiect, nu listă. */
const cautareStricata = () => ({
  type: "web_search_tool_result",
  tool_use_id: "srvtoolu_probă",
  content: { type: "web_search_tool_result_error", error_code: "max_uses_exceeded" },
});

const piste = (lista) => ({
  type: "text",
  text:
    "Am căutat și am găsit următoarele.\n\n```json\n" +
    JSON.stringify(lista) +
    "\n```",
});

const pista = (url, titlu) => ({
  url,
  titlu,
  finantator: "Finanțator de probă",
  termen: "31 ianuarie 2027",
  suma: "10.000 €",
  rezumat: "Finanțează ceva. Ni s-ar potrivi pentru că e o probă.",
});

/*
  Scenariile, în ordinea în care le cere proba. Fiecare cerere către API-ul de
  mențiune consumă unul.
*/
const SCENARII = [
  // 1. O pistă adevărată și una inventată. Numai prima are voie să intre.
  {
    stop_reason: "end_turn",
    content: [
      rezultate([ADEVARATA]),
      piste([pista(ADEVARATA, "Apel adevărat"), pista(INVENTATA, "Apel inventat")]),
    ],
  },
  // 2. Căutarea picată: content obiect, nu listă.
  {
    stop_reason: "end_turn",
    content: [cautareStricata(), piste([])],
  },
  // 3. Conversația se oprește la jumătate, după ce a văzut o adresă.
  {
    stop_reason: "pause_turn",
    content: [rezultate([A_DOUA])],
  },
  // 4. Reluarea: scrie pista pentru adresa văzută în pasul de dinainte.
  {
    stop_reason: "end_turn",
    content: [piste([pista(A_DOUA, "Apel găsit după reluare")])],
  },
  // 5. Aceeași pistă adevărată, a doua săptămână. Nu trebuie să învie.
  {
    stop_reason: "end_turn",
    content: [rezultate([ADEVARATA]), piste([pista(ADEVARATA, "Apel adevărat")])],
  },
];

let pas = 0;
const cereri = [];

const fals = createServer((cer, raspunde) => {
  let corp = "";
  cer.on("data", (b) => (corp += b));
  cer.on("end", () => {
    cereri.push(corp);
    const scenariu = SCENARII[pas] ?? SCENARII.at(-1);
    pas += 1;
    raspunde.writeHead(200, { "content-type": "application/json" });
    raspunde.end(
      JSON.stringify({
        id: "msg_probă",
        type: "message",
        role: "assistant",
        model: "probă",
        usage: { input_tokens: 1, output_tokens: 1 },
        stop_sequence: null,
        ...scenariu,
      }),
    );
  });
});
await new Promise((r) => fals.listen(PORT_API, r));

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: /@(localhost|127\.0\.0\.1)/.test(DATABASE_URL)
    ? false
    : { rejectUnauthorized: false },
});
await client.connect();

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT_SITE),
    ANTHROPIC_API: `http://127.0.0.1:${PORT_API}`,
    ANTHROPIC_API_KEY: "cheie-de-proba",
    RADAR_SECRET: SECRET,
  },
  stdio: "ignore",
});

const BAZA = `http://127.0.0.1:${PORT_SITE}`;

/** Fiecare scanare de pe altă adresă IP: ruta are limită de 3 pe oră. */
async function scaneaza(ip, secret = SECRET) {
  const r = await fetch(`${BAZA}/api/radar`, {
    method: "POST",
    headers: { "x-radar": secret, "x-forwarded-for": ip },
    redirect: "manual",
  });
  return { stare: r.status, mesaj: (await r.json().catch(() => ({}))).mesaj ?? "" };
}

const randul = (url) =>
  client
    .query("SELECT titlu, stare FROM radar WHERE url = $1", [url])
    .then((r) => r.rows[0] ?? null);

try {
  const pornit = Date.now();
  while (Date.now() - pornit < 90_000) {
    try {
      const r = await fetch(`${BAZA}/admin`);
      if (r.ok) break;
    } catch {
      /* încă nu ascultă */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // Curățăm rândurile rămase de la o rulare căzută.
  await client
    .query("DELETE FROM radar WHERE url = ANY($1)", [
      [ADEVARATA, A_DOUA, INVENTATA],
    ])
    .catch(() => undefined);

  // ─── Capătul de cron refuză fără secretul bun ───────────────────────────
  const fara = await fetch(`${BAZA}/api/radar`, {
    method: "POST",
    headers: { "x-forwarded-for": "10.0.0.9" },
    redirect: "manual",
  });
  verifica(fara.status === 403, `fără secret, radarul refuză (${fara.status})`);

  const greșit = await scaneaza("10.0.0.10", "alt-secret-complet-diferit");
  verifica(
    greșit.stare === 403,
    `cu secret greșit, radarul refuză (${greșit.stare})`,
  );
  verifica(pas === 0, "niciun refuz n-a chemat modelul (deci n-a costat nimic)");

  // ─── 1. Pista inventată se aruncă ───────────────────────────────────────
  const una = await scaneaza("10.0.0.1");
  verifica(una.stare === 200, `scanarea merge (${una.stare}) — ${una.mesaj}`);
  verifica(
    (await randul(ADEVARATA)) !== null,
    "pista cu adresă văzută în rezultate a intrat în tabel",
  );
  verifica(
    (await randul(INVENTATA)) === null,
    "pista cu adresă inventată NU a intrat — filtrul ține",
  );

  const cerut = cereri[0] ?? "";
  verifica(
    cerut.includes("web_search_20260209"),
    "cererea cere unealta de căutare pe server",
  );
  verifica(
    !cerut.includes("code_execution"),
    "nu se declară și execuția de cod pe lângă ea",
  );

  // ─── 2. Căutarea picată se vede ca eroare ───────────────────────────────
  const stricata = await scaneaza("10.0.0.2");
  verifica(
    stricata.stare === 502,
    `o căutare picată întoarce cod de eroare (${stricata.stare}), nu 200 liniștit`,
  );
  const ultimaScanare = await client.query(
    "SELECT eroare FROM radar_scanari ORDER BY cand DESC LIMIT 1",
  );
  verifica(
    (ultimaScanare.rows[0]?.eroare ?? "").includes("max_uses_exceeded"),
    `eroarea e scrisă în jurnalul scanărilor („${ultimaScanare.rows[0]?.eroare ?? ""}")`,
  );

  // ─── 3. Conversația oprită la jumătate se reia ──────────────────────────
  const inainteDeReluare = pas;
  const reluata = await scaneaza("10.0.0.3");
  verifica(
    pas === inainteDeReluare + 2,
    `pause_turn a fost reluat: ${pas - inainteDeReluare} cereri către model`,
  );
  verifica(
    (await randul(A_DOUA)) !== null,
    "pista găsită după reluare a intrat în tabel",
  );
  verifica(
    reluata.stare === 200,
    `scanarea cu reluare se încheie bine (${reluata.stare})`,
  );
  /*
    Forma reluării, verificată pe structură, nu pe cuvinte: întrebarea și
    răspunsul de până atunci, exact două mesaje. Un al treilea mesaj de utilizator
    („continuă”) ar încurca API-ul, care știe singur să reia după blocul de
    unealtă neterminat. Verificat pe `messages`, fiindcă o căutare după cuvântul
    „continuă” în corp dă fals: întrebarea însăși conține „apel continuu”.
  */
  let formaReluarii = null;
  try {
    formaReluarii = JSON.parse(cereri.at(-1) ?? "{}").messages ?? null;
  } catch {
    /* corp necitibil */
  }
  verifica(
    Array.isArray(formaReluarii) &&
      formaReluarii.length === 2 &&
      formaReluarii[0].role === "user" &&
      formaReluarii[1].role === "assistant",
    `reluarea trimite întrebarea plus răspunsul, fără „continuă” (${
      Array.isArray(formaReluarii)
        ? formaReluarii.map((m) => m.role).join(" + ")
        : "corp necitibil"
    })`,
  );

  // ─── 4. O pistă respinsă de un om nu învie ──────────────────────────────
  let cookie = "";
  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": "10.0.0.20",
    },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/radar" }),
  });
  for (const c of intra.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  verifica(Boolean(cookie), "intrarea în panou merge");

  const idul = await client.query("SELECT id FROM radar WHERE url = $1", [
    ADEVARATA,
  ]);
  const respinsa = await fetch(`${BAZA}/api/admin/radar`, {
    method: "POST",
    redirect: "manual",
    headers: {
      cookie,
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": "10.0.0.21",
    },
    body: new URLSearchParams({ fel: "respins", id: idul.rows[0].id }),
  });
  verifica(
    (respinsa.headers.get("location") ?? "").includes("stare=respins"),
    "pista se respinge din panou",
  );

  const iar = await scaneaza("10.0.0.4");
  verifica(iar.stare === 200, `a doua săptămână, scanarea merge (${iar.stare})`);
  verifica(
    (await randul(ADEVARATA))?.stare === "respins",
    "pista respinsă a rămas respinsă — nu învie la scanarea următoare",
  );
  verifica(
    /0 noi/.test(iar.mesaj),
    `nu s-a numărat ca pistă nouă („${iar.mesaj}")`,
  );

  // ─── 5. Pagina arată ce trebuie ─────────────────────────────────────────
  const pagina = await fetch(`${BAZA}/admin/radar`, { headers: { cookie } });
  const html = await pagina.text();
  verifica(
    html.includes("Apel găsit după reluare"),
    "pagina arată pista nouă",
  );
  verifica(
    !html.includes(INVENTATA),
    "pagina nu arată nicăieri adresa inventată",
  );
  verifica(
    html.includes("nu certitudini") || html.includes("de verificat"),
    "pagina scrie că rândurile sunt piste, nu certitudini",
  );
} finally {
  await client
    .query("DELETE FROM radar WHERE url = ANY($1)", [[ADEVARATA, A_DOUA]])
    .catch(() => undefined);
  await client.end();
  try {
    process.kill(-site.pid);
  } catch {
    /* se închisese singur */
  }
  fals.close();
}

console.log(rele === 0 ? "\nTot bine." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
