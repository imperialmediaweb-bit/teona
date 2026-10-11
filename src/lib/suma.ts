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

const INTREG = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });
const CU_BANI = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * „20000” -> „20.000 lei”, „1250.5” -> „1.250,50 lei”.
 *
 * Banii nu se scriu niciodată cu un singur zecimal. `maximumFractionDigits:
 * 2` singur dădea „1.250,5 lei”, care pe un extras de cont arată a greșeală
 * de tastare — și care, citit repede, se confundă cu 1.250,05.
 *
 * Zecimalele apar doar când există: „20.000 lei”, nu „20.000,00 lei”.
 * Majoritatea donațiilor sunt sume rotunde, iar două zerouri la fiecare
 * rând dintr-un tabel sunt zgomot.
 */
export function scrieSuma(suma: number): string {
  const rotund = Number.isInteger(laBan(suma));
  return `${(rotund ? INTREG : CU_BANI).format(suma)} lei`;
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
