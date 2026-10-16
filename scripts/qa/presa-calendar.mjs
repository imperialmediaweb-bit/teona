/**
 * Lista de presă și calendarul de publicare.
 *
 * Trei lucruri contează:
 *
 * 1. **Nimeni din afară nu umblă în lista de presă.** Sunt adrese de
 *    redacții; o listă deschisă e o listă de spam gata făcută.
 * 2. **Sămânța se pune o singură dată.** Dacă s-ar pune la fiecare
 *    deschidere, un contact șters de asociație ar învia singur, iar
 *    comunicatul ar pleca unde n-ar trebui.
 * 3. **Calendarul nu publică nimic.** Ziua pusă pe o ciornă e o intenție;
 *    ciorna rămâne ciornă.
 *
 * Rulare: BAZA=… PAROLA_ADMIN=… node scripts/qa/presa-calendar.mjs
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

// ─── Fără sesiune ─────────────────────────────────────────────────────────
for (const cale of ["/api/admin/presa", "/api/admin/calendar"]) {
  const r = await fetch(BAZA + cale, {
    method: "POST",
    redirect: "manual",
    headers: { "x-forwarded-for": DE_LA },
    body: new URLSearchParams({ publicatie: "Ziarul Meu" }),
  });
  verifica(r.status === 403, `${cale} cere sesiune (403)`);
}

await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/presa" }),
});

// ─── Lista de presă ───────────────────────────────────────────────────────
const unu = await (await cere("/admin/presa")).text();
verifica(
  unu.includes("Monitorul de Suceava") && unu.includes("redactie@monitorulsv.ro"),
  "lista pornește cu redacțiile verificate",
);
verifica(
  unu.includes("fără adresă"),
  "publicațiile fără adresă se văd, nu dispar",
);

const cateUnu = (unu.match(/name="id" value="/g) ?? []).length;
const doi = await (await cere("/admin/presa")).text();
const cateDoi = (doi.match(/name="id" value="/g) ?? []).length;
verifica(
  cateUnu > 0 && cateUnu === cateDoi,
  `sămânța nu se pune a doua oară (${cateUnu} rânduri, apoi ${cateDoi})`,
);

const numeProba = `Proba QA ${Date.now()}`;
const adaugat = await cere("/api/admin/presa", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    ce: "adauga",
    publicatie: numeProba,
    fel: "online",
    email: "proba@exemplu.ro",
    persoana: "Un ziarist",
  }),
});
verifica(adaugat.status === 303, "un contact nou se adaugă (303)");

const trei = await (await cere("/admin/presa")).text();
verifica(trei.includes(numeProba), "și apare în listă");
verifica(
  trei.includes("proba@exemplu.ro"),
  "adresa lui intră în șirul de copiat",
);

const idul = new RegExp(
  `name="id" value="([0-9a-f-]{36})"[\\s\\S]{0,4000}?${numeProba}`,
).exec(trei)?.[1];
const oriceId = /name="id" value="([0-9a-f-]{36})"/.exec(trei)?.[1];
const deSters = idul ?? oriceId;

const faraNume = await cere("/api/admin/presa", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ ce: "adauga", publicatie: "" }),
});
verifica(
  (faraNume.headers.get("location") ?? "").includes("ratat=fara-nume"),
  "un contact fără nume de publicație e refuzat",
);

// ─── Calendarul ───────────────────────────────────────────────────────────
const mai = await (await cere("/admin/calendar?luna=2026-05")).text();
verifica(
  mai.includes("Termenul Formularului 230"),
  "25 mai apare singur în calendar",
);
const decembrie = await (await cere("/admin/calendar?luna=2026-12")).text();
verifica(
  decembrie.includes("persoanelor cu dizabilități"),
  "și 3 decembrie, în luna lui",
);
verifica(
  decembrie.includes("Declarației 177") &&
    decembrie.includes("confirmă contabilitatea"),
  "termenul nesigur e scris ca lucru de confirmat, nu ca zi fixă",
);

const ziStramba = await cere("/api/admin/calendar", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    id: "00000000-0000-0000-0000-000000000000",
    zi: "3 noiembrie",
  }),
});
verifica(ziStramba.status === 400, "o zi scrisă în cuvinte e refuzată (400)");

const faraId = await cere("/api/admin/calendar", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ id: "ceva", zi: "2026-11-03" }),
});
verifica(faraId.status === 400, "un text necunoscut e refuzat (400)");

// ─── Curățenie: contactul de probă pleacă ─────────────────────────────────
if (deSters) {
  await cere("/api/admin/presa", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ce: "sterge", id: deSters }),
  });
}

console.log(rele === 0 ? "\ntoate probele trec" : `\nverificări picate: ${rele}`);
process.exit(rele === 0 ? 0 : 1);
