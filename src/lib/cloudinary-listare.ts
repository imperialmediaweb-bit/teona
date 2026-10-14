import "server-only";

/**
 * Citirea folderelor și a pozelor din Cloudinary.
 *
 * **De ce există.** Asociația urcă pozele direct în Cloudinary, din panoul
 * lor: tabere, Casa Teona, campanii. Până acum, ca să ajungă o poză pe site,
 * cineva trebuia să-mi trimită numele fișierului, iar eu îl scriam în cod.
 * Asta înseamnă că fiecare poză nouă trece prin dezvoltator — exact lucrul pe
 * care caietul de sarcini îl cere de șapte ori să nu se mai întâmple.
 *
 * **De ce numai pe server.** Listarea cere cheia și secretul de administrare,
 * care dau drept de ștergere peste tot contul. `server-only` face build-ul să
 * cadă dacă vreodată cineva importă fișierul ăsta dintr-o componentă de
 * browser — cheia n-are cum să ajungă din greșeală în pachetul trimis
 * vizitatorilor.
 *
 * Numele contului (`kaz6teok`) nu e secret: apare în adresa fiecărei poze de
 * pe site. Secrete sunt doar cheia și parola, iar ele stau în Railway.
 *
 * **Autentificare de bază, nu semnătură.** API-ul de administrare al
 * Cloudinary acceptă cheia și secretul ca utilizator și parolă HTTP. E mai
 * simplu și mai greu de greșit decât semnătura SHA-1 cerută la încărcare, și
 * nu circulă prin adresă, unde ar ajunge în jurnalele serverelor.
 */

const BAZA = "https://api.cloudinary.com/v1_1";

export type PozaCloud = {
  /** `Teona/2026/tabara-respiro/DSC_0012` — identificatorul din Cloudinary. */
  id: string;
  adresa: string;
  latime: number;
  inaltime: number;
  format: string;
  octeti: number;
  /** Data încărcării, ISO. Pozele noi sunt primele. */
  urcata: string;
};

export type Dosar = { nume: string; cale: string };

export function areCheiCloudinary(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function acreditari() {
  const cont = process.env.CLOUDINARY_CLOUD_NAME;
  const cheie = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cont || !cheie || !secret) return null;
  return {
    cont,
    antet:
      "Basic " + Buffer.from(`${cheie}:${secret}`).toString("base64"),
  };
}

async function cere<T>(cale: string): Promise<T | null> {
  const a = acreditari();
  if (!a) return null;
  try {
    const raspuns = await fetch(`${BAZA}/${a.cont}/${cale}`, {
      headers: { Authorization: a.antet },
      // Pozele nu se schimbă des, dar nici nu vrem să arătăm o listă veche
      // după ce asociația tocmai a urcat ceva. Un minut e compromisul.
      next: { revalidate: 60 },
    });
    if (!raspuns.ok) return null;
    return (await raspuns.json()) as T;
  } catch {
    return null;
  }
}

/** Folderele de la un nivel. Fără `cale`, cele de la rădăcină. */
export async function dosare(cale?: string): Promise<Dosar[]> {
  const date = await cere<{ folders?: Array<{ name: string; path: string }> }>(
    cale ? `folders/${encodeURIComponent(cale)}` : "folders",
  );
  return (date?.folders ?? []).map((f) => ({ nume: f.name, cale: f.path }));
}

/**
 * Pozele dintr-un folder, cele mai noi primele.
 *
 * `max_results` e 100: destul cât să vezi o tabără întreagă, puțin cât să nu
 * aștepți. Cloudinary întoarce un cursor pentru restul, dar o pagină de panou
 * cu 500 de poze nu se mai poate folosi oricum.
 */
export async function pozeDinDosar(
  cale: string,
  limita = 100,
): Promise<PozaCloud[]> {
  const date = await cere<{
    resources?: Array<{
      public_id: string;
      secure_url: string;
      width: number;
      height: number;
      format: string;
      bytes: number;
      created_at: string;
    }>;
  }>(
    `resources/image?type=upload&prefix=${encodeURIComponent(cale)}&max_results=${limita}`,
  );

  return (date?.resources ?? [])
    .map((r) => ({
      id: r.public_id,
      adresa: r.secure_url,
      latime: r.width,
      inaltime: r.height,
      format: r.format,
      octeti: r.bytes,
      urcata: r.created_at,
    }))
    .sort((a, b) => b.urcata.localeCompare(a.urcata));
}

/**
 * Adresa unei poze la o lățime dată, prin optimizatorul Cloudinary.
 *
 * `f_auto` alege formatul (WebP, AVIF) după browser, `q_auto` calitatea.
 * Pentru miniaturile din panou, 400 px ajung și pe un ecran retina.
 */
export function miniatura(id: string, latime = 400): string {
  const cont = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  return `https://res.cloudinary.com/${cont}/image/upload/c_fill,w_${latime},q_auto,f_auto/${id}`;
}
