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
 *
 * **Toate cifrele de aici sunt în lei, și numai în lei.** Donațiile prin
 * PayPal intră în euro, iar `suma_bani` ține bani sau cenți, după monedă.
 * Adunate la grămadă, 25 € s-ar fi numărat ca 25 de lei: cifra din raportul
 * anual ar fi fost greșită, fără ca nimic să arate asta. De aceea fiecare
 * interogare filtrează pe `moneda = 'RON'`, iar euro se arată separat, cu
 * `peMonede()` — niciun curs de schimb nu e ales de noi.
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
      WHERE stare = 'platita' AND moneda = 'RON'
        AND platita_la >= date_trunc('month', now()) - make_interval(months => $1)
        -- Margine de sus: o donație trecută de mână cu dată în viitor ar
        -- cădea într-o lună care nu există în lista de mai jos, deci ar
        -- dispărea din grafic dar ar rămâne în total.
        AND platita_la < date_trunc('month', now()) + interval '1 month'
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
              WHERE stare = 'platita' AND moneda = 'RON' AND email IS NOT NULL
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
       FROM donatii WHERE stare = 'platita' AND moneda = 'RON'
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
       FROM donatii WHERE stare = 'platita' AND moneda = 'RON'
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
       FROM donatii WHERE stare = 'platita' AND moneda = 'RON'
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

/**
 * Cât a intrat în fiecare monedă.
 *
 * Restul fișierului numără numai lei. Asta e singura funcție care vede și
 * euro, ca să poată fi arătați separat — nu convertiți. Un curs ales de noi
 * ar fi vechi din prima zi, iar cel care contează e al băncii, în ziua
 * încasării.
 */
export async function peMonede(): Promise<
  Array<{ moneda: string; bani: number; nr: number }>
> {
  const randuri = await intreaba<{
    moneda: string;
    bani: string;
    nr: string;
  }>(
    `SELECT moneda, SUM(suma_bani) AS bani, COUNT(*) AS nr
       FROM donatii WHERE stare = 'platita'
      GROUP BY moneda ORDER BY SUM(suma_bani) DESC`,
  );
  return randuri.map((r) => ({
    moneda: r.moneda,
    bani: Number(r.bani),
    nr: Number(r.nr),
  }));
}

/**
 * Ce așteaptă un răspuns chiar acum.
 *
 * Tabloul arăta un singur număr — „de rezolvat” — care aduna cereri de feluri
 * diferite. Un număr nu spune ce să faci: cineva care deschide panoul
 * dimineața vrea să vadă unde să apese, nu cât de mult are de lucru.
 *
 * Fiecare rând de aici e un loc în care se poate intra. Când toate sunt zero,
 * panoul o spune și atât: un fundraiser n-are nevoie de o listă goală care
 * ocupă jumătate de ecran.
 */
export async function deFacutAcum(): Promise<
  Array<{ eticheta: string; nr: number; unde: string }>
> {
  const [cereri, aniversari, ciorne, firme, transferuri, contracte] =
    await Promise.all([
    intreaba<{ nr: string }>(
      `SELECT count(*) AS nr FROM cereri WHERE stadiu = 'nou'`,
    ),
    intreaba<{ nr: string }>(
      `SELECT count(*) AS nr FROM campanii_aniversare
        WHERE stare = 'in_asteptare'`,
    ),
    intreaba<{ nr: string }>(
      `SELECT count(*) AS nr FROM texte WHERE stare = 'ciorna'`,
    ),
    // O firmă căreia i s-a trimis contractul acum trei săptămâni și care
    // n-a semnat nu e „în lucru”, e uitată.
    intreaba<{ nr: string }>(
      `SELECT count(*) AS nr FROM firme
        WHERE stadiu IN ('cerere', 'contract_trimis')
          AND schimbat_la < now() - interval '14 days'`,
    ),
    // Transferurile anunțate de donatori: cineva trebuie să se uite în
    // extras. Până atunci banii lor nu sunt în niciun total.
    intreaba<{ nr: string }>(
      `SELECT count(*) AS nr FROM donatii WHERE stare = 'anuntata'`,
    ),
    // Contractele semnate online de firme, în așteptarea contrasemnăturii.
    intreaba<{ nr: string }>(
      `SELECT count(*) AS nr FROM contracte WHERE stare = 'semnat_de_sponsor'`,
    ),
  ]);

  return [
    { eticheta: "cereri noi", nr: Number(cereri[0]?.nr ?? 0), unde: "/admin/cereri" },
    {
      eticheta: "transferuri de căutat în extras",
      nr: Number(transferuri[0]?.nr ?? 0),
      unde: "/admin/donatii",
    },
    {
      eticheta: "contracte de contrasemnat",
      nr: Number(contracte[0]?.nr ?? 0),
      unde: "/admin/contracte",
    },
    {
      eticheta: "aniversări de aprobat",
      nr: Number(aniversari[0]?.nr ?? 0),
      unde: "/admin/aniversari",
    },
    {
      eticheta: "firme fără răspuns de două săptămâni",
      nr: Number(firme[0]?.nr ?? 0),
      unde: "/admin/firme",
    },
    {
      eticheta: "ciorne nepublicate",
      nr: Number(ciorne[0]?.nr ?? 0),
      unde: "/admin/scrie",
    },
  ].filter((r) => r.nr > 0);
}

/**
 * Banii care vin lună de lună, de la donatorii cu plată recurentă.
 *
 * E cifra pe care un fundraiser o urmărește înaintea totalului: din ea se
 * poate plăti chiria unei luni fără să se strângă nimic nou. Totalul de până
 * acum spune ce s-a întâmplat; asta spune pe ce te poți baza luna viitoare.
 *
 * Se numără doar donațiile lunare încasate în ultimele 35 de zile: o plată
 * recurentă oprită acum un an n-ar trebui să mai apară în ce „vine lunar”.
 */
export async function venitLunarRecurent(): Promise<{
  bani: number;
  donatori: number;
}> {
  const randuri = await intreaba<{ bani: string | null; nr: string }>(
    `SELECT SUM(suma_bani) AS bani, COUNT(DISTINCT email) AS nr
       FROM donatii
      WHERE moneda = 'RON'
        AND frecventa = 'lunar'
        AND stare = 'platita'
        AND platita_la >= now() - interval '35 days'`,
  );
  return {
    bani: Number(randuri[0]?.bani ?? 0),
    donatori: Number(randuri[0]?.nr ?? 0),
  };
}

/** Ultimele donații încasate, pentru un ochi aruncat dimineața. */
export async function ultimeleDonatii(cate = 8): Promise<
  Array<{
    cine: string;
    bani: number;
    moneda: string;
    frecventa: string;
    cand: string;
  }>
> {
  const randuri = await intreaba<{
    prenume: string | null;
    nume: string | null;
    email: string | null;
    suma_bani: string;
    moneda: string;
    frecventa: string;
    platita_la: Date | null;
  }>(
    `SELECT prenume, nume, email, suma_bani, moneda, frecventa, platita_la
       FROM donatii
      WHERE stare = 'platita'
      ORDER BY platita_la DESC NULLS LAST
      LIMIT $1`,
    [cate],
  );

  return randuri.map((r) => ({
    // Numele dacă există, altfel partea de dinaintea lui @ din e-mail. Adresa
    // întreagă n-are ce căuta pe un ecran care poate fi văzut peste umăr.
    cine:
      [r.prenume, r.nume].filter(Boolean).join(" ").trim() ||
      (r.email ? r.email.split("@")[0] : "cineva"),
    bani: Number(r.suma_bani),
    moneda: r.moneda,
    frecventa: r.frecventa,
    cand: (r.platita_la ?? new Date()).toISOString(),
  }));
}

/**
 * Cât s-a strâns pe fiecare campanie publicată, față de ținta ei.
 *
 * Se leagă prin `campanie_slug` de pe donație — câmpul pe care îl pune
 * butonul „Donează pentru campania asta”. O campanie fără țintă apare și ea,
 * doar cu suma: faptul că nu s-a anunțat o sumă nu înseamnă că nu vrei să
 * știi cât a intrat.
 */
export async function progresulCampaniilor(): Promise<
  Array<{ slug: string; titlu: string; tintaBani: number | null; bani: number }>
> {
  const randuri = await intreaba<{
    slug: string;
    titlu: string;
    tinta_bani: string | null;
    bani: string | null;
  }>(
    `SELECT t.slug, t.titlu, t.tinta_bani,
            (SELECT SUM(d.suma_bani) FROM donatii d
              WHERE d.campanie_slug = t.slug
                AND d.moneda = 'RON'
                AND d.stare = 'platita') AS bani
       FROM texte t
      WHERE t.fel = 'campanie' AND t.stare = 'publicat'
      ORDER BY t.publicat_la DESC NULLS LAST
      LIMIT 8`,
  );

  return randuri.map((r) => ({
    slug: r.slug,
    titlu: r.titlu,
    tintaBani: r.tinta_bani === null ? null : Number(r.tinta_bani),
    bani: Number(r.bani ?? 0),
  }));
}
