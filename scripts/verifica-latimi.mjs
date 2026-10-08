/**
 * Caută depășirea pe orizontală, la lățimile uzuale de ecran.
 *
 * O pagină care se derulează lateral pe telefon arată stricată, iar cauza e
 * aproape mereu un singur element care nu se strânge — un card cu conținut lat
 * într-o grilă, unde `min-width: auto` împinge tot rândul. Verificarea asta îl
 * găsește înainte să-l vadă cineva.
 *
 * Cere serverul pornit (npm run start) și Playwright instalat local.
 * Rulare:                node scripts/verifica-latimi.mjs
 */
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'Verificarea cere Playwright, care nu e o dependență a proiectului.\n' +
    'Instalează-l o singură dată:  npm i -D playwright && npx playwright install chromium',
  );
  process.exit(2);
}
const PAGINI = [
  '/', '/despre-noi', '/casa-teona', '/proiecte', '/sponsori-si-parteneri',
  '/redirectioneaza-3-5', '/directioneaza-20', '/suntem-in-presa',
  '/devino-voluntar', '/contact', '/doneaza', '/raport-de-activitate-2025',
  '/politica-de-confidentialitate', '/termeni-si-conditii', '/politica-de-cookieuri',
];

const b=await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
let probleme=0;
for (const w of [320,360,390,414,768,1024,1280,1440,1920]) {
 for (const ruta of PAGINI) {
  const pg=await (await b.newContext({viewport:{width:w,height:900}})).newPage();
  await pg.goto('http://localhost:3000'+ruta,{waitUntil:'networkidle'});
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => {
    const lat = document.documentElement.clientWidth;
    const vinovati = [...document.querySelectorAll('body *')]
      .filter(e => e.getBoundingClientRect().right > lat + 1)
      .slice(0,3)
      .map(e => `${e.tagName}.${(e.className||'').toString().split(' ').slice(0,3).join('.')}`);
    return { scroll: document.documentElement.scrollWidth, lat, vinovati };
  });
  const depaseste = r.scroll > r.lat + 1;
  if (depaseste) {
    probleme++;
    console.log(`${String(w).padStart(5)}px ${ruta}  ✗ depășire ${r.scroll}px: ${r.vinovati.join(' | ')}`);
  }
  await pg.context().close();
 }
 console.log(`${String(w).padStart(5)}px  verificat ${PAGINI.length} pagini`);
}
await b.close();
process.exit(probleme ? 1 : 0);
