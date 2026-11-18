/**
 * Grupurile căutării, fără nimic de server: le citesc și fereastra de
 * căutare rapidă (în browser), și pagina de rezultate. Un import din
 * `lib/cautare.ts` ar trage după el driverul de Postgres în pachetul
 * browserului — aceeași lecție ca la tipul `Cifra`.
 */
export type FelGasit = "firma" | "donator" | "cerere" | "voluntar" | "contract" | "text" | "presa";

/** În ordinea în care apar. */
export const GRUPURI_CAUTARE: ReadonlyArray<{ id: FelGasit; eticheta: string }> = [
  { id: "firma", eticheta: "Firme" },
  { id: "donator", eticheta: "Donatori" },
  { id: "cerere", eticheta: "Cereri" },
  { id: "voluntar", eticheta: "Voluntari" },
  { id: "contract", eticheta: "Contracte" },
  { id: "text", eticheta: "Articole și campanii" },
  { id: "presa", eticheta: "Presă" },
];
