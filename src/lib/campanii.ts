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
}): Promise<{ slug: string; jeton: string }> {
  const slug = await slugLiber(date.titlu);
  // Jetonul îi dă omului o adresă pe care își vede propria campanie cât timp
  // e încă neverificată, fără cont și fără parolă.
  const jeton = randomBytes(16).toString("hex");

  await intreaba(
    `INSERT INTO campanii_aniversare
       (slug, ocazie, titlu, mesaj, nume_public, email, data_evenimentului,
        poza_id, poza_latime, poza_inaltime, jeton)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
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

/**
 * Paginile publicate, cu cât a strâns fiecare.
 *
 * De când butonul „Donează" de pe pagina cuiva duce la formularul nostru cu
 * slugul campaniei în adresă, donațiile poartă slugul. Fără interogarea asta,
 * banii ar intra în grămadă, iar omul care și-a făcut pagina n-ar putea primi
 * niciun răspuns la singura întrebare care-l interesează: „a strâns ceva?”.
 *
 * Se numără doar donațiile încasate, în lei. Una în euro, prin PayPal, n-are
 * ce căuta în același total — cursul care contează e al băncii, în ziua
 * încasării, nu unul ales de noi.
 */
export async function campaniiPublicateCuBani(limita = 50): Promise<
  Array<{
    slug: string;
    titlu: string;
    numePublic: string;
    bani: number;
    donatii: number;
    publicataLa: string;
  }>
> {
  const randuri = await intreaba<{
    slug: string;
    titlu: string;
    nume_public: string;
    bani: string | null;
    cate: string;
    creat_la: Date;
  }>(
    `SELECT c.slug, c.titlu, c.nume_public, c.creat_la,
            (SELECT SUM(d.suma_bani) FROM donatii d
              WHERE d.campanie_slug = c.slug
                AND d.moneda = 'RON'
                AND d.stare = 'platita') AS bani,
            (SELECT count(*) FROM donatii d
              WHERE d.campanie_slug = c.slug
                AND d.stare = 'platita') AS cate
       FROM campanii_aniversare c
      WHERE c.stare = 'publicata'
      ORDER BY c.creat_la DESC
      LIMIT $1`,
    [limita],
  );
  return randuri.map((r) => ({
    slug: r.slug,
    titlu: r.titlu,
    numePublic: r.nume_public,
    bani: Number(r.bani ?? 0),
    donatii: Number(r.cate ?? 0),
    publicataLa: r.creat_la.toISOString(),
  }));
}

/**
 * Publică sau respinge o campanie.
 *
 * Întoarce rândul **doar dacă starea chiar s-a schimbat acum** — condiția
 * `stare = 'in_asteptare'` face ca o a doua apăsare pe același buton să nu
 * producă nimic. Așa omul nu primește de două ori același e-mail.
 */
export async function hotaraste(
  id: string,
  stare: "publicata" | "respinsa",
  motiv?: string,
): Promise<{ email: string; numePublic: string; titlu: string; slug: string } | null> {
  const randuri = await intreaba<{
    email: string;
    nume_public: string;
    titlu: string;
    slug: string;
  }>(
    `UPDATE campanii_aniversare
        SET stare = $2, motiv = $3, hotarat_la = now()
      WHERE id = $1 AND stare = 'in_asteptare'
      RETURNING email, nume_public, titlu, slug`,
    [id, stare, motiv ?? null],
  );
  const r = randuri[0];
  return r
    ? { email: r.email, numePublic: r.nume_public, titlu: r.titlu, slug: r.slug }
    : null;
}
