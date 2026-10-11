import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Scrierea PDF-urilor: diacriticele românești și semnătura.
 *
 * Se rulează fără server — compilează `src/lib/pdf.ts` și îl pune la treabă:
 *
 *   node scripts/qa/pdf.mjs
 *
 * Ce verifică, și de ce:
 *
 * - **ș și ț cu virgulă dedesubt.** Fonturile standard din PDF n-au literele
 *   astea. Dacă cineva înlocuiește cândva DejaVu cu Helvetica „ca să fie mai
 *   mic fișierul", un contract pentru „Înțelepciunea SRL" ar ieși cu pătrate
 *   în loc de litere, sau n-ar ieși deloc.
 * - **textul rămâne text.** Un contract scanat ca imagine nu se poate căuta,
 *   copia sau citi cu un cititor de ecran. Se verifică extrăgând textul
 *   înapoi din PDF și comparându-l cu ce s-a scris.
 * - **nu se substituie sedila.** „ş" (sedilă, turcesc) și „ș" (virgulă,
 *   românesc) arată aproape la fel. Dacă fontul le-ar confunda, numele
 *   firmelor ar ieși greșit fără ca nimeni să observe.
 * - **paragrafele lungi trec pe pagina următoare**, în loc să scrie peste
 *   text sau să iasă pe sub marginea de jos.
 */

const dir = join(tmpdir(), "proba-pdf");
mkdirSync(dir, { recursive: true });
let rele = 0;
const ok = (e, b, d = "") => {
  console.log(`${b ? "  ok " : "  ✗  "} ${e}${d ? ` — ${d}` : ""}`);
  if (!b) rele++;
};

execSync(
  "npx esbuild src/lib/pdf.ts --bundle --platform=node --format=esm --packages=external --outfile=.next-proba/pdf.js",
  { stdio: "pipe" },
);
const { Cursor, documentNou } = await import(
  join(process.cwd(), ".next-proba/pdf.js")
);

const DIACRITICE = "Șoșoacă Țăndărei înțelegere hotărâre așezământ știință";
const SEDILE = "ş ţ Ş Ţ";
const LUNG = "Părțile convin că sponsorizarea se acordă în scopul sprijinirii activităților asociației. ".repeat(40);

const doc = await documentNou();
const c = new Cursor(doc);
c.scrie("CONTRACT DE SPONSORIZARE", { gros: true, marime: 15 });
c.scrie(DIACRITICE);
c.scrie(SEDILE);
c.scrie("Sume: 12.500,50 lei · 1.250 € · 20% · nr. 7/2026");
c.scrie(LUNG);
c.linie();
c.scrie("Semnătura reprezentantului", { marime: 9 });

const caleaPdf = join(dir, "proba.pdf");
writeFileSync(caleaPdf, await doc.pdf.save());
ok("PDF-ul se scrie", readFileSync(caleaPdf).length > 1000, `${readFileSync(caleaPdf).length} octeți`);

let text = "";
try {
  text = execSync(`pdftotext ${caleaPdf} -`, { encoding: "utf8" });
} catch {
  console.log("  (pdftotext lipsește — nu se poate verifica extragerea)");
  process.exit(rele === 0 ? 0 : 1);
}

const fara = text.replace(/\s+/g, " ");
for (const cuvant of DIACRITICE.split(" ")) {
  ok(`„${cuvant}" se extrage întreg`, fara.includes(cuvant));
}
// pdftotext lipește glifele apropiate, deci „ş ţ Ş Ţ" iese „şţŞŢ": se
// verifică fiecare caracter, nu spațiile dintre ele.
for (const litera of ["ş", "ţ", "Ş", "Ţ"]) {
  ok(`sedila „${litera}" rămâne sedilă`, fara.includes(litera));
}
ok("virgula nu e înlocuită cu sedila", !/Şoşoacă|Ţăndărei/.test(fara));
ok("simbolul euro supraviețuiește", fara.includes("1.250 €"));
ok("sumele românești rămân cu virgulă zecimală", fara.includes("12.500,50 lei"));

const pagini = (text.match(/\f/g) ?? []).length;
ok("textul lung trece pe pagini noi", pagini >= 1, `${pagini + 1} pagini`);

// Nimic nu trebuie să cadă sub marginea de jos.
const randuriPdf = execSync(`pdftotext -layout ${caleaPdf} -`, { encoding: "utf8" });
ok("ultima pagină are conținut", randuriPdf.trim().endsWith("Semnătura reprezentantului"), randuriPdf.trim().slice(-40));

console.log(`\nverificări picate: ${rele}`);
process.exit(rele === 0 ? 0 : 1);
