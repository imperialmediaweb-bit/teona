import { ADRESA_SITE } from "@/app/seo";
import {
  ASOCIATIA,
  CONTACT_FIRME,
  CONTURI,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { curat, tabel, trimiteEmail } from "./trimite";
import { MIC, P, buton, caseta, pagina, pasi } from "./plic";
import type { Compus } from "./campanie";

/**
 * E-mailurile celor două formulare fiscale: 20% pentru firme (8) și 3,5%
 * pentru persoane fizice (7).
 *
 * Până acum, cele două pagini explicau ce are omul de făcut, dar îl lăsau
 * acolo: dacă nu ținea minte sau nu avea timp atunci, se pierdea. Formularele
 * astea nu cer nimic greu — nume, o adresă — și trimit explicația pe e-mail,
 * unde omul o are când se așază cu contabilul sau cu actele în față.
 *
 * **Ce nu scrie în ele.** Termenul de depunere al Declarației 177 și plafonul
 * exact al firmei nu apar nicăieri: caietul de sarcini le lasă „de confirmat”,
 * iar un termen fiscal greșit înseamnă o firmă care pierde dreptul de
 * direcționare. Se spune, în schimb, cine confirmă și pe ce cale. Termenul de
 * 25 mai pentru Formularul 230 e în lege și e deja scris pe pagină, deci apare
 * și aici.
 */

/** Ce completează o firmă pe `/directioneaza-20`. */
export type CerereSponsorizare = {
  firma: string;
  cui: string;
  persoana: string;
  email: string;
  telefon?: string;
  /** „Declarația 177” sau „Contract de sponsorizare”. */
  cale: string;
  suma?: string;
  mesaj?: string;
};

/** Ce completează un om pe `/redirectioneaza-3-5`. */
export type CerereRedirectionare = {
  nume: string;
  email: string;
  telefon?: string;
  /** „Completez online” sau „Vreau formularul pe hârtie”. */
  preferinta: string;
};

const SEMNATURA_TEXT = `${ASOCIATIA.denumire}\nCIF ${ASOCIATIA.cif}\n${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}`;

/** Persoana care se ocupă de firme. Prima din listă, ca pe pagină. */
const FUNDRAISING = CONTACT_FIRME[0];

// ─── 20% — firme ──────────────────────────────────────────────────────────

/** Către firmă: ce urmează, și de ce nu-i cerem încă nimic semnat. */
export function compuneSponsorizare(d: CerereSponsorizare): Compus {
  const titlu = "Pașii pentru sponsorizare";
  const conturi = CONTURI.filter((c) => c.moneda === "RON")
    .map(
      (c) =>
        `<p style="${MIC}margin-bottom:6px;"><strong style="color:#232323;">${curat(c.banca)}</strong> · ${curat(c.iban)}</p>`,
    )
    .join("");

  const corp = `
    <p style="${P}">Bună, ${curat(d.persoana.split(" ")[0])},</p>
    <p style="${P}">Am primit cererea trimisă în numele <strong>${curat(d.firma)}</strong> și vă mulțumim. Ați ales calea <strong>${curat(d.cale)}</strong>.</p>
    <p style="${P}">Mai departe arată așa:</p>
    ${pasi([
      "Vă scrie <strong>" +
        curat(FUNDRAISING.nume) +
        "</strong>, " +
        curat(FUNDRAISING.rol.toLowerCase()) +
        ", cu contractul de sponsorizare completat cu datele noastre.",
      "Contabilitatea dumneavoastră confirmă suma și termenul de depunere — ele depind de situația fiscală a firmei, așa că nu le putem calcula noi de aici.",
      "Semnați contractul și, după caz, depuneți Declarația 177 la ANAF.",
      "Vă trimitem dovada că suma a ajuns și, dacă doriți, vă trecem printre sponsorii de pe site.",
    ])}
    <p style="${P}">Datele noastre, pentru contabilitate:</p>
    ${caseta(
      `<p style="${MIC}margin-bottom:6px;"><strong style="color:#232323;">${curat(ASOCIATIA.denumireLegala)}</strong></p>
       <p style="${MIC}margin-bottom:6px;">CIF ${curat(ASOCIATIA.cif)}</p>
       ${conturi}`,
    )}
    <p style="${P}">Dacă vreți să vorbim înainte, sunați la ${curat(FUNDRAISING.telefon.afisat)} sau răspundeți direct la mesajul ăsta.</p>
    ${buton("Vezi pagina pentru firme", `${ADRESA_SITE}${RUTE.directionare20}`)}`;

  return {
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `Bună, ${d.persoana},

Am primit cererea trimisă în numele ${d.firma}. Ați ales calea: ${d.cale}.

Mai departe:
1. Vă scrie ${FUNDRAISING.nume}, ${FUNDRAISING.rol.toLowerCase()}, cu contractul de sponsorizare completat cu datele noastre.
2. Contabilitatea dumneavoastră confirmă suma și termenul de depunere — depind de situația fiscală a firmei.
3. Semnați contractul și, după caz, depuneți Declarația 177 la ANAF.
4. Vă trimitem dovada că suma a ajuns.

Datele noastre:
${ASOCIATIA.denumireLegala}
CIF ${ASOCIATIA.cif}
${CONTURI.filter((c) => c.moneda === "RON")
  .map((c) => `${c.banca}: ${c.iban}`)
  .join("\n")}

Dacă vreți să vorbim înainte: ${FUNDRAISING.telefon.afisat}.

${ADRESA_SITE}${RUTE.directionare20}

${SEMNATURA_TEXT}`,
  };
}

/** Către asociație: cine a cerut, și ce a completat. */
export function compuneAnuntSponsorizare(d: CerereSponsorizare): Compus {
  const titlu = "Cerere nouă de sponsorizare";
  const campuri = tabel([
    ["Firmă", d.firma],
    ["CUI", d.cui],
    ["Persoană de contact", d.persoana],
    ["E-mail", d.email],
    ["Telefon", d.telefon ?? ""],
    ["Calea aleasă", d.cale],
    ["Suma estimată", d.suma ?? ""],
    ["Mesaj", d.mesaj ?? ""],
  ]);

  const corp = `
    <p style="${P}">A completat formularul de pe pagina pentru firme. Răspunde direct la mesajul ăsta și ajungi la persoana de contact.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${campuri.html}</table>
    <p style="${MIC}margin-bottom:0;">Pasul următor, așa cum i l-am scris: contractul de sponsorizare completat cu datele noastre.</p>`;

  return {
    subiect: `${titlu} — ${d.firma}`,
    html: pagina(titlu, corp),
    text: `${titlu}\n\n${campuri.text}`,
  };
}

export async function trimiteSponsorizare(
  d: CerereSponsorizare,
): Promise<{ catreAsociatie: boolean }> {
  // Întâi mesajul către asociație: dacă el nu pleacă, ruta îi spune omului,
  // în loc să-l lase să creadă că a scris cuiva.
  const catreAsociatie = await trimiteEmail({
    catre: [EMAIL.contact, FUNDRAISING.email],
    raspundeLa: d.email,
    ...compuneAnuntSponsorizare(d),
  });
  if (!catreAsociatie) return { catreAsociatie: false };

  await trimiteEmail({
    catre: d.email,
    raspundeLa: FUNDRAISING.email,
    ...compuneSponsorizare(d),
  });
  return { catreAsociatie: true };
}

// ─── 3,5% — persoane fizice ───────────────────────────────────────────────

/** Către om: cei trei pași, scriși ca să-i poată urma fără site-ul deschis. */
export function compuneRedirectionare(d: CerereRedirectionare): Compus {
  const titlu = "Cum redirecționezi 3,5%";
  const online = `${ADRESA_SITE}${RUTE.redirectionare35}`;

  const corp = `
    <p style="${P}">Bună, ${curat(d.nume.split(" ")[0])},</p>
    <p style="${P}">Nu te costă nimic: impozitul pe venit îl plătești oricum, iar prin Formularul 230 alegi doar unde ajunge 3,5% din el. Uite ce ai de făcut:</p>
    ${pasi([
      "Completezi Formularul 230 cu datele tale.",
      "Semnezi formularul și declarația de consimțământ.",
      `Ni-l trimiți la <strong>${curat(EMAIL.redirectionare)}</strong>, scanat sau fotografiat, ori ni-l aduci la Casa Teona. Îl depunem noi la ANAF, în numele tău.`,
    ])}
    <p style="${P}">Cel mai simplu e online: îl completezi și îl semnezi pe ecran, fără imprimantă și fără drum.</p>
    ${buton("Completează online", online)}
    <p style="${P}"><strong>Termenul este 25 mai</strong>, pentru veniturile din anul anterior. Îți confirmăm că am primit formularul și, mai târziu, că a fost depus.</p>
    ${caseta(
      `<p style="${MIC}margin-bottom:6px;">Datele noastre, dacă completezi formularul de mână:</p>
       <p style="${MIC}margin-bottom:6px;"><strong style="color:#232323;">${curat(ASOCIATIA.denumireLegala)}</strong></p>
       <p style="${MIC}margin-bottom:6px;">CIF ${curat(ASOCIATIA.cif)}</p>
       <p style="${MIC}margin-bottom:0;">IBAN ${curat(CONTURI[0].iban)}</p>`,
    )}
    <p style="${MIC}margin-bottom:0;">Ai întrebări? Răspunde la mesajul ăsta sau sună la ${curat(TELEFON_PRINCIPAL.afisat)}.</p>`;

  return {
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `Bună, ${d.nume},

Nu te costă nimic: impozitul pe venit îl plătești oricum, iar prin Formularul 230 alegi doar unde ajunge 3,5% din el.

1. Completezi Formularul 230 cu datele tale.
2. Semnezi formularul și declarația de consimțământ.
3. Ni-l trimiți la ${EMAIL.redirectionare}, scanat sau fotografiat, ori ni-l aduci la Casa Teona. Îl depunem noi la ANAF, în numele tău.

Cel mai simplu e online, pe ecran, fără imprimantă:
${online}

Termenul este 25 mai, pentru veniturile din anul anterior.

Datele noastre, dacă îl completezi de mână:
${ASOCIATIA.denumireLegala}
CIF ${ASOCIATIA.cif}
IBAN ${CONTURI[0].iban}

Ai întrebări? Răspunde la mesajul ăsta sau sună la ${TELEFON_PRINCIPAL.afisat}.

${SEMNATURA_TEXT}`,
  };
}

/** Către asociație: cine a cerut pașii, ca să poată fi urmărit. */
export function compuneAnuntRedirectionare(d: CerereRedirectionare): Compus {
  const titlu = "Cerere nouă de redirecționare 3,5%";
  const campuri = tabel([
    ["Nume", d.nume],
    ["E-mail", d.email],
    ["Telefon", d.telefon ?? ""],
    ["Preferă", d.preferinta],
  ]);

  const corp = `
    <p style="${P}">A cerut pașii pentru Formularul 230. I-am trimis deja explicația și linkul de completare online.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${campuri.html}</table>`;

  return {
    subiect: `${titlu} — ${d.nume}`,
    html: pagina(titlu, corp),
    text: `${titlu}\n\n${campuri.text}`,
  };
}

export async function trimiteRedirectionare(
  d: CerereRedirectionare,
): Promise<{ catreOm: boolean }> {
  // Aici ordinea e invers decât la firme: mesajul care contează e cel către
  // om — el a cerut pașii. Cel către asociație e doar evidență.
  const catreOm = await trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.redirectionare,
    ...compuneRedirectionare(d),
  });
  if (!catreOm) return { catreOm: false };

  await trimiteEmail({
    catre: EMAIL.redirectionare,
    raspundeLa: d.email,
    ...compuneAnuntRedirectionare(d),
  });
  return { catreOm: true };
}
