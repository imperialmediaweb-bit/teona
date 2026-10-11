import { intreaba } from "@/lib/baza";
import type { Frecventa } from "@/date/plati";

/**
 * Evidența donațiilor.
 *
 * Rândul se scrie de două ori: o dată când omul pleacă spre procesator
 * („initiata”) și o dată când procesatorul confirmă că banii au intrat
 * („platita”). Nu invers: o donație nu se consideră încasată pentru că
 * browserul s-a întors pe pagina de mulțumire — adresa aia o poate deschide
 * oricine. Singura dovadă e mesajul semnat al procesatorului.
 */

export type DonatieNoua = {
  procesator: string;
  referinta: string;
  sumaBani: number;
  moneda: string;
  frecventa: Frecventa;
  destinatie: string;
  email: string | null;
  prenume: string | null;
  nume: string | null;
  telefon: string | null;
  acordBuletin: boolean;
  campanieSlug?: string | null;
};

export async function scrieInitiata(d: DonatieNoua): Promise<void> {
  await intreaba(
    `INSERT INTO donatii
       (procesator, referinta, suma_bani, moneda, frecventa, destinatie,
        email, prenume, nume, telefon, acord_buletin, campanie_slug)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (procesator, referinta) DO NOTHING`,
    [
      d.procesator,
      d.referinta,
      d.sumaBani,
      d.moneda,
      d.frecventa,
      d.destinatie,
      d.email,
      d.prenume,
      d.nume,
      d.telefon,
      d.acordBuletin,
      d.campanieSlug ?? null,
    ],
  );
}

export type DonatieIncasata = {
  email: string | null;
  acord_buletin: boolean;
  prenume: string | null;
  nume: string | null;
  suma_bani: string | number;
  moneda: string;
  frecventa: string;
  destinatie: string;
};

/**
 * Marchează plata ca încasată. Întoarce rândul, dacă a fost schimbat acum.
 *
 * `stare <> 'platita'` în condiție nu e de prisos: dacă același eveniment
 * ajunge de două ori, a doua oară nu se schimbă nimic, nu se întoarce niciun
 * rând, și omul nu primește două mulțumiri pentru o singură donație.
 */
export async function marcheazaPlatita(
  procesator: string,
  referinta: string,
  sumaBani?: number,
): Promise<DonatieIncasata | null> {
  const randuri = await intreaba<DonatieIncasata>(
    `UPDATE donatii
        SET stare = 'platita',
            platita_la = now(),
            suma_bani = COALESCE($3, suma_bani)
      WHERE procesator = $1 AND referinta = $2 AND stare <> 'platita'
      RETURNING email, acord_buletin, prenume, nume,
                suma_bani, moneda, frecventa, destinatie`,
    [procesator, referinta, sumaBani ?? null],
  );
  return randuri[0] ?? null;
}

/**
 * Înregistrează un eveniment ca prelucrat.
 *
 * Întoarce `true` doar prima dată. Procesatoarele retrimit același eveniment
 * până primesc 200, iar două livrări în paralel sunt posibile — `INSERT` cu
 * cheie primară le desparte fără blocaje și fără citire înainte de scriere.
 */
export async function evenimentNou(
  procesator: string,
  eveniment: string,
): Promise<boolean> {
  const randuri = await intreaba<{ eveniment: string }>(
    `INSERT INTO evenimente_plati (procesator, eveniment)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING eveniment`,
    [procesator, eveniment],
  );
  return randuri.length > 0;
}
