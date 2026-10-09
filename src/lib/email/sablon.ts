import { ADRESE, ASOCIATIA, EMAIL, TELEFOANE } from "@/date/asociatie";

/**
 * Șablonul de e-mail al asociației.
 *
 * HTML-ul de e-mail nu e HTML-ul de site. Outlook randează cu motorul Word,
 * Gmail taie `<style>` din `<head>`, iar `flex` și `grid` nu există nicăieri.
 * De aceea: tabele pentru așezare, stiluri scrise în linie, lățime fixă de
 * 600 px și butoane construite din celule de tabel, nu din `<a>` cu spațiere
 * — un `<a>` cu `padding` apare în Outlook ca text subliniat, fără buton.
 *
 * Culorile sunt cele din `globals.css`, scrise aici ca valori: un e-mail nu
 * poate citi variabile CSS.
 */

const PORTOCALIU = "#b82b09"; // caramiziu-700: alb pe el dă 5,9:1
const CERNEALA = "#232323";
const MOALE = "#616161";
const HARTIE_CALDA = "#f9f5f2";
const UMBRA = "#efe7e1";

export type ButonDonatie = { eticheta: string; adresa: string };

export type ContinutEmail = {
  titlu: string;
  /** Paragrafele, în ordine. Text simplu — nu se interpretează ca marcaj. */
  paragrafe: string[];
  poza?: { adresa: string; alt: string } | null;
  butoane?: ButonDonatie[];
  /** Adresa de dezabonare. MailerLite o înlocuiește cu a lui. */
  dezabonare?: string;
};

/** Scapă textul scris de om, ca să nu poată aduce marcaj în e-mail. */
function curat(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Un buton care arată a buton și în Outlook.
 *
 * Celula de tabel ține culoarea și spațierea; `<a>` dinăuntru e doar textul.
 * Așa butonul e dreptunghi colorat peste tot, nu doar în clienții moderni.
 */
function buton(b: ButonDonatie): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
      <tr>
        <td align="center" bgcolor="${PORTOCALIU}" style="border-radius:999px;">
          <a href="${curat(b.adresa)}"
             style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${curat(b.eticheta)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function construieste(continut: ContinutEmail): string {
  const paragrafe = continut.paragrafe
    .filter((p) => p.trim() !== "")
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${CERNEALA};">${curat(p)}</p>`,
    )
    .join("");

  const poza = continut.poza
    ? `<tr><td style="padding:0 0 24px;">
         <img src="${curat(continut.poza.adresa)}" alt="${curat(continut.poza.alt)}"
              width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
       </td></tr>`
    : "";

  const butoane = (continut.butoane ?? []).length
    ? `<tr><td align="center" style="padding:8px 0 24px;">
         ${(continut.butoane ?? []).map(buton).join("")}
       </td></tr>`
    : "";

  const telefoane = TELEFOANE.map((t) => t.afisat).join(" · ");

  // MailerLite cere un link de dezabonare în orice HTML propriu. `{$unsubscribe}`
  // e variabila lui; o lăsăm ca atare dacă nu primim alta.
  const dezabonare = continut.dezabonare ?? "{$unsubscribe}";

  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${curat(continut.titlu)}</title>
</head>
<body style="margin:0;padding:0;background-color:${HARTIE_CALDA};">
  <!-- Textul de previzualizare din inbox: primul paragraf, ascuns în corp. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${curat(continut.paragrafe[0] ?? "")}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${HARTIE_CALDA};">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <tr>
            <td style="height:6px;background-color:${PORTOCALIU};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:${PORTOCALIU};">
                ${curat(ASOCIATIA.denumire)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 0;">
              <h1 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.3;color:${CERNEALA};">
                ${curat(continut.titlu)}
              </h1>
            </td>
          </tr>

          <tr><td style="padding:0 32px;">${paragrafe}</td></tr>

          ${poza.replace('<td style="padding:0 0 24px;">', '<td style="padding:8px 32px 24px;">')}

          ${butoane}

          <tr>
            <td style="padding:0 32px 28px;">
              <div style="height:1px;background-color:${UMBRA};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">
                <strong>${curat(ASOCIATIA.denumireLegala)}</strong> · CIF ${curat(ASOCIATIA.cif)}
              </p>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">
                ${curat(ADRESE.casaTeona.strada)}, ${curat(ADRESE.casaTeona.oras)} ${curat(ADRESE.casaTeona.cod)}
              </p>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">
                ${curat(telefoane)} · ${curat(EMAIL.contact)}
              </p>
              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">
                Primești acest mesaj pentru că ți-ai dat acordul.
                <a href="${dezabonare}" style="color:${MOALE};text-decoration:underline;">Dezabonează-te</a>.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Varianta în text simplu, pentru clienții care nu afișează HTML. */
export function textSimplu(continut: ContinutEmail): string {
  const linii = [
    continut.titlu,
    "",
    ...continut.paragrafe.filter((p) => p.trim() !== ""),
    "",
    ...(continut.butoane ?? []).map((b) => `${b.eticheta}: ${b.adresa}`),
    "",
    "—",
    `${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}`,
    `${ADRESE.casaTeona.strada}, ${ADRESE.casaTeona.oras} ${ADRESE.casaTeona.cod}`,
    `${TELEFOANE.map((t) => t.afisat).join(" · ")} · ${EMAIL.contact}`,
  ];
  return linii.join("\n");
}
