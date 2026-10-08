import { chromium } from "playwright";
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";
export const BAZA = process.env.BAZA ?? "http://localhost:3000";
export async function browser(opts = {}) {
  return chromium.launch({ headless: true, ...opts });
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
