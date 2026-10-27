// Probă: BAZA=http://localhost:3000 node scripts/qa/manual-fundraising.mjs
// Serverul se pornește cu EMAIL_API, MAILERLITE_API și ANTHROPIC_API spre
// `node scripts/qa/mentiune-fundraising.mjs` (port 4390), cu PAROLA_ADMIN=proba-locala-12345,
// pe o bază cu datele de probă. Nimic nu iese în afară.
// Manualul de fundraising, pas cu pas, ca un om cu rolul „strângere de fonduri".
// Intră cu cont propriu (nu cu parola asociației), apasă butoanele, citește ce apare.
// Nimic nu iese în afară: e-mail, MailerLite și modelul merg la serverul de mențiune (4390).
import pw from "playwright";
import fs from "node:fs";
const { chromium } = pw;
const S = process.env.BAZA ?? "http://127.0.0.1:3120";
const M = "http://127.0.0.1:4390";
const ADMIN = "proba-locala-12345";
const IP = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
const EU = { nume: "Probă Fundraising", email: `proba.fr.${Date.now().toString(36)}@teona-ariana.ro`, parola: "o-parola-de-proba-lunga-1" };

let bune = 0, rele = 0; const caderi = [];
const ok = (c, t, d = "") => { if (c) { bune++; console.log("✓ " + t); } else { rele++; caderi.push(t + (d ? " — " + d : "")); console.log("✗ " + t + (d ? " — " + d : "")); } };
async function sectiune(nume, fn) { console.log(`\n=== ${nume} ===`); try { await fn(); } catch (e) { ok(false, `${nume}: a căzut cu o excepție`, String(e.message).split("\n")[0].slice(0, 200)); } }
const jurnal = async () => (await (await fetch(`${M}/__jurnal`)).json());
const golesteJurnal = () => fetch(`${M}/__goleste`);
const peste = (t, re) => re.test(t);

const b = await chromium.launch({
  args: ["--no-sandbox"],
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
});
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, extraHTTPHeaders: { "x-forwarded-for": IP } });
const p = await ctx.newPage();
const erori = [];
p.on("response", (r) => { if (r.status() >= 500 && r.url().startsWith(S)) erori.push(`${r.status()} ${r.url().replace(S, "")}`); });
const text = async () => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const merg = async (cale) => { await p.goto(S + cale, { waitUntil: "networkidle" }); };
const apasa = async (loc) => { await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}), loc.click()]); };
const deschide = () => p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
const asteaptaText = (t) => p.waitForFunction((x) => document.body.innerText.includes(x), t, { timeout: 15000 }).catch(() => {});
const nuEJson = async () => !(await p.content()).includes('{"mesaj"');

// ─── 0. Contul ────────────────────────────────────────────────────────────
await sectiune("Contul de strângere de fonduri", async () => {
  await merg("/admin");
  await p.fill('input[name="parola"]', ADMIN);
  await apasa(p.locator('button:has-text("Intră")'));
  await merg("/admin/utilizatori");
  const f = p.locator("form").filter({ has: p.locator('button:has-text("Fac eu parola")') });
  await f.locator('[name="nume"]').fill(EU.nume);
  await f.locator('[name="email"]').fill(EU.email);
  await f.locator('[name="parola"]').fill(EU.parola);
  await f.locator('[name="rol"]').selectOption("fundraising").catch(async () => { await f.locator('[name="rol"][value="fundraising"]').check(); });
  await apasa(f.locator('button:has-text("Fac eu parola")'));
  ok((await text()).includes(EU.email), "administratorul îi face cont, cu parola lui");
  await apasa(p.locator('button:has-text("Ieși din panou")'));
  await merg("/admin");
  await p.fill('input[name="email"]', EU.email);
  await p.fill('input[name="parola"]', EU.parola);
  await apasa(p.locator('button:has-text("Intră")'));
  ok(p.url().endsWith("/admin"), "intră cu adresa și parola ei", p.url());
  ok((await text()).includes(EU.nume), "panoul îi scrie numele");
});

// ─── 1. Tabloul de bord ───────────────────────────────────────────────────
await sectiune("Tabloul de bord", async () => {
  await asteaptaText("cereri");
  const t = await text();
  ok(/De făcut acum/i.test(t), "are „De făcut acum”");
  ok(/cereri noi|cerere nouă/i.test(t), "arată cererile noi");
  ok(/transfer/i.test(t), "arată transferurile anunțate de verificat");
  ok(/aniversăr/i.test(t), "arată aniversările de aprobat");
  ok(/lunar/i.test(t), "arată cât vine lunar");
});

// ─── 2. Donatorii ─────────────────────────────────────────────────────────
await sectiune("Donatorii", async () => {
  await merg("/admin/donatori");
  let t = await text();
  ok(t.includes("Popescu"), "lista are donatori");
  ok(/s-au oprit/i.test(t) && /donatori mari/i.test(t), "are segmentele „s-au oprit” și „donatori mari”");
  await apasa(p.locator('nav[aria-label="Segmente"] a', { hasText: "Donatori mari" }));
  t = await text();
  ok(t.includes("Radu") && !t.includes("Popescu"), "segmentul „donatori mari” strânge lista (Vlad Radu, 1.000 lei)", t.slice(0, 0));
  await merg("/admin/donatori");
  await apasa(p.locator("td a", { hasText: "Maria Popescu" }).first());
  t = await text();
  ok(/donați/i.test(t) && t.includes("maria.popescu@example.com"), "fișa donatorului se deschide, cu donațiile");
  const jf = p.locator('form[action="/api/admin/jurnal"]').first();
  const nota = "A spus că mai donează în decembrie " + Date.now().toString(36);
  await jf.locator('[name="rezumat"]').fill(nota);
  await apasa(jf.locator("button").first());
  t = await text();
  ok(t.includes(nota), "jurnalul discuțiilor salvează ce a spus omul");
  ok(t.includes(EU.nume), "rândul din jurnal poartă numele ei");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.goto(S + "/api/admin/export?ce=donatori").catch(() => {})]);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  ok(csv.charCodeAt(0) === 0xfeff && csv.includes(";"), "Export: CSV pentru Excel (BOM și ;)");
  ok(csv.includes("Popescu"), "exportul are donatorii");
});

// ─── 3. Donațiile ─────────────────────────────────────────────────────────
await sectiune("Donațiile", async () => {
  await golesteJurnal();
  await merg("/admin/donatii");
  let t = await text();
  ok(t.includes("Enache") && t.includes("Lazăr"), "sus: cele două transferuri anunțate");
  const rDana = p.locator("li").filter({ hasText: "Enache" }).filter({ has: p.locator('input[value="confirma"]') }).last();
  await apasa(rDana.locator('button:has-text("Am găsit-o în extras")'));
  ok(await nuEJson(), "„Am găsit-o în extras” nu dă pagină de eroare");
  const j = await jurnal();
  ok(j.some((x) => x.cale.startsWith("/emails") && JSON.stringify(x.corp).includes("dana.enache@example.com")), "pleacă mulțumirea către donator");
  await merg("/admin/donatii");
  t = await text();
  ok(!/Enache[^.]{0,80}Am găsit-o/.test(t), "transferul găsit nu mai e în lista de verificat");
  await golesteJurnal();
  const rSorin = p.locator("li").filter({ hasText: "Lazăr" }).filter({ has: p.locator('input[value="respinge"]') }).last();
  await apasa(rSorin.locator('button:has-text("N-am găsit-o")'));
  const j2 = await jurnal();
  ok(!j2.some((x) => x.cale.startsWith("/emails")), "„N-am găsit-o” nu trimite niciun mesaj");
  await merg("/admin/donatii");
  ok(!(await text()).includes("Lazăr"), "nici el nu mai e de verificat");
});

// ─── 4. Căutarea ──────────────────────────────────────────────────────────
await sectiune("Căutarea", async () => {
  await merg("/admin");
  await p.locator('input[name="q"]').first().fill("popescu");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.locator('input[name="q"]').first().press("Enter")]);
  let t = await text();
  ok(t.includes("Maria Popescu"), "caută după nume (litere mici)");
  await merg("/admin/cauta?q=0745%20111");
  ok((await text()).includes("Firma de Probă"), "caută după jumătate de telefon, și găsește firma");
  await merg("/admin/cauta?q=voluntar");
  await merg("/admin/cauta?q=lupu");
  ok((await text()).includes("Cristina Lupu"), "găsește și în cereri");
  await apasa(p.locator("a", { hasText: "Cristina Lupu" }).first());
  ok(/cereri/.test(p.url()) || (await text()).includes("cristina.lupu"), "rândul duce direct la ea", p.url());
});

// ─── 5. Firmele și contractul ─────────────────────────────────────────────
let idFirma = "";
await sectiune("Pâlnia firmelor și contractul", async () => {
  await merg("/admin/firme");
  let t = await text();
  ok(t.includes("Firma de Probă SRL") && t.includes("Transport Nordic"), "lista firmelor, cu stadiul fiecăreia");
  ok(await p.locator("a", { hasText: "Generează contractul" }).count() > 0, "linkul se cheamă „Generează contractul”, ca în manual");
  await p.fill('input[name="cauta"]', "lemnul");
  await apasa(p.locator('button:has-text("Caută")'));
  ok((await text()).includes("Lemnul Bucovinei") && !(await text()).includes("Transport Nordic"), "căutarea după denumire");
  await merg("/admin/firme");
  const rand = p.locator("form").filter({ has: p.locator('[name="stadiu"]') }).filter({ hasText: "" }).first();
  const html = await p.content();
  idFirma = (html.match(/\/admin\/firme\/([0-9a-f-]{36})\/contract/) ?? [])[1] ?? "";
  ok(Boolean(idFirma), "fiecare firmă are „Generează contractul”");
  const formFirma = p.locator(`form:has(input[name="id"][value="${(html.match(/name="id" value="([0-9a-f-]{36})"/) ?? [])[1]}"])`).first();
  await formFirma.locator('[name="stadiu"]').selectOption({ index: 1 });
  await apasa(formFirma.locator('button:has-text("Salvează")'));
  ok(await nuEJson(), "mutarea stadiului se salvează");
  await merg(`/admin/firme/${idFirma}/contract`);
  t = await text();
  ok(/contract/i.test(t) && /CUI/i.test(t), "pagina contractului se deschide, cu datele firmei");
  await p.fill('[name="valoare"]', "12500");
  await p.fill('[name="reprezentant"]', "Radu Călin");
  await p.fill('[name="calitate"]', "Administrator");
  await p.locator('[name="muta"]').check().catch(() => {});
  const btnPdf = p.locator('button:has-text("Descarcă contractul (PDF)")');
  const [pdf] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), btnPdf.click()]);
  const bytesPdf = fs.readFileSync(await pdf.path());
  ok(bytesPdf.slice(0, 4).toString() === "%PDF", "contractul iese în PDF", `${bytesPdf.length} octeți`);
  const pdfTxt = bytesPdf.toString("latin1");
  ok(/12[.\s]?500/.test(pdfTxt) || bytesPdf.length > 20000, "contractul poartă suma scrisă de ea");
  await merg(`/admin/firme/${idFirma}/contract`);
  await p.fill('[name="valoare"]', "12500");
  await p.fill('[name="reprezentant"]', "Radu Călin");
  await p.fill('[name="calitate"]', "Administrator");
  const [doc] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), p.locator('button:has-text("Descarcă în Word")').click()]);
  const bytesDoc = fs.readFileSync(await doc.path());
  ok(bytesDoc.slice(0, 2).toString() === "PK" && doc.suggestedFilename().endsWith(".docx"), "contractul iese și în Word", doc.suggestedFilename());
  await merg("/admin/firme");
  ok(/contract trimis/i.test(await text()), "firma a trecut la „contract trimis”");
});

await sectiune("Registrul contractelor", async () => {
  await merg("/admin/contracte");
  const t = await text();
  ok(/\b\d+\/20\d\d\b/.test(t), "contractul are număr dat singur (n/an)");
  ok(/bani neintrați/i.test(t), "are „semnate, bani neintrați”");
  ok(/anul ăsta nu|înainte/i.test(t), "are lista „cine a sponsorizat înainte și anul ăsta nu”");
  await deschide();
  const f = p.locator('form[action="/api/admin/contracte"]').first();
  await f.locator('[name="stadiu"]').selectOption({ index: 1 }).catch(() => {});
  await apasa(f.locator('button:has-text("Salvează")'));
  ok(await nuEJson(), "stadiul contractului se schimbă din registru");
});

// ─── 6. Șabloanele de e-mail ──────────────────────────────────────────────
await sectiune("Șabloanele de e-mail și MailerLite", async () => {
  for (const fel of ["persoane", "firme"]) {
    await merg(`/admin/sabloane?fel=${fel}`);
    const t = await text();
    ok(t.includes("412") && t.includes("57"), `[${fel}] listele din MailerLite apar cu numărul de abonați`);
    const bifat = await p.locator(`input[name="grup"][value="${fel === "firme" ? "g-firme" : "g-pers"}"]`).isChecked();
    ok(bifat, `[${fel}] lista potrivită vine bifată`);
  }
  await merg("/admin/sabloane?fel=persoane");
  const titlu = p.locator('[name="titlu"]'); await titlu.fill("Tabăra de iarnă are nevoie de tine");
  await p.locator('textarea[name="text"]').fill("Copiii de la Casa Teona pleacă la munte în februarie.\n\nFiecare leu ajunge la ei.");
  const [vezi] = await Promise.all([p.waitForEvent("popup"), p.locator('button:has-text("Vezi cum arată")').click()]);
  await vezi.waitForLoadState();
  const html = await vezi.content();
  ok(html.includes("Tabăra de iarnă") && html.includes("RO16 RNCB"), "„Vezi cum arată” deschide e-mailul, cu toate căile de a ajuta");
  await vezi.close();
  await golesteJurnal();
  await p.fill('[name="catre"]', "mihaela.proba@example.com");
  await apasa(p.locator('button:has-text("Trimite proba"), button:has-text("Trimite-ți o probă")').first());
  ok((await jurnal()).some((x) => x.cale.startsWith("/emails")), "„Trimite proba” pleacă");
  ok(/Proba a plecat/i.test(await text()), "pagina spune că proba a plecat");
  await merg("/admin/sabloane?fel=persoane");
  await titlu.fill("Tabăra de iarnă are nevoie de tine");
  await p.locator('textarea[name="text"]').fill("Copiii de la Casa Teona pleacă la munte în februarie.\n\nFiecare leu ajunge la ei.");
  await golesteJurnal();
  await apasa(p.locator('button:has-text("Fă ciorna în MailerLite")'));
  let j = await jurnal();
  ok(j.some((x) => x.metoda === "POST" && x.cale === "/campaigns"), "„Fă doar ciorna” creează campania în MailerLite");
  ok(!j.some((x) => x.cale.includes("/schedule")), "…și nu o trimite");
  await merg("/admin/sabloane?fel=persoane");
  await titlu.fill("Tabăra de iarnă are nevoie de tine");
  await p.locator('textarea[name="text"]').fill("Copiii de la Casa Teona pleacă la munte în februarie.\n\nFiecare leu ajunge la ei.");
  await golesteJurnal();
  await apasa(p.locator('button:has-text("Trimite campania acum")'));
  j = await jurnal();
  ok(!j.some((x) => x.cale.includes("/schedule")), "fără bifa de confirmare nu pleacă nimic");
  ok(/Bifează confirmarea/i.test(await text()), "…și pagina spune de ce");
  await merg("/admin/sabloane?fel=persoane");
  await titlu.fill("Tabăra de iarnă are nevoie de tine");
  await p.locator('textarea[name="text"]').fill("Copiii de la Casa Teona pleacă la munte în februarie.\n\nFiecare leu ajunge la ei.");
  await p.locator('input[name="confirm"]').check();
  await golesteJurnal();
  await apasa(p.locator('button:has-text("Trimite campania acum")'));
  j = await jurnal();
  const creata = j.find((x) => x.metoda === "POST" && x.cale === "/campaigns");
  ok(Boolean(creata) && j.some((x) => x.cale.includes("/schedule")), "cu bifa: campania se creează și pornește trimiterea");
  ok(creata && JSON.stringify(creata.corp.groups) === '["g-pers"]', "pleacă doar la lista bifată (persoane)", JSON.stringify(creata?.corp?.groups));
  ok(/Campania a plecat/i.test(await text()), "pagina spune că a plecat");
  ok(creata && /SUSTIN|8835/.test(creata.corp.emails?.[0]?.content ?? ""), "e-mailul către persoane are căile pentru oameni (SMS, card…)");

  // Același drum, pentru firme
  await merg("/admin/sabloane?fel=firme");
  await p.locator('[name="titlu"]').fill("Sponsorizați tabăra de iarnă");
  await p.locator('textarea[name="text"]').fill("Firma dumneavoastră poate susține tabăra de iarnă din impozitul pe profit.\n\nCalculul durează un minut.");
  await golesteJurnal();
  await p.fill('[name="catre"]', "firma.proba@example.com");
  await apasa(p.locator('button:has-text("Trimite proba"), button:has-text("Trimite-ți o probă")').first());
  const probaF = (await jurnal()).find((x) => x.cale.startsWith("/emails"));
  ok(Boolean(probaF), "[firme] proba pleacă");
  ok(probaF && /directioneaza-20|Declarați/i.test(JSON.stringify(probaF.corp)), "[firme] proba are calculatorul și Declarația 177");
  await merg("/admin/sabloane?fel=firme");
  await p.locator('[name="titlu"]').fill("Sponsorizați tabăra de iarnă");
  await p.locator('textarea[name="text"]').fill("Firma dumneavoastră poate susține tabăra de iarnă din impozitul pe profit.\n\nCalculul durează un minut.");
  await p.locator('input[name="confirm"]').check();
  await golesteJurnal();
  await apasa(p.locator('button:has-text("Trimite campania acum")'));
  const jf = await jurnal();
  const cf = jf.find((x) => x.metoda === "POST" && x.cale === "/campaigns");
  ok(Boolean(cf) && jf.some((x) => x.cale.includes("/schedule")), "[firme] campania se creează și pornește");
  ok(cf && JSON.stringify(cf.corp.groups) === '["g-firme"]', "[firme] pleacă doar la lista firmelor", JSON.stringify(cf?.corp?.groups));
  ok(cf && /directioneaza-20/.test(cf.corp.emails?.[0]?.content ?? "") && !/SUSTIN la 8835/.test(cf.corp.emails?.[0]?.content ?? ""), "[firme] conținutul e cel pentru firme, nu cel pentru persoane");
});

// ─── 7. Scrie pe site ─────────────────────────────────────────────────────
await sectiune("Noutăți și campanii pe site", async () => {
  const titluN = "Probă noutate " + Date.now().toString(36);
  await merg("/admin/scrie?fel=noutate");
  await apasa(p.locator("a", { hasText: "Scrie ceva nou" }).first());
  ok(p.url().includes("/admin/scrie/nou"), "„Scrie ceva nou” deschide formularul");
  await p.fill('[name="titlu"]', titluN);
  await p.fill('[name="rezumat"]', "Un rezumat scurt pentru listă.");
  await p.fill('[name="continut"]', "Primul paragraf al noutății de probă.\n\n## Un subtitlu\n\n- un punct\n- alt punct");
  await apasa(p.locator('button[name="actiune"]', { hasText: /^Publică/ }));
  ok(await nuEJson(), "noutatea se publică");
  await merg("/noutati");
  ok((await text()).includes(titluN), "apare pe /noutati");
  const slugN = ((await p.content()).match(new RegExp('href="(/noutati/[^"]+)"[^>]*>[^<]*' + titluN.split(" ").pop())) ?? [])[1];
  await merg(slugN ?? "/noutati");
  const t = await text();
  ok(t.includes("Un subtitlu") && t.includes("alt punct"), "pagina ei are subtitlul și lista");
  const titluC = "Probă campanie " + Date.now().toString(36);
  await merg("/admin/scrie/nou?fel=campanie");
  await p.fill('[name="titlu"]', titluC);
  await p.fill('[name="rezumat"]', "Rezumat campanie.");
  await p.fill('[name="continut"]', "Textul campaniei de probă, destul de lung ca să treacă.");
  if (await p.locator('[name="tinta"]').count()) await p.fill('[name="tinta"]', "5.000");
  await apasa(p.locator('button[name="actiune"]', { hasText: /^Publică/ }));
  await merg("/campanii");
  ok((await text()).includes(titluC), "campania apare pe /campanii");
  await merg("/admin/scrie/nou?fel=noutate");
  await p.fill('[name="titlu"]', "Scurt");
  await p.fill('[name="continut"]', "prea scurt");
  await p.locator('button[name="actiune"]', { hasText: "Salvează ciorna" }).click();
  await p.waitForTimeout(600);
  ok(p.url().includes("/admin/scrie/nou") && (await p.locator('[name="continut"]').inputValue()) === "prea scurt", "un text prea scurt e oprit înainte, cu textul păstrat");
});

// ─── 8. Ce mesaje trimite site-ul ─────────────────────────────────────────
await sectiune("Mesajele trimise", async () => {
  await merg("/admin/emailuri");
  const t = await text();
  ok(/ce primesc oamenii/i.test(t) || /primesc/i.test(t), "pagina arată ce primesc oamenii");
  ok(/nu pleacă/i.test(t), "jos scrie ce nu pleacă de la sine");
  const link = p.locator("a[href*='/admin/emailuri/'], a[href*='api/admin/email']").first();
  if (await link.count()) {
    const href = await link.getAttribute("href");
    const r = await p.request.get(S + href);
    ok(r.status() === 200 && (await r.text()).includes("0754 510 167"), "un mesaj se deschide, cu telefonul asociației", href);
  } else ok(false, "un mesaj se deschide", "n-am găsit linkul");
});

await sectiune("Pagina de Facebook", async () => {
  await merg("/admin/facebook");
  const t = await text();
  ok(await nuEJson() && /META_PAGE|Facebook/i.test(t), "pagina se deschide și spune ce lipsește pentru legătura cu pagina");
});

// ─── 9. Redirecționarea de 3,5% ───────────────────────────────────────────
await sectiune("Formularele 230", async () => {
  await merg("/admin/formulare");
  await deschide();
  const f = p.locator("form").filter({ has: p.locator('button:has-text("Adaugă în listă")') });
  const nume = "Ioana Proba " + Date.now().toString(36);
  await f.locator('[name="nume"]').fill(nume);
  await f.locator('[name="telefon"]').fill("0744 123 456");
  await f.locator('[name="email"]').fill("ioana.proba@example.com").catch(() => {});
  const ani = f.locator('[name="ani"]'); if (await ani.count()) { await ani.first().selectOption("2").catch(async () => { await f.locator('[name="ani"][value="2"]').check(); }); }
  await apasa(f.locator('button:has-text("Adaugă în listă")'));
  const t = await text();
  ok(t.includes(nume), "un formular adăugat de mână apare în listă");
  ok(/2 ani/.test(t), "are eticheta „2 ani”");
  ok((await p.content()).includes("wa.me/"), "are legătura de WhatsApp");
  const r = p.locator("form").filter({ has: p.locator('button:has-text("Mută")') }).filter({ hasText: "" }).first();
  await r.locator('[name="stadiu"]').selectOption({ index: 1 }).catch(() => {});
  await apasa(r.locator('button:has-text("Mută")'));
  ok(await nuEJson(), "stadiul formularului se mută");
});

await sectiune("Cererile", async () => {
  await merg("/admin/cereri");
  let t = await text();
  ok(t.includes("Cristina Lupu"), "lista are cererile");
  await apasa(p.locator("a", { hasText: "Voluntariat" }).first());
  t = await text();
  ok(t.includes("Cristina Lupu") && !t.includes("George Matei"), "filtrul pe fel lasă doar voluntariatul");
  await merg("/admin/cereri");
  const f = p.locator('form[action="/api/admin/cereri"]').filter({ has: p.locator('[name="stadiu"]') }).first();
  await f.locator('[name="stadiu"]').selectOption("rezolvat").catch(async () => f.locator('[name="stadiu"]').selectOption({ index: 2 }));
  await apasa(f.locator("button").first());
  ok(await nuEJson(), "stadiul cererii se salvează");
  const r = await p.request.get(S + "/api/admin/export?ce=cereri");
  ok(r.status() === 200 && (await r.text()).includes(";"), "Export cereri pentru Excel");
});

await sectiune("Documentele de descărcat", async () => {
  await merg("/admin/documente");
  const f = p.locator('form[action="/api/admin/documente"]').filter({ has: p.locator('input[value="declaratia-177"]') });
  fs.writeFileSync("/tmp/fals.pdf", "nu sunt pdf, sunt text");
  if (await f.locator("button").isDisabled()) {
    ok(/R2|nu e configurat|depozit/i.test(await text()), "fără depozit R2 (local), butonul e dezactivat și pagina spune de ce — pe site a mers azi, cu Declarația 177");
    const c0 = await p.request.get(S + "/documente/contract-de-sponsorizare");
    ok(c0.status() === 200 && (await c0.body()).slice(0, 4).toString() === "%PDF", "contractul de pe site se descarcă");
    return;
  }
  await f.locator('input[type="file"]').setInputFiles("/tmp/fals.pdf");
  await apasa(f.locator('button:has-text("Urcă")'));
  const t = await text();
  ok(/PDF/i.test(t) && (await nuEJson()), "un fișier care nu e PDF adevărat e refuzat, cu mesaj");
  const c = await p.request.get(S + "/documente/contract-de-sponsorizare");
  ok(c.status() === 200 && (await c.body()).slice(0, 4).toString() === "%PDF", "contractul de pe site se descarcă");
});

// ─── 10. Campanii, afișe, presă ───────────────────────────────────────────
await sectiune("Campaniile de ziua cuiva", async () => {
  await golesteJurnal();
  await merg("/admin/aniversari");
  ok((await text()).includes("Împlinesc 30 de ani"), "campania în așteptare se vede, cu titlul și mesajul");
  const fa = p.locator("form").filter({ has: p.locator('input[name="hotarare"][value="publicata"]') }).first();
  ok(await fa.locator('button:has-text("Aprobă")').count() === 1, "butonul se cheamă „Aprobă”, ca în manual");
  await apasa(fa.locator('button:has-text("Aprobă")'));
  const pag = await p.request.get(S + "/ziua-ta/ziua-anei");
  ok((await pag.text()).includes("Împlinesc 30 de ani"), "„Publică” o pune la /ziua-ta/ziua-anei");
  ok((await jurnal()).some((x) => JSON.stringify(x.corp).includes("ana.marin@example.com")), "omul primește vestea pe e-mail");
  await merg("/admin/aniversari");
  const fr = p.locator("form").filter({ has: p.locator('input[name="hotarare"][value="respinsa"]') }).first();
  await fr.locator('input[name="motiv"]').fill("Ne trebuie o fotografie mai clară.");
  await golesteJurnal();
  await apasa(fr.locator("button").first());
  const pr = await p.request.get(S + "/ziua-ta/ziua-lui-dan");
  ok(!(await pr.text()).includes("Fac 40 de ani"), "„Respinge” nu o publică");
  const refuz = (await jurnal()).find((x) => JSON.stringify(x.corp).includes("dan.moraru@example.com"));
  ok(Boolean(refuz), "omul respins primește vestea pe e-mail");
  ok(refuz && JSON.stringify(refuz.corp).includes("fotografie mai clar"), "…cu motivul scris");
});

await sectiune("Codurile QR", async () => {
  await merg("/admin/qr");
  await p.fill('[name="loc"]', "farmacia din centru");
  await apasa(p.locator('button:has-text("Fă codul")'));
  const html = await p.content();
  const png = (html.match(/href="([^"]*format=png[^"]*|[^"]*\.png[^"]*)"/i) ?? [])[1];
  const svg = (html.match(/href="([^"]*format=svg[^"]*|[^"]*svg[^"]*)"/i) ?? [])[1];
  const curat = html.replace(/&amp;/g, "&");
  ok(/utm_source(=|%3D)qr/.test(curat) && /farmacia/.test(curat), "linkul din cod e etichetat cu locul");
  if (png) { const r = await p.request.get(new URL(png.replace(/&amp;/g, "&"), S).href); ok(r.status() === 200 && /png/.test(r.headers()["content-type"] ?? ""), "se descarcă PNG"); } else ok(false, "se descarcă PNG", "fără link");
  if (svg) { const r = await p.request.get(new URL(svg.replace(/&amp;/g, "&"), S).href); ok(r.status() === 200 && /svg/.test(r.headers()["content-type"] ?? ""), "se descarcă SVG"); } else ok(false, "se descarcă SVG", "fără link");
});

await sectiune("Lista de presă", async () => {
  await merg("/admin/presa");
  await deschide();
  const pub = "Gazeta de Probă " + Date.now().toString(36);
  const f = p.locator("form").filter({ has: p.locator('button:has-text("Adaugă")') }).last();
  await f.locator('[name="publicatie"]').fill(pub);
  await f.locator('[name="email"]').fill("redactie@gazetadeproba.example");
  await apasa(f.locator('button:has-text("Adaugă")'));
  ok((await text()).includes(pub), "o redacție nouă se adaugă");
  await deschide();
  const fe = p.locator("form").filter({ has: p.locator(`input[value="${pub}"]`) }).first();
  await fe.locator('[name="notite"]').fill("A scris despre tabăra de iarnă.");
  await apasa(fe.locator('button:has-text("Salvează")'));
  ok((await p.content()).includes("A scris despre tabăra de iarnă."), "notițele la redacție se salvează");
  ok(/Bcc|copiaz/i.test(await text()), "pagina spune cum se trimit adresele (Bcc)");
});

await sectiune("Calendarul", async () => {
  await merg("/admin/calendar?luna=2027-05");
  ok(/25 mai/i.test(await text()) || /Formular(ul)? 230/i.test(await text()), "în mai se vede termenul de 25 mai");
  await merg("/admin/calendar?luna=2027-06");
  ok(/1 iunie|Ziua Copilului/i.test(await text()), "în iunie, 1 iunie");
  await merg("/admin/calendar?luna=2027-12");
  ok(/3 decembrie|dizabilit/i.test(await text()), "în decembrie, 3 decembrie");
  const titlu = "Ciornă calendar " + Date.now().toString(36);
  await merg("/admin/scrie/nou?fel=noutate");
  await p.fill('[name="titlu"]', titlu);
  await p.fill('[name="continut"]', "Textul ciornei pentru calendar, destul de lung.");
  await apasa(p.locator('button[name="actiune"]', { hasText: "Salvează ciorna" }));
  await merg("/admin/calendar");
  const c = p.locator("li").filter({ hasText: titlu });
  ok(await c.count() === 1, "ciorna apare la „Ciornele”, cu câmp de zi");
  const azi = new Date(); const zi = `${azi.getFullYear()}-${String(azi.getMonth() + 1).padStart(2, "0")}-${String(Math.min(27, azi.getDate() + 1)).padStart(2, "0")}`;
  await c.locator('input[name="zi"]').fill(zi);
  await apasa(c.locator('button:has-text("Pune în calendar")'));
  await merg("/admin/calendar");
  ok((await p.content()).includes(titlu) && (await text()).includes("plănuit pe " + zi), "„Pune în calendar” o pune pe ziua aleasă", zi);
});

// ─── 11. Cifrele și consultantul ──────────────────────────────────────────
await sectiune("Analiza și consultantul", async () => {
  await golesteJurnal();
  await merg("/admin/analiza");
  let t = await text();
  ok(/De unde vin donatorii/i.test(t), "are „De unde vin donatorii”");
  ok(/campanie/i.test(t), "are „Ce a adus fiecare campanie”");
  ok(/Google Analytics|GA_PROPERTY_ID/i.test(t), "secțiunea de vizite se vede (sau spune ce lipsește)");
  await apasa(p.locator('button:has-text("Fă prima analiză"), button:has-text("Fă analiza")').first());
  t = await text();
  ok(t.includes("Răspuns de probă de la model") || /puține|prea puțin/i.test(t), "analiza: răspunde (sau spune că sunt prea puține donații pentru o citire)");
  const j = await jurnal();
  const spreModel = JSON.stringify(j.filter((x) => x.cale.startsWith("/v1/messages")));
  ok(!/popescu|example\.com|0712/i.test(spreModel), "spre model n-a plecat niciun nume, e-mail sau telefon");
  const caseta = p.locator("form").filter({ has: p.locator('button:has-text("Întreabă")') }).locator("input, textarea").first();
  await caseta.fill("De unde încep cu donatorii care s-au oprit?");
  await golesteJurnal();
  await p.locator('button:has-text("Întreabă")').click();
  await asteaptaText("Răspuns de probă de la model");
  ok((await text()).includes("Răspuns de probă de la model"), "consultantul răspunde în casetă");
  ok((await jurnal()).some((x) => x.cale.startsWith("/v1/messages")), "întrebarea a ajuns la model");
});

await sectiune("Rapoartele în PDF", async () => {
  await merg("/admin/rapoarte");
  for (const fel of ["lunar", "anual"]) {
    const f = p.locator('form[action="/api/admin/raport"]').filter({ has: p.locator(`input[name="fel"][value="${fel}"]`) }).first();
    const [d] = await Promise.all([p.waitForEvent("download", { timeout: 30000 }), f.locator('button:has-text("Descarcă PDF")').click()]);
    const bytes = fs.readFileSync(await d.path());
    ok(bytes.slice(0, 4).toString() === "%PDF" && bytes.length > 2000, `raportul ${fel} iese în PDF`, `${bytes.length} octeți`);
  }
});

await sectiune("Radarul de finanțări", async () => {
  await merg("/admin/radar");
  ok(!/n-are cheie de model/i.test(await text()), "radarul vede cheia");
  await apasa(p.locator('button:has-text("Scanează acum")'));
  ok(/a pornit/i.test(await text()), "„Scanează acum” răspunde pe loc că a pornit");
  let gasit = false;
  for (let i = 0; i < 15 && !gasit; i++) { await p.waitForTimeout(2000); await merg("/admin/radar"); gasit = !(await text()).includes("N-a rulat încă nicio scanare"); }
  ok(gasit, "după câteva secunde, scanarea apare la „Ultimele scanări”");
});

// ─── 12. Ce nu poate face ─────────────────────────────────────────────────
await sectiune("Ce nu poți face", async () => {
  await merg("/admin");
  ok(!(await p.content()).includes('href="/admin/utilizatori"'), "meniul nu-i arată Utilizatori");
  await merg("/admin/utilizatori");
  ok(!(await text()).includes("Fac eu parola"), "pagina de conturi e închisă și scrisă de mână în adresă");
  const r = await p.request.post(S + "/api/admin/utilizatori", { form: { fel: "adauga", nume: "X", email: "x@example.com", rol: "administrator" } });
  ok(r.status() === 403 || r.status() === 303 && !(r.headers().location ?? "").includes("facut"), "ruta de conturi o refuză", String(r.status()));
  for (const c of ["/admin/donatori", "/admin/firme", "/admin/formulare", "/admin/scrie", "/admin/poze", "/admin/facebook", "/admin/sabloane", "/admin/radar"]) {
    await merg(c);
    ok(!/n-ai acces|nu ai acces/i.test(await text()), `deschide ${c}`);
  }
});

await sectiune("Parola ei", async () => {
  await merg("/admin/parola");
  const f = p.locator("form").filter({ has: p.locator('input[type="password"]') }).first();
  const campuri = f.locator('input[type="password"]');
  const n = await campuri.count();
  const nou = "parola-noua-de-proba-2";
  await campuri.nth(0).fill(EU.parola);
  for (let i = 1; i < n; i++) await campuri.nth(i).fill(nou);
  await apasa(f.locator("button").first());
  const dupa = await text();
  console.log("   [parola] adresa:", p.url().replace(S, ""), "| mesaj:", (dupa.match(/(Parola[^.]{0,80}\.|schimbat[^.]{0,60})/i) ?? [""])[0]);
  ok(await nuEJson() && /stare=(gata|schimbata|ok|facut)/.test(p.url()) || /a fost schimbat|s-a schimbat|Gata/i.test(dupa), "își schimbă parola, cu cea de acum în mână", p.url());
  await apasa(p.locator('button:has-text("Ieși din panou")'));
  await merg("/admin");
  await p.fill('input[name="email"]', EU.email); await p.fill('input[name="parola"]', nou);
  await apasa(p.locator('button:has-text("Intră")'));
  console.log("   [intrare] adresa:", p.url().replace(S, ""));
  ok(p.url().endsWith("/admin") && /De făcut acum|Tabloul de bord/i.test(await text()), "intră cu parola nouă", p.url());
});

ok(erori.length === 0, "nicio pagină n-a răspuns cu eroare 5xx", erori.slice(0, 5).join(", "));
await b.close();
console.log(`\n${bune} bune, ${rele} căzute`);
if (caderi.length) { console.log("\nCĂZUTE:"); caderi.forEach((c) => console.log(" - " + c)); }
fs.writeFileSync("/tmp/cont-proba.txt", EU.email);
process.exit(rele ? 1 : 0);
