import { browser } from "./comun.mjs";

/**
 * Cât sare pagina în timp ce se încarcă (CLS).
 *
 * Saltul e singurul defect de viteză pe care omul îl simte ca pe o greșeală a
 * lui: apeși „Donează”, conținutul coboară, și apeși de fapt altceva. Google
 * îl măsoară cu aceeași unitate — CLS, suma suprafețelor mutate împărțită la
 * ecran — și îl trece la „bun” sub 0,1.
 *
 * Proba asta a fost scrisă după ce măsurătoarea a arătat 0,16 pe toate
 * paginile: antetul stătea într-un `<Suspense>` fără `fallback`, deci lipsea
 * din primul HTML, iar bara de anunț se scria abia după ce pornea
 * JavaScriptul. Împreună, împingeau pagina în jos cu 212 px pe ecran lat.
 *
 * **Se rulează pe build-ul de producție**, nu pe serverul de dezvoltare: în
 * dezvoltare paginile se compilează la prima cerere și orice măsurătoare de
 * timp e zgomot.
 *
 *     npm run build
 *     PORT=3101 npm run start &
 *     BAZA_PROD=http://localhost:3101 node scripts/qa/salt-layout.mjs
 *
 * Procesorul e încetinit de patru ori, cât un telefon de mijloc: pe o mașină
 * rapidă totul se așază înainte să apuce să se vadă, iar proba ar trece și cu
 * defectul în pagină.
 */

const BAZA_PROD = process.env.BAZA_PROD;
if (!BAZA_PROD) {
  console.log(
    "SĂRIT: lipsește BAZA_PROD. Saltul se măsoară pe build-ul de producție:\n" +
      "  npm run build && PORT=3101 npm run start &\n" +
      "  BAZA_PROD=http://localhost:3101 node scripts/qa/salt-layout.mjs",
  );
  process.exit(2);
}

/** Peste atât, pagina sare destul cât să greșești butonul. */
const PRAG = 0.08;

const PAGINI = ["/", "/casa-teona", "/redirectioneaza-3-5", "/proiecte"];
const LATIMI = [390, 1280];

const b = await browser();
let rele = 0;

for (const cale of PAGINI) {
  for (const latime of LATIMI) {
    const ctx = await b.newContext({ viewport: { width: latime, height: 900 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await page.addInitScript(() => {
      window.__cls = 0;
      window.__vinovati = [];
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          for (const s of e.sources ?? []) {
            const n = s.node;
            if (n) window.__vinovati.push(n.tagName ?? n.nodeName);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto(BAZA_PROD + cale, { waitUntil: "load" });
    // Destul cât să pornească JavaScriptul, să se schimbe fonturile și să
    // intre pozele de sus: după asta, ce sare, sare din vina noastră.
    await page.waitForTimeout(4000);

    const { cls, vinovati } = await page.evaluate(() => ({
      cls: window.__cls,
      vinovati: [...new Set(window.__vinovati)].slice(0, 4),
    }));

    const bun = cls <= PRAG;
    if (!bun) rele++;
    console.log(
      `${bun ? "  ok " : "  ✗  "} ${cale} @${latime}: CLS ${cls.toFixed(3)}` +
        (bun ? "" : ` — mută: ${vinovati.join(", ")}`),
    );
    await ctx.close();
  }
}

await b.close();
console.log(`\nverificări picate: ${rele}`);
process.exit(rele ? 1 : 0);
