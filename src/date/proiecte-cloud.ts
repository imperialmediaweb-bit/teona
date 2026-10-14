import "server-only";
import { cacheLife } from "next/cache";
import {
  areCheiCloudinary,
  dosare,
  pozeDinDosar,
} from "@/lib/cloudinary-listare";
import { PREFIX_CLOUD } from "@/lib/cloud";
import type { ProiectAfisat } from "./proiecte-tipuri";

/**
 * Pozele taberelor, luate direct din folderele Cloudinary ale asociației.
 *
 * **Problema.** Asociația urcă pozele singură, în foldere cu nume scrise de
 * mână: `Teona/2025/TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025`. Ca o poză să ajungă
 * pe site, până acum trebuia să-mi trimită cineva numele fișierelor, iar eu
 * le scriam în cod — câteva sute de nume, pentru fiecare tabără nouă.
 *
 * **Soluția: legătura se face pe dată, nu pe nume de fișier.** În numele
 * folderului sunt scrise zilele, luna și anul taberei, exact aceleași care
 * sunt scrise și în proiect („8 – 12 septembrie 2025”). De acolo se face
 * potrivirea. Fișierele nu mai trebuie știute deloc: serverul listează
 * folderul și le ia pe toate, cea mai nouă prima.
 *
 * Asta înseamnă că o tabără nouă apare pe site **fără nicio modificare de
 * cod**: asociația urcă pozele într-un folder cu data în nume, iar proiectul
 * și le găsește singur. Exact lucrul pe care caietul de sarcini îl cere de
 * șapte ori.
 *
 * **Când nu se potrivește nimic, nu se potrivește nimic.** Dacă două foldere
 * ies la egalitate, sau dacă niciunul nu are ziua de început a taberei, nu se
 * alege niciunul. Mai bine o galerie goală decât pozele unei alte tabere, cu
 * alți copii, pe pagina greșită.
 */

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/** Rădăcina în care asociația ține folderele pe ani. */
const RADACINA = (process.env.CLOUDINARY_FOLDER ?? "Teona").trim() || "Teona";

/** Minuscule, fără diacritice, fără semne: „TABĂRĂ AUTISM 8-12” → „tabara autism 8 12”. */
function fara(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/ș|ş/g, "s")
    .replace(/ț|ţ/g, "t")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type Semnatura = { an: number | null; zile: number[]; luni: string[] };

/** Ce se poate citi dintr-un text despre dată: anul, zilele, lunile. */
function semnatura(text: string): Semnatura {
  const curat = fara(text);
  const numere = (curat.match(/\d+/g) ?? []).map(Number);
  return {
    an: numere.find((x) => x >= 2000 && x <= 2099) ?? null,
    zile: numere.filter((x) => x >= 1 && x <= 31),
    luni: LUNI.filter((luna) => curat.includes(luna)),
  };
}

/**
 * Cât de bine se potrivește un folder cu un proiect. `0` = deloc.
 *
 * Trei condiții obligatorii, toate: anul să nu se bată cap în cap, ziua de
 * început a taberei să apară în numele folderului, și cel puțin o lună să fie
 * comună. Peste ele, scorul numără câte zile și luni se suprapun — ca între
 * două foldere din aceeași lună să câștige cel cu ambele zile bune.
 */
function scor(dosar: Semnatura, proiect: Semnatura): number {
  if (proiect.zile.length === 0 || proiect.luni.length === 0) return 0;
  if (dosar.an && proiect.an && dosar.an !== proiect.an) return 0;
  if (!dosar.zile.includes(proiect.zile[0])) return 0;

  const luni = proiect.luni.filter((l) => dosar.luni.includes(l));
  if (luni.length === 0) return 0;

  const zile = proiect.zile.filter((z) => dosar.zile.includes(z));
  return zile.length + luni.length + (dosar.an === proiect.an ? 1 : 0);
}

/**
 * Folderul care se potrivește cu o dată citită („8 – 12 septembrie 2025”).
 *
 * `null` dacă niciunul nu se potrivește sau dacă două ies la egalitate.
 * Pură, fără rețea: așa poate fi folosită și în panou, ca să se vadă negru pe
 * alb ce folder a ajuns la ce proiect.
 */
export function alegeDosar(
  nume: readonly string[],
  dataCitita: string,
): string | null {
  const proiect = semnatura(dataCitita);
  const puncte = nume
    .map((n) => ({ nume: n, scor: scor(semnatura(n), proiect) }))
    .sort((a, b) => b.scor - a.scor);

  if (puncte.length === 0 || puncte[0].scor === 0) return null;
  if (puncte[1] && puncte[1].scor === puncte[0].scor) return null;
  return puncte[0].nume;
}

/**
 * Pozele unui proiect din Cloudinary, ca liste de căi `/cloud/…`.
 *
 * Se ține la cache câteva ore: folderele unei tabere încheiate nu se mai
 * schimbă, iar o tabără nouă apare oricum la prima reconstruire. Fără cache,
 * fiecare vizitator ar costa două cereri la Cloudinary.
 */
export async function pozeCloudProiect(
  an: string,
  dataCitita: string,
  /** Numele folderului, când e scris explicit în proiect. */
  dosarScris?: string,
): Promise<string[]> {
  "use cache";
  cacheLife("hours");

  if (!areCheiCloudinary()) return [];

  const anul = `${RADACINA}/${an}`;

  // Folder scris de mână: nu mai are rost să citim lista și să potrivim.
  if (dosarScris) {
    const poze = await pozeDinDosar(`${anul}/${dosarScris}`);
    if (poze.length === 0) {
      console.warn(`[poze] folderul scris ${anul}/${dosarScris} n-a dat nimic`);
    }
    return poze.map((p) => `${PREFIX_CLOUD}${p.id}`);
  }

  const subdosare = await dosare(anul);
  if (subdosare.length === 0) {
    console.warn(`[poze] n-am găsit niciun folder în ${anul}`);
    return [];
  }

  const ales = alegeDosar(
    subdosare.map((d) => d.nume),
    dataCitita,
  );
  if (!ales) {
    console.warn(
      `[poze] „${dataCitita}” nu se potrivește cu niciun folder din ${anul}: ${subdosare
        .map((d) => d.nume)
        .join(" · ")}`,
    );
    return [];
  }

  const poze = await pozeDinDosar(`${anul}/${ales}`);
  if (poze.length === 0) {
    console.warn(`[poze] folderul ${anul}/${ales} e gol`);
  }
  return poze.map((p) => `${PREFIX_CLOUD}${p.id}`);
}

/**
 * Proiectul, cu pozele din Cloudinary adăugate dacă n-are altele.
 *
 * Numai proiectele fără poze pe disc întreabă Cloudinary. Cele venite din
 * exportul WordPress au deja fișierele lor descărcate în `public/poze/` și
 * n-au ce căuta acolo: ar fi, degeaba, o cerere pe fiecare pagină de proiect.
 */
export async function cuPozeDinCloud<T extends ProiectAfisat>(
  proiect: T,
): Promise<T> {
  if (proiect.poze.length > 0 || proiect.coperta) return proiect;

  const poze = await pozeCloudProiect(
    proiect.data.slice(0, 4),
    proiect.dataCitita,
    proiect.dosarCloud,
  );
  if (poze.length === 0) return proiect;

  return { ...proiect, coperta: poze[0], poze };
}

/** Același lucru, pentru o listă întreagă. */
export async function listaCuPozeDinCloud<T extends ProiectAfisat>(
  proiecte: readonly T[],
): Promise<T[]> {
  return Promise.all(proiecte.map(cuPozeDinCloud));
}
