import { ADRESA_SITE } from "@/app/seo";

/**
 * Pagina de Facebook a asociației: cifrele ei și publicarea unei noutăți.
 *
 * **De ce nu există un buton „Conectează Facebook".** Butonul acela ar fi o
 * aplicație Meta cu verificare de business și cerere de aprobare pentru
 * dreptul de a publica — săptămâni de așteptare și un formular în care o
 * asociație mică n-are ce căuta. Calea scurtă, pentru cine are deja pagina
 * într-un Business Manager, e un „utilizator de sistem": i se dă pagina, se
 * generează un jeton care nu expiră, se pune în Railway. Panoul îl folosește
 * de-acolo. Pașii sunt scriși pe /admin/facebook.
 *
 * **Ce poate și ce nu poate.** Citește cifrele paginii și publică un text pe
 * ea, la apăsarea unui om. Nu publică nimic de la sine: o noutate pusă pe
 * site poate fi bună pentru site și nepotrivită pentru pagină în ziua aceea
 * — un copil bolnav, o înmormântare, o știre proastă în oraș —, iar un
 * program care postează singur nu știe asta.
 */

const API = (process.env.META_API ?? "https://graph.facebook.com").replace(
  /\/$/,
  "",
);
const VERSIUNE = "v21.0";

/** Jetonul paginii. Dacă nu e unul separat, se încearcă cel de reclame. */
function jeton(): string | null {
  const t = (process.env.META_PAGE_TOKEN ?? process.env.META_TOKEN)?.trim();
  return t ? t : null;
}

function pagina(): string | null {
  const p = process.env.META_PAGE_ID?.trim();
  return p ? p : null;
}

export function arePagina(): boolean {
  return Boolean(jeton() && pagina());
}

export type Pagina = {
  id: string;
  nume: string;
  adresa: string | null;
  urmaritori: number | null;
  aprecieri: number | null;
  /** Oameni deosebiți care au văzut ceva de la pagină în perioada cerută. */
  vazutaDe: number | null;
  /** Apăsări, comentarii, distribuiri — la fel, pe perioadă. */
  reactii: number | null;
  zile: number;
  /** Poate publica, sau numai citi. */
  poatePublica: boolean;
};

async function cere<T>(
  cale: string,
  parametri: Record<string, string> = {},
): Promise<T | null> {
  const t = jeton();
  if (!t) return null;
  const adresa = new URL(`${API}/${VERSIUNE}/${cale}`);
  for (const [k, v] of Object.entries(parametri)) adresa.searchParams.set(k, v);
  adresa.searchParams.set("access_token", t);
  const raspuns = await fetch(adresa, {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!raspuns.ok) return null;
  return (await raspuns.json().catch(() => null)) as T | null;
}

type RandInsight = {
  name?: string;
  values?: Array<{ value?: number }>;
};

/** Adună zilele unei metrici. Lipsa ei nu e o eroare: se întoarce `null`. */
function aduna(randuri: RandInsight[] | undefined, nume: string): number | null {
  const rand = (randuri ?? []).find((r) => r.name === nume);
  if (!rand) return null;
  return (rand.values ?? []).reduce((s, v) => s + (v.value ?? 0), 0);
}

export async function cifrelePaginii(zile = 28): Promise<Pagina | null> {
  const id = pagina();
  if (!id || !jeton()) return null;

  const [fisa, insights, drepturi] = await Promise.all([
    cere<{
      id?: string;
      name?: string;
      link?: string;
      fan_count?: number;
      followers_count?: number;
    }>(id, { fields: "id,name,link,fan_count,followers_count" }),
    cere<{ data?: RandInsight[] }>(`${id}/insights`, {
      metric: "page_impressions_unique,page_post_engagements",
      period: "day",
      since: String(Math.floor((Date.now() - zile * 86_400_000) / 1000)),
      until: String(Math.floor(Date.now() / 1000)),
    }),
    /*
      Ce poate jetonul.

      Se întreabă dinainte, nu se află la prima apăsare pe „Trimite pe
      Facebook": un buton care arată că merge și dă eroare abia după ce omul
      a scris textul e mai rău decât un buton lipsă.
    */
    cere<{ data?: Array<{ permission?: string; status?: string }> }>(
      `${id}`,
      { fields: "tasks" },
    ),
  ]);

  if (!fisa) return null;

  const sarcini = (drepturi as unknown as { tasks?: string[] })?.tasks ?? [];

  return {
    id: fisa.id ?? id,
    nume: fisa.name?.trim() || id,
    adresa: fisa.link ?? null,
    urmaritori: fisa.followers_count ?? null,
    aprecieri: fisa.fan_count ?? null,
    vazutaDe: aduna(insights?.data, "page_impressions_unique"),
    reactii: aduna(insights?.data, "page_post_engagements"),
    zile,
    // „CREATE_CONTENT" e dreptul de a publica. Lipsa listei nu înseamnă „nu":
    // unele jetoane n-o întorc deloc, și atunci lăsăm butonul să încerce.
    poatePublica: sarcini.length === 0 || sarcini.includes("CREATE_CONTENT"),
  };
}

/**
 * Publică un text pe pagină, cu link spre pagina de pe site.
 *
 * Se trimite `message` plus `link`, nu poza: Facebook construiește singur
 * cartonașul din datele paginii noastre (titlu, descriere, poză mare), care
 * sunt deja scrise acolo. Urcarea pozei ar face o postare cu poză din care
 * nu se mai poate apăsa spre site — adică exact ce nu vrem.
 */
export async function publicaPePagina(date: {
  mesaj: string;
  cale: string;
}): Promise<{ ok: true; id: string } | { ok: false; motiv: string }> {
  const id = pagina();
  const t = jeton();
  if (!id || !t) return { ok: false, motiv: "Nu e legată nicio pagină." };

  const link = new URL(date.cale, ADRESA_SITE);
  /*
    Eticheta, ca donațiile venite de aici să nu se amestece cu restul
    Facebookului: postările paginii sunt muncă neplătită și se judecă
    separat de reclame.
  */
  link.searchParams.set("utm_source", "facebook");
  link.searchParams.set("utm_medium", "social");

  const adresa = new URL(`${API}/${VERSIUNE}/${id}/feed`);
  const corp = new URLSearchParams({
    message: date.mesaj,
    link: link.toString(),
    access_token: t,
  });

  const raspuns = await fetch(adresa, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: corp,
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);

  if (!raspuns) return { ok: false, motiv: "Facebook n-a răspuns." };

  const corpul = (await raspuns.json().catch(() => null)) as {
    id?: string;
    error?: { message?: string };
  } | null;

  if (!raspuns.ok || !corpul?.id) {
    return {
      ok: false,
      motiv:
        corpul?.error?.message?.slice(0, 300) ||
        `Facebook a refuzat (${raspuns.status}).`,
    };
  }

  return { ok: true, id: corpul.id };
}

/** Adresa postării, de deschis într-o filă nouă. */
export function adresaPostarii(id: string): string {
  // Identificatorul e „idPagină_idPostare"; adresa scurtă merge cu el întreg.
  return `https://www.facebook.com/${id.replace("_", "/posts/")}`;
}
