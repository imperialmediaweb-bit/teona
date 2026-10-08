// Capturi cu pagina întreagă, la 1440 și 390 px, pentru paginile refăcute.
// Derulează până jos ca pozele cu încărcare leneșă să apară, apoi revine sus.
// Rulare: node scripts/capturi-pagini.mjs http://localhost:3001 /tmp/claude-0 [ruta...]
import { chromium } from 'playwright';

const ADRESA = process.argv[2] ?? 'http://localhost:3001';
const DIR = process.argv[3] ?? '/tmp/claude-0';
const RUTE = process.argv.length > 4 ? process.argv.slice(4) : [
  '/despre-noi', '/casa-teona', '/proiecte', '/sponsori-si-parteneri',
  '/suntem-in-presa', '/devino-voluntar', '/contact', '/doneaza',
  '/redirectioneaza-3-5', '/directioneaza-20', '/raport-de-activitate-2025',
  '/politica-de-confidentialitate',
];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
for (const w of [1440, 390]) {
  for (const ruta of RUTE) {
    const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.goto(ADRESA + ruta, { waitUntil: 'load', timeout: 60000 });
    // Bannerul de cookie-uri acoperă antetul în captură; îl închidem.
    await pg.getByRole('button', { name: 'Acceptă toate' }).click({ timeout: 3000 }).catch(() => {});
    // Derulare lentă până jos, ca pozele să se ceară și cifrele să pornească.
    await pg.evaluate(async () => {
      const pas = 500;
      for (let y = 0; y < document.body.scrollHeight; y += pas) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 250));
      }
      window.scrollTo(0, 0);
    });
    await pg.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    // Pozele care n-au apucat să se încarce (optimizatorul le face la prima
    // cerere): așteptăm până sunt toate gata, cel mult 45 de secunde.
    await pg.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 45000 }).catch(() => {});
    await pg.waitForTimeout(2500);
    const nume = `${DIR}/pag-${ruta.replace(/^\//, '').replace(/\//g, '-') || 'acasa'}-${w}.png`;
    await pg.screenshot({ path: nume, fullPage: true });
    console.log(nume);
    await ctx.close();
  }
}
await b.close();
