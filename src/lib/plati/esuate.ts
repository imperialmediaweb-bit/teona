import { intreaba } from "@/lib/baza";

/**
 * Evidența plăților lunare care n-au trecut.
 *
 * Nu e o evidență contabilă — banii ăștia n-au intrat niciodată. E lista de
 * telefoane: cine a vrut să doneze luna asta și n-a putut, ca să-l sune
 * cineva până nu se oprește abonamentul de tot.
 */

export type PlataEsuataNoua = {
  factura: string;
  abonament: string | null;
  client: string | null;
  email: string | null;
  prenume: string | null;
  sumaBani: number;
  moneda: string;
  destinatie: string | null;
  motiv: string | null;
};

/**
 * Scrie eșecul. Întoarce `true` numai prima dată pentru factura asta.
 *
 * `xmax = 0` e felul în care Postgres spune „rândul ăsta s-a născut acum, nu
 * s-a actualizat". Pe el atârnă mesajul către donator: Stripe reîncearcă
 * plata de câteva ori, iar patru mesaje despre același card nu se citesc —
 * al treilea se marchează ca spam, și pierdem și donatorul, și adresa.
 */
export async function scriePlataEsuata(d: PlataEsuataNoua): Promise<boolean> {
  const randuri = await intreaba<{ nou: boolean }>(
    `INSERT INTO plati_esuate
       (factura, abonament, client, email, prenume, suma_bani, moneda,
        destinatie, motiv)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (factura) DO UPDATE
       SET incercari = plati_esuate.incercari + 1,
           motiv = COALESCE(EXCLUDED.motiv, plati_esuate.motiv)
     RETURNING (xmax = 0) AS nou`,
    [
      d.factura,
      d.abonament,
      d.client,
      d.email,
      d.prenume,
      d.sumaBani,
      d.moneda,
      d.destinatie,
      d.motiv,
    ],
  );
  return randuri[0]?.nou === true;
}

/**
 * Plata a trecut până la urmă: rândurile abonamentului se închid.
 *
 * Fără asta, lista de telefoane ar ține oameni care și-au schimbat deja
 * cardul — iar o listă în care jumătate din rânduri sunt rezolvate nu se mai
 * deschide de nimeni.
 */
export async function rezolvaPlatileEsuate(abonament: string): Promise<void> {
  await intreaba(
    "UPDATE plati_esuate SET rezolvat = true WHERE abonament = $1 AND rezolvat = false",
    [abonament],
  );
}

export type PlataEsuataRand = {
  id: string;
  email: string | null;
  prenume: string | null;
  sumaBani: number;
  moneda: string;
  destinatie: string | null;
  motiv: string | null;
  incercari: number;
  creatLa: string;
};

export async function platiEsuate(limita = 30): Promise<PlataEsuataRand[]> {
  const randuri = await intreaba<{
    id: string;
    email: string | null;
    prenume: string | null;
    suma_bani: string | number;
    moneda: string;
    destinatie: string | null;
    motiv: string | null;
    incercari: number;
    creat_la: Date;
  }>(
    `SELECT id, email, prenume, suma_bani, moneda, destinatie, motiv,
            incercari, creat_la
       FROM plati_esuate
      WHERE rezolvat = false
      ORDER BY creat_la DESC
      LIMIT $1`,
    [limita],
  );
  return randuri.map((r) => ({
    id: r.id,
    email: r.email,
    prenume: r.prenume,
    sumaBani: Number(r.suma_bani),
    moneda: r.moneda,
    destinatie: r.destinatie,
    motiv: r.motiv,
    incercari: Number(r.incercari),
    creatLa: new Date(r.creat_la).toISOString(),
  }));
}

/** Câte așteaptă un telefon. Pentru „De făcut acum". */
export async function catePlatiEsuate(): Promise<number> {
  const randuri = await intreaba<{ nr: string }>(
    "SELECT count(*) AS nr FROM plati_esuate WHERE rezolvat = false",
  );
  return Number(randuri[0]?.nr ?? 0);
}
