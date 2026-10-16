/**
 * Cheltuiala pe reclame Facebook și Instagram, citită din contul Meta.
 *
 * **Ce caută aici.** Panoul spune de unde vin donatorii; pentru canalul plătit
 * mai lipsea o cifră, singura care-l face o hotărâre și nu o părere: cât s-a
 * dat. Fără ea, „reclamele au adus 14 donații" nu se poate compara cu nimic.
 *
 * **Cele două cifre vin din locuri diferite și rămân despărțite.** Meta știe
 * cât s-a cheltuit și câte apăsări au fost; donațiile le știe numai baza
 * noastră. Costul pe donație se calculează din amândouă, deci e o apropiere,
 * nu o măsurătoare: o donație intrată pe transfer la două săptămâni după
 * reclamă n-are cum să fie legată de ea, iar una făcută de pe telefonul altui
 * om nici atât. Scrie pe pagină.
 *
 * **Contul e cel din `META_AD_ACCOUNT_ID`, și i se arată numele.** Un cont
 * greșit (al altei asociații, al agenției) ar umple panoul cu cifre
 * verosimile și false; numele contului, scris lângă cifre, e singurul fel în
 * care se vede din prima privire.
 */

const API = (process.env.META_API ?? "https://graph.facebook.com").replace(
  /\/$/,
  "",
);
const VERSIUNE = "v21.0";

function cheie(): string | null {
  const t = process.env.META_TOKEN?.trim();
  return t ? t : null;
}

function cont(): string | null {
  const c = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!c) return null;
  return c.startsWith("act_") ? c : `act_${c}`;
}

export function areReclame(): boolean {
  return Boolean(cheie() && cont());
}

export type Campanie = {
  id: string;
  nume: string;
  cheltuitBani: number;
  afisari: number;
  apasari: number;
  ctr: number;
  cpcBani: number;
};

export type Reclame = {
  zile: number;
  cont: { id: string; nume: string; moneda: string; activ: boolean };
  cheltuitBani: number;
  afisari: number;
  apasari: number;
  oameni: number;
  ctr: number;
  cpcBani: number;
  /** Cheltuiala din perioada dinainte, la fel de lungă. */
  inainteBani: number | null;
  campanii: Campanie[];
};

type Insight = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  ctr?: string;
  cpc?: string;
  campaign_id?: string;
  campaign_name?: string;
};

function numar(x: string | undefined): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/** Lei → bani. Meta întoarce sume cu zecimale, în moneda contului. */
function inBani(x: string | undefined): number {
  return Math.round(numar(x) * 100);
}

async function cere<T>(cale: string, parametri: Record<string, string>) {
  const jeton = cheie();
  if (!jeton) return null;
  const adresa = new URL(`${API}/${VERSIUNE}/${cale}`);
  for (const [k, v] of Object.entries(parametri)) adresa.searchParams.set(k, v);
  adresa.searchParams.set("access_token", jeton);

  const raspuns = await fetch(adresa, {
    // Cifrele de ieri nu se schimbă, dar cele de azi da. Fără memorare:
    // panoul se deschide de câteva ori pe zi, nu de o mie.
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!raspuns.ok) return null;
  return (await raspuns.json().catch(() => null)) as T | null;
}

function zi(cuCateZileInUrma: number): string {
  const d = new Date(Date.now() - cuCateZileInUrma * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export async function reclame(zile = 28): Promise<Reclame | null> {
  const act = cont();
  if (!act || !cheie()) return null;

  const acum = JSON.stringify({ since: zi(zile), until: zi(1) });
  const inainte = JSON.stringify({ since: zi(zile * 2), until: zi(zile + 1) });
  const campuri = "spend,impressions,clicks,reach,ctr,cpc";

  const [fisa, total, vechi, peCampanii] = await Promise.all([
    cere<{ id: string; name?: string; currency?: string; account_status?: number }>(
      act,
      { fields: "id,name,currency,account_status" },
    ),
    cere<{ data?: Insight[] }>(`${act}/insights`, {
      fields: campuri,
      time_range: acum,
    }),
    cere<{ data?: Insight[] }>(`${act}/insights`, {
      fields: "spend",
      time_range: inainte,
    }),
    cere<{ data?: Insight[] }>(`${act}/insights`, {
      fields: `campaign_id,campaign_name,${campuri}`,
      time_range: acum,
      level: "campaign",
      limit: "25",
    }),
  ]);

  if (!fisa || !total) return null;
  const t = total.data?.[0] ?? {};
  const v = vechi?.data?.[0];

  return {
    zile,
    cont: {
      id: fisa.id ?? act,
      nume: fisa.name?.trim() || act,
      moneda: fisa.currency ?? "RON",
      // 1 = activ. Orice altceva înseamnă că reclamele nu merg acum, oricât
      // de frumoase ar fi cifrele de mai sus — de pildă o factură neplătită.
      activ: fisa.account_status === 1,
    },
    cheltuitBani: inBani(t.spend),
    afisari: numar(t.impressions),
    apasari: numar(t.clicks),
    oameni: numar(t.reach),
    ctr: numar(t.ctr),
    cpcBani: inBani(t.cpc),
    inainteBani: v ? inBani(v.spend) : null,
    campanii: (peCampanii?.data ?? [])
      .map((c) => ({
        id: c.campaign_id ?? "",
        nume: c.campaign_name?.trim() || "(fără nume)",
        cheltuitBani: inBani(c.spend),
        afisari: numar(c.impressions),
        apasari: numar(c.clicks),
        ctr: numar(c.ctr),
        cpcBani: inBani(c.cpc),
      }))
      .filter((c) => c.cheltuitBani > 0)
      .sort((a, b) => b.cheltuitBani - a.cheltuitBani),
  };
}
