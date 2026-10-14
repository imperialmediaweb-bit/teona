/**
 * Pozele care vin direct din Cloudinary, nu din `public/`.
 *
 * **De ce există un prefix.** Pozele vechi stau pe disc, la `/poze/2024/11/x.jpg`,
 * și încărcătorul le traduce în identificatori Cloudinary. Dar pozele noi —
 * taberele pe care asociația le urcă singură, în foldere cu nume scrise de
 * mână („TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025”) — nu există pe disc și n-au
 * cum să fie ghicite dintr-o cale locală. Ele intră în site cu o cale care
 * începe cu `/cloud/`, urmată de identificatorul din Cloudinary ca atare.
 *
 * Așa, `next/image` le primește ca pe orice altă poză (cale care începe cu
 * `/`, deci trece validarea), iar încărcătorul știe din prefix că nu trebuie
 * să mai pună nimic în față.
 *
 * Fișierul n-are nicio dependență și citește doar variabile `NEXT_PUBLIC_*`:
 * e importat și de încărcător, care ajunge și în browser.
 */

/** Calea unei poze din Cloudinary începe cu asta. */
export const PREFIX_CLOUD = "/cloud/";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function esteCloud(cale: string): boolean {
  return cale.startsWith(PREFIX_CLOUD);
}

/**
 * Adresa publică a unei poze din Cloudinary, la lățimea cerută.
 *
 * Fiecare bucată din identificator se codifică separat: numele folderelor
 * sunt scrise de oameni, cu spații și cu diacritice („TABĂRĂ SURDO-MUȚI
 * 16-20 IUNIE 2025”), iar `/` dintre ele trebuie să rămână `/`.
 *
 * `c_limit` nu taie și nu mărește: o poză mai mică decât lățimea cerută
 * rămâne la mărimea ei, în loc să fie întinsă.
 */
export function adresaCloud(
  cale: string,
  latime: number,
  calitate: number | string = "auto",
): string {
  const id = esteCloud(cale) ? cale.slice(PREFIX_CLOUD.length) : cale;
  const identificator = id.split("/").map(encodeURIComponent).join("/");
  const transformari = `f_auto,q_${calitate},w_${latime},c_limit`;
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${transformari}/${identificator}`;
}

/**
 * Adresa de pus în datele structurate și în previzualizările de Facebook.
 *
 * O poză din Cloudinary are nevoie de adresa ei completă; una din `public/`
 * rămâne o cale relativă, pe care `absoluta()` din `seo.tsx` o completează cu
 * domeniul site-ului. 1200 px e lățimea cerută de Open Graph.
 */
export function adresaPublica(cale: string, latime = 1200): string {
  return esteCloud(cale) ? adresaCloud(cale, latime) : cale;
}
