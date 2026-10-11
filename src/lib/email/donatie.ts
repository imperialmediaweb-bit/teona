import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { DESTINATII } from "@/date/plati";
import { scrieSuma } from "@/lib/suma";
import { ADRESA_SITE } from "@/app/seo";
import { curat, trimiteEmail } from "./trimite";

/**
 * Mulțumirea pentru o donație.
 *
 * Nu e o chitanță fiscală și nu se numește așa. Caietul de sarcini spune
 * limpede că donația unei persoane fizice **nu** se deduce din impozitul pe
 * venit, deci nu există document fiscal de emis și nu-i promitem unul. Ce
 * conține e tot ce-i trebuie unui om ca dovadă: suma, data, destinația,
 * denumirea legală și CIF-ul asociației.
 *
 * Pentru firme e altceva — acolo e contract de sponsorizare, semnat, și se
 * ocupă asociația de el.
 *
 * Mesajul pleacă din webhook, adică abia după ce procesatorul a confirmat
 * plata. Niciodată de pe pagina de mulțumire: adresa aia o poate deschide
 * oricine, iar o mulțumire pentru bani care n-au intrat e mai rea decât
 * tăcerea.
 */

const PORTOCALIU = "#b82b09";
const CERNEALA = "#232323";
const MOALE = "#616161";
const UMBRA = "#efe7e1";

type Date = {
  email: string;
  prenume: string | null;
  nume: string | null;
  sumaBani: number;
  moneda: string;
  frecventa: string;
  destinatie: string;
  /** `true` la reînnoirea lunară: textul e altul, nu „bine ai venit”. */
  reinnoire?: boolean;
};

function salut(d: Date): string {
  const prenume = (d.prenume ?? "").trim();
  // Caietul (2.2) cere exact asta: fără prenume completat, mesajul începe
  // cu „Bună,” — nu cu „Bună , ” sau cu numele de familie.
  return prenume ? `Bună, ${prenume}` : "Bună";
}

function sumaScrisa(d: Date): string {
  const valoare = d.sumaBani / 100;
  return d.moneda === "RON"
    ? scrieSuma(valoare)
    : `${valoare.toFixed(2)} ${d.moneda}`;
}

type Compus = { subiect: string; html: string; text: string };

export function construiesteMultumirea(d: Date): Compus {
  const lunar = d.frecventa === "lunar";
  const suma = sumaScrisa(d);
  // „Donație — tabere RESPIRO" → „Tabere RESPIRO": numele destinației se
  // scrie cu majusculă când stă singur într-un tabel, nu în mijlocul unei
  // propoziții de pe extrasul de cont.
  const brut = (DESTINATII[d.destinatie] ?? DESTINATII.oriunde).replace(
    /^Donație — /,
    "",
  );
  const unde = brut.charAt(0).toUpperCase() + brut.slice(1);
  const azi = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const titlu = d.reinnoire
    ? "Donația ta lunară a ajuns la copii"
    : "Mulțumim pentru donație!";

  const deschidere = d.reinnoire
    ? `Ți s-a reînnoit donația lunară de ${suma}. Nu trebuie să faci nimic — îți scriem doar ca să știi.`
    : lunar
      ? `Donația ta de ${suma} pe lună înseamnă mult pentru noi. Prima plată a intrat; următoarea se face automat, în aceeași zi a lunii viitoare.`
      : `Donația ta de ${suma} înseamnă mult pentru noi.`;

  const randuri: Array<[string, string]> = [
    ["Suma", suma],
    ["Data", azi],
    ["Pentru", unde],
    ["Tip", lunar ? "Donație lunară" : "Donație unică"],
  ];

  const textSimplu = [
    `${salut(d)},`,
    "",
    deschidere,
    "",
    ...randuri.map(([e, v]) => `${e}: ${v}`),
    "",
    lunar
      ? `Poți opri donația lunară oricând, fără motivare — scrie-ne la ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat}.`
      : `Dacă ai nevoie de o confirmare scrisă din partea asociației, scrie-ne la ${EMAIL.contact}.`,
    "",
    `Îți poți vedea oricând toate donațiile, fără parolă: ${ADRESA_SITE}/contul-meu`,
    "",
    `${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}`,
    `${ADRESE.casaTeona.strada}, ${ADRESE.casaTeona.oras} ${ADRESE.casaTeona.cod}`,
    `${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}`,
    "",
    ASOCIATIA.motto,
  ].join("\n");

  const html = `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${curat(titlu)}</title></head>
<body style="margin:0;padding:0;background-color:#f9f5f2;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${curat(deschidere)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f5f2;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="height:6px;background-color:${PORTOCALIU};font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td align="center" style="padding:30px 32px 0;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${PORTOCALIU};">${curat(ASOCIATIA.denumire)}</p>
          <h1 style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:27px;line-height:1.3;color:${CERNEALA};">${curat(titlu)}</h1>
        </td></tr>

        <tr><td style="padding:22px 32px 0;">
          <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:${CERNEALA};">${curat(salut(d))},</p>
          <p style="margin:0 0 22px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:${CERNEALA};">${curat(deschidere)}</p>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fdf3ee;border-radius:12px;">
            <tr><td style="padding:18px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${randuri
                  .map(
                    ([eticheta, valoare], i) =>
                      `<tr><td style="padding:${i === 0 ? "0" : "8px"} 12px 0 0;font-family:Arial,sans-serif;font-size:14px;color:${MOALE};white-space:nowrap;">${curat(eticheta)}</td><td align="right" style="padding:${i === 0 ? "0" : "8px"} 0 0;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${CERNEALA};">${curat(valoare)}</td></tr>`,
                  )
                  .join("")}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 32px 0;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:${MOALE};">
            ${
              lunar
                ? `Poți opri donația lunară oricând, fără motivare și fără explicații — scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:${PORTOCALIU};">${EMAIL.contact}</a> sau sună la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong>.`
                : `Dacă ai nevoie de o confirmare scrisă din partea asociației, scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:${PORTOCALIU};">${EMAIL.contact}</a>.`
            }
          </p>
        </td></tr>

        <tr><td align="center" style="padding:26px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr><td align="center" bgcolor="${PORTOCALIU}" style="border-radius:999px;">
              <a href="${ADRESA_SITE}${RUTE.proiecte}" style="display:inline-block;padding:13px 30px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">Vezi ce facem cu banii</a>
            </td></tr>
          </table>
        </td></tr>

        <!--
          Contul donatorului.

          Linkul duce la pagina de intrare, nu la un cont deschis: un e-mail
          poate fi retrimis, tipărit sau ajuns la altcineva, iar un link care
          deschide direct istoricul donațiilor ar fi o cheie plimbată prin
          lume. Acolo cere singur un link de intrare, care merge o dată.
        -->
        <tr><td align="center" style="padding:14px 32px 0;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">
            Îți poți vedea oricând toate donațiile în
            <a href="${ADRESA_SITE}/contul-meu" style="color:${PORTOCALIU};font-weight:bold;">contul tău</a>.
            Nu-ți trebuie parolă.
          </p>
        </td></tr>

        <tr><td style="padding:28px 32px;">
          <div style="height:1px;background-color:${UMBRA};font-size:0;line-height:0;">&nbsp;</div>
          <p style="margin:18px 0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};"><strong>${curat(ASOCIATIA.denumireLegala)}</strong> · CIF ${curat(ASOCIATIA.cif)}</p>
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">${curat(ADRESE.casaTeona.strada)}, ${curat(ADRESE.casaTeona.oras)} ${curat(ADRESE.casaTeona.cod)}</p>
          <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">${curat(TELEFON_PRINCIPAL.afisat)} · ${curat(EMAIL.contact)}</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;font-style:italic;color:${PORTOCALIU};">${curat(ASOCIATIA.motto)}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subiect: d.reinnoire
      ? `Donația ta lunară de ${suma} · ${ASOCIATIA.denumire}`
      : "Mulțumim pentru donația ta",
    html,
    text: textSimplu,
  };
}

export async function trimiteMultumirea(d: Date): Promise<boolean> {
  const compus = construiesteMultumirea(d);
  return trimiteEmail({
    catre: d.email,
    subiect: compus.subiect,
    raspundeLa: EMAIL.contact,
    html: compus.html,
    text: compus.text,
  });
}
