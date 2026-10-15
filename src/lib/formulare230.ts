import { intreaba } from "./baza";
import { legaturaSemnata, stergeDinR2 } from "./r2";

/**
 * Formularele 230 trimise de oameni, cu poza celui semnat.
 *
 * **Ce e și ce nu e.** Fotografia nu ține loc de hârtie: originalul semnat tot
 * trebuie să ajungă la asociație, iar ANAF îl poate cere. Ce aduce poza e
 * timpul: se vede din ziua în care a trimis-o cine redirecționează, se poate
 * pregăti situația centralizatoare și se știe pe cine mai trebuie sunat după
 * plic.
 *
 * **Fișierul nu trece niciodată prin tabelul ăsta.** Aici stă doar cheia lui
 * din R2. Vizionarea se face cu o legătură semnată, valabilă zece minute: nu
 * există nicio adresă permanentă către un formular cu CNP pe el.
 */

export const STADII_230 = [
  { id: "primit", eticheta: "Primit", culoare: "miere" },
  { id: "verificat", eticheta: "Verificat", culoare: "turcoaz" },
  { id: "depus", eticheta: "Depus la ANAF", culoare: "caramiziu" },
] as const;

export type Stadiu230 = (typeof STADII_230)[number]["id"];

export function esteStadiu230(x: unknown): x is Stadiu230 {
  return STADII_230.some((s) => s.id === x);
}

export type Formular230 = {
  id: string;
  nume: string;
  email: string;
  telefon: string | null;
  fisierCheie: string | null;
  fisierTip: string | null;
  octeti: number | null;
  stare: Stadiu230;
  observatii: string | null;
  creatLa: string;
};

type Rand = {
  id: string;
  nume: string;
  email: string;
  telefon: string | null;
  fisier_cheie: string | null;
  fisier_tip: string | null;
  octeti: number | null;
  stare: string;
  observatii: string | null;
  creat_la: Date;
};

function dinRand(r: Rand): Formular230 {
  return {
    id: r.id,
    nume: r.nume,
    email: r.email,
    telefon: r.telefon,
    fisierCheie: r.fisier_cheie,
    fisierTip: r.fisier_tip,
    octeti: r.octeti,
    stare: esteStadiu230(r.stare) ? r.stare : "primit",
    observatii: r.observatii,
    creatLa: r.creat_la.toISOString(),
  };
}

export async function salveazaFormular230(date: {
  nume: string;
  email: string;
  telefon?: string | null;
  fisierCheie: string | null;
  fisierTip: string | null;
  octeti: number | null;
}): Promise<string> {
  const randuri = await intreaba<{ id: string }>(
    `INSERT INTO formulare_230 (nume, email, telefon, fisier_cheie, fisier_tip, octeti)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [
      date.nume,
      date.email,
      date.telefon ?? null,
      date.fisierCheie,
      date.fisierTip,
      date.octeti,
    ],
  );
  return randuri[0].id;
}

export async function formulare230(stare?: Stadiu230): Promise<Formular230[]> {
  const randuri = await intreaba<Rand>(
    stare
      ? `SELECT * FROM formulare_230 WHERE stare = $1 ORDER BY creat_la DESC LIMIT 500`
      : `SELECT * FROM formulare_230 ORDER BY creat_la DESC LIMIT 500`,
    stare ? [stare] : [],
  );
  return randuri.map(dinRand);
}

export async function formular230(id: string): Promise<Formular230 | null> {
  const randuri = await intreaba<Rand>(
    `SELECT * FROM formulare_230 WHERE id = $1`,
    [id],
  );
  return randuri[0] ? dinRand(randuri[0]) : null;
}

export async function schimbaStarea230(
  id: string,
  stare: Stadiu230,
  observatii?: string,
): Promise<void> {
  await intreaba(
    `UPDATE formulare_230
        SET stare = $2,
            observatii = COALESCE($3, observatii),
            schimbat_la = now()
      WHERE id = $1`,
    [id, stare, observatii ?? null],
  );
}

/**
 * Șterge formularul, cu fișier cu tot.
 *
 * Întâi fișierul, apoi rândul: dacă s-ar face invers și ștergerea din R2 ar
 * cădea, ar rămâne în depozit o fotografie cu un CNP pe ea și nimic în panou
 * care s-o mai arate — adică un fișier uitat, pe care nimeni nu-l mai poate
 * șterge.
 */
export async function stergeFormular230(id: string): Promise<boolean> {
  const formular = await formular230(id);
  if (!formular) return false;

  if (formular.fisierCheie) {
    const s = await stergeDinR2(formular.fisierCheie);
    if (!s) return false;
  }
  await intreaba(`DELETE FROM formulare_230 WHERE id = $1`, [id]);
  return true;
}

/** Legătura de vizionare, valabilă zece minute. */
export function legaturaFormular(formular: Formular230): string | null {
  return formular.fisierCheie ? legaturaSemnata(formular.fisierCheie, 600) : null;
}

/** Câte așteaptă, pentru tabloul de bord. */
export async function cate230DeVerificat(): Promise<number> {
  const randuri = await intreaba<{ nr: string }>(
    `SELECT count(*) AS nr FROM formulare_230 WHERE stare = 'primit'`,
  );
  return Number(randuri[0]?.nr ?? 0);
}
