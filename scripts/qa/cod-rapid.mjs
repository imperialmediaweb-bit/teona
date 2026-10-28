/*
  Proba aplicației de panou, a lui „Ține-mă minte” și a codului rapid.

    BAZA=… PAROLA_ADMIN=… node scripts/qa/cod-rapid.mjs

  Își face singură un cont de probă (cu parola asociației), îl folosește și îl
  oprește la sfârșit. Fiecare încercare de intrare pleacă din alt „loc”
  (x-forwarded-for), altfel limita de 5 la 15 minute a rutei de intrare ar
  opri proba înainte de a cincea greșeală — limita aia e corectă, nu o cădere.
*/
import { browser, BAZA } from "./comun.mjs";

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) throw new Error("Lipsește PAROLA_ADMIN.");
const EMAIL = `cod-rapid-${Date.now()}@exemplu.ro`;
const PAROLA_CONT = "parola-de-proba-cod-rapid";
const COD = "2468";

let picate = 0;
const v = (n, c, x = "") => {
  if (!c) picate++;
  console.log(`${c ? "ok " : "✗  "} ${n}${x ? " — " + x : ""}`);
};
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.7`;

const b = await browser();
const context = (cookies = []) =>
  b.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip() } }).then(async (c) => {
    if (cookies.length) await c.addCookies(cookies);
    return c;
  });

// Contul de probă, făcut cu parola asociației.
const admin = await context();
const pa = await admin.newPage();
await pa.goto(BAZA + "/admin");
await pa.fill('input[name="parola"]', PAROLA);
await Promise.all([pa.waitForURL(/\/admin(\?|$)/), pa.click('button:has-text("Intră")')]);
const facut = await pa.request.post(BAZA + "/api/admin/utilizatori", {
  form: { fel: "adauga", email: EMAIL, nume: "Probă cod rapid", rol: "fundraising", parola: PAROLA_CONT },
  maxRedirects: 0,
});
v("contul de probă se face", /stare=facut/.test(facut.headers().location ?? ""), facut.headers().location);

// 1. Intrare cu „Ține-mă minte”.
const c1 = await context();
const p = await c1.newPage();
await p.goto(BAZA + "/admin");
v("„Ține-mă minte” e bifat din start", await p.locator('input[name="tine_minte"]').isChecked());
await p.fill("#email", EMAIL);
await p.fill('input[name="parola"]', PAROLA_CONT);
await Promise.all([p.waitForURL(/\/admin$/), p.click('button:has-text("Intră")')]);
const zile = (c) => Math.round((c.expires * 1000 - Date.now()) / 86_400_000);
let ck = await c1.cookies();
const ses = ck.find((c) => c.name === "teona_verificare");
const disp = ck.find((c) => c.name === "teona_dispozitiv");
v("sesiunea ține 30 de zile", ses && zile(ses) === 30, ses && `${zile(ses)} zile`);
v("dispozitivul e ținut minte 90 de zile", disp && zile(disp) === 90, disp && `${zile(disp)} zile`);

// Aplicația.
const man = await p.request.get(BAZA + "/admin/manifest.webmanifest");
const m = await man.json().catch(() => ({}));
v("manifestul e al panoului", m.scope === "/admin/" && m.start_url === "/admin", `${m.scope} ${m.start_url}`);
await p.waitForTimeout(1500);
v(
  "lucrătorul se înregistrează pe /admin/",
  await p.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration("/admin/");
    return Boolean(r && r.scope.endsWith("/admin/"));
  }),
);

// 2. Codul rapid.
await p.goto(BAZA + "/admin/parola");
const fc = p.locator('form[action="/api/admin/cod-rapid"]').first();
await fc.locator('input[name="cod"]').fill(COD);
await fc.locator('input[name="iar"]').fill(COD);
await fc.locator('input[name="parola"]').fill(PAROLA_CONT);
await Promise.all([p.waitForURL(/stare=/), fc.locator('button[value="pune"]').click()]);
v("codul se pune", /stare=cod-pus/.test(p.url()), p.url());

// 3. Sesiunea expiră: pagina cere codul, nu parola.
ck = (await c1.cookies()).filter((c) => c.name === "teona_dispozitiv");
const cuCod = async (cod, unde = "/admin/donatii") => {
  const c = await context(ck);
  const pg = await c.newPage();
  await pg.goto(BAZA + unde);
  await pg.waitForTimeout(800);
  const areCamp = (await pg.locator('input[name="cod"]').count()) === 1;
  if (!areCamp) return { areCamp, pg, c };
  await pg.fill('input[name="cod"]', cod);
  await Promise.all([pg.waitForURL(/./), pg.locator('form:has(input[name="cod"]) button').click()]);
  await pg.waitForTimeout(800);
  return { areCamp, pg, c };
};
let r = await cuCod("1111");
v("fără sesiune, pe dispozitivul ținut minte se cere codul", r.areCamp);
v("codul greșit spune asta", await r.pg.getByText("Codul nu se potrivește").last().isVisible());
r = await cuCod(COD);
v("codul bun deschide pagina cerută", /\/admin\/donatii$/.test(r.pg.url()), r.pg.url());

// 4. Cinci greșeli la rând închid codul (una făcută mai sus, deci încă cinci după reset).
for (let i = 0; i < 5; i++) await cuCod("9999", "/admin");
r = await cuCod("9999", "/admin");
v("după cinci greșeli se cere parola", !r.areCamp && (await r.pg.locator("#email").last().isVisible()));

// 5. Parola asociației rămâne la 12 ore, fără dispozitiv.
const ka = (await admin.cookies()).find((c) => c.name === "teona_verificare");
v(
  "parola asociației: 12 ore, fără dispozitiv",
  ka && Math.round((ka.expires * 1000 - Date.now()) / 3_600_000) === 12 &&
    !(await admin.cookies()).some((c) => c.name === "teona_dispozitiv"),
);

// Curățenie: contul de probă se oprește (conturile nu se șterg).
const lista = await (await pa.request.get(BAZA + "/admin/utilizatori")).text();
const id = lista.match(new RegExp(`${EMAIL}[\\s\\S]{0,4000}?name="id" value="([0-9a-f-]{36})"`))?.[1];
if (id) await pa.request.post(BAZA + "/api/admin/utilizatori", { form: { fel: "opreste", id }, maxRedirects: 0 });

await b.close();
console.log(picate ? `\nPicate: ${picate}` : "\nTot bine.");
process.exit(picate ? 1 : 0);
