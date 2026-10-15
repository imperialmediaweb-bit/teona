/**
 * „Am făcut transferul” — bifa donatorului, verificată de la capăt la capăt.
 *
 * Transferul bancar nu trece prin site, deci anunțul e tot ce are site-ul.
 * Două lucruri trebuie să fie adevărate și să rămână adevărate:
 *
 *   1. **se vede unde trebuie** — pe /doneaza, cardul de plată arată toate
 *      căile (card, PayPal, transfer), iar cardul cu IBAN-uri are formularul
 *      de anunț. Rândul ăsta a lipsit cu totul: transferul exista pe pagină,
 *      dar nimeni nu-l găsea de lângă formularul de card;
 *   2. **nu crede pe nimeni pe cuvânt** — ruta publică verifică bifa, suma,
 *      data și numele pe server. Ce vine dintr-un formular public poate fi
 *      scris de mână, iar de aici intră cifre în raportul anual.
 *
 * Rulare, pe un server pornit (nu cere bază de date și nici parolă):
 *     BAZA=http://localhost:3000 node scripts/qa/transfer-anuntat.mjs
 *
 * Fără bază de date, anunțul valid răspunde 503 cu numărul de telefon al
 * asociației — și asta e un răspuns bun: proba acceptă 200 sau 503, dar nu
 * 400 și nu 500.
 *
 * Ruta are o limită de 8 cereri la 30 de minute de la aceeași adresă, iar
 * proba trimite 5. A doua rulare la rând, de pe același IP, va lua 429 — nu e
 * o cădere a site-ului, ci limita care funcționează.
 */

const BAZA = process.env.BAZA ?? "http://localhost:3000";

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

function ziua(peste = 0) {
  const d = new Date(Date.now() + peste * 24 * 3600 * 1000);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

async function anunta(date) {
  const r = await fetch(`${BAZA}/api/donatii/transfer`, {
    method: "POST",
    body: new URLSearchParams(date),
  });
  const corp = await r.json().catch(() => ({}));
  return { stare: r.status, mesaj: corp.mesaj ?? "" };
}

// ─── 1. Pagina arată toate căile ──────────────────────────────────────────
const pagina = await fetch(`${BAZA}/doneaza`);
const html = await pagina.text();
verifica(pagina.ok, `/doneaza răspunde (${pagina.status})`);
verifica(
  html.includes('href="#transfer"'),
  "din formularul de card se poate sări la transfer bancar",
);
verifica(
  html.includes('id="transfer"'),
  "blocul de transfer bancar e pe pagină",
);
verifica(
  html.includes("Am făcut transferul"),
  "cardul cu IBAN-uri are formularul de anunț",
);

// ─── 2. Serverul nu crede pe nimeni pe cuvânt ─────────────────────────────
const bun = {
  nume: "Probă Transfer",
  suma: "150",
  data: ziua(0),
  destinatie: "tabere",
  confirm: "da",
};

const faraBifa = await anunta({ ...bun, confirm: "" });
verifica(
  faraBifa.stare === 400 && /bifează/i.test(faraBifa.mesaj),
  `fără bifă nu intră nimic (${faraBifa.stare})`,
);

const faraNume = await anunta({ ...bun, nume: "" });
verifica(faraNume.stare === 400, `fără nume nu intră nimic (${faraNume.stare})`);

const inViitor = await anunta({ ...bun, data: ziua(3) });
verifica(
  inViitor.stare === 400 && /viitor/i.test(inViitor.mesaj),
  `un transfer „făcut" săptămâna viitoare e refuzat (${inViitor.stare})`,
);

/*
  „12,500.50" e scris la englezește. Citit ca în română ar da 12,50 lei în loc
  de 12.500,50 — de o mie de ori mai puțin, fără niciun semn. Se refuză, nu se
  ghicește.
*/
const sumaStrambă = await anunta({ ...bun, suma: "12,500.50" });
verifica(
  sumaStrambă.stare === 400,
  `suma scrisă la englezește e refuzată, nu ghicită (${sumaStrambă.stare})`,
);

const valid = await anunta(bun);
verifica(
  valid.stare === 200 || valid.stare === 503,
  `un anunț corect e primit, sau trimis la telefon dacă baza lipsește (${valid.stare})`,
);

// ─── 3. Confirmarea stă în panou, nu pe internet ──────────────────────────
const confirmare = await fetch(`${BAZA}/api/admin/donatii/confirma`, {
  method: "POST",
  redirect: "manual",
  body: new URLSearchParams({
    id: "00000000-0000-0000-0000-000000000000",
    hotarare: "confirma",
  }),
});
verifica(
  confirmare.status === 403,
  `nimeni din afara panoului nu poate confirma un transfer (${confirmare.status})`,
);

console.log(rele === 0 ? "\nToate probele trec." : `\n${rele} probe cad.`);
process.exit(rele === 0 ? 0 : 1);
