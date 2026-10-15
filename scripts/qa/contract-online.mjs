/**
 * Contractul de sponsorizare, completat de pe site.
 *
 * Firma scrie CUI-ul, ia documentul cu datele ei, îl semnează în afara
 * site-ului — cu certificatul calificat sau cu pixul — și ni-l trimite pe
 * e-mail. Pe site nu se semnează nimic.
 *
 * Două lucruri trebuie să rămână adevărate:
 *
 *   1. **documentele ies întregi** — un PDF începe cu „%PDF", un .docx e o
 *      arhivă zip, deci începe cu „PK", iar amândouă vin cu numele firmei în
 *      antetul de descărcare;
 *   2. **serverul nu crede formularul pe cuvânt** — CUI-ul trece prin cifra de
 *      control, iar suma prin regula românească, ca „12,500.50" să nu intre ca
 *      12 lei și 50 de bani. De aici iese un document care poartă numele
 *      asociației.
 *
 * Rulare, pe un server pornit:
 *     BAZA=http://localhost:3000 node scripts/qa/contract-online.mjs
 */

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const CALE = "/directioneaza-20/contract";

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const bun = () => ({
  denumire: "FIRMA DE PROBĂ SRL",
  cui: "43533953",
  reprezentant: "Ion Probă",
  calitate: "Administrator",
  telefon: "0712345678",
  valoare: "5.000",
});

async function descarca(date, fel) {
  const r = await fetch(`${BAZA}/api/contract/descarca`, {
    method: "POST",
    body: new URLSearchParams({ ...date, fel }),
  });
  if (!r.ok) {
    const corp = await r.json().catch(() => ({}));
    return { stare: r.status, mesaj: corp.mesaj ?? "", inceput: "", octeti: 0, nume: "" };
  }
  const octeti = new Uint8Array(await r.arrayBuffer());
  return {
    stare: r.status,
    mesaj: "",
    inceput: String.fromCharCode(...octeti.slice(0, 4)),
    octeti: octeti.length,
    nume: r.headers.get("content-disposition") ?? "",
  };
}

// ─── 1. Pagina ────────────────────────────────────────────────────────────
const pagina = await fetch(BAZA + CALE);
const html = await pagina.text();
verifica(pagina.ok, `${CALE} răspunde (${pagina.status})`);
verifica(
  html.includes("Descarcă în Word") && html.includes("Descarcă în PDF"),
  "pagina are amândouă butoanele de descărcare",
);
/*
  Semnatul pe ecran a fost scos: clientul a hotărât că semnătura se pune în
  afara site-ului. Dacă vreodată se întoarce pe pagină din greșeală, proba
  cade — nu vreau să apară la loc fără ca cineva s-o ceară.
*/
verifica(
  !html.includes("<canvas"),
  "pe pagină nu există nicio casetă de semnat",
);

// ─── 2. Documentele ies întregi ───────────────────────────────────────────
const pdf = await descarca(bun(), "pdf");
verifica(
  pdf.stare === 200 && pdf.inceput.startsWith("%PDF") && pdf.octeti > 20000,
  `PDF-ul completat iese întreg (${pdf.stare}, ${pdf.octeti} octeți)`,
);
verifica(
  /filename="[^"]*\.pdf"/.test(pdf.nume),
  `PDF-ul are nume de fișier în antet (${pdf.nume})`,
);

const word = await descarca(bun(), "word");
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

// ─── 3. Serverul nu crede pe nimeni pe cuvânt ─────────────────────────────
const faraDenumire = await descarca({ ...bun(), denumire: "" }, "pdf");
verifica(
  faraDenumire.stare === 400,
  `fără denumirea firmei nu iese niciun document (${faraDenumire.stare})`,
);

const cuiStramb = await descarca({ ...bun(), cui: "12345678" }, "pdf");
verifica(
  cuiStramb.stare === 400 && /CUI/.test(cuiStramb.mesaj),
  `un CUI cu cifra de control greșită e refuzat (${cuiStramb.stare})`,
);

const sumaEngleza = await descarca({ ...bun(), valoare: "12,500.50" }, "pdf");
verifica(
  sumaEngleza.stare === 400,
  `suma scrisă englezește e refuzată, nu ghicită (${sumaEngleza.stare})`,
);

console.log(rele === 0 ? "\nToate probele trec." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
