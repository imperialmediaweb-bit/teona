/**
 * Încărcătorul de imagini pentru Cloudinary.
 *
 * `next.config.ts` îl pune în funcțiune **numai** când
 * `CLOUDINARY_CLOUD_NAME` e setat. Fără el, Next își folosește optimizatorul
 * propriu și fișierul ăsta nu e chemat niciodată — motivul e explicat acolo.
 *
 * Fișierul e serializat și trimis și în browser, deci citește doar variabile
 * `NEXT_PUBLIC_*` și nu are dependențe.
 */

type Parametri = { src: string; width: number; quality?: number };

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "T1";

export default function incarcator({ src, width, quality }: Parametri): string {
  // O adresă completă (o siglă externă, o poză de pe alt domeniu) se lasă așa.
  if (/^https?:\/\//.test(src)) return src;

  if (CLOUD) {
    // `/poze/2024/11/nume.webp` -> `T1/2024/11/nume`. Extensia lipsește
    // intenționat: `f_auto` alege formatul după ce acceptă browserul.
    const id = `${FOLDER}/${src
      .replace(/^\/poze\//, "")
      .replace(/^\//, "")
      .replace(/\.[a-z0-9]+$/i, "")}`;
    const transformari = `f_auto,q_${quality ?? "auto"},w_${width},c_limit`;
    return `https://res.cloudinary.com/${CLOUD}/image/upload/${transformari}/${id}`;
  }

  // Nu ar trebui să ajungem aici: fără nume de cont, `next.config.ts` nici nu
  // montează încărcătorul. Dacă totuși se întâmplă, servim fișierul ca atare —
  // neoptimizat, dar vizibil, nu o adresă care dă 404.
  return src;
}
