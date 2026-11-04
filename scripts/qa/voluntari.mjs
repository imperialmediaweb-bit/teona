/**
 * Baza de voluntari, de la înscriere la răspunsul la un apel.
 *
 * Doi voluntari se înscriu pe site (unul vrea WhatsApp, are permis, e din
 * Suceava; celălalt vrea e-mail, e din Iași). În panou: filtrul pe permis îl
 * lasă doar pe primul, butoanele de contact sunt acolo, apelul pleacă pe
 * e-mail la amândoi, fiecare cu linkul lui. Primul răspunde „pot" din link;
 * un link cu semnătura schimbată nu scrie nimic; panoul arată răspunsul.
 *
 *   PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/voluntari.mjs
 * Cere un `npm run build` făcut înainte. Numai pe o bază locală.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import pg from "pg";

const PORT = 4357;
const BAZA = `http://127.0.0.1:${PORT}`;
const PORT_EMAIL = 4396;
const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
const RUL = Date.now().toString(36);
const IP = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;

if (!PAROLA || !DATABASE_URL) {
  console.log("SĂRIT: cere PAROLA_ADMIN și DATABASE_URL (o bază locală).");
  process.exit(0);
}
if (/railway|teona-ariana/.test(DATABASE_URL)) {
  console.log("REFUZAT: proba scrie voluntari de probă; numai pe o bază locală.");
  process.exit(1);
}

let rele = 0;
const verifica = (ok, mesaj) => {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
};

const emailuri = [];
const posta = createServer((req, res) => {
  let corp = "";
  req.on("data", (b) => (corp += b));
  req.on("end", () => {
    try {
      emailuri.push(JSON.parse(corp));
    } catch {
      emailuri.push({});
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: `em_${emailuri.length}` }));
  });
});
await new Promise((r) => posta.listen(PORT_EMAIL, "127.0.0.1", r));

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT),
    SECRET_SESIUNE: "secret-de-proba-pentru-voluntari-1234567890",
    EMAIL_API: `http://127.0.0.1:${PORT_EMAIL}`,
    RESEND_API_KEY: "proba",
  },
  stdio: "ignore",
});

const ANA = { nume: `Ana Probă ${RUL}`, email: `ana.${RUL}@exemplu.ro`, telefon: "0744 123 456" };
const ION = { nume: `Ion Probă ${RUL}`, email: `ion.${RUL}@exemplu.ro`, telefon: "" };

try {
  const pornit = Date.now();
  while (Date.now() - pornit < 60000) {
    try {
      if ((await fetch(`${BAZA}/`)).ok) break;
    } catch {
      /* încă nu ascultă */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // ─── 1. Înscrierea, de pe site ─────────────────────────────────────────
  const inscrie = (om, extra) =>
    fetch(`${BAZA}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-deschis": "12", "x-forwarded-for": IP() },
      body: JSON.stringify({
        fel: "voluntariat",
        nume: om.nume,
        email: om.email,
        telefon: om.telefon,
        nastere: "1995-03-04",
        disponibilitate: "Săptămânal",
        acord: true,
        ...extra,
      }),
    });
  const r1 = await inscrie(ANA, { contact: "WhatsApp", localitate: "Suceava", permis: "Da", experientaCopii: "Da", limbi: "engleză" });
  const r2 = await inscrie(ION, { contact: "E-mail", localitate: "Iași", permis: "Nu" });
  verifica(r1.status === 200 && r2.status === 200, `înscrierile trec (${r1.status}, ${r2.status})`);
  const r3 = await inscrie({ ...ION, email: `x.${RUL}@exemplu.ro` }, { contact: "Porumbel" });
  verifica(r3.status === 200, "o cale de contact necunoscută nu oprește înscrierea");
  const { rows: inscrisi } = await baza.query(
    "SELECT id, email, detalii FROM cereri WHERE email = ANY($1)",
    [[ANA.email, ION.email, `x.${RUL}@exemplu.ro`]],
  );
  const dupaEmail = Object.fromEntries(inscrisi.map((r) => [r.email, r]));
  verifica(dupaEmail[ANA.email]?.detalii?.["Contact preferat"] === "WhatsApp", "preferința „WhatsApp” e în fișa ei");
  verifica(!dupaEmail[`x.${RUL}@exemplu.ro`]?.detalii?.["Contact preferat"], "„Porumbel” nu ajunge în fișă");

  // ─── 2. Panoul: filtrele și butoanele ───────────────────────────────────
  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": IP() },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/voluntari" }),
  });
  const cookie = (intra.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  verifica(intra.status === 303 && (intra.headers.get("location") ?? "").startsWith("/admin/voluntari"), "intrarea duce la /admin/voluntari");
  const pagina = async (q = "") => (await fetch(`${BAZA}/admin/voluntari${q}`, { headers: { cookie } })).text();

  const toti = await pagina(`?q=${RUL}`);
  verifica(toti.includes(ANA.nume) && toti.includes(ION.nume), "căutarea îi găsește pe amândoi");
  const cuPermis = await pagina(`?q=${RUL}&permis=da`);
  verifica(cuPermis.includes(ANA.nume) && !cuPermis.includes(ION.nume), "filtrul „Are permis” o lasă doar pe Ana");
  const dinIasi = await pagina(`?q=${RUL}&loc=${encodeURIComponent("Iași")}`);
  verifica(dinIasi.includes(ION.nume) && !dinIasi.includes(ANA.nume), "filtrul pe localitate îl lasă doar pe Ion");
  verifica(toti.includes("https://wa.me/40744123456"), "butonul de WhatsApp duce la numărul ei, în formă internațională");
  verifica(toti.includes("tel:+40744123456"), "butonul „Sună” e acolo");
  verifica(toti.includes(`mailto:${ION.email}`), "e-mailul lui e un link");
  verifica(/preferă WhatsApp/.test(toti), "scrie ce cale preferă");
  const fara = await fetch(`${BAZA}/admin/voluntari`, { redirect: "manual" });
  verifica(!(await fara.text()).includes(ANA.nume), "fără sesiune, pagina nu arată nimic");

  // ─── 3. Apelul ──────────────────────────────────────────────────────────
  const inainte = emailuri.length;
  const corp = new URLSearchParams({
    titlu: `Tabăra de probă ${RUL}`,
    cand: "sâmbătă, 15 noiembrie, 10:00–14:00",
    unde: "Casa Teona",
    mesaj: "Avem nevoie de oameni care să stea cu copiii la ateliere.",
    pe_email: "da",
  });
  corp.append("voluntar", dupaEmail[ANA.email].id);
  corp.append("voluntar", dupaEmail[ION.email].id);
  const apel = await fetch(`${BAZA}/api/admin/voluntari/apel`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie, origin: BAZA },
    body: corp,
  });
  const unde = apel.headers.get("location") ?? "";
  verifica(apel.status === 303 && unde.includes("intrebati=2") && unde.includes("emailuri=2"), `apelul pleacă la doi, pe e-mail (${apel.status} ${unde.slice(0, 60)})`);
  const apelId = (unde.match(/apel=([0-9a-f-]{36})/) ?? [])[1];
  const deApel = emailuri.slice(inainte).filter((e) => String(e.subject ?? "").startsWith("Avem nevoie de voluntari"));
  verifica(deApel.length === 2, `două e-mailuri de apel (${deApel.length})`);
  const alAnei = deApel.find((e) => [].concat(e.to).includes(ANA.email));
  verifica(Boolean(alAnei) && /Bună, Ana,/.test(alAnei.text ?? ""), "Ana primește e-mailul ei, cu prenumele");
  verifica(!/undefined|NaN|\$\{/.test(JSON.stringify(deApel)), "nimic necompletat în e-mailuri");
  const linkPot = ((alAnei?.text ?? "").match(/https?:\/\/\S+r=pot\S*/) ?? [])[0];
  verifica(Boolean(linkPot), "e-mailul are linkul „Da, pot veni”");

  const fara2 = await fetch(`${BAZA}/api/admin/voluntari/apel`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: BAZA },
    body: corp,
  });
  verifica(fara2.status === 403, `fără sesiune, apelul e refuzat (${fara2.status})`);

  // ─── 4. Răspunsul ───────────────────────────────────────────────────────
  const u = new URL(linkPot);
  const local = `${BAZA}/voluntari/raspuns${u.search}`;
  const deschis = await (await fetch(local)).text();
  verifica(deschis.includes("Poți veni?") && deschis.includes(`Tabăra de probă ${RUL}`), "pagina din link arată apelul");
  verifica(!deschis.includes(ANA.nume) && !deschis.includes(ANA.email), "pagina nu scrie numele sau adresa omului");
  const { rows: inc } = await baza.query("SELECT raspuns FROM raspunsuri_voluntari WHERE apel_id = $1 AND cerere_id = $2", [apelId, dupaEmail[ANA.email].id]);
  verifica(inc[0] && inc[0].raspuns === null, "deschiderea linkului nu scrie niciun răspuns");

  const p = u.searchParams;
  const raspunde = (s, r) =>
    fetch(`${BAZA}/api/voluntari/raspuns`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded", origin: BAZA, "x-forwarded-for": IP() },
      body: new URLSearchParams({ a: p.get("a"), c: p.get("c"), s, raspuns: r }),
    });
  const falsificat = await raspunde("0".repeat(64), "pot");
  verifica((falsificat.headers.get("location") ?? "").includes("gata=gresit"), "semnătura schimbată e refuzată");
  const bun = await raspunde(p.get("s"), "pot");
  verifica((bun.headers.get("location") ?? "").includes("gata=pot"), "răspunsul „pot” trece");
  const { rows: dupa } = await baza.query("SELECT raspuns FROM raspunsuri_voluntari WHERE apel_id = $1 AND cerere_id = $2", [apelId, dupaEmail[ANA.email].id]);
  verifica(dupa[0]?.raspuns === "pot", "răspunsul e scris în baza de date");

  await new Promise((r) => setTimeout(r, 300));
  const dupaPanou = (await pagina(`?q=${RUL}`)).replace(/<!-- -->/g, "");
  verifica(/1 pot · 0 nu pot · 1 n-au răspuns/.test(dupaPanou), "panoul arată „1 pot · 0 nu pot · 1 n-au răspuns”");
  verifica(dupaPanou.includes("WhatsApp cu textul gata scris"), "la apel, WhatsApp cu textul gata scris");
} finally {
  await baza.query("DELETE FROM apeluri_voluntari WHERE titlu LIKE $1", [`%${RUL}`]).catch(() => {});
  await baza.query("DELETE FROM cereri WHERE email LIKE $1", [`%.${RUL}@exemplu.ro`]).catch(() => {});
  await baza.end();
  posta.close();
  try {
    process.kill(-site.pid);
  } catch {
    /* s-a oprit deja */
  }
}

console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
