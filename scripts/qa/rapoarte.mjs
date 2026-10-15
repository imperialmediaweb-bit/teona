/**
 * Rapoartele descărcabile din panou.
 *
 * Un raport pleacă din asociație: la consiliul director, la o firmă care
 * întreabă ce s-a făcut cu banii, în raportul de activitate. De aceea proba
 * se uită la patru lucruri, în ordinea în care dor dacă se strică:
 *
 *   1. **documentele ies întregi** — un PDF începe cu „%PDF" și vine cu nume
 *      de fișier în antetul de descărcare;
 *   2. **perioada nu se crede pe cuvânt** — luna, anul și campania vin din
 *      adresă, deci o lună scrisă altfel decât `2026-10`, un an dinainte de
 *      înființarea asociației sau o campanie inexistentă primesc un refuz, nu
 *      un document gol cu antetul asociației pe el;
 *   3. **nimic fără sesiune** — cifrele financiare și numele donatorilor nu
 *      stau la adresă publică;
 *   4. **pagina spune ce pleacă și ce nu** — raportul lunar are nume de
 *      donatori, celelalte două n-au, iar eticheta asta se vede înainte de
 *      descărcare, nu abia în PDF.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/rapoarte.mjs
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

async function raport(adresa) {
  const r = await cere(adresa);
  if (!r.ok) return { stare: r.status, inceput: "", octeti: 0, nume: "" };
  const octeti = new Uint8Array(await r.arrayBuffer());
  return {
    stare: r.status,
    inceput: String.fromCharCode(...octeti.slice(0, 4)),
    octeti: octeti.length,
    nume: r.headers.get("content-disposition") ?? "",
  };
}

// ─── 1. Fără sesiune nu iese nimic ────────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/raport?fel=anual&an=2026`, {
  redirect: "manual",
});
verifica(
  peFurate.status === 403,
  `fără sesiune, raportul e refuzat (${peFurate.status})`,
);

// ─── 2. Intrarea ──────────────────────────────────────────────────────────
const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/rapoarte" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 3. Pagina ────────────────────────────────────────────────────────────
const html = await (await cere("/admin/rapoarte")).text();
for (const bucata of ["Raport lunar", "Raport anual", "Raport pe campanie"]) {
  verifica(html.includes(bucata), `pagina are „${bucata}"`);
}
verifica(
  html.includes("Document intern — are nume de donatori") &&
    html.includes("Se poate trimite — fără date personale"),
  "pagina spune care raport are date personale și care nu",
);

// ─── 4. Documentele ies întregi ───────────────────────────────────────────
const acum = new Date();
const lunaTrecuta = new Date(
  Date.UTC(acum.getUTCFullYear(), acum.getUTCMonth() - 1, 1),
);
const luna = `${lunaTrecuta.getUTCFullYear()}-${String(
  lunaTrecuta.getUTCMonth() + 1,
).padStart(2, "0")}`;

const lunar = await raport(`/api/admin/raport?fel=lunar&luna=${luna}`);
verifica(
  lunar.stare === 200 && lunar.inceput === "%PDF" && lunar.octeti > 10000,
  `raportul lunar iese întreg (${lunar.stare}, ${lunar.octeti} octeți)`,
);
verifica(
  lunar.nume.includes(`Raport-lunar-${luna}.pdf`),
  `raportul lunar are nume de fișier cu luna în el (${lunar.nume})`,
);

const anual = await raport(
  `/api/admin/raport?fel=anual&an=${acum.getUTCFullYear()}`,
);
verifica(
  anual.stare === 200 && anual.inceput === "%PDF" && anual.octeti > 10000,
  `raportul anual iese întreg (${anual.stare}, ${anual.octeti} octeți)`,
);

/*
  Campania se ia din pagină, nu se scrie aici.

  O campanie scrisă în probă ar fi mers o dată, pe baza de date de atunci, și
  ar fi picat pe oricare alta. Prima opțiune din meniul paginii e o campanie
  care sigur există acolo unde rulează proba.
*/
const slug = html.match(/name="campanie"[\s\S]*?<option value="([a-z0-9-]+)"/)?.[1];
if (slug) {
  const campanie = await raport(`/api/admin/raport?fel=campanie&campanie=${slug}`);
  verifica(
    campanie.stare === 200 && campanie.inceput === "%PDF",
    `raportul campaniei „${slug}" iese întreg (${campanie.stare})`,
  );
} else {
  console.log("~~~ nicio campanie publicată, sar peste raportul pe campanie");
}

// ─── 5. Perioada nu se crede pe cuvânt ────────────────────────────────────
for (const [adresa, asteptat, ce] of [
  ["/api/admin/raport?fel=lunar&luna=octombrie", 400, "o lună scrisă în cuvinte"],
  ["/api/admin/raport?fel=lunar&luna=2026-13", 400, "luna a treisprezecea"],
  ["/api/admin/raport?fel=anual&an=1999", 400, "un an dinainte de asociație"],
  ["/api/admin/raport?fel=anual&an=3000", 400, "un an din viitor"],
  ["/api/admin/raport?fel=campanie&campanie=nu-exista-asa-ceva", 404, "o campanie inexistentă"],
  ["/api/admin/raport?fel=altceva", 400, "un fel de raport necunoscut"],
]) {
  const r = await cere(adresa);
  verifica(r.status === asteptat, `${ce} e refuzată (${r.status})`);
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
