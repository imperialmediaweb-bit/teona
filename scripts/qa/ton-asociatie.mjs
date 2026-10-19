/**
 * Felul de a scrie al asociației: ajunge chiar la model?
 *
 * Frazele lor stau în `src/lib/ton-asociatie.ts` și pleacă spre model odată cu
 * instrucțiunile asistentului din panou. Proba nu citește codul — pornește un
 * server care imită API-ul Anthropic, îi dă site-ului adresa lui prin
 * `ANTHROPIC_API`, cere o ciornă și se uită la ce a primit.
 *
 * Ce caută, în ordinea importanței:
 *
 *   1. **niciun șablon `${…}` necompletat.** O bucată scrisă între ghilimele
 *      drepte în loc de accente grave nu se interpolează niciodată și nu dă
 *      nicio eroare — ajunge la model ca text brut. Aceeași greșeală ca
 *      „Sorem ipsum” de pe site-ul vechi, și singurul fel de a o prinde e să
 *      te uiți la ce s-a trimis;
 *   2. **cele două fraze ale asociației, cuvânt cu cuvânt.** Ele sunt tonul.
 *      Dacă se rătăcesc dintr-un prompt, modelul scrie din nou în felul meu,
 *      iar nimeni nu observă până nu citește cineva un buletin informativ;
 *   3. **perechea „așa nu / așa da”** — partea care schimbă purtarea modelului
 *      mai mult decât regulile;
 *   4. **cifrele verificate**, și regula care îi cere să lase un gol în loc
 *      să inventeze.
 *
 * Rulare — nu cere bază de date, nici chei adevărate, nici internet:
 *     PAROLA_ADMIN=… node scripts/qa/ton-asociatie.mjs
 *
 * Pornește singură un al doilea site, pe alt port, cu `npm run start`. Deci
 * cere un `npm run build` făcut înainte.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

/*
  Frazele asociației se citesc din fișierul lor, nu se scriu aici a doua oară.

  Dacă ar fi scrise și în probă, cineva le-ar putea schimba în sursă și proba
  ar trece mai departe verificând un text care nu mai există nicăieri.
*/
const sursaTon = readFileSync("src/lib/ton-asociatie.ts", "utf8");
const frazele = [...sursaTon.matchAll(/^\s*text:\s*"([^"]{40,})",\s*$/gm)].map(
  (m) => m[1],
);
verifica(
  frazele.length === 2,
  `am găsit cele două fraze ale asociației în sursă (${frazele.length})`,
);

const PORT_API = 4321;
const PORT_SITE = 4322;
let primit = "";

const fals = createServer((cer, raspunde) => {
  let corp = "";
  cer.on("data", (b) => (corp += b));
  cer.on("end", () => {
    primit = corp;
    raspunde.writeHead(200, { "content-type": "application/json" });
    raspunde.end(
      JSON.stringify({
        content: [
          {
            type: "text",
            text: '{"titlu": "Titlu de probă", "text": "Un paragraf de probă."}',
          },
        ],
      }),
    );
  });
});
await new Promise((r) => fals.listen(PORT_API, r));

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT_SITE),
    ANTHROPIC_API: `http://127.0.0.1:${PORT_API}`,
    ANTHROPIC_API_KEY: "cheie-de-proba",
  },
  stdio: "ignore",
});

/* O adresă nouă la fiecare rulare: intrarea în panou e limitată pe adresă. */
const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
const SITE = `http://127.0.0.1:${PORT_SITE}`;

try {
  const pornit = Date.now();
  let viu = false;
  while (Date.now() - pornit < 90000) {
    try {
      const r = await fetch(`${SITE}/admin`);
      if (r.ok) {
        viu = true;
        break;
      }
    } catch {
      /* încă nu ascultă */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  verifica(viu, "al doilea site a pornit");

  let cookie = "";
  const intra = await fetch(`${SITE}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": DE_LA,
    },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/scrie" }),
  });
  for (const c of intra.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  verifica(intra.status === 303, `intrarea în panou (${intra.status})`);

  const ciorna = await fetch(`${SITE}/api/admin/asistent`, {
    method: "POST",
    redirect: "manual",
    headers: {
      cookie,
      "content-type": "application/json",
      "x-forwarded-for": DE_LA,
    },
    body: JSON.stringify({
      fel: "anunt",
      despre:
        "Casa Teona e deschisă și în vacanța de iarnă, pentru atelierele de creație.",
    }),
  });
  verifica(ciorna.status === 200, `ciorna se cere (${ciorna.status})`);
  verifica(primit.length > 0, "serverul fals a primit cererea");

  const cerere = primit ? JSON.parse(primit) : {};
  const instructiuni = String(cerere.system ?? "");
  verifica(
    instructiuni.length > 500,
    `instrucțiunile au ajuns la model (${instructiuni.length} caractere)`,
  );

  // 1. Niciun șablon necompletat.
  const necompletate = instructiuni.match(/\$\{[^}]*\}/g) ?? [];
  verifica(
    necompletate.length === 0,
    necompletate.length
      ? `șabloane necompletate în prompt: ${necompletate.join(", ")}`
      : "niciun șablon ${…} necompletat în prompt",
  );

  // 2. Frazele lor, cuvânt cu cuvânt.
  for (const fraza of frazele) {
    verifica(
      instructiuni.includes(fraza),
      `fraza asociației pleacă întreagă: „${fraza.slice(0, 44)}…”`,
    );
  }

  // 3. Perechea contrastantă și regulile.
  verifica(
    instructiuni.includes("CUM SCRIE ASOCIAȚIA"),
    "blocul „cum scrie asociația” e în prompt",
  );
  verifica(
    instructiuni.includes("AȘA NU") && instructiuni.includes("AȘA DA"),
    "perechea „așa nu / așa da” e în prompt",
  );
  verifica(
    instructiuni.includes("dumneavoastră"),
    "excepția pentru firme e scrisă în prompt",
  );

  // 4. Cifrele verificate și regula golului.
  /*
    Cifrele se citesc din fișierul lor și se caută rând cu rând, exact cum le
    scrie promptul. O listă scrisă aici ar rămâne în urmă la prima cifră
    schimbată, iar proba ar trece verificând cifra de anul trecut.
  */
  const cifre = [
    ...readFileSync("src/date/asociatie.ts", "utf8").matchAll(
      /\{\s*valoare:\s*(\d+),\s*sufix:\s*"([^"]*)",\s*eticheta:\s*"([^"]+)"\s*\}/g,
    ),
  ].map(([, valoare, sufix, eticheta]) => `${valoare}${sufix} ${eticheta}`);
  verifica(cifre.length === 4, `am găsit cifrele verificate în sursă (${cifre.length})`);
  for (const cifra of cifre) {
    verifica(instructiuni.includes(cifra), `cifra „${cifra}” pleacă spre model`);
  }
  verifica(
    instructiuni.includes("[câți copii]"),
    "regula golului în loc de cifră inventată e în prompt",
  );
} finally {
  try {
    process.kill(-site.pid, "SIGKILL");
  } catch {
    /* se închidea deja */
  }
  fals.close();
}

console.log(rele === 0 ? "\nTot bine." : `\n${rele} lucruri de îndreptat.`);
process.exit(rele === 0 ? 0 : 1);
