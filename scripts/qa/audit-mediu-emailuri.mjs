/**
 * Audit „mediu” (4 noiembrie 2026): fiecare e-mail pe care îl poate trimite
 * site-ul, declanșat prin rutele adevărate, cu cererea venită ca pe Railway
 * (Host: localhost:8080, x-forwarded-host, x-real-ip) și ADRESA_SITE pusă pe
 * https://www.teona-ariana.ro. Citește ce a primit mențiunea de Resend și
 * verifică: niciun localhost/undefined/NaN/${/[object, subiect și `to`
 * nevide, `text` lângă HTML, reply_to, diacritice, fiecare link de pe
 * domeniul nostru se deschide pe serverul local, iar linkurile semnate fac
 * ce promit.
 *
 * Cere: site pe 4441 (vezi brief), mențiunea audit-mediu-mentiune.mjs pe
 * 4442/4443, baza teona_audit_5.
 *   PAROLA_ADMIN=… SECRET_SESIUNE=… node scripts/qa/audit-mediu-emailuri.mjs
 */
import { createHmac } from "node:crypto";
import pg from "pg";

const BAZA = process.env.BAZA ?? "http://127.0.0.1:4441";
const MOCK = process.env.MOCK ?? "http://127.0.0.1:4442";
const MOCK2 = process.env.MOCK2 ?? "http://127.0.0.1:4443";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:x@127.0.0.1:5434/teona_audit_5";
const SECRET_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_audit_mediu";
const SITE = "https://www.teona-ariana.ro";
const T = Date.now();
const DE_LA = () => `198.51.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

/** Antetele cu care ajunge o cerere pe Railway. */
function caRailway(extra = {}) {
  return {
    host: "localhost:8080",
    "x-forwarded-host": "teona-ariana.ro",
    "x-forwarded-proto": "https",
    "x-real-ip": DE_LA(),
    origin: "https://teona-ariana.ro",
    "x-deschis": "7",
    ...extra,
  };
}

async function json(cale, corp, extra = {}) {
  return fetch(`${BAZA}${cale}`, {
    method: "POST",
    redirect: "manual",
    headers: caRailway({ "content-type": "application/json", ...extra }),
    body: JSON.stringify(corp),
  });
}
async function formular(cale, campuri, extra = {}) {
  return fetch(`${BAZA}${cale}`, {
    method: "POST",
    redirect: "manual",
    headers: caRailway({ "content-type": "application/x-www-form-urlencoded", ...extra }),
    body: new URLSearchParams(campuri),
  });
}
async function multipart(cale, campuri, extra = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campuri)) fd.append(k, v);
  return fetch(`${BAZA}${cale}`, { method: "POST", redirect: "manual", headers: caRailway(extra), body: fd });
}

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();

// ─── Jurnalul mențiunii ───────────────────────────────────────────────────
const arhiva = [];
async function goleste() { arhiva.push(...(await emailuri())); await fetch(`${MOCK}/__goleste`); }
async function emailuri() {
  const j = await (await fetch(`${MOCK}/__jurnal`)).json();
  return j.filter((x) => x.cale.startsWith("/emails")).map((x) => ({ ...x.corp, _antete: x.antete }));
}
/** Așteaptă până apar `cate` e-mailuri noi (after() din Next rulează după răspuns). */
async function iaEmailuri(cate, ms = 4000) {
  const start = Date.now();
  let e = [];
  while (Date.now() - start < ms) {
    e = await emailuri();
    if (e.length >= cate) break;
    await asteapta(200);
  }
  return e;
}

// ─── Verificarea unui e-mail ──────────────────────────────────────────────
const verificate = []; // { eticheta, subiect, catre, probleme }
const linkuriVazute = new Map(); // url -> stare

async function deschide(url) {
  if (linkuriVazute.has(url)) return linkuriVazute.get(url);
  if (url.includes("/contul-meu/intra?")) { linkuriVazute.set(url, "sărit (merge o dată)"); return 200; }
  let stare;
  try {
    const local = url.replace(/^https:\/\/(www\.)?teona-ariana\.ro/, BAZA);
    const r = await fetch(local, { redirect: "manual", headers: caRailway() });
    stare = r.status;
    if (stare === 307 || stare === 308 || stare === 303 || stare === 302) stare = `${r.status}→${r.headers.get("location")}`;
  } catch (e) {
    stare = `EROARE ${e.message}`;
  }
  linkuriVazute.set(url, stare);
  return stare;
}

async function verificaEmail(eticheta, e, asteptari = {}) {
  const probleme = [];
  const to = [].concat(e.to ?? []);
  if (!to.length || to.some((a) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(a)))) probleme.push(`to invalid: ${JSON.stringify(e.to)}`);
  if (!e.from || !/<[^@\s]+@teona-ariana\.ro>$/.test(e.from)) probleme.push(`from: ${JSON.stringify(e.from)}`);
  if (!String(e.subject ?? "").trim()) probleme.push("subiect gol");
  if (!String(e.html ?? "").trim()) probleme.push("html gol");
  if (!String(e.text ?? "").trim()) probleme.push("text simplu lipsă");
  if (asteptari.catre && !to.join(",").includes(asteptari.catre)) probleme.push(`to=${to.join(",")} dar se aștepta ${asteptari.catre}`);
  if (asteptari.replyTo !== undefined) {
    if (asteptari.replyTo === null && e.reply_to) probleme.push(`reply_to neașteptat: ${e.reply_to}`);
    if (asteptari.replyTo && e.reply_to !== asteptari.replyTo) probleme.push(`reply_to=${JSON.stringify(e.reply_to)} dar se aștepta ${asteptari.replyTo}`);
  }
  if (e.attachments) {
    for (const a of e.attachments) {
      if (!a.filename || /undefined|null/.test(a.filename)) probleme.push(`atașament cu nume stricat: ${a.filename}`);
      if (!a.content || a.content.length < 100) probleme.push(`atașament gol: ${a.filename}`);
    }
  }
  for (const [camp, continut] of [["subiect", e.subject], ["html", e.html], ["text", e.text], ["from", e.from], ["reply_to", e.reply_to]]) {
    const s = String(continut ?? "");
    for (const rau of ["localhost", "127.0.0.1", "undefined", "NaN", "${", "[object", "Ã", "Â", "�", "railway.app"]) {
      if (s.includes(rau)) probleme.push(`${camp} conține „${rau}”: …${s.slice(Math.max(0, s.indexOf(rau) - 60), s.indexOf(rau) + 40).replace(/\s+/g, " ")}…`);
    }
    const sablon = s.match(/\{[a-z_]+\}|\{\$[a-z_]+\}/g);
    if (sablon) probleme.push(`${camp} are șablon necompletat: ${[...new Set(sablon)].join(" ")}`);
    if (/\bnull\b/.test(s)) probleme.push(`${camp} conține „null”: …${s.slice(Math.max(0, s.search(/\bnull\b/) - 60), s.search(/\bnull\b/) + 30).replace(/\s+/g, " ")}…`);
  }
  if (/&amp;/.test(String(e.text ?? ""))) probleme.push("textul simplu are &amp; (link rupt în clientul de text)");
  // Linkurile
  const linkuri = new Set();
  for (const m of String(e.html ?? "").matchAll(/(?:href|src)="([^"]+)"/g)) linkuri.add(m[1]);
  for (const m of String(e.text ?? "").matchAll(/https?:\/\/[^\s<>"'”„)]+/g)) linkuri.add(m[0].replace(/[.,;:]+$/, ""));
  const straine = new Set();
  for (const l of linkuri) {
    if (/^(mailto:|tel:|#)/.test(l)) continue;
    const curat = l.replace(/&amp;/g, "&");
    if (/^https:\/\/(www\.)?teona-ariana\.ro/.test(curat)) {
      const stare = await deschide(curat);
      const ok = typeof stare === "number" ? stare < 400 : !String(stare).startsWith("EROARE") && !/→.*(localhost|127\.0\.0\.1)/.test(String(stare));
      if (!ok) probleme.push(`link rupt ${curat.slice(0, 120)} → ${stare}`);
    } else if (/^https?:\/\//.test(curat)) {
      straine.add(new URL(curat).host);
    } else {
      probleme.push(`link relativ sau ciudat: ${l.slice(0, 100)}`);
    }
  }
  verificate.push({ eticheta, subiect: e.subject, catre: to.join(","), replyTo: e.reply_to, straine: [...straine], probleme });
  verifica(probleme.length === 0, `${eticheta}: „${e.subject}” → ${to.join(",")}${probleme.length ? "\n        " + probleme.join("\n        ") : ""}`);
  return probleme;
}

function gaseste(lista, fragment, catre) {
  return lista.find((e) => String(e.subject ?? "").includes(fragment) && (!catre || [].concat(e.to).join(",").includes(catre)));
}
function linkDin(e, fragment) {
  const m = String(e.html ?? "").match(new RegExp(`href="(https://www\\.teona-ariana\\.ro${fragment}[^"]*)"`));
  return m ? m[1].replace(/&amp;/g, "&") : null;
}

// ─── Intrarea în panou ────────────────────────────────────────────────────
const intra = await formular("/api/admin/intrare", { parola: PAROLA });
const cookie = (intra.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).find((c) => c.startsWith("teona_verificare="));
verifica(Boolean(cookie) && String(intra.headers.get("location")).startsWith("/"), `intrarea în panou cu Host: localhost:8080 dă cookie și Location relativ (${intra.status} ${intra.headers.get("location")})`);
const CU_COOKIE = { cookie };

// ═════════════════════════════════════════════════════════════════════════
// 1. Newsletter: bun venit (persoană, firmă) + anunț la asociație
// ═════════════════════════════════════════════════════════════════════════
await goleste();
let r = await json("/api/newsletter", { email: `buletin.${T}@exemplu.ro`, nume: "Maria Popescu", acord: true, fel: "persoana" });
verifica(r.status === 200, `newsletter persoană (${r.status})`);
let e = await iaEmailuri(2);
await verificaEmail("bun-venit-buletin", gaseste(e, "", `buletin.${T}@exemplu.ro`) ?? {}, { catre: `buletin.${T}@exemplu.ro` });
await verificaEmail("anunt-abonare", gaseste(e, "Abonat nou", "contact@") ?? {}, { catre: "contact@teona-ariana.ro" });
await goleste();
r = await json("/api/newsletter", { email: `firma.${T}@exemplu.ro`, nume: "Firma de probă SRL", acord: true, fel: "firma" });
e = await iaEmailuri(2);
await verificaEmail("bun-venit-buletin-firma", gaseste(e, "", `firma.${T}@exemplu.ro`) ?? {}, { catre: `firma.${T}@exemplu.ro` });

// ═════════════════════════════════════════════════════════════════════════
// 2. Contact + voluntariat
// ═════════════════════════════════════════════════════════════════════════
await goleste();
r = await json("/api/contact", { fel: "contact", nume: "Ștefan Ionuț-Mărgineanu", email: `contact.${T}@exemplu.ro`, acord: true, mesaj: "Aș vrea să știu cum pot ajuta la tabăra de vară. Mulțumesc!", telefon: "0712 345 678" });
verifica(r.status === 200, `contact (${r.status})`);
e = await iaEmailuri(2);
await verificaEmail("contact (confirmare)", gaseste(e, "", `contact.${T}@exemplu.ro`) ?? {}, { catre: `contact.${T}@exemplu.ro`, replyTo: "contact@teona-ariana.ro" });
await verificaEmail("anunt-contact", gaseste(e, "", "contact@teona-ariana.ro") ?? {}, { catre: "contact@teona-ariana.ro", replyTo: `contact.${T}@exemplu.ro` });

await goleste();
const emailVoluntar = `voluntar.${T}@exemplu.ro`;
r = await json("/api/contact", { fel: "voluntariat", nume: "Ana-Maria Țurcanu", email: emailVoluntar, acord: true, telefon: "0723456789", contact: "E-mail", interes: "Tabere", localitate: "Suceava", disponibilitate: "weekend", experientaCopii: "da", limbi: "română, engleză", permis: "da", aflat: "Facebook", nastere: "1990-05-05", mesaj: "Vreau să ajut la tabere, am experiență cu copii." });
verifica(r.status === 200, `voluntariat (${r.status})`);
e = await iaEmailuri(2);
await verificaEmail("voluntariat (confirmare)", gaseste(e, "", emailVoluntar) ?? {}, { catre: emailVoluntar });
await verificaEmail("anunt-voluntariat", gaseste(e, "", "contact@teona-ariana.ro") ?? {}, { catre: "contact@teona-ariana.ro", replyTo: emailVoluntar });

// ═════════════════════════════════════════════════════════════════════════
// 3. Transfer anunțat → confirmat din panou
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const emailTransfer = `transfer.${T}@exemplu.ro`;
r = await formular("/api/donatii/transfer", { nume: "Ioana Grigoraș", confirm: "da", suma: "150", destinatie: "tabere", data: new Date().toISOString().slice(0, 10), email: emailTransfer });
verifica(r.status === 200, `transfer anunțat (${r.status}) ${r.status !== 200 ? await r.text() : ""}`);
e = await iaEmailuri(2);
await verificaEmail("transfer-anuntat", gaseste(e, "", emailTransfer) ?? {}, { catre: emailTransfer });
await verificaEmail("anunt-transfer", gaseste(e, "", "contact@teona-ariana.ro") ?? {}, { catre: "contact@teona-ariana.ro" });
const transfer = (await baza.query("SELECT id FROM donatii WHERE email = $1 AND stare = 'anuntata'", [emailTransfer])).rows[0];
await goleste();
r = await formular("/api/admin/donatii/confirma", { id: transfer?.id ?? "", hotarare: "confirma" }, CU_COOKIE);
verifica(r.status === 303 && String(r.headers.get("location")).includes("gata=1"), `„Am găsit-o în extras” (${r.status} ${r.headers.get("location")})`);
e = await iaEmailuri(1);
await verificaEmail("multumire-transfer", gaseste(e, "", emailTransfer) ?? {}, { catre: emailTransfer });

// ═════════════════════════════════════════════════════════════════════════
// 4. Formularul 230 pe hârtie
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const email230 = `f230.${T}@exemplu.ro`;
r = await formular("/api/formulare-230", { nume: "Vasile Șandru", email: email230, acord: "da", ani: "2", telefon: "0745 000 111" });
verifica(r.status === 200, `formular 230 (${r.status})`);
e = await iaEmailuri(2);
await verificaEmail("formular-230", gaseste(e, "", email230) ?? {}, { catre: email230 });
await verificaEmail("anunt-formular-230", gaseste(e, "", "contact@") ?? gaseste(e, "", "redirectionare@") ?? e.find((x) => ![].concat(x.to).join().includes(email230)) ?? {}, {});

// ═════════════════════════════════════════════════════════════════════════
// 5. Redirecționare 3,5% și sponsorizare (firme)
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const emailRedir = `redir.${T}@exemplu.ro`;
r = await json("/api/formulare", { fel: "redirectionare", nume: "Elena Păduraru", email: emailRedir, acord: true, preferinta: "Completez online", telefon: "0755 111 222" });
verifica(r.status === 200, `redirecționare (${r.status}) ${r.status !== 200 ? await r.text() : ""}`);
e = await iaEmailuri(2);
await verificaEmail("redirectionare", gaseste(e, "", emailRedir) ?? {}, { catre: emailRedir });
await verificaEmail("anunt-redirectionare", e.find((x) => ![].concat(x.to).join().includes(emailRedir)) ?? {}, {});

await goleste();
const emailFirma = `sponsor.${T}@exemplu.ro`;
r = await json("/api/formulare", { fel: "sponsorizare", firma: "Firma de probă SRL", cui: "RO43533953", persoana: "Dan Ciobanu", email: emailFirma, acord: true, cale: "Declarația 177", suma: "5.000 lei", mesaj: "Vrem să sponsorizăm tabăra de vară.", telefon: "0230 123 456" });
verifica(r.status === 200, `sponsorizare (${r.status}) ${r.status !== 200 ? await r.text() : ""}`);
e = await iaEmailuri(2);
await verificaEmail("sponsorizare", gaseste(e, "", emailFirma) ?? {}, { catre: emailFirma });
await verificaEmail("anunt-sponsorizare", e.find((x) => ![].concat(x.to).join().includes(emailFirma)) ?? {}, { replyTo: emailFirma });

// ═════════════════════════════════════════════════════════════════════════
// 6. Contractul făcut de firmă pe site (atașament PDF)
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const emailContract = `contract.${T}@exemplu.ro`;
r = await formular("/api/contract/descarca", { denumire: "Firma de probă SRL", cui: "43533953", reprezentant: "Dan Ciobanu", calitate: "administrator", valoare: "3.500", email: emailContract, telefon: "0230 123 456", sediu: "Suceava, str. Probei 1", fel: "pdf" });
verifica(r.status === 200 && (r.headers.get("content-type") ?? "").includes("pdf"), `contractul iese ca PDF (${r.status} ${r.headers.get("content-type")})`);
e = await iaEmailuri(2, 8000);
await verificaEmail("contract (către firmă, cu atașament)", gaseste(e, "", emailContract) ?? {}, { catre: emailContract });
await verificaEmail("anunt-contract", e.find((x) => ![].concat(x.to).join().includes(emailContract)) ?? {}, {});

// ═════════════════════════════════════════════════════════════════════════
// 7. Campanie de ziua ta: trimisă, publicată, respinsă
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const emailAniv = `aniv.${T}@exemplu.ro`;
r = await multipart("/api/campanii", { ocazie: "zi-de-nastere", titlu: `Ziua mea pentru Casa Teona ${T}`, mesaj: "Anul ăsta, în loc de cadouri, vă rog să donați pentru copiii de la Casa Teona.", nume_public: "Mihai Popescu", email: emailAniv, acord: "da", data_evenimentului: "2026-12-20" });
const ra = await r.json().catch(() => ({}));
verifica((r.status === 200 || r.status === 201) && ra.slug, `campanie de ziua ta trimisă (${r.status} ${JSON.stringify(ra).slice(0, 80)})`);
e = await iaEmailuri(2);
await verificaEmail("aniversare-trimisa", gaseste(e, "", emailAniv) ?? {}, { catre: emailAniv });
await verificaEmail("anunt-aniversare", e.find((x) => ![].concat(x.to).join().includes(emailAniv)) ?? {}, {});
const camp1 = (await baza.query("SELECT id FROM campanii_aniversare WHERE email = $1 ORDER BY creat_la DESC LIMIT 1", [emailAniv])).rows[0];
await goleste();
r = await formular("/api/admin/campanii", { id: camp1?.id ?? "", hotarare: "publicata" }, CU_COOKIE);
verifica(r.status === 303, `publicarea campaniei (${r.status})`);
e = await iaEmailuri(1);
await verificaEmail("aniversare-publicata", gaseste(e, "", emailAniv) ?? {}, { catre: emailAniv });
// a doua, respinsă
r = await multipart("/api/campanii", { ocazie: "zi-de-nastere-copil", titlu: `Ziua copilului meu ${T}`, mesaj: "Donați pentru tabere în loc de cadouri, vă rugăm frumos.", nume_public: "Mihai Popescu", email: emailAniv, acord: "da" });
const camp2 = (await baza.query("SELECT id FROM campanii_aniversare WHERE email = $1 AND stare = 'in_asteptare' ORDER BY creat_la DESC LIMIT 1", [emailAniv])).rows[0];
await goleste();
r = await formular("/api/admin/campanii", { id: camp2?.id ?? "", hotarare: "respinsa", motiv: "Lipsește o poză cu tine; trimite-ne una și o publicăm." }, CU_COOKIE);
e = await iaEmailuri(1);
await verificaEmail("aniversare-respinsa", gaseste(e, "", emailAniv) ?? {}, { catre: emailAniv });

// ═════════════════════════════════════════════════════════════════════════
// 8. Stripe: donație nouă, reînnoire, plată eșuată, vestea reînnoirii
// ═════════════════════════════════════════════════════════════════════════
function semneaza(corp) {
  const t = Math.floor(Date.now() / 1000);
  return `t=${t},v1=${createHmac("sha256", SECRET_WEBHOOK).update(`${t}.${corp}`).digest("hex")}`;
}
async function webhook(ev) {
  const corp = JSON.stringify(ev);
  return fetch(`${BAZA}/api/donatii/stripe/webhook`, {
    method: "POST", redirect: "manual",
    headers: { host: "localhost:8080", "x-forwarded-host": "www.teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": DE_LA(), "content-type": "application/json", "stripe-signature": semneaza(corp) },
    body: corp,
  });
}
await goleste();
const emailCard = `card.${T}@exemplu.ro`;
r = await webhook({ id: `evt_a_${T}`, type: "checkout.session.completed", data: { object: { id: `cs_a_${T}`, object: "checkout.session", payment_status: "paid", mode: "payment", amount_total: 15000, currency: "ron", customer_email: emailCard, customer_details: { email: emailCard }, metadata: { destinatie: "tabere", prenume: "Maria", nume: "Popescu", acord_buletin: "da" } } } });
verifica(r.status === 200, `Stripe checkout.session.completed la www. (${r.status})`);
e = await iaEmailuri(3);
await verificaEmail("multumire (card)", gaseste(e, "", emailCard) ?? {}, { catre: emailCard, replyTo: "contact@teona-ariana.ro" });
await verificaEmail("anunt-donatie", gaseste(e, "Donație nouă") ?? {}, {});
const abonare = gaseste(e, "Abonat nou");
if (abonare) await verificaEmail("anunt-abonare (din bifa de la donație)", abonare, {});

await goleste();
const emailFaraNume = `faranume.${T}@exemplu.ro`;
r = await webhook({ id: `evt_b_${T}`, type: "checkout.session.completed", data: { object: { id: `cs_b_${T}`, object: "checkout.session", payment_status: "paid", mode: "subscription", amount_total: 5000, currency: "ron", customer_email: emailFaraNume, customer_details: { email: emailFaraNume }, metadata: {} } } });
e = await iaEmailuri(2);
await verificaEmail("multumire-fara-nume (lunar, prima)", gaseste(e, "", emailFaraNume) ?? {}, { catre: emailFaraNume });

await goleste();
const sub = `sub_${T}`;
r = await webhook({ id: `evt_c_${T}`, type: "invoice.paid", data: { object: { id: `in_c_${T}`, object: "invoice", billing_reason: "subscription_cycle", amount_paid: 5000, currency: "ron", customer_email: emailCard, customer: `cus_${T}`, subscription: sub, subscription_details: { metadata: { destinatie: "tabere", prenume: "Maria", nume: "Popescu" } }, lines: { data: [{ amount: 5000 }] } } } });
verifica(r.status === 200, `Stripe invoice.paid (${r.status})`);
e = await iaEmailuri(1);
await verificaEmail("multumire-reinnoire", gaseste(e, "", emailCard) ?? {}, { catre: emailCard });
verifica(!gaseste(e, "Donație nouă"), "la reînnoire nu pleacă „Donație nouă” la asociație");

await goleste();
r = await webhook({ id: `evt_d_${T}`, type: "invoice.payment_failed", data: { object: { id: `in_d_${T}`, object: "invoice", amount_due: 5000, currency: "ron", customer_email: emailCard, customer: `cus_${T}`, subscription: sub, subscription_details: { metadata: { destinatie: "tabere", prenume: "Maria" } }, lines: { data: [{ amount: 5000 }] }, charge: { failure_message: "Your card has expired." } } } });
verifica(r.status === 200, `Stripe invoice.payment_failed (${r.status})`);
e = await iaEmailuri(2);
const plataEsuata = gaseste(e, "", emailCard) ?? {};
await verificaEmail("plata-esuata", plataEsuata, { catre: emailCard });
await verificaEmail("anunt-plata-esuata", gaseste(e, "", "contact@") ?? {}, { replyTo: emailCard });
const linkCard = linkDin(plataEsuata, "/actualizeaza-cardul");
verifica(Boolean(linkCard), `plata-esuata are linkul de card nou: ${linkCard?.slice(0, 90)}`);
if (linkCard) {
  const rc = await fetch(linkCard.replace(SITE, BAZA), { redirect: "manual", headers: caRailway() });
  verifica(rc.status === 303 && String(rc.headers.get("location")).startsWith("https://billing.stripe.com"), `linkul de card nou deschide portalul Stripe (${rc.status} → ${rc.headers.get("location")})`);
  const stricat = await fetch(linkCard.replace(SITE, BAZA).replace(/s=[0-9a-f]{6}/, "s=000000"), { redirect: "manual", headers: caRailway() });
  verifica(stricat.status === 410 && (await stricat.text()).includes("Linkul nu mai e bun"), `linkul de card cu semnătura stricată e refuzat cu 410 și pagină omenească (${stricat.status})`);
}

await goleste();
r = await webhook({ id: `evt_e_${T}`, type: "invoice.upcoming", data: { object: { id: null, object: "invoice", amount_due: 5000, currency: "ron", customer_email: emailCard, subscription: sub, next_payment_attempt: Math.floor(Date.now() / 1000) + 2 * 86400, subscription_details: { metadata: { destinatie: "tabere", prenume: "Maria" } }, lines: { data: [{ amount: 5000, period: { end: Math.floor(Date.now() / 1000) + 2 * 86400 } }] } } } });
verifica(r.status === 200, `Stripe invoice.upcoming (${r.status})`);
e = await iaEmailuri(1);
const veste = gaseste(e, "", emailCard) ?? {};
await verificaEmail("inainte-de-reinnoire", veste, { catre: emailCard });
const linkOprire = linkDin(veste, "/opreste-donatia");
verifica(Boolean(linkOprire), `vestea reînnoirii are linkul de oprire: ${linkOprire?.slice(0, 90)}`);
if (linkOprire) {
  const pagina = await fetch(linkOprire.replace(SITE, BAZA), { redirect: "manual", headers: caRailway() });
  const corpPagina = await pagina.text();
  verifica(pagina.status === 200 && /Oprește/.test(corpPagina), `pagina de oprire se deschide la GET fără să oprească nimic (${pagina.status})`);
  const q = new URL(linkOprire).searchParams;
  const post = await formular("/api/cont/opreste", { a: q.get("a"), p: q.get("p"), s: q.get("s") });
  verifica(post.status === 303 && r.headers && post.headers.get("location") === "/oprit", `POST pe linkul semnat oprește abonamentul (${post.status} → ${post.headers.get("location")})`);
  const j2 = await (await fetch(`${MOCK}/__jurnal`)).json();
  const laStripe = j2.filter((x) => x.port === 4443 && x.cale.includes("/v1/subscriptions"));
  verifica(laStripe.length >= 1, `oprirea a ajuns la Stripe: ${laStripe.map((x) => x.metoda + " " + x.cale).join(", ")}`);
}

// ═════════════════════════════════════════════════════════════════════════
// 9. Contul donatorului: linkul de intrare
// ═════════════════════════════════════════════════════════════════════════
await goleste();
r = await json("/api/cont/intrare", { email: emailCard });
verifica(r.status === 200, `cererea de link de intrare (${r.status})`);
e = await iaEmailuri(1);
const intrare = gaseste(e, "", emailCard) ?? {};
await verificaEmail("intrare-cont", intrare, { catre: emailCard, replyTo: "contact@teona-ariana.ro" });
const linkIntrare = linkDin(intrare, "/contul-meu/intra");
if (linkIntrare) {
  const ri = await fetch(linkIntrare.replace(SITE, BAZA), { redirect: "manual", headers: caRailway() });
  const setat = (ri.headers.getSetCookie?.() ?? []).join("; ");
  verifica(ri.status === 303 && ri.headers.get("location") === "/contul-meu" && /teona_cont|cont/.test(setat), `linkul de intrare deschide contul (${ri.status} → ${ri.headers.get("location")}; cookie: ${setat.slice(0, 60)})`);
  verifica(/Secure/i.test(setat), `cookie-ul contului poartă Secure în producție (${setat.replace(/=[^;]+/, "=…").slice(0, 120)})`);
  const iar = await fetch(linkIntrare.replace(SITE, BAZA), { redirect: "manual", headers: caRailway() });
  verifica(iar.status === 303 && String(iar.headers.get("location")).includes("expirat"), `linkul de intrare nu merge a doua oară (${iar.status} → ${iar.headers.get("location")})`);
}

// ═════════════════════════════════════════════════════════════════════════
// 10. Invitația în panou
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const emailInvitat = `invitat.${T}@exemplu.ro`;
r = await formular("/api/admin/utilizatori", { fel: "invita", email: emailInvitat, nume: "Mihaela Șt. Invitata", rol: "fundraising" }, CU_COOKIE);
verifica(r.status === 303 && String(r.headers.get("location")).startsWith("/"), `invitația pleacă (${r.status} ${r.headers.get("location")})`);
e = await iaEmailuri(1);
const inv = gaseste(e, "", emailInvitat) ?? {};
await verificaEmail("invitatie", inv, { catre: emailInvitat });
const linkInv = linkDin(inv, "/invitatie");
if (linkInv) {
  const pg1 = await fetch(linkInv.replace(SITE, BAZA), { headers: caRailway() });
  const html = await pg1.text();
  verifica(pg1.status === 200 && !html.includes("Mihaela") && !html.includes(emailInvitat), `pagina de invitație se deschide și nu scrie numele/adresa (${pg1.status})`);
  const q = new URL(linkInv).searchParams;
  const pus = await formular("/api/invitatie", { u: q.get("u"), i: q.get("i"), p: q.get("p"), s: q.get("s"), parola: "parola-foarte-lunga-123", iar: "parola-foarte-lunga-123" });
  const c2 = (pus.headers.getSetCookie?.() ?? []).join("; ");
  verifica(pus.status === 303 && pus.headers.get("location") === "/admin" && c2.includes("teona_verificare="), `parola din invitație intră direct în panou (${pus.status} → ${pus.headers.get("location")})`);
  const iar = await formular("/api/invitatie", { u: q.get("u"), i: q.get("i"), p: q.get("p"), s: q.get("s"), parola: "parola-foarte-lunga-123", iar: "parola-foarte-lunga-123" });
  verifica(iar.status === 303 && String(iar.headers.get("location")).includes("gresit=folosit"), `linkul de invitație nu merge a doua oară (${iar.headers.get("location")})`);
}
// reinvitare
const idInvitat = (await baza.query("SELECT id FROM utilizatori WHERE email = $1", [emailInvitat])).rows[0]?.id;
await goleste();
r = await formular("/api/admin/utilizatori", { fel: "reinvita", id: idInvitat ?? "" }, CU_COOKIE);
e = await iaEmailuri(1);
await verificaEmail("invitatie (retrimisă)", gaseste(e, "", emailInvitat) ?? {}, { catre: emailInvitat });

// ═════════════════════════════════════════════════════════════════════════
// 11. Apelul către voluntari și răspunsul
// ═════════════════════════════════════════════════════════════════════════
const cerereVol = (await baza.query("SELECT id FROM cereri WHERE email = $1 AND fel = 'voluntariat'", [emailVoluntar])).rows[0];
await goleste();
r = await formular("/api/admin/voluntari/apel", { titlu: "Tabăra de autism", cand: "sâmbătă, 15 noiembrie, 10:00–14:00", unde: "Casa Teona, Strada Zamca 22", mesaj: "Avem nevoie de patru oameni care să stea cu copiii la ateliere. Vă rugăm să confirmați.", pe_email: "da", voluntar: cerereVol?.id ?? "" }, CU_COOKIE);
verifica(r.status === 303 && String(r.headers.get("location")).includes("emailuri=1"), `apelul pleacă pe e-mail (${r.status} ${r.headers.get("location")})`);
e = await iaEmailuri(1);
const apel = gaseste(e, "", emailVoluntar) ?? {};
await verificaEmail("apel-voluntari", apel, { catre: emailVoluntar, replyTo: "contact@teona-ariana.ro" });
const linkPot = linkDin(apel, "/voluntari/raspuns");
if (linkPot) {
  const pg2 = await fetch(linkPot.replace(SITE, BAZA), { headers: caRailway() });
  const html = await pg2.text();
  verifica(pg2.status === 200 && !html.includes("Ana-Maria"), `pagina de răspuns se deschide fără să scrie numele (${pg2.status})`);
  const q = new URL(linkPot).searchParams;
  const rr = await formular("/api/voluntari/raspuns", { a: q.get("a"), c: q.get("c"), s: q.get("s"), raspuns: "pot" });
  verifica(rr.status === 303 && String(rr.headers.get("location")).includes("gata=pot"), `răspunsul „pot” se scrie (${rr.status} ${rr.headers.get("location")})`);
  const scris = (await baza.query("SELECT raspuns FROM raspunsuri_voluntari WHERE cerere_id = $1", [cerereVol?.id])).rows[0];
  verifica(scris?.raspuns === "pot", `…și e în baza de date (${scris?.raspuns})`);
  const fals = await formular("/api/voluntari/raspuns", { a: q.get("a"), c: q.get("c"), s: "0".repeat(64), raspuns: "pot" });
  verifica(String(fals.headers.get("location")).includes("gata=gresit"), "semnătura falsă e refuzată");
}

// ═════════════════════════════════════════════════════════════════════════
// 12. Proba șablonului de campanie (persoane și firme)
// ═════════════════════════════════════════════════════════════════════════
for (const fel of ["persoane", "firme"]) {
  await goleste();
  r = await formular("/api/admin/sablon", { fel, fac: "proba", catre: `proba.${fel}.${T}@exemplu.ro`, titlu: "Tabăra de iarnă 2026", text: "Primul paragraf al campaniei.\n\nAl doilea paragraf, cu diacritice: ăâîșț.", campanie: "tabara-iarna-2026" }, CU_COOKIE);
  verifica(r.status === 303 && String(r.headers.get("location")).includes("facut=proba"), `proba șablonului ${fel} (${r.status} ${r.headers.get("location")})`);
  e = await iaEmailuri(1);
  await verificaEmail(`sablon-proba-${fel}`, gaseste(e, "", `proba.${fel}.${T}@exemplu.ro`) ?? {}, { catre: `proba.${fel}.${T}@exemplu.ro` });
}

// ═════════════════════════════════════════════════════════════════════════
// 13. Comunicatul de presă
// ═════════════════════════════════════════════════════════════════════════
await baza.query("INSERT INTO contacte_presa (publicatie, fel, email, activ) VALUES ('Redacția de probă', 'online', $1, true)", [`presa.${T}@exemplu.ro`]);
const presa = (await baza.query("SELECT id FROM contacte_presa WHERE email = $1", [`presa.${T}@exemplu.ro`])).rows[0];
await goleste();
r = await multipart("/api/admin/presa/trimite", { subiect: "Tabăra de autism a strâns 40 de copii", text: "Primul paragraf, care spune tot ce e de spus despre tabără, cu diacritice ăâîșț.\n\n„Citatul cu nume”, a spus Corneliu Costiuc, președinte.\n\nContact: 0754 510 167.", confirm: "da", contact: presa?.id ?? "" }, CU_COOKIE);
verifica(r.status === 303 && String(r.headers.get("location")).includes("trimis=1"), `comunicatul pleacă (${r.status} ${r.headers.get("location")})`);
e = await iaEmailuri(1);
await verificaEmail("comunicat-presa", gaseste(e, "", `presa.${T}@exemplu.ro`) ?? {}, { catre: `presa.${T}@exemplu.ro`, replyTo: "contact@teona-ariana.ro" });

// ═════════════════════════════════════════════════════════════════════════
// 14. PayPal: încasarea din pagina de mulțumire
// ═════════════════════════════════════════════════════════════════════════
await goleste();
const emailPP = `paypal.${T}@exemplu.ro`;
const comanda = `ORD${T}`.slice(0, 17);
await fetch(`${MOCK2}/__paypal/x`, { method: "POST", body: JSON.stringify({ id: comanda, captura: `CAP${T}`, email: emailPP }) });
r = await json("/api/donatii/confirma", { paypal: comanda });
const rp = await r.json().catch(() => ({}));
verifica(rp.stare === "platita", `PayPal încasat din pagina de mulțumire (${rp.stare})`);
e = await iaEmailuri(2);
await verificaEmail("multumire (PayPal, euro)", gaseste(e, "", emailPP) ?? {}, { catre: emailPP });
await verificaEmail("anunt-donatie (PayPal)", gaseste(e, "Donație nouă") ?? {}, {});

// ═════════════════════════════════════════════════════════════════════════
// 15. Pagina /admin/emailuri se deschide
// ═════════════════════════════════════════════════════════════════════════
const pe = await fetch(`${BAZA}/admin/emailuri`, { headers: caRailway(CU_COOKIE) });
const htmlEm = await pe.text();
verifica(pe.status === 200 && !htmlEm.includes("localhost") && !htmlEm.includes("undefined"), `/admin/emailuri se deschide (${pe.status}), fără localhost/undefined`);
for (const ce of ["multumire", "contract", "inainte-de-reinnoire", "apel-voluntari"]) {
  const v = await fetch(`${BAZA}/api/admin/email?ce=${ce}`, { headers: caRailway(CU_COOKIE) });
  const t = await v.text();
  verifica(v.status === 200 && !t.includes("localhost") && !t.includes("undefined"), `exemplul ${ce} se randează (${v.status})`);
}

// ─── Sumar ───────────────────────────────────────────────────────────────
console.log("\n─── E-mailuri verificate ───");
for (const v of verificate) console.log(`${v.probleme.length ? "!!" : "  "} ${v.eticheta.padEnd(42)} ${String(v.subiect).slice(0, 60).padEnd(62)} → ${v.catre}${v.replyTo ? ` (reply_to ${v.replyTo})` : ""}${v.straine.length ? ` [străine: ${v.straine.join(" ")}]` : ""}`);
console.log("\n─── Linkuri de pe domeniu deschise local ───");
for (const [u, s] of linkuriVazute) console.log(`${String(s).padEnd(24)} ${u.slice(0, 130)}`);

arhiva.push(...(await emailuri()));
import("node:fs").then((fs) => fs.writeFileSync(process.env.ARHIVA ?? "/tmp/audit-mediu-emailuri.json", JSON.stringify(arhiva.map(({ _antete, ...e }) => e), null, 1)));
await baza.end();
console.log(rele ? `\n${rele} verificări căzute` : "\ntoate verificările au trecut");
process.exit(rele ? 1 : 0);
