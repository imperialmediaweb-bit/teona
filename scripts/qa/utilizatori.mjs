/**
 * Conturile pe oameni și rolurile lor, verificate de la capăt la capăt.
 *
 * Panoul a mers cu o singură parolă cât timp îl deschideau două persoane care
 * făceau același lucru. Un om de strângere de fonduri schimbă socoteala, și
 * odată cu ea apar patru lucruri care trebuie să fie adevărate **și să rămână
 * adevărate** după fiecare schimbare de cod:
 *
 *   1. **rolul închide pagina, nu doar linkul din meniu.** Ascunsul din bară
 *      e politețe; dacă adresa scrisă de mână deschide pagina, n-am făcut
 *      nimic. Se verifică amândouă: că linkul lipsește și că pagina refuză;
 *   2. **rutele din `/api/admin` cer același drept ca pagina lor.** O pagină
 *      închisă în față, cu ruta ei deschisă în spate, e o poartă cu lacăt pe
 *      ușa din față. Aici se încearcă ruta de-a dreptul, cu cookie-ul omului
 *      care n-are voie;
 *   3. **oprirea unui cont are efect pe loc.** Ăsta e tot rostul conturilor:
 *      un om oprit la 10:00 nu mai intră la 10:01, nu la expirarea
 *      cookie-ului de douăsprezece ore. Se verifică cu cookie-ul lui, deja
 *      obținut, după ce contul a fost oprit;
 *   4. **parola nu stă în clar în baza de date.** Se citește coloana și se
 *      caută în ea parola scrisă. Dacă se găsește, proba cade.
 *
 * Plus un al cincilea, mai mic dar ușor de pierdut: răspunsul la o adresă
 * necunoscută e **la fel** ca la o parolă greșită. Altfel formularul de
 * intrare devine un instrument de aflat cine lucrează la asociație.
 *
 * Rulare, pe un server pornit, cu baza de date la care se uită și el:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… DATABASE_URL=… \
 *       node scripts/qa/utilizatori.mjs
 *
 * **Patru intrări, nu mai multe.** Ruta de intrare are o limită de 5 cereri la
 * 15 minute de la aceeași adresă — pusă acolo tocmai ca o parolă să nu se
 * poată ghici prin încercări. Proba face exact patru, dinadins. A doua rulare
 * la rând, de pe același IP, va lua 429 la ultima: nu e o cădere, e limita
 * care funcționează. Se așteaptă un sfert de oră, sau se repornește serverul.
 *
 * Contul de probă se face și se șterge de aici. Dacă proba cade la mijloc,
 * rândul rămâne în tabel — se șterge rulând-o din nou, care curăță la început.
 */

import { Client } from "pg";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const PAROLA_ADMIN = process.env.PAROLA_ADMIN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!PAROLA_ADMIN || !DATABASE_URL) {
  console.error(
    "Lipsesc PAROLA_ADMIN sau DATABASE_URL. Proba are nevoie de amândouă:\n" +
      "  BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/utilizatori.mjs",
  );
  process.exit(2);
}

/* Datele contului de probă. Adresa e una care nu poate fi a cuiva adevărat. */
const EMAIL = "proba-fundraising@exemplu.invalid";
const PAROLA = "parola-de-proba-care-e-lunga-destul";
const NUME = "Probă Fundraising";

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

/** Cookie-ul de sesiune din răspunsul rutei de intrare, dacă a dat unul. */
function cookieul(raspuns) {
  const brut = raspuns.headers.getSetCookie?.() ?? [];
  for (const rand of brut) {
    const pereche = rand.split(";")[0];
    if (pereche.startsWith("teona_verificare=")) {
      const valoare = pereche.slice("teona_verificare=".length);
      // Ieșirea pune un cookie gol ca să-l șteargă; ăla nu e o sesiune.
      return valoare ? pereche : null;
    }
  }
  return null;
}

async function intra(date) {
  const r = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    body: new URLSearchParams(date),
    redirect: "manual",
  });
  return {
    stare: r.status,
    unde: r.headers.get("location") ?? "",
    cookie: cookieul(r),
  };
}

const ia = (cale, cookie) =>
  fetch(`${BAZA}${cale}`, { headers: { cookie }, redirect: "manual" });

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: /@(localhost|127\.0\.0\.1)/.test(DATABASE_URL)
    ? false
    : { rejectUnauthorized: false },
});
await client.connect();

/* Curățăm înainte, nu doar după: o rulare căzută lasă rândul în tabel. */
await client
  .query("DELETE FROM utilizatori WHERE email = $1", [EMAIL])
  .catch(() => undefined);

// ─── 0. Nicio pagină de panou fără drept în listă ─────────────────────────
/*
  Verificare pe fișiere, înainte de orice cerere.

  `poateVedea` refuză o pagină pe care n-o găsește în `PAGINI` — alegerea e
  dinadins, fiindcă varianta cealaltă („nu știu de ea, deci treci") ar face ca
  fiecare pagină nouă să fie deschisă tuturor până își amintește cineva s-o
  adauge, și fără nicio eroare.
  Prețul alegerii e că o pagină uitată se închide pentru toți, inclusiv pentru
  administratori. Nu dă nici ea vreo eroare: pagina pur și simplu nu se mai
  deschide. Rândul ăsta o prinde la prima rulare de după.
*/
const listaPagini = readFileSync("src/lib/utilizatori.ts", "utf8");
const cunoscute = new Set(
  [...listaPagini.matchAll(/\{ cale: "([^"]+)"/g)].map((m) => m[1]),
);
const uitate = [];
for (const fisier of execSync("find src/app/admin -name page.tsx")
  .toString()
  .trim()
  .split("\n")) {
  const text = readFileSync(fisier, "utf8");
  for (const cale of new Set(
    [...text.matchAll(/activ="([^"]+)"/g)].map((m) => m[1]),
  )) {
    if (!cunoscute.has(cale)) uitate.push(`${cale} (${fisier})`);
  }
}
verifica(
  uitate.length === 0,
  uitate.length === 0
    ? `toate paginile panoului au drept în PAGINI (${cunoscute.size} căi)`
    : `pagini fără drept, deci închise pentru toți: ${uitate.join(", ")}`,
);

// ─── 1. Parola asociației intră (intrare 1 din 4) ─────────────────────────
const cheie = await intra({ parola: PAROLA_ADMIN, unde: "/admin" });
verifica(
  Boolean(cheie.cookie) && cheie.unde.endsWith("/admin"),
  `parola asociației intră și duce la /admin (a dus la „${cheie.unde}")`,
);
if (!cheie.cookie) {
  console.error("Fără sesiune de administrator nu se poate verifica nimic.");
  await client.end();
  process.exit(1);
}

// ─── 2. Se face contul de fundraising ─────────────────────────────────────
const facut = await fetch(`${BAZA}/api/admin/utilizatori`, {
  method: "POST",
  headers: { cookie: cheie.cookie },
  body: new URLSearchParams({
    fel: "adauga",
    nume: NUME,
    email: EMAIL,
    rol: "fundraising",
    parola: PAROLA,
  }),
  redirect: "manual",
});
verifica(
  (facut.headers.get("location") ?? "").includes("stare=facut"),
  `contul se face din panou (răspuns „${facut.headers.get("location") ?? facut.status}")`,
);

// ─── 3. Parola nu stă în clar în baza de date ─────────────────────────────
const randuri = await client.query(
  "SELECT id, rol, parola FROM utilizatori WHERE email = $1",
  [EMAIL],
);
const rand = randuri.rows[0];
verifica(Boolean(rand), "rândul a ajuns în tabelul utilizatori");
verifica(rand?.rol === "fundraising", `rolul scris e „${rand?.rol}"`);
verifica(
  typeof rand?.parola === "string" && rand.parola.startsWith("scrypt$"),
  "parola e păstrată trecută prin scrypt, cu parametrii scriși lângă ea",
);
verifica(
  typeof rand?.parola === "string" && !rand.parola.includes(PAROLA),
  "parola scrisă nu se găsește în clar în coloană",
);

// ─── 4. Omul intră cu contul lui (intrare 2 din 4) ────────────────────────
const om = await intra({ email: EMAIL, parola: PAROLA, unde: "/admin/firme" });
verifica(
  Boolean(om.cookie) && om.unde.endsWith("/admin/firme"),
  `contul intră și se întoarce pe pagina de unde a plecat (a dus la „${om.unde}")`,
);
if (!om.cookie) {
  console.error("Fără sesiunea omului nu se pot verifica drepturile.");
  await client.query("DELETE FROM utilizatori WHERE email = $1", [EMAIL]);
  await client.end();
  process.exit(1);
}

// ─── 5. Ce vede și ce nu vede ─────────────────────────────────────────────
const firme = await ia("/admin/firme", om.cookie);
const htmlFirme = await firme.text();
verifica(
  firme.status === 200 && !htmlFirme.includes('action="/api/admin/intrare"'),
  "pagina Firme se deschide pentru rolul de fundraising",
);

const formulare = await ia("/admin/formulare", om.cookie);
const htmlFormulare = await formulare.text();
verifica(
  htmlFormulare.includes("nu e deschisă pentru rolul tău"),
  "pagina Formulare 230 se închide, deși adresa a fost scrisă de mână",
);
verifica(
  !/\bCNP\b/.test(htmlFormulare),
  "pe pagina refuzată nu scapă nimic din conținutul ei",
);

const utilizatori = await ia("/admin/utilizatori", om.cookie);
verifica(
  (await utilizatori.text()).includes("nu e deschisă pentru rolul tău"),
  "pagina Utilizatori se închide: cine face conturi își face unul de administrator",
);

// ─── 6. Meniul nu arată ce nu se poate deschide ───────────────────────────
const tablou = await ia("/admin", om.cookie);
const htmlTablou = await tablou.text();
verifica(
  htmlTablou.includes("/admin/firme"),
  "meniul arată Firme, pe care rolul o are",
);
verifica(
  !htmlTablou.includes('href="/admin/formulare"'),
  "meniul nu arată Formulare 230, pe care rolul n-o are",
);
verifica(
  htmlTablou.includes(NUME),
  "jos în bară scrie cine e înăuntru, ca să se vadă cu al cui nume scrii în jurnal",
);

// ─── 7. Rutele din spate cer același drept ca paginile ────────────────────
const texte = await fetch(`${BAZA}/api/admin/texte`, {
  method: "POST",
  headers: { cookie: om.cookie },
  body: new URLSearchParams({ fel: "noutate" }),
  redirect: "manual",
});
verifica(
  texte.status === 403,
  `ruta care scrie pe site refuză rolul de fundraising (a dat ${texte.status})`,
);

/*
  POST, nu GET: ruta Formularelor 230 nu răspunde decât la POST, iar un GET ar
  lua 405 înainte să ajungă la verificarea drepturilor — adică proba ar fi
  trecut fără să verifice nimic.
*/
const formulareApi = await fetch(`${BAZA}/api/admin/formulare`, {
  method: "POST",
  headers: { cookie: om.cookie },
  body: new URLSearchParams({ fel: "stadiu" }),
  redirect: "manual",
}).then((r) => r.status);
verifica(
  formulareApi === 403,
  `ruta Formularelor 230 refuză rolul de fundraising (a dat ${formulareApi})`,
);

/* Exportul cere dreptul listei cerute, nu unul singur pentru toată ruta. */
const exportFirme = await ia("/api/admin/export?ce=firme", om.cookie);
verifica(
  exportFirme.status === 200,
  `exportul firmelor merge pentru fundraising (a dat ${exportFirme.status})`,
);

// ─── 8. Omul își schimbă parola, cu cea de acum în mână ──────────────────
/*
  Trei cereri aici, nicio intrare: se folosește sesiunea deja deschisă. Ruta de
  schimbat parola are limita ei (10 la 15 minute), mult mai largă decât cea de
  la intrare, fiindcă aici omul e deja înăuntru.
*/
const schimba = (date) =>
  fetch(`${BAZA}/api/admin/parola`, {
    method: "POST",
    headers: { cookie: om.cookie },
    body: new URLSearchParams(date),
    redirect: "manual",
  }).then((r) => r.headers.get("location") ?? String(r.status));

const greseste = await schimba({
  veche: "cu totul altceva decât parola lui",
  noua: "parola-noua-de-proba-lunga",
  iar: "parola-noua-de-proba-lunga",
});
verifica(
  greseste.includes("stare=veche"),
  "fără parola de acum nu se schimbă nimic: un laptop lăsat deschis nu e de ajuns ca să iei contul",
);

const nepotrivite = await schimba({
  veche: PAROLA,
  noua: "parola-noua-de-proba-lunga",
  iar: "altceva-scris-greșit-aici",
});
verifica(
  nepotrivite.includes("stare=diferite"),
  "două parole noi diferite sunt prinse înainte să se scrie una din ele",
);

const inainte = rand.parola;
const schimbata = await schimba({
  veche: PAROLA,
  noua: "parola-noua-de-proba-lunga",
  iar: "parola-noua-de-proba-lunga",
});
verifica(
  schimbata.includes("stare=schimbata"),
  "cu parola de acum, schimbarea trece",
);
const dupa = await client.query(
  "SELECT parola FROM utilizatori WHERE email = $1",
  [EMAIL],
);
verifica(
  dupa.rows[0]?.parola !== inainte &&
    String(dupa.rows[0]?.parola).startsWith("scrypt$"),
  "amprenta din baza de date s-a schimbat, și e tot una de scrypt",
);

// ─── 9. Oprirea are efect pe loc ──────────────────────────────────────────
const oprit = await fetch(`${BAZA}/api/admin/utilizatori`, {
  method: "POST",
  headers: { cookie: cheie.cookie },
  body: new URLSearchParams({ fel: "opreste", id: rand.id }),
  redirect: "manual",
});
verifica(
  (oprit.headers.get("location") ?? "").includes("stare=oprit"),
  "contul se oprește din panou",
);

const dupaOprire = await ia("/admin/firme", om.cookie);
verifica(
  (await dupaOprire.text()).includes('action="/api/admin/intrare"'),
  "cookie-ul de dinainte nu mai deschide nimic: oprirea nu așteaptă expirarea",
);

// ─── 10. Răspunsul nu spune care parte a greșit ────────────────────────────
/*
  Intrarea 3 din 4: cont care există, cu parola lui bună — cea pusă la pasul 8.
  Dacă aici s-ar folosi parola veche, proba ar trece și cu oprirea stricată:
  intrarea ar cădea oricum, din alt motiv.
*/
const aOprit = await intra({
  email: EMAIL,
  parola: "parola-noua-de-proba-lunga",
  unde: "/admin",
});
// Intrarea 4 din 4: adresă care n-a existat niciodată.
const aStrain = await intra({
  email: "nimeni@exemplu.invalid",
  parola: "parola-noua-de-proba-lunga",
  unde: "/admin",
});
verifica(
  aOprit.cookie === null && aStrain.cookie === null,
  "nici contul oprit, nici adresa necunoscută nu primesc sesiune",
);
verifica(
  aOprit.unde === aStrain.unde,
  `răspunsul e același pentru cont oprit și adresă necunoscută („${aOprit.unde}" / „${aStrain.unde}")`,
);

// ─── 11. Cheia asociației merge în continuare ─────────────────────────────
const cheieTot = await ia("/admin/utilizatori", cheie.cookie);
const htmlCheie = await cheieTot.text();
verifica(
  cheieTot.status === 200 && !htmlCheie.includes("nu e deschisă pentru rolul tău"),
  "parola asociației deschide în continuare tot, inclusiv Utilizatori",
);
verifica(
  htmlCheie.includes("parola asociației"),
  "pagina spune pe față că ești cu cheia comună, nu cu un cont",
);

// ─── Curățenie ────────────────────────────────────────────────────────────
await client.query("DELETE FROM utilizatori WHERE email = $1", [EMAIL]);
await client.end();

console.log(
  rele === 0 ? "\nTot bine." : `\n${rele} ${rele === 1 ? "cădere" : "căderi"}.`,
);
process.exit(rele === 0 ? 0 : 1);
