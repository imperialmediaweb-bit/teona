/**
 * Completarea din CUI, pe cele trei locuri unde apare.
 *
 * O firmă scrie CUI-ul și restul vine din datele publice ale ANAF:
 * denumirea, sediul, iar în calculator cifra de afaceri și impozitul din
 * ultimul bilanț depus. Proba verifică pe pagina adevărată, cu browser:
 *
 *   1. calculatorul de pe `/directioneaza-20` își completează cele două cifre
 *      și arată din ce an sunt;
 *   2. formularul de sponsorizare completează denumirea firmei;
 *   3. formularul de contact arată blocul „Verifică datele firmei”.
 *
 * Plus purtarea la margini: un CUI cu cifra de control greșită nu pleacă
 * nicăieri, iar unul valid dar inexistent spune asta fără să blocheze
 * formularul.
 *
 * Rulare, pe un server pornit:
 *     BAZA=http://localhost:3000 node scripts/qa/firma-anaf.mjs
 *
 * Cere internet: datele vin de la ANAF, în direct.
 */

import { BAZA, browser } from "./comun.mjs";

/** Dedeman SRL: firmă mare, cu bilanț public, ușor de verificat de oricine. */
const CUI = "2816464";
const DENUMIRE = /DEDEMAN/i;

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const b = await browser();
const pagina = await b.newPage();

try {
  // 1. Calculatorul
  await pagina.goto(`${BAZA}/directioneaza-20`, { waitUntil: "domcontentloaded" });
  const campCui = pagina.getByLabel(/CUI-ul firmei/i);
  await campCui.fill(CUI);

  const cifra = pagina.getByLabel(/Cifra de afaceri/i);
  await cifra.waitFor();
  await pagina.waitForFunction(
    () => {
      const c = document.querySelector('input[name="cifra-de-afaceri"]');
      return c instanceof HTMLInputElement && c.value.length > 3;
    },
    { timeout: 20_000 },
  );

  const valCifra = await cifra.inputValue();
  const valImpozit = await pagina
    .getByLabel(/Impozitul pe profit/i)
    .inputValue();
  verifica(Number(valCifra) > 0, `cifra de afaceri s-a completat (${valCifra})`);
  verifica(Number(valImpozit) > 0, `impozitul s-a completat (${valImpozit})`);
  verifica(
    Number(valImpozit) < Number(valCifra),
    "impozitul e mai mic decât cifra de afaceri",
  );

  const text = await pagina.locator("body").innerText();
  verifica(DENUMIRE.test(text), "scrie pentru ce firmă s-au completat");
  verifica(
    /din bilanțul depus la ANAF pe \d{4}/i.test(text),
    "scrie din ce an e bilanțul",
  );
  verifica(
    /Calculul este orientativ/i.test(text),
    "mențiunea „Calculul este orientativ” e tot acolo",
  );

  // Suma maximă apare, și e cea mai mică dintre cele două praguri.
  verifica(
    /Suma maximă pe care o poți direcționa/i.test(text) &&
      /Acesta e pragul care limitează suma/i.test(text),
    "suma maximă și pragul care o limitează se văd",
  );

  // 2. Formularul de sponsorizare, pe aceeași pagină sau pe cea de firme.
  for (const cale of ["/directioneaza-20", "/sponsori-si-parteneri"]) {
    await pagina.goto(`${BAZA}${cale}`, { waitUntil: "domcontentloaded" });
    const denumire = pagina.locator('input[name="firma"]');
    if ((await denumire.count()) === 0) continue;

    await pagina.locator('input[name="cui"]').first().fill(CUI);
    await pagina.waitForFunction(
      () => {
        const c = document.querySelector('input[name="firma"]');
        return c instanceof HTMLInputElement && c.value.length > 2;
      },
      { timeout: 20_000 },
    );
    verifica(
      DENUMIRE.test(await denumire.first().inputValue()),
      `${cale}: denumirea firmei s-a completat din CUI`,
    );
    break;
  }

  // 3. Formularul de contact
  await pagina.goto(`${BAZA}/contact`, { waitUntil: "domcontentloaded" });
  await pagina.getByLabel(/CUI \(dacă scrii/i).fill(CUI);
  await pagina
    .getByText(/Verifică datele firmei/i)
    .waitFor({ timeout: 20_000 });
  const contact = await pagina.locator("body").innerText();
  verifica(DENUMIRE.test(contact), "contact: datele firmei sunt pe ecran");
  verifica(
    /corectează aici/i.test(contact),
    "contact: omul e pus să verifice datele",
  );

  // 4. Marginile: cifră de control greșită, și CUI valid dar inexistent.
  const gresit = await pagina.evaluate(async () => {
    const r = await fetch("/api/firma?cui=12345678");
    return r.status;
  });
  verifica(gresit === 400, `un CUI cu cifra de control greșită e oprit (${gresit})`);

  const inexistent = await pagina.evaluate(async () => {
    const r = await fetch("/api/firma?cui=99999992");
    return r.status;
  });
  verifica(
    inexistent === 404,
    `un CUI valid dar inexistent dă „nu am găsit” (${inexistent})`,
  );
} finally {
  await b.close();
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
