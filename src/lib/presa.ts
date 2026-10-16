import { intreaba } from "@/lib/baza";
import { PRESA_SUCEAVA, type FelPresa } from "@/date/presa-suceava";

/**
 * Lista de presă: cui se trimite un comunicat.
 *
 * **De ce o ține asociația, nu codul.** Adresa generală a unei redacții intră
 * într-o cutie în care ajung o sută de comunicate pe zi. Ce publică e
 * ziaristul cu care ai vorbit la telefon. Lista aia se schimbă des și o știe
 * omul din asociație, deci se scrie din panou.
 *
 * Sămânța din `src/date/presa-suceava.ts` se pune o singură dată, ca să nu se
 * pornească de la o pagină goală. Rândurile fără adresă rămân în listă
 * dinadins: se vede ce lipsește.
 */

export type ContactPresa = {
  id: string;
  publicatie: string;
  fel: FelPresa;
  email: string | null;
  telefon: string | null;
  persoana: string | null;
  site: string | null;
  notite: string | null;
  activ: boolean;
};

export const FELURI_PRESA: ReadonlyArray<{ id: FelPresa; nume: string }> = [
  { id: "ziar", nume: "Ziar" },
  { id: "online", nume: "Online" },
  { id: "tv", nume: "Televiziune" },
  { id: "radio", nume: "Radio" },
];

export function esteFelPresa(x: unknown): x is FelPresa {
  return FELURI_PRESA.some((f) => f.id === x);
}

type Rand = {
  id: string;
  publicatie: string;
  fel: string;
  email: string | null;
  telefon: string | null;
  persoana: string | null;
  site: string | null;
  notite: string | null;
  activ: boolean;
};

function dinRand(r: Rand): ContactPresa {
  return {
    id: r.id,
    publicatie: r.publicatie,
    fel: esteFelPresa(r.fel) ? r.fel : "online",
    email: r.email,
    telefon: r.telefon,
    persoana: r.persoana,
    site: r.site,
    notite: r.notite,
    activ: r.activ,
  };
}

/** Toate contactele, cu sămânța pusă la prima deschidere. */
export async function contactePresa(): Promise<ContactPresa[]> {
  const randuri = await intreaba<Rand>(
    `SELECT id, publicatie, fel, email, telefon, persoana, site, notite, activ
       FROM contacte_presa ORDER BY activ DESC, publicatie`,
  );
  if (randuri.length > 0) return randuri.map(dinRand);

  await seamana();
  const dupa = await intreaba<Rand>(
    `SELECT id, publicatie, fel, email, telefon, persoana, site, notite, activ
       FROM contacte_presa ORDER BY activ DESC, publicatie`,
  );
  return dupa.map(dinRand);
}

/**
 * Pune sămânța, o singură dată.
 *
 * `WHERE NOT EXISTS` în loc de un steag într-un tabel de setări: dacă
 * asociația șterge toate rândurile dinadins, nu i le punem înapoi la fiecare
 * deschidere — dar nici nu se dublează dacă două file se deschid odată.
 */
async function seamana(): Promise<void> {
  for (const c of PRESA_SUCEAVA) {
    await intreaba(
      `INSERT INTO contacte_presa (publicatie, fel, email, telefon, site, notite)
       SELECT $1, $2, $3, $4, $5, $6
        WHERE NOT EXISTS (SELECT 1 FROM contacte_presa WHERE publicatie = $1)`,
      [c.publicatie, c.fel, c.email, c.telefon, c.site, c.notite],
    ).catch(() => undefined);
  }
}

export async function adaugaContactPresa(d: {
  publicatie: string;
  fel: FelPresa;
  email: string | null;
  telefon: string | null;
  persoana: string | null;
  site: string | null;
  notite: string | null;
}): Promise<void> {
  await intreaba(
    `INSERT INTO contacte_presa
       (publicatie, fel, email, telefon, persoana, site, notite)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [d.publicatie, d.fel, d.email, d.telefon, d.persoana, d.site, d.notite],
  );
}

export async function schimbaContactPresa(
  id: string,
  d: {
    publicatie: string;
    fel: FelPresa;
    email: string | null;
    telefon: string | null;
    persoana: string | null;
    site: string | null;
    notite: string | null;
    activ: boolean;
  },
): Promise<void> {
  await intreaba(
    `UPDATE contacte_presa
        SET publicatie = $2, fel = $3, email = $4, telefon = $5,
            persoana = $6, site = $7, notite = $8, activ = $9,
            schimbat_la = now()
      WHERE id = $1`,
    [
      id,
      d.publicatie,
      d.fel,
      d.email,
      d.telefon,
      d.persoana,
      d.site,
      d.notite,
      d.activ,
    ],
  );
}

export async function stergeContactPresa(id: string): Promise<void> {
  await intreaba("DELETE FROM contacte_presa WHERE id = $1", [id]);
}
