import { connection } from "next/server";
import Intreaba from "./Intreaba";
import { areAsistentPeSite } from "@/lib/intreaba/raspunde";

/**
 * Caseta de întrebări, dacă e configurată cheia.
 *
 * **De ce o componentă separată și nu un `if` în aspect.** Aspectul e
 * pregenerat: `process.env.ANTHROPIC_API_KEY` citit acolo se citește la
 * *compilare*, nu la cerere. Pe Railway, pasul de compilare poate rula fără
 * variabilele de mediu ale aplicației — iar caseta ar lipsi de pe site fără
 * ca nimic să arate de ce. Prins de probă, care pornea site-ul cu cheia în
 * mediu și tot nu găsea caseta în pagină.
 *
 * `connection()` mută decizia la cerere, iar `Suspense` din jur lasă restul
 * paginii pregenerat: coaja pleacă la fel de repede, caseta vine după.
 */
export default async function AsistentDacaExista() {
  await connection();
  if (!areAsistentPeSite()) return null;
  return <Intreaba />;
}
