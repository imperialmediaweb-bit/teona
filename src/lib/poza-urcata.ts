import { createHash } from "node:crypto";

/**
 * Urcarea unei poze trimise de un vizitator, în Cloudinary.
 *
 * Pozele site-ului stau în depozit, dar astea nu pot: vin de la oameni, după
 * ce site-ul a fost construit, iar discul containerului dispare la redeploy.
 *
 * Cheile Cloudinary stau **numai** în variabile de mediu, niciodată într-un
 * fișier din depozit, și se folosesc doar aici, pe server. Browserul nu le
 * vede niciodată: nu facem urcare semnată din client, pentru că semnătura ar
 * trebui dată cuiva din afară.
 */

const TIPURI = new Map<string, { extensie: string; semnatura: number[] }>([
  ["image/jpeg", { extensie: "jpg", semnatura: [0xff, 0xd8, 0xff] }],
  ["image/png", { extensie: "png", semnatura: [0x89, 0x50, 0x4e, 0x47] }],
  // WebP: „RIFF” la început, „WEBP” la octetul 8.
  ["image/webp", { extensie: "webp", semnatura: [0x52, 0x49, 0x46, 0x46] }],
]);

export { POZA_MAXIM } from "@/date/aniversari";

export type PozaUrcata = { id: string; latime: number; inaltime: number };

/**
 * Verifică dacă octeții chiar sunt o imagine din tipurile acceptate.
 *
 * Tipul declarat de browser nu e o dovadă — îl poate scrie oricine. Un
 * fișier executabil trimis cu `Content-Type: image/png` ar trece de o
 * verificare care se uită doar la antet. De aceea citim primii octeți.
 */
export function pareImagine(tip: string, octeti: Uint8Array): boolean {
  const asteptat = TIPURI.get(tip);
  if (!asteptat) return false;
  const { semnatura } = asteptat;
  if (octeti.length < semnatura.length + 8) return false;
  if (!semnatura.every((octet, i) => octeti[i] === octet)) return false;
  if (tip === "image/webp") {
    const marca = String.fromCharCode(...octeti.slice(8, 12));
    return marca === "WEBP";
  }
  return true;
}

function semneaza(parametri: Record<string, string>, secret: string): string {
  const sir = Object.keys(parametri)
    .sort()
    .map((cheie) => `${cheie}=${parametri[cheie]}`)
    .join("&");
  return createHash("sha1")
    .update(sir + secret)
    .digest("hex");
}

export function areCloudinary(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Urcă octeții și întoarce identificatorul public plus dimensiunile.
 *
 * `moderation: "manual"` nu e pus degeaba: poza rămâne în Cloudinary într-o
 * stare în care nu se servește public până n-o aprobă cineva. Noi oricum
 * ținem campania nepublicată până o verifică asociația, deci e a doua plasă
 * sub prima — dacă vreodată se scurge un identificator, poza tot nu se vede.
 */
export async function urcaPoza(
  octeti: Uint8Array,
  tip: string,
): Promise<PozaUrcata | null> {
  const cont = process.env.CLOUDINARY_CLOUD_NAME;
  const cheie = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cont || !cheie || !secret) return null;

  const dosar = `${process.env.CLOUDINARY_FOLDER || "Teona"}/aniversari`;
  const parametri: Record<string, string> = {
    folder: dosar,
    timestamp: String(Math.floor(Date.now() / 1000)),
    // Pozele de la oameni nu sunt de arhivă: le ducem la o mărime rezonabilă
    // ca să nu ținem fișiere de 6 MB pentru o poză de previzualizare.
    transformation: "c_limit,w_1600,h_1600,q_auto",
  };

  const corp = new FormData();
  for (const [k, v] of Object.entries(parametri)) corp.append(k, v);
  corp.append("api_key", cheie);
  corp.append("signature", semneaza(parametri, secret));
  corp.append(
    "file",
    new Blob([new Uint8Array(octeti)], { type: tip }),
    "poza",
  );

  const raspuns = await fetch(
    `https://api.cloudinary.com/v1_1/${cont}/image/upload`,
    { method: "POST", body: corp },
  );
  if (!raspuns.ok) return null;

  const date = (await raspuns.json()) as {
    public_id?: string;
    width?: number;
    height?: number;
  };
  if (!date.public_id || !date.width || !date.height) return null;
  return { id: date.public_id, latime: date.width, inaltime: date.height };
}

/** Adresa de afișare a unei poze urcate, la lățimea cerută. */
export function adresaPoza(id: string, latime: number): string {
  const cont =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cont}/image/upload/f_auto,q_auto,w_${latime},c_limit/${id}`;
}

/**
 * Adresa pentru previzualizarea de pe Facebook și WhatsApp.
 *
 * Decupată fix la 1200×630 — raportul pe care îl cer rețelele. Fără decupaj,
 * o poză verticală apare tăiată aiurea sau cu benzi, iar `g_auto` lasă
 * Cloudinary să aleagă partea cu oamenii din ea, nu mijlocul geometric.
 */
export function adresaPentruDistribuire(id: string): string {
  const cont =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cont}/image/upload/f_jpg,q_auto,w_1200,h_630,c_fill,g_auto/${id}`;
}
