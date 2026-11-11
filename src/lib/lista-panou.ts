import { intreaba } from "./baza";

/**
 * Mutarea cu ↑ și ↓ într-o listă ținută din panou (echipa, aparițiile în
 * presă). Aceeași regulă ca la sponsori (`lib/sponsori.ts`), unde a prins-o
 * proba: se mută **între rândurile la fel de vizibile**, nu peste cele scoase
 * de pe site — altfel omul apasă o dată, pe site nu se mișcă nimic, și crede
 * că butonul e stricat. Ordinea se rescrie întreagă, ca rânduri cu ordini
 * egale să nu rămână pe aceeași poziție.
 */
const TABELE = new Set(["echipa", "aparitii_presa"]);

export async function mutaInLista(
  tabel: "echipa" | "aparitii_presa",
  id: string,
  incotro: "sus" | "jos",
): Promise<boolean> {
  if (!TABELE.has(tabel) || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  const toate = await intreaba<{ id: string; activ: boolean }>(
    `SELECT id, activ FROM ${tabel} ORDER BY activ DESC, ordine, creat_la`,
  );
  const acesta = toate.find((r) => r.id === id);
  if (!acesta) return false;
  const deLa = toate.findIndex((r) => r.activ === acesta.activ);
  const grup = toate.filter((r) => r.activ === acesta.activ);
  const unde = grup.findIndex((r) => r.id === id);
  const vecin = incotro === "sus" ? unde - 1 : unde + 1;
  if (vecin < 0 || vecin >= grup.length) return false;
  [grup[unde], grup[vecin]] = [grup[vecin], grup[unde]];
  const rearanjat = [...toate];
  rearanjat.splice(deLa, grup.length, ...grup);
  for (const [i, r] of rearanjat.entries()) {
    await intreaba(`UPDATE ${tabel} SET ordine = $2 WHERE id = $1`, [r.id, i]);
  }
  return true;
}

export async function stareInLista(
  tabel: "echipa" | "aparitii_presa",
  id: string,
  activ: boolean,
): Promise<boolean> {
  if (!TABELE.has(tabel) || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  const r = await intreaba<{ id: string }>(
    `UPDATE ${tabel} SET activ = $2, schimbat_la = now() WHERE id = $1 RETURNING id`,
    [id, activ],
  );
  return r.length > 0;
}
