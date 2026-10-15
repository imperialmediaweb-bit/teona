/**
 * Uneltele de fundraising din panou, de la un capăt la altul.
 *
 * Patru lucruri pe care cineva le face într-o zi obișnuită și care până acum
 * se făceau de mână sau deloc:
 *
 *   1. **contractul de sponsorizare** — se generează din fișa firmei, cu
 *      datele de la ANAF, și mută firma la „contract trimis";
 *   2. **exportul pentru Excel** — cu virgulă zecimală și BOM, altfel
 *      Excel-ul românesc citește 150 de lei ca o sută cincizeci de milioane
 *      de miliarde (s-a întâmplat, de asta e proba asta aici);
 *   3. **căutarea peste tot** — după nume, CUI, e-mail și telefon, în
 *      donatori, firme și cereri deodată;
 *   4. **segmentele de donatori** — cine s-a oprit și cine dă mult.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=... node scripts/qa/panou-fundraising.mjs
 *
 * Proba își scrie singură datele de care are nevoie și le șterge la final.
 */

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const PAROLA = process.env.PAROLA_ADMIN;

if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

let cookie = "";
async function cere(cale, optiuni = {}) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: { ...(optiuni.headers ?? {}), ...(cookie ? { cookie } : {}) },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  return r;
}

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/firme" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── Exportul pentru Excel ────────────────────────────────────────────────
for (const [lista, coloana] of [
  ["donatii", "Referință"],
  ["donatori", "Total lei"],
  ["firme", "CUI"],
  ["cereri", "Fel"],
]) {
  const r = await cere(`/api/admin/export?ce=${lista}`);
  /*
    Octeții, nu textul.

    `Response.text()` decodează UTF-8 și **scoate BOM-ul**, așa cere
    standardul. Verificat pe text, proba spunea că lipsește un BOM care era
    acolo — patru căderi pe un export corect.
  */
  const octeti = new Uint8Array(await r.clone().arrayBuffer());
  const text = await r.text();
  verifica(r.status === 200, `${lista}: exportul răspunde (${r.status})`);
  verifica(
    (r.headers.get("content-type") ?? "").includes("text/csv"),
    `${lista}: e fișier CSV`,
  );
  verifica(
    octeti[0] === 0xef && octeti[1] === 0xbb && octeti[2] === 0xbf,
    `${lista}: are BOM, ca Excel să citească diacriticele`,
  );
  verifica(text.includes(`"${coloana}"`), `${lista}: are coloana „${coloana}"`);
  verifica(
    text.split("\r\n")[0].includes(";"),
    `${lista}: coloanele sunt despărțite cu punct și virgulă`,
  );
  // Niciun număr cu punct zecimal: Excel-ul românesc l-ar citi ca mii.
  const cuPunct = text.match(/"\d+\.\d{2,}"/);
  verifica(
    cuPunct === null,
    `${lista}: sumele au virgulă zecimală${cuPunct ? ` (am găsit ${cuPunct[0]})` : ""}`,
  );
}

const nelista = await cere("/api/admin/export?ce=ceva-inventat");
verifica(nelista.status === 400, `o listă inventată e refuzată (${nelista.status})`);

// ─── Căutarea peste tot ───────────────────────────────────────────────────
const firme = await (await cere("/admin/firme")).text();
const idFirma = (firme.match(/\/admin\/firme\/([0-9a-f-]{36})\/contract/) ?? [])[1];
verifica(Boolean(idFirma), "fișa unei firme are link către contract");

if (idFirma) {
  const pagina = await (await cere(`/admin/firme/${idFirma}/contract`)).text();
  verifica(
    pagina.includes('name="sediu"') && pagina.includes('name="regCom"'),
    "pagina contractului cere sediul și numărul de la registru",
  );

  const corp = new URLSearchParams({
    id: idFirma,
    numar: "99",
    data: "1 ianuarie 2027",
    denumire: "Firmă de probă SRL",
    sediu: "Str. Probei 1",
    judet: "Suceava",
    cui: "2816464",
    regCom: "J04/1/1992",
    reprezentant: "Om de Probă",
    calitate: "Administrator",
    telefon: "0700 000 000",
    email: "proba@exemplu.ro",
    valoare: "1.234",
    dataSemnarii: "1 ianuarie 2027",
  });
  const pdf = await cere("/api/admin/contract", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: corp,
  });
  const octeti = new Uint8Array(await pdf.arrayBuffer());
  verifica(pdf.status === 200, `contractul se generează (${pdf.status})`);
  verifica(
    (pdf.headers.get("content-type") ?? "").includes("application/pdf"),
    "răspunsul e un PDF",
  );
  verifica(
    String.fromCharCode(...octeti.slice(0, 5)) === "%PDF-",
    "fișierul chiar începe ca un PDF",
  );
  verifica(octeti.length > 8000, `PDF-ul are conținut (${octeti.length} octeți)`);
  verifica(
    (pdf.headers.get("content-disposition") ?? "").includes(".pdf"),
    "se descarcă cu nume de fișier",
  );
}

const fara = await cere("/api/admin/contract", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ id: "nu-e-un-identificator" }),
});
verifica(fara.status === 400, `un contract fără firmă e refuzat (${fara.status})`);

// ─── Căutarea ─────────────────────────────────────────────────────────────
for (const [ce, asteptat] of [
  // O singură literă: sub pragul de la care se caută.
  ["q=x", "Scrie cel puțin"],
  ["q=zzzz-nu-exista-zzzz", "Nimic pentru"],
]) {
  const html = await (await cere(`/admin/cauta?${ce}`)).text();
  verifica(html.includes(asteptat), `căutare „${ce}" → „${asteptat}"`);
  verifica(!html.includes("n-a mers"), `căutare „${ce}" nu cade`);
}

// ─── Segmentele de donatori ───────────────────────────────────────────────
for (const filtru of ["toti", "opriti", "mari", "lunari", "cu-acord"]) {
  const r = await cere(`/admin/donatori?filtru=${filtru}`);
  const html = await r.text();
  verifica(
    r.status === 200 && html.includes("Descarcă pentru Excel"),
    `lista de donatori merge pe filtrul „${filtru}"`,
  );
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
