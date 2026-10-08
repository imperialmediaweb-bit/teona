import { browser, BAZA, urmaresteErori } from "./comun.mjs";

const b = await browser();
const log = (...a) => console.log(...a);

// 1. Căile spre /doneaza de pe prima pagină
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  // Fără acord, bannerul de cookie-uri acoperă subsolul: verific întâi asta.
  const acoperit = await page.evaluate(() => {
    const a = document.querySelector('footer a[href="/doneaza"]');
    a.scrollIntoView({ block: "center" });
    const r = a.getBoundingClientRect();
    const sus = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { linkSubBanner: !a.contains(sus), ceEDeasupra: sus?.closest("[role=dialog]") ? "bannerul de cookie-uri" : sus?.tagName };
  });
  log("Linkul Donează din subsol, cu bannerul de cookie-uri deschis (1440×900):", JSON.stringify(acoperit));
  await page.click("text=Refuz");
  await page.waitForTimeout(300);
  const cai = await page.$$eval('a[href^="/doneaza"]', (as) =>
    as.map((a) => ({
      href: a.getAttribute("href"),
      text: (a.innerText || a.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60),
      vizibil: !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length),
    })),
  );
  log("Linkuri spre /doneaza pe prima pagină (1440px):");
  for (const c of cai) log("  ", JSON.stringify(c));

  // Clic pe butonul din antet
  await page.click('header a[aria-label="Donează"]');
  await page.waitForURL("**/doneaza");
  log("Antet → Donează: ", page.url());
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  // Cardul 1
  await page.click('main a:has-text("Donează acum") >> nth=1');
  await page.waitForURL("**/doneaza");
  log("Cardul 1 → Donează: ", page.url());
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  // Erou
  await page.click('main a:has-text("Donează acum") >> nth=0');
  await page.waitForURL("**/doneaza");
  log("Erou → Donează: ", page.url());
  // Card SMS -> /doneaza#sms
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  await page.click('a[href="/doneaza#sms"]');
  await page.waitForURL("**/doneaza#sms");
  await page.waitForTimeout(800);
  const smsVizibil = await page.evaluate(() => {
    const el = document.getElementById("sms");
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), inEcran: r.top >= 0 && r.top < window.innerHeight };
  });
  log("Card SMS → /doneaza#sms, secțiunea #sms: ", JSON.stringify(smsVizibil));
  // Subsol
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  await page.click('footer a[href="/doneaza"]');
  await page.waitForURL("**/doneaza");
  log("Subsol → Donează: ", page.url());
  await ctx.close();
}

// 1b. Meniul de telefon → Donează, și butonul plutitor
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BAZA + "/", { waitUntil: "networkidle" });
  const plutitor = await page.$('div.fixed a[href="/doneaza"]');
  log("Buton plutitor Donează pe 390px (fără acord cookie):", plutitor ? await plutitor.isVisible() : "lipsă");
  await page.click("text=Acceptă toate");
  await page.waitForTimeout(300);
  const plutitor2 = await page.$('div.fixed a[href="/doneaza"]');
  log("Buton plutitor Donează după acord:", plutitor2 ? await plutitor2.isVisible() : "lipsă");
  await page.click('button[aria-controls="meniu-ecran-mic"]');
  await page.waitForTimeout(400);
  await page.click('#meniu-ecran-mic a[href="/doneaza"]');
  await page.waitForURL("**/doneaza");
  log("Meniu telefon → Donează: ", page.url());
  const plutitor3 = await page.$('div.fixed a[href="/doneaza"]');
  log("Buton plutitor pe /doneaza (trebuie ascuns):", plutitor3 ? "PREZENT" : "ascuns");
  await ctx.close();
}

// 2. Formularul de donație
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })));
const page = await ctx.newPage();
const erori = urmaresteErori(page);
await page.goto(BAZA + "/doneaza", { waitUntil: "networkidle" });
const form = page.locator("form").filter({ hasText: "Donează cu cardul" });
const alta = form.locator('input[name="alta"]');
const email = form.locator('input[name="email"]');
const acord = form.locator('input[name="acord"]');
const submit = form.locator('button[type="submit"]');

async function stare(eticheta) {
  const txtSubmit = (await submit.innerText()).trim();
  const mesaje = await form.locator("p.text-caramiziu-700").allInnerTexts();
  const inv = await form.locator('[aria-invalid="true"]').evaluateAll((els) =>
    els.map((e) => e.name || e.id),
  );
  log(`\n[${eticheta}] buton="${txtSubmit}" erori=${JSON.stringify(mesaje)} aria-invalid=${JSON.stringify(inv)}`);
}

log("\n=== Formularul de donație ===");
log("Valori implicite: lunar=", await form.locator('button[aria-pressed="true"]:has-text("Lunar")').count(),
  " destinație=", await form.locator('input[name="destinatie"]:checked').inputValue(),
  " newsletter bifat=", await form.locator('input[name="buletin"]').isChecked(),
  " acord bifat=", await acord.isChecked());

// Gol
await submit.click();
await stare("gol, trimis");
// Unde stă eroarea de sumă? (în raport cu câmpul)
const pozitii = await page.evaluate(() => {
  const f = [...document.querySelectorAll("form")].find((f) => f.innerText.includes("Donează cu cardul"));
  const alta = f.querySelector('input[name="alta"]');
  const er = [...f.querySelectorAll("p")].find((p) => p.innerText.includes("Alege sau scrie suma"));
  const email = f.querySelector('input[name="email"]');
  const erE = [...f.querySelectorAll("p")].find((p) => p.innerText.includes("adresă de e-mail"));
  const ac = f.querySelector('input[name="acord"]');
  const erA = [...f.querySelectorAll("p")].find((p) => p.innerText.includes("Bifează acordul"));
  const d = (a, b) => Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
  return {
    sumaEroareSubCamp: er ? d(alta, er) : null,
    emailEroareSubCamp: erE ? d(email, erE) : null,
    acordEroareSubBifa: erA ? d(ac, erA) : null,
    acordDescribedBy: ac.getAttribute("aria-describedby"),
    acordInvalid: ac.getAttribute("aria-invalid"),
    emailDescribedBy: email.getAttribute("aria-describedby"),
    emailDescribedExists: email.getAttribute("aria-describedby") ? !!document.getElementById(email.getAttribute("aria-describedby")) : null,
    altaDescribedBy: alta.getAttribute("aria-describedby"),
    altaDescribedExists: alta.getAttribute("aria-describedby") ? !!document.getElementById(alta.getAttribute("aria-describedby")) : null,
  };
});
log("Poziția mesajelor (px sub câmp):", JSON.stringify(pozitii));

// Sume predefinite
for (const s of ["20", "50", "100"]) {
  await form.locator(`button[aria-pressed]:has-text("${s}")`).first().click();
  log(`Apăsat ${s}: buton="${(await submit.innerText()).trim()}" altă sumă="${await alta.inputValue()}"`);
}
// O dată
await form.locator('button:has-text("O dată")').click();
log(`O dată: buton="${(await submit.innerText()).trim()}"`);
await form.locator('button:has-text("Lunar")').click();

const cazuri = [
  ["", "gol"], ["0", "zero"], ["-5", "negativ"], ["abc", "text"], ["12,50", "virgulă"],
  ["12.50", "punct"], ["1e3", "notație științifică"], ["0x10", "hex"], [" 25 ", "spații"],
  ["1.000", "mii cu punct"], ["Infinity", "Infinity"], ["5 lei", "cu „lei”"], ["999999999", "foarte mare"], ["0,001", "sub un ban"],
];
for (const [v, nume] of cazuri) {
  await alta.fill(v);
  await submit.click();
  await stare(`altă sumă = "${v}" (${nume})`);
}

// Predefinit + altă sumă
await form.locator('button[aria-pressed]:has-text("50")').first().click();
await alta.fill("7");
log(`\nDupă 50 apoi „7”: buton="${(await submit.innerText()).trim()}" 50 apăsat=`, await form.locator('button[aria-pressed="true"]:has-text("50")').count());

// Email greșit
await alta.fill("30");
for (const e of ["", "abc", "abc@", "abc@x", "a b@x.ro", "ok@teona.ro"]) {
  await email.fill(e);
  await submit.click();
  await stare(`email="${e}"`);
}
// Acord
await acord.check();
await submit.click();
await page.waitForTimeout(300);
log("\n[acord bifat, totul valid] formular încă în pagină:", await form.count());
const dupa = await page.locator('[role="status"]').first().innerText().catch(() => "(nimic)");
log("După trimitere validă:", dupa.replace(/\s+/g, " ").slice(0, 300));
// Linkurile din mesajul de după
const linkuri = await page.$$eval('[role="status"] a', (as) => as.map((a) => [a.getAttribute("href"), a.innerText.trim().split("\n")[0]]));
log("Linkuri după trimitere:", JSON.stringify(linkuri));
// „Donează lunar prin SMS” → #sms
await page.click('[role="status"] a[href="#sms"]');
await page.waitForTimeout(600);
log("După clic pe SMS: url=", page.url(), " formularul reapare=", await form.count());
// Starea formularului după revenire
log("Formular după revenire: altă sumă=", await form.locator('input[name="alta"]').inputValue().catch(() => "n/a"),
  " email=", await form.locator('input[name="email"]').inputValue().catch(() => "n/a"));

log("\nErori consolă/rețea pe /doneaza:", JSON.stringify([...new Set(erori)]));
await b.close();
