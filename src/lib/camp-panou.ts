/**
 * Un câmp de text din panou: gol, bun, sau **prea lung** — al treilea caz se
 * spune, nu se taie. `text()` din `lib/api.ts` întoarce `null` și la gol și la
 * prea lung; folosit direct, o descriere prea lungă s-ar fi salvat ca „nimic”
 * fără niciun semn (aceeași capcană ca la testimoniale).
 */
export function campPanou(
  valoare: FormDataEntryValue | null,
  maxim: number,
): { text: string | null; prea: boolean } {
  const s = typeof valoare === "string" ? valoare.trim() : "";
  if (!s) return { text: null, prea: false };
  if (s.length > maxim) return { text: null, prea: true };
  return { text: s, prea: false };
}
