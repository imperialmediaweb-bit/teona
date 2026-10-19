import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheTag } from "next/cache";
import { cachePanou } from "./cache-panou";
import { areBazaDeDate, intreaba } from "./baza";

/**
 * Testimonialele de pe prima pagină, scrise de asociație.
 *
 * **De ce au ieșit din fișier.** Stăteau în `continut/testimoniale.json`,
 * adică la mine. Caietul cere pe față altceva, la 1.8: „asociația poate
 * adăuga sau scoate testimoniale oricând". Un părinte care scrie ceva frumos
 * după o tabără nu poate aștepta până apuc eu să fac o publicare.
 *
 * **Regulile caietului sunt ale textului, nu ale bazei de date.** Citat scurt
 * (20–35 de cuvinte), semnătură cu prenumele și rolul — „Maria, mama unui
 * băiat din tabără" —, fără nume de familie și fără fotografii. Baza nu le
 * poate impune: „Nela Mihaela" arată pentru ea la fel ca „Ana Maria". De aceea
 * pagina din panou le scrie deasupra câmpului și numără cuvintele în timp ce
 * omul scrie; hotărârea rămâne a lui.
 *
 * **Sămânța se pune o singură dată**, și numai dacă tabelul e gol — ca la
 * lista de presă. Altfel un testimonial scos de asociație ar învia la
 * următoarea pornire, iar omul ar crede că panoul nu-l ascultă.
 */

export type Testimonial = {
  id: string;
  citat: string;
  /** Doar prenumele și rolul, cum cere caietul. */
  semnatura: string;
  /**
   * De unde vine, când nu l-am primit direct.
   *
   * „Facebook" pentru recenziile publice de pe pagina asociației: omul care
   * citește trebuie să știe că e o recenzie publică, nu un text cules de noi.
   */
  sursa: string | null;
  activ: boolean;
  ordine: number;
};

const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS testimoniale (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    citat       text NOT NULL,
    semnatura   text NOT NULL,
    sursa       text,
    activ       boolean NOT NULL DEFAULT true,
    ordine      integer NOT NULL DEFAULT 0,
    creat_la    timestamptz NOT NULL DEFAULT now(),
    schimbat_la timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS testimoniale_afisate
    ON testimoniale (activ, ordine, creat_la);
`;

let gata: Promise<void> | null = null;

type Rand = {
  id: string;
  citat: string;
  semnatura: string;
  sursa: string | null;
  activ: boolean;
  ordine: number;
};

const COLOANE = "id, citat, semnatura, sursa, activ, ordine";

/** Cele cinci din fișier, pentru prima pornire. */
function dinFisier(): { citat: string; semnatura: string; sursa?: string }[] {
  try {
    return JSON.parse(
      readFileSync(
        join(process.cwd(), "continut", "testimoniale.json"),
        "utf8",
      ),
    );
  } catch {
    return [];
  }
}

async function pregateste(): Promise<void> {
  gata ??= (async () => {
    await intreaba(DEFINITIE);
    const [{ cate }] = await intreaba<{ cate: string }>(
      "SELECT count(*)::text AS cate FROM testimoniale",
    );
    if (Number(cate) > 0) return;
    const samanta = dinFisier();
    for (const [i, t] of samanta.entries()) {
      await intreaba(
        `INSERT INTO testimoniale (citat, semnatura, sursa, ordine)
         VALUES ($1, $2, $3, $4)`,
        [t.citat, t.semnatura, t.sursa ?? null, i],
      ).catch(() => undefined);
    }
  })().catch((eroare) => {
    gata = null;
    throw eroare;
  });
  return gata;
}

/** Numărul de cuvinte dintr-un citat. Caietul cere între 20 și 35. */
export function cateCuvinte(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const CUVINTE_MIN = 20;
export const CUVINTE_MAX = 35;

/** Eticheta cache-ului prime pagini, golită la fiecare schimbare din panou. */
export const ETICHETA_TESTIMONIALE = "testimoniale";

/** Citirea goală, fără cache: ea poate arunca, și are unde să fie prinsă. */
async function citesteActive(): Promise<Testimonial[]> {
  await pregateste();
  return intreaba<Rand>(
    `SELECT ${COLOANE} FROM testimoniale
      WHERE activ ORDER BY ordine, creat_la`,
  );
}

/** Cele care se văd pe site, în ordinea aleasă. */
export async function testimonialePublice(): Promise<Testimonial[]> {
  /*
    Cache cu etichetă, din același motiv ca la descrierile taberelor: prima
    pagină se pregenerează, iar o citire necachată ar opri construirea cu
    „uncached or runtime data during prerendering". Eticheta se golește când
    asociația adaugă sau scoate unul, deci schimbarea se vede pe loc.

    **Prinderea erorii stă aici, înăuntru, nu la locul apelului.** Cu
    `cacheComponents`, o eroare aruncată dintr-o funcție „use cache" nu se
    mai poate prinde din afară: Next o numără ca eroare de pregenerare și
    oprește tot build-ul. Un `.catch()` pe apel arată că acoperă cazul și nu
    acoperă nimic.

    Și cazul e sigur, nu teoretic: Railway construiește cu `DATABASE_URL`
    pus, dar **rețeaua lui privată nu răspunde în timpul build-ului** —
    `postgres.railway.internal` nu se rezolvă. Deci la fiecare publicare,
    citirea de aici cade. Prinsă, prima pagină se construiește cu
    testimonialele din fișier, iar la prima reîmprospătare de la pornire —
    când baza răspunde — se umple cu cele din panou. Ca la `dinPanou()` din
    `date/proiecte.ts`, unde prinderea e tot înăuntru, din același motiv.
  */
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_TESTIMONIALE);
  if (!areBazaDeDate()) return [];
  return citesteActive().catch(() => []);
}

/** Toate, inclusiv cele oprite: lista din panou. */
export async function testimonialeToate(): Promise<Testimonial[]> {
  if (!areBazaDeDate()) return [];
  await pregateste();
  return intreaba<Rand>(
    `SELECT ${COLOANE} FROM testimoniale
      ORDER BY activ DESC, ordine, creat_la`,
  );
}

export async function faceTestimonial(date: {
  citat: string;
  semnatura: string;
  sursa?: string | null;
}): Promise<boolean> {
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `INSERT INTO testimoniale (citat, semnatura, sursa, ordine)
     VALUES ($1, $2, $3,
       COALESCE((SELECT max(ordine) + 1 FROM testimoniale), 0))
     RETURNING id`,
    [date.citat.trim(), date.semnatura.trim(), date.sursa?.trim() || null],
  );
  return randuri.length > 0;
}

export async function schimbaTestimonial(
  id: string,
  date: { citat: string; semnatura: string; sursa?: string | null },
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE testimoniale
        SET citat = $2, semnatura = $3, sursa = $4, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, date.citat.trim(), date.semnatura.trim(), date.sursa?.trim() || null],
  );
  return randuri.length > 0;
}

/**
 * Îl oprește sau îl pornește.
 *
 * Nu se șterge nimic: un testimonial scos azi poate fi vrut înapoi la
 * primăvară, iar cuvintele alea le-a scris un om care nu le mai scrie a doua
 * oară la fel.
 */
export async function schimbaStareaTestimonialului(
  id: string,
  activ: boolean,
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE testimoniale SET activ = $2, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, activ],
  );
  return randuri.length > 0;
}
