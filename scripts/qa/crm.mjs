import { browser, BAZA, urmaresteErori } from "./comun.mjs";

/**
 * Panoul CRM: tabloul de bord, firmele, cererile.
 *
 * Se rulează cu baza de date și parola în mediu:
 *
 *   DATABASE_URL=… PAROLA_ADMIN=… npm run dev
 *   PAROLA_ADMIN=… node scripts/qa/crm.mjs
 *
 * Verifică fluxurile care chiar schimbă date — mutarea unei firme între
 * stadii, scrierea în jurnal, filtrele — nu doar că paginile se încarcă.
 * Majoritatea greșelilor de până acum în panou au fost de felul ăsta: pagina
 * arăta bine, dar butonul nu făcea nimic.
 */

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  // Ieșire cu 2, nu cu 0: altfel o rulare fără parolă arată ca o trecere, iar
  // o verificare sărită se confundă cu una reușită. S-a întâmplat deja o dată
  // în sesiunea asta, și a ascuns o probă picată.
  console.log("SĂRIT: lipsește PAROLA_ADMIN, nu se poate intra în panou.");
  process.exit(2);
}

const b = await browser();
/*
  Intrarea în panou e limitată la 5 încercări la 15 minute, pe adresă, iar în
  dezvoltare toate cererile vin de la aceeași. Fără antetul ăsta, scriptul
  merge o dată și la a doua rulare pică cu 429 — care arată ca o defecțiune a
  panoului, nu ca limita făcându-și treaba. O adresă nouă la fiecare rulare
  îl face repetabil. (`198.51.100.0/24` e rezervat pentru documentație.)
*/
const ctx = await b.newContext({
  viewport: { width: 1280, height: 1200 },
  extraHTTPHeaders: {
    "x-forwarded-for": `198.51.100.${1 + Math.floor(Math.random() * 250)}`,
  },
});
const page = await ctx.newPage();
const erori = urmaresteErori(page);
let rele = 0;

function verifica(eticheta, conditie, detaliu = "") {
  console.log(`${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`);
  if (!conditie) rele++;
}

// ─── Intrare ──────────────────────────────────────────────────────────────
await page.goto(BAZA + "/admin", { waitUntil: "networkidle" });
await page.fill('input[name="parola"]', PAROLA);
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");
verifica("intrarea duce la tabloul de bord", new URL(page.url()).pathname === "/admin", page.url());

// ─── Tabloul de bord ──────────────────────────────────────────────────────
console.log("\n=== Tabloul de bord ===");
const carduri = await page.locator("#panou-admin section").count();
verifica("are carduri de grafice", carduri >= 6, `${carduri} carduri`);

// Tabelele ascunse: cifrele trebuie să ajungă și la cititoarele de ecran.
const tabele = await page.locator(".sr-only table").count();
verifica("graficele au tabel citibil cu voce tare", tabele >= 3, `${tabele} tabele`);
const captions = await page.locator(".sr-only table caption").allInnerTexts();
verifica("fiecare tabel are titlu", captions.every((c) => c.trim().length > 3), JSON.stringify(captions));

/*
  Ascunse vizual, dar fără să lățească pagina.

  `sr-only` pe `<table>` nu ajunge: un tabel nu se îngustează sub lățimea
  conținutului, deci rămâne lat de câteva sute de pixeli și împinge pagina.
  Clasa trebuie să stea pe un `div` din jur. Verificarea e aici fiindcă
  bug-ul a stat ascuns zile întregi, apărând doar când sumele erau destul de
  lungi.
*/
const scapate = await page.evaluate(() =>
  [...document.querySelectorAll(".sr-only table")]
    .filter((t) => {
      const cs = getComputedStyle(t.parentElement);
      return cs.position !== "absolute" || parseFloat(cs.width) > 1;
    })
    .map((t) => t.querySelector("caption")?.textContent ?? "?"),
);
verifica(
  "tabelele ascunse sunt chiar tăiate de părinte",
  scapate.length === 0,
  JSON.stringify(scapate),
);
const expuse = await page.locator('.sr-only table caption').count();
verifica("și rămân citibile de cititoarele de ecran", expuse >= 3, `${expuse}`);

// Fără derulare laterală.
for (const w of [1280, 390]) {
  await page.setViewportSize({ width: w, height: 1200 });
  await page.waitForTimeout(200);
  /*
    Când pagina se lățește, scriem *cine* a lățit-o.

    Un „fără derulare laterală: pică" fără vinovat trimite la o vânătoare de
    o jumătate de oră. Aici a fost un grafic a cărui etichetă creștea odată
    cu sumele din baza de date, deci proba pica doar uneori.
  */
  const lat = await page.evaluate(() => {
    const prag = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= prag + 1) return null;
    const vinovati = [];
    for (const el of document.querySelectorAll("#panou-admin *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > prag + 1) {
        vinovati.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} „${(el.textContent || "").trim().slice(0, 24)}" până la ${Math.round(r.right)}`,
        );
      }
    }
    return vinovati.slice(0, 3);
  });
  verifica(`fără derulare laterală la ${w}px`, lat === null, JSON.stringify(lat));
}
await page.setViewportSize({ width: 1280, height: 1200 });

// Etichetele graficelor nu ies din cardul lor.
const iesite = await page.evaluate(() => {
  const rele = [];
  for (const s of document.querySelectorAll("#panou-admin section")) {
    const c = s.getBoundingClientRect();
    for (const e of s.querySelectorAll("span")) {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1))
        rele.push(e.textContent.trim().slice(0, 20));
    }
  }
  return rele;
});
verifica("nicio etichetă nu iese din card", iesite.length === 0, JSON.stringify(iesite));

// ─── Firme: filtre, căutare, mutare între stadii ──────────────────────────
console.log("\n=== Firme ===");
await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
const toate = await page.locator("#panou-admin ul > li").count();
verifica("lista are firme", toate >= 2, `${toate} firme`);

/*
  Proba își pune singură o firmă în stadiul pe care apoi îl filtrează.

  Înainte se baza pe o firmă lăsată „semnat" de o rulare anterioară — iar
  rulările următoare o mutau, deci filtrul găsea zero și proba pica fără să
  fie nimic stricat. O probă nu trebuie să depindă de ce a lăsat în urmă alta.
*/
const deFiltrat = page.locator("#panou-admin ul > li").first();
await deFiltrat.locator('select[name="stadiu"]').selectOption("semnat");
await deFiltrat.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");

await page.goto(BAZA + "/admin/firme?stadiu=semnat", { waitUntil: "networkidle" });
const semnate = await page.locator("#panou-admin ul > li").count();
verifica("filtrul pe stadiu reduce lista", semnate >= 1 && semnate < toate, `${semnate} din ${toate}`);

await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
await page.fill('input[name="cauta"]', "lemnul");
await page.click('button:has-text("Caută")');
await page.waitForLoadState("networkidle");
verifica("căutarea după denumire", (await page.locator("#panou-admin ul > li").count()) === 1);
await page.fill('input[name="cauta"]', "zzzz");
await page.click('button:has-text("Caută")');
await page.waitForLoadState("networkidle");
verifica("căutare fără rezultat spune asta", (await page.locator("#panou-admin").innerText()).includes("Nicio firmă"));

// Mutarea unei firme + suma încasată.
await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
const primul = page.locator("#panou-admin ul > li").first();
const numeFirma = await primul.locator("p").first().innerText();
await primul.locator('select[name="stadiu"]').selectOption("incasat");
await primul.locator('input[name="suma"]').fill("12.500");
await primul.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");
verifica("mutarea duce înapoi la lista de firme", new URL(page.url()).pathname === "/admin/firme", page.url());

const dupa = page.locator("#panou-admin ul > li").filter({ hasText: numeFirma }).first();
const textDupa = await dupa.innerText();
verifica("stadiul s-a schimbat", textDupa.includes("Bani încasați"), textDupa.split("\n")[0]);
verifica("suma scrisă cu punct de mii s-a citit corect", textDupa.includes("12.500 lei"), textDupa.replace(/\n/g, " | ").slice(0, 160));

// Suma scrisă aiurea nu trebuie să piardă mutarea stadiului.
await dupa.locator('select[name="stadiu"]').selectOption("contract_trimis");
await dupa.locator('input[name="suma"]').fill("aiurea");
await dupa.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");
const dupa2 = await page.locator("#panou-admin ul > li").filter({ hasText: numeFirma }).first().innerText();
verifica("o sumă scrisă greșit nu anulează mutarea", dupa2.includes("Contract trimis"), dupa2.split("\n")[0]);
verifica("și nu șterge suma dinainte", dupa2.includes("12.500 lei"));

// ─── Jurnalul discuțiilor ─────────────────────────────────────────────────
console.log("\n=== Jurnal ===");
await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
await page.locator("#panou-admin ul > li").first().locator('a:has-text("Discuții și notițe")').click();
await page.waitForLoadState("networkidle");
verifica("jurnalul se deschide", (await page.locator('form[action="/api/admin/jurnal"]').count()) === 1);
// Pe o bază curată jurnalul e gol; la a doua rulare are deja intrări. Se
// verifică doar că spune una dintre cele două, nu că e neapărat gol.
const textJurnal = await page.locator("#panou-admin").innerText();
verifica(
  "jurnalul arată ori că e gol, ori ce scrie în el",
  textJurnal.includes("Nimic scris încă") || /Telefon|Notiță|E-mail|Întâlnire/.test(textJurnal),
);

await page.selectOption('form[action="/api/admin/jurnal"] select[name="fel"]', "telefon");
await page.fill('form[action="/api/admin/jurnal"] input[name="rezumat"]', "L-am sunat pe Andrei: trimite actele până vineri.");
await page.click('form[action="/api/admin/jurnal"] button:has-text("Adaugă")');
await page.waitForLoadState("networkidle");
const cuJurnal = await page.locator("#panou-admin").innerText();
verifica("intrarea se salvează și se vede", cuJurnal.includes("trimite actele până vineri"));
verifica("cu felul ei", cuJurnal.includes("Telefon"));
verifica("jurnalul rămâne deschis după salvare", (await page.locator('form[action="/api/admin/jurnal"]').count()) === 1);

// Rezumat gol — nu se salvează.
await page.fill('form[action="/api/admin/jurnal"] input[name="rezumat"]', "");
const golAcceptat = await page.evaluate(() => {
  const f = document.querySelector('form[action="/api/admin/jurnal"]');
  return f.checkValidity();
});
verifica("rezumatul gol e oprit de browser", !golAcceptat);

// ─── Cereri ───────────────────────────────────────────────────────────────
console.log("\n=== Cereri ===");
await page.goto(BAZA + "/admin/cereri", { waitUntil: "networkidle" });
const nrCereri = await page.locator("#panou-admin ul > li").count();
verifica("lista are cereri", nrCereri >= 2, `${nrCereri} cereri`);

/*
  Filtrul se verifică prin ce *înseamnă*, nu printr-un număr fix.

  Înainte aștepta exact o cerere de voluntariat. Orice rulare a altei probe
  care mai adăuga una făcea verificarea să pice, deși filtrul își făcea
  treaba perfect. Un număr fix într-o probă pe o bază de date comună e o
  alarmă falsă care așteaptă să sune.
*/
await page.click('a:has-text("Voluntariat")');
await page.waitForLoadState("networkidle");
const filtrate = await page.locator("#panou-admin ul > li").count();
verifica("filtrul pe fel lasă ceva", filtrate >= 1 && filtrate <= nrCereri, `${filtrate} din ${nrCereri}`);
const feluri = await page
  .locator("#panou-admin ul > li")
  .evaluateAll((li) => li.map((e) => e.innerText.split("\n").slice(0, 4).join(" ")));
verifica(
  "și arată numai cereri de voluntariat",
  feluri.every((t) => t.includes("Voluntariat")),
  JSON.stringify(feluri.filter((t) => !t.includes("Voluntariat")).slice(0, 2)),
);

await page.goto(BAZA + "/admin/cereri", { waitUntil: "networkidle" });
const cerere = page.locator("#panou-admin ul > li").first();
await cerere.locator('select[name="stadiu"]').selectOption("rezolvat");
await cerere.locator('button:has-text("Salvează")').click();
await page.waitForLoadState("networkidle");
await page.goto(BAZA + "/admin/cereri?stadiu=rezolvat", { waitUntil: "networkidle" });
verifica("cererea s-a mutat în „rezolvat”", (await page.locator("#panou-admin ul > li").count()) >= 1);

// ─── Donații trecute de mână ──────────────────────────────────────────────
console.log("\n=== Donații de mână ===");
await page.goto(BAZA + "/admin/donatii", { waitUntil: "networkidle" });
const inainte = await page.locator("#panou-admin tbody tr").count();

async function treceDonatie(camp) {
  await page.goto(BAZA + "/admin/donatii", { waitUntil: "networkidle" });
  await page.click('summary:has-text("Trece o donație de mână")');
  // Limitat la formularul panoului: subsolul site-ului are și el un câmp
  // „nume”, cel de abonare la buletin, iar Playwright se oprește pe două
  // potriviri.
  const formular = page.locator('form[action="/api/admin/donatii"]');
  for (const [nume, val] of Object.entries(camp)) {
    const el = formular.locator(`[name="${nume}"]`);
    if ((await el.evaluate((e) => e.tagName)) === "SELECT")
      await el.selectOption(val);
    else await el.fill(val);
  }
  await formular.locator('button:has-text("Trece donația")').click();
  await page.waitForLoadState("networkidle");
  return page.locator("#panou-admin").innerText();
}

// Referință nouă la fiecare rulare: una fixă ar fi fost respinsă ca duplicat
// de la a doua rulare încoace, iar scriptul ar fi părut că găsește o pană.
const ref = `extras-OP-${Date.now()}`;

let t = await treceDonatie({ metoda: "manual-transfer", suma: "1.250,50", data: "2026-09-15", referinta: ref, nume: "Firma Bună SRL" });
verifica("donația de mână se salvează", t.includes("Donația e trecută"), t.split("\n").find((l) => l.includes("Donația")) ?? t.slice(0, 60));
// Două zecimale, nu una: banii nu se scriu „1.250,5".
verifica("suma scrisă româneşte se citeşte corect", t.includes("1.250,50 lei"), t.match(/1\.250[^\n]*/)?.[0] ?? "lipsă");
verifica("apare un rând nou în listă", (await page.locator("#panou-admin tbody tr").count()) === inainte + 1, `${inainte} → ${await page.locator("#panou-admin tbody tr").count()}`);

t = await treceDonatie({ metoda: "manual-transfer", suma: "1.250,50", data: "2026-09-15", referinta: ref });
verifica("aceeași referință de două ori e oprită", t.includes("Există deja o donație"), t.split("\n").find((l) => l.includes("Există")) ?? t.slice(0, 60));

t = await treceDonatie({ metoda: "manual-numerar", suma: "aiurea", data: "2026-09-15", referinta: "chit-1" });
verifica("suma scrisă aiurea e respinsă", t.includes("doar în cifre"), t.split("\n").find((l) => l.includes("cifre")) ?? t.slice(0, 60));

/*
  Data din viitor și adresa stricată sunt oprite de browser înainte de
  trimitere (`max` pe `input[type=date]`, `type=email`), deci prin formular
  nu se poate ajunge la server. Dar browserul se poate ocoli, iar o sumă
  greșită intră direct în raportul anual — așa că se verifică serverul
  direct, cu sesiunea paginii.
*/
async function catreServer(camp) {
  const r = await page.request.post(BAZA + "/api/admin/donatii", {
    form: camp,
    maxRedirects: 0,
  });
  const unde = r.headers()["location"] ?? "";
  return decodeURIComponent(unde);
}

let unde = await catreServer({ metoda: "manual-numerar", suma: "50", data: "2030-01-01", referinta: "chit-viitor" });
verifica("serverul respinge o dată din viitor", unde.includes("în viitor"), unde);

unde = await catreServer({ metoda: "manual-numerar", suma: "50", data: "2026-09-15", referinta: "chit-mail", email: "nu-e-adresa" });
verifica("serverul respinge un e-mail invalid", unde.includes("nu e validă"), unde);

unde = await catreServer({ metoda: "manual-numerar", suma: "50", data: "15-09-2026", referinta: "chit-data" });
verifica("serverul respinge o dată scrisă invers", unde.includes("data donației") || unde.includes("scrisă corect"), unde);

unde = await catreServer({ metoda: "inventata", suma: "50", data: "2026-09-15", referinta: "x" });
verifica("serverul respinge o metodă inventată", unde.includes("Alege metoda"), unde);

unde = await catreServer({ metoda: "manual-numerar", suma: "50", data: "2026-09-15", referinta: "x", destinatie: "inventata" });
verifica("serverul respinge o destinație inventată", unde.includes("Destinație necunoscută"), unde);

unde = await catreServer({ metoda: "manual-numerar", suma: "0", data: "2026-09-15", referinta: "chit-zero" });
verifica("serverul respinge suma zero", unde.includes("Scrie suma"), unde);

// ─── Jurnal pe donatori ───────────────────────────────────────────────────
console.log("\n=== Jurnal pe donatori ===");
await page.goto(BAZA + "/admin/donatori", { waitUntil: "networkidle" });
const randuri = await page.locator("#panou-admin tbody tr").count();
if (randuri === 0) {
  console.log("  (fără donatori cu e-mail — se sare peste)");
} else {
  await page.locator('a:has-text("Discuții și notițe")').first().click();
  await page.waitForLoadState("networkidle");
  verifica("jurnalul se deschide pe donator", (await page.locator('form[action="/api/admin/jurnal"]').count()) === 1);
  await page.fill('form[action="/api/admin/jurnal"] input[name="rezumat"]', "Am sunat-o: vrea să treacă pe donație lunară.");
  await page.click('form[action="/api/admin/jurnal"] button:has-text("Adaugă")');
  await page.waitForLoadState("networkidle");
  verifica("se salvează pe donator", (await page.locator("#panou-admin").innerText()).includes("vrea să treacă pe donație lunară"));
  verifica("rămâne pe pagina de donatori", new URL(page.url()).pathname === "/admin/donatori", page.url());
  // Telefonul apare doar dacă donatorul l-a lăsat; pe firme e întotdeauna.
  await page.goto(BAZA + "/admin/firme", { waitUntil: "networkidle" });
  const tel = await page.locator('#panou-admin a[href^="tel:"]').count();
  verifica("telefoanele sunt apelabile dintr-un clic", tel >= 1, `${tel} linkuri tel:`);
}

// ─── Fără sesiune, nimic nu merge ─────────────────────────────────────────
console.log("\n=== Fără sesiune ===");
const anonim = await b.newPage();
for (const cale of ["/admin", "/admin/firme", "/admin/cereri", "/admin/donatii"]) {
  await anonim.goto(BAZA + cale, { waitUntil: "networkidle" });
  const text = await anonim.locator("#panou-admin").innerText();
  verifica(`${cale} cere parola`, text.includes("Parola") && !text.includes("CUI"), text.slice(0, 40).replace(/\n/g, " "));
}
const r = await anonim.request.post(BAZA + "/api/admin/firme", { form: { id: "00000000-0000-0000-0000-000000000000", stadiu: "incasat" } });
verifica("ruta de firme refuză fără sesiune", r.status() === 403, String(r.status()));
const r2 = await anonim.request.post(BAZA + "/api/admin/jurnal", { form: { email: "x@y.ro", fel: "telefon", rezumat: "x" } });
verifica("ruta de jurnal refuză fără sesiune", r2.status() === 403, String(r2.status()));
const r3 = await anonim.request.post(BAZA + "/api/admin/donatii", { form: { metoda: "manual-numerar", suma: "100", data: "2026-01-01", referinta: "x" } });
verifica("ruta de donații refuză fără sesiune", r3.status() === 403, String(r3.status()));

console.log("\nerori consolă/rețea:", JSON.stringify(erori));
console.log(`\nverificări picate: ${rele}`);
await b.close();
process.exit(rele === 0 ? 0 : 1);
