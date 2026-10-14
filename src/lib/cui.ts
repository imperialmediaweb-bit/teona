/**
 * CUI-ul unei firme: curățat și verificat.
 *
 * Stă separat de `anaf.ts` pentru că e nevoie de el în amândouă părțile:
 * pe server, înainte de a întreba ANAF, și în browser, ca pagina să nu
 * trimită o cerere pentru fiecare cifră tastată. `anaf.ts` e `server-only`
 * și n-ar putea fi importat dintr-o componentă de browser.
 */

/**
 * CUI-ul scris de om → număr. „RO 12.345.678”, „ro12345678”, „12345678”.
 * `null` dacă nu rămâne un număr între 2 și 10 cifre.
 */
export function curataCui(brut: string): number | null {
  const cifre = brut
    .trim()
    .replace(/^ro/i, "")
    .replace(/[\s.\-]/g, "");
  if (!/^\d{2,10}$/.test(cifre)) return null;
  const numar = Number(cifre);
  return Number.isSafeInteger(numar) && numar > 0 ? numar : null;
}

/**
 * Cifra de control a CUI-ului.
 *
 * Se verifică înainte de a întreba ANAF: altfel fiecare greșeală de tastare ar
 * fi o cerere pe serverele lor, iar răspunsul „nu există firma” ar fi dat
 * pentru un număr care oricum nu putea fi un CUI.
 */
export function cuiValid(cui: number): boolean {
  const CHEIE = [7, 5, 3, 2, 1, 7, 5, 3, 2];
  const text = String(cui);
  if (text.length < 2 || text.length > 10) return false;

  // Cheia are nouă cifre, iar CUI-ul poate avea mai puține: corpul se
  // aliniază la **dreapta** cheii, completat cu zerouri în față. Aliniat
  // invers, algoritmul respinge CUI-uri bune — verificat pe 43533953
  // (asociația) și pe 2816464.
  const control = Number(text[text.length - 1]);
  const corp = text.slice(0, -1).padStart(CHEIE.length, "0");
  if (corp.length > CHEIE.length) return false;

  let suma = 0;
  for (let i = 0; i < CHEIE.length; i++) suma += Number(corp[i]) * CHEIE[i];

  const calculat = (suma * 10) % 11;
  return (calculat === 10 ? 0 : calculat) === control;
}
