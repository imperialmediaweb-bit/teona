import { cacheTag } from "next/cache";
import { cachePanou, cacheRezerva } from "./cache-panou";
import { areBazaDeDate, intreaba } from "./baza";
import { APARITII, type AparitiePresa } from "@/date/aparitii-presa";

/**
 * Aparițiile de pe „Suntem în presă”, ținute din panou (`/admin/aparitii`).
 *
 * Până pe 11 noiembrie 2026 lista stătea în cod: un articol nou despre o
 * tabără cerea un mesaj către dezvoltator. Pornește cu lista de la lansare
 * (`date/aparitii-presa.ts`); o apariție nouă intră **prima**, fiindcă pagina
 * e o cronologie de la cea mai nouă. Nimic nu se șterge, se scoate de pe site.
 */
const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS aparitii_presa (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    publicatie  text NOT NULL,
    data_text   text NOT NULL,
    an          text NOT NULL,
    titlu       text NOT NULL,
    adresa      text,
    incorporare text,
    activ       boolean NOT NULL DEFAULT true,
    ordine      integer NOT NULL DEFAULT 0,
    creat_la    timestamptz NOT NULL DEFAULT now(),
    schimbat_la timestamptz NOT NULL DEFAULT now()
  );
`;

let gata: Promise<void> | null = null;

async function pregateste(): Promise<void> {
  gata ??= (async () => {
    await intreaba(DEFINITIE);
    const [{ cate }] = await intreaba<{ cate: string }>(
      "SELECT count(*)::text AS cate FROM aparitii_presa",
    );
    if (Number(cate) > 0) return;
    for (const [i, a] of APARITII.entries()) {
      await intreaba(
        `INSERT INTO aparitii_presa (publicatie, data_text, an, titlu, adresa, incorporare, ordine)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.publicatie, a.data, a.an, a.titlu, a.adresa ?? null, a.incorporare ?? null, i],
      ).catch(() => undefined);
    }
  })().catch((eroare) => {
    gata = null;
    throw eroare;
  });
  return gata;
}

export const ETICHETA_APARITII = "aparitii-presa";

export type AparitiePanou = AparitiePresa & { id: string; activ: boolean };

type Rand = {
  id: string;
  publicatie: string;
  data_text: string;
  an: string;
  titlu: string;
  adresa: string | null;
  incorporare: string | null;
  activ: boolean;
};

const COLOANE = "id, publicatie, data_text, an, titlu, adresa, incorporare, activ";

function catreAparitie(r: Rand): AparitiePresa {
  return {
    publicatie: r.publicatie,
    data: r.data_text,
    an: r.an,
    titlu: r.titlu,
    adresa: r.adresa ?? undefined,
    incorporare: r.incorporare ?? undefined,
  };
}

/** Aparițiile de pe site. Cu baza căzută, lista de la lansare. */
export async function aparitiiSite(): Promise<ReadonlyArray<AparitiePresa>> {
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_APARITII);
  if (!areBazaDeDate()) return APARITII;
  const toate = await (async () => {
    await pregateste();
    const r = await intreaba<Rand>(
      `SELECT ${COLOANE} FROM aparitii_presa WHERE activ ORDER BY ordine, creat_la`,
    );
    return r.map(catreAparitie);
  })().catch(() => null);
  if (toate) return toate;
  cacheRezerva();
  return APARITII;
}

export async function aparitiiPanou(): Promise<AparitiePanou[]> {
  await pregateste();
  const r = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM aparitii_presa ORDER BY activ DESC, ordine, creat_la`,
  );
  return r.map((x) => ({ ...catreAparitie(x), id: x.id, activ: x.activ }));
}

export async function faceAparitie(a: AparitiePresa): Promise<boolean> {
  await pregateste();
  const r = await intreaba<{ id: string }>(
    `INSERT INTO aparitii_presa (publicatie, data_text, an, titlu, adresa, incorporare, ordine)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE((SELECT min(ordine) - 1 FROM aparitii_presa), 0))
     RETURNING id`,
    [a.publicatie, a.data, a.an, a.titlu, a.adresa ?? null, a.incorporare ?? null],
  );
  return r.length > 0;
}

export async function schimbaAparitie(id: string, a: AparitiePresa): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();
  const r = await intreaba<{ id: string }>(
    `UPDATE aparitii_presa SET publicatie = $2, data_text = $3, an = $4, titlu = $5,
       adresa = $6, incorporare = $7, schimbat_la = now()
     WHERE id = $1 RETURNING id`,
    [id, a.publicatie, a.data, a.an, a.titlu, a.adresa ?? null, a.incorporare ?? null],
  );
  return r.length > 0;
}

export { pregateste as pregatesteAparitii };
