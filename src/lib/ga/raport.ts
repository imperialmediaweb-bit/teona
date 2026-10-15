import { jetonDeAcces, arePropietate, proprietatea } from "./jeton";

/**
 * Cifrele de vizite, luate din Google Analytics.
 *
 * **La ce folosesc aici, dacă există Google Analytics.** Pentru că nimeni nu
 * intră în Google Analytics. Are patruzeci de meniuri și cere învățat; panoul
 * se deschide oricum, în fiecare zi. Aici intră numai cele patru lucruri după
 * care se iau hotărâri: câți oameni au venit, de unde, pe ce pagini au stat,
 * și ce a adus fiecare campanie de e-mail.
 *
 * **Nicio cifră de aici nu e o donație.** Google numără vizite; donațiile le
 * numără baza de date. Când cele două nu se potrivesc, baza de date are
 * dreptate — de aceea paginile scriu limpede care cifră de unde vine.
 *
 * Întoarce `null` la orice împiedicare, iar panoul arată atunci ce lipsește.
 * O defecțiune la Google nu are voie să strice tabloul de bord.
 */

const API =
  process.env.GA_API?.replace(/\/+$/, "") ??
  "https://analyticsdata.googleapis.com";

type Rand = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

async function cere(corp: unknown): Promise<Rand[] | null> {
  const jeton = await jetonDeAcces();
  if (!jeton) return null;

  try {
    const raspuns = await fetch(
      `${API}/v1beta/properties/${proprietatea()}:runReport`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${jeton}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(corp),
      },
    );
    if (!raspuns.ok) return null;
    const date = (await raspuns.json()) as { rows?: Rand[] };
    return date.rows ?? [];
  } catch {
    return null;
  }
}

function nr(r: Rand, i = 0): number {
  return Number(r.metricValues?.[i]?.value ?? 0);
}

function text(r: Rand, i = 0): string {
  return r.dimensionValues?.[i]?.value ?? "";
}

export type Vizite = {
  zile: number;
  utilizatori: number;
  sesiuni: number;
  vizualizari: number;
  /** Aceleași cifre, pe perioada dinainte, la fel de lungă. */
  inainte: { utilizatori: number; sesiuni: number };
  surse: Array<{ sursa: string; sesiuni: number }>;
  pagini: Array<{ cale: string; vizualizari: number }>;
  campanii: Array<{ nume: string; sesiuni: number }>;
};

/**
 * Sursele, scrise pe înțelesul cuiva care n-a deschis niciodată Analytics.
 *
 * „google / organic" și „(direct) / (none)" sunt limba uneltei, nu a omului
 * care citește panoul. Perechile cunoscute se traduc; restul rămân cum vin,
 * fiindcă o traducere inventată ar ascunde o sursă nouă.
 */
const SURSE: Record<string, string> = {
  "google / organic": "Căutare Google",
  "(direct) / (none)": "Direct (adresa scrisă sau favorite)",
  "mailerlite / email": "Buletinul de e-mail",
  "facebook.com / referral": "Facebook",
  "m.facebook.com / referral": "Facebook, de pe telefon",
  "l.facebook.com / referral": "Facebook",
  "instagram.com / referral": "Instagram",
  "l.instagram.com / referral": "Instagram",
  "bing / organic": "Căutare Bing",
  "google / cpc": "Reclame Google",
};

export function areVizite(): boolean {
  return arePropietate();
}

export async function vizite(zile = 28): Promise<Vizite | null> {
  const acum = { startDate: `${zile}daysAgo`, endDate: "today" };
  const inainte = {
    startDate: `${zile * 2}daysAgo`,
    endDate: `${zile + 1}daysAgo`,
  };

  const [cap, capInainte, surse, pagini, campanii] = await Promise.all([
    cere({
      dateRanges: [acum],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    }),
    cere({
      dateRanges: [inainte],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    }),
    cere({
      dateRanges: [acum],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    cere({
      dateRanges: [acum],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 8,
    }),
    cere({
      dateRanges: [acum],
      dimensions: [{ name: "sessionCampaignName" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 6,
    }),
  ]);

  if (cap === null) return null;

  return {
    zile,
    utilizatori: nr(cap[0] ?? {}, 0),
    sesiuni: nr(cap[0] ?? {}, 1),
    vizualizari: nr(cap[0] ?? {}, 2),
    inainte: {
      utilizatori: nr((capInainte ?? [])[0] ?? {}, 0),
      sesiuni: nr((capInainte ?? [])[0] ?? {}, 1),
    },
    surse: (surse ?? []).map((r) => {
      const cheie = `${text(r, 0)} / ${text(r, 1)}`;
      return { sursa: SURSE[cheie] ?? cheie, sesiuni: nr(r) };
    }),
    pagini: (pagini ?? []).map((r) => ({
      cale: text(r),
      vizualizari: nr(r),
    })),
    /*
      Campaniile fără nume sunt vizitele care n-au venit prin niciun link
      etichetat. Nu le arătăm: „(not set): 2.400" ocupă primul rând și nu
      spune nimic despre nicio campanie.
    */
    campanii: (campanii ?? [])
      .filter((r) => {
        const nume = text(r);
        return nume && nume !== "(not set)" && nume !== "(direct)";
      })
      .map((r) => ({ nume: text(r), sesiuni: nr(r) })),
  };
}
