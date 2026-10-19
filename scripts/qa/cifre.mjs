/**
 * Cifrele asociației: schimbate din panou, se schimbă peste tot.
 *
 * Caietul cere asta la pagina 1, printre regulile valabile pe tot site-ul:
 * „Cifrele sunt aceleași peste tot […] Asociația le poate modifica singură."
 * „Peste tot" nu e o figură de stil: pe site-ul vechi, prima pagină scria o
 * cifră și pagina Despre noi alta, fiindcă erau scrise de mână în două locuri.
 *
 * Proba schimbă o cifră prin panou și o caută pe cele patru suprafețe pe care
 * o publică site-ul — prima pagină, Despre noi, pagina de 3,5% și `llms.txt`
 * —, apoi pune cifrele înapoi cum erau. Dacă mâine cineva adaugă o a cincea
 * pagină cu cifra scrisă de mână, proba nu prinde asta; dar dacă rupe
 * legătura vreuneia dintre cele patru, cade aici.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/cifre.mjs
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

/* Adresă nouă la fiecare rulare: intrarea în panou e limitată pe adresă. */
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

/*
  Cache cu etichetă: golirea se vede la cererea următoare, nu la aceeași
  milisecundă. Prima citire de după salvare poate încă veni din cache, și
  asta nu e o defecțiune — e felul în care funcționează. Se încearcă de
  câteva ori, cu o pauză scurtă.
*/
async function astepta(cale, caut, incercari = 8) {
  for (let i = 0; i < incercari; i++) {
    const text = await (await cere(cale)).text();
    if (text.includes(caut)) return true;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

// ─── 1. Fără sesiune, cifrele nu se schimbă ───────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/cifre`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "x-forwarded-for": DE_LA,
    "content-type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ "valoare-0": "999" }),
});
verifica(
  peFurate.status === 403,
  `fără sesiune, schimbarea e refuzată (${peFurate.status})`,
);

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/cifre" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 2. Pagina din panou arată cele patru cifre ───────────────────────────
const panou = await (await cere("/admin/cifre")).text();
verifica(
  panou.includes("Se schimbă aici și se schimbă peste tot"),
  "pagina din panou răspunde",
);
const acum = [0, 1, 2, 3].map((i) => ({
  valoare: panou.match(new RegExp(`name="valoare-${i}"[^>]*value="(\\d+)"`))?.[1],
  sufix: panou.match(new RegExp(`name="sufix-${i}"[^>]*value="([^"]*)"`))?.[1] ?? "",
  eticheta: panou.match(
    new RegExp(`name="eticheta-${i}"[^>]*value="([^"]*)"`),
  )?.[1],
}));
verifica(
  acum.every((c) => c.valoare && c.eticheta),
  `cele patru cifre se citesc din formular (${acum.map((c) => c.valoare).join(", ")})`,
);
if (rele > 0) {
  console.log("\nNu pot merge mai departe fără cifrele de acum.");
  process.exit(1);
}

function trimite(cifre) {
  const corp = new URLSearchParams();
  for (const [i, c] of cifre.entries()) {
    corp.set(`valoare-${i}`, String(c.valoare));
    corp.set(`sufix-${i}`, c.sufix);
    corp.set(`eticheta-${i}`, c.eticheta);
  }
  return cere("/api/admin/cifre", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: corp,
  });
}

// ─── 3. O cifră de probă, imposibil de confundat ──────────────────────────
/*
  7777 nu seamănă cu nicio cifră adevărată a asociației, deci dacă o găsesc
  în pagină, am găsit-o pe a mea — nu una rămasă de dinainte.
*/
const PROBA = "7777";
const schimbate = await trimite([
  { ...acum[0], valoare: PROBA },
  ...acum.slice(1),
]);
const unde = schimbate.headers.get("location") ?? "";
verifica(
  schimbate.status === 303 && unde.includes("stare=schimbat"),
  `salvarea merge (${schimbate.status} → ${unde.split("?")[1] ?? ""})`,
);

// ─── 4. Cele patru suprafețe pe care se publică ───────────────────────────
/* „7.777" pe pagini: punctul de mii îl pune site-ul, deci îl caut cu punct. */
for (const [cale, caut] of [
  ["/", "7.777"],
  ["/despre-noi", "7.777"],
  ["/redirectioneaza-3-5", "7.777"],
  ["/llms.txt", "7.777"],
]) {
  verifica(await astepta(cale, caut), `cifra nouă apare pe ${cale}`);
}

// ─── 5. Cifra se scrie cu cifre, nu cu punct de mii ───────────────────────
/*
  „1.500" trimis în formular ar deveni 1 la o citire neglijentă, iar pagina
  ar scrie „1 participanți" fără nicio eroare. Ruta scoate punctele, deci
  cifra ajunge întreagă.
*/
const cuPunct = await trimite([
  { ...acum[0], valoare: "7.777" },
  ...acum.slice(1),
]);
verifica(
  (cuPunct.headers.get("location") ?? "").includes("stare=schimbat"),
  "o cifră scrisă „7.777” e primită, nu tăiată la 7",
);
verifica(await astepta("/", "7.777"), "și tot 7.777 rămâne în pagină");

// ─── 6. Ce nu e cifră se refuză ───────────────────────────────────────────
const gunoi = await trimite([{ ...acum[0], valoare: "multe" }, ...acum.slice(1)]);
verifica(
  (gunoi.headers.get("location") ?? "").includes("stare=cifra"),
  "un text în locul cifrei e refuzat, nu salvat",
);

// ─── 7. Înapoi cum erau ───────────────────────────────────────────────────
const inapoi = await trimite(acum);
verifica(
  (inapoi.headers.get("location") ?? "").includes("stare=schimbat"),
  "cifrele se pun înapoi cum erau",
);
verifica(
  await astepta("/", `>${Number(acum[0].valoare).toLocaleString("ro-RO")}<`),
  `prima pagină arată iar ${acum[0].valoare}`,
);

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
