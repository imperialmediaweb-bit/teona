/**
 * Antetul pe care îl pun formularele publice la trimitere: câte secunde a
 * stat pagina deschisă (`performance.now()` numără de la încărcarea ei).
 *
 * `src/proxy.ts` refuză, în tăcere, cererile fără el sau trimise în prima
 * secundă: așa arată un robot care lovește ruta direct, fără să
 * încarce pagina — ca seria de campanii „jfqbwd” din octombrie 2026. Un om
 * nu completează un formular într-o secundă.
 *
 * Numele antetului stă aici o singură dată, pentru browser și pentru server.
 */
export const ANTET_OM = "x-deschis";

export function antetOm(): Record<string, string> {
  const secunde =
    typeof performance === "undefined" ? 0 : Math.round(performance.now() / 1000);
  return { [ANTET_OM]: String(secunde) };
}
