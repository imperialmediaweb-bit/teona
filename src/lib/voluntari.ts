import { intreaba } from "./baza";
import { cereri, type Cerere } from "./crm";
import { semnaturaLinkuluiTine, semneazaText } from "./cheie-semnare";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Baza de voluntari și apelurile către ei.
 *
 * Un voluntar e o cerere de voluntariat venită de pe site (`cereri`, felul
 * „voluntariat"), nu un tabel nou: aceeași fișă se vede la Cereri, la căutare
 * și în export. Aici se citește altfel: cu filtre după ce e nevoie (permis,
 * localitate, limbă, cât timp are) și cu căile de contact gata de apăsat.
 *
 * Un **apel** e întrebarea „avem nevoie de oameni pe data X". Fiecare voluntar
 * ales primește e-mailul lui, cu două butoane, iar răspunsul se scrie în
 * `raspunsuri_voluntari`. Nimic nu pleacă singur: apelul îl trimite un om,
 * din panou.
 */

export const CAI_CONTACT = ["Telefon", "WhatsApp", "E-mail"] as const;
export type CaleContact = (typeof CAI_CONTACT)[number];

export type Voluntar = {
  id: string;
  nume: string;
  email: string;
  telefon: string | null;
  stadiu: Cerere["stadiu"];
  creatLa: string;
  localitate: string;
  disponibilitate: string;
  permis: boolean;
  copii: boolean;
  limbi: string;
  contact: CaleContact | null;
  varsta: number | null;
  detalii: Record<string, string>;
};

function varstaDin(nastere: string | undefined): number | null {
  if (!nastere) return null;
  const d = new Date(`${nastere}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const azi = new Date();
  let v = azi.getFullYear() - d.getFullYear();
  const inca =
    azi.getMonth() < d.getMonth() ||
    (azi.getMonth() === d.getMonth() && azi.getDate() < d.getDate());
  if (inca) v--;
  return v;
}

function laVoluntar(c: Cerere): Voluntar {
  const d = c.detalii;
  const contact = CAI_CONTACT.find((x) => x === d["Contact preferat"]) ?? null;
  return {
    id: c.id,
    nume: c.nume,
    email: c.email,
    telefon: c.telefon,
    stadiu: c.stadiu,
    creatLa: c.creatLa,
    localitate: (d["Localitate"] ?? "").trim(),
    disponibilitate: (d["Disponibilitate"] ?? "").trim(),
    permis: /^da/i.test(d["Permis"] ?? ""),
    copii: /^da/i.test(d["Experiență cu copii"] ?? ""),
    limbi: (d["Limbi"] ?? "").trim(),
    contact,
    varsta: varstaDin(d["Data nașterii"]),
    detalii: d,
  };
}

export type FiltreVoluntari = {
  q?: string;
  localitate?: string;
  disponibilitate?: string;
  permis?: boolean;
  copii?: boolean;
  limba?: string;
  majori?: boolean;
  contact?: string;
};

/** Fără diacritice și litere mari, ca „Iasi" să găsească „Iași". */
export function simplu(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export async function totiVoluntarii(): Promise<Voluntar[]> {
  return (await cereri("voluntariat", undefined, 2000)).map(laVoluntar);
}

/**
 * Același om înscris de două ori (a completat formularul din nou) apare de
 * două ori în listă; la un apel primește un singur e-mail. Se păstrează
 * fișa cea mai nouă — lista vine cu cele noi primele.
 */
export function faraDubluri(lista: Voluntar[]): Voluntar[] {
  const vazuti = new Set<string>();
  return lista.filter((v) => {
    const chei = [
      v.email ? `e:${v.email.trim().toLowerCase()}` : "",
      (v.telefon ?? "").replace(/\D/g, "").slice(-9).length === 9
        ? `t:${(v.telefon ?? "").replace(/\D/g, "").slice(-9)}`
        : "",
    ].filter(Boolean);
    if (chei.some((k) => vazuti.has(k))) return false;
    for (const k of chei) vazuti.add(k);
    return true;
  });
}

export function filtreaza(lista: Voluntar[], f: FiltreVoluntari): Voluntar[] {
  const q = simplu(f.q ?? "");
  const loc = simplu(f.localitate ?? "");
  const limba = simplu(f.limba ?? "");
  return lista.filter((v) => {
    if (q) {
      const tot = simplu(
        [v.nume, v.email, v.telefon ?? "", v.localitate, v.limbi, ...Object.values(v.detalii)].join(" "),
      );
      const cifre = q.replace(/\D/g, "");
      if (!tot.includes(q) && !(cifre.length >= 4 && (v.telefon ?? "").replace(/\D/g, "").includes(cifre)))
        return false;
    }
    if (loc && simplu(v.localitate) !== loc) return false;
    if (f.disponibilitate && v.disponibilitate !== f.disponibilitate) return false;
    if (f.permis && !v.permis) return false;
    if (f.copii && !v.copii) return false;
    if (limba && !simplu(v.limbi).includes(limba)) return false;
    if (f.majori && !(v.varsta !== null && v.varsta >= 18)) return false;
    if (f.contact && v.contact !== f.contact) return false;
    return true;
  });
}

/** Localitățile scrise de voluntari, cu câți sunt în fiecare. */
export function localitati(lista: Voluntar[]): Array<{ nume: string; cati: number }> {
  const m = new Map<string, { nume: string; cati: number }>();
  for (const v of lista) {
    if (!v.localitate) continue;
    const k = simplu(v.localitate);
    const x = m.get(k) ?? { nume: v.localitate, cati: 0 };
    x.cati++;
    m.set(k, x);
  }
  return [...m.values()].sort((a, b) => b.cati - a.cati || a.nume.localeCompare(b.nume, "ro"));
}

// ─── Telefon, WhatsApp, e-mail ─────────────────────────────────────────────

/** Numărul în forma internațională, fără „+": 0756… → 40756…. */
export function numarInternational(telefon: string | null): string | null {
  const cifre = (telefon ?? "").replace(/\D/g, "");
  if (cifre.length < 9) return null;
  if (cifre.startsWith("40")) return cifre;
  if (cifre.startsWith("0040")) return cifre.slice(2);
  if (cifre.startsWith("0")) return `40${cifre.slice(1)}`;
  return cifre;
}

export function linkWhatsApp(telefon: string | null, text?: string): string | null {
  const n = numarInternational(telefon);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function linkTelefon(telefon: string | null): string | null {
  const n = numarInternational(telefon);
  return n ? `tel:+${n}` : null;
}

// ─── Apelurile ────────────────────────────────────────────────────────────

export type Apel = {
  id: string;
  titlu: string;
  cand: string;
  unde: string | null;
  mesaj: string;
  creatDe: string | null;
  creatLa: string;
  intrebati: number;
  pot: number;
  nuPot: number;
};

export type RaspunsVoluntar = {
  apelId: string;
  cerereId: string;
  raspuns: "pot" | "nu-pot" | null;
  raspunsLa: string | null;
  peEmail: boolean;
};

export async function apeluri(limita = 30): Promise<Apel[]> {
  const r = await intreaba<{
    id: string;
    titlu: string;
    cand: string;
    unde: string | null;
    mesaj: string;
    creat_de: string | null;
    creat_la: Date;
    intrebati: string;
    pot: string;
    nu_pot: string;
  }>(
    `SELECT a.*,
            count(r.cerere_id) AS intrebati,
            count(*) FILTER (WHERE r.raspuns = 'pot') AS pot,
            count(*) FILTER (WHERE r.raspuns = 'nu-pot') AS nu_pot
       FROM apeluri_voluntari a
       LEFT JOIN raspunsuri_voluntari r ON r.apel_id = a.id
      GROUP BY a.id
      ORDER BY a.creat_la DESC
      LIMIT $1`,
    [limita],
  );
  return r.map((x) => ({
    id: x.id,
    titlu: x.titlu,
    cand: x.cand,
    unde: x.unde,
    mesaj: x.mesaj,
    creatDe: x.creat_de,
    creatLa: x.creat_la.toISOString(),
    intrebati: Number(x.intrebati),
    pot: Number(x.pot),
    nuPot: Number(x.nu_pot),
  }));
}

export async function apelDupaId(id: string): Promise<Apel | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return (await apeluri(500)).find((a) => a.id === id) ?? null;
}

export async function raspunsuri(): Promise<RaspunsVoluntar[]> {
  const r = await intreaba<{
    apel_id: string;
    cerere_id: string;
    raspuns: string | null;
    raspuns_la: Date | null;
    pe_email: boolean;
  }>(
    `SELECT r.apel_id, r.cerere_id, r.raspuns, r.raspuns_la, r.pe_email
       FROM raspunsuri_voluntari r
       JOIN apeluri_voluntari a ON a.id = r.apel_id
      WHERE a.creat_la > now() - interval '400 days'`,
  );
  return r.map((x) => ({
    apelId: x.apel_id,
    cerereId: x.cerere_id,
    raspuns: x.raspuns === "pot" || x.raspuns === "nu-pot" ? x.raspuns : null,
    raspunsLa: x.raspuns_la?.toISOString() ?? null,
    peEmail: x.pe_email,
  }));
}

export async function creeazaApel(a: {
  titlu: string;
  cand: string;
  unde: string | null;
  mesaj: string;
  creatDe: string | null;
}): Promise<string> {
  const r = await intreaba<{ id: string }>(
    `INSERT INTO apeluri_voluntari (titlu, cand, unde, mesaj, creat_de)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [a.titlu, a.cand, a.unde, a.mesaj, a.creatDe],
  );
  return r[0].id;
}

export async function scrieIntrebat(
  apelId: string,
  cerereId: string,
  peEmail: boolean,
): Promise<void> {
  await intreaba(
    `INSERT INTO raspunsuri_voluntari (apel_id, cerere_id, pe_email)
     VALUES ($1, $2, $3)
     ON CONFLICT (apel_id, cerere_id) DO UPDATE SET pe_email = raspunsuri_voluntari.pe_email OR EXCLUDED.pe_email`,
    [apelId, cerereId, peEmail],
  );
}

/** Scrie răspunsul. Întoarce numele voluntarului dacă rândul există. */
export async function scrieRaspuns(
  apelId: string,
  cerereId: string,
  raspuns: "pot" | "nu-pot",
): Promise<{ nume: string; schimbat: boolean } | null> {
  const r = await intreaba<{ nume: string; vechi: string | null }>(
    `WITH vechi AS (
       SELECT raspuns FROM raspunsuri_voluntari WHERE apel_id = $1 AND cerere_id = $2
     )
     UPDATE raspunsuri_voluntari r
        SET raspuns = $3, raspuns_la = now()
       FROM cereri c, vechi
      WHERE r.apel_id = $1 AND r.cerere_id = $2 AND c.id = r.cerere_id
      RETURNING c.nume, vechi.raspuns AS vechi`,
    [apelId, cerereId, raspuns],
  );
  if (!r[0]) return null;
  return { nume: r[0].nume, schimbat: r[0].vechi !== raspuns };
}

// ─── Linkul de răspuns, semnat ─────────────────────────────────────────────

function deSemnat(apelId: string, cerereId: string): string {
  return `voluntar-raspuns:${apelId}:${cerereId}`;
}

/** Linkul din e-mail sau de pe WhatsApp; `r` doar alege butonul arătat. */
export function linkRaspuns(
  apelId: string,
  cerereId: string,
  r?: "pot" | "nu-pot",
): string | null {
  const s = semneazaText(deSemnat(apelId, cerereId));
  if (!s) return null;
  const q = new URLSearchParams({ a: apelId, c: cerereId, s });
  if (r) q.set("r", r);
  return `${ADRESA_SITE}/voluntari/raspuns?${q}`;
}

export function linkRaspunsTine(apelId: string, cerereId: string, s: string): boolean {
  if (!/^[0-9a-f-]{36}$/.test(apelId) || !/^[0-9a-f-]{36}$/.test(cerereId)) return false;
  return semnaturaLinkuluiTine(deSemnat(apelId, cerereId), s);
}

/** Textul gata scris pentru WhatsApp, cu linkul de răspuns al omului. */
export function textWhatsApp(apel: Pick<Apel, "titlu" | "cand" | "unde">, link: string | null, prenume: string): string {
  return [
    `Bună, ${prenume}. Aici Asociația Teona Ariana.`,
    `Avem nevoie de voluntari: ${apel.titlu}, ${apel.cand}${apel.unde ? `, ${apel.unde}` : ""}.`,
    link ? `Poți veni? Răspunde aici: ${link}` : "Poți veni? Răspunde-ne aici.",
  ].join("\n");
}
