/**
 * Toate căile prin care intră o donație, de la plată până în panou, în contul
 * donatorului, pe e-mail și pe telefon.
 *
 * Scrisă pe 4 noiembrie 2026, după ce o donație reală cu cardul a
 * fundraiserului n-a apărut nicăieri (webhook-ul Stripe primea 308 pe
 * `www.`) și după ce s-a văzut că PayPal nu încasa niciodată comanda.
 *
 * Pornește singură site-ul (4354) și un server de mențiune (4392) care joacă
 * Resend, Stripe, PayPal și serviciul de notificări al browserului. Verifică:
 *
 *  Stripe   – anunțul semnat trimis la www. e primit și marchează plătită;
 *           – un anunț pentru o plată fără rând „inițiată” scrie rândul;
 *           – plata rămasă neconfirmată e găsită singură de panou, la
 *             deschiderea donațiilor; cea abandonată se închide;
 *           – pagina de mulțumire o confirmă și ea;
 *  PayPal   – pagina de mulțumire încasează comanda aprobată;
 *  transfer – anunțul intră „anunțată”, bifa din panou o face donație;
 *  peste tot – mulțumirea la donator, anunțul la asociație, notificarea pe
 *             telefon, donația în panou și în contul donatorului; repetarea
 *             nu trimite nimic a doua oară.
 *
 *   PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/plati.mjs
 * Cere `npm run build` înainte. Numai pe o bază locală; șterge la sfârșit ce
 * a scris.
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { createServer as createHttps } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createECDH, createHmac, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import pg from "pg";
import webpush from "web-push";

const PORT = 4354;
const BAZA = `http://127.0.0.1:${PORT}`;
const MOCK = 4392;
const SECRET_WEBHOOK = "whsec_de_proba_pentru_plati_toate";
const PAROLA = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;
const T = Date.now();
const DE_LA = () => `198.51.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

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
const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Serverul de mențiune ───────────────────────────────────────────────
const emailuri = [];
const notificari = [];
const sesiuniStripe = new Map(); // id -> sesiune
const comenziPayPal = new Map(); // id -> { captura, ... }

/*
  Serviciul de notificări al browserului e mereu pe https (`web-push` nu
  trimite altfel). Proba își face un certificat de unică folosință, iar
  site-ul pornit de ea îl acceptă (NODE_TLS_REJECT_UNAUTHORIZED=0, numai aici).
*/
const dosarCert = mkdtempSync(join(tmpdir(), "plati-cert-"));
execFileSync("openssl", [
  "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
  "-keyout", join(dosarCert, "k.pem"), "-out", join(dosarCert, "c.pem"),
  "-subj", "/CN=127.0.0.1", "-addext", "subjectAltName=IP:127.0.0.1",
], { stdio: "ignore" });
const PORT_PUSH = MOCK + 1;
const serviciuPush = createHttps(
  { key: readFileSync(join(dosarCert, "k.pem")), cert: readFileSync(join(dosarCert, "c.pem")) },
  (req, res) => {
    req.resume();
    req.on("end", () => {
      notificari.push(req.url);
      res.writeHead(201);
      res.end();
    });
  },
);
await new Promise((r) => serviciuPush.listen(PORT_PUSH, "127.0.0.1", r));

const mock = createServer((req, res) => {
  const bucati = [];
  req.on("data", (b) => bucati.push(b));
  req.on("end", () => {
    const corp = Buffer.concat(bucati).toString("utf8");
    const u = req.url ?? "";
    const json = (cod, date) => {
      res.writeHead(cod, { "content-type": "application/json" });
      res.end(JSON.stringify(date));
    };
    if (u.startsWith("/emails")) {
      try {
        emailuri.push(JSON.parse(corp));
      } catch {
        emailuri.push({});
      }
      return json(200, { id: `em_${emailuri.length}` });
    }
    const s = u.match(/^\/v1\/checkout\/sessions\/([^/?]+)/);
    if (s) {
      const sesiune = sesiuniStripe.get(s[1]);
      return sesiune ? json(200, sesiune) : json(404, { error: { message: "No such session" } });
    }
    if (u.startsWith("/v1/notifications/verify-webhook-signature")) {
      return json(200, { verification_status: "SUCCESS" });
    }
    if (u.startsWith("/subscribers")) return json(201, { data: { id: "sub_proba" } });
    if (u.startsWith("/v1/oauth2/token")) {
      return json(200, { access_token: "jeton-proba", expires_in: 3600 });
    }
    const p = u.match(/^\/v2\/checkout\/orders\/([A-Z0-9]+)(\/capture)?/);
    if (p) {
      const comanda = comenziPayPal.get(p[1]);
      if (!comanda) return json(404, { name: "RESOURCE_NOT_FOUND" });
      if (p[2] && comanda.incasata) return json(422, { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED" }] });
      if (p[2]) comanda.incasata = true;
      return json(p[2] ? 201 : 200, {
        id: p[1],
        status: "COMPLETED",
        payer: { email_address: comanda.email },
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: comanda.captura,
                  status: "COMPLETED",
                  custom_id: "tabere|",
                  amount: { value: "20.00", currency_code: "EUR" },
                },
              ],
            },
          },
        ],
      });
    }
    json(404, {});
  });
});
await new Promise((r) => mock.listen(MOCK, "127.0.0.1", r));

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();
const referinte = [];

function semneaza(corp) {
  const t = Math.floor(Date.now() / 1000);
  return `t=${t},v1=${createHmac("sha256", SECRET_WEBHOOK).update(`${t}.${corp}`).digest("hex")}`;
}
function sesiune(id, email, plata = "paid") {
  return {
    id,
    object: "checkout.session",
    payment_status: plata,
    mode: "payment",
    amount_total: 5000,
    currency: "ron",
    customer_email: email,
    customer_details: { email },
    metadata: { destinatie: "tabere", prenume: "Maria", nume: "Proba", acord_buletin: "nu" },
  };
}
async function initiata(id, email, procesator = "stripe") {
  referinte.push(id);
  await baza.query(
    `INSERT INTO donatii (procesator, referinta, suma_bani, moneda, frecventa, destinatie,
       email, prenume, nume, acord_buletin)
     VALUES ($1, $2, 5000, 'RON', 'o-data', 'tabere', $3, 'Maria', 'Proba', false)`,
    [procesator, id, email],
  );
}
async function stare(id) {
  return (await baza.query("SELECT stare FROM donatii WHERE referinta = $1", [id])).rows[0]?.stare;
}
const catre = (adresa) => emailuri.filter((e) => [].concat(e.to ?? []).join(",").includes(adresa));
const anunturi = (fragment) =>
  emailuri.filter(
    (e) =>
      [].concat(e.to ?? []).join(",").includes("contact@teona-ariana.ro") &&
      String(e.subject ?? "").includes(fragment),
  );

const SECRET_SESIUNE = "secret-de-proba-pentru-plati-toate-1234567";

// Chei de notificări de unică folosință: cele adevărate stau numai în Railway.
const chei = webpush.generateVAPIDKeys();

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT),
    STRIPE_SECRET_KEY: "sk_test_de_proba",
    STRIPE_WEBHOOK_SECRET: SECRET_WEBHOOK,
    STRIPE_API: `http://127.0.0.1:${MOCK}`,
    PAYPAL_CLIENT_ID: "proba",
    PAYPAL_CLIENT_SECRET: "proba",
    PAYPAL_API: `http://127.0.0.1:${MOCK}`,
    PAYPAL_WEBHOOK_ID: "WH-PROBA",
    MAILERLITE_API: `http://127.0.0.1:${MOCK}`,
    MAILERLITE_API_KEY: "proba",
    MAILERLITE_GROUP_ID: "g-pers",
    SECRET_SESIUNE,
    EMAIL_API: `http://127.0.0.1:${MOCK}`,
    RESEND_API_KEY: "proba",
    VAPID_PUBLIC_KEY: chei.publicKey,
    VAPID_PRIVATE_KEY: chei.privateKey,
    NODE_TLS_REJECT_UNAUTHORIZED: "0",
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
    await asteapta(500);
  }

  // Intrarea în panou și abonarea unui „telefon” la notificări.
  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": DE_LA() },
    body: new URLSearchParams({ parola: PAROLA }),
  });
  const cookie = (intra.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .find((c) => c.startsWith("teona_verificare="));
  /*
    Notificările se pornesc numai dintr-un cont cu nume. Proba își face unul,
    de strângere de fonduri, și își semnează singură sesiunea, cu aceeași
    cheie pe care a dat-o site-ului (formatul din lib/admin.ts).
  */
  const cont = (
    await baza.query(
      "INSERT INTO utilizatori (email, nume, rol) VALUES ($1, 'Proba Plăți', 'fundraising') RETURNING id",
      [`plati.${T}@exemplu.ro`],
    )
  ).rows[0].id;
  const expira = Math.floor(Date.now() / 1000) + 3600;
  const cookieCont = `teona_verificare=u:${cont}:${expira}:${createHmac("sha256", SECRET_SESIUNE).update(`panou:${cont}:${expira}`).digest("hex")}`;
  const cuCheia = await fetch(`${BAZA}/api/admin/push`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ fac: "aboneaza", abonament: { endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "a", auth: "b" } } }),
  });
  verifica(cuCheia.status === 403, `cu parola asociației notificările nu se pot porni (${cuCheia.status})`);
  const telefon = createECDH("prime256v1");
  telefon.generateKeys();
  const endpoint = `https://127.0.0.1:${PORT_PUSH}/push/telefon-${T}`;
  const abonare = await fetch(`${BAZA}/api/admin/push`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieCont, "x-forwarded-for": DE_LA() },
    body: JSON.stringify({
      fac: "aboneaza",
      abonament: {
        endpoint,
        keys: {
          p256dh: telefon.getPublicKey().toString("base64url"),
          auth: randomBytes(16).toString("base64url"),
        },
      },
    }),
  });
  verifica(abonare.ok, `telefonul se abonează la notificări (${abonare.status})`);
  const proba = await fetch(`${BAZA}/api/admin/push`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieCont, "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ fac: "proba" }),
  });
  await asteapta(500);
  verifica(proba.ok && notificari.length === 1, `notificarea de probă ajunge pe telefon (${notificari.length})`);

  async function webhook(eveniment) {
    const corp = JSON.stringify(eveniment);
    return fetch(`${BAZA}/api/donatii/stripe/webhook`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/json",
        "stripe-signature": semneaza(corp),
        "x-forwarded-host": "www.teona-ariana.ro",
      },
      body: corp,
    });
  }

  // ─── Stripe 1: anunțul la www. ─────────────────────────────────────────
  const id1 = `cs_test_unu${T}`;
  const e1 = `card.unu.${T}@exemplu.ro`;
  await initiata(id1, e1);
  const r1 = await webhook({ id: `evt_unu_${T}`, type: "checkout.session.completed", data: { object: sesiune(id1, e1) } });
  await asteapta(1200);
  verifica(r1.status === 200 && (await stare(id1)) === "platita", `Stripe la www.: primit și plătit (${r1.status}, ${await stare(id1)})`);
  verifica(catre(e1).length === 1, "Stripe: donatorul primește o mulțumire");
  verifica(anunturi("Donație nouă").length === 1, "Stripe: asociația primește „Donație nouă”");
  verifica(JSON.stringify(anunturi("Donație nouă")[0] ?? {}).includes("I-am trimis donatorului mulțumirea"), "anunțul spune că mulțumirea a plecat, fiindcă a plecat");
  verifica(notificari.length === 2, `Stripe: notificare pe telefon (${notificari.length - 1})`);
  const inainte = emailuri.length;
  await webhook({ id: `evt_unu_${T}`, type: "checkout.session.completed", data: { object: sesiune(id1, e1) } });
  await webhook({ id: `evt_unu_bis_${T}`, type: "checkout.session.completed", data: { object: sesiune(id1, e1) } });
  await asteapta(800);
  verifica(emailuri.length === inainte && notificari.length === 2, "Stripe: același anunț repetat nu mai trimite nimic");

  // ─── Stripe 2: plata fără rând „inițiat” ──────────────────────────────
  const id2 = `cs_test_doi${T}`;
  const e2 = `card.doi.${T}@exemplu.ro`;
  referinte.push(id2);
  await webhook({ id: `evt_doi_${T}`, type: "checkout.session.completed", data: { object: sesiune(id2, e2) } });
  await asteapta(1200);
  verifica((await stare(id2)) === "platita", `Stripe fără rând inițiat: rândul se scrie și e plătit (${await stare(id2)})`);
  verifica(catre(e2).length === 1, "Stripe fără rând inițiat: mulțumirea pleacă");

  // ─── Stripe 3: anunțul nu vine; panoul întreabă Stripe ────────────────
  const id3 = `cs_test_trei${T}`;
  const e3 = `card.trei.${T}@exemplu.ro`;
  await initiata(id3, e3);
  sesiuniStripe.set(id3, sesiune(id3, e3));
  const id4 = `cs_test_patru${T}`;
  await initiata(id4, `card.patru.${T}@exemplu.ro`);
  sesiuniStripe.set(id4, sesiune(id4, `card.patru.${T}@exemplu.ro`, "unpaid"));
  const id7 = `cs_test_sapte${T}`;
  await initiata(id7, `card.sapte.${T}@exemplu.ro`);
  sesiuniStripe.set(id7, { ...sesiune(id7, `card.sapte.${T}@exemplu.ro`, "unpaid"), status: "expired" });
  const panou = await (await fetch(`${BAZA}/admin/donatii`, { headers: { cookie } })).text();
  verifica((await stare(id7)) === "expirata", `o plată abandonată (expirată la Stripe) se închide singură (${await stare(id7)})`);
  verifica(!panou.includes("Verifică plățile la Stripe"), "în panou nu e nimic de apăsat pentru plăți: se confirmă singure");
  verifica((await stare(id3)) === "platita", `panoul găsește singur plata neanunțată (${await stare(id3)})`);
  verifica(panou.includes(e3), "…și o arată chiar la prima deschidere a donațiilor");
  verifica((await stare(id4)) === "initiata", "o plată neachitată la Stripe rămâne inițiată");
  verifica(catre(e3).length === 1 && anunturi("Donație nouă").length >= 3, "plata găsită de panou trimite mulțumirea și anunțul");

  // ─── Stripe 4: pagina de mulțumire ────────────────────────────────────
  const id6 = `cs_test_sase${T}`;
  const e6 = `card.sase.${T}@exemplu.ro`;
  await initiata(id6, e6);
  sesiuniStripe.set(id6, sesiune(id6, e6));
  const mult = await fetch(`${BAZA}/api/donatii/confirma`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ sesiune: id6 }),
  });
  const rm = await mult.json().catch(() => ({}));
  verifica(rm.stare === "platita" && (await stare(id6)) === "platita", `pagina de mulțumire confirmă plata Stripe (${rm.stare})`);
  const falsa = await (
    await fetch(`${BAZA}/api/donatii/confirma`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": DE_LA() },
      body: JSON.stringify({ sesiune: "cs_test_inventata123" }),
    })
  ).json().catch(() => ({}));
  verifica(falsa.stare !== "platita", `o sesiune inventată nu confirmă nimic (${falsa.stare})`);

  // ─── PayPal: încasarea din pagina de mulțumire ────────────────────────
  const comanda = `ORD${T}`.slice(0, 20);
  const captura = `CAP${T}`;
  const ep = `paypal.${T}@exemplu.ro`;
  referinte.push(captura);
  comenziPayPal.set(comanda, { captura, email: ep });
  const notif0 = notificari.length;
  const pp = await (
    await fetch(`${BAZA}/api/donatii/confirma`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": DE_LA() },
      body: JSON.stringify({ paypal: comanda }),
    })
  ).json().catch(() => ({}));
  verifica(pp.stare === "platita" && comenziPayPal.get(comanda).incasata, `PayPal: comanda aprobată e încasată (${pp.stare})`);
  verifica((await stare(captura)) === "platita", "PayPal: donația e în evidență, plătită");
  verifica(catre(ep).length === 1 && anunturi("Donație nouă").some((e) => String(e.subject).includes("20")), "PayPal: mulțumire la donator și anunț la asociație");
  verifica(notificari.length === notif0 + 1, "PayPal: notificare pe telefon");
  await fetch(`${BAZA}/api/donatii/confirma`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ paypal: comanda }),
  });
  await asteapta(500);
  verifica(catre(ep).length === 1, "PayPal: a doua confirmare (reîncărcarea paginii) nu dublează nimic");

  // ─── PayPal: anunțul de încasare ajunge înaintea paginii ──────────────
  const comanda2 = `ORDB${T}`.slice(0, 20);
  const captura2 = `CAPB${T}`;
  const ep2 = `paypal.doi.${T}@exemplu.ro`;
  referinte.push(captura2);
  comenziPayPal.set(comanda2, { captura: captura2, email: ep2, incasata: true });
  const evPP = await fetch(`${BAZA}/api/donatii/paypal/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url": "https://api.paypal.com/cert",
      "paypal-transmission-id": `tr-${T}`,
      "paypal-transmission-sig": "semnatura",
      "paypal-transmission-time": new Date().toISOString(),
    },
    body: JSON.stringify({
      id: `WH-EV-${T}`,
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: captura2,
        status: "COMPLETED",
        amount: { value: "20.00", currency_code: "EUR" },
        custom_id: "tabere|",
        supplementary_data: { related_ids: { order_id: comanda2 } },
      },
    }),
  });
  await asteapta(1000);
  verifica(evPP.ok && (await stare(captura2)) === "platita", `PayPal: anunțul de încasare înaintea paginii e primit (${evPP.status})`);
  verifica(catre(ep2).length === 1, "PayPal: …și donatorul tot primește mulțumirea (adresa luată din comandă)");
  await fetch(`${BAZA}/api/donatii/confirma`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ paypal: comanda2 }),
  });
  await asteapta(500);
  verifica(catre(ep2).length === 1, "PayPal: pagina deschisă după anunț nu dublează mulțumirea");

  // ─── Newsletterul: bun venit pe e-mail ────────────────────────────────
  const en = `buletin.${T}@exemplu.ro`;
  const notifNl = notificari.length;
  const nl = await fetch(`${BAZA}/api/newsletter`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-deschis": "30", "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ email: en, acord: true }),
  });
  const rn = await nl.json().catch(() => ({}));
  await asteapta(500);
  verifica(nl.ok && /bun venit/.test(rn.mesaj ?? ""), `newsletter: abonarea spune că a trimis bun venit (${rn.mesaj})`);
  verifica(catre(en).length === 1, "newsletter: e-mailul de bun venit chiar pleacă");
  const anuntAbonare = emailuri.filter(
    (e) => String(e.subject ?? "").startsWith("Abonat nou la buletin") && JSON.stringify(e).includes(en),
  );
  verifica(anuntAbonare.length === 1, "newsletter: asociația primește „Abonat nou la buletin”");
  // Anunțurile către asociație pleacă și la omul de strângere de fonduri.
  const interne = emailuri.filter((e) => /^(Donație nouă|Abonat nou la buletin|Mesaj nou|Voluntar nou|Transfer anunțat)/.test(String(e.subject ?? "")));
  verifica(
    interne.length > 0 && interne.every((e) => [].concat(e.to ?? []).includes("mihaela.sfichi@teona-ariana.ro")),
    `anunțurile către asociație ajung și la Mihaela (${interne.length})`,
  );
  verifica(notificari.length === notifNl + 1, `newsletter: notificare pe telefon (${notificari.length - notifNl})`);
  const abonatiPanou = await (await fetch(`${BAZA}/admin/abonati`, { headers: { cookie: cookieCont } })).text();
  verifica(abonatiPanou.includes(en), "newsletter: abonatul se vede la /admin/abonati");
  // A doua abonare cu aceeași adresă nu e o veste nouă.
  await fetch(`${BAZA}/api/newsletter`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-deschis": "30", "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ email: en, acord: true }),
  });
  await asteapta(500);
  verifica(
    emailuri.filter((e) => String(e.subject ?? "").startsWith("Abonat nou la buletin") && JSON.stringify(e).includes(en)).length === 1,
    "newsletter: aceeași adresă abonată iar nu mai anunță",
  );

  // ─── Transferul bancar ────────────────────────────────────────────────
  const et = `transfer.${T}@exemplu.ro`;
  const notif1 = notificari.length;
  const tr = await fetch(`${BAZA}/api/donatii/transfer`, {
    method: "POST",
    headers: { "x-deschis": "30", "x-forwarded-for": DE_LA() },
    body: new URLSearchParams({
      nume: "Ion Transfer",
      email: et,
      suma: "150",
      data: new Date().toISOString().slice(0, 10),
      destinatie: "tabere",
      confirm: "da",
    }),
  });
  await asteapta(800);
  const rt = (await baza.query("SELECT id, stare FROM donatii WHERE email = $1", [et])).rows[0];
  if (rt) referinte.push(rt.id);
  verifica(tr.ok && rt?.stare === "anuntata", `transferul anunțat intră „anunțată” (${tr.status}, ${rt?.stare})`);
  verifica(anunturi("transfer").length >= 1 && notificari.length === notif1 + 1, "transfer: asociația află pe e-mail și pe telefon");
  const bifa = await fetch(`${BAZA}/api/admin/donatii/confirma`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "x-forwarded-for": DE_LA(), "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id: rt?.id ?? "", hotarare: "confirma" }),
  });
  await asteapta(800);
  verifica((await stare(rt?.id ? (await baza.query("SELECT referinta FROM donatii WHERE id=$1", [rt.id])).rows[0].referinta : "")) === "platita", `bifa „Am găsit-o în extras” o face donație (${bifa.status})`);
  verifica(catre(et).some((e) => String(e.subject).includes("Am găsit transferul")), "transfer: donatorul primește „Am găsit transferul tău”");

  // ─── Formularele: e-mail la asociație, e-mail la om, notificare ───────
  async function formular(cale, corp, json = true) {
    const inainte = { e: emailuri.length, n: notificari.length };
    const r = await fetch(`${BAZA}${cale}`, {
      method: "POST",
      headers: {
        ...(json ? { "content-type": "application/json" } : {}),
        "x-deschis": "30",
        "x-forwarded-for": DE_LA(),
      },
      body: json ? JSON.stringify(corp) : new URLSearchParams(corp),
    });
    await asteapta(800);
    const noi = emailuri.slice(inainte.e);
    return { stare: r.status, noi, notificari: notificari.length - inainte.n };
  }
  const laAsociatie = (noi) =>
    noi.some((e) => [].concat(e.to ?? []).join(",").includes("@teona-ariana.ro"));
  const laOm = (noi, adresa) => noi.some((e) => [].concat(e.to ?? []).join(",").includes(adresa));
  const cazuri = [
    ["contact", "/api/contact", { fel: "contact", nume: "Ana Contact", email: `contact.${T}@exemplu.ro`, mesaj: "Aș vrea să aflu cum pot ajuta la tabere.", acord: true }, `contact.${T}@exemplu.ro`],
    ["voluntariat", "/api/contact", { fel: "voluntariat", nume: "Vlad Voluntar", email: `voluntar.${T}@exemplu.ro`, telefon: "0712345678", nastere: "1995-05-05", localitate: "Suceava", interes: "tabere", disponibilitate: "weekend", acord: true }, `voluntar.${T}@exemplu.ro`],
    ["redirecționare 3,5%", "/api/formulare", { fel: "redirectionare", nume: "Ion Redirectionare", email: `redir.${T}@exemplu.ro`, telefon: "0712345678", preferinta: "Completez online", acord: true }, `redir.${T}@exemplu.ro`],
    ["sponsorizare", "/api/formulare", { fel: "sponsorizare", firma: "FIRMA DE PROBA SRL", cui: "43533953", persoana: "Ion Firma", email: `firma.${T}@exemplu.ro`, telefon: "0712345678", cale: "Declarația 177", acord: true }, `firma.${T}@exemplu.ro`],
  ];
  for (const [nume, cale, corp, adresa] of cazuri) {
    const r = await formular(cale, corp);
    verifica(
      r.stare === 200 && laAsociatie(r.noi) && laOm(r.noi, adresa) && r.notificari === 1,
      `${nume}: trimis (${r.stare}), e-mail la asociație ${laAsociatie(r.noi) ? "da" : "NU"}, la om ${laOm(r.noi, adresa) ? "da" : "NU"}, notificare ${r.notificari}`,
    );
  }
  const f230 = await formular(
    "/api/formulare-230",
    { nume: "Maria Hartie", email: `f230.${T}@exemplu.ro`, ani: "1", acord: "da" },
    false,
  );
  verifica(
    f230.stare === 200 && laOm(f230.noi, `f230.${T}@exemplu.ro`) && f230.notificari === 1,
    `Formularul 230 pe hârtie: trimis (${f230.stare}), pașii pe e-mail la om, notificare ${f230.notificari}`,
  );
  const fdAniv = new FormData();
  for (const [k, v] of Object.entries({ ocazie: "zi-de-nastere-copil", titlu: "Ziua lui Andrei", mesaj: "Andrei face 7 ani și vrem să ajutăm copiii din tabere.", nume_public: "Familia Pop", email: `aniv.${T}@exemplu.ro`, acord: "da" })) fdAniv.append(k, v);
  const n0 = notificari.length;
  const e0 = emailuri.length;
  const aniv = await fetch(`${BAZA}/api/campanii`, { method: "POST", headers: { "x-deschis": "30", "x-forwarded-for": DE_LA() }, body: fdAniv });
  await asteapta(800);
  const noiAniv = emailuri.slice(e0);
  verifica(
    aniv.status === 201 && laAsociatie(noiAniv) && laOm(noiAniv, `aniv.${T}@exemplu.ro`) && notificari.length === n0 + 1,
    `campanie de aniversare: trimisă (${aniv.status}), e-mail la asociație și la om, notificare ${notificari.length - n0}`,
  );

  // ─── În panou și în contul donatorului ────────────────────────────────
  const tot = await (await fetch(`${BAZA}/admin/donatii`, { headers: { cookie } })).text();
  verifica([e1, e2, e3, e6, ep, et].every((e) => tot.includes(e)), "toate donațiile se văd la /admin/donatii");
  const bord = await (await fetch(`${BAZA}/admin`, { headers: { cookie: cookieCont } })).text();
  verifica(bord.includes("Notificări pe telefon"), "tabloul de bord are butonul de notificări");

  const cere = await fetch(`${BAZA}/api/cont/intrare`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-deschis": "30", "x-forwarded-for": DE_LA() },
    body: JSON.stringify({ email: e1 }),
  });
  await asteapta(800);
  const link = JSON.stringify(catre(e1).at(-1) ?? {}).match(/contul-meu\/intra\?jeton=([A-Za-z0-9_%-]+)/);
  const intrare = link
    ? await fetch(`${BAZA}/api/cont/intra`, {
        method: "POST",
        redirect: "manual",
        headers: { "content-type": "application/x-www-form-urlencoded", origin: BAZA },
        body: new URLSearchParams({ jeton: decodeURIComponent(link[1]) }),
      })
    : null;
  const cookieDonator = (intrare?.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const contDonator = await (await fetch(`${BAZA}/contul-meu`, { headers: { cookie: cookieDonator } })).text();
  verifica(cere.ok && Boolean(link) && /50(,00)? lei/.test(contDonator), "donatorul își vede donația în contul lui (/contul-meu)");
  verifica(contDonator.includes("Insignele tale") && contDonator.includes("Prima donație"), "contul donatorului are insignele (Prima donație)");
  verifica(!/ai ajutat \d+ copii/i.test(contDonator), "nicio insignă nu inventează „ai ajutat N copii”");
  const multumire = JSON.stringify(catre(e1)[0] ?? {});
  verifica(multumire.includes(`contul-meu#email=${encodeURIComponent(e1)}`), "mulțumirea are butonul spre cont, cu adresa completată (după #, nu pleacă la server)");

  // ─── Toate e-mailurile, cum le vede asociația în panou ────────────────
  const pagEmail = await (await fetch(`${BAZA}/admin/emailuri`, { headers: { cookie } })).text();
  const iduri = [...new Set([...pagEmail.matchAll(/\/api\/admin\/email\?ce=([a-z0-9-]+)/g)].map((m) => m[1]))];
  let stricate = [];
  for (const id of iduri) {
    const r = await fetch(`${BAZA}/api/admin/email?ce=${id}`, { headers: { cookie } });
    const h = await r.text();
    if (!r.ok || /\$\{|undefined|NaN|\[object Object\]|lorem/i.test(h)) stricate.push(`${id}(${r.status})`);
  }
  verifica(
    iduri.length >= 15 && stricate.length === 0 && ["anunt-donatie", "bun-venit-buletin"].every((x) => iduri.includes(x)),
    `toate e-mailurile din panou se deschid curate (${iduri.length}${stricate.length ? `; stricate: ${stricate.join(", ")}` : ""})`,
  );

  // ─── Fiecare e-mail trimis în probă e curat ───────────────────────────
  const urate = emailuri.filter((e) => /\$\{|undefined|NaN|\[object Object\]/.test(`${e.subject ?? ""} ${e.html ?? ""} ${e.text ?? ""}`));
  verifica(urate.length === 0, `niciun e-mail trimis nu are „undefined”, „NaN” sau șabloane necompletate (${emailuri.length} trimise${urate.length ? `; ${urate.map((e) => e.subject).join(" | ")}` : ""})`);
} finally {
  await baza.query("DELETE FROM donatii WHERE referinta = ANY($1) OR id::text = ANY($1)", [referinte]).catch(() => {});
  await baza.query("DELETE FROM abonamente_push WHERE endpoint LIKE $1", [`%telefon-${T}`]).catch(() => {});
  await baza.query("DELETE FROM utilizatori WHERE email = $1", [`plati.${T}@exemplu.ro`]).catch(() => {});
  await baza.query("DELETE FROM campanii_aniversare WHERE email = $1", [`aniv.${T}@exemplu.ro`]).catch(() => {});
  await baza.query("DELETE FROM cereri WHERE email LIKE $1", [`%.${T}@exemplu.ro`]).catch(() => {});
  await baza.query("DELETE FROM firme WHERE email = $1", [`firma.${T}@exemplu.ro`]).catch(() => {});
  await baza.query("DELETE FROM abonati_buletin WHERE email LIKE $1", [`%.${T}@exemplu.ro`]).catch(() => {});
  await baza.end();
  mock.close();
  serviciuPush.close();
  try {
    process.kill(-site.pid);
  } catch {
    /* s-a oprit deja */
  }
}

console.log(rele ? `\n${rele} verificări picate` : "\ntoate verificările trec");
process.exit(rele ? 1 : 0);
