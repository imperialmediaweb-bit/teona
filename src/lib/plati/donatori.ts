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

/**
 * Metodele prin care intră bani fără să treacă prin site.
 *
 * Caietul cere ca asociația să-și vadă toate donațiile într-un loc, nu doar
 * pe cele cu cardul. Fără ele, totalul din panou ar fi mereu mai mic decât
 * cel real — iar un total în care nu ai încredere nu-l mai deschizi.
 *
 * Intră în același tabel `donatii`, cu `procesator` diferit, ca toate
 * calculele (totaluri, grafice, lista de donatori) să le vadă fără nicio
 * ramură specială.
 */
export const METODE_MANUALE = [
  { id: "manual-transfer", eticheta: "Transfer bancar" },
  { id: "manual-numerar", eticheta: "Numerar" },
  { id: "manual-sms", eticheta: "SMS" },
  { id: "manual-galantom", eticheta: "Galantom" },
  { id: "manual-altul", eticheta: "Altă cale" },
] as const;

export type MetodaManuala = (typeof METODE_MANUALE)[number]["id"];

export function esteMetodaManuala(x: unknown): x is MetodaManuala {
  return METODE_MANUALE.some((m) => m.id === x);
}

/** Eticheta metodei, pentru afișare. Procesatoarele își poartă numele. */
export function numeleMetodei(procesator: string): string {
  const manuala = METODE_MANUALE.find((m) => m.id === procesator);
  if (manuala) return manuala.eticheta;
  if (procesator === "stripe") return "Card (Stripe)";
  if (procesator === "paypal") return "PayPal";
  return procesator;
}

/**
 * Scrie o donație care n-a venit de la un procesator.
 *
 * `referinta` e ce scrie omul: numărul extrasului, al chitanței, data
 * transferului. Împreună cu `procesator` are o constrângere de unicitate, așa
 * că aceeași chitanță nu poate fi trecută de două ori — exact apărarea de
 * care e nevoie când datele se introduc de mână, dintr-un extras de cont.
 */
export async function adaugaDonatieManuala(date: {
  metoda: MetodaManuala;
  referinta: string;
  sumaBani: number;
  destinatie: string;
  data: string;
  email?: string;
  prenume?: string;
  nume?: string;
  telefon?: string;
  observatii?: string;
  adaugatDe?: string;
}): Promise<{ ok: true } | { ok: false; motiv: "duplicat" | "eroare" }> {
  try {
    const randuri = await intreaba<{ id: string }>(
      `INSERT INTO donatii
         (procesator, referinta, suma_bani, moneda, frecventa, destinatie,
          email, prenume, nume, telefon, stare, platita_la,
          observatii, adaugat_de)
       VALUES ($1,$2,$3,'RON','o-data',$4,$5,$6,$7,$8,'platita',$9,$10,$11)
       ON CONFLICT (procesator, referinta) DO NOTHING
       RETURNING id`,
      [
        date.metoda,
        date.referinta,
        date.sumaBani,
        date.destinatie,
        date.email ?? null,
        date.prenume ?? null,
        date.nume ?? null,
        date.telefon ?? null,
        date.data,
        date.observatii ?? null,
        date.adaugatDe ?? null,
      ],
    );
    return randuri.length > 0
      ? { ok: true }
      : { ok: false, motiv: "duplicat" };
  } catch {
    return { ok: false, motiv: "eroare" };
  }
}

export type Donatie = {
  id: string;
  procesator: string;
  referinta: string;
  sumaBani: number;
  moneda: string;
  frecventa: string;
  destinatie: string;
  email: string | null;
  nume: string | null;
  platitaLa: string;
  observatii: string | null;
};

/**
 * Donațiile una câte una, cea mai nouă prima.
 *
 * Lista de donatori arată totaluri; asta arată mișcările. E nevoie de
 * amândouă: când cineva întreabă „ce e suma asta din extras?”, răspunsul nu
 * se găsește într-un total.
 */
export async function donatii(limita = 100): Promise<Donatie[]> {
  const randuri = await intreaba<{
    id: string;
    procesator: string;
    referinta: string;
    suma_bani: string;
    moneda: string;
    frecventa: string;
    destinatie: string;
    email: string | null;
    prenume: string | null;
    nume: string | null;
    platita_la: Date | null;
    observatii: string | null;
  }>(
    `SELECT id, procesator, referinta, suma_bani, moneda, frecventa,
            destinatie, email, prenume, nume, platita_la, observatii
       FROM donatii
      WHERE stare = 'platita'
      ORDER BY platita_la DESC NULLS LAST
      LIMIT $1`,
    [limita],
  );
  return randuri.map((r) => ({
    id: r.id,
    procesator: r.procesator,
    referinta: r.referinta,
    sumaBani: Number(r.suma_bani),
    moneda: r.moneda,
    frecventa: r.frecventa,
    destinatie: r.destinatie,
    email: r.email,
    nume:
      [r.prenume, r.nume].filter(Boolean).join(" ").trim() || null,
    platitaLa: r.platita_la?.toISOString() ?? "",
    observatii: r.observatii,
  }));
}

/**
 * Tot ce vede un donator despre el însuși, în contul lui.
 *
 * Se cere mereu cu adresa luată din sesiunea verificată, niciodată dintr-un
 * parametru de adresă. Dacă vreodată cineva cheamă funcția asta cu un e-mail
 * venit de la utilizator, un om poate citi donațiile altuia.
 */
export type ContulMeu = {
  email: string;
  nume: string | null;
  totalBani: number;
  donatii: Donatie[];
  /** Prima și ultima donație, ISO. */
  primaLa: string;
  ultimaLa: string;
  /** Câte luni întregi au trecut de la prima donație. */
  luniDeAtunci: number;
  /** Are cel puțin o donație lunară. */
  areLunara: boolean;
  acordBuletin: boolean;
  /** Cât a mers pe fiecare destinație. */
  peDestinatii: Array<{ destinatie: string; bani: number }>;
};

export async function contulMeu(email: string): Promise<ContulMeu | null> {
  const lista = await intreaba<{
    id: string;
    procesator: string;
    referinta: string;
    suma_bani: string;
    moneda: string;
    frecventa: string;
    destinatie: string;
    prenume: string | null;
    nume: string | null;
    platita_la: Date | null;
    observatii: string | null;
    acord_buletin: boolean;
  }>(
    `SELECT id, procesator, referinta, suma_bani, moneda, frecventa,
            destinatie, prenume, nume, platita_la, observatii, acord_buletin
       FROM donatii
      WHERE email = $1 AND stare = 'platita'
      ORDER BY platita_la DESC NULLS LAST`,
    [email],
  );
  if (lista.length === 0) return null;

  const donatiile: Donatie[] = lista.map((r) => ({
    id: r.id,
    procesator: r.procesator,
    referinta: r.referinta,
    sumaBani: Number(r.suma_bani),
    moneda: r.moneda,
    frecventa: r.frecventa,
    destinatie: r.destinatie,
    email,
    nume: [r.prenume, r.nume].filter(Boolean).join(" ").trim() || null,
    platitaLa: r.platita_la?.toISOString() ?? "",
    observatii: r.observatii,
  }));

  const dateLe = lista
    .map((r) => r.platita_la)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  const prima = dateLe[0] ?? null;
  const ultima = dateLe[dateLe.length - 1] ?? null;

  // Luni întregi, calculate pe an și lună, nu prin împărțirea
  // milisecundelor: 30 de zile nu sunt o lună, iar diferența se vede după
  // câțiva ani ca o lună în plus.
  let luni = 0;
  if (prima) {
    const acum = new Date();
    luni =
      (acum.getFullYear() - prima.getFullYear()) * 12 +
      (acum.getMonth() - prima.getMonth());
    if (acum.getDate() < prima.getDate()) luni -= 1;
    luni = Math.max(0, luni);
  }

  const peDestinatii = new Map<string, number>();
  for (const d of donatiile) {
    peDestinatii.set(
      d.destinatie,
      (peDestinatii.get(d.destinatie) ?? 0) + d.sumaBani,
    );
  }

  return {
    email,
    // Numele cel mai recent pe care l-a scris el, nu primul.
    nume: donatiile.find((d) => d.nume)?.nume ?? null,
    totalBani: donatiile.reduce((s, d) => s + d.sumaBani, 0),
    donatii: donatiile,
    primaLa: prima?.toISOString() ?? "",
    ultimaLa: ultima?.toISOString() ?? "",
    luniDeAtunci: luni,
    areLunara: donatiile.some((d) => d.frecventa === "lunar"),
    acordBuletin: lista.some((r) => r.acord_buletin),
    peDestinatii: [...peDestinatii.entries()]
      .map(([destinatie, bani]) => ({ destinatie, bani }))
      .sort((a, b) => b.bani - a.bani),
  };
}

/** Există vreo donație încasată pe adresa asta? Fără a scoate date. */
export async function areDonatii(email: string): Promise<boolean> {
  const randuri = await intreaba<{ unu: number }>(
    "SELECT 1 AS unu FROM donatii WHERE email = $1 AND stare = 'platita' LIMIT 1",
    [email],
  );
  return randuri.length > 0;
}

/** Schimbă acordul pentru buletinul informativ, din contul donatorului. */
export async function schimbaAcordul(
  email: string,
  acord: boolean,
): Promise<void> {
  await intreaba(
    "UPDATE donatii SET acord_buletin = $2 WHERE email = $1",
    [email, acord],
  );
}
