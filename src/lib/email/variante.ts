/**
 * Alegerea unei variante de text, pentru mesajele care pleacă de mai multe ori
 * la același om.
 *
 * Un donator lunar primește douăsprezece mulțumiri pe an. Un voluntar care se
 * înscrie și se răzgândește primește două confirmări. Dacă toate sunt aceeași
 * propoziție, de la a doua încolo nu se mai citesc — și, mai rău, se vede că
 * nu le-a scris nimeni.
 *
 * Varianta se alege din **săptămâna** faptei plus o cifră scoasă din adresa de
 * e-mail. Așa:
 *
 * - același om, în săptămâni diferite → variante diferite;
 * - doi oameni în aceeași zi → variante diferite, de la adresă;
 * - același mesaj compus de două ori (o retrimitere, proba din panou) →
 *   aceeași variantă, fiindcă nu intervine ceasul, ci ziua. Deci ce se vede
 *   la `/admin/emailuri` e exact ce a primit omul.
 *
 * **Listele au lungime impară**, dinadins. Două donații lunare sunt la ~4,35
 * săptămâni una de alta, deci indicele sare cu ~4 de fiecare dată; cu un număr
 * par de variante ar cădea mereu pe aceleași câteva poziții. Impar le parcurge
 * pe toate înainte să se repete.
 */

function indice(email: string, cand: Date): number {
  const zi = Number.isNaN(cand.getTime()) ? new Date() : cand;
  const saptamana = Math.floor(zi.getTime() / (7 * 24 * 3600 * 1000));
  const sare = (email ?? "")
    .toLowerCase()
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.abs(saptamana + sare);
}

/** Una dintre variante, aceeași pentru aceeași zi și aceeași adresă. */
export function alege<T>(variante: readonly T[], email: string, cand: Date): T {
  return variante[indice(email, cand) % variante.length];
}
