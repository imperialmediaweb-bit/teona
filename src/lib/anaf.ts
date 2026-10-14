import "server-only";
import { cuiValid, curataCui } from "./cui";

export { cuiValid, curataCui };

/**
 * Datele publice ale unei firme, de la ANAF.
 *
 * **La ce folosește.** Pe pagina de sponsorizare, o firmă trebuia să scrie de
 * mână denumirea, și să caute în bilanț cifra de afaceri și impozitul. Trei
 * lucruri de căutat înainte să poată afla cât poate direcționa — adică trei
 * motive să închidă fila. Acum e destul CUI-ul.
 *
 * **De unde vin datele.** Două servicii publice ale ANAF, fără cheie și fără
 * cont:
 *
 * - `PlatitorTvaRest/v9/tva` — denumirea, adresa, numărul de la registrul
 *   comerțului, dacă firma e activă;
 * - `bilant` — indicatorii din bilanțul depus: cifra de afaceri netă, profitul
 *   brut și cel net.
 *
 * **Ce NU e în bilanț: impozitul pe profit.** Bilanțul dă profitul brut și pe
 * cel net, iar diferența dintre ele e impozitul plătit. Pentru o firmă pe
 * impozit pe profit asta e chiar cifra căutată; pentru una pe impozit pe
 * venit (microîntreprindere) nu e. De aceea cifra se trece în câmp ca
 * **propunere**, scrie negru pe alb de unde vine și din ce an, și se poate
 * schimba. Nicăieri nu se spune că e „impozitul pe profit al firmei”.
 *
 * Datele sunt publice: sunt despre firme, nu despre persoane, și oricine le
 * poate citi pe site-ul ANAF.
 */

const TVA = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";
const BILANT = "https://webservicesp.anaf.ro/bilant";

export type Bilant = {
  an: number;
  cifraDeAfaceri: number | null;
  profitBrut: number | null;
  profitNet: number | null;
  /** Profit brut − profit net. Vezi explicația de sus: e o propunere. */
  impozitEstimat: number | null;
};

export type Firma = {
  cui: number;
  denumire: string;
  adresa: string;
  nrRegCom: string;
  /** `false` dacă ANAF o are ca inactivă sau radiată. */
  activa: boolean;
  bilant: Bilant | null;
};

/**
 * Răspunsurile se țin puțin în memorie.
 *
 * ANAF cere o singură cerere pe secundă de la o adresă, iar serverul nostru e
 * o singură adresă pentru toți vizitatorii. Datele unei firme nu se schimbă de
 * la o oră la alta, iar un bilanț o dată pe an: o zi de memorie nu strică
 * nimic și ne ține departe de limita lor.
 */
const MEMORIE = new Map<number, { cand: number; firma: Firma | null }>();
const O_ZI = 24 * 60 * 60 * 1000;

async function ia<T>(
  adresa: string,
  optiuni: RequestInit & { next?: { revalidate?: number } },
): Promise<T | null> {
  try {
    const raspuns = await fetch(adresa, {
      ...optiuni,
      signal: AbortSignal.timeout(8000),
    });
    if (!raspuns.ok) {
      console.warn(`[anaf] ${raspuns.status} la ${new URL(adresa).pathname}`);
      return null;
    }
    return (await raspuns.json()) as T;
  } catch (eroare) {
    console.warn(
      `[anaf] cererea la ${new URL(adresa).pathname} a căzut:`,
      eroare instanceof Error ? eroare.message : eroare,
    );
    return null;
  }
}

type RaspunsTva = {
  found?: Array<{
    date_generale?: {
      cui?: number;
      denumire?: string;
      adresa?: string;
      nrRegCom?: string;
    };
    stare_inactiv?: { statusInactivi?: boolean; dataRadiere?: string };
  }>;
};

type RaspunsBilant = {
  deni?: string;
  i?: Array<{ val_indicator: number; val_den_indicator: string }>;
};

/**
 * Bilanțul cel mai nou care există.
 *
 * Bilanțul pe un an se depune în primăvara anului următor, deci la începutul
 * anului cel de anul trecut încă nu e acolo. Se încearcă trei ani în urmă și
 * se ia primul care are indicatori — altfel firma ar vedea „nu am găsit”
 * doar pentru că a intrat pe site în februarie.
 */
async function bilantulCelMaiNou(cui: number): Promise<Bilant | null> {
  const anulCurent = new Date().getFullYear();

  for (const an of [anulCurent - 1, anulCurent - 2, anulCurent - 3]) {
    const date = await ia<RaspunsBilant>(`${BILANT}?an=${an}&cui=${cui}`, {
      next: { revalidate: 86_400 },
    });
    const indicatori = date?.i ?? [];
    if (indicatori.length === 0) continue;

    const dupaNume = new Map(
      indicatori.map((x) => [x.val_den_indicator.trim(), x.val_indicator]),
    );
    const numar = (nume: string) => {
      const v = dupaNume.get(nume);
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };

    const profitBrut = numar("Profit brut");
    const profitNet = numar("Profit net");
    // Diferența are sens doar când e pozitivă: un an pe pierdere n-are
    // impozit pe profit de propus.
    const impozitEstimat =
      profitBrut !== null && profitNet !== null && profitBrut > profitNet
        ? profitBrut - profitNet
        : null;

    return {
      an,
      cifraDeAfaceri: numar("Cifra de afaceri neta"),
      profitBrut,
      profitNet,
      impozitEstimat,
    };
  }

  return null;
}

/** Firma, sau `null` dacă ANAF n-o are. */
export async function cautaFirma(cui: number): Promise<Firma | null> {
  const tinut = MEMORIE.get(cui);
  if (tinut && Date.now() - tinut.cand < O_ZI) return tinut.firma;

  const azi = new Date().toISOString().slice(0, 10);
  const date = await ia<RaspunsTva>(TVA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ cui, data: azi }]),
  });

  const gasita = date?.found?.[0]?.date_generale;
  if (!gasita?.denumire) {
    // Și „nu există” se ține minte: altfel un CUI greșit, scris de zece ori,
    // ar fi zece cereri la ANAF.
    MEMORIE.set(cui, { cand: Date.now(), firma: null });
    return null;
  }

  const stare = date?.found?.[0]?.stare_inactiv;
  const firma: Firma = {
    cui: gasita.cui ?? cui,
    denumire: gasita.denumire.replace(/\s+/g, " ").trim(),
    adresa: (gasita.adresa ?? "").replace(/\s+/g, " ").trim(),
    nrRegCom: (gasita.nrRegCom ?? "").trim(),
    activa: !stare?.statusInactivi && !stare?.dataRadiere,
    bilant: await bilantulCelMaiNou(cui),
  };

  // Memoria nu are voie să crească la nesfârșit.
  if (MEMORIE.size > 2000) MEMORIE.clear();
  MEMORIE.set(cui, { cand: Date.now(), firma });
  return firma;
}
