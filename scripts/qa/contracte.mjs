/**
 * Registrul contractelor de sponsorizare.
 *
 * Patru lucruri contează:
 *
 * 1. **Numărul se dă singur și nu se repetă.** Două contracte „3/2026" în
 *    registrul unei asociații înseamnă că nimeni nu mai poate spune care e
 *    care — nici contabilul, nici firma.
 * 2. **Word și PDF-ul aceluiași contract primesc același număr.** Omul apasă
 *    amândouă butoanele; registrul n-are de ce să aibă două rânduri pentru o
 *    singură hârtie.
 * 3. **Nimeni din afară nu umblă în registru.**
 * 4. **„Semnate, bani neintrați" se vede separat** — sponsorizarea se scade
 *    din impozitul anului în care a fost plătită.
 *
 * Rulare: BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/contracte.mjs
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
const peFurate = await fetch(`${BAZA}/api/admin/contracte`, {
  method: "POST",
  redirect: "manual",
  headers: { "x-forwarded-for": DE_LA },
  body: new URLSearchParams({ id: "00000000-0000-0000-0000-000000000000" }),
});
verifica(peFurate.status === 403, "registrul nu se schimbă fără sesiune (403)");

await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/contracte" }),
});

const pagina = await cere("/admin/contracte");
const html = await pagina.text();
verifica(pagina.status === 200, "pagina registrului se deschide");
verifica(
  html.includes("Semnate, bani neintrați"),
  "„semnate, bani neintrați” se numără separat",
);
verifica(
  html.includes("Au sponsorizat înainte"),
  "lista celor care n-au reînnoit e pe pagină",
);

// ─── Numărul, la generarea contractului ───────────────────────────────────
const firme = await (await cere("/admin/firme")).text();
const idFirma = /\/admin\/firme\/([0-9a-f-]{36})/.exec(firme)?.[1];

if (!idFirma) {
  console.log("\nSĂRIT: nu există nicio firmă în bază de la care să plece un contract.");
} else {
  const corp = () =>
    new URLSearchParams({
      id: idFirma,
      fel: "pdf",
      denumire: "Firma de probă SRL",
      cui: "46466484",
      valoare: "1500",
      data: new Date().toISOString().slice(0, 10),
    });

  const unu = await cere("/api/admin/contract", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: corp(),
  });
  verifica(unu.status === 200, "contractul se generează (200)");

  const dupaUnu = await (await cere("/admin/contracte")).text();
  const numere = [...dupaUnu.matchAll(/(\d+)\/(\d{4})(?:<!-- -->)?\s*·\s*(?:<!-- -->)?Firma de probă SRL/g)];
  verifica(numere.length >= 1, "a intrat în registru, cu număr");

  // A doua apăsare, același contract: Word după PDF.
  const doi = await cere("/api/admin/contract", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: (() => {
      const c = corp();
      c.set("fel", "word");
      return c;
    })(),
  });
  verifica(doi.status === 200, "al doilea format se generează și el (200)");

  const dupaDoi = await (await cere("/admin/contracte")).text();
  const dinNou = [...dupaDoi.matchAll(/(\d+)\/(\d{4})(?:<!-- -->)?\s*·\s*(?:<!-- -->)?Firma de probă SRL/g)];
  verifica(
    dinNou.length === numere.length,
    `Word și PDF împart un singur număr (${numere.length} → ${dinNou.length} rânduri)`,
  );

  // Alt contract, altă sumă: număr nou.
  const altul = await cere("/api/admin/contract", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: (() => {
      const c = corp();
      c.set("valoare", "2700");
      return c;
    })(),
  });
  verifica(altul.status === 200, "o a doua sponsorizare se generează (200)");

  const dupaAltul = await (await cere("/admin/contracte")).text();
  const toate = [...dupaAltul.matchAll(/(\d+)\/(\d{4})(?:<!-- -->)?\s*·\s*(?:<!-- -->)?Firma de probă SRL/g)];
  verifica(
    toate.length === numere.length + 1,
    "altă sumă primește alt număr, cum trebuie",
  );

  const numereScrise = toate.map((m) => m[1]);
  verifica(
    new Set(numereScrise).size === numereScrise.length,
    `numerele nu se repetă (${numereScrise.join(", ")})`,
  );

  // ─── Schimbarea unui rând ───────────────────────────────────────────────
  const idContract = /name="id" value="([0-9a-f-]{36})"[\s\S]{0,200}?name="an"/.exec(
    dupaAltul,
  )?.[1];
  if (idContract) {
    const sumaStramba = await cere("/api/admin/contracte", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id: idContract,
        stadiu: "semnat",
        valoare: "o mie cinci sute",
      }),
    });
    verifica(
      (sumaStramba.headers.get("location") ?? "").includes("ratat=suma"),
      "o sumă scrisă în cuvinte e refuzată",
    );

    const stadiuStramb = await cere("/api/admin/contracte", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id: idContract,
        stadiu: "pe-jumatate",
      }),
    });
    verifica(stadiuStramb.status === 400, "un stadiu inventat e refuzat (400)");

    const bun = await cere("/api/admin/contracte", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id: idContract,
        stadiu: "semnat",
        valoare: "1500",
        observatii: "Probă QA",
      }),
    });
    verifica(bun.status === 303, "schimbarea bună se salvează (303)");
  }
}

console.log(rele === 0 ? "\ntoate probele trec" : `\nverificări picate: ${rele}`);
process.exit(rele === 0 ? 0 : 1);
