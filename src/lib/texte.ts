import { intreaba } from "./baza";
import { faSlug } from "./slug-proiecte.mjs";

/**
 * Noutățile și campaniile scrise de asociație, din panou.
 *
 * **De ce există.** Caietul de sarcini cere de peste șapte ori ca asociația
 * să-și poată schimba singură textele, iar la 12.1 cere în meniu o secțiune
 * „Noutăți/Blog” care până acum lipsea cu totul. Până aici, orice text nou
 * însemna o modificare de cod și o publicare — adică treci prin dezvoltator ca
 * să anunți o strângere de fonduri.
 *
 * **Un singur fel de lucru, două feluri de pagină.** O noutate și o campanie
 * au aceeași formă: titlu, un rezumat de o frază, textul, o poză. Campania
 * adaugă o țintă de bani și un buton de donație. De aceea stau în același
 * tabel, cu o coloană care le deosebește: un singur editor de întreținut.
 *
 * **Ciornă până când cineva apasă publică.** Un text pe jumătate scris nu
 * trebuie să poată ajunge din greșeală pe site-ul public, iar cine scrie
 * trebuie să poată lăsa ceva neterminat peste noapte.
 */

export const FELURI = [
  {
    id: "noutate",
    eticheta: "Noutate",
    plural: "Noutăți",
    cale: "/noutati",
  },
  {
    id: "campanie",
    eticheta: "Campanie",
    plural: "Campanii",
    cale: "/campanii",
  },
] as const;

export type FelText = (typeof FELURI)[number]["id"];

export function esteFel(x: unknown): x is FelText {
  return FELURI.some((f) => f.id === x);
}

export function felul(id: FelText) {
  return FELURI.find((f) => f.id === id) ?? FELURI[0];
}

export type Text = {
  id: string;
  fel: FelText;
  slug: string;
  titlu: string;
  rezumat: string;
  continut: string;
  poza: { id: string; latime: number; inaltime: number; alt: string } | null;
  /** Numai la campanii, în bani (lei × 100). */
  tintaBani: number | null;
  publicat: boolean;
  publicatLa: string | null;
  schimbatLa: string;
};

type Rand = {
  id: string;
  fel: string;
  slug: string;
  titlu: string;
  rezumat: string;
  continut: string;
  poza_id: string | null;
  poza_latime: number | null;
  poza_inaltime: number | null;
  poza_alt: string | null;
  tinta_bani: string | number | null;
  stare: string;
  publicat_la: Date | null;
  schimbat_la: Date;
};

function dinRand(r: Rand): Text {
  return {
    id: r.id,
    fel: esteFel(r.fel) ? r.fel : "noutate",
    slug: r.slug,
    titlu: r.titlu,
    rezumat: r.rezumat,
    continut: r.continut,
    poza:
      r.poza_id && r.poza_latime && r.poza_inaltime
        ? {
            id: r.poza_id,
            latime: r.poza_latime,
            inaltime: r.poza_inaltime,
            // Fără descriere n-ar trebui să existe nicio poză, dar un rând
            // scris înainte de regula asta n-are voie să strice pagina.
            alt: r.poza_alt ?? "",
          }
        : null,
    tintaBani: r.tinta_bani === null ? null : Number(r.tinta_bani),
    publicat: r.stare === "publicat",
    publicatLa: r.publicat_la ? r.publicat_la.toISOString() : null,
    schimbatLa: r.schimbat_la.toISOString(),
  };
}

const COLOANE = `id, fel, slug, titlu, rezumat, continut, poza_id, poza_latime,
  poza_inaltime, poza_alt, tinta_bani, stare, publicat_la, schimbat_la`;

/**
 * Textele publicate, cele mai noi primele.
 *
 * Ordonate după data publicării, nu după cea a scrierii: o ciornă începută
 * acum trei săptămâni și publicată azi e o noutate de azi.
 */
export async function textePublicate(fel: FelText, cate = 50): Promise<Text[]> {
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM texte
      WHERE fel = $1 AND stare = 'publicat'
      ORDER BY publicat_la DESC NULLS LAST, creat_la DESC
      LIMIT $2`,
    [fel, cate],
  );
  return randuri.map(dinRand);
}

/** Tot ce e scris, ciornele incluse. Pentru panou. */
export async function toateTextele(fel?: FelText): Promise<Text[]> {
  const randuri = await intreaba<Rand>(
    fel
      ? `SELECT ${COLOANE} FROM texte WHERE fel = $1 ORDER BY schimbat_la DESC`
      : `SELECT ${COLOANE} FROM texte ORDER BY schimbat_la DESC`,
    fel ? [fel] : [],
  );
  return randuri.map(dinRand);
}

export async function textPublicat(
  fel: FelText,
  slug: string,
): Promise<Text | null> {
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM texte
      WHERE fel = $1 AND slug = $2 AND stare = 'publicat' LIMIT 1`,
    [fel, slug],
  );
  return randuri[0] ? dinRand(randuri[0]) : null;
}

export async function textDupaId(id: string): Promise<Text | null> {
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM texte WHERE id = $1 LIMIT 1`,
    [id],
  );
  return randuri[0] ? dinRand(randuri[0]) : null;
}

/**
 * Un slug liber, pornind de la titlu.
 *
 * Dacă e luat, primește un număr la coadă. Slugul nu se schimbă la editare:
 * odată publicat, textul poate fi deja trimis pe Facebook, iar o adresă care
 * se schimbă sub picioarele cuiva e un link stricat.
 */
export async function slugLiber(
  fel: FelText,
  titlu: string,
): Promise<string> {
  const baza = faSlug(titlu) || "text";
  const luate = await intreaba<{ slug: string }>(
    `SELECT slug FROM texte WHERE fel = $1 AND slug LIKE $2`,
    [fel, `${baza}%`],
  );
  const set = new Set(luate.map((r) => r.slug));
  if (!set.has(baza)) return baza;
  for (let i = 2; i < 200; i++) {
    if (!set.has(`${baza}-${i}`)) return `${baza}-${i}`;
  }
  return `${baza}-${Date.now()}`;
}

export type DateText = {
  fel: FelText;
  titlu: string;
  rezumat: string;
  continut: string;
  poza: { id: string; latime: number; inaltime: number; alt: string } | null;
  tintaBani: number | null;
  publicat: boolean;
};

/** Scrie un text nou. Întoarce identificatorul lui. */
export async function creeazaText(date: DateText): Promise<string> {
  const slug = await slugLiber(date.fel, date.titlu);
  const randuri = await intreaba<{ id: string }>(
    `INSERT INTO texte
       (fel, slug, titlu, rezumat, continut, poza_id, poza_latime,
        poza_inaltime, poza_alt, tinta_bani, stare, publicat_la)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      date.fel,
      slug,
      date.titlu,
      date.rezumat,
      date.continut,
      date.poza?.id ?? null,
      date.poza?.latime ?? null,
      date.poza?.inaltime ?? null,
      date.poza?.alt ?? null,
      date.tintaBani,
      date.publicat ? "publicat" : "ciorna",
      date.publicat ? new Date() : null,
    ],
  );
  return randuri[0].id;
}

/**
 * Schimbă un text care există. Poza se schimbă doar dacă s-a trimis una nouă.
 *
 * `publicat_la` se pune o singură dată, la prima publicare: altfel o corectură
 * de virgulă făcută peste șase luni ar urca textul înapoi în capul listei, ca
 * și cum ar fi scris azi.
 */
export async function schimbaText(
  id: string,
  date: Omit<DateText, "fel">,
): Promise<void> {
  await intreaba(
    `UPDATE texte SET
       titlu = $2,
       rezumat = $3,
       continut = $4,
       poza_id = COALESCE($5, poza_id),
       poza_latime = COALESCE($6, poza_latime),
       poza_inaltime = COALESCE($7, poza_inaltime),
       poza_alt = COALESCE($8, poza_alt),
       tinta_bani = $9,
       stare = $10,
       publicat_la = CASE
         WHEN $10 = 'publicat' AND publicat_la IS NULL THEN now()
         WHEN $10 = 'ciorna' THEN NULL
         ELSE publicat_la
       END,
       schimbat_la = now()
     WHERE id = $1`,
    [
      id,
      date.titlu,
      date.rezumat,
      date.continut,
      date.poza?.id ?? null,
      date.poza?.latime ?? null,
      date.poza?.inaltime ?? null,
      date.poza?.alt ?? null,
      date.tintaBani,
      date.publicat ? "publicat" : "ciorna",
    ],
  );
}

export async function stergeText(id: string): Promise<void> {
  await intreaba(`DELETE FROM texte WHERE id = $1`, [id]);
}

/** Câte ciorne și câte publicate, pentru tabloul de bord. */
export async function cateTexte(): Promise<
  Array<{ fel: FelText; publicate: number; ciorne: number }>
> {
  const randuri = await intreaba<{
    fel: string;
    publicate: string;
    ciorne: string;
  }>(
    `SELECT fel,
            count(*) FILTER (WHERE stare = 'publicat') AS publicate,
            count(*) FILTER (WHERE stare = 'ciorna')   AS ciorne
       FROM texte GROUP BY fel`,
  );
  return FELURI.map((f) => {
    const r = randuri.find((x) => x.fel === f.id);
    return {
      fel: f.id,
      publicate: Number(r?.publicate ?? 0),
      ciorne: Number(r?.ciorne ?? 0),
    };
  });
}
