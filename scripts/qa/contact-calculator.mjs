import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const erori = urmaresteErori(page);

log("=== Formularul de contact ===");
await page.goto(BAZA + "/contact", { waitUntil: "networkidle" });
const form = page.locator("form").filter({ hasText: "Trimite-ne un mesaj" });
async function stare(eticheta) {
  const mesaje = await form.locator("p.text-caramiziu-700").allInnerTexts();
  const inv = await form.locator('[aria-invalid="true"]').evaluateAll((els) => els.map((e) => e.name));
  const alert = await form.locator('[role="alert"]').allInnerTexts();
  log(`\n[${eticheta}] erori=${JSON.stringify(mesaje)} invalid=${JSON.stringify(inv)} alert=${JSON.stringify(alert.map((a) => a.replace(/\s+/g, " ")))}`);
}
log("Interes implicit:", await form.locator('input[name="interes"]:checked').inputValue());
await form.locator('button[type="submit"]').click();
await stare("gol");
const describedby = await form.locator('input[name="nume"]').getAttribute("aria-describedby");
log("nume aria-describedby:", describedby, "există:", await page.evaluate((id) => !!document.getElementById(id), describedby));
await form.locator('input[name="nume"]').fill("A");
await form.locator('input[name="email"]').fill("x@y");
await form.locator('textarea[name="mesaj"]').fill("Hei");
await form.locator('button[type="submit"]').click();
await stare("nume 1 literă, email x@y, mesaj 3 litere");
await form.locator('input[name="nume"]').fill("  ");
await form.locator('input[name="email"]').fill("a@b.c");
await form.locator('textarea[name="mesaj"]').fill("     ");
await form.locator('button[type="submit"]').click();
await stare("nume doar spații, mesaj doar spații");
await form.locator('input[name="nume"]').fill("Ana Pop");
await form.locator('input[name="email"]').fill("ana@example.com");
await form.locator('textarea[name="mesaj"]').fill("Bună ziua, vreau să ajut.");
await form.locator('button[type="submit"]').click();
await stare("totul ok, fără acord");
await form.locator('input[name="acord"]').check();
const cereri = [];
page.on("response", async (r) => { if (r.url().includes("/api/contact")) cereri.push([r.status(), (await r.text()).slice(0, 200)]); });
await form.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
log("Răspuns API:", JSON.stringify(cereri));
await stare("totul ok, cu acord → trimis");
log("Buton după:", (await form.locator('button[type="submit"]').innerText()).trim(), " dezactivat:", await form.locator('button[type="submit"]').isDisabled());
log("Valorile rămân? nume=", await form.locator('input[name="nume"]').inputValue(), " mesaj=", await form.locator('textarea[name="mesaj"]').inputValue());
// Mesajul de eroare spune cinstit?
const alertText = await form.locator('[role="alert"]').innerText();
log("Textul alertei complet:", alertText.replace(/\s+/g, " "));

log("\n=== Calculatorul (Direcționează 20%) ===");
await page.goto(BAZA + "/directioneaza-20", { waitUntil: "networkidle" });
const cifra = page.locator('input[name="cifra-de-afaceri"]');
const impozit = page.locator('input[name="impozit-pe-profit"]');
async function rezultat(eticheta) {
  await page.waitForTimeout(150);
  const zona = page.locator('[aria-live="polite"]').filter({ hasText: "Suma maximă" });
  const txt = (await zona.innerText()).replace(/\s+/g, " ");
  const er = await page.locator("form[aria-labelledby] p.text-caramiziu-700").allInnerTexts();
  log(`\n[${eticheta}] erori=${JSON.stringify(er)}\n   ${txt.slice(0, 260)}`);
}
const cazuri = [
  ["", "", "ambele goale"],
  ["1000000", "", "doar cifra"],
  ["1.000.000", "100.000", "20%=20.000 vs 0,75%=7.500 → limita cifra (7.500)"],
  ["1.000.000", "10.000", "20%=2.000 vs 0,75%=7.500 → limita impozit (2.000)"],
  ["100000", "3750", "egale: 750 și 750"],
  ["1250000,50", "120000,25", "zecimale cu virgulă"],
  ["1250000.50", "120000.25", "zecimale cu punct"],
  ["1.250", "100", "1.250 — mie sau zecimal?"],
  ["1.2500", "100", "1.2500 ambiguu"],
  ["-5000", "100", "negativ"],
  ["abc", "100", "text"],
  ["1e6", "100", "notație științifică"],
  ["2 500 000", "120 000", "spații ca separator"],
  ["2.500.000 lei", "120.000 lei", "cu „lei”"],
  ["999999999999999999", "1", "peste limită"],
  ["0", "0", "zero"],
  ["0,004", "0,004", "sub un ban"],
  ["123456789012", "98765432", "mare: 20%=19.753.086,40 vs 0,75%=926.000.667,59"],
];
for (const [c, i, nume] of cazuri) {
  await cifra.fill(c);
  await impozit.fill(i);
  await rezultat(nume);
}

log("\nErori consolă/rețea:", JSON.stringify([...new Set(erori)]));
await b.close();
