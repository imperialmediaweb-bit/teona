/**
 * Etichetele (cuvintele cheie) unui articol, ale unei campanii sau ale unei
 * tabere: „tabără, autism, voluntari”. Se scriu într-un câmp, despărțite prin
 * virgulă; pe site apar sub text și duc la lista cu aceeași etichetă.
 *
 * Fără dependențe de server: le folosesc și paginile, și ruta de salvare.
 */
export const MAXIM_ETICHETE = 10;

/** Ce a scris omul în câmp → lista curată, fără dubluri, cel mult zece. */
export function citesteEtichete(scris: string): string[] {
  const vazute = new Set<string>();
  const ies: string[] = [];
  for (const bucata of scris.split(/[,;\n]+/)) {
    const e = bucata.trim().replace(/^#+/, "").replace(/\s+/g, " ").trim().slice(0, 40).trim();
    if (e.length < 2) continue;
    const cheie = slugEticheta(e);
    if (!cheie || vazute.has(cheie)) continue;
    vazute.add(cheie);
    ies.push(e);
    if (ies.length >= MAXIM_ETICHETE) break;
  }
  return ies;
}

/** „Tabără Autism” → „tabara-autism”: pentru adresă și pentru comparat. */
export function slugEticheta(e: string): string {
  return e
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
