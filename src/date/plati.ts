/**
 * Metodele de plată și regulile lor, într-un singur loc.
 *
 * Fișierul nu are dependențe de Node: îl citesc și formularul din browser, și
 * rutele de pe server, ca o sumă sau o destinație să nu existe în două
 * variante care se bat cap în cap.
 */

/** Sumele propuse pe formular (2.2 din caietul de sarcini). */
export const SUME_PROPUSE = [20, 50, 100] as const;

/**
 * Cât se poate dona, în lei.
 *
 * Minimul nu e ales de noi: sub ~2 lei procesatoarele refuză plata, iar
 * comisionul fix ar mânca mai mult decât donația. Maximul e o plasă împotriva
 * greșelilor de tastare — cine vrea să dea mai mult sună, și e și mai bine
 * pentru asociație să vorbească cu omul.
 */
export const SUMA_MINIMA = 5;
export const SUMA_MAXIMA = 50_000;

/** Destinațiile, cu numele care ajunge pe extrasul de cont al donatorului. */
export const DESTINATII: Record<string, string> = {
  oriunde: "Donație — oriunde e nevoie",
  tabere: "Donație — tabere RESPIRO",
  "casa-teona": "Donație — Casa Teona",
  "cazuri-umanitare": "Donație — cazuri umanitare",
};

export type Frecventa = "o-data" | "lunar";

/**
 * Suma în bani, ca număr întreg.
 *
 * Procesatoarele cer bani, nu lei, și cer un întreg. Dacă trimitem lei în
 * virgulă mobilă, 12,30 lei ajunge uneori 1229 de bani — nu teoretic, ci
 * pentru că 12.3 * 100 = 1229.9999999999998 în aritmetica binară.
 */
export function inBani(lei: number): number {
  return Math.round(lei * 100);
}

export function sumaAcceptata(lei: number): boolean {
  return (
    Number.isFinite(lei) && lei >= SUMA_MINIMA && lei <= SUMA_MAXIMA
  );
}

/**
 * Metodele care chiar funcționează acum.
 *
 * Fiecare se aprinde singură, când își are cheile în mediu. Fără chei, metoda
 * nu apare pe site — nu apare un buton care dă eroare.
 */
export type Metoda = "stripe" | "paypal" | "revolut";

/**
 * Cât se poate dona prin PayPal, în euro.
 *
 * PayPal nu suportă leul — are 24 de monede, și RON nu e printre ele. Deci
 * blocul lui e în euro de la cap la coadă, cu sume gândite în euro (5, 10,
 * 25), nu convertite din cele în lei. Un buton care scrie „100 lei” și
 * debitează 19,65 € ar fi exact genul de lucru care strică încrederea, iar un
 * curs scris de noi ar fi vechi din prima zi.
 */
export const SUME_PROPUSE_EURO = [5, 10, 25] as const;
export const EURO_MINIM = 2;
export const EURO_MAXIM = 10_000;

export function euroAcceptat(euro: number): boolean {
  return Number.isFinite(euro) && euro >= EURO_MINIM && euro <= EURO_MAXIM;
}
