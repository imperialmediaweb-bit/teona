import { ADRESA_SITE } from "@/app/seo";
import {
  ADRESE,
  ASOCIATIA,
  CONTACT_FIRME,
  CONTURI,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { curat, tabel, trimiteEmail } from "./trimite";
import { MIC, P, buton, caseta, paginaInterna, pagina, pasi } from "./plic";
import { alege } from "./variante";
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

/** Ce anunță un om pe `/formular-230`, după ce l-a completat pe hârtie. */
export type Formular230 = {
  nume: string;
  email: string;
  telefon?: string;
  /** Pe câți ani a bifat distribuirea, dacă a spus. */
  ani?: 1 | 2 | null;
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
    html: pagina(
      titlu,
      corp,
      "Patru pași, datele noastre pentru contabilitate și un om pe care îl puteți suna.",
    ),
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
    html: paginaInterna(
      titlu,
      corp,
      `${d.firma} · ${d.cale}${d.suma ? ` · ${d.suma}` : ""}`,
    ),
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
    html: pagina(
      titlu,
      corp,
      "Nu te costă nimic, iar termenul e 25 mai. Trei pași.",
    ),
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
    html: paginaInterna(titlu, corp, `${d.nume} · ${d.preferinta}`),
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

// ─── Formularul 230 completat pe hârtie ───────────────────────────────────

const WHATSAPP = `https://wa.me/${TELEFON_PRINCIPAL.apel.replace(/\D/g, "")}`;

/**
 * Către om: am notat, dar hârtia încă n-a ajuns.
 *
 * Mesajul ăsta e singura urmă scrisă a unui gest care, altfel, se pierde: omul
 * a completat formularul acasă, a bifat pe site că l-a completat, și de acolo
 * mai are două lucruri de făcut — poza și hârtia. Nicio bază de date nu i le
 * amintește, iar termenul e 25 mai.
 *
 * **Nu confirmă că am primit formularul**, pentru că nu l-am primit: site-ul
 * nu primește poza și nu ține niciun CNP. Confirmă doar că știm să-l așteptăm.
 */
/* Cinci variante, alese ca la mulțumiri (`variante.ts`). */
const DESCHIDERI_230 = [
  "Ne-ai spus pe site că ai completat Formularul 230. Mulțumim — îți mai rămân două lucruri, și ambele contează:",
  "Am notat că ai completat Formularul 230. Mulțumim că te-ai gândit la copiii de aici. Mai sunt două lucruri de făcut:",
  "Mulțumim că ai completat Formularul 230. Partea grea a trecut; au mai rămas două lucruri, amândouă scurte:",
  "Ți-am notat anunțul. 3,5% din impozitul pe care oricum îl plătești ajunge la copii — dacă mai faci două lucruri:",
  "Am primit anunțul tău. Formularul e completat, dar încă n-a ajuns la noi: mai sunt doi pași, ăștia:",
] as const;

export function compuneFormular230(d: Formular230): Compus {
  const titlu = "Am notat formularul tău 230";
  const deschidere = alege(DESCHIDERI_230, d.email, new Date());
  const corp = `
    <p style="${P}">Bună, ${curat(d.nume.split(" ")[0])},</p>
    <p style="${P}font-size:18px;">${curat(deschidere)}</p>
    ${pasi([
      `<strong>Poza formularului</strong>, pe WhatsApp la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong> sau pe e-mail la <strong>${curat(EMAIL.redirectionare)}</strong>. O verificăm și-ți spunem dacă e completat bine, cât mai e timp de corectat.`,
      `<strong>Hârtia semnată, în original</strong>, prin poștă la Casa Teona, ${curat(ADRESE.casaTeona.strada)}, ${curat(ADRESE.casaTeona.oras)} ${curat(ADRESE.casaTeona.cod)} — sau adusă personal. Fără ea, ANAF nu poate înregistra redirecționarea.`,
    ])}
    ${buton("Trimite poza pe WhatsApp", WHATSAPP)}
    <p style="${P}"><strong>Termenul este 25 mai</strong>, pentru veniturile din anul anterior. Depunem formularul noi, în numele tău, și îți scriem când e depus.</p>
    ${
      d.ani === 2
        ? `<p style="${MIC}">Ai bifat distribuirea pe <strong>doi ani</strong>, deci la anul nu mai trebuie să completezi nimic.</p>`
        : `<p style="${MIC}">Formularul are și opțiunea de distribuire pe doi ani. Dacă o bifezi, la anul nu mai ai nimic de completat — dacă n-ai bifat-o, te căutăm noi.</p>`
    }
    <p style="${MIC}margin-bottom:0;">Nu ți-am cerut CNP-ul pe site și nu-l ținem nicăieri. Ai întrebări? Răspunde la mesajul ăsta sau sună la ${curat(TELEFON_PRINCIPAL.afisat)}.</p>`;

  return {
    subiect: titlu,
    html: pagina(
      titlu,
      corp,
      "Îți mai rămân poza pe WhatsApp și hârtia semnată prin poștă.",
    ),
    text: `Bună, ${d.nume},

${deschidere}

1. Poza formularului, pe WhatsApp la ${TELEFON_PRINCIPAL.afisat} sau pe e-mail la ${EMAIL.redirectionare}. O verificăm și-ți spunem dacă e completat bine.
2. Hârtia semnată, în original, prin poștă la Casa Teona, ${ADRESE.casaTeona.strada}, ${ADRESE.casaTeona.oras} ${ADRESE.casaTeona.cod} — sau adusă personal. Fără ea, ANAF nu poate înregistra redirecționarea.

Termenul este 25 mai, pentru veniturile din anul anterior. Depunem formularul noi, în numele tău.
${
  d.ani === 2
    ? "\nAi bifat distribuirea pe doi ani, deci la anul nu mai trebuie să completezi nimic.\n"
    : "\nFormularul are și opțiunea de distribuire pe doi ani. Dacă o bifezi, la anul nu mai ai nimic de completat.\n"
}
Nu ți-am cerut CNP-ul pe site și nu-l ținem nicăieri. Ai întrebări? Răspunde la mesajul ăsta sau sună la ${TELEFON_PRINCIPAL.afisat}.

${SEMNATURA_TEXT}`,
  };
}

/** Către asociație: pe cine așteptăm cu hârtia. */
export function compuneAnuntFormular230(d: Formular230): Compus {
  const titlu = "A completat Formularul 230 pe hârtie";
  const campuri = tabel([
    ["Nume", d.nume],
    ["E-mail", d.email],
    ["Telefon", d.telefon ?? ""],
    ["Pe câți ani", d.ani ? (d.ani === 2 ? "2 ani" : "1 an") : ""],
  ]);

  const corp = `
    <p style="${P}">A bifat pe site că a completat formularul. <strong>Hârtia și poza n-au ajuns prin site</strong> — site-ul nu primește fișiere și nu ține niciun CNP. Caută-le pe WhatsApp și în ${curat(EMAIL.redirectionare)}.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${campuri.html}</table>
    <p style="${MIC}">I-am scris deja ce-i mai rămâne de făcut: poza pe WhatsApp și hârtia semnată prin poștă.</p>
    ${buton("Deschide formularele 230", `${ADRESA_SITE}/admin/formulare`)}`;

  return {
    subiect: `${titlu} — ${d.nume}`,
    html: paginaInterna(
      titlu,
      corp,
      `${d.nume}${d.ani === 2 ? " · 2 ani" : ""} — de așteptat cu hârtia.`,
    ),
    text: `${titlu}

${campuri.text}

Hârtia și poza n-au ajuns prin site. Caută-le pe WhatsApp și în ${EMAIL.redirectionare}.

${ADRESA_SITE}/admin/formulare`,
  };
}

/**
 * Amândouă. Întâi omul: el a făcut gestul și el are termen.
 *
 * Niciuna nu oprește nimic dacă nu pleacă — anunțul e deja în CRM, iar
 * numărul lui stă în „De făcut acum".
 */
export async function trimiteFormular230(d: Formular230): Promise<void> {
  await trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.redirectionare,
    ...compuneFormular230(d),
  });
  await trimiteEmail({
    catre: EMAIL.redirectionare,
    raspundeLa: d.email,
    ...compuneAnuntFormular230(d),
  });
}
