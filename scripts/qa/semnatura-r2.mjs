/**
 * Semnătura AWS v4, verificată pe exemplele publicate de AWS.
 *
 * **De ce există proba asta.** Fișierele trimise de oameni — fotografii ale
 * Formularului 230 — se urcă într-un depozit privat pe Cloudflare R2, semnate
 * cu algoritmul AWS v4. Fără chei de R2 la îndemână, singura cale de a ști că
 * semnătura e bună înainte de a lega codul de un depozit adevărat e s-o
 * calculezi pe cazurile pentru care AWS publică rezultatul și să compari.
 *
 * O semnătură greșită nu dă un rezultat parțial: nu merge absolut nimic, iar
 * R2 răspunde „SignatureDoesNotMatch", fără să spună ce lipsește. Cu proba
 * asta, greșeala se vede aici, nu după ce cineva a pierdut o oră întrebându-se
 * de ce nu se urcă nicio poză.
 *
 * Cazurile sunt din suita oficială de probe AWS SigV4 („aws-sig-v4-test-suite"),
 * cu acreditările de exemplu, care nu deschid nimic nicăieri.
 *
 * Rulare: `node scripts/qa/semnatura-r2.mjs`
 */

import { createHash, createHmac } from "node:crypto";

const sha256 = (date) => createHash("sha256").update(date).digest("hex");
const hmac = (cheie, date) => createHmac("sha256", cheie).update(date).digest();

/*
  Aceeași funcție ca în `src/lib/r2.ts`, rescrisă aici în JavaScript.

  Nu e o copie făcută din lene: proba n-are cum să importe TypeScript fără un
  pas de compilare. Dacă cele două se despart vreodată, proba o să treacă în
  timp ce codul cade — de aceea ultima verificare compară cele două texte,
  rând cu rând.
*/
function semnaturaV4(c) {
  const nume = Object.keys(c.antete).sort();
  const canonic = [
    c.metoda,
    c.cale,
    c.interogare,
    nume.map((n) => `${n}:${c.antete[n]}\n`).join(""),
    nume.join(";"),
    c.hashCorp,
  ].join("\n");

  const domeniu = `${c.zi}/${c.regiune}/${c.serviciu}/aws4_request`;
  const deSemnat = ["AWS4-HMAC-SHA256", c.lung, domeniu, sha256(canonic)].join("\n");

  const cheie = hmac(
    hmac(hmac(hmac(`AWS4${c.secret}`, c.zi), c.regiune), c.serviciu),
    "aws4_request",
  );
  return createHmac("sha256", cheie).update(deSemnat).digest("hex");
}

const SECRET = "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY";

/** Cazurile AWS, cu semnătura pe care o publică ei. */
const CAZURI = [
  {
    nume: "get-vanilla",
    cerere: {
      metoda: "GET",
      cale: "/",
      interogare: "",
      antete: { host: "example.amazonaws.com", "x-amz-date": "20150830T123600Z" },
      hashCorp: sha256(""),
      lung: "20150830T123600Z",
      zi: "20150830",
      regiune: "us-east-1",
      serviciu: "service",
      secret: SECRET,
    },
    asteptat:
      "5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
  },
  {
    nume: "get-vanilla-query-order-key-case",
    cerere: {
      metoda: "GET",
      cale: "/",
      interogare: "Param1=value1&Param2=value2",
      antete: { host: "example.amazonaws.com", "x-amz-date": "20150830T123600Z" },
      hashCorp: sha256(""),
      lung: "20150830T123600Z",
      zi: "20150830",
      regiune: "us-east-1",
      serviciu: "service",
      secret: SECRET,
    },
    asteptat:
      "b97d918cfa904a5beff61c982a1b6f458b799221646efd99d3219ec94cdf2500",
  },
  {
    nume: "post-vanilla",
    cerere: {
      metoda: "POST",
      cale: "/",
      interogare: "",
      antete: { host: "example.amazonaws.com", "x-amz-date": "20150830T123600Z" },
      hashCorp: sha256(""),
      lung: "20150830T123600Z",
      zi: "20150830",
      regiune: "us-east-1",
      serviciu: "service",
      secret: SECRET,
    },
    asteptat:
      "5da7c1a2acd57cee7505fc6676e4e544621c30862966e37dddb68e92efbe5d6b",
  },
];

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

for (const caz of CAZURI) {
  const iesit = semnaturaV4(caz.cerere);
  verifica(
    iesit === caz.asteptat,
    `${caz.nume}${iesit === caz.asteptat ? "" : `\n     ieșit:    ${iesit}\n     așteptat: ${caz.asteptat}`}`,
  );
}

// Aceeași cerere, semnată de două ori, dă aceeași semnătură.
const unu = semnaturaV4(CAZURI[0].cerere);
const doi = semnaturaV4(CAZURI[0].cerere);
verifica(unu === doi, "aceeași cerere dă aceeași semnătură");

// Un secret schimbat cu o literă schimbă semnătura.
const altSecret = semnaturaV4({ ...CAZURI[0].cerere, secret: `${SECRET}x` });
verifica(altSecret !== unu, "un secret diferit dă altă semnătură");

/*
  Funcția din probă și cea din cod trebuie să rămână la fel.

  Se compară textul lor, fără spații și fără tipuri: dacă cineva schimbă una
  și uită de cealaltă, proba ar trece pe o funcție care nu mai e cea folosită.
*/
const { readFileSync } = await import("node:fs");
const cod = readFileSync(
  new URL("../../src/lib/r2.ts", import.meta.url),
  "utf8",
);
const bucata = cod.slice(
  cod.indexOf("export function semnaturaV4"),
  cod.indexOf("/** Urcă un fișier"),
);
const esential = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/:\s*(string|Record<string, string>|\{[^}]*\})/g, "")
    .replace(/\s+/g, "");

for (const semn of [
  "AWS4-HMAC-SHA256",
  "aws4_request",
  'nume.join(";")',
  "sha256(canonic)",
]) {
  verifica(
    esential(bucata).includes(esential(semn)),
    `funcția din cod conține „${semn}"`,
  );
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
