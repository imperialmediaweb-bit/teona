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
 * chemat din pagini publice, cu o singură excepție: `anuntaTransfer`, prin
 * care donatorul își anunță singur transferul bancar. Aceea doar scrie — nu
 * citește nimic înapoi către cel care a trimis formularul.
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
export type Filtru =
  | "toti"
  | "lunari"
  | "opriti"
  | "mari"
  | "cu-acord"
  | "fara-acord"
  | "neduși";

const CONDITII: Record<Filtru, string> = {
  toti: "TRUE",
  lunari: "SUM(CASE WHEN d.frecventa = 'lunar' THEN 1 ELSE 0 END) > 0",
  /*
    S-au oprit: au dat de cel puțin două ori, dar nu în ultimele patru luni.

    E lista cu care un fundraiser începe săptămâna. Cine a dat o singură dată
    acum un an nu s-a „oprit" — n-a început. Cine a dat de trei ori și a
    tăcut patru luni s-a oprit, și de obicei dintr-un motiv care se poate
    afla cu un telefon.
  */
  opriti: "COUNT(*) > 1 AND MAX(d.platita_la) < now() - interval '4 months'",
  /*
    Donatori mari: peste 1.000 de lei adunat.

    Pragul e ales, nu calculat, și e scris aici ca să poată fi schimbat
    într-un singur loc când asociația spune altul.
  */
  mari: "SUM(d.suma_bani) FILTER (WHERE d.moneda = 'RON') >= 100000",
  "cu-acord": "bool_or(d.acord_buletin)",
  "fara-acord": "NOT bool_or(d.acord_buletin)",
  // Au bifat acordul, dar n-au ajuns încă în MailerLite — de obicei pentru că
  // cheia a venit după ce au donat ei.
  neduși: "bool_or(d.acord_buletin) AND NOT bool_or(d.dus_la_buletin)",
};

export async function donatori(
  filtru: Filtru = "toti",
  cautare = "",
  limita = 200,
): Promise<Donator[]> {
  // `hasOwn`, nu `??`: un `filtru` ca „constructor” ar găsi o proprietate
  // moștenită și ar pune-o în SQL. Azi pagina filtrează înainte; funcția nu
  // trebuie să depindă de asta.
  const conditie = Object.hasOwn(CONDITII, filtru)
    ? CONDITII[filtru]
    : CONDITII.toti;
  const randuri = await intreaba<Rand>(
    `SELECT
        d.email,
        -- Numele cel mai recent pe care l-a scris omul, nu primul: dacă s-a
        -- corectat la a doua donație, versiunea bună e ultima.
        (ARRAY_AGG(NULLIF(TRIM(CONCAT_WS(' ', d.prenume, d.nume)), '')
                   ORDER BY d.platita_la DESC NULLS LAST))[1] AS nume,
        (ARRAY_AGG(d.telefon ORDER BY d.platita_la DESC NULLS LAST))[1] AS telefon,
        -- Numai lei: suma_bani ține bani sau cenți, după monedă, iar un
        -- PayPal de 25 € adunat aici s-ar fi numărat ca 25 de lei.
        SUM(d.suma_bani) FILTER (WHERE d.moneda = 'RON')        AS total_bani,
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
        -- Totalurile sunt în lei. Donațiile în altă monedă se văd separat,
        -- cu peMonede(): nu există curs de schimb ales de noi.
        SUM(suma_bani) FILTER (WHERE moneda = 'RON')     AS total_bani,
        COUNT(DISTINCT email)                            AS nr_donatori,
        COUNT(DISTINCT email) FILTER (WHERE frecventa = 'lunar') AS nr_lunari,
        -- Marginea de sus face ca „luna asta" să însemne chiar luna asta: o
        -- donație trecută de mână cu dată în viitor cădea altfel în total,
        -- dar lipsea din graficul lunar, iar tabloul nu se mai potrivea cu
        -- el însuși.
        SUM(suma_bani) FILTER (
          WHERE moneda = 'RON'
            AND platita_la >= date_trunc('month', now())
            AND platita_la < date_trunc('month', now()) + interval '1 month'
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

  /*
    Jurnalul discuțiilor și jetoanele de intrare.

    Lipseau: jurnalul a fost scris după funcția asta, și n-a fost adăugat
    aici. Un rând din `interactiuni` poartă adresa omului **și** ce a scris
    cineva din asociație despre el — „a sunat supărat", „nu mai vrea
    telefoane". Exact genul de text pentru care omul cere ștergerea, lăsat în
    urmă de o funcție care-i spunea că l-a șters.

    Jetoanele ar fi expirat oricum în șapte zile, dar până atunci ar fi
    păstrat adresa. Dacă a cerut ștergerea, se duce și ea acum.
  */
  await intreaba("DELETE FROM interactiuni WHERE email = $1", [email]).catch(
    () => undefined,
  );
  await intreaba("DELETE FROM jetoane_cont WHERE email = $1", [email]).catch(
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
  if (procesator === TRANSFER_ANUNTAT)
    return "Transfer bancar (anunțat pe site)";
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
    return randuri.length > 0 ? { ok: true } : { ok: false, motiv: "duplicat" };
  } catch {
    return { ok: false, motiv: "eroare" };
  }
}

/*
  Transferul bancar anunțat de donator.

  Site-ul nu vede contul din bancă: nu există API, iar extrasul se citește de
  om. Până acum, un transfer era invizibil până când cineva îl bătea de mână
  din extras — iar donatorul n-avea nicio urmă că a dat, deci nici mulțumire,
  nici loc în evidență.

  Acum, cine face transferul poate bifa pe site că l-a făcut. Anunțul intră în
  același tabel `donatii`, dar cu starea `anuntata`:

  - **nu intră în niciun total** și nu apare în listele de donații. Toate
    interogările cer `stare = 'platita'`, iar aici asta ar fi o minciună:
    nimeni n-a văzut încă banii. Altfel, oricine ar putea umfla raportul
    anual dintr-un formular public;
  - apare în panou, la „Transferuri anunțate", unde se potrivește cu extrasul
    și se confirmă sau se respinge. Confirmarea îi schimbă starea în
    `platita` și de atunci se numără la fel ca orice donație.

  Data scrisă de donator intră în `platita_la` de la început: starea o ține
  deoparte din calcule, deci nu strică nimic, iar la confirmare nu mai e
  nevoie să ghicească nimeni când a fost transferul.
*/
export const TRANSFER_ANUNTAT = "transfer-anuntat";

export async function anuntaTransfer(date: {
  referinta: string;
  sumaBani: number;
  destinatie: string;
  data: string;
  email?: string;
  nume?: string;
  telefon?: string;
  observatii?: string;
  /** Canalul din care a venit donatorul (`src/lib/atribuire.ts`). */
  canal?: string | null;
  sursa?: string | null;
}): Promise<{ ok: true } | { ok: false; motiv: "duplicat" | "eroare" }> {
  try {
    const randuri = await intreaba<{ id: string }>(
      `INSERT INTO donatii
         (procesator, referinta, suma_bani, moneda, frecventa, destinatie,
          email, prenume, nume, telefon, stare, platita_la,
          observatii, adaugat_de, canal, sursa)
       VALUES ($1,$2,$3,'RON','o-data',$4,$5,NULL,$6,$7,'anuntata',$8,$9,'donator',$10,$11)
       ON CONFLICT (procesator, referinta) DO NOTHING
       RETURNING id`,
      [
        TRANSFER_ANUNTAT,
        date.referinta,
        date.sumaBani,
        date.destinatie,
        date.email ?? null,
        date.nume ?? null,
        date.telefon ?? null,
        date.data,
        date.observatii ?? null,
        date.canal ?? null,
        date.sursa ?? null,
      ],
    );
    return randuri.length > 0 ? { ok: true } : { ok: false, motiv: "duplicat" };
  } catch {
    return { ok: false, motiv: "eroare" };
  }
}

export type TransferAnuntat = {
  id: string;
  sumaBani: number;
  destinatie: string;
  email: string | null;
  nume: string | null;
  telefon: string | null;
  observatii: string | null;
  cand: string;
  anuntatLa: string;
};

/** Transferurile anunțate de donatori și încă necontrolate în extras. */
export async function transferuriAnuntate(): Promise<TransferAnuntat[]> {
  const randuri = await intreaba<{
    id: string;
    suma_bani: string;
    destinatie: string;
    email: string | null;
    nume: string | null;
    telefon: string | null;
    observatii: string | null;
    platita_la: Date | null;
    creat_la: Date;
  }>(
    `SELECT id, suma_bani, destinatie, email, nume, telefon, observatii,
            platita_la, creat_la
       FROM donatii
      WHERE stare = 'anuntata'
      ORDER BY creat_la DESC
      LIMIT 200`,
  );
  return randuri.map((r) => ({
    id: r.id,
    sumaBani: Number(r.suma_bani),
    destinatie: r.destinatie,
    email: r.email,
    nume: r.nume,
    telefon: r.telefon,
    observatii: r.observatii,
    cand: r.platita_la?.toISOString() ?? r.creat_la.toISOString(),
    anuntatLa: r.creat_la.toISOString(),
  }));
}

/** Câte transferuri anunțate așteaptă controlul în extras. */
export async function cateTransferuriAnuntate(): Promise<number> {
  const randuri = await intreaba<{ cate: string }>(
    "SELECT count(*) AS cate FROM donatii WHERE stare = 'anuntata'",
  );
  return Number(randuri[0]?.cate ?? 0);
}

/**
 * Confirmă sau respinge un transfer anunțat.
 *
 * Cere starea `anuntata` în `WHERE`, deci a doua apăsare pe buton nu mai
 * schimbă nimic: dacă doi oameni deschid panoul deodată, al doilea află că
 * n-a mai avut ce să confirme.
 *
 * Întoarce datele rândului, nu doar „s-a schimbat": din ele se scrie
 * mulțumirea către donator. `RETURNING` pe același `UPDATE`, nu un `SELECT`
 * după, ca mulțumirea să plece o singură dată — exact pentru apăsarea care a
 * schimbat starea, nu pentru a doua.
 */
export async function hotarasteTransfer(
  id: string,
  confirmat: boolean,
): Promise<{
  email: string | null;
  nume: string | null;
  sumaBani: number;
  destinatie: string;
  cand: string;
} | null> {
  const randuri = await intreaba<{
    email: string | null;
    nume: string | null;
    suma_bani: string;
    destinatie: string;
    platita_la: Date | null;
  }>(
    `UPDATE donatii
        SET stare = $2,
            platita_la = CASE WHEN $2 = 'platita'
                              THEN COALESCE(platita_la, now())
                              ELSE platita_la END
      WHERE id = $1 AND stare = 'anuntata'
      RETURNING email, nume, suma_bani, destinatie, platita_la`,
    [id, confirmat ? "platita" : "respinsa"],
  );
  const r = randuri[0];
  if (!r) return null;
  return {
    email: r.email,
    nume: r.nume,
    sumaBani: Number(r.suma_bani),
    destinatie: r.destinatie,
    cand: r.platita_la?.toISOString() ?? new Date().toISOString(),
  };
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
    nume: [r.prenume, r.nume].filter(Boolean).join(" ").trim() || null,
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
  /**
   * Cât a dăruit, pe fiecare monedă.
   *
   * Nu un singur total: cine a dat 100 de lei prin card și 25 € prin PayPal
   * n-a dat „125". Nu convertim — cursul care contează e al băncii lui, în
   * ziua plății, și n-avem de unde să-l știm.
   */
  totaluri: Array<{ moneda: string; bani: number }>;
  donatii: Donatie[];
  /** Prima și ultima donație, ISO. */
  primaLa: string;
  ultimaLa: string;
  /** Câte luni întregi au trecut de la prima donație. */
  luniDeAtunci: number;
  /** Are cel puțin o donație lunară. */
  areLunara: boolean;
  acordBuletin: boolean;
  /** Cât a mers pe fiecare destinație, pe monedă. */
  peDestinatii: Array<{ destinatie: string; bani: number; moneda: string }>;
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

  const totaluri = new Map<string, number>();
  for (const d of donatiile) {
    totaluri.set(d.moneda, (totaluri.get(d.moneda) ?? 0) + d.sumaBani);
  }

  // Destinațiile se adună pe (destinație, monedă): altfel 25 € și 25 de lei
  // pentru aceeași destinație ar ieși „50".
  const peDestinatii = new Map<string, { bani: number; moneda: string }>();
  for (const d of donatiile) {
    const cheie = `${d.destinatie}|${d.moneda}`;
    const intrare = peDestinatii.get(cheie) ?? { bani: 0, moneda: d.moneda };
    intrare.bani += d.sumaBani;
    peDestinatii.set(cheie, intrare);
  }

  return {
    email,
    // Numele cel mai recent pe care l-a scris el, nu primul.
    nume: donatiile.find((d) => d.nume)?.nume ?? null,
    totaluri: [...totaluri.entries()]
      .map(([moneda, bani]) => ({ moneda, bani }))
      .sort((a, b) => (a.moneda === "RON" ? -1 : b.moneda === "RON" ? 1 : 0)),
    donatii: donatiile,
    primaLa: prima?.toISOString() ?? "",
    ultimaLa: ultima?.toISOString() ?? "",
    luniDeAtunci: luni,
    areLunara: donatiile.some((d) => d.frecventa === "lunar"),
    acordBuletin: lista.some((r) => r.acord_buletin),
    peDestinatii: [...peDestinatii.entries()]
      .map(([cheie, v]) => ({
        destinatie: cheie.split("|")[0],
        bani: v.bani,
        moneda: v.moneda,
      }))
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
  await intreaba("UPDATE donatii SET acord_buletin = $2 WHERE email = $1", [
    email,
    acord,
  ]);
}
