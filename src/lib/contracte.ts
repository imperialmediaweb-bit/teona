import { intreaba } from "@/lib/baza";

/**
 * Registrul contractelor de sponsorizare.
 *
 * **De ce există.** Contractul se genera la apăsare și pleca pe e-mail;
 * numărul lui se scria de mână, iar nicăieri nu rămânea o listă. La final de
 * an contabilul cere exact lista asta — număr, dată, firmă, sumă —, și tot
 * din ea se completează Declarația 177. Reconstituită din inbox, iese altfel
 * de fiecare dată și nimeni nu poate spune dacă lipsește unul.
 *
 * **Numărul se dă aici, nu în capul omului.** Pe an, de la 1. Dacă două
 * apăsări se suprapun, a doua primește următorul număr liber — `UNIQUE (an,
 * numar)` nu lasă două contracte „3/2026" să existe.
 *
 * **Registrul nu ține fișierul.** Contractul generat se descarcă și se
 * trimite firmei; ce semnează ea se întoarce pe e-mail. Aici rămâne evidența,
 * nu arhiva — un PDF ținut și la noi ar fi al treilea loc în care același
 * document poate să difere.
 */

export const STADII_CONTRACT = [
  { id: "generat", eticheta: "Generat", culoare: "miere" },
  { id: "semnat", eticheta: "Semnat de firmă", culoare: "turcoaz" },
  { id: "incasat", eticheta: "Bani încasați", culoare: "caramiziu" },
  { id: "anulat", eticheta: "Anulat", culoare: "cerneala" },
] as const;

export type StadiuContract = (typeof STADII_CONTRACT)[number]["id"];

export function esteStadiuContract(x: unknown): x is StadiuContract {
  return STADII_CONTRACT.some((s) => s.id === x);
}

export type Contract = {
  id: string;
  an: number;
  numar: number;
  /** „12/2026", cum se scrie în document. */
  scris: string;
  firmaId: string | null;
  denumire: string;
  cui: string | null;
  valoareBani: number | null;
  dataContract: string;
  stadiu: StadiuContract;
  observatii: string | null;
};

type Rand = {
  id: string;
  an: number;
  numar: number;
  firma_id: string | null;
  denumire: string;
  cui: string | null;
  valoare_bani: string | number | null;
  data_contract: Date | string;
  stadiu: string;
  observatii: string | null;
};

function dinRand(r: Rand): Contract {
  return {
    id: r.id,
    an: Number(r.an),
    numar: Number(r.numar),
    scris: `${r.numar}/${r.an}`,
    firmaId: r.firma_id,
    denumire: r.denumire,
    cui: r.cui,
    valoareBani: r.valoare_bani === null ? null : Number(r.valoare_bani),
    dataContract:
      r.data_contract instanceof Date
        ? r.data_contract.toISOString().slice(0, 10)
        : String(r.data_contract).slice(0, 10),
    stadiu: esteStadiuContract(r.stadiu) ? r.stadiu : "generat",
    observatii: r.observatii,
  };
}

const COLOANE = `id, an, numar, firma_id, denumire, cui, valoare_bani,
  data_contract, stadiu, observatii`;

/**
 * Scrie contractul în registru și întoarce numărul primit.
 *
 * Se cheamă la generarea documentului, ca numărul din PDF să fie chiar cel
 * din registru. Dacă baza nu răspunde, contractul se generează oricum, fără
 * număr: mai bine un contract fără număr decât o firmă care așteaptă.
 */
export async function inregistreazaContract(d: {
  firmaId: string | null;
  denumire: string;
  cui: string | null;
  valoareBani: number | null;
  dataContract?: string | null;
}): Promise<Contract | null> {
  const an = new Date().getFullYear();

  /*
    Trei încercări, nu una.

    `UNIQUE (an, numar)` oprește dublurile, dar atunci inserarea cade. Două
    apăsări în aceeași clipă se întâmplă — omul apasă „Word", apoi „PDF".
  */
  for (let i = 0; i < 3; i++) {
    try {
      const randuri = await intreaba<Rand>(
        `INSERT INTO contracte
           (an, numar, firma_id, denumire, cui, valoare_bani, data_contract)
         VALUES (
           $1,
           (SELECT coalesce(max(numar), 0) + 1 FROM contracte WHERE an = $1),
           $2, $3, $4, $5, coalesce($6::date, current_date)
         )
         RETURNING ${COLOANE}`,
        [
          an,
          d.firmaId,
          d.denumire,
          d.cui,
          d.valoareBani,
          d.dataContract ?? null,
        ],
      );
      if (randuri[0]) return dinRand(randuri[0]);
    } catch {
      // Numărul a fost luat între timp. Se încearcă din nou, cu următorul.
    }
  }
  return null;
}

export async function contracte(an?: number): Promise<Contract[]> {
  const randuri = await intreaba<Rand>(
    an
      ? `SELECT ${COLOANE} FROM contracte WHERE an = $1 ORDER BY numar DESC`
      : `SELECT ${COLOANE} FROM contracte ORDER BY an DESC, numar DESC`,
    an ? [an] : [],
  );
  return randuri.map(dinRand);
}

/** Anii în care există contracte, cel mai nou primul. */
export async function aniiContractelor(): Promise<number[]> {
  const randuri = await intreaba<{ an: number }>(
    "SELECT DISTINCT an FROM contracte ORDER BY an DESC",
  );
  return randuri.map((r) => Number(r.an));
}

export async function schimbaContract(
  id: string,
  d: {
    stadiu: StadiuContract;
    valoareBani: number | null;
    dataContract: string | null;
    observatii: string | null;
  },
): Promise<void> {
  await intreaba(
    `UPDATE contracte
        SET stadiu = $2,
            valoare_bani = $3,
            data_contract = coalesce($4::date, data_contract),
            observatii = $5,
            schimbat_la = now()
      WHERE id = $1`,
    [id, d.stadiu, d.valoareBani, d.dataContract, d.observatii],
  );
}

export type TotaluriContracte = {
  cate: number;
  semnate: number;
  incasate: number;
  valoareTotala: number;
  valoareIncasata: number;
  /** Semnate, dar cu banii neintrați — lucrul de urmărit în decembrie. */
  deIncasat: number;
  valoareDeIncasat: number;
};

export async function totaluriContracte(
  an: number,
): Promise<TotaluriContracte> {
  const randuri = await intreaba<{
    cate: string;
    semnate: string;
    incasate: string;
    valoare_totala: string;
    valoare_incasata: string;
    de_incasat: string;
    valoare_de_incasat: string;
  }>(
    `SELECT count(*)                                                  AS cate,
            count(*) FILTER (WHERE stadiu = 'semnat')                 AS semnate,
            count(*) FILTER (WHERE stadiu = 'incasat')                AS incasate,
            coalesce(sum(valoare_bani) FILTER (WHERE stadiu <> 'anulat'), 0)
                                                                      AS valoare_totala,
            coalesce(sum(valoare_bani) FILTER (WHERE stadiu = 'incasat'), 0)
                                                                      AS valoare_incasata,
            count(*) FILTER (WHERE stadiu = 'semnat')                 AS de_incasat,
            coalesce(sum(valoare_bani) FILTER (WHERE stadiu = 'semnat'), 0)
                                                                      AS valoare_de_incasat
       FROM contracte
      WHERE an = $1`,
    [an],
  );
  const r = randuri[0];
  return {
    cate: Number(r?.cate ?? 0),
    semnate: Number(r?.semnate ?? 0),
    incasate: Number(r?.incasate ?? 0),
    valoareTotala: Number(r?.valoare_totala ?? 0),
    valoareIncasata: Number(r?.valoare_incasata ?? 0),
    deIncasat: Number(r?.de_incasat ?? 0),
    valoareDeIncasat: Number(r?.valoare_de_incasat ?? 0),
  };
}

/**
 * Firmele care au sponsorizat anul trecut și n-au mai dat nimic anul ăsta.
 *
 * În ianuarie, lista asta e cea mai ieftină sursă de bani a asociației: cine
 * a semnat o dată semnează mai ușor a doua oară decât oricine altcineva. Fără
 * ea, în fiecare an se pornește de la zero, iar sponsorii de anul trecut își
 * amintesc singuri — adică nu-și amintesc.
 */
export type SponsorNereinnoit = {
  denumire: string;
  cui: string | null;
  firmaId: string | null;
  valoareBani: number | null;
  ultimulAn: number;
};

export async function nereinnoite(an: number): Promise<SponsorNereinnoit[]> {
  const randuri = await intreaba<{
    denumire: string;
    cui: string | null;
    firma_id: string | null;
    valoare_bani: string | null;
    ultimul_an: number;
  }>(
    `SELECT DISTINCT ON (coalesce(c.cui, c.denumire))
            c.denumire, c.cui, c.firma_id, c.valoare_bani, c.an AS ultimul_an
       FROM contracte c
      WHERE c.an < $1
        AND c.stadiu <> 'anulat'
        AND NOT EXISTS (
          SELECT 1 FROM contracte d
           WHERE d.an = $1
             AND d.stadiu <> 'anulat'
             AND coalesce(d.cui, d.denumire) = coalesce(c.cui, c.denumire)
        )
      ORDER BY coalesce(c.cui, c.denumire), c.an DESC`,
    [an],
  );
  return randuri.map((r) => ({
    denumire: r.denumire,
    cui: r.cui,
    firmaId: r.firma_id,
    valoareBani: r.valoare_bani === null ? null : Number(r.valoare_bani),
    ultimulAn: Number(r.ultimul_an),
  }));
}

/**
 * Numărul pentru contractul care se generează acum.
 *
 * **De ce „găsește sau scrie" și nu „scrie mereu".** Omul apasă „Generează
 * contractul (Word)", se răzgândește și apasă și „(PDF)" — același contract,
 * două apăsări. Dacă fiecare ar lua un număr, registrul ar avea două rânduri
 * pentru o singură hârtie, iar firma ar primi două documente cu numere
 * diferite.
 *
 * Se refolosește rândul numai dacă e **aceeași firmă, același an, aceeași
 * sumă și încă netrimis** („generat"). O a doua sponsorizare, cu altă sumă,
 * primește alt număr — cum și trebuie.
 */
export async function numarPentruContract(d: {
  firmaId: string | null;
  denumire: string;
  cui: string | null;
  valoareBani: number | null;
}): Promise<Contract | null> {
  const an = new Date().getFullYear();

  const gasite = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM contracte
      WHERE an = $1
        AND stadiu = 'generat'
        AND coalesce(cui, denumire) = coalesce($2, $3)
        AND valoare_bani IS NOT DISTINCT FROM $4
      ORDER BY numar DESC
      LIMIT 1`,
    [an, d.cui, d.denumire, d.valoareBani],
  ).catch(() => []);

  if (gasite[0]) return dinRand(gasite[0]);
  return inregistreazaContract(d);
}
