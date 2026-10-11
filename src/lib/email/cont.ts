import { ADRESA_SITE } from "@/app/seo";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { curat, trimiteEmail } from "./trimite";
import { MIC, P, buton, pagina } from "./plic";
import type { Compus } from "./campanie";

/**
 * Linkul cu care donatorul intră în contul lui.
 *
 * E singurul lucru care ține loc de parolă, deci e scris ca atare: cât ține,
 * că merge o dată, și ce să facă dacă nu el l-a cerut. Un link de intrare
 * fără explicațiile astea arată exact ca o înșelătorie — și pe bună dreptate,
 * fiindcă așa arată și cele adevărate.
 */
export function compuneIntrare(d: {
  email: string;
  jeton: string;
  numeMic?: string | null;
}): Compus {
  const adresa = `${ADRESA_SITE}/contul-meu/intra?jeton=${encodeURIComponent(d.jeton)}`;
  const titlu = "Intră în contul tău";
  const salut = d.numeMic ? `Bună, ${curat(d.numeMic)},` : "Bună,";

  const corp = `
    <p style="${P}">${salut}</p>
    <p style="${P}">Apasă butonul ca să-ți vezi donațiile. Nu-ți trebuie parolă.</p>
    ${buton("Vezi-mi donațiile", adresa)}
    <p style="${MIC}word-break:break-all;">${curat(adresa)}</p>
    <p style="${MIC}">Linkul merge <strong>o singură dată</strong> și expiră în 20 de minute. Dacă nu l-ai cerut tu, nu trebuie să faci nimic: fără el nu intră nimeni, iar noi nu-ți trimitem altul până nu-l ceri.</p>`;

  return {
    subiect: titlu,
    html: pagina(titlu, corp),
    text: `${d.numeMic ? `Bună, ${d.numeMic}` : "Bună"},

Deschide linkul ca să-ți vezi donațiile. Nu-ți trebuie parolă:
${adresa}

Linkul merge o singură dată și expiră în 20 de minute. Dacă nu l-ai cerut tu, nu trebuie să faci nimic.

${ASOCIATIA.denumire}`,
  };
}

export async function trimiteIntrarea(d: {
  email: string;
  jeton: string;
  numeMic?: string | null;
}): Promise<boolean> {
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compuneIntrare(d),
  });
}
