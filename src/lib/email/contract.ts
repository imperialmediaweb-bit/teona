import { ADRESA_SITE } from "@/app/seo";
import {
  ASOCIATIA,
  CONTACT_FIRME,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { curat, tabel, trimiteEmail } from "./trimite";
import { MIC, P, buton, caseta, pagina, pasi } from "./plic";

/**
 * E-mailurile contractului semnat online.
 *
 * **Copia către firmă pleacă pe loc, cu PDF-ul atașat.** Nu e o curtoazie:
 * semnătura de pe ecran e una simplă, iar ce o susține sunt împrejurările în
 * care a fost dată. Un contract ajuns în inboxul firmei în minutul semnării,
 * cu documentul atașat, e dovada cea mai la îndemână că firma a văzut exact
 * ce a semnat și n-a spus nimic împotrivă. Un link spre site n-ar face același
 * lucru: linkul se poate schimba, atașamentul rămâne la ea.
 */

export type ContractSemnat = {
  denumire: string;
  reprezentant: string;
  email: string;
  valoare: string;
  amprenta: string;
  numeFisier: string;
  pdf: Uint8Array;
};

const FUNDRAISING = CONTACT_FIRME[0];
const SEMNATURA_TEXT = `${ASOCIATIA.denumire}\nCIF ${ASOCIATIA.cif}\n${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}`;

/** Către firmă: contractul semnat, plus ce urmează. */
export async function trimiteContractulFirmei(d: ContractSemnat) {
  const titlu = "Contractul de sponsorizare, semnat";
  const corp = `
    <p style="${P}">Bună ziua,</p>
    <p style="${P}">Ați semnat pe site contractul de sponsorizare în numele <strong>${curat(d.denumire)}</strong>. Îl găsiți atașat la mesajul acesta, exact așa cum l-ați semnat.</p>
    ${pasi([
      "Îl contrasemnează <strong>" +
        curat(ASOCIATIA.denumire) +
        "</strong> și vă trimitem exemplarul semnat de amândoi.",
      "Virați suma în contul din contract sau o înmânați în numerar, cum v-ați înțeles cu noi.",
      "Contabilitatea dumneavoastră depune Declarația 177 la ANAF, în termenul care i se aplică firmei.",
    ])}
    ${caseta(
      `<p style="${MIC}margin-bottom:6px;"><strong style="color:#232323;">Valoarea din contract</strong> · ${curat(d.valoare)} lei</p>
       <p style="${MIC}margin-bottom:0;">Amprenta documentului (SHA-256): ${curat(d.amprenta.slice(0, 32))}…</p>`,
    )}
    <p style="${MIC}">Amprenta e o sumă de control: dacă vreodată e nevoie, ea arată că fișierul din mâna dumneavoastră e exact cel semnat atunci, neschimbat.</p>
    <p style="${P}">Dacă ceva din contract nu e în regulă, răspundeți la mesajul ăsta sau sunați la ${curat(FUNDRAISING.telefon.afisat)} și îl refacem.</p>
    ${buton("Pagina pentru firme", `${ADRESA_SITE}${RUTE.directionare20}`)}`;

  return trimiteEmail({
    catre: d.email,
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `Bună ziua,

Ați semnat pe site contractul de sponsorizare în numele ${d.denumire}. Îl găsiți atașat, exact așa cum l-ați semnat.

Mai departe:
1. Îl contrasemnează ${ASOCIATIA.denumire} și vă trimitem exemplarul semnat de amândoi.
2. Virați suma în contul din contract sau o înmânați în numerar.
3. Contabilitatea dumneavoastră depune Declarația 177 la ANAF.

Valoarea din contract: ${d.valoare} lei
Amprenta documentului (SHA-256): ${d.amprenta}

Dacă ceva nu e în regulă, răspundeți la mesajul ăsta sau sunați la ${FUNDRAISING.telefon.afisat}.

${SEMNATURA_TEXT}`,
    raspundeLa: EMAIL.contact,
    atasamente: [{ nume: d.numeFisier, continut: d.pdf }],
  });
}

/**
 * Către firmă: contractul completat, nesemnat încă.
 *
 * Firma l-a descărcat de pe site; copia pe e-mail nu e un dublu inutil. E
 * locul în care documentul se regăsește peste o săptămână, când cel care l-a
 * descărcat nu mai știe unde l-a pus, și e dovada că adresa scrisă în contract
 * chiar funcționează — altfel am afla asta abia când încercăm să-i trimitem
 * exemplarul contrasemnat.
 */
export async function trimiteContractulNesemnat(
  d: Omit<ContractSemnat, "amprenta">,
) {
  const titlu = "Contractul de sponsorizare, completat";
  const corp = `
    <p style="${P}">Bună ziua,</p>
    <p style="${P}">Atașat e contractul de sponsorizare, completat cu datele firmei <strong>${curat(d.denumire)}</strong>, așa cum l-ați descărcat de pe site.</p>
    ${pasi([
      "Verificați datele din el — orice se poate schimba direct în document.",
      "Semnați-l: cu certificatul calificat al firmei, în Adobe Reader sau în aplicația furnizorului, ori tipărit, cu pixul.",
      "Trimiteți-ni-l înapoi, ca răspuns la mesajul acesta. Îl contrasemnăm și vă trimitem exemplarul semnat de amândoi.",
    ])}
    ${caseta(
      `<p style="${MIC}margin-bottom:0;"><strong style="color:#232323;">Valoarea din contract</strong> · ${curat(d.valoare)} lei</p>`,
    )}
    <p style="${P}">Dacă ceva nu e în regulă, răspundeți aici sau sunați la ${curat(FUNDRAISING.telefon.afisat)}.</p>
    ${buton("Pagina pentru firme", `${ADRESA_SITE}${RUTE.directionare20}`)}`;

  return trimiteEmail({
    catre: d.email,
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `Bună ziua,

Atașat e contractul de sponsorizare, completat cu datele firmei ${d.denumire}, așa cum l-ați descărcat de pe site.

1. Verificați datele din el.
2. Semnați-l: cu certificatul calificat al firmei sau tipărit, cu pixul.
3. Trimiteți-ni-l înapoi, ca răspuns la mesajul acesta.

Valoarea din contract: ${d.valoare} lei

Întrebări: ${FUNDRAISING.telefon.afisat}.

${SEMNATURA_TEXT}`,
    raspundeLa: EMAIL.contact,
    atasamente: [{ nume: d.numeFisier, continut: d.pdf }],
  });
}

/** Către asociație: o firmă și-a luat contractul completat de pe site. */
export async function anuntaDescarcarea(d: {
  denumire: string;
  cui: string;
  reprezentant: string;
  email: string;
  telefon?: string;
  valoare: string;
  fel: string;
}) {
  const titlu = `Contract descărcat — ${d.denumire}`;
  const campuri = tabel([
    ["Firmă", d.denumire],
    ["CUI", d.cui],
    ["Persoană", d.reprezentant],
    ["E-mail", d.email],
    ["Telefon", d.telefon ?? ""],
    ["Valoare", d.valoare ? `${d.valoare} lei` : ""],
    ["Format", d.fel],
  ]);

  const corp = `
    <p style="${P}">O firmă și-a luat de pe site contractul completat cu datele ei. Urmează să-l semneze și să-l trimită înapoi — merită un telefon dacă nu vine nimic în câteva zile.</p>
    ${campuri.html}
    <p style="${P}">A primit și ea o copie pe e-mail. Firma e în panou, la Firme.</p>
    ${buton("Deschide panoul", `${ADRESA_SITE}/admin/firme`)}`;

  return trimiteEmail({
    catre: EMAIL.fundraising,
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `O firmă și-a luat de pe site contractul completat cu datele ei.

${campuri.text}

A primit și ea o copie pe e-mail. Firma e în panou, la Firme.

${ADRESA_SITE}/admin/firme`,
    raspundeLa: d.email,
  });
}

/** Către asociație: a venit un contract de contrasemnat. */
export async function anuntaContractulLaAsociatie(
  d: ContractSemnat & { cui: string; telefon?: string; ip?: string },
) {
  const titlu = `Contract semnat online — ${d.denumire}`;
  const campuri = tabel([
    ["Firmă", d.denumire],
    ["CUI", d.cui],
    ["Semnat de", d.reprezentant],
    ["E-mail", d.email],
    ["Telefon", d.telefon ?? ""],
    ["Valoare", `${d.valoare} lei`],
    ["De la adresa IP", d.ip ?? ""],
  ]);

  const corp = `
    <p style="${P}">O firmă a completat și semnat contractul de sponsorizare direct pe site. E atașat la mesajul ăsta și vă așteaptă semnătura.</p>
    ${campuri.html}
    <p style="${P}">Copia a plecat deja către firmă, pe e-mailul de mai sus.</p>
    ${buton("Deschide panoul", `${ADRESA_SITE}/admin/contracte`)}`;

  return trimiteEmail({
    catre: EMAIL.fundraising,
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `O firmă a semnat contractul de sponsorizare pe site.

${campuri.text}

Contractul e atașat. Copia a plecat deja către firmă.

${ADRESA_SITE}/admin/contracte`,
    raspundeLa: d.email,
    atasamente: [{ nume: d.numeFisier, continut: d.pdf }],
  });
}
