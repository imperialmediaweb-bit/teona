import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";
import { curat, trimiteEmail } from "./trimite";

/**
 * E-mailurile modulului „Donează-ți ziua de naștere".
 *
 * Trei momente, trei mesaje:
 *
 * 1. **A trimis campania** — primește linkul privat, cu care își vede pagina
 *    cât e în verificare. Până acum linkul se vedea doar pe ecran, iar cine
 *    închidea fila îl pierdea.
 * 2. **I-am publicat-o** — primește adresa publică, de distribuit.
 * 3. **Am respins-o** — află de ce, și pe cine să întrebe. Tăcerea ar fi mai
 *    rea: omul și-a pus poza și cuvintele lui acolo.
 *
 * În paralel, la trimitere pleacă un mesaj și către asociație, altfel nimeni
 * n-ar ști că are ceva de verificat — site-ul n-are cum să dea un semn de la
 * sine.
 */

const PORTOCALIU = "#b82b09";
const CERNEALA = "#232323";
const MOALE = "#616161";

function pagina(titlu: string, corp: string): string {
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${curat(titlu)}</title></head>
<body style="margin:0;padding:0;background-color:#f9f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f5f2;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="height:6px;background-color:${PORTOCALIU};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:28px 32px 0;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${PORTOCALIU};">${curat(ASOCIATIA.denumire)}</p>
          <h1 style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:25px;line-height:1.3;color:${CERNEALA};">${curat(titlu)}</h1>
        </td></tr>
        <tr><td style="padding:22px 32px 30px;">${corp}</td></tr>
        <tr><td style="padding:0 32px 28px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};">
            ${curat(ASOCIATIA.denumireLegala)} · ${curat(TELEFON_PRINCIPAL.afisat)} · ${curat(EMAIL.contact)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const P = `margin:0 0 16px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:${CERNEALA};`;

function buton(eticheta: string, adresa: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td bgcolor="${PORTOCALIU}" style="border-radius:999px;"><a href="${curat(adresa)}" style="display:inline-block;padding:13px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${curat(eticheta)}</a></td></tr></table>`;
}

/** Ce poartă un e-mail, înainte de a pleca: se poate și doar privi. */
export type Compus = { subiect: string; html: string; text: string };

type Trimisa = {
  email: string;
  numePublic: string;
  titlu: string;
  slug: string;
  jeton: string;
};

/** 1. Omul tocmai a trimis campania. */
export function compuneTrimisa(d: Trimisa): Compus {
  const privat = `${ADRESA_SITE}/ziua-ta/${d.slug}?jeton=${d.jeton}`;
  const titlu = "Am primit campania ta";
  const corp = `
    <p style="${P}">Bună, ${curat(d.numePublic.split(" ")[0])},</p>
    <p style="${P}">Ți-am primit campania <strong>${curat(d.titlu)}</strong>. O citim și o publicăm, de obicei în aceeași zi lucrătoare — îți scriem imediat ce e gata.</p>
    <p style="${P}">Până atunci îți poți vedea pagina, exact cum va arăta, la adresa asta. E doar a ta, păstreaz-o:</p>
    ${buton("Vezi pagina ta", privat)}
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};word-break:break-all;">${curat(privat)}</p>`;

  return {
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `Bună, ${d.numePublic},\n\nȚi-am primit campania „${d.titlu}". O citim și o publicăm, de obicei în aceeași zi lucrătoare.\n\nPână atunci îți vezi pagina aici (e doar a ta, păstreaz-o):\n${privat}\n\n${ASOCIATIA.denumire}`,
  };
}

export async function campanieTrimisa(d: Trimisa): Promise<boolean> {
  const compus = compuneTrimisa(d);
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compus,
  });
}

type Anunt = { numePublic: string; titlu: string; email: string };

/** 1b. Asociația află că are ceva de verificat. */
export function compuneAnunt(d: Anunt): Compus {
  const unde = `${ADRESA_SITE}/admin/campanii`;
  const titlu = "O campanie nouă, de verificat";
  const corp = `
    <p style="${P}"><strong>${curat(d.numePublic)}</strong> (${curat(d.email)}) a trimis campania <strong>${curat(d.titlu)}</strong>.</p>
    <p style="${P}">Nu apare pe site până n-o citește cineva.</p>
    ${buton("Deschide lista de verificat", unde)}`;

  return {
    subiect: `${titlu}: ${d.titlu}`,
    html: pagina(titlu, corp),
    text: `${d.numePublic} (${d.email}) a trimis campania „${d.titlu}".\n\nNu apare pe site până n-o citește cineva:\n${unde}`,
  };
}

export async function anuntaAsociatia(d: Anunt): Promise<boolean> {
  return trimiteEmail({ catre: EMAIL.contact, ...compuneAnunt(d) });
}

type Hotarare = {
  email: string;
  numePublic: string;
  titlu: string;
  slug: string;
  publicata: boolean;
  motiv?: string;
};

/** 2 și 3. Hotărârea asociației. */
export function compuneHotarare(d: Hotarare): Compus {
  const adresa = `${ADRESA_SITE}/ziua-ta/${d.slug}`;
  const prenume = curat(d.numePublic.split(" ")[0]);

  const titlu = d.publicata
    ? "Campania ta e publicată"
    : "Despre campania ta";

  const corp = d.publicata
    ? `
      <p style="${P}">Bună, ${prenume},</p>
      <p style="${P}">Campania <strong>${curat(d.titlu)}</strong> e publicată. De acum o poți trimite prietenilor — poza ta apare în previzualizare pe Facebook și pe WhatsApp.</p>
      ${buton("Deschide pagina ta", adresa)}
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${MOALE};word-break:break-all;">${curat(adresa)}</p>
      <p style="${P}">Mulțumim că te-ai gândit la copii de ziua ta.</p>`
    : `
      <p style="${P}">Bună, ${prenume},</p>
      <p style="${P}">Nu am putut publica campania <strong>${curat(d.titlu)}</strong> așa cum a fost trimisă.</p>
      ${d.motiv ? `<p style="${P}"><em>${curat(d.motiv)}</em></p>` : ""}
      <p style="${P}">Dacă vrei, o poți trimite din nou, schimbată — sau scrie-ne și o rezolvăm împreună. Răspunde direct la mesajul ăsta ori sună la ${curat(TELEFON_PRINCIPAL.afisat)}.</p>`;

  return {
    subiect: titlu,
    html: pagina(titlu, corp),
    text: d.publicata
      ? `Bună, ${d.numePublic},\n\nCampania „${d.titlu}" e publicată:\n${adresa}\n\nMulțumim că te-ai gândit la copii de ziua ta.\n\n${ASOCIATIA.denumire}`
      : `Bună, ${d.numePublic},\n\nNu am putut publica campania „${d.titlu}" așa cum a fost trimisă.${d.motiv ? `\n\n${d.motiv}` : ""}\n\nO poți trimite din nou, schimbată, sau scrie-ne și o rezolvăm împreună. Sună la ${TELEFON_PRINCIPAL.afisat}.\n\n${ASOCIATIA.denumire}`,
  };
}

export async function campanieHotarata(d: Hotarare): Promise<boolean> {
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compuneHotarare(d),
  });
}
