/**
 * Oprirea donației lunare din linkul trimis pe e-mail.
 *
 * E singurul loc din site unde o adresă deschisă dintr-un e-mail schimbă
 * ceva la banii cuiva, deci se verifică de la capăt la capăt:
 *
 *   1. **linkul nu oprește nimic la deschidere.** Scanerele de e-mail ale
 *      firmelor deschid din reflex toate adresele dintr-un mesaj. Dacă
 *      oprirea s-ar face pe GET, donațiile s-ar opri singure, înainte ca
 *      omul să citească mesajul. Ruta trebuie să refuze GET;
 *   2. **semnătura ține.** Un link cu semnătura schimbată, cu alt abonament
 *      pus în locul celui semnat, sau expirat, nu deschide butonul;
 *   3. **mesajul chiar poartă linkul**, altfel tot mecanismul e degeaba.
 *
 * Rulare, pe un server pornit cu `SECRET_SESIUNE` și `PAROLA_ADMIN` (nu cere
 * Stripe: se verifică linkul și pagina, nu oprirea însăși):
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… SECRET_SESIUNE=… \
 *       node scripts/qa/oprire-lunara.mjs
 */
import { createHmac } from "node:crypto";

const BAZA = process.env.BAZA ?? "http://localhost:3000";
const CHEIE = process.env.SECRET_SESIUNE;

if (!CHEIE || CHEIE.length < 16) {
  console.log("SĂRIT: lipsește SECRET_SESIUNE de cel puțin 32 de semne.");
  process.exit(0);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const semn = (abonament, expira) =>
  createHmac("sha256", CHEIE).update(`oprire:${abonament}:${expira}`).digest("hex");

function link(abonament, expira) {
  const c = new URLSearchParams({ a: abonament, p: String(expira), s: semn(abonament, expira) });
  return `${BAZA}/opreste-donatia?${c}`;
}

const PESTE_O_ZI = Date.now() + 24 * 3600 * 1000;
const ACUM_O_ZI = Date.now() - 24 * 3600 * 1000;
const BUN = "sub_deproba123";

const deschide = async (adresa) => (await fetch(adresa)).text();
const areButon = (html) => html.includes("Da, oprește donația lunară");

// ─── 1. Linkul nu oprește nimic prin simpla deschidere ────────────────────
const get = await fetch(`${BAZA}/api/cont/opreste`);
verifica(
  get.status === 405 || get.status === 404,
  `ruta de oprire refuză GET (${get.status}) — altfel ar opri-o scanerul de e-mail`,
);

// ─── 2. Semnătura ține ────────────────────────────────────────────────────
verifica(
  areButon(await deschide(link(BUN, PESTE_O_ZI))),
  "un link bun duce la pagina cu butonul",
);
verifica(
  !areButon(await deschide(link(BUN, PESTE_O_ZI) + "X")),
  "o semnătură schimbată e refuzată",
);
verifica(
  !areButon(
    await deschide(link(BUN, PESTE_O_ZI).replace(BUN, "sub_altcineva999")),
  ),
  "alt abonament pus în locul celui semnat e refuzat",
);
verifica(
  !areButon(await deschide(link(BUN, ACUM_O_ZI))),
  "un link expirat e refuzat",
);
verifica(
  !areButon(await deschide(`${BAZA}/opreste-donatia`)),
  "fără niciun parametru nu apare butonul",
);

// ─── 3. Un POST cu semnătură stricată nu oprește nimic ────────────────────
const post = await fetch(`${BAZA}/api/cont/opreste`, {
  method: "POST",
  redirect: "manual",
  body: new URLSearchParams({ a: BUN, p: String(PESTE_O_ZI), s: "nu-e-semnatura" }),
});
const unde = post.headers.get("location") ?? "";
verifica(
  post.status === 303 && !unde.includes("/oprit"),
  `un POST cu semnătură stricată nu ajunge la „s-a oprit" (${post.status} → ${unde || "—"})`,
);

// ─── 4. Mesajul poartă linkul ─────────────────────────────────────────────
if (process.env.PAROLA_ADMIN) {
  // Cookie-ul parolei asociației: `k:<expiră>:<semnătură>` (lib/admin.ts).
  const expiraK = Math.floor(Date.now() / 1000) + 3600;
  const cookie = `k:${expiraK}:${createHmac("sha256", process.env.PAROLA_ADMIN)
    .update(`cheie:${expiraK}`)
    .digest("hex")}`;
  const mesaj = await fetch(
    `${BAZA}/api/admin/email?ce=inainte-de-reinnoire`,
    { headers: { cookie: `teona_verificare=${cookie}` } },
  );
  const html = await mesaj.text();
  verifica(
    mesaj.ok && /href="[^"]*\/opreste-donatia\?a=sub_[^"]*s=[0-9a-f]{64}"/.test(html),
    "vestea de dinaintea reînnoirii poartă linkul de oprire, semnat",
  );
  verifica(
    html.includes("nu trebuie să faci nimic"),
    "mesajul spune limpede că cine rămâne n-are nimic de făcut",
  );
}

console.log(rele === 0 ? "\nToate probele trec." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
