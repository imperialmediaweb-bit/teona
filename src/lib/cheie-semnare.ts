import { createHmac } from "node:crypto";
import { egale } from "./comparatie";

/**
 * Cheia cu care site-ul semnează tot ce dă în mână oamenilor: sesiunile din
 * panou și din contul donatorului, dispozitivele ținute minte, linkurile din
 * e-mail (oprirea donației, cardul nou, invitația).
 *
 * **Numai `SECRET_SESIUNE`, cel puțin 32 de semne.** Până în octombrie 2026,
 * când lipsea, se folosea parola asociației (`PAROLA_ADMIN`) — și pe Railway
 * chiar lipsea. Asta lega două lucruri care n-au voie să stea legate: orice
 * donator are în browser un cookie semnat și își știe adresa, deci putea
 * încerca parole pe calculatorul lui, fără nicio limită de încercări, până
 * găsea semnătura potrivită. Găsită semnătura, avea parola care deschide tot
 * panoul. O cheie aleatoare de 32 de octeți nu se ghicește; o parolă aleasă de
 * un om, da.
 *
 * Lipsa cheii oprește funcțiile cu totul, în loc să treacă pe o valoare
 * implicită: una implicită e aceeași pe toate instalările, deci publică.
 *
 * Se face cu `openssl rand -base64 32` și se pune în Railway. Schimbată,
 * scoate pe toată lumea din panou și din contul de donator — e și felul în
 * care se închid, deodată, toate sesiunile, dacă s-a scurs ceva.
 */
export function cheiaDeSemnat(): string | null {
  const c = process.env.SECRET_SESIUNE;
  return c && c.length >= 32 ? c : null;
}

/**
 * Până când mai sunt bune linkurile din e-mail semnate cu parola asociației.
 *
 * Linkurile de oprire și de card nou trăiesc 35 de zile; cele trimise înainte
 * de mutarea pe `SECRET_SESIUNE` (29 octombrie 2026) s-ar fi stricat toate
 * deodată, iar un om care vrea să-și oprească donația și primește „linkul nu
 * mai e bun” sună la bancă, nu la asociație. Numai **verificarea** le mai
 * primește, și numai până atunci; nimic nou nu se mai semnează cu parola.
 * Sesiunile nu trec pe aici: ele se pot cere din nou, deci se închid.
 */
const VECHI_PANA_LA = Date.UTC(2026, 11, 5);

function cheiDeVerificat(): string[] {
  const chei: string[] = [];
  const noua = cheiaDeSemnat();
  if (noua) chei.push(noua);
  const veche = process.env.PAROLA_ADMIN;
  if (Date.now() < VECHI_PANA_LA && veche && veche.length >= 16 && veche !== noua) {
    chei.push(veche);
  }
  return chei;
}

/** HMAC-SHA256 al textului, cu cheia de acum, sau `null` fără cheie. */
export function semneazaText(text: string): string | null {
  const c = cheiaDeSemnat();
  return c ? createHmac("sha256", c).update(text).digest("hex") : null;
}

/**
 * Semnătura unui link din e-mail ține? Cu cheia de acum sau, până la
 * `VECHI_PANA_LA`, cu cea veche. Comparație în timp constant.
 */
export function semnaturaLinkuluiTine(text: string, semn: string): boolean {
  let tine = false;
  for (const c of cheiDeVerificat()) {
    const asteptat = createHmac("sha256", c).update(text).digest("hex");
    if (egale(semn, asteptat)) tine = true;
  }
  return tine;
}
