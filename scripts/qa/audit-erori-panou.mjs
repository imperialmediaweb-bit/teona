// Auditul „erori”: apasă butoanele panoului și ale formularelor publice cu
// dependențele stricate și scrie ce vede omul și ce rămâne în jurnal.
//   node scripts/qa/audit-erori-panou.mjs <set> [jurnal-site]
// Seturi: rupt (e-mail port închis, MailerLite 500, Anthropic 429, Stripe timeout, PayPal 500, fără Cloudinary)
//         db-jos (baza pe port închis, mențiuni OK)
import fs from "node:fs";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4431";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const JURNAL = process.argv[3] ?? "";
const SET = process.argv[2] ?? "rupt";
const RAILWAY = { host: "localhost:8080", "x-forwarded-host": "teona-ariana.ro", "x-forwarded-proto": "https", "x-real-ip": "203.0.113.7" };
let cookie = "";
let contorIp = 10;

function jurnalDeLa(poz) { if (!JURNAL) return ""; return fs.readFileSync(JURNAL).subarray(poz).toString("utf8"); }
function pozJurnal() { return JURNAL ? fs.statSync(JURNAL).size : 0; }

async function intra() {
  const r = await fetch(`${BAZA}/api/admin/intrare`, { method: "POST", redirect: "manual", headers: { ...RAILWAY, "x-real-ip": `203.0.113.${Math.floor(Math.random() * 200) + 20}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ parola: PAROLA }) });
  const sc = r.headers.getSetCookie?.() ?? [];
  cookie = sc.map((c) => c.split(";")[0]).join("; ");
  console.log(`intrare: ${r.status} Location=${r.headers.get("location")} cookie=${cookie ? "da" : "NU"}`);
}

function mesajDinHtml(html) {
  // Textul cutiei de stare din panou (role="status" / id="stare" / role="alert") sau din pagina nuTrece.
  const curat = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const gasite = [];
  for (const m of html.matchAll(/<(p|div|section)[^>]*(role="(status|alert)"|id="stare")[^>]*>([\s\S]*?)<\/\1>/g)) gasite.push(curat(m[4]));
  const t = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (t === "Nu s-a salvat") gasite.push("[nuTrece] " + curat(html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ""));
  return gasite.filter(Boolean).slice(0, 3).join(" | ") || "(niciun mesaj de stare în pagină)";
}

export async function scenariu(nume, { cale, campuri = {}, fisier, json, antete = {}, metoda = "POST", urmeaza = true, cuCookie = true, timp, multipart = false }) {
  const poz = pozJurnal();
  const t0 = Date.now();
  let body, headers = { ...RAILWAY, "x-real-ip": `203.0.113.${(contorIp = (contorIp % 250) + 1)}`, ...antete };
  if (cuCookie && cookie) headers.cookie = cookie;
  if (json) { body = JSON.stringify(json); headers["content-type"] = "application/json"; }
  else if (multipart || fisier || Object.values(campuri).some((v) => v instanceof Blob)) {
    body = new FormData();
    for (const [k, v] of Object.entries(campuri)) body.append(k, v);
    if (fisier) body.append(fisier.camp, new Blob([fisier.octeti], { type: fisier.tip }), fisier.nume);
  } else if (metoda === "POST") { body = new URLSearchParams(campuri); headers["content-type"] = "application/x-www-form-urlencoded"; }
  let r, text = "", eroare = null;
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), timp ?? 20000);
    r = await fetch(`${BAZA}${cale}`, { method: metoda, headers, body, redirect: "manual", signal: ctl.signal });
    text = await r.text(); clearTimeout(tm);
  } catch (e) { eroare = e; }
  const dt = Date.now() - t0;
  console.log(`\n### ${nume}\n  ${metoda} ${cale}  → ${eroare ? "EROARE " + eroare.name + ": " + eroare.message : r.status} în ${dt} ms`);
  if (r) {
    const loc = r.headers.get("location");
    const tip = r.headers.get("content-type") ?? "";
    if (loc) console.log(`  Location: ${loc}`);
    if (!loc) console.log(`  content-type: ${tip}\n  corp: ${text.replace(/\s+/g, " ").slice(0, 260)}`);
    if (loc && urmeaza) {
      const p = await fetch(`${BAZA}${loc}`, { headers: { ...RAILWAY, cookie } });
      const html = await p.text();
      console.log(`  pagina ${loc.split("#")[0]} → ${p.status}: „${mesajDinHtml(html)}”`);
    } else if (tip.includes("text/html")) {
      console.log(`  pagina HTML: „${mesajDinHtml(text)}”`);
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  const j = jurnalDeLa(poz).trim();
  console.log(`  jurnal server: ${j ? "\n    " + j.split("\n").slice(0, 8).join("\n    ") : "(nimic)"}`);
  return { r, text, jurnal: j };
}

// Poze de probă: un JPEG minim valid (1×1), cu semnătura FF D8 FF.
import sharp from "sharp";
export const JPEG_MIC = await sharp({ create: { width: 320, height: 200, channels: 3, background: "#b82b09" } }).jpeg().toBuffer();
export const JPEG_VECHI = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z", "base64");

const seturi = {
  async rupt() {
    await intra();
    const om = { "x-deschis": "7" };
    // ---- Panou
    await scenariu("A1 utilizatori: cont nou cu invitație, Resend pe port închis", { cale: "/api/admin/utilizatori", campuri: { fel: "invita", email: `audit-erori-${Date.now()}@example.com`, nume: "Proba Audit", rol: "fundraising" } });
    await scenariu("A3 abonati: o adresă, MailerLite răspunde 500", { cale: "/api/admin/abonati", campuri: { lista: "persoane", acord: "da", acord_nota: "lista semnată la tabăra din iulie", adrese: "om-audit@example.com" } });
    await scenariu("A5 sponsori: siglă nouă, fără chei Cloudinary", { cale: "/api/admin/sponsori", campuri: { fel: "adauga", nume: "Firma Audit SRL" }, fisier: { camp: "poza", octeti: JPEG_MIC, tip: "image/jpeg", nume: "sigla.jpg" } });
    await scenariu("A6 scrie: noutate cu poză, fără chei Cloudinary", { cale: "/api/admin/texte", campuri: { fel: "noutate", titlu: "Noutate de probă audit", continut: "Un paragraf.\n\nAl doilea paragraf cu destule cuvinte ca să treacă.", actiune: "salveaza", poza_alt: "o poză de probă" }, fisier: { camp: "poza", octeti: JPEG_MIC, tip: "image/jpeg", nume: "poza.jpg" } });
    await scenariu("A7a sablon: trimite-ți o probă, Resend pe port închis", { cale: "/api/admin/sablon", campuri: { fel: "persoane", titlu: "Titlu probă", continut: "Un text destul de lung pentru șablon.", fac: "proba", catre: "cineva@example.com" } });
    await scenariu("A7b sablon: vezi cum arată, cu poză, fără chei Cloudinary", { cale: "/api/admin/sablon", campuri: { fel: "persoane", titlu: "Titlu probă", continut: "Un text destul de lung pentru șablon.", fac: "vezi", poza_alt: "descriere poză" }, fisier: { camp: "poza_fisier", octeti: JPEG_MIC, tip: "image/jpeg", nume: "poza.jpg" } });
    await scenariu("A7c sablon: fă ciorna în MailerLite, MailerLite 500", { cale: "/api/admin/sablon", campuri: { fel: "persoane", titlu: "Titlu probă", continut: "Un text destul de lung pentru șablon.", fac: "ciorna" } });
    await scenariu("A10 asistent: ciornă, Anthropic 429", { cale: "/api/admin/asistent", json: { fel: "buletin", despre: "Tabăra de vară de la Casa Teona, cu douăzeci de copii." } });
    await scenariu("A11 sfătuitor: întrebare, Anthropic 429", { cale: "/api/admin/sfatuitor", json: { conversatie: [{ rol: "om", text: "De unde încep cu cei care s-au oprit?" }] } });
    await scenariu("A12 radar: pornește scanarea, Anthropic 429", { cale: "/api/admin/radar", campuri: { fel: "scanează" } });
    // ---- Public
    await scenariu("P1 newsletter: MailerLite 500", { cale: "/api/newsletter", json: { email: "om@example.com", acord: true }, antete: om, cuCookie: false });
    await scenariu("P2 contact: Resend pe port închis", { cale: "/api/contact", json: { fel: "contact", nume: "Maria Probă", email: "maria@example.com", mesaj: "Aș vrea să aflu mai multe despre tabere.", acord: true }, antete: om, cuCookie: false });
    await scenariu("P3 formulare (3,5%): Resend pe port închis", { cale: "/api/formulare", json: { fel: "redirectionare", nume: "Ion Probă", email: "ion@example.com", acord: true, preferinta: "Completez online" }, antete: om, cuCookie: false });
    await scenariu("P4 formulare-230: Resend pe port închis", { cale: "/api/formulare-230", campuri: { nume: "Ana Probă", email: "ana@example.com", acord: "da", ani: "2" }, antete: om, cuCookie: false });
    await scenariu("P5 transfer anunțat: Resend pe port închis", { cale: "/api/donatii/transfer", campuri: { nume: "Vasile Probă", email: "vasile@example.com", suma: "150", destinatie: "oriunde", data: new Date().toISOString().slice(0, 10), confirm: "da" }, antete: om, cuCookie: false });
    await scenariu("P6 cont/intrare: link de intrare, Resend pe port închis", { cale: "/api/cont/intrare", json: { email: "donator@example.com" }, antete: om, cuCookie: false });
    await scenariu("P7 donatii/stripe: Stripe nu răspunde (timeout)", { cale: "/api/donatii/stripe", json: { lei: 50, frecventa: "o-data", destinatie: "oriunde", email: "d@example.com", prenume: "Dan", nume: "Probă", acord: "da" }, antete: om, cuCookie: false, timp: 3000 });
    await scenariu("P8 donatii/paypal: PayPal răspunde 500", { cale: "/api/donatii/paypal", json: { euro: 20, destinatie: "oriunde", email: "d@example.com", prenume: "Dan", nume: "Probă", acord: "da" }, antete: om, cuCookie: false });
    await scenariu("P9 întreabă: Anthropic 429", { cale: "/api/intreaba", json: { mesaje: [{ rol: "om", text: "Cum pot dona?" }] }, antete: om, cuCookie: false });
    await scenariu("P10 asistent/aniversare: Anthropic 429", { cale: "/api/asistent/aniversare", json: { text: "Anul ăsta în loc de cadouri vă rog să donați pentru copiii de la Casa Teona." }, antete: om, cuCookie: false });
    await scenariu("P12 contract/descarca: Resend pe port închis", { cale: "/api/contract/descarca", campuri: { denumire: "Firma Probă SRL", cui: "43533953", reprezentant: "Ion Popescu", calitate: "administrator", email: "firma@example.com", valoare: "1000", format: "pdf" }, antete: om, cuCookie: false });
  },
  async "db-jos"() {
    await intra();
    const om = { "x-deschis": "7" };
    await scenariu("D1 intrare cu cont (e-mail+parolă), baza pe port închis", { cale: "/api/admin/intrare", campuri: { email: "cineva@teona-ariana.ro", parola: "o-parola-oarecare-123" }, cuCookie: false });
    await scenariu("D2 GET /admin", { cale: "/admin", metoda: "GET" });
    await scenariu("D2b GET /admin/sponsori", { cale: "/admin/sponsori", metoda: "GET" });
    await scenariu("D2c GET /admin/cereri", { cale: "/admin/cereri", metoda: "GET" });
    await scenariu("D3 cifre: salvează, baza jos", { cale: "/api/admin/cifre", campuri: { valoare0: "33", sufix0: "", eticheta0: "tabere", valoare1: "1500", sufix1: "+", eticheta1: "participanți", valoare2: "80", sufix2: "+", eticheta2: "copii", valoare3: "300", sufix3: "+", eticheta3: "voluntari" } });
    await scenariu("D4 cereri: schimbă stadiul, baza jos", { cale: "/api/admin/cereri", campuri: { id: "11111111-1111-4111-8111-111111111111", stadiu: "contactat" } });
    await scenariu("D5 donatori: segment, baza jos", { cale: "/api/admin/donatori", campuri: { email: "x@example.com", actiune: "noteaza", nota: "probă" } });
    await scenariu("D5b jurnal: notiță, baza jos", { cale: "/api/admin/jurnal", campuri: { email: "x@example.com", fel: "telefon", rezumat: "L-am sunat.", inapoi: "/admin/donatori" } });
    await scenariu("D6 testimoniale: adaugă, baza jos", { cale: "/api/admin/testimoniale", campuri: { actiune: "adauga", citat: "Un citat destul de lung ca să treacă de limita de douăzeci de semne.", semnatura: "Maria, mamă" } });
    await scenariu("D7 utilizatori: cont nou, baza jos", { cale: "/api/admin/utilizatori", campuri: { actiune: "creeaza", email: "nou@example.com", nume: "Nou", rol: "fundraising", cum: "parola", parola: "o-parola-lunga-12345" } });
    await scenariu("D7b texte-pagini: schimbă un text, baza jos", { cale: "/api/admin/texte-pagini", campuri: { cheie: "prima-pagina.fraza", continut: "Un text nou destul de lung." } });
    await scenariu("D7c scrie: noutate fără poză, baza jos", { cale: "/api/admin/texte", campuri: { fel: "noutate", titlu: "Noutate de probă audit", continut: "Un paragraf.\n\nAl doilea paragraf cu destule cuvinte.", actiune: "salveaza" } });
    await scenariu("D7d donatii: donație manuală, baza jos", { cale: "/api/admin/donatii", campuri: { metoda: "numerar", suma: "100", destinatie: "asociatie", data: "2026-11-01", prenume: "Ion" } });
    await scenariu("D8 contact public, baza jos, Resend OK", { cale: "/api/contact", json: { fel: "contact", nume: "Maria Probă", email: "maria@example.com", mesaj: "Aș vrea să aflu mai multe despre tabere.", acord: true }, antete: om, cuCookie: false });
    await scenariu("D8b voluntar public, baza jos, Resend OK", { cale: "/api/contact", json: { nume: "Maria Probă", email: "maria@example.com", mesaj: "Vreau să ajut la tabere.", acord: true, fel: "voluntariat", nastere: "1990-01-01", contact: "telefon", telefon: "0711111111" }, antete: om, cuCookie: false });
    await scenariu("D9 newsletter public, baza jos, MailerLite OK", { cale: "/api/newsletter", json: { email: "om@example.com", acord: true }, antete: om, cuCookie: false });
    await scenariu("D10 sponsorizare public, baza jos, Resend OK", { cale: "/api/formulare", json: { fel: "sponsorizare", firma: "Firma Probă SRL", cui: "43533953", persoana: "Ion Popescu", email: "firma@example.com", acord: true, cale: "contract" }, antete: om, cuCookie: false });
    await scenariu("D10b formulare-230 public, baza jos", { cale: "/api/formulare-230", campuri: { nume: "Ana Probă", email: "ana@example.com", acord: "da", ani: "2" }, antete: om, cuCookie: false });
    await scenariu("D10c transfer anunțat, baza jos", { cale: "/api/donatii/transfer", campuri: { nume: "Vasile Probă", email: "vasile@example.com", suma: "150", destinatie: "oriunde", data: new Date().toISOString().slice(0, 10), confirm: "da" }, antete: om, cuCookie: false });
    await scenariu("D11 contract/descarca, baza jos", { cale: "/api/contract/descarca", campuri: { denumire: "Firma Probă SRL", cui: "43533953", reprezentant: "Ion Popescu", calitate: "administrator", email: "firma@example.com", valoare: "1000", format: "pdf" }, antete: om, cuCookie: false });
    await scenariu("D12 campanie aniversară public, baza jos", { cale: "/api/campanii", campuri: { ocazie: "zi-de-nastere", titlu: "Ziua mea pentru Teona", mesaj: "Anul ăsta în loc de cadouri vă rog să donați pentru copii.", nume_public: "Ioana", email: "ioana@example.com", acord: "da" }, fisier: { camp: "poza", octeti: Buffer.alloc(0), tip: "image/jpeg", nume: "" }, antete: om, cuCookie: false });
    await scenariu("D13 donatii/stripe, baza jos, Stripe OK (mențiune)", { cale: "/api/donatii/stripe", json: { lei: 50, frecventa: "o-data", destinatie: "oriunde", email: "d@example.com", prenume: "Dan", nume: "Probă", acord: "da" }, antete: om, cuCookie: false });
    await scenariu("D14 GET / (prima pagină)", { cale: "/", metoda: "GET", cuCookie: false });
    await scenariu("D15 GET /contul-meu", { cale: "/contul-meu", metoda: "GET", cuCookie: false });
  },
};
if (seturi[SET]) await seturi[SET]();

export async function set2() {
  await intra();
  const om = { "x-deschis": "7" };
  // C7: campanie aniversară făcută de un om, publicată din panou cu Resend căzut
  const c = await scenariu("C7a campanie aniversară nouă (public, fără poză)", { cale: "/api/campanii", campuri: { ocazie: "zi-de-nastere", titlu: "Ziua mea pentru Teona", mesaj: "Anul ăsta în loc de cadouri vă rog să donați pentru copiii de la Casa Teona.", nume_public: "Ioana", email: "ioana@example.com", acord: "da", data: "2026-12-20" }, antete: om, cuCookie: false, multipart: true });
  let slug = null; try { slug = JSON.parse(c.text).slug; } catch {}
  const id = slug ? (await (await fetch(`${BAZA}/admin/aniversari`, { headers: { cookie: cookieCurent() } })).text()).match(/name="id"[^>]*value="([0-9a-f-]{36})"/)?.[1] : null;
  console.log(`  campanie: slug=${slug} id=${id}`);
  if (id) await scenariu("C7b publică campania din panou, Resend pe port închis", { cale: "/api/admin/campanii", campuri: { id, hotarare: "publicata" } });
  // C11: voluntar înscris (e-mailul cade, cererea intră în CRM), apoi apel
  await scenariu("C11a voluntar nou (public), Resend pe port închis", { cale: "/api/contact", json: { fel: "voluntariat", nume: "Vlad Voluntar", email: "vlad@example.com", acord: true, nastere: "1995-05-05", contact: "E-mail", mesaj: "Vreau să ajut la tabere.", disponibilitate: "weekend" }, antete: om, cuCookie: false });
  const vol = (await (await fetch(`${BAZA}/admin/voluntari`, { headers: { cookie: cookieCurent() } })).text()).match(/name="voluntar"[^>]*value="([0-9a-f-]{36})"/)?.[1];
  console.log(`  voluntar id=${vol}`);
  if (vol) await scenariu("C11b apel către voluntari pe e-mail, Resend pe port închis", { cale: "/api/admin/voluntari/apel", campuri: { titlu: "Tabăra de autism", cand: "sâmbătă 12 decembrie, ora 9", unde: "Casa Teona", mesaj: "Avem nevoie de ajutor la jocuri și la masă.", voluntar: vol, pe_email: "da" } });
  await scenariu("C12 GET /admin/donatii cu Stripe care nu răspunde", { cale: "/admin/donatii", metoda: "GET", timp: 60000 });
}
export function cookieCurent() { return cookie; }
if (SET === "set2") await set2();

// Config 3: Resend OK (4432), MailerLite 500 (4433), chei Cloudinary false (401 de la Cloudinary adevărat),
// Stripe 500 (4433), PayPal fără răspuns (4434), Anthropic răspunde HTML 200 (4437).
import { createHmac } from "node:crypto";
export async function set3() {
  await intra();
  const om = { "x-deschis": "7" };
  const SECRET = process.env.SECRET_SESIUNE ?? "secret-de-proba-foarte-lung-pentru-verificare";
  const email = "donator@example.com";
  const expira = Math.floor(Date.now() / 1000) + 3600;
  const semn = createHmac("sha256", SECRET).update(`cont:${email}:${expira}`).digest("hex");
  const cont = { cookie: `teona_cont=${encodeURIComponent(`${email}|${expira}|${semn}`)}` };
  await scenariu("C1 GET /contul-meu (donator), Stripe răspunde 500", { cale: "/contul-meu", metoda: "GET", antete: cont, cuCookie: false, timp: 60000 });
  await scenariu("C2 cont/setari: bifează buletinul, MailerLite 500", { cale: "/api/cont/setari", campuri: { ce: "buletin", acord: "da" }, antete: cont, cuCookie: false });
  await scenariu("C3 cont/setari: scoate bifa buletinului (MailerLite adevărat, cheie falsă → 401)", { cale: "/api/cont/setari", campuri: { ce: "buletin" }, antete: cont, cuCookie: false, timp: 30000 });
  await scenariu("C5 sponsori: siglă nouă, chei Cloudinary greșite (401)", { cale: "/api/admin/sponsori", campuri: { fel: "adauga", nume: "Firma Audit SRL" }, fisier: { camp: "poza", octeti: JPEG_MIC, tip: "image/jpeg", nume: "sigla.jpg" }, timp: 30000 });
  await scenariu("C6 scrie: noutate cu poză, chei Cloudinary greșite (401)", { cale: "/api/admin/texte", campuri: { fel: "noutate", titlu: "Noutate de probă audit", continut: "Un paragraf.\n\nAl doilea paragraf cu destule cuvinte ca să treacă.", actiune: "salveaza", poza_alt: "o poză de probă" }, fisier: { camp: "poza", octeti: JPEG_MIC, tip: "image/jpeg", nume: "poza.jpg" }, timp: 30000 });
  await scenariu("C7 campanie aniversară cu poză (public), chei Cloudinary greșite (401)", { cale: "/api/campanii", campuri: { ocazie: "zi-de-nastere", titlu: "Ziua mea pentru Teona", mesaj: "Anul ăsta în loc de cadouri vă rog să donați pentru copiii de la Casa Teona.", nume_public: "Ioana", email: "ioana@example.com", acord: "da", data: "2026-12-20" }, fisier: { camp: "poza", octeti: JPEG_MIC, tip: "image/jpeg", nume: "poza.jpg" }, antete: om, cuCookie: false, timp: 30000 });
  await scenariu("C8 donatii/stripe: Stripe răspunde 500", { cale: "/api/donatii/stripe", json: { lei: 50, frecventa: "o-data", destinatie: "oriunde", email: "d@example.com", prenume: "Dan", nume: "Probă", acord: "da" }, antete: om, cuCookie: false, timp: 60000 });
  await scenariu("C9 donatii/paypal: PayPal nu răspunde (timeout)", { cale: "/api/donatii/paypal", json: { euro: 20, destinatie: "oriunde", email: "d@example.com", prenume: "Dan", nume: "Probă", acord: "da" }, antete: om, cuCookie: false, timp: 45000 });
  await scenariu("C10 asistent: Anthropic răspunde HTML 200 (pagină Cloudflare)", { cale: "/api/admin/asistent", json: { fel: "buletin", despre: "Tabăra de vară de la Casa Teona, cu douăzeci de copii." } });
  await scenariu("C12 utilizatori: cont nou cu invitație, Resend OK", { cale: "/api/admin/utilizatori", campuri: { fel: "invita", email: `audit-ok-${Date.now()}@example.com`, nume: "Proba Audit", rol: "fundraising" } });
  await scenariu("C14 cont/intrare, Resend OK", { cale: "/api/cont/intrare", json: { email }, antete: om, cuCookie: false });
  await scenariu("C15 newsletter, MailerLite 500 (încă o dată, pentru jurnal)", { cale: "/api/newsletter", json: { email: "om2@example.com", acord: true }, antete: om, cuCookie: false });
  await scenariu("C4 cont/setari: șterge-mi datele (MailerLite nu poate fi dezabonat)", { cale: "/api/cont/setari", campuri: { ce: "stergere", confirmare: "ȘTERGE" }, antete: cont, cuCookie: false, timp: 30000 });
}
if (SET === "set3") await set3();

export async function dbJos2() {
  await intra();
  const om = { "x-deschis": "7" };
  await scenariu("D3 cifre: salvează, baza jos", { cale: "/api/admin/cifre", campuri: { "valoare-0": "33", "sufix-0": "", "eticheta-0": "tabere", "valoare-1": "1500", "sufix-1": "+", "eticheta-1": "participanți", "valoare-2": "80", "sufix-2": "+", "eticheta-2": "copii", "valoare-3": "300", "sufix-3": "+", "eticheta-3": "voluntari" } });
  await scenariu("D4 cereri: schimbă stadiul, baza jos", { cale: "/api/admin/cereri", campuri: { id: "11111111-1111-4111-8111-111111111111", stadiu: "in_lucru" } });
  await scenariu("D5 donatori: notiță, baza jos", { cale: "/api/admin/donatori", campuri: { email: "x@example.com", fapta: "notita", nota: "probă" } });
  await scenariu("D7d donatii: donație manuală (numerar), baza jos", { cale: "/api/admin/donatii", campuri: { metoda: "manual-numerar", suma: "100", destinatie: "oriunde", data: "2026-11-01", prenume: "Ion" } });
  await scenariu("D10 sponsorizare public, baza jos, Resend OK", { cale: "/api/formulare", json: { fel: "sponsorizare", firma: "Firma Probă SRL", cui: "43533953", persoana: "Ion Popescu", email: "firma@example.com", acord: true, cale: "Declarația 177" }, antete: om, cuCookie: false });
  await scenariu("D16 sponsori: scoate de pe site, baza jos", { cale: "/api/admin/sponsori", campuri: { fel: "opreste", id: "11111111-1111-4111-8111-111111111111" } });
  await scenariu("D17 firme: schimbă stadiul, baza jos", { cale: "/api/admin/firme", campuri: { id: "11111111-1111-4111-8111-111111111111", stadiu: "contactata" } });
  await scenariu("D18 calendar: pune ziua, baza jos", { cale: "/api/admin/calendar", campuri: { id: "11111111-1111-4111-8111-111111111111", zi: "2026-12-01" } });
  await scenariu("D19 presa: contact nou, baza jos", { cale: "/api/admin/presa", campuri: { fel: "adauga", publicatie: "Monitorul de Probă", email: "redactia@example.com" } });
}
if (SET === "db-jos2") await dbJos2();

export async function set4() {
  const SECRET = process.env.SECRET_SESIUNE ?? "secret-de-proba-foarte-lung-pentru-verificare";
  const email = "donator@example.com";
  const expira = Math.floor(Date.now() / 1000) + 3600;
  const semn = createHmac("sha256", SECRET).update(`cont:${email}:${expira}`).digest("hex");
  const cont = { cookie: `teona_cont=${encodeURIComponent(`${email}|${expira}|${semn}`)}` };
  await scenariu("E1 GET /contul-meu (donator cu donații), Stripe nu răspunde", { cale: "/contul-meu", metoda: "GET", antete: cont, cuCookie: false, timp: 300000 });
  await scenariu("E2 cont/setari: oprește donația lunară, Stripe nu răspunde", { cale: "/api/cont/setari", campuri: { ce: "opreste-lunara", abonament: "sub_audit123" }, antete: cont, cuCookie: false, timp: 300000 });
}
if (SET === "set4") await set4();
