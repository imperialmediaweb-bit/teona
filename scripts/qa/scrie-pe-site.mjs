/**
 * Scrisul din panou, de la un capăt la altul.
 *
 * Verifică lucrul pentru care există secțiunea: cineva de la asociație scrie o
 * noutate, o lasă ciornă, o publică, o vede pe site și o șterge — fără să
 * treacă prin dezvoltator.
 *
 * Ce se verifică și de ce fiecare lucru contează:
 *
 *   1. o ciornă **nu** se vede pe site (altfel „salvează" ar publica);
 *   2. publicarea o face vizibilă **pe loc** — prima versiune a filtrului de
 *      adrese ținea minte slugurile o jumătate de minut, iar cine publica și
 *      apăsa „Vezi pe site" primea 404 pe textul lui;
 *   3. formatarea simplă (subtitlu, listă) ajunge în pagină;
 *   4. nimic din ce se scrie nu ajunge HTML în pagină — un `<script>` scris
 *      în câmp trebuie să se vadă ca text;
 *   5. o adresă inexistentă răspunde 404, nu 200;
 *   6. ștergerea chiar șterge.
 *
 * Rulare, pe un server pornit cu bază de date și PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=... node scripts/qa/scrie-pe-site.mjs
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

/** Un borcan de cookie-uri cât se poate de mic. */
let cookie = "";
async function cere(cale, optiuni = {}) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: { ...(optiuni.headers ?? {}), ...(cookie ? { cookie } : {}) },
  });
  const primit = r.headers.getSetCookie?.() ?? [];
  for (const c of primit) cookie = c.split(";")[0];
  return r;
}

const TITLU = `Probă automată ${Date.now()}`;
const TEXT = [
  "Primul paragraf al probei, destul de lung cât să treacă de verificare.",
  "",
  "## Un subtitlu de probă",
  "",
  "- un punct de listă",
  "- încă unul",
  "",
  '<script>alert("ar fi rău")</script>',
].join("\n");

// 1. Intrare în panou.
const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/scrie" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

/** Trimite formularul editorului. */
async function salveaza(actiune, id) {
  const corp = new FormData();
  corp.set("fel", "noutate");
  corp.set("titlu", TITLU);
  corp.set("rezumat", "Rezumatul probei.");
  corp.set("continut", TEXT);
  corp.set("actiune", actiune);
  if (id) corp.set("id", id);
  const r = await cere("/api/admin/texte", { method: "POST", body: corp });
  const unde = r.headers.get("location") ?? "";
  return { status: r.status, id: (unde.match(/scrie\/([0-9a-f-]{36})/) ?? [])[1] };
}

// 2. Ciorna nu se vede pe site.
const ciorna = await salveaza("salveaza");
verifica(ciorna.status === 303 && Boolean(ciorna.id), "ciorna s-a salvat");

const listaCuCiorna = await (await cere("/noutati")).text();
verifica(
  !listaCuCiorna.includes(TITLU),
  "ciorna NU apare pe site",
);

// 3. Publicarea o face vizibilă pe loc.
const publicat = await salveaza("publica", ciorna.id);
verifica(publicat.status === 303, "publicarea a mers");

const lista = await (await cere("/noutati")).text();
verifica(lista.includes(TITLU), "textul publicat apare în listă");

const slug = (lista.match(/\/noutati\/(proba-automata-\d+)/) ?? [])[1];
verifica(Boolean(slug), `slugul s-a făcut din titlu (${slug ?? "lipsă"})`);

const pagina = await cere(`/noutati/${slug}`);
const html = await pagina.text();
verifica(
  pagina.status === 200,
  `pagina răspunde imediat după publicare (${pagina.status})`,
);
verifica(html.includes("Un subtitlu de probă"), "subtitlul e în pagină");
verifica(html.includes("un punct de listă"), "lista e în pagină");
verifica(
  !html.includes('<script>alert("ar fi rău")</script>'),
  "ce s-a scris în câmp nu ajunge script în pagină",
);

// 4. O adresă inexistentă.
const lipsa = await cere("/noutati/nu-exista-asa-ceva-12345");
verifica(lipsa.status === 404, `o noutate inexistentă dă 404 (${lipsa.status})`);

// 5. Ștergerea.
const sterge = new FormData();
sterge.set("id", ciorna.id);
sterge.set("actiune", "sterge");
const sters = await cere("/api/admin/texte", { method: "POST", body: sterge });
verifica(sters.status === 303, "ștergerea a mers");

const dupa = await cere(`/noutati/${slug}`);
verifica(dupa.status === 404, `textul șters nu mai e pe site (${dupa.status})`);

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
