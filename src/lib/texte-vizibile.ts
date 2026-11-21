import { cacheTag } from "next/cache";
import { areBazaDeDate, intreaba } from "./baza";
import { cachePanou, cacheRezerva } from "./cache-panou";
import type { FelText } from "./texte";

/**
 * Există cel puțin un text publicat de felul ăsta?
 *
 * O pagină goală promovată în subsol și în sitemap spune despre asociație că
 * n-are nimic de spus. Linkurile spre `/noutati` apar deci numai după primul
 * articol publicat din panou, fără nicio schimbare de cod: publicarea și
 * ștergerea golesc eticheta, iar linkul apare sau dispare pe loc.
 *
 * Fără bază de date, sau cu baza mută (la build pe Railway), răspunsul e „nu”
 * și nu se ține: primul vizitator de după publicare îl reîmprospătează.
 */
export const ETICHETA_TEXTE_PUBLICATE = "texte-publicate";

export async function arePublicate(fel: FelText): Promise<boolean> {
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_TEXTE_PUBLICATE);
  if (!areBazaDeDate()) return false;
  try {
    const r = await intreaba<{ n: number }>(
      `SELECT 1 AS n FROM texte WHERE fel = $1 AND stare = 'publicat' LIMIT 1`,
      [fel],
    );
    return r.length > 0;
  } catch {
    cacheRezerva();
    return false;
  }
}
