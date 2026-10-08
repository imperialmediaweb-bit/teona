// Țintele de atins sub 40 px pe o latură, la lățimile mici de telefon.
// Linkurile din mijlocul unei fraze (inline, într-un <p>) sunt exceptate.
// Rulare: node scripts/verifica-tinte.mjs [adresa]   (implicit http://localhost:3000)
import { chromium } from 'playwright';

const ADRESA = process.argv[2] ?? 'http://localhost:3000';
const RUTE = [
  '/despre-noi', '/casa-teona', '/proiecte', '/sponsori-si-parteneri',
  '/suntem-in-presa', '/devino-voluntar', '/contact', '/doneaza',
  '/redirectioneaza-3-5', '/directioneaza-20', '/raport-de-activitate-2025',
  '/politica-de-confidentialitate',
];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
let total = 0;
for (const w of [320, 360, 390, 430]) {
  for (const ruta of RUTE) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    const pg = await ctx.newPage();
    await pg.goto(ADRESA + ruta, { waitUntil: 'networkidle' });
    const mici = await pg.evaluate(() => {
      const din = (el) => el.closest('header, footer, [data-antet], [data-subsol]');
      const rez = [];
      for (const el of document.querySelectorAll('main a, main button, main input, main select, main textarea, main summary, main label')) {
        if (din(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // ascuns
        const inline = getComputedStyle(el).display === 'inline' && el.closest('p, li, span, td');
        if (inline) continue;
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
          // bifa e în interiorul unui <label> mare: ținta e eticheta
          const l = el.closest('label');
          if (l) { const rl = l.getBoundingClientRect(); if (rl.height >= 40 && rl.width >= 40) continue; }
        }
        if (el.tagName === 'LABEL' && el.querySelector('input')) {
          // eticheta-card: se măsoară ea
        } else if (el.tagName === 'LABEL') continue; // eticheta simplă de câmp
        if (r.width < 40 || r.height < 40) {
          rez.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} «${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}»`);
        }
      }
      return rez;
    });
    if (mici.length) {
      total += mici.length;
      console.log(`${w}px ${ruta}`);
      for (const m of mici) console.log('   ', m);
    }
  }
}
await b.close();
console.log(total ? `✗ ${total} ținte mici` : '✓ nicio țintă sub 40 px');
process.exit(total ? 1 : 0);
