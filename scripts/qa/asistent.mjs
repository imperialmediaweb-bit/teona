import { browser, BAZA, urmaresteErori } from "./comun.mjs";

/**
 * Asistentul din panoul de admin.
 *
 * Se rulează cu panoul pornit și cu asistentul aprins:
 *
 *   PAROLA_ADMIN=… MAILERLITE_API_KEY=… ANTHROPIC_API_KEY=… npm run dev
 *   PAROLA_ADMIN=… node scripts/qa/asistent.mjs
 *
 * Răspunsul modelului e înlocuit cu unul fix, prin interceptarea cererii: ne
 * interesează ce face panoul cu el, nu ce scrie modelul. Așa testul nu costă
 * bani și nu depinde de o cheie adevărată.
 */

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.log("Lipsește PAROLA_ADMIN din mediu. Nu se poate intra în panou.");
  process.exit(0);
}

const b = await browser();
// Intrarea în panou are o limită strânsă (5 încercări la 15 minute), pe
// adresă. În dezvoltare toate cererile vin de la aceeași adresă, deci o probă
// manuală făcută înainte ar bloca scriptul cu 429 — și ar arăta ca o picătură
// a panoului, nu a limitei. Antetul îi dă scriptului adresa lui.
const ctx = await b.newContext({
  viewport: { width: 1280, height: 1000 },
  extraHTTPHeaders: { "x-forwarded-for": "198.51.100.42" },
});
const page = await ctx.newPage();
const erori = urmaresteErori(page);
let rele = 0;

function verifica(eticheta, conditie, detaliu = "") {
  console.log(`${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`);
  if (!conditie) rele++;
}

// ─── Intrarea în panou ────────────────────────────────────────────────────
await page.goto(BAZA + "/admin/email", { waitUntil: "networkidle" });
await page.fill('input[type="password"]', PAROLA);
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");
verifica("intrarea în panou merge", (await page.locator("#asistent, section:has-text(\"Vrei o primă ciornă\")").count()) > 0);

// ─── Brief prea scurt: nu pleacă nicio cerere ─────────────────────────────
let cereri = 0;
await page.route("**/api/admin/asistent", async (ruta) => {
  cereri++;
  const date = JSON.parse(ruta.request().postData() ?? "{}");
  await ruta.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      titlu: `Titlu pentru ${date.fel}`,
      text: "Primul paragraf.\n\nAl doilea paragraf, cu [câți copii] lăsat în alb.",
    }),
  });
});

const brief = page.locator('section:has-text("Vrei o primă ciornă") textarea');
const butonScrie = page.locator('button:has-text("Scrie ciorna")');

// Sub 10 caractere. „prea scurt" are exact 10 și ar trece — de aceea „scurt".
await brief.fill("scurt");
await butonScrie.click();
await page.waitForTimeout(400);
verifica("brieful prea scurt nu cheltuie o cerere", cereri === 0, `${cereri} cereri`);
verifica(
  "și spune de ce",
  (await page.locator('section:has-text("Vrei o primă ciornă") [role=alert]').count()) === 1,
);

// ─── Brief bun: completează câmpurile formularului ────────────────────────
await brief.fill(
  "Tabăra RESPIRO din septembrie, la Vatra Dornei. Vrem să mulțumim celor care au donat.",
);
await page.selectOption('section:has-text("Vrei o primă ciornă") select', "multumire");
await butonScrie.click();
await page.waitForTimeout(600);

verifica("cererea pleacă o singură dată", cereri === 1, `${cereri} cereri`);
const titlu = await page.inputValue('input[name="titlu"]');
const text = await page.inputValue('textarea[name="text"]');
const subiect = await page.inputValue('input[name="subiect"]');
verifica("titlul e completat", titlu === "Titlu pentru multumire", titlu);
verifica("textul e completat", text.includes("Al doilea paragraf"), text.slice(0, 40));
verifica("subiectul gol se umple cu titlul", subiect === titlu, subiect);
verifica(
  "spune omului să verifice cifrele",
  /verific/i.test(
    (await page.locator('section:has-text("Vrei o primă ciornă") [role=status]').innerText()),
  ),
);

// ─── Subiectul deja scris nu se suprascrie ────────────────────────────────
await page.fill('input[name="subiect"]', "Subiectul meu");
await butonScrie.click();
await page.waitForTimeout(600);
verifica(
  "subiectul scris de om rămâne al lui",
  (await page.inputValue('input[name="subiect"]')) === "Subiectul meu",
);

// ─── Refuzul serverului se vede ───────────────────────────────────────────
await page.unroute("**/api/admin/asistent");
await page.route("**/api/admin/asistent", (ruta) =>
  ruta.fulfill({
    status: 502,
    contentType: "application/json",
    body: JSON.stringify({ mesaj: "Nu am putut scrie ciorna acum." }),
  }),
);
await butonScrie.click();
await page.waitForTimeout(600);
const alerta = await page
  .locator('section:has-text("Vrei o primă ciornă") [role=alert]')
  .allInnerTexts();
verifica("refuzul serverului se arată", alerta.length === 1, JSON.stringify(alerta));

console.log("  erori consolă:", JSON.stringify(erori));
console.log(`\nverificări picate: ${rele}`);
await b.close();
process.exit(rele === 0 ? 0 : 1);
