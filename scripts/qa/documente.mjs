/**
 * Documentele de descărcat: contractele, declarațiile, informarea GDPR.
 *
 * Caietul cere ca asociația să le poată înlocui singură — la 2.4 pentru cele
 * două contracte, la 7.5 pentru cele trei documente de la pagina de 3,5% —
 * și, tot la 7.5, ca butoanele să rămână **inactive** cât timp documentul nu
 * există: „un buton care arată a buton dar nu descarcă nimic" e varianta cea
 * mai proastă.
 *
 * Proba nu cere chei de R2. Verifică exact ce se poate verifica fără ele, și
 * alea sunt lucrurile care se strică în liniște:
 *
 *   1. **rezerva din depozitul de cod merge.** Cele două contracte există ca
 *      fișiere în `public/documente/` de dinainte. Dacă mâine cineva rupe
 *      treapta aia, firma care apasă „Descarcă contractul" primește o pagină
 *      de eroare — și nu reclamă nimeni, pur și simplu nu mai semnează;
 *   2. **ce nu există răspunde 404, cu o pagină omenească**, nu cu o
 *      propoziție pe fond alb;
 *   3. **adresa nu se poate folosi ca să scrii peste orice fișier.** Slugul
 *      vine din formular; cheia din R2 se ia din lista fixă. Un slug
 *      necunoscut nu urcă nimic;
 *   4. **nu se urcă ce nu e PDF** — se verifică primii patru octeți, nu
 *      extensia: un Word redenumit în .pdf ajunge la firmă și nu se deschide.
 *
 * Rulare, pe un server pornit cu PAROLA_ADMIN (bază de date nu cere):
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/documente.mjs
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

const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
let cookie = "";
async function cere(cale, optiuni = {}) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: {
      ...(optiuni.headers ?? {}),
      "x-forwarded-for": DE_LA,
      ...(cookie ? { cookie } : {}),
    },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  return r;
}

// ─── 1. Cele două contracte se descarcă, din rezerva din depozit ──────────
for (const slug of ["contract-de-sponsorizare", "contract-declaratia-177"]) {
  const r = await fetch(`${BAZA}/documente/${slug}`);
  const octeti = new Uint8Array(await r.arrayBuffer());
  const estePdf =
    octeti[0] === 0x25 && octeti[1] === 0x50 && octeti[2] === 0x44;
  verifica(
    r.status === 200 && estePdf && octeti.length > 10_000,
    `/documente/${slug} întoarce un PDF (${r.status}, ${octeti.length} octeți)`,
  );
  verifica(
    (r.headers.get("content-disposition") ?? "").includes(".pdf"),
    `…cu un nume de fișier pentru om (${r.headers.get("content-disposition")})`,
  );
}

// ─── 2. Ce nu există: 404, dar o pagină, nu o propoziție ──────────────────
for (const slug of ["acord-depunere-230", "informare-gdpr-230", "nimic-aici"]) {
  const r = await fetch(`${BAZA}/documente/${slug}`);
  const corp = await r.text();
  verifica(r.status === 404, `/documente/${slug} răspunde 404 (${r.status})`);
  verifica(
    corp.includes("nu e încă pe site") && corp.includes("tel:"),
    `…cu o pagină care dă telefonul, nu cu text gol`,
  );
}

// ─── 3. Butoanele de pe pagina de 3,5% ────────────────────────────────────
/*
  Fără R2 configurat, niciunul dintre cele trei nu există, deci toate trei
  cardurile trebuie să fie inactive. Cu R2 configurat și documentele urcate,
  proba asta ar trebui să vadă linkuri — de aceea nu verifică „inactiv", ci
  potrivirea dintre ce există și ce arată pagina.
*/
const treiPeIFac = await (await fetch(`${BAZA}/redirectioneaza-3-5`)).text();
const existaAcord = (await fetch(`${BAZA}/documente/acord-depunere-230`)).status === 200;
const aratLink = treiPeIFac.includes('href="/documente/acord-depunere-230"');
verifica(
  existaAcord === aratLink,
  `cardul declarației e link numai dacă fișierul există (există: ${existaAcord}, link: ${aratLink})`,
);
verifica(
  treiPeIFac.includes("Documente de descărcat"),
  "secțiunea de documente e pe pagină",
);

// ─── 4. Pagina pentru firme duce la adresele noi ──────────────────────────
const firme = await (await fetch(`${BAZA}/directioneaza-20`)).text();
verifica(
  firme.includes('href="/documente/contract-de-sponsorizare"') &&
    firme.includes('href="/documente/contract-declaratia-177"'),
  "pagina pentru firme duce la ambele contracte",
);

// ─── 5. Fără sesiune nu se urcă nimic ─────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/documente`, {
  method: "POST",
  redirect: "manual",
  headers: { "x-forwarded-for": DE_LA },
  body: (() => {
    const f = new FormData();
    f.set("slug", "contract-de-sponsorizare");
    f.set("fisier", new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])]), "x.pdf");
    return f;
  })(),
});
verifica(
  peFurate.status === 403,
  `fără sesiune, urcarea e refuzată (${peFurate.status})`,
);

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/documente" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 6. Pagina din panou arată toate cele cinci ───────────────────────────
const panou = await (await cere("/admin/documente")).text();
for (const titlu of [
  "Formularul 230",
  "Declarația de consimțământ",
  "Informarea GDPR",
  "Contractul de sponsorizare",
  "Contractul pentru Declarația 177",
]) {
  verifica(panou.includes(titlu), `panoul are „${titlu}”`);
}

function urca(slug, octeti, nume = "doc.pdf") {
  const f = new FormData();
  f.set("slug", slug);
  f.set("fisier", new Blob([octeti], { type: "application/pdf" }), nume);
  return cere("/api/admin/documente", { method: "POST", body: f });
}

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const NU_PDF = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);

// ─── 7. Un slug necunoscut nu scrie nimic ─────────────────────────────────
const strain = await urca("../../orice-altceva", PDF);
verifica(
  (strain.headers.get("location") ?? "").includes("stare=necunoscut"),
  "un slug din afara listei e refuzat",
);

// ─── 8. Ce nu e PDF nu se urcă ────────────────────────────────────────────
const zip = await urca("acord-depunere-230", NU_PDF, "pare-pdf.pdf");
verifica(
  (zip.headers.get("location") ?? "").includes("stare=pdf"),
  "un fișier care nu începe cu %PDF e refuzat, oricum s-ar numi",
);

// ─── 9. Un PDF adevărat: urcat, sau spus de ce nu ─────────────────────────
/*
  Fără chei de R2 răspunsul corect e „depozit", nu „urcat": ruta spune pe
  pagină că depozitul nu e pornit, în loc să pretindă că a salvat.
*/
const bun = await urca("acord-depunere-230", PDF);
const unde = bun.headers.get("location") ?? "";
verifica(
  unde.includes("stare=urcat") || unde.includes("stare=depozit"),
  `un PDF adevărat e primit, sau se spune de ce nu (${unde.split("?")[1] ?? ""})`,
);

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
