import { cacheTag } from "next/cache";
import { cachePanou, cacheRezerva } from "./cache-panou";
import { areBazaDeDate, intreaba } from "./baza";
import { ECHIPA, type MembruEchipa } from "@/date/echipa";

/**
 * Echipa de pe „Despre noi”, ținută din panou (`/admin/echipa`).
 *
 * Până pe 11 noiembrie 2026 stătea în cod: poza Mihaelei, care lipsea de la
 * lansare, cerea un mesaj către dezvoltator. Aceeași formă ca sponsorii:
 * tabelul pornește cu lista de la lansare (`date/echipa.ts`), nimic nu se
 * șterge — un om plecat se scoate de pe site — și se mută cu ↑ și ↓.
 */
const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS echipa (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nume        text NOT NULL,
    rol         text,
    descriere   text,
    poza        text,
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
      "SELECT count(*)::text AS cate FROM echipa",
    );
    if (Number(cate) > 0) return;
    for (const [i, m] of ECHIPA.entries()) {
      await intreaba(
        `INSERT INTO echipa (nume, rol, descriere, poza, ordine) VALUES ($1, $2, $3, $4, $5)`,
        [m.nume, m.rol ?? null, m.descriere ?? null, m.poza ?? null, i],
      ).catch(() => undefined);
    }
  })().catch((eroare) => {
    gata = null;
    throw eroare;
  });
  return gata;
}

export const ETICHETA_ECHIPA = "echipa";

export type MembruPanou = MembruEchipa & { id: string; activ: boolean };

type Rand = {
  id: string;
  nume: string;
  rol: string | null;
  descriere: string | null;
  poza: string | null;
  activ: boolean;
};

function catreMembru(r: Rand): MembruEchipa {
  return {
    nume: r.nume,
    rol: r.rol ?? undefined,
    descriere: r.descriere ?? undefined,
    poza: r.poza ?? undefined,
  };
}

async function citesteActivi(): Promise<MembruEchipa[]> {
  await pregateste();
  const r = await intreaba<Rand>(
    "SELECT id, nume, rol, descriere, poza, activ FROM echipa WHERE activ ORDER BY ordine, creat_la",
  );
  return r.map(catreMembru);
}

/** Echipa de pe site. Cu baza căzută, lista de la lansare. */
export async function echipaSite(): Promise<ReadonlyArray<MembruEchipa>> {
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_ECHIPA);
  if (!areBazaDeDate()) return ECHIPA;
  const toti = await citesteActivi().catch(() => null);
  if (toti) return toti;
  cacheRezerva();
  return ECHIPA;
}

export async function echipaPanou(): Promise<MembruPanou[]> {
  await pregateste();
  const r = await intreaba<Rand>(
    "SELECT id, nume, rol, descriere, poza, activ FROM echipa ORDER BY activ DESC, ordine, creat_la",
  );
  return r.map((x) => ({ ...catreMembru(x), id: x.id, activ: x.activ }));
}

export async function faceMembru(m: MembruEchipa): Promise<boolean> {
  await pregateste();
  const r = await intreaba<{ id: string }>(
    `INSERT INTO echipa (nume, rol, descriere, poza, ordine)
     VALUES ($1, $2, $3, $4, COALESCE((SELECT max(ordine) + 1 FROM echipa), 0))
     RETURNING id`,
    [m.nume, m.rol ?? null, m.descriere ?? null, m.poza ?? null],
  );
  return r.length > 0;
}

/** Schimbă textele; poza numai dacă vine una nouă (`poza` nedefinit = rămâne). */
export async function schimbaMembru(id: string, m: MembruEchipa): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();
  const r = await intreaba<{ id: string }>(
    `UPDATE echipa SET nume = $2, rol = $3, descriere = $4,
       poza = COALESCE($5, poza), schimbat_la = now()
     WHERE id = $1 RETURNING id`,
    [id, m.nume, m.rol ?? null, m.descriere ?? null, m.poza ?? null],
  );
  return r.length > 0;
}

export { pregateste as pregatesteEchipa };
