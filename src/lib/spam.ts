import { areBazaDeDate, intreaba } from "@/lib/baza";

/**
 * Spam în formularele publice (18 noiembrie 2026). Asociația: „să le
 * blochezi, ofertele și chestii de genul, fără să mai ajungă aici”.
 *
 * Două opriri, amândouă tăcute (cine trimite vede „Mulțumim”, ca robotul să
 * nu insiste):
 * - **adresa sau domeniul blocat** din panou, cu „Spam: șterge și blochează”;
 * - **oferta comercială** recunoscută după text (preț + TVA, „valabil doar
 *   azi”, audit SEO/GEO, servicii de marketing…). Se cer cel puțin două
 *   semne diferite, nu unul: o firmă care vrea să sponsorizeze poate scrie
 *   „TVA” sau „ofertă” într-o frază, dar nu și „răspundeți astăzi” și
 *   „preț de listă”.
 *
 * Mesajul oprit nu intră la Cereri și nu anunță pe nimeni; rămâne doar o urmă
 * scurtă în `mesaje_oprite`, 30 de zile, vizibilă la Setări, ca un mesaj bun
 * oprit din greșeală să se poată găsi.
 */

/** Domeniile de e-mail ale oamenilor obișnuiți: nu se blochează întregi. */
const DOMENII_PUBLICE = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.ro", "yahoo.co.uk", "hotmail.com", "hotmail.ro",
  "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me",
  "protonmail.com", "gmx.com", "gmx.net", "gmx.de", "mail.com", "yandex.com", "zoho.com",
]);

export function domeniul(adresa: string): string {
  return adresa.trim().toLowerCase().split("@")[1] ?? "";
}

export function domeniuPublic(d: string): boolean {
  return DOMENII_PUBLICE.has(d.toLowerCase());
}

const fd = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Semnele unei oferte comerciale; fiecare grupă se numără o singură dată. */
const SEMNE: ReadonlyArray<[string, RegExp]> = [
  ["preț", /\d[\d.,]*\s*(€|eur|euro|lei|ron|usd|\$)\s*(\+|plus)\s*tva|\btva\b.{0,40}\d|pret(ul)? de lista|\bdiscount\b|reducere de \d|\d+\s*% (reducere|discount)/],
  ["grabă", /(valabil[aă]?|oferta)\s+(este\s+)?(valabil[aă]\s+)?doar\s+(azi|astazi|pana)|raspundeti\s+(astazi|azi)|doar azi|limited time|today only|ultimele locuri/],
  ["serviciu", /\baudit(ul)?\s+(seo|geo|gratuit|de site|site)|\bseo\b|\bgeo\b.{0,20}(audit|ai)|backlink|optimizare (seo|pentru motoare)|marketing digital|promovare online|web ?design|creare (de )?site|lead(-uri|uri)? |clienti noi|\bchatgpt\b.{0,60}\bperplexity\b|google ads|campanii (de )?(ads|reclame)/],
  ["vânzare", /pretul (de )?lista|pachet(ul)? (de )?servicii|serviciile noastre|our services|we (can|will) help|vreti mai multi clienti|programati (o|un) (demo|apel)|book a (call|demo)|unsubscribe|dezabonare|profil(ul)? complet .{0,60}https?:\/\//],
];

/** Câte semne de ofertă are textul (0–4). */
export function semneDeOferta(text: string): string[] {
  const t = fd(text);
  return SEMNE.filter(([, re]) => re.test(t)).map(([n]) => n);
}

export function pareOferta(text: string): boolean {
  return semneDeOferta(text).length >= 2;
}

/** E adresa (sau domeniul ei) pe lista celor blocate? Fără bază: nu. */
export async function esteBlocat(adresa: string): Promise<boolean> {
  if (!areBazaDeDate() || !adresa) return false;
  const a = adresa.trim().toLowerCase();
  const r = await intreaba<{ n: string }>(
    `SELECT 1 AS n FROM expeditori_blocati WHERE valoare = $1 OR valoare = $2 LIMIT 1`,
    [a, `@${domeniul(a)}`],
  ).catch(() => []);
  return r.length > 0;
}

/**
 * Hotărârea pentru un mesaj venit pe un formular public: `null` = trece.
 * `oferte` = false pentru formularele în care o firmă scrie despre bani
 * (sponsorizarea): acolo se oprește numai ce e blocat.
 */
export async function filtruSpam(d: { email: string; nume?: string; text: string; oferte?: boolean }): Promise<"blocat" | "oferta" | null> {
  const motiv = (await esteBlocat(d.email)) ? "blocat" : d.oferte !== false && pareOferta(d.text) ? "oferta" : null;
  if (motiv && areBazaDeDate()) {
    await intreaba(
      `WITH vechi AS (DELETE FROM mesaje_oprite WHERE la < now() - interval '30 days')
       INSERT INTO mesaje_oprite (email, nume, inceput, motiv) VALUES ($1,$2,$3,$4)`,
      [d.email.trim().toLowerCase().slice(0, 200), (d.nume ?? "").slice(0, 120), d.text.slice(0, 400), motiv],
    ).catch(() => {});
  }
  return motiv;
}

/** Valoarea de blocat: adresa întreagă, sau „@domeniu” (nu pentru Gmail & co.). */
export function valoareDeBlocat(adresa: string, totDomeniul: boolean): string | null {
  const a = adresa.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) return null;
  const d = domeniul(a);
  return totDomeniul && !domeniuPublic(d) ? `@${d}` : a;
}

export async function blocheaza(valoare: string, motiv: string, cine: string | null): Promise<void> {
  await intreaba(
    `INSERT INTO expeditori_blocati (valoare, motiv, adaugat_de) VALUES ($1,$2,$3)
     ON CONFLICT (valoare) DO NOTHING`,
    [valoare, motiv.slice(0, 200), cine],
  );
}

export async function deblocheaza(valoare: string): Promise<void> {
  await intreaba(`DELETE FROM expeditori_blocati WHERE valoare = $1`, [valoare]);
}

export async function listaBlocati(): Promise<Array<{ valoare: string; motiv: string | null; adaugatDe: string | null; la: string }>> {
  const r = await intreaba<{ valoare: string; motiv: string | null; adaugat_de: string | null; creat_la: Date }>(
    `SELECT * FROM expeditori_blocati ORDER BY creat_la DESC LIMIT 500`,
  );
  return r.map((x) => ({ valoare: x.valoare, motiv: x.motiv, adaugatDe: x.adaugat_de, la: x.creat_la.toISOString() }));
}

export async function mesajeOprite(): Promise<Array<{ email: string | null; nume: string | null; inceput: string | null; motiv: string; la: string }>> {
  const r = await intreaba<{ email: string | null; nume: string | null; inceput: string | null; motiv: string; la: Date }>(
    `SELECT email, nume, inceput, motiv, la FROM mesaje_oprite WHERE la > now() - interval '30 days' ORDER BY la DESC LIMIT 100`,
  );
  return r.map((x) => ({ ...x, la: x.la.toISOString() }));
}
