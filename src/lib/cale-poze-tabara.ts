/**
 * Calea din Cloudinary în care se urcă pozele unei tabere.
 *
 * Fie folderul ales deja pentru tabără (`cale`, întreagă, cu rădăcina în
 * față), fie unul nou: `<rădăcină>/<an>/<nume>`. Numele e scris de om, deci
 * se curăță: fără bare (ar face subfoldere), fără `..`, fără semne pe care
 * Cloudinary nu le primește în numele unui folder.
 */
export function calePozeTabara(
  radacina: string,
  cale: string,
  an: string,
  nume: string,
): string | null {
  const aleasa = cale.trim();
  if (aleasa) {
    const bucati = aleasa.split("/");
    if (
      bucati[0] !== radacina ||
      bucati.length < 2 ||
      bucati.some((b) => !b.trim() || b === "." || b === "..")
    ) {
      return null;
    }
    return aleasa;
  }

  const anul = /^\d{4}$/.test(an.trim()) ? an.trim() : String(new Date().getFullYear());
  const curat = nume
    .replace(/[\/\\?&#%<>"'`:*|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  if (!curat || curat === "." || curat === "..") return null;
  return `${radacina}/${anul}/${curat}`;
}
