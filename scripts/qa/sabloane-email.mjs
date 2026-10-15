/**
 * Șabloanele de campanie pentru MailerLite.
 *
 * Un e-mail de campanie e scris o dată și trimis la mii de oameni. Dacă îi
 * lipsește un buton, nimeni nu-l adaugă din mers; dacă un link duce greșit,
 * se vede abia din rapoarte, peste o săptămână. De aceea proba se uită la
 * patru lucruri:
 *
 *   1. **fiecare șablon are butoanele lui** — cele pentru oameni (card, lunar,
 *      3,5%, SMS, transfer, ziua ta, voluntariat) și cele pentru firme
 *      (sponsorizare, calculator, contract, Declarația 177);
 *   2. **nu se amestecă** — e-mailul pentru firme n-are butoane de SMS, cel
 *      pentru oameni n-are contract de sponsorizare;
 *   3. **MailerLite primește ce-i trebuie** — variabila de dezabonare;
 *   4. **nimic nu iese fără sesiune**, și o poză fără descriere e refuzată.
 *
 * Rulare, pe un server pornit cu PAROLA_ADMIN:
 *     BAZA=http://localhost:3000 PAROLA_ADMIN=… node scripts/qa/sabloane-email.mjs
 */

const BAZA = process.env.BAZA ?? "http://localhost:3000";
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

const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;

let cookie = "";
async function cere(cale, optiuni = {}) {
  const r = await fetch(BAZA + cale, {
    ...optiuni,
    redirect: "manual",
    headers: {
      ...(optiuni.headers ?? {}),
      "x-forwarded-for": DE_LA,
      ...(cookie ? { cookie } : {}),
    },
  });
  for (const c of r.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  return r;
}

// ─── 1. Fără sesiune, nimic ───────────────────────────────────────────────
const peFurate = await fetch(`${BAZA}/api/admin/sablon?fel=persoane`, {
  redirect: "manual",
  headers: { "x-forwarded-for": DE_LA },
});
verifica(peFurate.status === 403, `fără sesiune, șablonul e refuzat (${peFurate.status})`);

const intrare = await cere("/api/admin/intrare", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ parola: PAROLA, unde: "/admin/sabloane" }),
});
verifica(intrare.status === 303, `intrarea în panou (${intrare.status})`);

// ─── 2. Fiecare șablon are butoanele lui ──────────────────────────────────
const persoane = await (await cere("/api/admin/sablon?fel=persoane")).text();
const firme = await (await cere("/api/admin/sablon?fel=firme")).text();

const PENTRU_OAMENI = [
  ["Donez acum", "butonul principal"],
  ["/doneaza?suma=20", "suma de 20 de lei, aleasă dinainte"],
  ["frecventa=lunar", "donația lunară"],
  ["/redirectioneaza-3-5", "redirecționarea de 3,5%"],
  ["SUSTIN", "SMS-ul"],
  ["RO16 RNCB 0234 1852 3366 0001", "IBAN-ul de la BCR"],
  ["/doneaza-ti-ziua", "campania de ziua ta"],
  ["/devino-voluntar", "voluntariatul"],
  ["galantom.ro", "Galantom"],
  ["facebook.com/sharer", "distribuirea pe Facebook"],
  ["wa.me", "distribuirea pe WhatsApp"],
];
for (const [bucata, ce] of PENTRU_OAMENI) {
  verifica(persoane.includes(bucata), `persoane fizice: are ${ce}`);
}

const PENTRU_FIRME = [
  ["/directioneaza-20", "pagina pentru firme"],
  ["#calculator", "calculatorul"],
  ["/api/contract/descarca", "modelul de contract"],
  ["0,75%", "regula de 0,75% din cifra de afaceri"],
  ["20%", "regula de 20% din impozit"],
  ["/sponsori-si-parteneri", "pagina de sponsori"],
  ["mailto:", "adresa de e-mail a omului de la fundraising"],
  ["tel:", "telefonul lui"],
];
for (const [bucata, ce] of PENTRU_FIRME) {
  verifica(firme.includes(bucata), `firme: are ${ce}`);
}

/*
  Cele două nu se amestecă.

  Un e-mail despre contracte de sponsorizare trimis listei de donatori
  persoane fizice e o campanie pierdută; invers, la fel.
*/
verifica(!firme.includes("SUSTIN"), "firme: nu are butonul de SMS");
verifica(
  !firme.includes("/doneaza-ti-ziua"),
  "firme: nu are campania de ziua ta",
);
verifica(
  !persoane.includes("/api/contract/descarca"),
  "persoane fizice: nu are contractul de sponsorizare",
);

// ─── 3. Ce cere MailerLite ────────────────────────────────────────────────
for (const [nume, html] of [
  ["persoane fizice", persoane],
  ["firme", firme],
]) {
  verifica(
    html.includes("{$unsubscribe}"),
    `${nume}: are variabila de dezabonare a MailerLite`,
  );
  verifica(
    html.includes("utm_source=mailerlite"),
    `${nume}: linkurile poartă etichete de urmărire`,
  );
  verifica(
    /<table/.test(html) && !/display:\s*flex/.test(html),
    `${nume}: e făcut din tabele, nu din flex (Outlook)`,
  );
  verifica(
    html.includes("CIF 43533953"),
    `${nume}: are subsolul legal`,
  );
}

// ─── 4. Formularul ────────────────────────────────────────────────────────
async function trimite(campuri) {
  return cere("/api/admin/sablon", {
    method: "POST",
    body: new URLSearchParams(campuri),
  });
}

const cuText = await trimite({
  fel: "persoane",
  titlu: "Tabăra de iarnă",
  text: "Primul paragraf.\n\nAl doilea paragraf.",
  fac: "vezi",
});
const htmlScris = await cuText.text();
verifica(
  cuText.status === 200 &&
    htmlScris.includes("Tabăra de iarnă") &&
    htmlScris.includes("Al doilea paragraf."),
  `textul scris ajunge în e-mail (${cuText.status})`,
);

const descarcat = await trimite({
  fel: "firme",
  titlu: "Pentru firme",
  fac: "descarca",
});
verifica(
  descarcat.status === 200 &&
    /filename="[^"]*\.html"/.test(descarcat.headers.get("content-disposition") ?? ""),
  `HTML-ul se descarcă cu nume de fișier (${descarcat.headers.get("content-disposition")})`,
);

/*
  Poza fără descriere nu intră.

  Aceeași regulă ca la scrisul pe site: cine nu vede imaginea — pentru că
  folosește cititor de ecran sau pentru că nu i se încarcă pozele — rămâne cu
  textul alternativ sau cu nimic.
*/
const faraDescriere = await trimite({
  fel: "persoane",
  titlu: "Cu poză",
  poza: "Teona/2025/ceva/poza-1",
  fac: "vezi",
});
const dus = faraDescriere.headers.get("location") ?? "";
verifica(
  faraDescriere.status === 303 && dus.includes("ratat=poza"),
  `poza fără descriere e refuzată (${faraDescriere.status})`,
);

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
