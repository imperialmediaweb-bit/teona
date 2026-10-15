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
 * Moneda e un argument, nu o presupunere. Înainte lipea „lei" la orice sumă,
 * iar de când site-ul primește și donații în euro prin PayPal asta însemna
 * că o sumă în euro era afișată ca lei.
 *
 * Banii nu se scriu niciodată cu un singur zecimal. `maximumFractionDigits:
 * 2` singur dădea „1.250,5 lei”, care pe un extras de cont arată a greșeală
 * de tastare — și care, citit repede, se confundă cu 1.250,05.
 *
 * Zecimalele apar doar când există: „20.000 lei”, nu „20.000,00 lei”.
 * Majoritatea donațiilor sunt sume rotunde, iar două zerouri la fiecare
 * rând dintr-un tabel sunt zgomot.
 */
/** Simbolul monedei, scris după sumă, cum se scrie în română. */
const SIMBOL: Record<string, string> = { RON: "lei", EUR: "€", USD: "$" };

/**
 * Cifrele singure, fără monedă: „2500000" -> „2.500.000".
 *
 * Pentru câmpurile în care omul bate o sumă și care scrie deja „(lei)" în
 * etichetă. Un milion scris fără puncte se numără cu degetul pe ecran, iar
 * un zero în plus trece neobservat — exact greșeala pe care calculatorul de
 * sponsorizare n-o poate prinde, pentru că 25.000.000 e o cifră la fel de
 * validă ca 2.500.000.
 */
export function scrieCifre(suma: number): string {
  return (Number.isInteger(laBan(suma)) ? INTREG : CU_BANI).format(suma);
}

export function scrieSuma(suma: number, moneda = "RON"): string {
  const rotund = Number.isInteger(laBan(suma));
  const cifre = (rotund ? INTREG : CU_BANI).format(suma);
  return `${cifre} ${SIMBOL[moneda] ?? moneda}`;
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
    /*
      Virgula e zecimală în română, deci punctele dinaintea ei sunt separatori
      de mii. Dar numai dacă chiar arată așa.

      Înainte ștergeam punctele oriunde erau, inclusiv după virgulă. „12,500.50”
      — scris la englezește — devenea 12.5005, adică 12,50 lei în loc de
      12.500,50. De o mie de ori mai puțin, fără niciun semn că s-a întâmplat
      ceva, pe un câmp în care cineva bate cifre dintr-un extras de cont.

      Forma englezească nu e validă în română sub nicio citire: o virgulă
      zecimală nu poate fi urmată de un punct. Deci se respinge, nu se ghicește.
    */
    if (!/^-?\d{1,3}(\.\d{3})*,\d+$/.test(text)) {
      return {
        suma: null,
        eroare:
          "Scrie suma în formatul românesc: punctul desparte miile, virgula zecimalele. De exemplu 12.500,50.",
      };
    }
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
