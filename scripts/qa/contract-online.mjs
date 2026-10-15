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

/*
  Întâi scăpăm de bannerul de cookie-uri: stă fixat în josul ecranului și
  acoperă exact caseta de semnat. (Prins aici: mouse-ul nimerea un buton al
  bannerului, iar desenul nu apărea niciodată.)
*/
await pagina
  .getByRole("button", { name: /Acceptă toate/i })
  .click()
  .catch(() => {});
await pagina.waitForTimeout(300);

/*
  Semnatul pe ecran stă într-o secțiune închisă: calea întâi e descărcarea
  contractului completat. O deschidem, ca un om.
*/
await pagina.getByText("Sau semnează acum, pe ecran").click();
await pagina.waitForTimeout(400);

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

// ─── 3. Contractul completat, de descărcat ────────────────────────────────
/*
  Calea pe care o folosesc firmele serioase: iau documentul cu datele lor și îl
  semnează cu certificatul calificat. Verificăm că iese un fișier adevărat —
  un PDF începe cu „%PDF", iar un .docx e o arhivă zip, deci începe cu „PK".
*/
async function descarca(fel) {
  const r = await fetch(`${BAZA}/api/contract/descarca`, {
    method: "POST",
    body: new URLSearchParams({ ...bun(), fel }),
  });
  if (!r.ok) return { stare: r.status, inceput: "", octeti: 0, nume: "" };
  const octeti = new Uint8Array(await r.arrayBuffer());
  return {
    stare: r.status,
    inceput: String.fromCharCode(...octeti.slice(0, 4)),
    octeti: octeti.length,
    nume: r.headers.get("content-disposition") ?? "",
  };
}

const pdf = await descarca("pdf");
verifica(
  pdf.stare === 200 && pdf.inceput.startsWith("%PDF") && pdf.octeti > 20000,
  `PDF-ul completat iese întreg (${pdf.stare}, ${pdf.octeti} octeți)`,
);
verifica(
  /filename="[^"]*\.pdf"/.test(pdf.nume),
  `PDF-ul are nume de fișier în antet (${pdf.nume})`,
);

const word = await descarca("word");
verifica(
  word.stare === 200 && word.inceput.startsWith("PK") && word.octeti > 8000,
  `documentul Word completat iese întreg (${word.stare}, ${word.octeti} octeți)`,
);
verifica(
  /filename="[^"]*\.docx"/.test(word.nume),
  `documentul Word are nume de fișier în antet (${word.nume})`,
);

const model = await fetch(`${BAZA}/api/contract/descarca`);
const octetiModel = new Uint8Array(await model.arrayBuffer());
verifica(
  model.ok &&
    String.fromCharCode(...octetiModel.slice(0, 2)) === "PK" &&
    octetiModel.length > 8000,
  `modelul gol se scrie la cerere (${model.status}, ${octetiModel.length} octeți)`,
);

// ─── 4. Un contract bun trece de scrierea PDF-ului ────────────────────────
const corect = await trimite(bun());
verifica(
  corect.stare === 200 || corect.stare === 503,
  `un contract corect e scris și înregistrat, sau 503 fără bază de date (${corect.stare})`,
);

console.log(rele === 0 ? "\nToate probele trec." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
