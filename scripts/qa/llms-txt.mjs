import { BAZA } from "./comun.mjs";

/**
 * `/llms.txt` și `robots.txt`: ce citesc modelele de limbaj.
 *
 * Fișierul `llms.txt` repetă datele asociației într-un loc din care un model
 * le poate lua direct. Repetarea e și riscul lui: dacă se schimbă un IBAN pe
 * site și fișierul rămâne în urmă, un model va dicta cu încredere un cont
 * greșit, iar banii cuiva ajung altundeva. De aceea proba nu verifică fișierul
 * în sine, ci **îl compară cu ce văd oamenii pe pagini**: IBAN-urile de pe
 * Donează, telefoanele de pe Contact, CIF-ul.
 *
 * Fișierul se scrie din aceleași date ca paginile, deci în mod normal nu poate
 * diverge. Proba e pentru ziua în care cineva scrie ceva de mână în el.
 */

const probleme = [];
function verifica(eticheta, conditie, detaliu = "") {
  console.log(
    `${conditie ? "  ok " : "  ✗  "} ${eticheta}${detaliu ? ` — ${detaliu}` : ""}`,
  );
  if (!conditie) probleme.push(eticheta);
}

async function text(cale) {
  const r = await fetch(BAZA + cale);
  return { stare: r.status, tip: r.headers.get("content-type") ?? "", corp: await r.text() };
}

const llms = await text("/llms.txt");
verifica("/llms.txt răspunde", llms.stare === 200, `HTTP ${llms.stare}`);
verifica(
  "se servește ca text simplu",
  llms.tip.startsWith("text/plain"),
  llms.tip,
);
if (llms.stare !== 200) {
  console.log(`\nverificări picate: ${probleme.length}`);
  process.exit(1);
}

// ─── Forma cerută de convenție ────────────────────────────────────────────
verifica("începe cu un titlu H1", /^# .+/m.test(llms.corp.split("\n")[0]));
verifica("are rezumatul în citat", /^> .+/m.test(llms.corp));
verifica(
  "spune explicit ce nu se știe",
  llms.corp.includes("Ce nu se știe"),
);

// ─── Aceleași date ca pe pagini ───────────────────────────────────────────
const doneaza = await text("/doneaza");
const contact = await text("/contact");

/*
  Pagina Donează scrie fiecare IBAN de două ori: o dată cu spații, pentru
  citit, și o dată lipit, în butonul care copiază. Comparăm fără spații, ca
  cele două forme să fie același cont.
*/
const faraSpatii = (s) => s.replace(/\s+/g, "");
const ibanuri = [
  ...new Set(
    (doneaza.corp.match(/RO\d{2}(?:\s?[A-Z0-9]{4}){4,5}/g) ?? []).map(faraSpatii),
  ),
];
const llmsLipit = faraSpatii(llms.corp);
verifica("pagina Donează chiar arată conturi", ibanuri.length >= 3, `${ibanuri.length} IBAN-uri`);
for (const iban of ibanuri) {
  verifica(`IBAN-ul ${iban} e și în llms.txt`, llmsLipit.includes(iban));
}

const telefoane = [
  ...new Set(contact.corp.match(/07\d{2} \d{3} \d{3}/g) ?? []),
];
verifica("pagina Contact chiar arată telefoane", telefoane.length >= 1, telefoane.join(", "));
for (const telefon of telefoane) {
  verifica(`telefonul ${telefon} e și în llms.txt`, llms.corp.includes(telefon));
}

const cif = contact.corp.match(/\b\d{8}\b/)?.[0];
verifica("CIF-ul de pe site e și în llms.txt", !!cif && llms.corp.includes(cif), cif ?? "negăsit");

// ─── Linkurile din fișier duc undeva ──────────────────────────────────────
const cai = [
  ...new Set(
    [...llms.corp.matchAll(/\]\(https?:\/\/[^)]*?(\/[^)]*)\)/g)].map((m) => m[1]),
  ),
].filter((c) => !c.includes("<slug>"));
verifica("fișierul chiar conține linkuri", cai.length >= 10, `${cai.length} linkuri`);
for (const cale of cai) {
  const r = await fetch(BAZA + cale, { method: "HEAD" });
  if (r.status !== 200) verifica(`linkul ${cale} duce undeva`, false, `HTTP ${r.status}`);
}
verifica("toate linkurile răspund cu 200", !probleme.some((p) => p.startsWith("linkul ")));

// ─── robots.txt ───────────────────────────────────────────────────────────
const roboti = await text("/robots.txt");
const peDomeniulFinal = roboti.corp.includes("Allow: /");
if (!peDomeniulFinal) {
  console.log(
    "\n  (robots.txt interzice tot — serverul rulează pe o adresă de previzualizare, deci restul nu se verifică)",
  );
} else {
  verifica("roboții AI au un grup al lor", roboti.corp.includes("GPTBot"));
  const grupAi = roboti.corp.slice(roboti.corp.indexOf("GPTBot"));
  for (const cale of ["/api/", "/admin/", "/ziua-ta/"]) {
    verifica(
      `grupul AI repetă interdicția pentru ${cale}`,
      grupAi.includes(`Disallow: ${cale}`),
    );
  }
  verifica("robots.txt trimite la sitemap", /Sitemap: https?:\/\/\S+/.test(roboti.corp));
}

console.log(`\nverificări picate: ${probleme.length}`);
process.exit(probleme.length ? 1 : 0);
