import { intreaba } from "./baza";

/**
 * Cifrele din tabloul de bord.
 *
 * Toate se calculează din `donatii`, `firme` și `cereri`, la fiecare citire.
 * Nu există tabel de rezumate: pentru volumul unei asociații mici — mii de
 * rânduri, nu milioane — Postgres le face instantaneu, iar un rezumat ținut
 * separat ar putea rămâne în urmă fără ca nimeni să observe.
 *
 * Lunile goale se completează aici, în cod, nu în SQL. O lună fără donații
 * nu produce niciun rând, iar un grafic care sare peste februarie pentru că
 * n-a intrat niciun ban minte despre formă: pare o creștere continuă.
 */

export type Luna = {
  /** „2026-03” */
  luna: string;
  /** Eticheta scurtă, pentru axa graficului: „mar. 26”. */
  eticheta: string;
  bani: number;
  donatii: number;
  donatoriNoi: number;
};

const LUNI_SCURT = [
  "ian.",
  "feb.",
  "mar.",
  "apr.",
  "mai",
  "iun.",
  "iul.",
  "aug.",
  "sep.",
  "oct.",
  "nov.",
  "dec.",
];

function eticheta(luna: string): string {
  const [an, lunaNr] = luna.split("-");
  return `${LUNI_SCURT[Number(lunaNr) - 1]} ${an.slice(2)}`;
}

/** Lista lunilor, de acum înapoi, inclusiv cele fără nicio donație. */
function ultimeleLuni(cate: number): string[] {
  const azi = new Date();
  const luni: string[] = [];
  for (let i = cate - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(azi.getUTCFullYear(), azi.getUTCMonth() - i, 1));
    luni.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return luni;
}

export async function peLuni(cate = 12): Promise<Luna[]> {
  const randuri = await intreaba<{
    luna: string;
    bani: string;
    nr: string;
  }>(
    `SELECT to_char(date_trunc('month', platita_la), 'YYYY-MM') AS luna,
            SUM(suma_bani) AS bani,
            COUNT(*)       AS nr
       FROM donatii
      WHERE stare = 'platita'
        AND platita_la >= date_trunc('month', now()) - make_interval(months => $1)
      GROUP BY 1`,
    [cate - 1],
  );

  /*
    Donatorii noi: luna primei lor donații.

    Se calculează separat, cu un `MIN` pe e-mail, pentru că „nou” nu se poate
    afla dintr-un rând singur — depinde de tot istoricul omului. Donațiile
    fără e-mail (numerar, SMS) nu se pot atribui nimănui, deci nu intră.
  */
  const noi = await intreaba<{ luna: string; nr: string }>(
    `SELECT to_char(date_trunc('month', prima), 'YYYY-MM') AS luna,
            COUNT(*) AS nr
       FROM (SELECT email, MIN(platita_la) AS prima
               FROM donatii
              WHERE stare = 'platita' AND email IS NOT NULL
              GROUP BY email) p
      WHERE prima >= date_trunc('month', now()) - make_interval(months => $1)
      GROUP BY 1`,
    [cate - 1],
  );

  const bani = new Map(randuri.map((r) => [r.luna, r]));
  const primii = new Map(noi.map((r) => [r.luna, Number(r.nr)]));

  return ultimeleLuni(cate).map((luna) => ({
    luna,
    eticheta: eticheta(luna),
    bani: Number(bani.get(luna)?.bani ?? 0),
    donatii: Number(bani.get(luna)?.nr ?? 0),
    donatoriNoi: primii.get(luna) ?? 0,
  }));
}

export type Felie = { eticheta: string; bani: number; nr: number };

/** Cât a intrat pe fiecare destinație. */
export async function peDestinatii(): Promise<Felie[]> {
  const randuri = await intreaba<{
    destinatie: string;
    bani: string;
    nr: string;
  }>(
    `SELECT destinatie, SUM(suma_bani) AS bani, COUNT(*) AS nr
       FROM donatii WHERE stare = 'platita'
      GROUP BY destinatie ORDER BY SUM(suma_bani) DESC`,
  );
  return randuri.map((r) => ({
    eticheta: r.destinatie,
    bani: Number(r.bani),
    nr: Number(r.nr),
  }));
}

/** Cât a intrat pe fiecare cale: card, PayPal, transfer, numerar… */
export async function peMetode(): Promise<Felie[]> {
  const randuri = await intreaba<{
    procesator: string;
    bani: string;
    nr: string;
  }>(
    `SELECT procesator, SUM(suma_bani) AS bani, COUNT(*) AS nr
       FROM donatii WHERE stare = 'platita'
      GROUP BY procesator ORDER BY SUM(suma_bani) DESC`,
  );
  return randuri.map((r) => ({
    eticheta: r.procesator,
    bani: Number(r.bani),
    nr: Number(r.nr),
  }));
}

/** O dată versus lunar, ca să se vadă cât din venit e previzibil. */
export async function peFrecventa(): Promise<Felie[]> {
  const randuri = await intreaba<{
    frecventa: string;
    bani: string;
    nr: string;
  }>(
    `SELECT frecventa, SUM(suma_bani) AS bani, COUNT(*) AS nr
       FROM donatii WHERE stare = 'platita'
      GROUP BY frecventa`,
  );
  return randuri.map((r) => ({
    eticheta: r.frecventa === "lunar" ? "Lunar" : "O singură dată",
    bani: Number(r.bani),
    nr: Number(r.nr),
  }));
}

/** Câte firme sunt în fiecare stadiu, pentru pâlnia de sponsorizări. */
export async function palniaFirmelor(): Promise<
  Array<{ stadiu: string; nr: number }>
> {
  const randuri = await intreaba<{ stadiu: string; nr: string }>(
    "SELECT stadiu, COUNT(*) AS nr FROM firme GROUP BY stadiu",
  );
  return randuri.map((r) => ({ stadiu: r.stadiu, nr: Number(r.nr) }));
}

/** Câte cereri așteaptă, pe fel. Asta e lista de treabă a zilei. */
export async function cereriDeLucru(): Promise<
  Array<{ fel: string; nr: number }>
> {
  const randuri = await intreaba<{ fel: string; nr: string }>(
    "SELECT fel, COUNT(*) AS nr FROM cereri WHERE stadiu <> 'rezolvat' GROUP BY fel",
  );
  return randuri.map((r) => ({ fel: r.fel, nr: Number(r.nr) }));
}

/**
 * Apăsările pe linkurile care duc în afara site-ului.
 *
 * Pentru Revolut și Galantom asta e tot ce se poate ști: banii nu trec pe
 * aici, deci numărăm intenția, nu donația. Scris așa și în panou, ca nimeni
 * să nu adune cifra asta la totalul donațiilor.
 */
export async function apasariPeLuna(
  cate = 6,
): Promise<Array<{ ce: string; nr: number }>> {
  const randuri = await intreaba<{ ce: string; nr: string }>(
    `SELECT ce, COUNT(*) AS nr FROM apasari
      WHERE cand >= date_trunc('month', now()) - make_interval(months => $1)
      GROUP BY ce ORDER BY COUNT(*) DESC`,
    [cate - 1],
  );
  return randuri.map((r) => ({ ce: r.ce, nr: Number(r.nr) }));
}
