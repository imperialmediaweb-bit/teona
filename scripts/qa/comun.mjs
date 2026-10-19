import { chromium } from "playwright";
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";
export const BAZA = process.env.BAZA ?? "http://localhost:3000";
/*
  `CHROMIUM` spune unde e browserul, dacă nu e cel pe care l-ar descărca
  Playwright.

  Pe un container care vine cu Chromium pus deja — cum e cel în care rulează
  sesiunile din cloud — versiunea de pe disc nu e neapărat cea pe care o cere
  `playwright` din `package.json`, iar atunci lansarea cade cu „Executable
  doesn't exist", sfătuindu-te să descarci unul. Descărcarea n-are cum să
  reușească acolo. Un singur drum de ieșire, dat din afară:

      CHROMIUM=/opt/pw-browsers/chromium node scripts/qa/crm.mjs

  Fără variabilă nu se schimbă nimic: pe calculatorul cuiva, Playwright își
  găsește singur browserul.
*/
export async function browser(opts = {}) {
  const executabil = process.env.CHROMIUM;
  return chromium.launch({
    headless: true,
    ...(executabil ? { executablePath: executabil } : {}),
    ...opts,
  });
}
export function urmaresteErori(page) {
  const erori = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      erori.push(`[consola ${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => erori.push(`[pageerror] ${e.message.slice(0, 300)}`));
  page.on("requestfailed", (r) =>
    erori.push(`[request failed] ${r.url()} ${r.failure()?.errorText}`),
  );
  page.on("response", (r) => {
    if (r.status() >= 400) erori.push(`[http ${r.status()}] ${r.url()}`);
  });
  return erori;
}
