import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { curat } from "./trimite";

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

/** Antetul cu denumirea asociației, corpul, și datele de contact jos. */
export function pagina(titlu: string, corp: string): string {
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${curat(titlu)}</title></head>
<body style="margin:0;padding:0;background-color:${CULORI.fundal};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CULORI.fundal};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${CULORI.card};border-radius:16px;overflow:hidden;">
        <tr><td style="height:6px;background-color:${CULORI.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:28px 32px 0;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${CULORI.accent};">${curat(ASOCIATIA.denumire)}</p>
          <h1 style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:25px;line-height:1.3;color:${CULORI.cerneala};">${curat(titlu)}</h1>
        </td></tr>
        <tr><td style="padding:22px 32px 30px;">${corp}</td></tr>
        <tr><td style="padding:0 32px 28px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${CULORI.moale};">
            ${curat(ASOCIATIA.denumireLegala)} · CIF ${curat(ASOCIATIA.cif)}<br />
            ${curat(TELEFON_PRINCIPAL.afisat)} · ${curat(EMAIL.contact)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
