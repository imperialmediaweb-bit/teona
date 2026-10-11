import { browser, BAZA, urmaresteErori } from "./comun.mjs";
import { Client } from "pg";

/**
 * Contul donatorului: intrarea fără parolă și ce vede înăuntru.
 *
 * Se rulează cu baza de date și cheile în mediu:
 *
 *   DATABASE_URL=… SECRET_SESIUNE=… RESEND_API_KEY=… npm run dev
 *   DATABASE_URL=… node scripts/qa/cont.mjs
 *
 * E-mailul nu pleacă nicăieri în probă; jetonul se citește direct din baza
 * de date, de unde l-ar lua și omul din linkul primit. Ce se verifică aici
 * sunt lucrurile care, greșite, lasă un om să vadă donațiile altuia.
 */

const URL_BAZA = process.env.DATABASE_URL;
if (!URL_BAZA) {
  console.log("SĂRIT: lipsește DATABASE_URL.");
  process.exit(2);
}

const sql = new Client({ connectionString: URL_BAZA });
await sql.connect();

const b = await browser();
let rele = 0;
function verifica(eticheta, conditie, detaliu = "") {
  console.log(
    `${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`,
  );
  if (!conditie) rele++;
}

// ─── Donatori de probă ────────────────────────────────────────────────────
const ANA = `ana-proba-${Date.now()}@example.com`;
const DAN = `dan-proba-${Date.now()}@example.com`;
for (const [email, nume, suma, frecventa] of [
  [ANA, "Ana", 15000, "o-data"],
  [ANA, "Ana", 5000, "lunar"],
  [DAN, "Dan", 7000, "o-data"],
]) {
  await sql.query(
    `INSERT INTO donatii (procesator, referinta, suma_bani, moneda, frecventa,
       destinatie, email, prenume, stare, platita_la, acord_buletin)
     VALUES ('stripe', $1, $2, 'RON', $3, 'tabere', $4, $5, 'platita', now(), false)`,
    [`proba-${Math.random()}`, suma, frecventa, email, nume],
  );
}

/** Jetonul, așa cum l-ar primi omul în e-mail. Îl luăm din baza de date. */
async function cereJeton(page, email) {
  const r = await page.request.post(BAZA + "/api/cont/intrare", {
    data: { email },
    headers: { "Content-Type": "application/json" },
  });
  return r;
}

const page = await b.newPage();
const erori = urmaresteErori(page);

// ─── Nu se scurge cine a donat ────────────────────────────────────────────
console.log("\n=== Fără scurgeri ===");
const existent = await cereJeton(page, ANA);
const inexistent = await cereJeton(page, `nimeni-${Date.now()}@example.com`);
const corpA = await existent.json();
const corpB = await inexistent.json();
verifica(
  "răspunsul e identic pentru o adresă care a donat și una care n-a donat",
  existent.status() === inexistent.status() &&
    corpA.mesaj === corpB.mesaj,
  `${existent.status()} „${corpA.mesaj?.slice(0, 40)}" vs ${inexistent.status()} „${corpB.mesaj?.slice(0, 40)}"`,
);

const jetoaneNimeni = await sql.query(
  "SELECT 1 FROM jetoane_cont WHERE email LIKE 'nimeni-%'",
);
verifica(
  "pentru o adresă fără donații nu se creează niciun jeton",
  jetoaneNimeni.rowCount === 0,
  `${jetoaneNimeni.rowCount} jetoane`,
);

// ─── Intrarea ─────────────────────────────────────────────────────────────
console.log("\n=== Intrarea ===");
await page.goto(BAZA + "/contul-meu", { waitUntil: "networkidle" });
verifica(
  "neconectat, pagina cere adresa — nu arată date",
  (await page.locator('input[name="email"]').count()) >= 1 &&
    !(await page.locator("body").innerText()).includes(ANA),
);

const jeton = await sql.query(
  "SELECT amprenta FROM jetoane_cont WHERE email = $1 AND folosit_la IS NULL",
  [ANA],
);
verifica("jetonul s-a creat pentru adresa care a donat", jeton.rowCount === 1);

// Jetonul e stocat doar ca amprentă, deci nu-l putem reconstrui: cerem unul
// nou prin API-ul intern, cum ar face serverul, și-l prindem din e-mail.
// Aici îl generăm direct, ca să putem testa capătul linkului.
const { createHash, randomBytes } = await import("node:crypto");
const brut = randomBytes(32).toString("base64url");
await sql.query(
  `INSERT INTO jetoane_cont (amprenta, email, expira_la)
   VALUES ($1, $2, now() + interval '20 minutes')`,
  [createHash("sha256").update(brut).digest("hex"), ANA],
);

await page.goto(`${BAZA}/contul-meu/intra?jeton=${brut}`, {
  waitUntil: "networkidle",
});
verifica(
  "linkul duce în cont, fără jeton în adresă",
  new URL(page.url()).pathname === "/contul-meu" && !page.url().includes("jeton"),
  page.url(),
);

const panou = await page.locator("body").innerText();
verifica("se vede mulțumirea pe nume", panou.includes("Mulțumim, Ana"), panou.slice(0, 60).replace(/\n/g, " "));
verifica("se vede totalul lui", panou.includes("200 lei"), panou.match(/Ai dăruit[^\n]*\n[^\n]*/)?.[0]?.replace(/\n/g, " ") ?? "");
verifica("se văd două donații", (await page.locator("tbody tr").count()) === 2);
verifica("se vede că are donație lunară", panou.includes("Ai o donație lunară"));

// ─── Nicio cifră inventată ────────────────────────────────────────────────
console.log("\n=== Fără cifre inventate ===");
verifica(
  "nu scrie nicăieri „ai ajutat N copii”",
  !/ai ajutat\s+\d/i.test(panou) && !/ai hrănit|ai salvat|ai trimis\s+\d+\s+copii/i.test(panou),
);
verifica(
  "cifrele asociației sunt atribuite asociației",
  panou.includes("Cifrele asociației"),
);

// ─── Jetonul nu se refolosește ────────────────────────────────────────────
console.log("\n=== Jetonul ===");
const altul = await b.newPage();
await altul.goto(`${BAZA}/contul-meu/intra?jeton=${brut}`, {
  waitUntil: "networkidle",
});
verifica(
  "același link, a doua oară, nu mai intră",
  altul.url().includes("expirat=1"),
  altul.url(),
);
verifica(
  "și spune de ce",
  (await altul.locator("body").innerText()).includes("Linkul nu mai e bun"),
);
await altul.goto(`${BAZA}/contul-meu/intra?jeton=inventat-complet`, {
  waitUntil: "networkidle",
});
verifica("un jeton inventat nu intră", altul.url().includes("expirat=1"));

// ─── Un om nu vede datele altuia ──────────────────────────────────────────
console.log("\n=== Izolarea datelor ===");
const alDoilea = await b.newPage();
const brut2 = randomBytes(32).toString("base64url");
await sql.query(
  `INSERT INTO jetoane_cont (amprenta, email, expira_la)
   VALUES ($1, $2, now() + interval '20 minutes')`,
  [createHash("sha256").update(brut2).digest("hex"), DAN],
);
await alDoilea.goto(`${BAZA}/contul-meu/intra?jeton=${brut2}`, {
  waitUntil: "networkidle",
});
const panouDan = await alDoilea.locator("body").innerText();
verifica("Dan își vede propriile date", panouDan.includes("Mulțumim, Dan"));
verifica("Dan NU vede adresa Anei", !panouDan.includes(ANA));
verifica("Dan NU vede suma Anei", !panouDan.includes("200 lei"), panouDan.match(/Ai dăruit[^\n]*\n[^\n]*/)?.[0]?.replace(/\n/g, " ") ?? "");
verifica("Dan vede o singură donație", (await alDoilea.locator("tbody tr").count()) === 1);

// Cookie-ul măsluit nu trece.
await alDoilea.context().addCookies([
  { name: "teona_cont", value: `${ANA}|` + "a".repeat(64), url: BAZA },
]);
await alDoilea.goto(BAZA + "/contul-meu", { waitUntil: "networkidle" });
verifica(
  "un cookie cu semnătură inventată nu deschide contul nimănui",
  (await alDoilea.locator('input[name="email"]').count()) >= 1,
  (await alDoilea.locator("body").innerText()).slice(0, 50).replace(/\n/g, " "),
);

// ─── Setări: buletin și ștergere ──────────────────────────────────────────
console.log("\n=== Setări ===");
await page.goto(BAZA + "/contul-meu", { waitUntil: "networkidle" });
await page.click('button:has-text("Vreau buletinul")');
await page.waitForLoadState("networkidle");
verifica("abonarea se salvează", page.url().includes("gata=abonat"), page.url());
const acord = await sql.query(
  "SELECT bool_or(acord_buletin) AS a FROM donatii WHERE email = $1",
  [ANA],
);
verifica("și chiar în baza de date", acord.rows[0].a === true);

await page.click('button:has-text("Nu mai vreau buletinul")');
await page.waitForLoadState("networkidle");
const acord2 = await sql.query(
  "SELECT bool_or(acord_buletin) AS a FROM donatii WHERE email = $1",
  [ANA],
);
verifica("dezabonarea se salvează", acord2.rows[0].a === false);

// Ștergerea cere confirmarea scrisă.
const fara = await page.request.post(BAZA + "/api/cont/setari", {
  form: { ce: "stergere", confirmare: "da" },
  maxRedirects: 0,
});
verifica(
  "ștergerea fără „ȘTERGE” scris e oprită",
  (fara.headers()["location"] ?? "").includes("eroare=confirmare"),
  fara.headers()["location"] ?? "",
);
const inca = await sql.query("SELECT 1 FROM donatii WHERE email = $1", [ANA]);
verifica("și nu s-a șters nimic", inca.rowCount === 2);

const cu = await page.request.post(BAZA + "/api/cont/setari", {
  form: { ce: "stergere", confirmare: "ȘTERGE" },
  maxRedirects: 0,
});
verifica("cu confirmarea scrisă, ștergerea trece", (cu.headers()["location"] ?? "").includes("sters=1"));
const dupa = await sql.query("SELECT 1 FROM donatii WHERE email = $1", [ANA]);
verifica("datele personale au dispărut", dupa.rowCount === 0);
const bani = await sql.query(
  "SELECT COUNT(*) n FROM donatii WHERE referinta LIKE 'proba-%' AND email IS NULL",
);
verifica(
  "dar sumele rămân în contabilitate, fără nume",
  Number(bani.rows[0].n) >= 2,
  `${bani.rows[0].n} donații anonimizate`,
);

// ─── Fără sesiune, setările nu merg ───────────────────────────────────────
const anonim = await b.newPage();
const refuz = await anonim.request.post(BAZA + "/api/cont/setari", {
  form: { ce: "stergere", confirmare: "ȘTERGE" },
});
verifica("setările refuză fără sesiune", refuz.status() === 403, String(refuz.status()));

// ─── Curățenie ────────────────────────────────────────────────────────────
await sql.query("DELETE FROM donatii WHERE referinta LIKE 'proba-%'");
await sql.query("DELETE FROM jetoane_cont WHERE email LIKE '%-proba-%'");

console.log("\nerori consolă/rețea:", JSON.stringify(erori.filter((e) => !e.includes("503"))));
console.log(`\nverificări picate: ${rele}`);
await sql.end();
await b.close();
process.exit(rele === 0 ? 0 : 1);
