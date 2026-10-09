import { randomBytes } from "node:crypto";
import { intreaba } from "./baza";
import { faSlug } from "./slug-proiecte.mjs";
import type { Campanie, CampanieDeVerificat, Stare } from "@/date/aniversari";

/** Rândul așa cum vine din Postgres, cu numele coloanelor. */
type Rand = {
  id: string;
  slug: string;
  ocazie: string;
  titlu: string;
  mesaj: string;
  nume_public: string;
  email: string;
  data_evenimentului: Date | null;
  poza_id: string | null;
  poza_latime: number | null;
  poza_inaltime: number | null;
  link_galantom: string | null;
  stare: string;
  creat_la: Date;
};

function laCampanie(r: Rand): Campanie {
  return {
    slug: r.slug,
    ocazie: r.ocazie,
    titlu: r.titlu,
    mesaj: r.mesaj,
    numePublic: r.nume_public,
    dataEvenimentului: r.data_evenimentului
      ? r.data_evenimentului.toISOString().slice(0, 10)
      : null,
    pozaId: r.poza_id,
    pozaLatime: r.poza_latime,
    pozaInaltime: r.poza_inaltime,
    linkGalantom: r.link_galantom,
    stare: r.stare as Stare,
    creatLa: r.creat_la.toISOString(),
  };
}

/**
 * Un slug unic, pornind de la titlu.
 *
 * Două persoane pot numi pagina la fel („Ziua mea”), deci adăugăm un sufix
 * scurt când adresa e deja luată. Nu punem numărul de la început: prima
 * campanie cu un titlu primește adresa curată.
 */
async function slugLiber(titlu: string): Promise<string> {
  const baza = faSlug(titlu).slice(0, 60) || "campanie";
  for (let i = 0; i < 6; i++) {
    const candidat =
      i === 0 ? baza : `${baza}-${randomBytes(2).toString("hex")}`;
    const luat = await intreaba<{ unu: number }>(
      "SELECT 1 AS unu FROM campanii_aniversare WHERE slug = $1",
      [candidat],
    );
    if (luat.length === 0) return candidat;
  }
  return `${baza}-${randomBytes(4).toString("hex")}`;
}

export async function creeazaCampanie(date: {
  ocazie: string;
  titlu: string;
  mesaj: string;
  numePublic: string;
  email: string;
  dataEvenimentului: string | null;
  pozaId: string | null;
  pozaLatime: number | null;
  pozaInaltime: number | null;
  linkGalantom: string | null;
}): Promise<{ slug: string; jeton: string }> {
  const slug = await slugLiber(date.titlu);
  // Jetonul îi dă omului o adresă pe care își vede propria campanie cât timp
  // e încă neverificată, fără cont și fără parolă.
  const jeton = randomBytes(16).toString("hex");

  await intreaba(
    `INSERT INTO campanii_aniversare
       (slug, ocazie, titlu, mesaj, nume_public, email, data_evenimentului,
        poza_id, poza_latime, poza_inaltime, link_galantom, jeton)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      slug,
      date.ocazie,
      date.titlu,
      date.mesaj,
      date.numePublic,
      date.email,
      date.dataEvenimentului,
      date.pozaId,
      date.pozaLatime,
      date.pozaInaltime,
      date.linkGalantom,
      jeton,
    ],
  );

  return { slug, jeton };
}

/** Campania publică. Nedescoperibilă până nu e verificată de asociație. */
export async function campaniePublicata(
  slug: string,
): Promise<Campanie | null> {
  const randuri = await intreaba<Rand>(
    "SELECT * FROM campanii_aniversare WHERE slug = $1 AND stare = 'publicata'",
    [slug],
  );
  return randuri[0] ? laCampanie(randuri[0]) : null;
}

/** Campania proprie, văzută cu jetonul primit la creare, în orice stare. */
export async function campanieCuJeton(
  slug: string,
  jeton: string,
): Promise<Campanie | null> {
  const randuri = await intreaba<Rand>(
    "SELECT * FROM campanii_aniversare WHERE slug = $1 AND jeton = $2",
    [slug, jeton],
  );
  return randuri[0] ? laCampanie(randuri[0]) : null;
}

export async function campaniiDeVerificat(): Promise<CampanieDeVerificat[]> {
  const randuri = await intreaba<Rand>(
    `SELECT * FROM campanii_aniversare
      WHERE stare = 'in_asteptare'
      ORDER BY creat_la ASC`,
  );
  return randuri.map((r) => ({ ...laCampanie(r), id: r.id, email: r.email }));
}

export async function hotaraste(
  id: string,
  stare: "publicata" | "respinsa",
  motiv?: string,
): Promise<boolean> {
  const randuri = await intreaba<{ id: string }>(
    `UPDATE campanii_aniversare
        SET stare = $2, motiv = $3, hotarat_la = now()
      WHERE id = $1 AND stare = 'in_asteptare'
      RETURNING id`,
    [id, stare, motiv ?? null],
  );
  return randuri.length > 0;
}
