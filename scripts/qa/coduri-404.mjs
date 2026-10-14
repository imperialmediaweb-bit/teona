/**
 * Verifică că adresele inexistente răspund cu 404, nu cu 200.
 *
 * Pe producție, `/proiecte/ceva-ce-nu-exista` răspundea cu **codul 200** și
 * pagina „nu a fost găsită” în corp. Pentru Google asta e un „soft 404”: o
 * adresă inexistentă care se declară validă, indexată ca pagină adevărată.
 * Cauza e randarea parțială — antetul pleacă înainte ca pagina să ajungă la
 * `notFound()` — iar remediul e în `src/proxy.ts`.
 *
 * Proba rulează pe un server deja pornit:
 *     BAZA=http://localhost:3000 node scripts/qa/coduri-404.mjs
 */

const BAZA = process.env.BAZA ?? "http://localhost:3000";

/**
 * [adresă, coduri acceptate, o bucată din titlu care trebuie să apară]
 *
 * Adresa cu procente stricate are două răspunsuri bune: pe serverul nostru
 * ajunge la 404, dar în producție o oprește înaintea noastră gazda, cu 400.
 * Ambele spun „nu există”; important e să nu fie 200.
 */
const PROBE = [
  ["/proiecte/ceva-ce-nu-exista", [404], "Proiectul nu a fost găsit"],
  ["/proiecte/tabara-respiro-dedicata-copiilor-cu-auti", [404], "Proiectul nu a fost găsit"],
  ["/proiecte/%zz", [404, 400], ""],
  ["/pagina-care-nu-exista", [404], "Pagina nu a fost găsită"],
  // Paginile adevărate nu au voie să fie prinse de filtru.
  ["/proiecte", [200], "Proiecte"],
  ["/proiecte/tabara-respiro-septembrie-2026", [200], "ediția EGGER"],
  ["/", [200], ""],
];

let rele = 0;
for (const [cale, coduri, titluAsteptat] of PROBE) {
  const r = await fetch(BAZA + cale, { redirect: "follow" });
  const html = await r.text();
  const titlu = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? "";
  // Titlul se verifică doar dacă răspunsul a venit de la noi: gazda poate
  // opri o adresă stricată înaintea aplicației, cu pagina ei.
  const alNostru = coduri.includes(r.status);
  const ok = alNostru && (titluAsteptat === "" || titlu.includes(titluAsteptat));
  if (!ok) rele++;
  console.log(
    `${ok ? "ok  " : "CADE"} ${cale} → ${r.status} (aștept ${coduri.join(" sau ")}) ${titlu.slice(0, 55)}`,
  );
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
