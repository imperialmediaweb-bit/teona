import { browser, BAZA, urmaresteErori } from "./comun.mjs";

/**
 * Formularele fiscale: 20% pentru firme și 3,5% pentru persoane fizice.
 *
 * Ce verifică:
 * - fiecare câmp obligatoriu își produce mesajul, în română, lângă el;
 * - mesajul e scris în persoana potrivită („dumneavoastră” la firme, „tu” la
 *   persoane) — o greșeală care nu dă eroare de compilare, dar se vede;
 * - CUI-ul acceptă formele reale (cu „RO”, fără, cu spațiu) și respinge
 *   restul;
 * - formularul trimite ce trebuie la `/api/formulare` și nu ascunde un refuz
 *   al serverului în spatele unui mesaj de reușită.
 */

const b = await browser();
const log = (...a) => console.log(...a);
const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const erori = urmaresteErori(page);
let rele = 0;

function verifica(eticheta, conditie, detaliu = "") {
  log(`${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`);
  if (!conditie) rele++;
}

async function deschide(cale, ancora) {
  await page.goto(BAZA + cale, { waitUntil: "networkidle" });
  // Bannerul de cookie-uri acoperă butonul de trimitere la 1280×1000.
  await page.click('button:has-text("Acceptă toate")').catch(() => {});
  await page.locator(ancora).scrollIntoViewIfNeeded();
}

/**
 * Formele de politețe, ca să se poată verifica registrul mesajelor.
 *
 * `\b` nu e de ajuns: în JavaScript, fără steagul `u`, „ț" nu e caracter de
 * cuvânt, deci `/\bScrie\b/` se potrivește și în interiorul lui „Scrieți" —
 * iar verificarea ar pica pe un text corect. De aceea `(?!\p{L})`, cu `u`.
 */
const INFORMAL = /\b(Scrie|Bifează|Introdu)(?!\p{L})/u;
const FORMAL = /\b(Scrieți|Bifați|Introduceți)(?!\p{L})/u;

/** Mesajele de eroare vizibile din formular, în ordinea din pagină. */
async function mesaje(form) {
  return (await form.locator("p.text-caramiziu-700:visible").allInnerTexts())
    .map((t) => t.replace(/\s+/g, " ").replace(/^!\s*/, "").trim())
    .filter(Boolean);
}

// ─── 20% — firme ──────────────────────────────────────────────────────────
log("\n=== /directioneaza-20 — cererea firmei ===");
await deschide("/directioneaza-20", "#cerere");
const firme = page.locator("#cerere form");

await firme.locator('button[type="submit"]').click();
await page.waitForTimeout(250);
let m = await mesaje(firme);
log("  mesaje:", JSON.stringify(m));
verifica("formularul gol nu trece", m.length >= 4, `${m.length} mesaje`);
verifica(
  "vorbește cu „dumneavoastră”",
  m.every((t) => !INFORMAL.test(t)),
  JSON.stringify(m.filter((t) => INFORMAL.test(t))),
);

for (const [cui, valid] of [
  ["RO12345678", true],
  ["12345678", true],
  ["RO 12345678", true],
  ["ro12345678", true],
  ["abc", false],
  ["RO", false],
  ["1", false],
]) {
  await firme.locator('input[name="cui"]').fill(cui);
  await firme.locator('button[type="submit"]').click();
  await page.waitForTimeout(150);
  const are = (await mesaje(firme)).some((t) => /CUI/i.test(t));
  verifica(`CUI „${cui}” ${valid ? "acceptat" : "respins"}`, are !== valid);
}

// Completat corect: trebuie să ajungă la server, nu să se oprească în browser.
let cerut = null;
page.on("request", (r) => {
  if (r.url().endsWith("/api/formulare") && r.method() === "POST") {
    cerut = JSON.parse(r.postData() ?? "{}");
  }
});

await firme.locator('input[name="firma"]').fill("Lemnul Bun SRL");
await firme.locator('input[name="cui"]').fill("RO12345678");
await firme.locator('input[name="persoana"]').fill("Andrei Munteanu");
await firme.locator('input[name="email"]').fill("andrei@example.com");
await firme.locator('input[name="telefon"]').fill("0744 000 000");
await firme.locator('label:has-text("Declarația 177") input').check();
await firme.locator('input[name="acord"]').check();
await firme.locator('button[type="submit"]').click();
await page.waitForTimeout(1200);

log("  trimis:", JSON.stringify(cerut));
verifica("cererea pleacă la server", cerut !== null);
verifica("poartă fel=sponsorizare", cerut?.fel === "sponsorizare");
verifica("poartă CUI-ul și calea", cerut?.cui === "RO12345678" && Boolean(cerut?.cale));
verifica("acordul e trimis ca boolean", cerut?.acord === true);

const reusit = await page.locator('#cerere [role="status"]').count();
const refuzat = await page.locator('#cerere [role="alert"]').count();
log(`  după trimitere: status=${reusit} alert=${refuzat}`);
/*
  Ce se așteaptă aici depinde de baza de date, și e bine că depinde:

  - **cu** baza pornită, cererea e salvată în CRM chiar dacă Resend lipsește,
    deci nu e pierdută și omul vede o confirmare cinstită („v-am înregistrat
    cererea", nu „v-am trimis pașii");
  - **fără** baza, nimic nu se salvează nicăieri, deci trebuie să vadă
    refuzul. O confirmare acolo ar fi o minciună.

  Exact unul dintre cele două trebuie să apară — niciodată amândouă, și
  niciodată niciunul.
*/
verifica(
  "arată ori confirmarea, ori refuzul — nu amândouă",
  reusit + refuzat === 1,
  `status=${reusit} alert=${refuzat}`,
);

// ─── 3,5% — persoane fizice ───────────────────────────────────────────────
log("\n=== /redirectioneaza-3-5 — pașii pe e-mail ===");
cerut = null;
await deschide("/redirectioneaza-3-5", "#pasi-pe-email");
const om = page.locator("#pasi-pe-email form");

await om.locator('button[type="submit"]').click();
await page.waitForTimeout(250);
m = await mesaje(om);
log("  mesaje:", JSON.stringify(m));
verifica("formularul gol nu trece", m.length >= 3, `${m.length} mesaje`);
verifica(
  "vorbește cu „tu”",
  m.every((t) => !FORMAL.test(t)),
  JSON.stringify(m.filter((t) => FORMAL.test(t))),
);

await om.locator('input[name="nume"]').fill("Ana Pop");
await om.locator('input[name="email"]').fill("ana@example.com");
await om.locator('input[name="acord"]').check();
await om.locator('button[type="submit"]').click();
await page.waitForTimeout(1200);

log("  trimis:", JSON.stringify(cerut));
verifica("cererea pleacă la server", cerut !== null);
verifica("poartă fel=redirectionare", cerut?.fel === "redirectionare");
verifica("nu trimite CNP sau alte date fiscale", !/cnp/i.test(JSON.stringify(cerut ?? {})));
verifica(
  "preferința e una dintre cele oferite",
  ["Completez online", "Vreau formularul pe hârtie"].includes(cerut?.preferinta),
);

log("\nErori consolă/rețea (503 pe /api/formulare e normal fără RESEND_API_KEY):");
log(JSON.stringify(erori, null, 1));

log(`\nverificări picate: ${rele}`);
await b.close();
process.exit(rele === 0 ? 0 : 1);
