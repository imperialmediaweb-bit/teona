// Ce vede omul în Chrome când o rută de formular din panou răspunde 500 cu corp gol (baza de date jos).
import { chromium } from "playwright";
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4431";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await (await browser.newContext()).newPage();
await page.goto(`${BAZA}/admin`); await page.fill('input[name="parola"]', PAROLA); await page.click('button[type="submit"]'); await page.waitForLoadState("networkidle");
// Pagina de sponsori: câte sigle arată și ce scrie despre baza de date
await page.goto(`${BAZA}/admin/sponsori`, { waitUntil: "networkidle" });
const t = await page.locator("main").innerText();
console.log(`/admin/sponsori: ${(t.match(/Scoate de pe site/g) ?? []).length} rânduri de siglă cu buton „Scoate de pe site”; text despre bază: ${t.match(/.{0,80}(baz[aă] de date|n-am putut|nu s-au putut|lipse).{0,80}/i)?.[0] ?? "(nimic)"}`);
await page.goto(`${BAZA}/admin/cifre`, { waitUntil: "networkidle" });
const c = await page.locator("main").innerText();
console.log(`/admin/cifre: text despre bază: ${c.match(/.{0,80}(baz[aă] de date|n-am putut|nu s-au putut|lipse).{0,80}/i)?.[0] ?? "(nimic)"}; valori în câmpuri: ${(await page.locator('input[name^="valoare-"]').evaluateAll((i) => i.map((x) => x.value))).join(",")}`);
await page.goto(`${BAZA}/admin/utilizatori`, { waitUntil: "networkidle" });
const u = await page.locator("main").innerText();
console.log(`/admin/utilizatori: ${u.match(/Conturile.{0,80}/)?.[0]}`);
// Formular din panou trimis cu baza jos: ruta răspunde 500 fără corp
await page.goto(`${BAZA}/admin/sponsori`, { waitUntil: "networkidle" });
await page.setContent(`<form method="post" action="${BAZA}/api/admin/jurnal"><input name="email" value="x@example.com"><input name="fel" value="telefon"><input name="rezumat" value="L-am sunat."><input name="inapoi" value="/admin/donatori"><button>Salvează</button></form>`);
const [raspuns] = await Promise.all([page.waitForResponse((r) => r.url().includes("/api/admin/jurnal")), page.click("button")]);
await page.waitForTimeout(800);
console.log(`POST /api/admin/jurnal → ${raspuns.status()}; omul vede: titlu=„${await page.title()}”, text=„${(await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 200)}”, url=${page.url()}`);
await browser.close();
