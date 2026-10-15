import { createHash } from "node:crypto";
import { intreaba } from "@/lib/baza";

/**
 * Contractele de sponsorizare semnate online.
 *
 * Firma completează contractul pe site, îl semnează cu degetul sau cu
 * mouse-ul, iar PDF-ul ieșit se păstrează aici întreg, ca octeți. Nu datele
 * din care l-am putea face din nou: dacă mâine se schimbă o clauză sau o
 * adresă a asociației, un document regenerat ar arăta altfel decât cel
 * semnat — iar cel semnat e singurul care contează.
 *
 * **Ce poate și ce nu poate semnătura asta.** E o semnătură electronică
 * simplă. Prin lege, doar cea calificată (cu certificat) are puterea
 * semnăturii cu pixul. Ce o susține pe asta sunt împrejurările: ora, adresa
 * IP, browserul, amprenta documentului și faptul că o copie a plecat pe loc
 * către e-mailul firmei. Asociația contrasemnează, iar contractul rămâne
 * valabil prin acordul părților, nu prin forma semnăturii.
 */

export type ContractNou = {
  firmaId?: string | null;
  denumire: string;
  cui: string;
  sediu?: string;
  regCom?: string;
  reprezentant: string;
  calitate?: string;
  telefon?: string;
  email: string;
  valoare: string;
  pdf: Uint8Array;
  ip?: string;
  agent?: string;
};

export type Contract = {
  id: string;
  denumire: string;
  cui: string;
  reprezentant: string;
  email: string;
  telefon: string | null;
  valoare: string;
  amprenta: string;
  ip: string | null;
  stare: string;
  creatLa: string;
};

/** Amprenta fișierului, scrisă hexazecimal. */
export function amprenta(pdf: Uint8Array): string {
  return createHash("sha256").update(pdf).digest("hex");
}

export async function salveazaContract(
  date: ContractNou,
): Promise<{ id: string; amprenta: string } | null> {
  const suma = amprenta(date.pdf);
  try {
    const randuri = await intreaba<{ id: string }>(
      `INSERT INTO contracte
         (firma_id, denumire, cui, sediu, reg_com, reprezentant, calitate,
          telefon, email, valoare, pdf, amprenta, ip, agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        date.firmaId ?? null,
        date.denumire,
        date.cui,
        date.sediu ?? null,
        date.regCom ?? null,
        date.reprezentant,
        date.calitate ?? null,
        date.telefon ?? null,
        date.email,
        date.valoare,
        Buffer.from(date.pdf),
        suma,
        date.ip ?? null,
        date.agent ?? null,
      ],
    );
    const id = randuri[0]?.id;
    return id ? { id, amprenta: suma } : null;
  } catch {
    return null;
  }
}

/** Lista pentru panou. Fără PDF-uri: altfel o pagină ar trage zeci de MB. */
export async function contracte(limita = 100): Promise<Contract[]> {
  const randuri = await intreaba<{
    id: string;
    denumire: string;
    cui: string;
    reprezentant: string;
    email: string;
    telefon: string | null;
    valoare: string;
    amprenta: string;
    ip: string | null;
    stare: string;
    creat_la: Date;
  }>(
    `SELECT id, denumire, cui, reprezentant, email, telefon, valoare,
            amprenta, ip, stare, creat_la
       FROM contracte
      ORDER BY creat_la DESC
      LIMIT $1`,
    [limita],
  );
  return randuri.map((r) => ({
    id: r.id,
    denumire: r.denumire,
    cui: r.cui,
    reprezentant: r.reprezentant,
    email: r.email,
    telefon: r.telefon,
    valoare: r.valoare,
    amprenta: r.amprenta,
    ip: r.ip,
    stare: r.stare,
    creatLa: r.creat_la.toISOString(),
  }));
}

/**
 * Contractele semnate pe site, pe firme.
 *
 * Pentru lista de firme din panou: fără asta, cine deschide fișa unei firme
 * n-ar afla de acolo că a semnat deja un contract — ar trebui să țină minte
 * să se uite și în cealaltă listă.
 */
export async function contracteDupaFirma(): Promise<
  Map<string, { id: string; stare: string }>
> {
  const randuri = await intreaba<{
    id: string;
    firma_id: string | null;
    stare: string;
  }>(
    `SELECT DISTINCT ON (firma_id) id, firma_id, stare
       FROM contracte
      WHERE firma_id IS NOT NULL
      ORDER BY firma_id, creat_la DESC`,
  );
  const dupaFirma = new Map<string, { id: string; stare: string }>();
  for (const r of randuri) {
    if (r.firma_id) dupaFirma.set(r.firma_id, { id: r.id, stare: r.stare });
  }
  return dupaFirma;
}

/** Câte contracte așteaptă contrasemnătura asociației. */
export async function cateContracteNoi(): Promise<number> {
  const randuri = await intreaba<{ cate: string }>(
    "SELECT count(*) AS cate FROM contracte WHERE stare = 'semnat_de_sponsor'",
  );
  return Number(randuri[0]?.cate ?? 0);
}

/** Fișierul în sine, pentru descărcare din panou. */
export async function pdfulContractului(
  id: string,
): Promise<{ pdf: Buffer; denumire: string } | null> {
  const randuri = await intreaba<{ pdf: Buffer; denumire: string }>(
    "SELECT pdf, denumire FROM contracte WHERE id = $1",
    [id],
  );
  const rand = randuri[0];
  return rand ? { pdf: rand.pdf, denumire: rand.denumire } : null;
}

/** Marchează contractul ca semnat și de asociație, sau anulat. */
export async function hotarasteContract(
  id: string,
  stare: "contrasemnat" | "anulat",
): Promise<boolean> {
  const randuri = await intreaba<{ id: string }>(
    `UPDATE contracte SET stare = $2
      WHERE id = $1 AND stare = 'semnat_de_sponsor'
      RETURNING id`,
    [id, stare],
  );
  return randuri.length > 0;
}
