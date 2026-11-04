/**
 * Audit „mediu”: ce face site-ul cu variabile de mediu scrise strâmb sau
 * lipsă. Serverul trebuie pornit DINAINTE cu mediul fiecărui scenariu (vezi
 * scripts/qa/audit-mediu-porneste.sh); scriptul doar întreabă și verifică.
 *
 *   node scripts/qa/audit-mediu-env.mjs rau          # chei cu rând nou/spațiu la capăt, ADRESA_SITE cu / și spațiu
 *   node scripts/qa/audit-mediu-env.mjs secret-scurt # SECRET_SESIUNE sub 32 de semne
 *   node scripts/qa/audit-mediu-env.mjs normal       # mediul bun, de referință
 */
import { createHmac } from "node:crypto";
import pg from "pg";

const MOD = process.argv[2] ?? "normal";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4441";
const MOCK = process.env.MOCK ?? "http://127.0.0.1:4442";
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:x@127.0.0.1:5434/teona_audit_5";
const PAROLA = "proba-locala-12345"; // cum o scrie omul, fără spațiul din Railway
const SECRET_WEBHOOK = "whsec_audit_mediu"; // cum e în Stripe, fără spațiul din Railway
const T = Date.now();
const DE_LA = () => `198.51.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));
let rele = 0;
const verifica = (ok, m) => { console.log(`${ok ? "ok  " : "CADE"} ${m}`); if (!ok) rele++; };
const nota = (m) => console.log(`info ${m}`);

const caRailway = (extra = {}) => ({ host: "localhost:8080", "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": DE_LA(), origin: "https://teona-ariana.ro", "x-deschis": "7", ...extra });
const json = (cale, corp, extra = {}) => fetch(`${BAZA}${cale}`, { method: "POST", redirect: "manual", headers: caRailway({ "content-type": "application/json", ...extra }), body: JSON.stringify(corp) });
const formular = (cale, campuri, extra = {}) => fetch(`${BAZA}${cale}`, { method: "POST", redirect: "manual", headers: caRailway({ "content-type": "application/x-www-form-urlencoded", ...extra }), body: new URLSearchParams(campuri) });
async function jurnal() { return (await fetch(`${MOCK}/__jurnal`)).json(); }
async function goleste() { await fetch(`${MOCK}/__goleste`); }
function semneaza(corp) { const t = Math.floor(Date.now() / 1000); return `t=${t},v1=${createHmac("sha256", SECRET_WEBHOOK).update(`${t}.${corp}`).digest("hex")}`; }
const webhook = (ev) => { const corp = JSON.stringify(ev); return fetch(`${BAZA}/api/donatii/stripe/webhook`, { method: "POST", redirect: "manual", headers: { host: "localhost:8080", "x-forwarded-host": "www.teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": DE_LA(), "content-type": "application/json", "stripe-signature": semneaza(corp) }, body: corp }); };

const baza = new pg.Client({ connectionString: DATABASE_URL });
await baza.connect();
console.log(`── scenariul: ${MOD} ──`);

// 1. Intrarea în panou cu parola asociației, scrisă fără spațiul de la capăt
const intra = await formular("/api/admin/intrare", { parola: PAROLA });
const cookie = (intra.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).find((c) => c.startsWith("teona_verificare="));
verifica(Boolean(cookie), `parola asociației, scrisă de om fără spațiu la capăt, intră în panou (${intra.status} → ${intra.headers.get("location")})`);

// 2. Un cont cu parolă (făcut de proba de e-mailuri) intră
const cont = (await baza.query("SELECT email FROM utilizatori WHERE parola IS NOT NULL AND activ ORDER BY creat_la DESC LIMIT 1")).rows[0];
if (cont) {
  const ic = await formular("/api/admin/intrare", { email: cont.email, parola: "parola-foarte-lunga-123" });
  const c2 = (ic.headers.getSetCookie?.() ?? []).join(";");
  verifica(c2.includes("teona_verificare="), `contul ${cont.email} intră cu parola lui (${ic.status} → ${ic.headers.get("location")})`);
} else nota("niciun cont cu parolă în bază; sare peste intrarea cu cont");

// 3. Invitația: pleacă un e-mail cu link?
await goleste();
const emailInv = `inv.${MOD}.${T}@exemplu.ro`;
const rInv = await formular("/api/admin/utilizatori", { fel: "invita", email: emailInv, nume: "Om Invitat", rol: "fundraising" }, { cookie: cookie ?? "" });
await asteapta(1500);
let j = await jurnal();
const eInv = j.filter((x) => x.cale.startsWith("/emails")).map((x) => x.corp).find((e) => [].concat(e.to).join().includes(emailInv));
nota(`invitația: răspuns ${rInv.status} → ${rInv.headers.get("location")}; e-mail primit de mențiune: ${eInv ? "da" : "NU"}${eInv ? `; link: ${(String(eInv.html).match(/href="([^"]*invitatie[^"]*)"/) ?? [])[1]?.slice(0, 80)}` : ""}`);
await baza.query("UPDATE utilizatori SET activ = false WHERE email = $1", [emailInv]);

// 4. Newsletter: e-mailul de bun venit și abonarea în MailerLite
await goleste();
const emailNl = `nl.${MOD}.${T}@exemplu.ro`;
const rNl = await json("/api/newsletter", { email: emailNl, nume: "Maria Popescu", acord: true, fel: "persoana" });
await asteapta(1500);
j = await jurnal();
const laResend = j.filter((x) => x.cale.startsWith("/emails") && [].concat(x.corp?.to).join().includes(emailNl));
const laMailerLite = j.filter((x) => x.cale.startsWith("/subscribers"));
nota(`newsletter: răspuns ${rNl.status} „${(await rNl.json().catch(() => ({}))).mesaj}”; la Resend: ${laResend.length}; la MailerLite: ${laMailerLite.length}${laMailerLite[0] ? ` (Authorization: ${JSON.stringify(laMailerLite[0].antete.authorization)})` : ""}${laResend[0] ? ` (Authorization: ${JSON.stringify(laResend[0].antete.authorization)})` : ""}`);
verifica(laResend.length === 1, "bun-venit ajunge la Resend");
verifica(laMailerLite.length === 1, "abonarea ajunge la MailerLite");

// 5. Stripe: anunț semnat cu secretul exact cum e în Stripe
await goleste();
const emailCard = `card.${MOD}.${T}@exemplu.ro`;
const rw = await webhook({ id: `evt_${MOD}_${T}`, type: "checkout.session.completed", data: { object: { id: `cs_${MOD}_${T}`, object: "checkout.session", payment_status: "paid", mode: "payment", amount_total: 5000, currency: "ron", customer_email: emailCard, customer_details: { email: emailCard }, metadata: { destinatie: "tabere", prenume: "Maria" } } } });
await asteapta(1500);
j = await jurnal();
const multumire = j.filter((x) => x.cale.startsWith("/emails") && [].concat(x.corp?.to).join().includes(emailCard));
verifica(rw.status === 200, `webhook-ul Stripe e acceptat (${rw.status} ${rw.status !== 200 ? JSON.stringify(await rw.json().catch(() => "")) : ""})`);
verifica(multumire.length === 1, `mulțumirea pleacă după plată (${multumire.length})`);
const stare = (await baza.query("SELECT stare FROM donatii WHERE referinta = $1", [`cs_${MOD}_${T}`])).rows[0]?.stare;
nota(`donația în bază: ${stare ?? "LIPSĂ"}`);

// 6. Vestea reînnoirii și plata eșuată: au link semnat?
await goleste();
await webhook({ id: `evt_up_${MOD}_${T}`, type: "invoice.upcoming", data: { object: { id: null, object: "invoice", amount_due: 5000, currency: "ron", customer_email: emailCard, subscription: `sub_${T}`, next_payment_attempt: Math.floor(Date.now() / 1000) + 2 * 86400, subscription_details: { metadata: { destinatie: "tabere", prenume: "Maria" } }, lines: { data: [{ amount: 5000 }] } } } });
await webhook({ id: `evt_pf_${MOD}_${T}`, type: "invoice.payment_failed", data: { object: { id: `in_pf_${MOD}_${T}`, object: "invoice", amount_due: 5000, currency: "ron", customer_email: emailCard, customer: `cus_${T}`, subscription: `sub_${T}`, subscription_details: { metadata: { destinatie: "tabere", prenume: "Maria" } }, lines: { data: [{ amount: 5000 }] } } } });
await asteapta(1500);
j = await jurnal();
const veste = j.filter((x) => x.cale.startsWith("/emails")).map((x) => x.corp).find((e) => /reînnoiește/.test(e.subject));
const esuata = j.filter((x) => x.cale.startsWith("/emails")).map((x) => x.corp).find((e) => /Cardul n-a mers/.test(e.subject));
nota(`vestea reînnoirii: ${veste ? (String(veste.html).includes("/opreste-donatia?") ? "cu buton de oprire" : "FĂRĂ buton de oprire (text cu telefon)") : "NU a plecat"}`);
nota(`plata eșuată: ${esuata ? (String(esuata.html).includes("/actualizeaza-cardul?") ? "cu link de card nou" : "FĂRĂ link de card nou (text cu telefon)") : "NU a plecat"}`);
for (const e of [veste, esuata].filter(Boolean)) {
  const links = [...String(e.html).matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const rele2 = links.filter((l) => !/^https:\/\/www\.teona-ariana\.ro\//.test(l) && !/^https:\/\/(www\.)?(facebook|instagram|tiktok)\.com/.test(l));
  verifica(rele2.length === 0 && !/\/\/[^"]*\/\//.test(links.filter((l) => l.includes("teona-ariana.ro")).map((l) => l.replace("https://", "")).join(" ")), `linkurile din „${e.subject.slice(0, 40)}” sunt pe ADRESA_SITE curată: ${links.filter((l) => l.includes("teona")).slice(0, 2).join(" ")}`);
}

// 7. Contul donatorului: linkul de intrare
await goleste();
const rc = await json("/api/cont/intrare", { email: emailCard });
await asteapta(1500);
j = await jurnal();
const eCont = j.filter((x) => x.cale.startsWith("/emails")).map((x) => x.corp).find((e) => /Intră în contul/.test(e.subject));
nota(`cerere link de cont: ${rc.status}; e-mail: ${eCont ? "da" : "NU"}`);
if (eCont) {
  const link = (String(eCont.html).match(/href="(https:[^"]*contul-meu\/intra[^"]*)"/) ?? [])[1]?.replace(/&amp;/g, "&");
  const r = await fetch(link.replace("https://www.teona-ariana.ro", BAZA), { redirect: "manual", headers: caRailway() });
  verifica(r.status === 303 && r.headers.get("location") === "/contul-meu", `linkul de intrare deschide contul (${r.status} → ${r.headers.get("location")})`);
}

// 8. Asistentul de pe site (Anthropic) și sitemapul (ADRESA_SITE)
const ra = await json("/api/intreaba", { mesaje: [{ rol: "om", text: "Cum pot dona?" }] });
nota(`asistentul: ${ra.status} ${(await ra.text()).slice(0, 120).replace(/\s+/g, " ")}`);
const sm = await (await fetch(`${BAZA}/sitemap.xml`)).text();
const locuri = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
verifica(locuri.length > 0 && locuri.every((l) => /^https:\/\/www\.teona-ariana\.ro(\/|$)/.test(l) && !/\s/.test(l) && !/ro\/\//.test(l)), `sitemapul are adrese curate (${locuri.slice(0, 2).join(" ")})`);
const robots = await (await fetch(`${BAZA}/robots.txt`)).text();
nota(`robots.txt: ${robots.split("\n").filter((l) => /Sitemap|Disallow/.test(l)).join(" | ")}`);
const acasa = await (await fetch(`${BAZA}/`)).text();
nota(`canonical pe prima pagină: ${(acasa.match(/rel="canonical" href="([^"]+)"/) ?? [])[1]}; robots meta: ${(acasa.match(/name="robots" content="([^"]+)"/) ?? [])[1]}`);

// 9. Transfer anunțat (notificaPanoul cu chei VAPID stricate nu trebuie să rupă răspunsul)
await goleste();
const rt = await formular("/api/donatii/transfer", { nume: "Ioana Grigoraș", confirm: "da", suma: "150", destinatie: "tabere", data: new Date().toISOString().slice(0, 10), email: `tr.${MOD}.${T}@exemplu.ro` });
verifica(rt.status === 200, `transferul anunțat răspunde 200 (${rt.status})`);

await baza.end();
console.log(rele ? `\n${rele} verificări căzute în scenariul ${MOD}` : `\nscenariul ${MOD}: toate verificările au trecut`);
