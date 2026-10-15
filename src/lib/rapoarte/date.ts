import { intreaba } from "@/lib/baza";

/**
 * Cifrele din care se scriu rapoartele descărcabile.
 *
 * Stau separat de `statistici.ts` fiindcă răspund la alte întrebări. Tabloul
 * de bord arată cum stăm **acum**: ultimele douăsprezece luni, ce așteaptă un
 * răspuns, cine a donat ieri. Un raport se uită la o **perioadă încheiată** —
 * luna trecută, anul trecut, o campanie — și trebuie să dea aceeași cifră și
 * peste un an, când cineva îl deschide din arhivă.
 *
 * Trei reguli, aceleași peste tot:
 *
 * 1. **Numai ce s-a încasat.** `stare = 'platita'`. Un transfer anunțat de
 *    donator, dar negăsit încă în extras, nu intră în niciun total — apare
 *    separat, ca lucru de verificat. Altfel oricine ar putea umfla raportul
 *    anual dintr-un browser.
 * 2. **Numai lei, în totaluri.** `suma_bani` ține bani sau cenți, după
 *    monedă; adunate la grămadă, 25 € s-ar număra ca 25 de lei. Euro apare
 *    separat, neconvertit: cursul care contează e al băncii, în ziua
 *    încasării, nu unul ales de noi.
 * 3. **Ce nu se știe rămâne gol.** O lună fără donații se scrie cu zero, nu
 *    se sare peste ea; o campanie fără țintă n-are procent, nu unul inventat.
 */

/** Marginile unei luni: `2026-10` → ['2026-10-01', '2026-11-01'). */
function marginileLunii(luna: string): [string, string] {
  const [an, nr] = luna.split("-").map(Number);
  return [
    new Date(Date.UTC(an, nr - 1, 1)).toISOString(),
    new Date(Date.UTC(an, nr, 1)).toISOString(),
  ];
}

function marginileAnului(an: number): [string, string] {
  return [
    new Date(Date.UTC(an, 0, 1)).toISOString(),
    new Date(Date.UTC(an + 1, 0, 1)).toISOString(),
  ];
}

export type Felie = { eticheta: string; bani: number; nr: number };

export type Perioada = {
  /** În bani, nu în lei: împărțirea la 100 se face la scris. */
  bani: number;
  donatii: number;
  /** Oameni deosebiți, după adresa de e-mail. */
  donatori: number;
  /** Dintre ei, câți sunt la prima lor donație. */
  donatoriNoi: number;
  /** Partea care vine din plăți lunare. */
  baniRecurenti: number;
  peDestinatii: Felie[];
  peMetode: Felie[];
  /** Ce a intrat în altă monedă, neconvertit. */
  alteMonede: Array<{ moneda: string; bani: number; nr: number }>;
};

const DESTINATII: Record<string, string> = {
  oriunde: "Oriunde e nevoie",
  tabere: "Tabere",
  "casa-teona": "Casa Teona",
  "cazuri-umanitare": "Cazuri umanitare",
};

const METODE: Record<string, string> = {
  stripe: "Card",
  paypal: "PayPal",
  transfer: "Transfer bancar",
  numerar: "Numerar",
  revolut: "Revolut",
};

function nume(harta: Record<string, string>, id: string): string {
  return harta[id] ?? id;
}

/** Totalurile unei perioade, oricare ar fi ea. */
async function perioada(de: string, pana: string): Promise<Perioada> {
  const [cap, destinatii, metode, monede, noi] = await Promise.all([
    intreaba<{
      bani: string | null;
      donatii: string;
      donatori: string;
      recurenti: string | null;
    }>(
      `SELECT SUM(suma_bani) AS bani,
              COUNT(*) AS donatii,
              COUNT(DISTINCT email) AS donatori,
              SUM(suma_bani) FILTER (WHERE frecventa = 'lunar') AS recurenti
         FROM donatii
        WHERE stare = 'platita' AND moneda = 'RON'
          AND platita_la >= $1 AND platita_la < $2`,
      [de, pana],
    ),
    intreaba<{ destinatie: string; bani: string; nr: string }>(
      `SELECT destinatie, SUM(suma_bani) AS bani, COUNT(*) AS nr
         FROM donatii
        WHERE stare = 'platita' AND moneda = 'RON'
          AND platita_la >= $1 AND platita_la < $2
        GROUP BY destinatie ORDER BY SUM(suma_bani) DESC`,
      [de, pana],
    ),
    intreaba<{ procesator: string; bani: string; nr: string }>(
      `SELECT procesator, SUM(suma_bani) AS bani, COUNT(*) AS nr
         FROM donatii
        WHERE stare = 'platita' AND moneda = 'RON'
          AND platita_la >= $1 AND platita_la < $2
        GROUP BY procesator ORDER BY SUM(suma_bani) DESC`,
      [de, pana],
    ),
    intreaba<{ moneda: string; bani: string; nr: string }>(
      `SELECT moneda, SUM(suma_bani) AS bani, COUNT(*) AS nr
         FROM donatii
        WHERE stare = 'platita' AND moneda <> 'RON'
          AND platita_la >= $1 AND platita_la < $2
        GROUP BY moneda ORDER BY moneda`,
      [de, pana],
    ),
    /*
      Donatori noi: cei a căror **primă** donație cade în perioadă.

      Se caută prima donație din toată istoria, nu prima din perioadă —
      altfel cineva care a donat în ianuarie și din nou în martie ar apărea
      ca om nou în fiecare lună în care dă, iar „creșterea" ar fi o iluzie.
    */
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM (
         SELECT email, MIN(platita_la) AS prima
           FROM donatii
          WHERE stare = 'platita' AND moneda = 'RON' AND email IS NOT NULL
          GROUP BY email) p
        WHERE p.prima >= $1 AND p.prima < $2`,
      [de, pana],
    ),
  ]);

  return {
    bani: Number(cap[0]?.bani ?? 0),
    donatii: Number(cap[0]?.donatii ?? 0),
    donatori: Number(cap[0]?.donatori ?? 0),
    donatoriNoi: Number(noi[0]?.nr ?? 0),
    baniRecurenti: Number(cap[0]?.recurenti ?? 0),
    peDestinatii: destinatii.map((d) => ({
      eticheta: nume(DESTINATII, d.destinatie),
      bani: Number(d.bani),
      nr: Number(d.nr),
    })),
    peMetode: metode.map((m) => ({
      eticheta: nume(METODE, m.procesator),
      bani: Number(m.bani),
      nr: Number(m.nr),
    })),
    alteMonede: monede.map((m) => ({
      moneda: m.moneda,
      bani: Number(m.bani),
      nr: Number(m.nr),
    })),
  };
}

export type RaportLunar = {
  luna: string;
  acum: Perioada;
  /** Luna dinainte, pentru comparație. */
  inainte: Perioada;
  /** Cele mai mari donații ale lunii, cu nume. Date personale. */
  celeMariDonatii: Array<{
    cine: string;
    bani: number;
    cand: string;
    lunar: boolean;
  }>;
  /** Transferuri anunțate de donatori, negăsite încă în extras. */
  deVerificat: number;
};

export async function raportLunar(luna: string): Promise<RaportLunar> {
  const [de, pana] = marginileLunii(luna);
  const [an, nr] = luna.split("-").map(Number);
  const lunaDinainte = `${nr === 1 ? an - 1 : an}-${String(
    nr === 1 ? 12 : nr - 1,
  ).padStart(2, "0")}`;
  const [deInainte, panaInainte] = marginileLunii(lunaDinainte);

  const [acum, inainte, mari, verificat] = await Promise.all([
    perioada(de, pana),
    perioada(deInainte, panaInainte),
    intreaba<{
      prenume: string | null;
      nume: string | null;
      suma_bani: string;
      platita_la: string;
      frecventa: string;
    }>(
      `SELECT prenume, nume, suma_bani, platita_la, frecventa
         FROM donatii
        WHERE stare = 'platita' AND moneda = 'RON'
          AND platita_la >= $1 AND platita_la < $2
        ORDER BY suma_bani DESC LIMIT 10`,
      [de, pana],
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM donatii
        WHERE stare = 'anuntata' AND creat_la >= $1 AND creat_la < $2`,
      [de, pana],
    ),
  ]);

  return {
    luna,
    acum,
    inainte,
    celeMariDonatii: mari.map((d) => ({
      cine: [d.prenume, d.nume].filter(Boolean).join(" ") || "Fără nume",
      bani: Number(d.suma_bani),
      cand: d.platita_la,
      lunar: d.frecventa === "lunar",
    })),
    deVerificat: Number(verificat[0]?.nr ?? 0),
  };
}

export type RaportAnual = {
  an: number;
  total: Perioada;
  /** Toate cele douăsprezece luni, inclusiv cele goale. */
  luni: Array<{ luna: string; bani: number; donatii: number }>;
  campanii: Array<{ titlu: string; bani: number; tintaBani: number | null }>;
  firme: {
    /** Câte firme au ajuns la „bani încasați" și cât scrie în fișele lor. */
    incasate: number;
    bani: number;
    peStadii: Array<{ stadiu: string; nr: number }>;
  };
};

/*
  Stadiile firmelor, în ordinea prin care trec.

  Ordinea contează: `GROUP BY` le dă pe oricare, iar o pâlnie în care „a
  renunțat" stă între „contract trimis" și „cerere primită" nu se citește ca o
  pâlnie. Stadiile prin care n-a trecut nimeni apar și ele, cu zero — altfel
  cineva care se uită la raport crede că pasul lipsește cu totul.
*/
const STADII = [
  ["cerere", "Cerere primită"],
  ["contract_trimis", "Contract trimis"],
  ["semnat", "Contract semnat"],
  ["incasat", "Bani încasați"],
  ["renuntat", "A renunțat"],
] as const;

export async function raportAnual(an: number): Promise<RaportAnual> {
  const [de, pana] = marginileAnului(an);

  const [total, peLuni, campanii, firme, stadii] = await Promise.all([
    perioada(de, pana),
    intreaba<{ luna: string; bani: string; nr: string }>(
      `SELECT to_char(date_trunc('month', platita_la), 'YYYY-MM') AS luna,
              SUM(suma_bani) AS bani, COUNT(*) AS nr
         FROM donatii
        WHERE stare = 'platita' AND moneda = 'RON'
          AND platita_la >= $1 AND platita_la < $2
        GROUP BY 1 ORDER BY 1`,
      [de, pana],
    ),
    intreaba<{ titlu: string; tinta_bani: string | null; bani: string | null }>(
      `SELECT t.titlu, t.tinta_bani,
              (SELECT SUM(d.suma_bani) FROM donatii d
                WHERE d.campanie_slug = t.slug AND d.stare = 'platita'
                  AND d.moneda = 'RON'
                  AND d.platita_la >= $1 AND d.platita_la < $2) AS bani
         FROM texte t
        WHERE t.fel = 'campanie' AND t.stare = 'publicat'
        ORDER BY t.publicat_la DESC NULLS LAST`,
      [de, pana],
    ),
    intreaba<{ nr: string; bani: string | null }>(
      `SELECT COUNT(*) AS nr, SUM(suma_bani) AS bani
         FROM firme WHERE stadiu = 'incasat'`,
    ),
    intreaba<{ stadiu: string; nr: string }>(
      `SELECT stadiu, COUNT(*) AS nr FROM firme GROUP BY stadiu`,
    ),
  ]);

  const gasite = new Map(
    peLuni.map((l) => [
      l.luna,
      { bani: Number(l.bani), donatii: Number(l.nr) },
    ]),
  );
  const luni = Array.from({ length: 12 }, (_, i) => {
    const cheie = `${an}-${String(i + 1).padStart(2, "0")}`;
    return { luna: cheie, ...(gasite.get(cheie) ?? { bani: 0, donatii: 0 }) };
  });

  return {
    an,
    total,
    luni,
    campanii: campanii.map((c) => ({
      titlu: c.titlu,
      bani: Number(c.bani ?? 0),
      tintaBani: c.tinta_bani === null ? null : Number(c.tinta_bani),
    })),
    firme: {
      incasate: Number(firme[0]?.nr ?? 0),
      bani: Number(firme[0]?.bani ?? 0),
      peStadii: STADII.map(([id, eticheta]) => ({
        stadiu: eticheta,
        nr: Number(stadii.find((s) => s.stadiu === id)?.nr ?? 0),
      })),
    },
  };
}

export type RaportCampanie = {
  slug: string;
  titlu: string;
  rezumat: string;
  publicatLa: string | null;
  tintaBani: number | null;
  bani: number;
  donatii: number;
  donatori: number;
  luni: Array<{ luna: string; bani: number; donatii: number }>;
};

export async function campaniileDeRaportat(): Promise<
  Array<{ slug: string; titlu: string }>
> {
  return intreaba<{ slug: string; titlu: string }>(
    `SELECT slug, titlu FROM texte
      WHERE fel = 'campanie' AND stare = 'publicat'
      ORDER BY publicat_la DESC NULLS LAST`,
  );
}

export async function raportCampanie(
  slug: string,
): Promise<RaportCampanie | null> {
  const [text] = await intreaba<{
    slug: string;
    titlu: string;
    rezumat: string;
    publicat_la: string | null;
    tinta_bani: string | null;
  }>(
    `SELECT slug, titlu, rezumat, publicat_la, tinta_bani
       FROM texte WHERE fel = 'campanie' AND slug = $1`,
    [slug],
  );
  if (!text) return null;

  const [cap, peLuni] = await Promise.all([
    intreaba<{ bani: string | null; nr: string; donatori: string }>(
      `SELECT SUM(suma_bani) AS bani, COUNT(*) AS nr,
              COUNT(DISTINCT email) AS donatori
         FROM donatii
        WHERE campanie_slug = $1 AND stare = 'platita' AND moneda = 'RON'`,
      [slug],
    ),
    intreaba<{ luna: string; bani: string; nr: string }>(
      `SELECT to_char(date_trunc('month', platita_la), 'YYYY-MM') AS luna,
              SUM(suma_bani) AS bani, COUNT(*) AS nr
         FROM donatii
        WHERE campanie_slug = $1 AND stare = 'platita' AND moneda = 'RON'
        GROUP BY 1 ORDER BY 1`,
      [slug],
    ),
  ]);

  return {
    slug: text.slug,
    titlu: text.titlu,
    rezumat: text.rezumat,
    publicatLa: text.publicat_la,
    tintaBani: text.tinta_bani === null ? null : Number(text.tinta_bani),
    bani: Number(cap[0]?.bani ?? 0),
    donatii: Number(cap[0]?.nr ?? 0),
    donatori: Number(cap[0]?.donatori ?? 0),
    luni: peLuni.map((l) => ({
      luna: l.luna,
      bani: Number(l.bani),
      donatii: Number(l.nr),
    })),
  };
}
