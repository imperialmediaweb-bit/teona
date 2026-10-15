/**
 * Numărul scris lângă substantiv, românește.
 *
 * Româna cere „de" între număr și substantiv când ultimele două cifre sunt 00
 * sau între 20 și 99: *2 zile*, *19 zile*, dar *20 de zile*, *101 zile*,
 * *120 de zile*. Regula se uită ușor, iar rezultatul — „0 de zile", „35 de
 * zile" lângă „2 zile" — se citește ca un text scris de un robot.
 *
 * Contează mai mult decât pare: textele astea ajung și pe ecranul cuiva din
 * asociație, și în cererea trimisă unui model de limbaj, care răspunde în
 * limba în care i se vorbește.
 */

/** `cate(21, "zi", "zile")` → „21 de zile". */
export function cate(n: number, singular: string, plural: string): string {
  if (n === 1) return `1 ${singular}`;
  // Zero face excepție: „0 zile", nu „0 de zile".
  if (n === 0) return `0 ${plural}`;
  const ultimele = Math.abs(n) % 100;
  const cuDe = ultimele === 0 || ultimele >= 20;
  return `${n} ${cuDe ? "de " : ""}${plural}`;
}

/** Numai cuvântul, cu „de" când trebuie: `lega(21, "zile")` → „de zile". */
export function lega(n: number, plural: string): string {
  const ultimele = Math.abs(n) % 100;
  return ultimele === 0 || ultimele >= 20 ? `de ${plural}` : plural;
}
