import { ADRESA_SITE } from "@/app/seo";
import {
  ASOCIATIA,
  CONTACT_FIRME,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { curat, tabel, trimiteEmail } from "./trimite";
import { MIC, P, buton, caseta, paginaInterna, pagina, pasi } from "./plic";

/**
 * E-mailurile contractului de sponsorizare.
 *
 * **Copia către firmă pleacă pe loc, cu PDF-ul atașat.** E locul în care
 * documentul se regăsește peste o săptămână, când cel care l-a descărcat nu
 * mai știe unde l-a pus, și e dovada că adresa scrisă în contract chiar
 * funcționează — altfel am afla asta abia când încercăm să-i trimitem
 * exemplarul contrasemnat.
 *
 * Cele două e-mailuri ale semnatului pe ecran au fost scoase odată cu el:
 * trimiteau la `/admin/contracte`, o pagină care nu mai există, și nu le mai
 * chema nimeni.
 */

const FUNDRAISING = CONTACT_FIRME[0];
const SEMNATURA_TEXT = `${ASOCIATIA.denumire}\nCIF ${ASOCIATIA.cif}\n${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}`;

export type ContractNesemnat = {
  denumire: string;
  reprezentant: string;
  email: string;
  valoare: string;
  numeFisier: string;
  pdf: Uint8Array;
};

/**
 * Către firmă: contractul completat, nesemnat încă.
 *
 * Firma l-a descărcat de pe site; copia pe e-mail nu e un dublu inutil. E
 * locul în care documentul se regăsește peste o săptămână, când cel care l-a
 * descărcat nu mai știe unde l-a pus, și e dovada că adresa scrisă în contract
 * chiar funcționează — altfel am afla asta abia când încercăm să-i trimitem
 * exemplarul contrasemnat.
 */
export function compuneContractulNesemnat(
  d: Omit<ContractNesemnat, "pdf" | "numeFisier">,
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

  return {
    subiect: titlu,
    html: pagina(
      titlu,
      corp,
      "Verificați datele, semnați, trimiteți înapoi — îl contrasemnăm.",
    ),
    text: `Bună ziua,

Atașat e contractul de sponsorizare, completat cu datele firmei ${d.denumire}, așa cum l-ați descărcat de pe site.

1. Verificați datele din el.
2. Semnați-l: cu certificatul calificat al firmei sau tipărit, cu pixul.
3. Trimiteți-ni-l înapoi, ca răspuns la mesajul acesta.

Valoarea din contract: ${d.valoare} lei

Întrebări: ${FUNDRAISING.telefon.afisat}.

${SEMNATURA_TEXT}`,
  };
}

/** Compus și trimis, cu contractul atașat. */
export async function trimiteContractulNesemnat(d: ContractNesemnat) {
  const compus = compuneContractulNesemnat(d);
  return trimiteEmail({
    catre: d.email,
    subiect: compus.subiect,
    html: compus.html,
    text: compus.text,
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
    html: paginaInterna(
      titlu,
      corp,
      `${d.denumire} · ${d.valoare ? `${d.valoare} lei` : d.fel}`,
    ),
    text: `O firmă și-a luat de pe site contractul completat cu datele ei.

${campuri.text}

A primit și ea o copie pe e-mail. Firma e în panou, la Firme.

${ADRESA_SITE}/admin/firme`,
    raspundeLa: d.email,
  });
}
