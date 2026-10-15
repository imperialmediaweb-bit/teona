/**
 * Statisticile se încarcă numai cu acord.
 *
 * Regula din caiet (12.5) e simplă de scris și ușor de stricat fără să se
 * vadă: până când vizitatorul nu bifează „statistici”, niciun script de
 * urmărire n-are voie să plece spre Google. O schimbare în banner, în
 * componentă sau în politica de conținut poate rupe oricare dintre cele două
 * jumătăți — fie se încarcă prea devreme, fie nu se mai încarcă deloc — iar
 * nicio pagină nu arată altfel în cele două cazuri.
 *
 * Proba ascultă cererile de rețea ale browserului, nu codul:
 *
 *   1. intri pe prima pagină, nu atingi bannerul → zero cereri spre Google;
 *   2. apeși „Acceptă toate” → scriptul pleacă, fără reîncărcarea paginii;
 *   3. apeși „Refuz” într-o filă curată → tot zero.
 *
 * Rulare: BAZA=http://localhost:3000 node scripts/qa/analitice.mjs
 */

import { chromium } from "playwright";

const BAZA = process.env.BAZA ?? "http://localhost:3000";

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const GOOGLE = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;

const browser = await chromium.launch();

/** O filă curată, cu lista cererilor spre Google. */
async function fila() {
  const context = await browser.newContext();
  const cereri = [];
  context.on("request", (r) => {
    if (GOOGLE.test(r.url())) cereri.push(r.url());
  });
  const pagina = await context.newPage();
  const greseli = [];
  pagina.on("console", (m) => {
    if (m.type() === "error") greseli.push(m.text());
  });
  await pagina.goto(BAZA, { waitUntil: "networkidle" });
  return { context, pagina, cereri, greseli };
}

// ─── 1. Fără acord, nimic ─────────────────────────────────────────────────
{
  const { context, cereri } = await fila();
  await new Promise((r) => setTimeout(r, 1500));
  verifica(
    cereri.length === 0,
    `înainte de acord nu pleacă nimic spre Google (${cereri.length} cereri)`,
  );
  await context.close();
}

// ─── 2. Cu acord, pleacă — fără reîncărcare ───────────────────────────────
{
  const { context, pagina, cereri, greseli } = await fila();
  await pagina.getByRole("button", { name: /Acceptă toate/i }).click();
  await pagina.waitForTimeout(2500);
  verifica(
    cereri.some((u) => u.includes("googletagmanager.com")),
    `după „Acceptă toate" se încarcă scriptul (${cereri.length} cereri)`,
  );
  /*
    Politica de conținut e cealaltă jumătate: dacă domeniile lipsesc din ea,
    scriptul e cerut și blocat, iar singurul semn e o eroare în consolă.
  */
  const blocate = greseli.filter((t) => /Content Security Policy/i.test(t));
  verifica(
    blocate.length === 0,
    `politica de conținut nu blochează scriptul (${blocate.length} erori)`,
  );
  await context.close();
}

// ─── 3. După „Refuz", tot nimic ───────────────────────────────────────────
{
  const { context, pagina, cereri } = await fila();
  await pagina.getByRole("button", { name: /^Refuz$/i }).click();
  await pagina.waitForTimeout(2000);
  verifica(
    cereri.length === 0,
    `după „Refuz" nu pleacă nimic (${cereri.length} cereri)`,
  );
  await context.close();
}

await browser.close();
console.log(rele === 0 ? "\nToate probele trec." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
