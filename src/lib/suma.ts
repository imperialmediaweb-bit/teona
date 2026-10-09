/**
 * Citirea și scrierea sumelor în lei, cum le scrie un om.
 *
 * Trăiește într-un singur loc pentru că e nevoie de ea în două: calculatorul
 * de sponsorizare și formularul de donație. Formularul folosea până acum
 * `Number()` brut, iar `Number("1.000")` e **1**, nu 1000 — cineva care scria
 * „1.000” la „Altă sumă” vedea butonul „Donează 1 lei lunar”. Pe un formular
 * de donație, asta nu e o scăpare de formatare.
 */

/** Peste atât, e aproape sigur o greșeală de tastare, nu o sumă. */
const LIMITA = 1e15;

const format = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 });

/** „20000” -> „20.000 lei”. */
export function scrieSuma(suma: number): string {
  return `${format.format(suma)} lei`;
}

/** Rotunjire la ban: 0,75% din 100.000 iese 750,0000000000001 în virgulă mobilă. */
export function laBan(suma: number): number {
  return Math.round(suma * 100) / 100;
}

/**
 * Citește o sumă scrisă de om, nu de calculator.
 *
 * Oamenii scriu cifrele cum le văd pe bilanț: „1.250.000”, „1 250 000” sau
 * „1250000,50”. Punctul e separator de mii când grupează câte trei cifre;
 * virgula e mereu zecimală. Câmpul gol nu e eroare — omul încă n-a scris.
 */
export function citesteSuma(brut: string): {
  suma: number | null;
  eroare?: string;
} {
  let text = brut.trim().replace(/\s/g, "").replace(/lei$/i, "");
  if (text === "") return { suma: null };

  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "");
  }

  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return {
      suma: null,
      eroare: "Scrie suma doar în cifre, de exemplu 250.000.",
    };
  }

  const suma = Number(text);
  if (suma < 0 || Object.is(suma, -0)) {
    return { suma: null, eroare: "Suma nu poate fi negativă." };
  }
  if (suma > LIMITA) {
    return {
      suma: null,
      eroare:
        "Suma e mai mare decât orice cifră reală. Verifică dacă n-a intrat un zero în plus.",
    };
  }
  return { suma };
}
