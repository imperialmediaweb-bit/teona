import { buton, caseta, MIC, P, pagina } from "./plic";
import { curat } from "./trimite";
import { TELEFON_PRINCIPAL } from "@/date/asociatie";

/**
 * „Avem nevoie de voluntari pe data X": e-mailul către un voluntar.
 *
 * Două butoane, fiecare duce la o pagină pe care omul confirmă cu încă o
 * apăsare. Răspunsul nu se scrie la deschiderea linkului: scanerele de e-mail
 * deschid toate adresele dintr-un mesaj, iar un „pot" scris de un robot ar
 * trimite asociația să conteze pe un om care nici n-a citit.
 */
export type ApelPentruEmail = {
  titlu: string;
  cand: string;
  unde: string | null;
  mesaj: string;
};

export function compuneApelul(
  a: ApelPentruEmail,
  prenume: string,
  linkPot: string,
  linkNuPot: string,
): { subiect: string; html: string; text: string } {
  const subiect = `Avem nevoie de voluntari: ${a.titlu}`;
  const paragrafe = a.mesaj.split(/(?:\r?\n){2,}/).map((x) => x.trim()).filter(Boolean);
  const corp = `
    <p style="${P}">${prenume ? `Bună, ${curat(prenume)},` : "Bună,"}</p>
    ${paragrafe.map((x) => `<p style="${P}">${curat(x).replace(/\n/g, "<br />")}</p>`).join("\n")}
    ${caseta(
      `<p style="${P}margin-bottom:6px;"><strong>${curat(a.titlu)}</strong></p>
       <p style="${MIC}margin-bottom:${a.unde ? "4px" : "0"};">Când: ${curat(a.cand)}</p>
       ${a.unde ? `<p style="${MIC}margin-bottom:0;">Unde: ${curat(a.unde)}</p>` : ""}`,
    )}
    <p style="${P}">Poți veni?</p>
    ${buton("Da, pot veni", linkPot)}
    <p style="${MIC}"><a href="${curat(linkNuPot)}" style="color:#616161;">Nu pot de data asta</a></p>
    <p style="${MIC}">Dacă ai o întrebare, sună-ne la ${curat(TELEFON_PRINCIPAL.afisat)}.</p>`;
  const text = [
    prenume ? `Bună, ${prenume},` : "Bună,",
    ...paragrafe,
    `${a.titlu}\nCând: ${a.cand}${a.unde ? `\nUnde: ${a.unde}` : ""}`,
    `Poți veni? Da: ${linkPot}`,
    `Nu pot de data asta: ${linkNuPot}`,
    `Dacă ai o întrebare, sună-ne la ${TELEFON_PRINCIPAL.afisat}.`,
  ].join("\n\n");
  return { subiect, html: pagina(subiect, corp, `${a.cand}. Poți veni?`), text };
}
