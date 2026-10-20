/**
 * Invitația în panou: omul își pune singur parola.
 *
 * **Ce înlocuiește.** Administratorul scria parola altcuiva și i-o trimitea pe
 * WhatsApp. Parola rămâne scrisă în conversație, administratorul o știe până
 * când (dacă) o schimbă omul, iar omul n-are niciun motiv s-o schimbe,
 * fiindcă merge. Cu invitația, parola n-o știe nimeni în afară de cel care o
 * folosește — adică fraza „numai tu îți știi parola" din panou devine
 * adevărată.
 *
 * Proba merge pe tot drumul, ca un om: face contul din panou, prinde e-mailul
 * într-un server de mențiune, scoate linkul din el, pune parola, **intră cu
 * ea**, și verifică la final că linkul nu mai merge a doua oară.
 *
 * Ce apără, în ordinea importanței:
 *
 *   1. **linkul folosit moare.** Dacă ar merge de două ori, oricine ajunge la
 *      e-mailul retrimis (un telefon de serviciu, o conversație retrimisă) ar
 *      putea schimba parola unui cont care intră în Formularele 230;
 *   2. **o invitație nouă o omoară pe cea veche**, altfel ar fi două chei
 *      valabile deodată, iar una într-o cutie poștală uitată;
 *   3. **contul fără parolă nu poate intra** cât timp n-a folosit invitația.
 *      E o ușă fără cheie, nu o ușă deschisă;
 *   4. **semnătura ține.** Un link cu o literă schimbată nu deschide nimic.
 *
 * Rulare, pe un server pornit cu bază de date, PAROLA_ADMIN și e-mailul mutat
 * pe serverul de probă:
 *
 *     EMAIL_API=http://127.0.0.1:4390 RESEND_API_KEY=probă \
 *       PAROLA_ADMIN=… DATABASE_URL=… npm run start
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/invitatie.mjs
 *
 * Proba pornește singură serverul de e-mail, pe portul 4390.
 */

import { createServer } from "node:http";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const PAROLA = process.env.PAROLA_ADMIN;
const PORT_EMAIL = Number(process.env.PORT_EMAIL ?? 4390);

if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

// ─── Serverul de e-mail de mențiune ───────────────────────────────────────
const primite = [];
const posta = createServer((cer, raspunde) => {
  let corp = "";
  cer.on("data", (b) => (corp += b));
  cer.on("end", () => {
    try {
      primite.push(JSON.parse(corp));
    } catch {
      primite.push({ brut: corp });
    }
    raspunde.writeHead(200, { "content-type": "application/json" });
    raspunde.end(JSON.stringify({ id: "mesaj-de-proba" }));
  });
});
await new Promise((r) => posta.listen(PORT_EMAIL, r));

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

/** Ca un om care deschide linkul din e-mail: fără cookie-ul de panou. */
function faraSesiune(cale, optiuni = {}) {
  return fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: { ...(optiuni.headers ?? {}), "x-forwarded-for": DE_LA },
  });
}

function stare(r) {
  return new URL(
    r.headers.get("location") ?? "http://x/",
    "http://x/",
  ).searchParams.get("stare");
}

function panou(date) {
  return cere("/api/admin/utilizatori", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(date),
  });
}

try {
  // ─── 1. Intrarea în panou ───────────────────────────────────────────────
  const intrare = await cere("/api/admin/intrare", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/utilizatori" }),
  });
  verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);
  if (rele > 0) throw new Error("fără sesiune nu se poate merge mai departe");

  // ─── 2. Contul, făcut prin invitație ────────────────────────────────────
  const adresa = `proba-invitatie-${Date.now()}@example.com`;
  const facut = await panou({
    fel: "invita",
    nume: "Om De Probă",
    email: adresa,
    rol: "fundraising",
  });
  verifica(
    stare(facut) === "invitat",
    `contul se face și invitația pleacă (${stare(facut)})`,
  );
  verifica(primite.length === 1, `serverul de e-mail a primit un mesaj (${primite.length})`);

  const mesaj = primite.at(-1) ?? {};
  verifica(
    (mesaj.to ?? []).includes(adresa),
    `mesajul e trimis la adresa contului (${(mesaj.to ?? []).join(", ")})`,
  );
  /*
    Mesajul nu trebuie să spună ce poate contul.

    Dacă ajunge greșit — un telefon de serviciu, o conversație retrimisă —
    „ai acces la Formularele 230" îi spune străinului exact ce a nimerit.
  */
  const tot = `${mesaj.subject ?? ""} ${mesaj.text ?? ""} ${mesaj.html ?? ""}`;
  verifica(
    !/230|donatori|fundraising|administrator/i.test(tot),
    "mesajul nu scrie ce poate contul",
  );

  const link = (mesaj.text ?? "").match(/https?:\/\/\S+\/invitatie\?\S+/)?.[0];
  verifica(Boolean(link), `linkul e în mesaj (${link ? "da" : "nu"})`);
  if (!link) throw new Error("fără link nu se poate merge mai departe");

  const cauta = new URL(link).search;

  // ─── 3. Contul încă nu poate intra ──────────────────────────────────────
  const preaDevreme = await faraSesiune("/api/admin/intrare", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: adresa, parola: "oricealtceva123" }),
  });
  const unde = preaDevreme.headers.get("location") ?? "";
  verifica(
    unde.includes("gresit"),
    `un cont fără parolă nu poate intra (${unde.split("?")[1] ?? unde})`,
  );

  // ─── 4. Pagina de pus parola ────────────────────────────────────────────
  const pagina = await (await faraSesiune(`/invitatie${cauta}`)).text();
  verifica(pagina.includes("Îți pui parola"), "pagina de invitație se deschide");
  verifica(
    !pagina.includes("Om De Probă") && !pagina.includes(adresa),
    "pagina nu scrie numele și nici adresa omului",
  );

  const stricat = await (
    await faraSesiune(`/invitatie${cauta.slice(0, -3)}zzz`)
  ).text();
  verifica(
    stricat.includes("Linkul nu mai e bun"),
    "un link cu semnătura schimbată nu deschide nimic",
  );

  // ─── 5. Parola pusă ─────────────────────────────────────────────────────
  const d = Object.fromEntries(new URL(link).searchParams);
  const NOUA = "parola-mea-lunga-2026";

  const scurta = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d, parola: "scurt", iar: "scurt" }),
  });
  verifica(
    (scurta.headers.get("location") ?? "").includes("gresit=scurta"),
    "o parolă prea scurtă e refuzată",
  );

  const diferite = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d, parola: NOUA, iar: `${NOUA}x` }),
  });
  verifica(
    (diferite.headers.get("location") ?? "").includes("gresit=diferite"),
    "două parole diferite sunt refuzate",
  );

  const pusa = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d, parola: NOUA, iar: NOUA }),
  });
  const dupa = pusa.headers.get("location") ?? "";
  verifica(
    pusa.status === 303 && dupa.includes("/admin"),
    `parola se pune (${pusa.status} → ${dupa})`,
  );

  // ─── 6. Acum intră cu ea ────────────────────────────────────────────────
  const intra = await faraSesiune("/api/admin/intrare", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: adresa, parola: NOUA }),
  });
  const u2 = intra.headers.get("location") ?? "";
  verifica(
    intra.status === 303 && !u2.includes("gresit"),
    `omul intră cu parola lui (${intra.status} → ${u2})`,
  );

  // ─── 7. Linkul nu mai merge a doua oară ─────────────────────────────────
  const aDoua = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d, parola: "altaparola12345", iar: "altaparola12345" }),
  });
  verifica(
    (aDoua.headers.get("location") ?? "").includes("gresit=folosit"),
    "linkul folosit nu mai pune parola a doua oară",
  );

  const totIntra = await faraSesiune("/api/admin/intrare", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: adresa, parola: NOUA }),
  });
  verifica(
    !(totIntra.headers.get("location") ?? "").includes("gresit"),
    "…iar parola pusă de om a rămas neatinsă",
  );

  // ─── 8. O invitație nouă o omoară pe cea veche ──────────────────────────
  /*
    Al doilea om, ca să plece două invitații pentru același cont. Dacă cea
    veche ar rămâne bună, linkul uitat într-o cutie poștală ar fi o a doua
    cheie — iar cine ajunge la ea poate schimba parola unui cont care vede
    Formularele 230.
  */
  const adresa2 = `proba-invitatie-b-${Date.now()}@example.com`;
  const alDoilea = await panou({
    fel: "invita",
    nume: "Al Doilea Om",
    email: adresa2,
    rol: "fundraising",
  });
  verifica(stare(alDoilea) === "invitat", "al doilea cont, prin invitație");

  const d1 = Object.fromEntries(
    new URL(
      (primite.at(-1)?.text ?? "").match(/https?:\/\/\S+\/invitatie\?\S+/)?.[0] ??
        "http://x/invitatie",
    ).searchParams,
  );

  const id2 = d1.u;
  verifica(Boolean(id2), "am identificatorul celui de-al doilea cont");

  const retrimis = await panou({ fel: "reinvita", id: id2 });
  verifica(
    stare(retrimis) === "invitat",
    `retrimiterea merge (${stare(retrimis)})`,
  );
  verifica(primite.length === 3, `a plecat al doilea e-mail (${primite.length})`);

  const vechi = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d1, parola: "parola-veche-2026", iar: "parola-veche-2026" }),
  });
  verifica(
    (vechi.headers.get("location") ?? "").includes("gresit=folosit"),
    "linkul dinaintea retrimiterii nu mai merge",
  );

  const d2 = Object.fromEntries(
    new URL(
      (primite.at(-1)?.text ?? "").match(/https?:\/\/\S+\/invitatie\?\S+/)?.[0] ??
        "http://x/invitatie",
    ).searchParams,
  );
  const nou = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d2, parola: "parola-noua-2026", iar: "parola-noua-2026" }),
  });
  verifica(
    (nou.headers.get("location") ?? "").includes("/admin"),
    "…iar cel din urmă link merge",
  );

  // ─── 9. Contul oprit nu-și mai poate pune parola ────────────────────────
  const alTreilea = await panou({
    fel: "invita",
    nume: "Om Oprit",
    email: `proba-invitatie-c-${Date.now()}@example.com`,
    rol: "fundraising",
  });
  verifica(stare(alTreilea) === "invitat", "al treilea cont, prin invitație");
  const d3 = Object.fromEntries(
    new URL(
      (primite.at(-1)?.text ?? "").match(/https?:\/\/\S+\/invitatie\?\S+/)?.[0] ??
        "http://x/invitatie",
    ).searchParams,
  );
  await panou({ fel: "opreste", id: d3.u });
  const oprit = await faraSesiune("/api/invitatie", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...d3, parola: "parola-oprit-2026", iar: "parola-oprit-2026" }),
  });
  verifica(
    (oprit.headers.get("location") ?? "").includes("gresit=folosit"),
    "un cont oprit nu-și mai poate pune parola din invitație",
  );
} finally {
  posta.close();
}

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
