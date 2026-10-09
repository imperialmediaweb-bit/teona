import { intreaba } from "@/lib/baza";

/**
 * Evidența donatorilor (CRM).
 *
 * Donatorii nu se țin într-un tabel al lor, ci se calculează din donații, la
 * fiecare citire. Motivul e prozaic: un tabel separat trebuie ținut în pas cu
 * donațiile, iar fiecare loc în care se uită actualizarea produce un donator
 * cu un total greșit. Calculul din sursă nu poate rămâne în urmă.
 *
 * Ce nu se calculează — notițele asociației despre un om — stă într-un tabel
 * mic, legat prin e-mail.
 *
 * Totul aici sunt date personale și financiare. Nimic din fișierul ăsta nu e
 * chemat din pagini publice.
 */

export type Donator = {
  email: string;
  nume: string | null;
  telefon: string | null;
  totalBani: number;
  donatii: number;
  lunare: number;
  primaLa: string;
  ultimaLa: string;
  acordBuletin: boolean;
  dusLaBuletin: boolean;
  notita: string | null;
};

type Rand = {
  email: string;
  nume: string | null;
  telefon: string | null;
  total_bani: string;
  nr_donatii: string;
  nr_lunare: string;
  prima_la: Date;
  ultima_la: Date;
  acord_buletin: boolean;
  dus_la_buletin: boolean;
  notita: string | null;
};

/** Filtrele listei. Fiecare răspunde la o întrebare pe care chiar o pune cineva. */
export type Filtru = "toti" | "lunari" | "cu-acord" | "fara-acord" | "neduși";

const CONDITII: Record<Filtru, string> = {
  toti: "TRUE",
  lunari: "SUM(CASE WHEN d.frecventa = 'lunar' THEN 1 ELSE 0 END) > 0",
  "cu-acord": "bool_or(d.acord_buletin)",
  "fara-acord": "NOT bool_or(d.acord_buletin)",
  // Au bifat acordul, dar n-au ajuns încă în MailerLite — de obicei pentru că
  // cheia a venit după ce au donat ei.
  "neduși": "bool_or(d.acord_buletin) AND NOT bool_or(d.dus_la_buletin)",
};

export async function donatori(
  filtru: Filtru = "toti",
  cautare = "",
  limita = 200,
): Promise<Donator[]> {
  const conditie = CONDITII[filtru] ?? CONDITII.toti;
  const randuri = await intreaba<Rand>(
    `SELECT
        d.email,
        -- Numele cel mai recent pe care l-a scris omul, nu primul: dacă s-a
        -- corectat la a doua donație, versiunea bună e ultima.
        (ARRAY_AGG(NULLIF(TRIM(CONCAT_WS(' ', d.prenume, d.nume)), '')
                   ORDER BY d.platita_la DESC NULLS LAST))[1] AS nume,
        (ARRAY_AGG(d.telefon ORDER BY d.platita_la DESC NULLS LAST))[1] AS telefon,
        SUM(d.suma_bani)                                        AS total_bani,
        COUNT(*)                                                AS nr_donatii,
        SUM(CASE WHEN d.frecventa = 'lunar' THEN 1 ELSE 0 END)  AS nr_lunare,
        MIN(d.platita_la)                                       AS prima_la,
        MAX(d.platita_la)                                       AS ultima_la,
        bool_or(d.acord_buletin)                                AS acord_buletin,
        bool_or(d.dus_la_buletin)                               AS dus_la_buletin,
        MAX(n.text)                                             AS notita
       FROM donatii d
       LEFT JOIN note_donatori n ON n.email = d.email
      WHERE d.stare = 'platita'
        AND d.email IS NOT NULL
        AND ($2 = '' OR d.email ILIKE '%' || $2 || '%'
             OR CONCAT_WS(' ', d.prenume, d.nume) ILIKE '%' || $2 || '%')
      GROUP BY d.email
     HAVING ${conditie}
      ORDER BY MAX(d.platita_la) DESC
      LIMIT $1`,
    [limita, cautare],
  );

  return randuri.map((r) => ({
    email: r.email,
    nume: r.nume,
    telefon: r.telefon,
    totalBani: Number(r.total_bani),
    donatii: Number(r.nr_donatii),
    lunare: Number(r.nr_lunare),
    primaLa: r.prima_la?.toISOString() ?? "",
    ultimaLa: r.ultima_la?.toISOString() ?? "",
    acordBuletin: r.acord_buletin,
    dusLaBuletin: r.dus_la_buletin,
    notita: r.notita,
  }));
}

/** Cifrele de sus: total strâns, câți donatori, câți lunari, cât luna asta. */
export async function rezumat(): Promise<{
  totalBani: number;
  donatori: number;
  lunari: number;
  lunaAsta: number;
}> {
  const randuri = await intreaba<{
    total_bani: string | null;
    nr_donatori: string;
    nr_lunari: string;
    luna_asta: string | null;
  }>(
    `SELECT
        SUM(suma_bani)                                   AS total_bani,
        COUNT(DISTINCT email)                            AS nr_donatori,
        COUNT(DISTINCT email) FILTER (WHERE frecventa = 'lunar') AS nr_lunari,
        SUM(suma_bani) FILTER (
          WHERE platita_la >= date_trunc('month', now())
        )                                                AS luna_asta
       FROM donatii
      WHERE stare = 'platita'`,
  );
  const r = randuri[0];
  return {
    totalBani: Number(r?.total_bani ?? 0),
    donatori: Number(r?.nr_donatori ?? 0),
    lunari: Number(r?.nr_lunari ?? 0),
    lunaAsta: Number(r?.luna_asta ?? 0),
  };
}

export async function scrieNotita(email: string, text: string): Promise<void> {
  await intreaba(
    `INSERT INTO note_donatori (email, text, scris_la)
     VALUES ($1, $2, now())
     ON CONFLICT (email) DO UPDATE SET text = $2, scris_la = now()`,
    [email, text],
  );
}

/**
 * Dreptul la ștergere (art. 17 GDPR).
 *
 * Nu ștergem rândul donației: asociația are obligația legală să păstreze
 * evidența contabilă, iar o donație ștearsă ar lăsa o gaură în ea. Ștergem
 * ce face donația identificabilă — nume, e-mail, telefon — și păstrăm suma,
 * data și destinația. Omul dispare din evidență; banii rămân în contabilitate.
 */
export async function uitaDonatorul(email: string): Promise<number> {
  const randuri = await intreaba<{ id: string }>(
    `UPDATE donatii
        SET email = NULL, prenume = NULL, nume = NULL, telefon = NULL,
            acord_buletin = false
      WHERE email = $1
      RETURNING id`,
    [email],
  );
  await intreaba("DELETE FROM note_donatori WHERE email = $1", [email]).catch(
    () => undefined,
  );
  return randuri.length;
}
