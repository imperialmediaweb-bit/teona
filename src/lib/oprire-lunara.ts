import { createHmac } from "node:crypto";
import { egale } from "./comparatie";

/**
 * Linkul cu un singur clic prin care donatorul își oprește donația lunară.
 *
 * **De ce un link și nu „intră în cont".** Mesajul de dinaintea reînnoirii îi
 * spune omului că peste două zile i se ia iar suma. Dacă acolo scrie „intră
 * în contul tău ca să oprești", drumul are patru pași: deschide pagina, scrie
 * adresa, așteaptă alt e-mail, apasă. Omul care voia să oprească și n-a putut
 * în treizeci de secunde nu face pașii — sună la bancă și blochează plata.
 * Asociația află din Stripe, ca dispută, cu comision și cu un donator pierdut
 * prost.
 *
 * **De ce e sigur destul.** Semnătura e peste identificatorul abonamentului
 * și peste ziua în care expiră, cu cheia serverului. Cine are linkul poate
 * opri **numai** abonamentul din el, și numai până la expirare. Nu deschide
 * contul, nu arată nicio dată personală, nu poate fi întors ca să afle ce
 * abonamente are altcineva. Paguba maximă, dacă linkul ajunge la cine nu
 * trebuie, e că o donație se oprește — exact lucrul pe care îl cere oricum
 * donatorul, și pe care asociația îl face la un telefon, fără să întrebe de
 * ce.
 *
 * **Linkul nu oprește nimic când e deschis.** Duce la o pagină cu un buton.
 * Scanerele de e-mail ale firmelor deschid din reflex toate adresele dintr-un
 * mesaj ca să le verifice; un link care ar opri donația la deschidere ar
 * opri-o singur, înainte ca omul să citească mesajul.
 */

const ZI_MS = 24 * 3600 * 1000;

/**
 * Cât ține linkul: 35 de zile.
 *
 * Destul cât să acopere luna până la următorul mesaj, deci un om care
 * deschide târziu mesajul de luna trecută tot are butonul. Nu mai mult:
 * un link uitat într-o cutie poștală nu trebuie să rămână o cheie pe viață.
 */
const VIATA_ZILE = 35;

function cheie(): string | null {
  const c = process.env.SECRET_SESIUNE ?? process.env.PAROLA_ADMIN;
  return c && c.length >= 16 ? c : null;
}

function semneaza(abonament: string, expira: number): string | null {
  const c = cheie();
  if (!c) return null;
  return createHmac("sha256", c)
    .update(`oprire:${abonament}:${expira}`)
    .digest("hex");
}

/** Adresa de pus în e-mail, sau `null` dacă n-avem cheie. */
export function linkDeOprire(
  adresaSite: string,
  abonament: string,
): string | null {
  const expira = Date.now() + VIATA_ZILE * ZI_MS;
  const semn = semneaza(abonament, expira);
  if (!semn) return null;
  const cauta = new URLSearchParams({
    a: abonament,
    p: String(expira),
    s: semn,
  });
  return `${adresaSite}/opreste-donatia?${cauta}`;
}

export type Dovada = { a: string; p: string; s: string };

/**
 * Abonamentul din link, dacă semnătura ține și n-a expirat.
 *
 * Comparația e în timp constant: altfel durata răspunsului ar lăsa pe cineva
 * să ghicească semnătura octet cu octet.
 */
export function abonamentulDinLink(d: Partial<Dovada>): string | null {
  const abonament = (d.a ?? "").trim();
  const expira = Number(d.p);
  const semn = (d.s ?? "").trim();

  if (!/^sub_[A-Za-z0-9]+$/.test(abonament)) return null;
  if (!Number.isFinite(expira) || expira < Date.now()) return null;

  const asteptat = semneaza(abonament, expira);
  if (!asteptat || !egale(semn, asteptat)) return null;
  return abonament;
}
