/**
 * Siglele sponsorilor, adăugate și mutate din panou.
 *
 * Întrebarea e a asociației, din octombrie 2026: „La Sponsori o să pot și eu
 * adăuga ulterior sigle? Ei sunt mai mulți decât apar acum pe site." Caietul
 * cere la 6.3 să se adauge „și alte sigle ale sponsorilor care au mai apărut
 * pe parcurs (de trimis de la asociație)" — adică, până acum, trimise mie.
 *
 * Proba umblă la o siglă adevărată din listă și o pune înapoi la final. Ce
 * verifică, în ordinea importanței:
 *
 *   1. **sigla scoasă dispare de pe site**, din amândouă locurile. Dacă
 *      rămâne, asociația a scos-o din panou și firma o vede în continuare pe
 *      prima pagină — iar aia e o discuție neplăcută cu un fost sponsor;
 *   2. **ordinea se schimbă.** Pe prima pagină intră primele douăsprezece, în
 *      ordinea din panou; fără „sus" care funcționează, o siglă nouă rămâne pe
 *      veci ultima, adică nevăzută;
 *   3. **numele e obligatoriu.** Fără el, textul alternativ ar fi „siglă de
 *      sponsor", iar sub siglă n-ar scrie nimic;
 *   4. **banda de pe prima pagină rămâne de douăsprezece**, oricâte sigle ar
 *      fi în total: a treisprezecea rupe rândul.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/sponsori.mjs
 */

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}

const PE_PRIMA_PAGINA = 12;

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

function post(date) {
  return cere("/api/admin/sponsori", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(date),
  });
}

function stare(r) {
  return new URL(r.headers.get("location") ?? "http://x/", "http://x/")
    .searchParams.get("stare");
}

/** Siglele din banda de pe prima pagină, în ordine. */
async function banda() {
  const h = await (await cere("/")).text();
  const i = h.indexOf("Ne susțin");
  const j = h.indexOf("Vezi toți sponsorii", i);
  return [...h.slice(i, j).matchAll(/alt="Sigla ([^"]+)"/g)].map((m) => m[1]);
}

/** Numele de pe pagina de sponsori. */
async function pagina() {
  const h = await (await cere("/sponsori-si-parteneri")).text();
  return [...new Set([...h.matchAll(/alt="Sigla ([^"]+)"/g)].map((m) => m[1]))];
}

/*
  Cache cu etichetă: golirea se vede la cererea următoare, nu instantaneu.
  Se încearcă de câteva ori, cu pauză.
*/
async function astepta(ce, cum, incercari = 8) {
  for (let i = 0; i < incercari; i++) {
    if (cum(await ce())) return true;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

// ─── 1. Fără sesiune, nimic ───────────────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/sponsori`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "x-forwarded-for": DE_LA,
    "content-type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ nume: "Firma Mea" }),
});
verifica(
  peFurate.status === 403,
  `fără sesiune, ruta e refuzată (${peFurate.status})`,
);

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/sponsori" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 2. Panoul arată siglele ───────────────────────────────────────────────
const panou = await (await cere("/admin/sponsori")).text();
verifica(panou.includes("Ce e bine de știut"), "pagina din panou răspunde");

/*
  Numele -> identificator, citit din pagină.

  Prima variantă lua identificatorii în ordinea din panou și presupunea că
  al doilea din panou e al doilea din bandă. Nu e: panoul arată și siglele
  scoase de pe site, banda nu. Proba cădea pe o presupunere a ei, nu pe o
  defecțiune — iar aia e cea mai proastă fel de probă: te trimite să cauți un
  bug care nu există.
*/
const dupaNume = new Map(
  [
    ...panou.matchAll(
      /name="id" value="([0-9a-f-]{36})"[\s\S]{0,900}?name="nume"[^>]*value="([^"]*)"/g,
    ),
  ].map((m) => [m[2], m[1]]),
);
verifica(dupaNume.size >= 3, `panoul arată siglele (${dupaNume.size})`);

/*
  Întâi se golește cache-ul, abia pe urmă se citește banda.

  Cache-ul cu etichetă al lui Next trăiește în `.next/cache`, deci **trece
  peste reporniri**. Fără pasul ăsta, proba citea banda cum era lăsată de o
  rulare de dinainte, o compara cu baza de date de acum și cădea pe trei
  verificări — arătând un bug care nu există. Mișcarea asta nu schimbă nimic:
  salvează prima siglă cu numele ei, neschimbat, numai ca ruta să golească
  eticheta.
*/
const [numeOarecare, idOarecare] = [...dupaNume.entries()][0];
await post({ id: idOarecare, nume: numeOarecare });
await new Promise((r) => setTimeout(r, 3000));

const laInceput = await banda();
verifica(
  laInceput.length === PE_PRIMA_PAGINA,
  `banda de pe prima pagină are ${PE_PRIMA_PAGINA} sigle (${laInceput.length})`,
);
verifica(
  laInceput.every((n) => dupaNume.has(n)),
  "fiecare siglă din bandă se regăsește în panou",
);
if (rele > 0) {
  console.log("\nNu pot merge mai departe.");
  process.exit(1);
}

const prima = laInceput[0];
const aDoua = laInceput[1];
const idADoua = dupaNume.get(aDoua);

// ─── 3. Numele e obligatoriu ──────────────────────────────────────────────
verifica(
  stare(await post({ nume: "" })) === "nume",
  "o siglă fără nume e refuzată",
);
verifica(
  stare(await post({ nume: "Firma Fără Siglă" })) === "poza",
  "un nume fără fișier e refuzat",
);
verifica(
  stare(await post({ id: idADoua, nume: "" })) === "nume",
  "nici la schimbare nu se poate șterge numele",
);

// ─── 4. Mutarea schimbă ordinea, și se vede ───────────────────────────────
verifica(stare(await post({ id: idADoua, fel: "sus" })) === "mutat", "„sus” merge");
verifica(
  await astepta(banda, (b) => b[0] === aDoua),
  `„${aDoua}” a ajuns prima în bandă`,
);
verifica(
  stare(await post({ id: idADoua, fel: "jos" })) === "mutat",
  "„jos” merge",
);
verifica(
  await astepta(banda, (b) => b[0] === prima),
  `ordinea e înapoi cum era (prima: „${prima}”)`,
);

// ─── 5. Scoaterea de pe site ──────────────────────────────────────────────
/*
  Se scoate prima din bandă: dacă ea rămâne, se vede imediat. O siglă din
  mijloc ar putea părea dispărută doar pentru că s-a mutat.
*/
const idPrima = dupaNume.get(prima);
verifica(
  stare(await post({ id: idPrima, fel: "opreste" })) === "stare",
  "„Scoate de pe site” merge",
);
verifica(
  await astepta(pagina, (p) => !p.includes(prima)),
  `„${prima}” a dispărut de pe pagina de sponsori`,
);
/* Prima pagină e altă pagină, cu cache-ul ei: se așteaptă, nu se presupune. */
verifica(
  await astepta(banda, (b) => !b.includes(prima)),
  `…și din banda de pe prima pagină`,
);
verifica(
  (await banda()).length === PE_PRIMA_PAGINA,
  "banda rămâne de douăsprezece, cu următoarea în loc",
);

// ─── 6. Înapoi pe site, pe locul ei ───────────────────────────────────────
verifica(
  stare(await post({ id: idPrima, fel: "porneste" })) === "stare",
  "„Pune înapoi” merge",
);
verifica(
  await astepta(banda, (b) => b[0] === prima),
  `„${prima}” e iar prima în bandă`,
);
verifica(
  await astepta(pagina, (p) => p.includes(prima)),
  `…și pe pagina de sponsori`,
);

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
