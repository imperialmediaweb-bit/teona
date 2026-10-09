/*
  Antetul la lățimile unde se sparg lucrurile.

  De la 1280 px antetul are două rânduri: sigla și contactul sus, meniul pe
  banda de dedesubt. Testul verifică, la fiecare lățime, că nimic nu iese din
  container și că meniul nu are nevoie de derulare pe orizontală — nouă
  etichete lungi în română sunt exact la limită, deci se măsoară, nu se
  presupune.
*/
import { browser, BAZA } from "./comun.mjs";

const b = await browser();
const ctx = await b.newContext({ viewport: { width: 1280, height: 400 } });
await ctx.addInitScript(() =>
  localStorage.setItem(
    "teona:acord-cookieuri",
    JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() }),
  ),
);
const page = await ctx.newPage();
let rele = 0;

for (const w of [1279, 1280, 1300, 1340, 1366, 1400, 1440, 1470, 1500, 1536, 1600, 1920]) {
  await page.setViewportSize({ width: w, height: 400 });
  await page.goto(BAZA + "/casa-teona", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const r = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Meniu principal"]');
    const doneaza = document.querySelector('header a[aria-label="Donează"]');
    const randSus = doneaza.closest("header > div");
    const peTelefon = !nav.offsetParent;

    /*
      Meniul stă acum într-o pistă care se strânge pe conținut, deci lățimea
      ei nu mai spune nimic: ar da mereu rezervă zero. Se măsoară față de
      containerul din jur, care chiar are o limită.
    */
    const invelis = peTelefon ? null : nav.parentElement;
    const cs = invelis ? getComputedStyle(invelis) : null;
    const folosit = peTelefon ? 0 : nav.getBoundingClientRect().width;
    const disponibil = invelis
      ? invelis.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight)
      : 0;

    return {
      peTelefon,
      rezervaMeniu: peTelefon ? null : Math.round(disponibil - folosit),
      doneazaIese:
        Math.round(doneaza.getBoundingClientRect().right) >
        Math.round(randSus.getBoundingClientRect().right) + 1,
      derulareLaterala: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      inaltime: Math.round(document.querySelector("header").getBoundingClientRect().height),
    };
  });

  const rau = r.derulareLaterala || r.doneazaIese || (r.rezervaMeniu !== null && r.rezervaMeniu < 0);
  if (rau) rele++;
  console.log(
    `${String(w).padStart(4)}px  antet ${String(r.inaltime).padStart(3)}px  ` +
      (r.peTelefon ? "meniu de telefon" : `rezervă meniu ${String(r.rezervaMeniu).padStart(4)}px`) +
      `  ${rau ? `✗${r.derulareLaterala ? " derulare laterală" : ""}${r.doneazaIese ? " Donează iese" : ""}${r.rezervaMeniu < 0 ? " meniul nu încape" : ""}` : "✓"}`,
  );
}

await b.close();
console.log(rele === 0 ? "\nAntetul încape la toate lățimile." : `\n${rele} lățimi cu probleme.`);
process.exit(rele === 0 ? 0 : 1);
