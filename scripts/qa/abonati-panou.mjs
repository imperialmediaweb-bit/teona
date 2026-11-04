/**
 * Adresele adăugate de mână în lista de buletin, din panou (/admin/abonati).
 *
 * Un amestec ca pe o listă adevărată, lipită dintr-un tabel: două adrese
 * bune despărțite prin virgulă și rând nou, una scrisă greșit, una repetată
 * și una care s-a dezabonat cândva din MailerLite. Verifică: cele bune intră
 * în lista de firme, cea dezabonată NU e pusă înapoi, cea greșită e numită,
 * acordul și numele celui care a adăugat stau lângă fiecare, asociația nu
 * primește anunț despre ce tocmai a făcut ea, iar fără acord sau fără sesiune
 * nu intră nimic.
 *
 *   PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/abonati-panou.mjs
 * Cere un `npm run build` făcut înainte. Numai pe o bază locală.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import pg from "pg";

const PORT = 4358;
const BAZA = `http://127.0.0.1:${PORT}`;
const PORT_MENTIUNE = 4397;
const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
const RUL = Date.now().toString(36);
const IP = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;

if (!PAROLA || !DATABASE_URL) {
  console.log("SĂRIT: cere PAROLA_ADMIN și DATABASE_URL (o bază locală).");
  process.exit(0);
}
if (/railway|teona-ariana/.test(DATABASE_URL)) {
  console.log("REFUZAT: proba scrie abonați de probă; numai pe o bază locală.");
  process.exit(1);
}

let rele = 0;
const verifica = (ok, mesaj) => {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
};

const A1 = `ana.${RUL}@exemplu.ro`;
const A2 = `firma.${RUL}@exemplu.ro`;
const PLECAT = `plecat.${RUL}@exemplu.ro`;

// MailerLite și Resend de mențiune, pe același port.
const jurnal = [];
const mentiune = createServer((req, res) => {
  let corp = "";
  req.on("data", (b) => (corp += b));
  req.on("end", () => {
    let j = {};
    try {
      j = JSON.parse(corp || "{}");
    } catch {}
    jurnal.push({ metoda: req.method, cale: req.url, corp: j });
    const da = (o, s = 200) => {
      res.writeHead(s, { "content-type": "application/json" });
      res.end(JSON.stringify(o));
    };
    if (req.url.startsWith("/emails")) return da({ id: "em" });
    if (req.method === "GET" && req.url.startsWith("/subscribers/")) {
      const cine = decodeURIComponent(req.url.split("/")[2]);
      if (cine === PLECAT) return da({ data: { id: "s1", status: "unsubscribed" } });
      return da({ message: "not found" }, 404);
    }
    if (req.url.startsWith("/subscribers")) return da({ data: { id: "s2" } }, 201);
    if (req.url.startsWith("/groups"))
      return da({ data: [{ id: "g-pers", name: "Persoane", active_count: 412 }, { id: "g-firme", name: "Firme", active_count: 57 }] });
    da({}, 404);
  });
});
await new Promise((r) => mentiune.listen(PORT_MENTIUNE, "127.0.0.1", r));

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT),
    SECRET_SESIUNE: "secret-de-proba-pentru-abonati-1234567890",
    EMAIL_API: `http://127.0.0.1:${PORT_MENTIUNE}`,
    RESEND_API_KEY: "proba",
    MAILERLITE_API: `http://127.0.0.1:${PORT_MENTIUNE}`,
    MAILERLITE_API_KEY: "proba",
    MAILERLITE_GROUP_ID: "g-pers",
    MAILERLITE_GROUP_FIRME: "g-firme",
  },
  stdio: "ignore",
});

try {
  const pornit = Date.now();
  while (Date.now() - pornit < 60000) {
    try {
      if ((await fetch(`${BAZA}/`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": IP() },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/abonati" }),
  });
  const cookie = (intra.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  verifica(intra.status === 303, "intrarea în panou");

  const trimite = (campuri, cuSesiune = true) =>
    fetch(`${BAZA}/api/admin/abonati`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: BAZA,
        ...(cuSesiune ? { cookie } : {}),
      },
      body: new URLSearchParams(campuri),
    });
  const adrese = `${A1}, ${A2}\nnu-e-adresa\n${A1}; ${PLECAT}`;

  const faraSesiune = await trimite({ adrese, lista: "firme", acord: "da", acord_nota: "probă" }, false);
  verifica(faraSesiune.status === 403, `fără sesiune, refuzat (${faraSesiune.status})`);
  const faraAcord = await trimite({ adrese, lista: "firme", acord_nota: "probă" });
  verifica(faraAcord.status === 400, `fără bifa de acord, refuzat (${faraAcord.status})`);
  const faraNota = await trimite({ adrese, lista: "firme", acord: "da" });
  verifica(faraNota.status === 400, `fără „de unde aveți acordul”, refuzat (${faraNota.status})`);
  const { rows: nimic } = await baza.query("SELECT 1 FROM abonati_buletin WHERE email LIKE $1", [`%.${RUL}@exemplu.ro`]);
  verifica(nimic.length === 0, "refuzurile n-au scris nimic");

  jurnal.length = 0;
  const bun = await trimite({
    adrese,
    lista: "firme",
    acord: "da",
    acord_nota: `lista de la târgul de Crăciun ${RUL}`,
  });
  const unde = decodeURIComponent(bun.headers.get("location") ?? "");
  verifica(bun.status === 303 && unde.startsWith("/admin/abonati/incarca") && unde.includes("adaugati=2"), `două adrese adăugate (${unde.slice(0, 120)})`);
  verifica(unde.includes("gresite=nu-e-adresa"), "adresa greșită e numită");
  verifica(unde.includes(`dezabonati=${PLECAT}`), "cea dezabonată nu e pusă înapoi, și e numită");

  const puse = jurnal.filter((x) => x.metoda === "POST" && x.cale.startsWith("/subscribers"));
  verifica(puse.length === 2, `două abonări trimise la MailerLite (${puse.length})`);
  verifica(puse.every((x) => JSON.stringify(x.corp.groups) === '["g-firme"]'), "toate în lista de firme");
  verifica(!puse.some((x) => x.corp.email === PLECAT), "cea dezabonată n-a ajuns la MailerLite");
  verifica(
    !jurnal.some((x) => x.cale.startsWith("/emails") && /Abonat nou/.test(String(x.corp.subject))),
    "asociația nu primește anunț despre ce a adăugat ea",
  );
  verifica(!jurnal.some((x) => x.cale.startsWith("/emails")), "fără bifa de bun venit, nu pleacă niciun e-mail");

  const { rows } = await baza.query(
    "SELECT email, sursa, lista, acord_nota FROM abonati_buletin WHERE email LIKE $1 ORDER BY email",
    [`%.${RUL}@exemplu.ro`],
  );
  verifica(rows.length === 2 && rows.every((r) => r.sursa === "panou" && r.lista === "firme"), "în baza de date: două rânduri, din panou, la firme");
  verifica(rows.every((r) => (r.acord_nota ?? "").includes(RUL)), "nota despre acord stă lângă fiecare");

  const pagina = (await (await fetch(`${BAZA}/admin/abonati`, { headers: { cookie } })).text()).replace(/<!-- -->/g, "");
  verifica(pagina.includes(A1) && pagina.includes(`lista de la târgul de Crăciun ${RUL}`), "pagina arată adresa și de unde e acordul");
  verifica(pagina.includes(">412<") && pagina.includes(">57<") && pagina.includes(">469<"), "cifrele din MailerLite: 412 persoane, 57 firme, 469 total");
  verifica(/Încărcați manual/.test(pagina), "tabelul „De unde au venit” are rândul „Încărcați manual”");
  const incarca = await (await fetch(`${BAZA}/admin/abonati/incarca`, { headers: { cookie } })).text();
  verifica(incarca.includes("câte una pe rând") && incarca.includes("Firme (persoane juridice)"), "pagina „Încarcă abonați” se deschide, cu cele două liste");

  jurnal.length = 0;
  const iar = await trimite({ adrese: A1, lista: "persoane", acord: "da", acord_nota: "a doua oară", bun_venit: "da" });
  const unde2 = decodeURIComponent(iar.headers.get("location") ?? "");
  verifica(unde2.includes("adaugati=0") && unde2.includes("deja=1"), "aceeași adresă a doua oară: „era deja abonată”");
  verifica(!jurnal.some((x) => x.cale.startsWith("/emails")), "…și nu primește iar bun venit");
} finally {
  await baza.query("DELETE FROM abonati_buletin WHERE email LIKE $1", [`%.${RUL}@exemplu.ro`]).catch(() => {});
  await baza.end();
  mentiune.close();
  try {
    process.kill(-site.pid);
  } catch {}
}

console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
