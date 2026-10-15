import { intreaba } from "@/lib/baza";

/**
 * Profilul donatorilor și al firmelor, în cifre.
 *
 * **Totul de aici e agregat, dinadins.** Nicio funcție nu întoarce un nume, o
 * adresă de e-mail sau un telefon — numai numărători, sume și procente.
 * Motivul e că de aici pleacă mai departe, către un model de limbaj care
 * rulează pe serverele altcuiva: aceleași concluzii se pot scoate din „37 de
 * donatori au dat o singură dată", fără ca cei 37 de oameni să iasă vreodată
 * din baza de date. Dacă vreodată cineva adaugă aici o coloană cu nume,
 * numele acela ajunge într-o cerere HTTP către altă firmă.
 *
 * Cifrele sunt și singura pavăză împotriva inventării: modelul primește exact
 * atât și i se cere să nu folosească altceva. Ce nu e în listă nu există.
 *
 * Pragurile („s-au oprit" la patru luni, „donator mare" la 1.000 de lei) sunt
 * aceleași cu cele din `plati/donatori.ts`. Dacă se schimbă acolo, se schimbă
 * și aici — altfel panoul și analiza spun lucruri diferite despre aceiași
 * oameni, iar cine le compară nu mai are încredere în niciuna.
 */

export type ProfilDonatori = {
  /** Oameni deosebiți, după adresa de e-mail. */
  donatori: number;
  donatii: number;
  totalBani: number;
  /** Cât dă un om, în medie și la mijloc. Mediana e cea onestă. */
  donatieMedie: number;
  donatieMediana: number;
  /** Câți au dat o singură dată, de două-trei ori, de patru sau mai multe. */
  oSinguraData: number;
  deDouaSauTrei: number;
  dePatruSauMaiMulte: number;
  /** Au cel puțin o plată lunară încasată în ultimele 35 de zile. */
  recurentiActivi: number;
  baniRecurentiPeLuna: number;
  /** Au dat de cel puțin două ori, dar nimic în ultimele patru luni. */
  sAuOprit: number;
  /** Peste 1.000 de lei adunat. */
  donatoriMari: number;
  baniDeLaMari: number;
  /** Câte zile trec, la mijloc, între prima și a doua donație. */
  zilePanaLaADoua: number | null;
  /** Câți au bifat acordul pentru buletinul informativ. */
  cuAcord: number;
  /** Donatori la prima lor donație, pe ultimele 12 luni. */
  noiUltimeleLuni: number;
  /** Dintre cei care au dat acum 12–24 de luni, câți au mai dat de atunci. */
  reveniti: number;
  deverificat: number;
  peTranse: Array<{ eticheta: string; donatori: number }>;
  peLuniAleAnului: Array<{ luna: number; bani: number }>;
  peDestinatii: Array<{ eticheta: string; bani: number }>;
  peMetode: Array<{ eticheta: string; bani: number }>;
  /** Câte donații poartă eticheta unei campanii. */
  prinCampanii: number;
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

/** Tranșele de mărime. Marginile sunt alese, nu calculate. */
const TRANSE = [
  { eticheta: "sub 50 lei", de: 0, pana: 5000 },
  { eticheta: "50–99 lei", de: 5000, pana: 10000 },
  { eticheta: "100–249 lei", de: 10000, pana: 25000 },
  { eticheta: "250–499 lei", de: 25000, pana: 50000 },
  { eticheta: "500–999 lei", de: 50000, pana: 100000 },
  { eticheta: "1.000 lei și peste", de: 100000, pana: null },
] as const;

const INCASATE = "stare = 'platita' AND moneda = 'RON'";

export async function profilulDonatorilor(): Promise<ProfilDonatori> {
  const [
    cap,
    mediana,
    frecventa,
    recurenti,
    opriti,
    mari,
    aDoua,
    acord,
    noi,
    reveniti,
    tranșe,
    peLuni,
    destinatii,
    metode,
    campanii,
    verificat,
  ] = await Promise.all([
    intreaba<{
      donatori: string;
      donatii: string;
      bani: string | null;
      medie: string | null;
    }>(
      `SELECT COUNT(DISTINCT email) AS donatori, COUNT(*) AS donatii,
              SUM(suma_bani) AS bani, AVG(suma_bani) AS medie
         FROM donatii WHERE ${INCASATE}`,
    ),
    intreaba<{ mediana: string | null }>(
      `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY suma_bani) AS mediana
         FROM donatii WHERE ${INCASATE}`,
    ),
    /*
      Câte donații are fiecare om, pus în trei grupe.

      Întrebarea din spate e cea mai utilă dintre toate: dintr-o sută de
      oameni care au dat o dată, câți au dat a doua oară? Dacă aproape
      niciunul, problema nu e că nu vin donatori — e că nu se întorc, și
      atunci munca de atras alții noi se scurge printr-o găleată spartă.
    */
    intreaba<{ grupa: string; nr: string }>(
      `SELECT CASE WHEN nr = 1 THEN 'una'
                   WHEN nr <= 3 THEN 'doua-trei'
                   ELSE 'patru' END AS grupa,
              COUNT(*) AS nr
         FROM (SELECT email, COUNT(*) AS nr FROM donatii
                WHERE ${INCASATE} AND email IS NOT NULL
                GROUP BY email) p
        GROUP BY 1`,
    ),
    intreaba<{ nr: string; bani: string | null }>(
      `SELECT COUNT(DISTINCT email) AS nr, SUM(suma_bani) AS bani
         FROM donatii
        WHERE ${INCASATE} AND frecventa = 'lunar'
          AND platita_la >= now() - interval '35 days'`,
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM (
         SELECT email FROM donatii
          WHERE ${INCASATE} AND email IS NOT NULL
          GROUP BY email
         HAVING COUNT(*) > 1
            AND MAX(platita_la) < now() - interval '4 months') p`,
    ),
    intreaba<{ nr: string; bani: string | null }>(
      `SELECT COUNT(*) AS nr, SUM(total) AS bani FROM (
         SELECT email, SUM(suma_bani) AS total FROM donatii
          WHERE ${INCASATE} AND email IS NOT NULL
          GROUP BY email HAVING SUM(suma_bani) >= 100000) p`,
    ),
    /*
      Câte zile trec între prima și a doua donație, la mijloc.

      Mediana, nu media: un om care s-a întors după trei ani trage media în
      sus și face să pară că nimeni nu se întoarce repede. Cifra asta spune
      când merită trimis al doilea mesaj — dacă jumătate se întorc în 40 de
      zile, o scrisoare la 30 de zile ajunge la timp.
    */
    intreaba<{ zile: string | null }>(
      `SELECT percentile_cont(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (a_doua - prima)) / 86400) AS zile
         FROM (SELECT email, MIN(platita_la) AS prima,
                      (ARRAY_AGG(platita_la ORDER BY platita_la))[2] AS a_doua
                 FROM donatii
                WHERE ${INCASATE} AND email IS NOT NULL
                GROUP BY email HAVING COUNT(*) > 1) p`,
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM (
         SELECT email FROM donatii
          WHERE ${INCASATE} AND email IS NOT NULL
          GROUP BY email HAVING bool_or(acord_buletin)) p`,
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM (
         SELECT email, MIN(platita_la) AS prima FROM donatii
          WHERE ${INCASATE} AND email IS NOT NULL
          GROUP BY email) p
        WHERE p.prima >= now() - interval '12 months'`,
    ),
    /*
      Reveniți: dintre cei care au dat acum 12–24 de luni, câți au mai dat de
      atunci încoace. E rata de păstrare, cifra după care se vede dacă
      asociația are donatori sau numai donații.
    */
    intreaba<{ vechi: string; reveniti: string }>(
      `SELECT COUNT(*) AS vechi,
              COUNT(*) FILTER (WHERE ultima >= now() - interval '12 months') AS reveniti
         FROM (SELECT email, MIN(platita_la) AS prima, MAX(platita_la) AS ultima
                 FROM donatii
                WHERE ${INCASATE} AND email IS NOT NULL
                GROUP BY email) p
        WHERE p.prima < now() - interval '12 months'
          AND p.prima >= now() - interval '24 months'`,
    ),
    /*
      Cât a adunat fiecare donator, fără să-l numim.

      `GROUP BY email` grupează după om, dar coloana cu e-mailul nu e cerută:
      de aici nu iese decât un șir de sume, din care se numără câți intră în
      fiecare tranșă. Fișierul ăsta nu are voie să întoarcă niciun nume.
    */
    intreaba<{ total: string }>(
      `SELECT SUM(suma_bani) AS total
         FROM donatii WHERE ${INCASATE} AND email IS NOT NULL
        GROUP BY email`,
    ),
    /*
      Ordonat după numărul lunii, nu după cum se scrie el.

      Cu luna întoarsă ca text, Postgres sortează alfabetic: octombrie („10")
      ajungea înaintea lui august („8"), iar sezonalitatea — motivul pentru
      care există rândul ăsta — se citea pe dos.
    */
    intreaba<{ luna: string; bani: string }>(
      `SELECT EXTRACT(MONTH FROM platita_la)::int AS luna,
              SUM(suma_bani) AS bani
         FROM donatii WHERE ${INCASATE}
        GROUP BY 1 ORDER BY 1`,
    ),
    intreaba<{ destinatie: string; bani: string }>(
      `SELECT destinatie, SUM(suma_bani) AS bani FROM donatii
        WHERE ${INCASATE} GROUP BY 1 ORDER BY 2 DESC`,
    ),
    intreaba<{ procesator: string; bani: string }>(
      `SELECT procesator, SUM(suma_bani) AS bani FROM donatii
        WHERE ${INCASATE} GROUP BY 1 ORDER BY 2 DESC`,
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM donatii
        WHERE ${INCASATE} AND campanie_slug IS NOT NULL`,
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM donatii WHERE stare = 'anuntata'`,
    ),
  ]);

  const peGrupa = new Map(frecventa.map((f) => [f.grupa, Number(f.nr)]));
  const totaluri = tranșe.map((t) => Number(t.total));
  const vechi = Number(reveniti[0]?.vechi ?? 0);

  return {
    donatori: Number(cap[0]?.donatori ?? 0),
    donatii: Number(cap[0]?.donatii ?? 0),
    totalBani: Number(cap[0]?.bani ?? 0),
    donatieMedie: Math.round(Number(cap[0]?.medie ?? 0)),
    donatieMediana: Math.round(Number(mediana[0]?.mediana ?? 0)),
    oSinguraData: peGrupa.get("una") ?? 0,
    deDouaSauTrei: peGrupa.get("doua-trei") ?? 0,
    dePatruSauMaiMulte: peGrupa.get("patru") ?? 0,
    recurentiActivi: Number(recurenti[0]?.nr ?? 0),
    baniRecurentiPeLuna: Number(recurenti[0]?.bani ?? 0),
    sAuOprit: Number(opriti[0]?.nr ?? 0),
    donatoriMari: Number(mari[0]?.nr ?? 0),
    baniDeLaMari: Number(mari[0]?.bani ?? 0),
    zilePanaLaADoua:
      aDoua[0]?.zile === null || aDoua[0]?.zile === undefined
        ? null
        : Math.round(Number(aDoua[0].zile)),
    cuAcord: Number(acord[0]?.nr ?? 0),
    noiUltimeleLuni: Number(noi[0]?.nr ?? 0),
    reveniti: vechi === 0 ? 0 : Number(reveniti[0]?.reveniti ?? 0),
    deverificat: Number(verificat[0]?.nr ?? 0),
    peTranse: TRANSE.map((t) => ({
      eticheta: t.eticheta,
      donatori: totaluri.filter(
        (total) => total >= t.de && (t.pana === null || total < t.pana),
      ).length,
    })),
    peLuniAleAnului: peLuni.map((l) => ({
      luna: Number(l.luna),
      bani: Number(l.bani),
    })),
    peDestinatii: destinatii.map((d) => ({
      eticheta: DESTINATII[d.destinatie] ?? d.destinatie,
      bani: Number(d.bani),
    })),
    peMetode: metode.map((m) => ({
      eticheta: METODE[m.procesator] ?? m.procesator,
      bani: Number(m.bani),
    })),
    prinCampanii: Number(campanii[0]?.nr ?? 0),
  };
}

export type ProfilFirme = {
  firme: number;
  peStadii: Array<{ stadiu: string; nr: number }>;
  /** Din câte cereri iese un contract semnat, și din câte banii în cont. */
  pastraDinCerere: { semnate: number; incasate: number };
  incasatBani: number;
  sponsorizareMedie: number;
  /** Câte zile trec, la mijloc, de la cerere până la bani în cont. */
  zilePanaLaBani: number | null;
  /** De unde au venit: formularul de sponsorizare, contractul de pe site… */
  peCale: Array<{ cale: string; nr: number }>;
  /** Blocate de peste două săptămâni în „cerere" sau „contract trimis". */
  uitate: number;
};

const STADII = [
  ["cerere", "Cerere primită"],
  ["contract_trimis", "Contract trimis"],
  ["semnat", "Contract semnat"],
  ["incasat", "Bani încasați"],
  ["renuntat", "A renunțat"],
] as const;

export async function profilulFirmelor(): Promise<ProfilFirme> {
  const [stadii, bani, zile, cale, uitate] = await Promise.all([
    intreaba<{ stadiu: string; nr: string }>(
      "SELECT stadiu, COUNT(*) AS nr FROM firme GROUP BY stadiu",
    ),
    intreaba<{ nr: string; total: string | null; medie: string | null }>(
      `SELECT COUNT(*) AS nr, SUM(suma_bani) AS total, AVG(suma_bani) AS medie
         FROM firme WHERE stadiu = 'incasat' AND suma_bani IS NOT NULL`,
    ),
    intreaba<{ zile: string | null }>(
      `SELECT percentile_cont(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (schimbat_la - creat_la)) / 86400) AS zile
         FROM firme WHERE stadiu = 'incasat'`,
    ),
    intreaba<{ cale: string; nr: string }>(
      "SELECT cale, COUNT(*) AS nr FROM firme GROUP BY cale ORDER BY 2 DESC",
    ),
    intreaba<{ nr: string }>(
      `SELECT COUNT(*) AS nr FROM firme
        WHERE stadiu IN ('cerere', 'contract_trimis')
          AND schimbat_la < now() - interval '14 days'`,
    ),
  ]);

  const peStadiu = new Map(stadii.map((s) => [s.stadiu, Number(s.nr)]));
  const toate = stadii.reduce((s, r) => s + Number(r.nr), 0);

  return {
    firme: toate,
    peStadii: STADII.map(([id, eticheta]) => ({
      stadiu: eticheta,
      nr: peStadiu.get(id) ?? 0,
    })),
    pastraDinCerere: {
      semnate: (peStadiu.get("semnat") ?? 0) + (peStadiu.get("incasat") ?? 0),
      incasate: peStadiu.get("incasat") ?? 0,
    },
    incasatBani: Number(bani[0]?.total ?? 0),
    sponsorizareMedie: Math.round(Number(bani[0]?.medie ?? 0)),
    zilePanaLaBani:
      zile[0]?.zile === null || zile[0]?.zile === undefined
        ? null
        : Math.round(Number(zile[0].zile)),
    peCale: cale.map((c) => ({ cale: c.cale, nr: Number(c.nr) })),
    uitate: Number(uitate[0]?.nr ?? 0),
  };
}

export type AnalizaSalvata = {
  id: string;
  text: string;
  cifre: string;
  creatLa: string;
};

/**
 * Analizele de dinainte.
 *
 * Fiecare costă o cerere plătită, deci se păstrează: pagina arată ultima, nu
 * cere alta la fiecare deschidere. Se păstrează și cifrele pe care s-a făcut,
 * fiindcă peste trei luni cifrele vor fi altele, iar o recomandare citită
 * fără datele de atunci pare greșită când de fapt era potrivită pentru
 * momentul ei.
 */
export async function salveazaAnaliza(
  text: string,
  cifre: string,
): Promise<void> {
  await intreaba("INSERT INTO analize (text, cifre) VALUES ($1, $2)", [
    text,
    cifre,
  ]);
}

export async function analize(limita = 10): Promise<AnalizaSalvata[]> {
  const randuri = await intreaba<{
    id: string;
    text: string;
    cifre: string;
    creat_la: Date;
  }>(
    "SELECT id, text, cifre, creat_la FROM analize ORDER BY creat_la DESC LIMIT $1",
    [limita],
  );
  return randuri.map((r) => ({
    id: r.id,
    text: r.text,
    cifre: r.cifre,
    creatLa: new Date(r.creat_la).toISOString(),
  }));
}
