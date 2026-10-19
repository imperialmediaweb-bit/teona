import { ADRESA_SITE } from "@/app/seo";
import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { CIFRE_DIN_COD, cifreSite, type Cifra } from "@/lib/cifre";

/** Cerneala din plic, pentru un `strong` dintr-o casetă. */
const CULORI_CERNEALA = "#232323";
import { curat, tabel, trimiteEmail } from "./trimite";
import { MIC, P, buton, caseta, paginaInterna, pagina } from "./plic";
import type { Compus } from "./campanie";

/**
 * Formularul de contact și cel de voluntariat: mesajul către asociație și
 * confirmarea către om.
 *
 * **De ce au ajuns aici.** Erau scrise în ruta `/api/contact`, direct în
 * șabloane de text: două paragrafe cu `font-family:Arial` pe fiecare etichetă
 * și nimic altceva. Nici siglă, nici datele asociației, nici un rând despre ce
 * urmează — cel mai des trimise dintre toate mesajele site-ului și singurele
 * care nu arătau ca ale asociației. Un om care tocmai s-a oferit voluntar
 * primea ceva ce semăna cu o eroare de server.
 *
 * Acum trec prin același plic ca restul, deci se schimbă o dată pentru toate:
 * un telefon nou intră și aici fără să-și amintească nimeni de ruta asta.
 */

export type MesajDeContact = {
  nume: string;
  email: string;
  /** `true` la formularul de voluntariat: alt titlu și alt text. */
  voluntariat: boolean;
  /** Tot ce a completat, în ordinea de pe formular. Golurile se taie. */
  campuri: Array<[string, string]>;
};

/** Către asociație: cine a scris și ce a completat. */
export function compuneMesajulDeContact(d: MesajDeContact): Compus {
  const titlu = d.voluntariat
    ? "Cerere nouă de voluntariat"
    : "Mesaj nou de pe site";
  const campuri = tabel(d.campuri);

  const corp = `
    <p style="${P}">${
      d.voluntariat
        ? "Cineva s-a oferit voluntar, de pe pagina Devino voluntar."
        : "Cineva a scris de pe pagina de contact."
    } Răspunde direct la mesajul ăsta și ajungi la el.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${campuri.html}</table>
    <p style="${MIC}margin-bottom:0;">A primit o confirmare că mesajul a ajuns. Cererea e și în panou, la Cereri.</p>
    ${buton("Deschide cererile", `${ADRESA_SITE}/admin/cereri`)}`;

  /*
    Rândul din listă.

    Subiectul poartă deja numele, deci aici n-ar ajuta încă o dată: pune ce a
    scris omul. Într-o cutie poștală cu zece cereri, propoziția lui e singurul
    lucru care spune pe care se deschide prima.
  */
  const spus = d.campuri.find(
    ([eticheta, valoare]) =>
      (eticheta === "Motivul" || eticheta === "Mesaj") && valoare.trim() !== "",
  )?.[1];

  return {
    subiect: `${titlu}${d.nume ? ` — ${d.nume}` : ""}`,
    html: paginaInterna(titlu, corp, spus || d.nume || d.email),
    text: `${titlu}\n\n${campuri.text}\n\n${ADRESA_SITE}/admin/cereri`,
  };
}

/** Către om: am primit, îți răspundem. */
export function compuneConfirmareaDeContact(
  d: Pick<MesajDeContact, "nume" | "email" | "voluntariat">,
  cifre: ReadonlyArray<Cifra> = CIFRE_DIN_COD,
): Compus {
  const titlu = d.voluntariat
    ? "Am primit cererea ta de voluntariat"
    : "Am primit mesajul tău";
  const prenume = d.nume.trim().split(/\s+/)[0];

  const deschidere = d.voluntariat
    ? "Îți mulțumim pentru cererea de voluntariat. Am primit-o și te contactăm în două-trei zile lucrătoare, telefonic sau pe e-mail."
    : "Îți mulțumim pentru mesaj. L-am primit și îți răspundem în două-trei zile lucrătoare.";

  const urmeaza = d.voluntariat
    ? `La Casa Teona este nevoie de voluntari la activitățile cu copiii, în tabere și la evenimente. Nu este necesară experiență anterioară — până acum au fost alături de noi peste ${cifre[3].valoare} de voluntari.`
    : "Dacă mesajul tău privește un copil sau o familie care are nevoie de ajutor, îl tratăm cu prioritate.";

  const corp = `
    <p style="${P}">${prenume ? `Bună, ${curat(prenume)},` : "Bună,"}</p>
    <p style="${P}font-size:18px;">${curat(deschidere)}</p>
    <p style="${P}">${curat(urmeaza)}</p>
    ${caseta(
      `<p style="${MIC}margin-bottom:0;">Dacă este ceva urgent, ne poți suna la <strong style="color:${CULORI_CERNEALA};">${curat(TELEFON_PRINCIPAL.afisat)}</strong>.</p>`,
    )}
    ${buton(
      d.voluntariat ? "Vezi ce facem la Casa Teona" : "Vezi proiectele noastre",
      `${ADRESA_SITE}${d.voluntariat ? RUTE.casaTeona : RUTE.proiecte}`,
    )}
    <p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:13px;text-align:center;color:#616161;">${curat(ASOCIATIA.motto)}</p>`;

  return {
    subiect: titlu,
    html: pagina(titlu, corp, deschidere.split(".")[1]?.trim() || deschidere),
    text: `${prenume ? `Bună, ${prenume}` : "Bună"},

${deschidere}

${urmeaza}

Dacă este ceva urgent, ne poți suna la ${TELEFON_PRINCIPAL.afisat}.

${ADRESA_SITE}${d.voluntariat ? RUTE.casaTeona : RUTE.proiecte}

${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}
${ADRESE.casaTeona.nume}: ${ADRESE.casaTeona.strada}, ${ADRESE.casaTeona.oras} ${ADRESE.casaTeona.cod}
${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}

${ASOCIATIA.motto}`,
  };
}

/** Mesajul către asociație. Întoarce `false` dacă n-a plecat. */
export function trimiteMesajulDeContact(d: MesajDeContact): Promise<boolean> {
  return trimiteEmail({
    catre: EMAIL.contact,
    raspundeLa: d.email,
    ...compuneMesajulDeContact(d),
  });
}

/** Confirmarea către om. Dacă nu pleacă, mesajul lui a ajuns oricum. */
export async function trimiteConfirmareaDeContact(d: MesajDeContact) {
  const cifre = await cifreSite().catch(() => CIFRE_DIN_COD);
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compuneConfirmareaDeContact(d, cifre),
  });
}
