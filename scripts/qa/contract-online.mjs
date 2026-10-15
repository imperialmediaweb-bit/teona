/**
 * Contractul de sponsorizare, semnat pe site.
 *
 * Două lucruri trebuie să fie adevărate și să rămână adevărate:
 *
 *   1. **se poate semna** — pânza primește desenul, formularul îl trimite, iar
 *      serverul scrie PDF-ul cu semnătura lipită în el. Fără bază de date
 *      (cum e la dezvoltare) răspunsul e 503, nu 400 și nu 500: documentul
 *      s-a scris, doar n-avem unde-l pune;
 *   2. **nu se poate păcăli** — fără semnătură, fără bifă, cu CUI greșit sau
 *      cu o sumă scrisă englezește, serverul refuză. Tot ce vine dintr-un
 *      formular public poate fi scris de mână, iar aici se scrie un document
 *      care poartă numele asociației.
 *
 * Rulare, pe un server pornit:
 *     BAZA=http://localhost:3000 node scripts/qa/contract-online.mjs
 *
 * Ruta are o limită de 6 cereri la 30 de minute de la aceeași adresă, iar
 * proba trimite 5. A doua rulare la rând va lua 429 — nu e o cădere, e limita.
 */

import { chromium } from "playwright";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const CALE = "/directioneaza-20/semneaza";

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

/*
  Semnătura folosită la probele de server e chiar desenul făcut pe pânză, mai
  jos: așa trece prin rută exact ce trimite un om, nu un PNG inventat aici.
*/
let semnaturaDesenata = "";

const bun = () => ({
  denumire: "FIRMA DE PROBĂ SRL",
  cui: "43533953",
  reprezentant: "Ion Probă",
  calitate: "Administrator",
  email: "proba@example.com",
  telefon: "0712345678",
  valoare: "5.000",
  acord: "da",
  semnatura: semnaturaDesenata,
});

async function trimite(date) {
  const r = await fetch(`${BAZA}/api/contract`, {
    method: "POST",
    body: new URLSearchParams(date),
  });
  const corp = await r.json().catch(() => ({}));
  return { stare: r.status, mesaj: corp.mesaj ?? "" };
}

// ─── 1. Pagina și pânza de semnat ─────────────────────────────────────────
const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const raspunsPagina = await pagina.goto(BAZA + CALE, {
  waitUntil: "networkidle",
});
verifica(raspunsPagina?.ok() === true, `${CALE} răspunde (${raspunsPagina?.status()})`);

const panza = pagina.locator("canvas");
verifica((await panza.count()) === 1, "pagina are o casetă de semnat");

/*
  Desenăm chiar pe pânză, cu mouse-ul, ca un om. Dacă desenul n-ar ajunge în
  câmpul ascuns, formularul ar pleca fără semnătură — iar asta nu se vede
  nicăieri în cod, doar aici.
*/
// Pânza e jos în pagină: fără derulaj, coordonatele ei cad în afara ferestrei
// și mouse-ul ar desena pe altceva.
await panza.scrollIntoViewIfNeeded();
await pagina.waitForTimeout(300);
const chenar = await panza.boundingBox();
await pagina.mouse.move(chenar.x + 30, chenar.y + chenar.height / 2);
await pagina.mouse.down();
for (let i = 1; i <= 12; i++) {
  await pagina.mouse.move(
    chenar.x + 30 + i * 18,
    chenar.y + chenar.height / 2 + (i % 2 === 0 ? -18 : 18),
  );
}
await pagina.mouse.up();

const desen = await pagina.inputValue('input[name="semnatura"]');
verifica(
  desen.startsWith("data:image/png;base64,") && desen.length > 2000,
  `desenul ajunge în formular (${desen.length} semne)`,
);
semnaturaDesenata = desen;

const dupaStergere = await (async () => {
  await pagina.getByRole("button", { name: /Șterge și semnează din nou/i }).click();
  return pagina.inputValue('input[name="semnatura"]');
})();
verifica(dupaStergere === "", "butonul de ștergere chiar golește semnătura");

await browser.close();

// ─── 2. Serverul refuză ce trebuie refuzat ────────────────────────────────
const faraSemnatura = await trimite({ ...bun(), semnatura: "" });
verifica(
  faraSemnatura.stare === 400 && /[Ss]emnați/.test(faraSemnatura.mesaj),
  `fără semnătură nu pleacă nimic (${faraSemnatura.stare})`,
);

const faraBifa = await trimite({ ...bun(), acord: "" });
verifica(faraBifa.stare === 400, `fără bifă nu pleacă nimic (${faraBifa.stare})`);

const cuiStramb = await trimite({ ...bun(), cui: "12345678" });
verifica(
  cuiStramb.stare === 400 && /CUI/.test(cuiStramb.mesaj),
  `un CUI cu cifra de control greșită e refuzat (${cuiStramb.stare})`,
);

const sumaEngleza = await trimite({ ...bun(), valoare: "12,500.50" });
verifica(
  sumaEngleza.stare === 400,
  `suma scrisă englezește e refuzată, nu ghicită (${sumaEngleza.stare})`,
);

// ─── 3. Un contract bun trece de scrierea PDF-ului ────────────────────────
const corect = await trimite(bun());
verifica(
  corect.stare === 200 || corect.stare === 503,
  `un contract corect e scris și înregistrat, sau 503 fără bază de date (${corect.stare})`,
);

console.log(rele === 0 ? "\nToate probele trec." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
