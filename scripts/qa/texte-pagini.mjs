/**
 * Textele paginilor fixe, scrise din panou.
 *
 * Ultimul lucru care trecea neapărat prin dezvoltator: Despre noi, Casa Teona,
 * Donează. Proba umblă la un text adevărat și îl pune înapoi la final.
 *
 * Ce verifică, în ordinea importanței:
 *
 *   1. **„Pune textul de la început" aduce înapoi exact ce scria.** Pe asta se
 *      sprijină tot: dacă nu merge, omul nu mai are curaj să schimbe nimic, și
 *      atunci pagina rămâne tot a mea. Textul de pornire stă în cod, iar
 *      butonul șterge rândul din tabel — nu textul;
 *   2. **ce se scrie se vede pe pagina publică**, acolo unde trebuie;
 *   3. **rândul gol desparte paragrafele** — altfel tot textul ar ieși într-un
 *      bloc, și omul ar crede că site-ul nu înțelege ce scrie;
 *   4. **locurile pentru cifre se completează din panou**, și nu rămâne niciun
 *      `{…}` pe pagină. Cifrele erau scrise de mână în proză și se învecheau
 *      în ziua în care asociația trecea la a 34-a tabără;
 *   5. **o cheie din afara listei nu scrie nimic**, și un text gol e refuzat.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/texte-pagini.mjs
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

function post(date) {
  return cere("/api/admin/texte-pagini", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(date),
  });
}

function stare(r) {
  return new URL(
    r.headers.get("location") ?? "http://x/",
    "http://x/",
  ).searchParams.get("stare");
}

/** Textul vizibil al unei pagini, fără etichete. */
async function vizibil(cale) {
  const h = await (await cere(cale)).text();
  return h
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

async function astepta(cale, caut, incercari = 8) {
  for (let i = 0; i < incercari; i++) {
    if ((await vizibil(cale)).includes(caut)) return true;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

// ─── 1. Fără sesiune, nimic ───────────────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/texte-pagini`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "x-forwarded-for": DE_LA,
    "content-type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ cheie: "casa.antet", continut: "altceva" }),
});
verifica(
  peFurate.status === 403,
  `fără sesiune, schimbarea e refuzată (${peFurate.status})`,
);

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/texte" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 2. Panoul arată sloturile ────────────────────────────────────────────
const panou = await (await cere("/admin/texte")).text();
verifica(
  panou.includes("Poți umbla aici fără frică"),
  "pagina din panou răspunde",
);
const chei = [
  ...new Set(
    [...panou.matchAll(/name="cheie" value="([a-z0-9.\-]+)"/g)].map(
      (m) => m[1],
    ),
  ),
];
verifica(chei.length >= 15, `panoul arată sloturile (${chei.length})`);
for (const c of [
  "acasa.fraza",
  "despre.poveste.1",
  "casa.bloc.1",
  "redirectionare.de-ce",
]) {
  verifica(chei.includes(c), `slotul „${c}” e în panou`);
}
if (rele > 0) {
  console.log("\nNu pot merge mai departe.");
  process.exit(1);
}

// ─── 3. Locurile pentru cifre sunt completate pe pagină ───────────────────
const la35 = await vizibil("/redirectioneaza-3-5");
verifica(
  !/\{(tabere|participanti|copii|voluntari)\}/.test(la35),
  "pe pagina de 3,5% nu rămâne niciun loc necompletat",
);
const panouCifre = await (await cere("/admin/cifre")).text();
const cifreDinPanou = [0, 1, 2, 3].map((i) => ({
  valoare: panouCifre.match(
    new RegExp(`name="valoare-${i}"[^>]*value="(\\d+)"`),
  )?.[1],
  sufix:
    panouCifre.match(new RegExp(`name="sufix-${i}"[^>]*value="([^"]*)"`))?.[1] ??
    "",
  eticheta: panouCifre.match(
    new RegExp(`name="eticheta-${i}"[^>]*value="([^"]*)"`),
  )?.[1],
}));
verifica(
  cifreDinPanou.every((c) => c.valoare && c.eticheta),
  `am citit cifrele din panou (${cifreDinPanou.map((c) => c.valoare).join(", ")})`,
);

/*
  Întâi se golește cache-ul cifrelor, abia pe urmă se citește pagina.

  Cache-ul trăiește în `.next/cache` și e populat **la build**, când Railway
  n-are acces la baza de date: acolo intră rezerva din cod. După o publicare,
  site-ul arată deci cifrele din cod până la prima reîmprospătare (cinci
  minute, `lib/cache-panou.ts`). Proba verifică legătura dintre text și panou,
  nu fereastra aia, deci o scurtează cu o salvare care nu schimbă nimic.
*/
const inapoiCifre = new URLSearchParams();
for (const [i, c] of cifreDinPanou.entries()) {
  inapoiCifre.set(`valoare-${i}`, c.valoare);
  inapoiCifre.set(`sufix-${i}`, c.sufix);
  inapoiCifre.set(`eticheta-${i}`, c.eticheta);
}
await cere("/api/admin/cifre", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: inapoiCifre,
});

const caText = new Intl.NumberFormat("ro-RO").format(
  Number(cifreDinPanou[0].valoare),
);
verifica(
  await astepta("/redirectioneaza-3-5", `${caText} de tabere`),
  `textul de la 3,5% scrie cifra din panou („${caText} de tabere”)`,
);

// ─── 4. Ce se scrie se vede, cu paragrafele despărțite ────────────────────
const SEMN = `Probă ${Date.now().toString().slice(-6)}`;
const DOUA = `${SEMN} — primul paragraf.\n\n${SEMN} — al doilea paragraf.`;
verifica(
  stare(await post({ cheie: "casa.bloc.1", continut: DOUA })) === "schimbat",
  "textul se salvează",
);
verifica(
  await astepta("/casa-teona", `${SEMN} — primul paragraf.`),
  "primul paragraf apare pe Casa Teona",
);
const casa = await (await cere("/casa-teona")).text();
verifica(
  casa.includes(`<p>${SEMN} — primul paragraf.</p>`) &&
    casa.includes(`<p>${SEMN} — al doilea paragraf.</p>`),
  "rândul gol a făcut două paragrafe, nu unul",
);

// ─── 5. Panoul spune că textul e schimbat ─────────────────────────────────
const dupa = await (await cere("/admin/texte")).text();
verifica(dupa.includes("Schimbat de voi"), "panoul marchează textul schimbat");
verifica(
  dupa.includes("Pune textul de la început"),
  "butonul de readucere apare numai la cele schimbate",
);

// ─── 6. Un text gol e refuzat ─────────────────────────────────────────────
verifica(
  stare(await post({ cheie: "casa.bloc.1", continut: "  " })) === "gol",
  "un text gol e refuzat, nu salvat",
);
verifica(
  await astepta("/casa-teona", `${SEMN} — primul paragraf.`, 2),
  "…și textul de dinainte a rămas neatins",
);

// ─── 7. O cheie din afara listei nu scrie nimic ───────────────────────────
verifica(
  stare(await post({ cheie: "inventat.oarecare", continut: "x".repeat(20) })) ===
    "necunoscut",
  "o cheie din afara listei e refuzată",
);

// ─── 8. „Pune textul de la început” ───────────────────────────────────────
/* Partea care contează: ce scria la lansare se întoarce întreg. */
verifica(
  stare(await post({ cheie: "casa.bloc.1", fel: "inapoi" })) === "readus",
  "„Pune textul de la început” merge",
);
verifica(
  await astepta("/casa-teona", "Zilele la Casa Teona sunt pline de activități"),
  "textul de la început e înapoi pe pagină, întreg",
);
verifica(
  !(await vizibil("/casa-teona")).includes(SEMN),
  "…și textul de probă a dispărut",
);
verifica(
  !(await (await cere("/admin/texte")).text()).includes("Schimbat de voi"),
  "panoul nu-l mai arată ca schimbat",
);

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
