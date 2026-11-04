import { ADRESA_SITE } from "@/app/seo";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { curat, trimiteEmail } from "./trimite";
import { MIC, P, buton, pagina } from "./plic";
import type { Compus } from "./campanie";

/**
 * Bun venit pe lista de buletin.
 *
 * Adresa intră în MailerLite prin API, cu starea „activ”, iar pe calea asta
 * MailerLite nu trimite nimic. Până în noiembrie 2026 site-ul scria
 * „Verifică-ți emailul pentru a confirma abonarea” și nu pleca niciun e-mail:
 * omul aștepta o confirmare care nu venea, ca fundraiserul la proba ei.
 * Acum pleacă mesajul ăsta, iar pe site scrie că l-am trimis.
 *
 * Firmelor li se scrie cu „dumneavoastră”, ca pe paginile de sponsorizare.
 */
export function compuneBunVenit(d: { nume?: string | null; firma: boolean }): Compus {
  const salut = d.nume ? `Bună, ${curat(d.nume.split(/\s+/)[0])},` : d.firma ? "Bună ziua," : "Bună,";
  const titlu = "Te-ai abonat la veștile noastre";
  const corp = d.firma
    ? `
    <p style="${P}">${salut}</p>
    <p style="${P}">Ați intrat pe lista de vești pentru firme a ${curat(ASOCIATIA.denumire)}. Vă scriem rar: despre tabere, despre Casa Teona și despre cum poate o firmă să sprijine copiii, inclusiv prin direcționarea a 20% din impozitul pe profit.</p>
    ${buton("Vedeți cum poate ajuta o firmă", `${ADRESA_SITE}/directioneaza-20`)}
    <p style="${MIC}">Vă puteți dezabona oricând, din linkul de la sfârșitul fiecărui buletin. Dacă nu v-ați abonat dumneavoastră, ignorați mesajul.</p>`
    : `
    <p style="${P}">${salut}</p>
    <p style="${P}">Gata, ești pe lista noastră. Îți scriem rar: despre tabere, despre Casa Teona și despre ce poți face ca să ajuți.</p>
    ${buton("Vezi ce facem", `${ADRESA_SITE}/despre-noi`)}
    <p style="${MIC}">Te poți dezabona oricând, din linkul de la sfârșitul fiecărui buletin. Dacă nu te-ai abonat tu, ignoră mesajul.</p>`;
  return {
    subiect: d.firma ? "V-ați abonat la veștile noastre" : titlu,
    html: pagina(titlu, corp, d.firma ? "Lista de vești pentru firme." : "Îți scriem rar, despre tabere și Casa Teona."),
    text: `${d.firma ? "Ați intrat pe lista de vești pentru firme" : "Gata, ești pe lista noastră"} a ${ASOCIATIA.denumire}. Dezabonarea se face din linkul de la sfârșitul fiecărui buletin.\n\n${ADRESA_SITE}`,
  };
}

export async function trimiteBunVenit(d: {
  email: string;
  nume?: string | null;
  firma: boolean;
}): Promise<boolean> {
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compuneBunVenit(d),
  });
}
