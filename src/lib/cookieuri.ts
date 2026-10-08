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
/** Bannerul anunță că s-a salvat o alegere, ca restul paginii să afle. */
export const EVENIMENT_SALVAT = "teona:acord-cookieuri-salvat";

/**
 * Abonare la „există deja un acord salvat?”, pentru `useSyncExternalStore`.
 *
 * Două componente au nevoie de răspuns: bannerul însuși și butonul plutitor
 * Donează de pe telefon. Amândouă stau fixate în josul ecranului, iar pe un
 * telefon mic se acopereau. Cât timp bannerul cere o alegere, butonul se dă la
 * o parte.
 */
export function abonareLaAcord(reciteste: () => void) {
  window.addEventListener(EVENIMENT_SALVAT, reciteste);
  // Altă filă a aceluiași sit: `storage` se declanșează doar acolo, nu aici.
  window.addEventListener("storage", reciteste);
  return () => {
    window.removeEventListener(EVENIMENT_SALVAT, reciteste);
    window.removeEventListener("storage", reciteste);
  };
}

/** „1” dacă există un acord salvat, „0” dacă nu. Șir, ca să fie comparabil. */
export function areAcord(): "1" | "0" {
  try {
    return localStorage.getItem(CHEIE_ACORD) ? "1" : "0";
  } catch {
    return "0";
  }
}

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
