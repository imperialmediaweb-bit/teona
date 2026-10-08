/** Acordul pentru cookie-uri (12.5 din caietul de sarcini). */

export type Acord = {
  /** Mereu active: fără ele site-ul nu funcționează. */
  necesare: true;
  statistici: boolean;
  marketing: boolean;
  /** Când a fost dat acordul, ca să-l putem reîntreba după o schimbare. */
  laData: string;
};

export const CHEIE_ACORD = "teona:acord-cookieuri";
/** Subsolul anunță prin evenimentul ăsta că vizitatorul vrea să-și schimbe alegerea. */
export const EVENIMENT_REDESCHIDE = "teona:redeschide-cookieuri";

export function citesteAcord(): Acord | null {
  try {
    const brut = localStorage.getItem(CHEIE_ACORD);
    if (!brut) return null;
    const acord = JSON.parse(brut) as Acord;
    if (typeof acord?.statistici !== "boolean") return null;
    return acord;
  } catch {
    return null;
  }
}

export function scrieAcord(alegere: { statistici: boolean; marketing: boolean }) {
  const acord: Acord = {
    necesare: true,
    statistici: alegere.statistici,
    marketing: alegere.marketing,
    laData: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CHEIE_ACORD, JSON.stringify(acord));
  } catch {
    // Dacă nu putem ține minte alegerea, banner-ul reapare. Preferabil
    // alternativei: să încărcăm ceva fără acord.
  }
  return acord;
}
