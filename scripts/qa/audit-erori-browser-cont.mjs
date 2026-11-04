// Contul donatorului în Chromium, cu un cookie de sesiune semnat local, când Stripe nu răspunde.
import { chromium } from "playwright";
import { createHmac } from "node:crypto";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4431";
const SECRET = process.env.SECRET_SESIUNE ?? "secret-de-proba-foarte-lung-pentru-verificare";
const email = "donator@example.com"; const expira = Math.floor(Date.now() / 1000) + 3600;
const semn = createHmac("sha256", SECRET).update(`cont:${email}:${expira}`).digest("hex");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext();
await ctx.addCookies([{ name: "teona_cont", value: encodeURIComponent(`${email}|${expira}|${semn}`), url: BAZA }]);
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(`${BAZA}/contul-meu`, { waitUntil: "networkidle", timeout: 300000 });
console.log(`/contul-meu în ${Date.now() - t0} ms; main: ${(await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 900)}`);
await browser.close();
