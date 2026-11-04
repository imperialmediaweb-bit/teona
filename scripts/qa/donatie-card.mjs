/**
 * Drumul unei donații cu cardul, de la confirmarea Stripe până în panou.
 *
 * Pornită după 4 noiembrie 2026: o donație de probă a fundraiserului n-a
 * apărut nicăieri. Stripe anunță plățile la `www.teona-ariana.ro`, iar de o
 * săptămână `www.` răspundea cu 308 — webhook-urile nu urmează
 * redirecționările, deci banii intrau în Stripe și site-ul nu afla. Nicio
 * probă nu trimitea anunțul la adresa cu `www.`.
 *
 * Verifică, la nivel de rețea: anunțul semnat trimis cu gazda `www.` primește
 * 200; donația trece din „inițiată” în „plătită”; pleacă mulțumirea către
 * donator și anunțul către asociație; donația se vede în panou; același
 * eveniment trimis a doua oară nu mai trimite e-mailuri; o pagină cerută pe
 * `www.` se mută în continuare pe adresa fără `www.`.
 *
 * Pornește singură site-ul (pe 4353) și serverul de e-mail de mențiune (4391):
 *   PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/donatie-card.mjs
 * Cere un `npm run build` făcut înainte. Numai pe o bază locală: scrie o
 * donație de probă și o șterge la sfârșit.
 */
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import pg from "pg";

const PORT = 4353;
const BAZA = `http://127.0.0.1:${PORT}`;
const PORT_EMAIL = 4391;
const SECRET_WEBHOOK = "whsec_de_proba_pentru_donatii_cu_cardul";
const SECRET_SESIUNE = "secret-de-proba-pentru-donatii-cu-cardul-123";
const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
const SESIUNE = `cs_test_proba_${Date.now()}`;
const EMAIL_DONATOR = `donator.card.${Date.now()}@exemplu.ro`;

if (!PAROLA || !DATABASE_URL) {
  console.log("SĂRIT: cere PAROLA_ADMIN și DATABASE_URL (o bază locală).");
  process.exit(0);
}
if (/railway|teona-ariana/.test(DATABASE_URL)) {
  console.log("REFUZAT: proba scrie donații de probă; rulează numai pe o bază locală.");
  process.exit(1);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

// ─── Serverul de e-mail de mențiune ─────────────────────────────────────
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

function semneaza(corp) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", SECRET_WEBHOOK).update(`${t}.${corp}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

const eveniment = JSON.stringify({
  id: `evt_proba_card_${Date.now()}`,
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: SESIUNE,
      object: "checkout.session",
      payment_status: "paid",
      amount_total: 5000,
      currency: "ron",
      customer_email: EMAIL_DONATOR,
    },
  },
});

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT),
    STRIPE_SECRET_KEY: "sk_test_de_proba",
    STRIPE_WEBHOOK_SECRET: SECRET_WEBHOOK,
    SECRET_SESIUNE,
    EMAIL_API: `http://127.0.0.1:${PORT_EMAIL}`,
    RESEND_API_KEY: "proba",
  },
  stdio: "ignore",
});

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

  // Donația cum o scrie site-ul când pornește plata (rândul „inițiat”).
  await baza.query(
    `INSERT INTO donatii (procesator, referinta, suma_bani, moneda, frecventa, destinatie,
       email, prenume, nume, telefon, acord_buletin)
     VALUES ('stripe', $1, 5000, 'RON', 'unica', 'general', $2, 'Maria', 'Proba', NULL, false)`,
    [SESIUNE, EMAIL_DONATOR],
  );

  // ─── 1. Anunțul Stripe, la adresa cu www. ─────────────────────────────
  const anunt = await fetch(`${BAZA}/api/donatii/stripe/webhook`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      "stripe-signature": semneaza(eveniment),
      "x-forwarded-host": "www.teona-ariana.ro",
      "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
    },
    body: eveniment,
  });
  verifica(anunt.status === 200, `anunțul Stripe trimis la www. e primit (${anunt.status})`);

  await new Promise((r) => setTimeout(r, 1500));
  const { rows } = await baza.query(
    "SELECT stare, suma_bani FROM donatii WHERE referinta = $1",
    [SESIUNE],
  );
  verifica(rows[0]?.stare === "platita", `donația e marcată plătită (${rows[0]?.stare})`);

  const catre = emailuri.map((e) => [].concat(e.to ?? []).join(","));
  verifica(catre.some((c) => c.includes(EMAIL_DONATOR)), "donatorul primește mulțumirea");
  verifica(
    catre.some((c) => c.includes("contact@teona-ariana.ro")) &&
      emailuri.some((e) => String(e.subject ?? "").startsWith("Donație nouă")),
    "asociația primește „Donație nouă”",
  );

  // ─── 2. În panou ──────────────────────────────────────────────────────
  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": DE_LA },
    body: new URLSearchParams({ parola: PAROLA }),
  });
  const cookie = (intra.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .find((c) => c.startsWith("teona_verificare="));
  const panou = await (
    await fetch(`${BAZA}/admin/donatii`, { headers: { cookie: cookie ?? "" } })
  ).text();
  verifica(panou.includes(EMAIL_DONATOR), "donația se vede la /admin/donatii");

  // ─── 3. Același eveniment a doua oară ─────────────────────────────────
  const inainte = emailuri.length;
  const repetat = await fetch(`${BAZA}/api/donatii/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": semneaza(eveniment),
      "x-forwarded-host": "www.teona-ariana.ro",
    },
    body: eveniment,
  });
  await new Promise((r) => setTimeout(r, 800));
  verifica(
    repetat.status === 200 && emailuri.length === inainte,
    "același eveniment a doua oară nu mai trimite e-mailuri",
  );

  // ─── 4. Paginile de pe www. se mută în continuare ─────────────────────
  const pagina = await fetch(`${BAZA}/doneaza`, {
    redirect: "manual",
    headers: { "x-forwarded-host": "www.teona-ariana.ro" },
  });
  verifica(
    pagina.status === 308 && pagina.headers.get("location") === "https://teona-ariana.ro/doneaza",
    `o pagină cerută pe www. duce la adresa fără www. (${pagina.status})`,
  );
} finally {
  await baza.query("DELETE FROM donatii WHERE referinta = $1", [SESIUNE]).catch(() => {});
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
