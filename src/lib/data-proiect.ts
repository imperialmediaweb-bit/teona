/**
 * Data unui proiect, cum o citește omul — mereu cu an.
 *
 * O singură funcție pentru toate proiectele: cele din cod, cele din exportul
 * WordPress și cele scrise din panou. În panou, „cum se citește data” e un
 * câmp scris de mână („26 – 29 octombrie”), iar pe /proiecte un card fără an
 * stătea lângă altele cu an. Anul lipsă se ia din prima zi a proiectului.
 *
 * Fără dependențe: o folosesc și ruta din panou, și listele de pe site.
 */

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/** `2023-09-04` → „4 septembrie 2023”. */
export function dataDinIso(iso: string): string {
  const [an, luna, zi] = iso.slice(0, 10).split("-").map(Number);
  return `${zi} ${LUNI[luna - 1]} ${an}`;
}

/**
 * Textul scris, completat cu anul din `iso` dacă nu-l are; fără text, prima
 * zi. `null` numai când nu se știe nimic (campaniile n-au dată).
 */
export function dataAfisata(
  scrisa: string | null | undefined,
  iso: string | null | undefined,
): string | null {
  const text = scrisa?.trim();
  const an = iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 4) : null;
  if (text) return /\b(19|20)\d{2}\b/.test(text) || !an ? text : `${text} ${an}`;
  return an ? dataDinIso(iso!) : null;
}
