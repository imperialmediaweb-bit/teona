import { intreaba } from "./baza";

/**
 * CRM: firmele, cererile și jurnalul discuțiilor.
 *
 * Donatorii persoane fizice se calculează din `donatii` — vezi
 * `src/lib/plati/donatori.ts`. Aici stă restul, adică tot ce nu e o plată:
 * firmele care vor să sponsorizeze, oamenii care cer pașii de 3,5%,
 * voluntarii, mesajele de contact, și ce s-a vorbit cu fiecare.
 *
 * Totul de aici sunt date personale. Niciun fișier public nu cheamă nimic de
 * aici.
 */

// ─── Firme ────────────────────────────────────────────────────────────────

/** Stadiile prin care trece o sponsorizare, în ordine. */
export const STADII_FIRMA = [
  { id: "cerere", eticheta: "Cerere nouă", culoare: "miere" },
  { id: "contract_trimis", eticheta: "Contract trimis", culoare: "turcoaz" },
  { id: "semnat", eticheta: "Contract semnat", culoare: "turcoaz" },
  { id: "incasat", eticheta: "Bani încasați", culoare: "caramiziu" },
  { id: "renuntat", eticheta: "A renunțat", culoare: "cerneala" },
] as const;

export type StadiuFirma = (typeof STADII_FIRMA)[number]["id"];

export function esteStadiuFirma(x: unknown): x is StadiuFirma {
  return STADII_FIRMA.some((s) => s.id === x);
}

export type Firma = {
  id: string;
  cui: string;
  denumire: string;
  persoana: string;
  email: string;
  telefon: string | null;
  cale: string;
  sumaEstimata: string | null;
  mesaj: string | null;
  stadiu: StadiuFirma;
  sumaBani: number | null;
  creatLa: string;
  schimbatLa: string;
};

type RandFirma = {
  id: string;
  cui: string;
  denumire: string;
  persoana: string;
  email: string;
  telefon: string | null;
  cale: string;
  suma_estimata: string | null;
  mesaj: string | null;
  stadiu: string;
  suma_bani: string | null;
  creat_la: Date;
  schimbat_la: Date;
};

function laFirma(r: RandFirma): Firma {
  return {
    id: r.id,
    cui: r.cui,
    denumire: r.denumire,
    persoana: r.persoana,
    email: r.email,
    telefon: r.telefon,
    cale: r.cale,
    sumaEstimata: r.suma_estimata,
    mesaj: r.mesaj,
    stadiu: r.stadiu as StadiuFirma,
    sumaBani: r.suma_bani === null ? null : Number(r.suma_bani),
    creatLa: r.creat_la.toISOString(),
    schimbatLa: r.schimbat_la.toISOString(),
  };
}

/**
 * CUI-ul, adus la o formă unică.
 *
 * Oamenii îl scriu „RO12345678”, „ro 12345678” sau „12345678”, și toate trei
 * sunt aceeași firmă. Fără normalizare, a doua cerere a aceleiași firme ar
 * crea un al doilea card în lista de urmărit, cu alt stadiu decât primul.
 */
export function normalizeazaCui(brut: string): string {
  return brut.replace(/\s/g, "").replace(/^ro/i, "");
}

/**
 * Scrie firma care tocmai a cerut sponsorizare.
 *
 * Dacă CUI-ul există deja, se actualizează datele de contact și calea —
 * omul poate să fi schimbat persoana de contact sau să se fi răzgândit —
 * dar **nu** stadiul: o firmă care a semnat deja contractul nu se întoarce
 * la „cerere nouă” fiindcă a mai trimis o dată formularul.
 */
export async function salveazaFirma(date: {
  cui: string;
  denumire: string;
  persoana: string;
  email: string;
  telefon?: string;
  cale: string;
  sumaEstimata?: string;
  mesaj?: string;
}): Promise<{ id: string; eraDeja: boolean } | null> {
  const randuri = await intreaba<{ id: string; era_deja: boolean }>(
    `INSERT INTO firme
       (cui, denumire, persoana, email, telefon, cale, suma_estimata, mesaj)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (cui) DO UPDATE SET
       denumire      = EXCLUDED.denumire,
       persoana      = EXCLUDED.persoana,
       email         = EXCLUDED.email,
       telefon       = COALESCE(EXCLUDED.telefon, firme.telefon),
       cale          = EXCLUDED.cale,
       suma_estimata = COALESCE(EXCLUDED.suma_estimata, firme.suma_estimata),
       mesaj         = COALESCE(EXCLUDED.mesaj, firme.mesaj),
       schimbat_la   = now()
     RETURNING id, (xmax <> 0) AS era_deja`,
    [
      normalizeazaCui(date.cui),
      date.denumire,
      date.persoana,
      date.email,
      date.telefon ?? null,
      date.cale,
      date.sumaEstimata ?? null,
      date.mesaj ?? null,
    ],
  );
  const r = randuri[0];
  return r ? { id: r.id, eraDeja: r.era_deja } : null;
}

export async function firme(
  stadiu?: StadiuFirma,
  cautare = "",
  limita = 200,
): Promise<Firma[]> {
  const randuri = await intreaba<RandFirma>(
    `SELECT * FROM firme
      WHERE ($1::text IS NULL OR stadiu = $1)
        AND ($2 = '' OR denumire ILIKE '%' || $2 || '%'
             OR cui ILIKE '%' || $2 || '%'
             OR persoana ILIKE '%' || $2 || '%'
             OR email ILIKE '%' || $2 || '%')
      ORDER BY schimbat_la DESC
      LIMIT $3`,
    [stadiu ?? null, cautare, limita],
  );
  return randuri.map(laFirma);
}

export async function firma(id: string): Promise<Firma | null> {
  const randuri = await intreaba<RandFirma>(
    "SELECT * FROM firme WHERE id = $1",
    [id],
  );
  return randuri[0] ? laFirma(randuri[0]) : null;
}

export async function schimbaStadiulFirmei(
  id: string,
  stadiu: StadiuFirma,
  sumaBani?: number | null,
): Promise<Firma | null> {
  const randuri = await intreaba<RandFirma>(
    `UPDATE firme
        SET stadiu = $2,
            suma_bani = COALESCE($3, suma_bani),
            schimbat_la = now()
      WHERE id = $1
      RETURNING *`,
    [id, stadiu, sumaBani ?? null],
  );
  return randuri[0] ? laFirma(randuri[0]) : null;
}

// ─── Cereri (3,5%, voluntariat, contact) ──────────────────────────────────

export const FELURI_CERERE = [
  { id: "redirectionare", eticheta: "Redirecționare 3,5%" },
  { id: "voluntariat", eticheta: "Voluntariat" },
  { id: "contact", eticheta: "Mesaj de contact" },
] as const;

export type FelCerere = (typeof FELURI_CERERE)[number]["id"];

export const STADII_CERERE = [
  { id: "nou", eticheta: "Nou" },
  { id: "in_lucru", eticheta: "În lucru" },
  { id: "rezolvat", eticheta: "Rezolvat" },
] as const;

export type StadiuCerere = (typeof STADII_CERERE)[number]["id"];

export function esteFelCerere(x: unknown): x is FelCerere {
  return FELURI_CERERE.some((f) => f.id === x);
}

export function esteStadiuCerere(x: unknown): x is StadiuCerere {
  return STADII_CERERE.some((s) => s.id === x);
}

export type Cerere = {
  id: string;
  fel: FelCerere;
  nume: string;
  email: string;
  telefon: string | null;
  detalii: Record<string, string>;
  stadiu: StadiuCerere;
  creatLa: string;
};

type RandCerere = {
  id: string;
  fel: string;
  nume: string;
  email: string;
  telefon: string | null;
  detalii: Record<string, string>;
  stadiu: string;
  creat_la: Date;
};

function laCerere(r: RandCerere): Cerere {
  return {
    id: r.id,
    fel: r.fel as FelCerere,
    nume: r.nume,
    email: r.email,
    telefon: r.telefon,
    detalii: r.detalii ?? {},
    stadiu: r.stadiu as StadiuCerere,
    creatLa: r.creat_la.toISOString(),
  };
}

export async function salveazaCerere(date: {
  fel: FelCerere;
  nume: string;
  email: string;
  telefon?: string;
  detalii?: Record<string, string>;
}): Promise<string | null> {
  const randuri = await intreaba<{ id: string }>(
    `INSERT INTO cereri (fel, nume, email, telefon, detalii)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [
      date.fel,
      date.nume,
      date.email,
      date.telefon ?? null,
      JSON.stringify(date.detalii ?? {}),
    ],
  );
  return randuri[0]?.id ?? null;
}

export async function cereri(
  fel?: FelCerere,
  stadiu?: StadiuCerere,
  limita = 200,
): Promise<Cerere[]> {
  const randuri = await intreaba<RandCerere>(
    `SELECT * FROM cereri
      WHERE ($1::text IS NULL OR fel = $1)
        AND ($2::text IS NULL OR stadiu = $2)
      ORDER BY creat_la DESC
      LIMIT $3`,
    [fel ?? null, stadiu ?? null, limita],
  );
  return randuri.map(laCerere);
}

export async function schimbaStadiulCererii(
  id: string,
  stadiu: StadiuCerere,
): Promise<boolean> {
  const randuri = await intreaba<{ id: string }>(
    `UPDATE cereri SET stadiu = $2, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, stadiu],
  );
  return randuri.length > 0;
}

// ─── Jurnalul discuțiilor ─────────────────────────────────────────────────

export const FELURI_INTERACTIUNE = [
  { id: "telefon", eticheta: "Telefon" },
  { id: "email", eticheta: "E-mail" },
  { id: "intalnire", eticheta: "Întâlnire" },
  { id: "notita", eticheta: "Notiță" },
] as const;

export type FelInteractiune = (typeof FELURI_INTERACTIUNE)[number]["id"];

export function esteFelInteractiune(x: unknown): x is FelInteractiune {
  return FELURI_INTERACTIUNE.some((f) => f.id === x);
}

export type Interactiune = {
  id: string;
  fel: FelInteractiune;
  rezumat: string;
  cand: string;
};

export async function scrieInteractiune(date: {
  email?: string;
  firmaId?: string;
  fel: FelInteractiune;
  rezumat: string;
}): Promise<boolean> {
  if (!date.email && !date.firmaId) return false;
  await intreaba(
    `INSERT INTO interactiuni (email, firma_id, fel, rezumat)
     VALUES ($1,$2,$3,$4)`,
    [date.email ?? null, date.firmaId ?? null, date.fel, date.rezumat],
  );
  return true;
}

export async function interactiuni(cui: {
  email?: string;
  firmaId?: string;
}): Promise<Interactiune[]> {
  if (!cui.email && !cui.firmaId) return [];
  const randuri = await intreaba<{
    id: string;
    fel: string;
    rezumat: string;
    cand: Date;
  }>(
    `SELECT id, fel, rezumat, cand FROM interactiuni
      WHERE ($1::text IS NOT NULL AND email = $1)
         OR ($2::uuid IS NOT NULL AND firma_id = $2)
      ORDER BY cand DESC
      LIMIT 200`,
    [cui.email ?? null, cui.firmaId ?? null],
  );
  return randuri.map((r) => ({
    id: String(r.id),
    fel: r.fel as FelInteractiune,
    rezumat: r.rezumat,
    cand: r.cand.toISOString(),
  }));
}
