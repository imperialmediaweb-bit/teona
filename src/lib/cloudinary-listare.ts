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

/**
 * Adresa API-ului.
 *
 * `CLOUDINARY_API` o înlocuiește, dar **numai în afara producției**: proba
 * automată din `scripts/qa/poze-cloud.mjs` pornește un server care imită
 * Cloudinary, ca potrivirea folder–proiect să poată fi verificată fără
 * cheile adevărate. În producție variabila e ignorată: altfel ar fi o pârghie
 * prin care cheile asociației ar putea fi trimise în altă parte.
 */
const BAZA =
  (process.env.NODE_ENV !== "production" &&
    process.env.CLOUDINARY_API?.trim()) ||
  "https://api.cloudinary.com/v1_1";

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
    antet: "Basic " + Buffer.from(`${cheie}:${secret}`).toString("base64"),
  };
}

/**
 * O cerere la API-ul de administrare.
 *
 * **De ce se scrie în jurnal.** Prima versiune înghițea orice eroare în
 * silență și întorcea `null`. Rezultatul: pozele taberelor n-au apărut pe
 * site, iar din afară nu se putea vedea de ce — cheie greșită, folder cu alt
 * nume, limită depășită, toate arătau la fel. Acum fiecare eșec lasă o linie
 * în jurnalul Railway, cu codul și calea cerută. Nici cheia, nici secretul nu
 * ajung în jurnal: antetul nu e scris niciodată.
 */
async function cere<T>(cale: string): Promise<T | null> {
  const a = acreditari();
  if (!a) {
    console.warn("[cloudinary] cheile lipsesc; listarea nu se face");
    return null;
  }
  try {
    const raspuns = await fetch(`${BAZA}/${a.cont}/${cale}`, {
      headers: { Authorization: a.antet },
      // Pozele nu se schimbă des, dar nici nu vrem să arătăm o listă veche
      // după ce asociația tocmai a urcat ceva. Un minut e compromisul.
      next: { revalidate: 60 },
    });
    if (!raspuns.ok) {
      console.warn(`[cloudinary] ${raspuns.status} la /${cale}`);
      return null;
    }
    return (await raspuns.json()) as T;
  } catch (eroare) {
    console.warn(
      `[cloudinary] cererea la /${cale} a căzut:`,
      eroare instanceof Error ? eroare.message : eroare,
    );
    return null;
  }
}

/**
 * Folderele de la un nivel. Fără `cale`, cele de la rădăcină.
 *
 * Calea se codifică pe bucăți, nu dintr-o dată: `encodeURIComponent` pe tot
 * `Teona/2025` ar transforma și bara în `%2F`, iar Cloudinary ar căuta un
 * folder cu numele „Teona/2025” la rădăcină și n-ar găsi nimic. Numele de
 * foldere sunt scrise de mână, cu spații și diacritice („TABĂRĂ SURDO-MUȚI
 * 16-20 IUNIE 2025”), deci codificarea e oricum necesară.
 */
export async function dosare(cale?: string): Promise<Dosar[]> {
  const date = await cere<{ folders?: Array<{ name: string; path: string }> }>(
    cale
      ? `folders/${cale.split("/").map(encodeURIComponent).join("/")}?max_results=500`
      : "folders?max_results=500",
  );
  return (date?.folders ?? []).map((f) => ({ nume: f.name, cale: f.path }));
}

/**
 * Pozele dintr-un folder, cele mai noi primele.
 *
 * **De ce două capete de API.** Cloudinary are două moduri de a ține
 * folderele, iar contul asociației e pe cel nou („dynamic folders”). În modul
 * vechi, folderul făcea parte din identificatorul pozei, deci se putea căuta
 * cu `prefix=Teona/2025/…`. În modul nou, folderul e un câmp separat, iar
 * identificatorul n-are nicio legătură cu el — `prefix` întoarce zero
 * rezultate, exact ce s-a întâmplat la prima încercare: toate cele șapte
 * tabere au găsit folderul corect și au raportat că e gol.
 *
 * Așa că se cere întâi pe folder (`by_asset_folder`), iar dacă nu vine nimic
 * se încearcă și pe identificator, pentru conturile în modul vechi. Un cont
 * nu poate fi în ambele moduri, deci a doua cerere se face doar când prima
 * n-a adus nimic.
 *
 * `max_results` e 100: destul cât să vezi o tabără întreagă, puțin cât să nu
 * aștepți. Cloudinary întoarce un cursor pentru restul, dar o pagină de panou
 * cu 500 de poze nu se mai poate folosi oricum.
 */
type ResursaBruta = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
};

export async function pozeDinDosar(
  cale: string,
  limita = 100,
): Promise<PozaCloud[]> {
  const peFolder = await cere<{ resources?: ResursaBruta[] }>(
    `resources/by_asset_folder?asset_folder=${encodeURIComponent(cale)}&max_results=${limita}`,
  );

  let resurse = peFolder?.resources ?? [];
  if (resurse.length === 0) {
    const peIdentificator = await cere<{ resources?: ResursaBruta[] }>(
      `resources/image?type=upload&prefix=${encodeURIComponent(cale)}&max_results=${limita}`,
    );
    resurse = peIdentificator?.resources ?? [];
  }

  return resurse
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

/**
 * Toate folderele, pe câteva niveluri, ca listă plată.
 *
 * Pentru alegerea folderului de poze al unui proiect, din panou: asociația
 * vede „Teona / 2025 / TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025” și o alege, în loc
 * să urce a doua oară o sută de fotografii pe care le-a urcat deja.
 *
 * Două niveluri sub rădăcină ajung: anii, și taberele din ei. Mai adânc sunt
 * subfolderele unei tabere („ZIUA 1”), care n-au ce căuta într-o listă de
 * ales — pozele lor vin oricum odată cu folderul părinte.
 */
export async function toateDosarele(
  radacina = process.env.CLOUDINARY_FOLDER || "Teona",
  adancime = 2,
): Promise<Dosar[]> {
  const copii = await dosare(radacina);
  if (adancime <= 1 || copii.length === 0) return copii;

  const nepoti = await Promise.all(
    copii.map((d) => dosare(d.cale).catch(() => [])),
  );

  const toate: Dosar[] = [];
  copii.forEach((d, i) => {
    toate.push(d);
    for (const nepot of nepoti[i]) toate.push(nepot);
  });
  return toate;
}

/**
 * Adresa unei poze pentru un e-mail.
 *
 * Două deosebiri față de `miniatura`: lățimea e cea a șablonului la ecrane
 * dense (536 px × 2), iar formatul e fixat la JPEG. `f_auto` alege formatul
 * după antetul `Accept` al clientului — pe care clienții de e-mail și
 * serverele de proxy ale Gmailului nu-l trimit cum trebuie, așa că o poză
 * WebP ajunge uneori ca pătrat gol. JPEG se vede peste tot.
 */
export function pozaPentruEmail(id: string, latime = 1072): string {
  const cont = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  return `https://res.cloudinary.com/${cont}/image/upload/c_limit,w_${latime},q_auto,f_jpg/${id}`;
}
