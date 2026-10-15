import { ADRESA_SITE } from "@/app/seo";
import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RETELE_ASOCIATIE,
  TELEFOANE,
} from "@/date/asociatie";
import { curat } from "./trimite";

/** Sigla, ca fișier servit de site: într-un e-mail, adresele trebuie întregi. */
const SIGLA = `${ADRESA_SITE}/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1.png`;

/**
 * Plicul e-mailurilor tranzacționale: confirmări, mulțumiri, formulare.
 *
 * Sunt alt fel de mesaje decât campaniile din `sablon.ts`, care pleacă prin
 * MailerLite către o listă. Astea pleacă la un singur om, ca urmare a ceva ce
 * a făcut el pe site, și au nevoie de o formă mai sobră: fără poză mare, fără
 * dezabonare — de la o chitanță nu te dezabonezi.
 *
 * Regulile de randare sunt aceleași și aici: tabele pentru așezare, stiluri
 * în linie, 600 px lățime, butoane din celule de tabel. Outlook randează cu
 * motorul Word, Gmail taie `<style>` din `<head>`.
 */

export const CULORI = {
  /**
   * Portocaliul închis, nu cel de pe site.
   *
   * `caramiziu-500` (#F74F22) dă alb pe portocaliu la 3,44:1 — sub pragul AA
   * pentru text normal. Într-un e-mail nu există mod întunecat de ajustat și
   * nici variantă de rezervă, deci folosim de la început nuanța care trece
   * pragul (5,9:1).
   */
  accent: "#b82b09",
  cerneala: "#232323",
  moale: "#616161",
  fundal: "#f9f5f2",
  card: "#ffffff",
} as const;

/** Un paragraf obișnuit. Se pune ca `style`, nu ca `class`. */
export const P = `margin:0 0 16px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:${CULORI.cerneala};`;

/** Text mic, pentru adrese lungi și note de subsol. */
export const MIC = `margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${CULORI.moale};`;

/**
 * Un buton.
 *
 * Nu e `<a>` cu fundal: e o celulă de tabel colorată, cu linkul înăuntru.
 * Outlook ignoră fundalul unui link, dar nu și `bgcolor` pe o celulă —
 * altfel butonul ar ajunge text albastru subliniat.
 */
export function buton(eticheta: string, adresa: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td bgcolor="${CULORI.accent}" style="border-radius:999px;"><a href="${curat(adresa)}" style="display:inline-block;padding:13px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${curat(eticheta)}</a></td></tr></table>`;
}

/** O casetă liniștită, pentru datele de cont sau o listă de pași. */
export function caseta(continut: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;background-color:${CULORI.fundal};border-radius:12px;"><tr><td style="padding:18px 20px;">${continut}</td></tr></table>`;
}

/**
 * O listă numerotată de pași.
 *
 * Nu `<ol>`: Outlook îi strică spațierea și indentarea, iar numerele ies
 * aliniate greșit. Un tabel cu numărul în prima coloană arată la fel peste
 * tot.
 */
export function pasi(randuri: string[]): string {
  const celule = randuri
    .map(
      (text, i) =>
        `<tr><td width="30" valign="top" style="padding:0 10px 12px 0;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:${CULORI.accent};">${i + 1}.</td><td valign="top" style="padding:0 0 12px;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:${CULORI.cerneala};">${text}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px;">${celule}</table>`;
}

/**
 * Plicul: antet cu siglă, corpul, și datele de contact jos.
 *
 * **De ce arată ca pe site.** Un e-mail de confirmare care începe cu o linie
 * de text și se termină cu două rânduri mărunte seamănă cu o notificare de
 * bancă. Omul tocmai a donat sau tocmai a cerut ceva de la asociație: are
 * dreptul să recunoască asociația din prima privire. Sigla și banda portocalie
 * sunt aceleași ca în șabloanele de campanie.
 *
 * **De ce datele de contact întregi jos.** Telefoanele, adresa de e-mail,
 * Casa Teona și rețelele. Un mesaj de la o asociație e și locul de unde omul
 * află cum să dea de ea — mai ales dacă ceva n-a mers cum trebuia. Înainte
 * erau un telefon și o adresă, pe un rând.
 *
 * **Ce rămâne altfel decât la campanii:** nicio dezabonare. De la o chitanță
 * nu te dezaboneszi, iar un link de dezabonare pe un e-mail tranzacțional îi
 * învață pe oameni să se dezaboneze de la confirmări.
 *
 * `previzualizare` e rândul pe care îl arată Gmail și Apple Mail în listă,
 * după subiect. Nelăsat, clientul ia primele cuvinte din mesaj — și acolo
 * începe antetul, deci în listă ar apărea „Asociația Teona Ariana Suceava”,
 * adică exact ce scrie și la expeditor. Rândul stă ascuns în pagină: nu se
 * vede la deschiderea mesajului, doar în listă.
 */
export function pagina(
  titlu: string,
  corp: string,
  previzualizare?: string,
): string {
  return invelis(titlu, corp, previzualizare, false);
}

/**
 * Același plic, pentru mesajele care pleacă în casa asociației.
 *
 * Se deosebesc printr-un singur rând, cel de jos de tot. „Primești mesajul
 * ăsta pentru că ai scris sau ai donat pe teona-ariana.ro" e adevărat despre
 * un donator și fals despre adresa de contact a asociației, care primește
 * anunțurile fiindcă e adresa asociației. Un rând care minte într-un mesaj
 * automat e felul în care nimeni nu mai citește rândurile mărunte.
 */
export function paginaInterna(
  titlu: string,
  corp: string,
  previzualizare?: string,
): string {
  return invelis(titlu, corp, previzualizare, true);
}

function invelis(
  titlu: string,
  corp: string,
  previzualizare: string | undefined,
  interna: boolean,
): string {
  const retele = RETELE_ASOCIATIE.map(
    (r) =>
      `<a href="${r.url}" style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:${CULORI.accent};text-decoration:none;padding:0 8px;">${r.nume}</a>`,
  ).join("");

  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><title>${curat(titlu)}</title></head>
<body style="margin:0;padding:0;background-color:${CULORI.fundal};">
  ${previzualizare ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${CULORI.fundal};">${curat(previzualizare)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CULORI.fundal}" style="background-color:${CULORI.fundal};">
    <tr><td align="center" style="padding:24px 12px 32px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${CULORI.card};border-radius:16px;overflow:hidden;">

        <tr><td align="center" bgcolor="${CULORI.accent}" style="background-color:${CULORI.accent};padding:22px 32px 18px;">
          <img src="${SIGLA}" alt="" width="44" height="44" style="display:block;border:0;margin:0 auto 8px;" />
          <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">${curat(ASOCIATIA.denumire)}</p>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <h1 style="margin:0;font-family:Arial,sans-serif;font-size:25px;line-height:1.3;color:${CULORI.cerneala};">${curat(titlu)}</h1>
        </td></tr>

        <tr><td style="padding:22px 32px 26px;">${corp}</td></tr>

        <tr><td style="padding:0 32px 22px;">
          <div style="height:1px;background-color:#efe7e1;font-size:0;line-height:0;">&nbsp;</div>
        </td></tr>

        <tr><td align="center" style="padding:0 32px 18px;">${retele}</td></tr>

        <tr><td style="padding:0 32px 30px;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${CULORI.moale};">
            <strong style="color:${CULORI.cerneala};">${curat(ASOCIATIA.denumireLegala)}</strong> · CIF ${curat(ASOCIATIA.cif)}
          </p>
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${CULORI.moale};">
            ${curat(ADRESE.casaTeona.nume)}: ${curat(ADRESE.casaTeona.strada)}, ${curat(ADRESE.casaTeona.oras)} ${curat(ADRESE.casaTeona.cod)}
          </p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${CULORI.moale};">
            ${TELEFOANE.map((t) => `<a href="tel:${t.apel}" style="color:${CULORI.moale};text-decoration:none;">${curat(t.afisat)}</a>`).join(" · ")} · <a href="mailto:${EMAIL.contact}" style="color:${CULORI.moale};">${curat(EMAIL.contact)}</a>
          </p>
          <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:${CULORI.moale};">
            ${
              interna
                ? `Mesaj automat de pe ${curat(ADRESA_SITE.replace(/^https?:\/\//, ""))}. Nu e trimis de un om și nu-i poate răspunde nimeni — răspunsul pleacă la cel care a completat formularul.`
                : `Primești mesajul ăsta pentru că ai scris sau ai donat pe ${curat(ADRESA_SITE.replace(/^https?:\/\//, ""))}.`
            }
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
