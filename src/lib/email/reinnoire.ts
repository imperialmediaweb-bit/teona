import { ADRESA_SITE } from "@/app/seo";
import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { DESTINATII } from "@/date/plati";
import { scrieSuma } from "@/lib/suma";
import { linkDeOprire } from "@/lib/oprire-lunara";
import { curat, trimiteEmail } from "./trimite";
import { CULORI, MIC, P, caseta, pagina } from "./plic";
import type { Compus } from "./campanie";

/**
 * Vestea de dinaintea reînnoirii lunare.
 *
 * **De ce o trimitem, deși ne costă donatori.** Un om care vede pe extras o
 * sumă pe care n-o mai ținea minte o contestă la bancă. Contestația costă
 * comision, strică rata de acceptare a cardurilor pentru toată lumea și
 * sfârșește oricum prin oprirea donației — dar cu un om supărat la capăt.
 * Vestea trimisă cu două zile înainte schimbă asta într-o hotărâre: ori nu
 * face nimic și donația merge mai departe, ori apasă un buton și se oprește
 * curat.
 *
 * **De ce butonul de oprire e în mesaj.** Dacă scrie doar „intră în contul
 * tău", drumul are patru pași și omul care voia să oprească nu-i face: sună
 * la bancă. Butonul duce la o pagină cu o singură întrebare și un buton —
 * nu oprește nimic prin simpla deschidere a linkului, fiindcă scanerele de
 * e-mail deschid din reflex toate adresele dintr-un mesaj.
 *
 * **Ce nu face mesajul ăsta:** nu cere nimic, nu propune o sumă mai mare, nu
 * strecoară un îndemn la donație. E o veste, nu o campanie. Un mesaj care se
 * preface că e o veste și cere ceva e felul în care oamenii se învață să nu
 * mai deschidă mesajele asociației.
 */

export type VesteReinnoire = {
  email: string;
  prenume: string | null;
  sumaBani: number;
  moneda: string;
  destinatie: string;
  /** Ziua în care se ia suma, ISO. */
  cand: string;
  /** Identificatorul abonamentului Stripe, pentru butonul de oprire. */
  abonament: string;
};

const ZI = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
});

function pentruCe(destinatie: string): string {
  const brut = (DESTINATII[destinatie] ?? DESTINATII.oriunde).replace(
    /^Donație — /,
    "",
  );
  return brut.charAt(0).toUpperCase() + brut.slice(1);
}

export function compuneVesteaReinnoirii(d: VesteReinnoire): Compus {
  const suma = scrieSuma(d.sumaBani / 100, d.moneda);
  const zi = new Date(d.cand);
  const ziua = Number.isNaN(zi.getTime()) ? null : ZI.format(zi);
  const titlu = "Peste două zile se reînnoiește donația ta lunară";
  const salut = d.prenume?.trim() ? `Bună, ${d.prenume.trim()},` : "Bună,";
  const opreste = linkDeOprire(ADRESA_SITE, d.abonament);

  const deschidere = ziua
    ? `Îți scriem ca să știi dinainte: pe ${ziua} se reînnoiește donația ta lunară de ${suma} către asociație.`
    : `Îți scriem ca să știi dinainte: peste două zile se reînnoiește donația ta lunară de ${suma} către asociație.`;

  const corp = `
    <p style="${P}">${curat(salut)}</p>
    <p style="${P}">${curat(deschidere)}</p>
    ${caseta(
      `<p style="${MIC}margin-bottom:6px;"><strong style="color:${CULORI.cerneala};">Suma</strong> · ${curat(suma)}</p>
       ${ziua ? `<p style="${MIC}margin-bottom:6px;"><strong style="color:${CULORI.cerneala};">Ziua</strong> · ${curat(ziua)}</p>` : ""}
       <p style="${MIC}margin-bottom:0;"><strong style="color:${CULORI.cerneala};">Pentru</strong> · ${curat(pentruCe(d.destinatie))}</p>`,
    )}
    <p style="${P}"><strong>Dacă rămâi alături de noi, nu trebuie să faci nimic.</strong> Suma se ia singură, ca până acum, iar noi îți mulțumim încă o dată.</p>
    <p style="${P}">Dacă vrei s-o oprești, o poți face chiar de aici. Fără motivare, fără să ne scrii și fără să ne suni.</p>
    ${
      opreste
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;"><tr><td align="center">
             <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="border-radius:999px;border:2px solid ${CULORI.cerneala};">
               <a href="${opreste}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:${CULORI.cerneala};text-decoration:none;border-radius:999px;">Oprește donația lunară</a>
             </td></tr></table>
           </td></tr></table>`
        : `<p style="${MIC}">Scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:${CULORI.accent};">${EMAIL.contact}</a> sau sună la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong> și o oprim pe loc.</p>`
    }
    <p style="${MIC}margin-bottom:0;">Îți poți schimba suma oricând: oprești donația de aici și pornești alta, cu cât vrei tu. Dacă ai o întrebare, răspunde la mesajul ăsta sau sună la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong>.</p>`;

  return {
    subiect: ziua
      ? `Donația ta lunară de ${suma} se reînnoiește pe ${ziua}`
      : `Donația ta lunară de ${suma} se reînnoiește peste două zile`,
    html: pagina(
      titlu,
      corp,
      "Dacă rămâi alături de noi, nu trebuie să faci nimic.",
    ),
    text: `${salut}

${deschidere}

Suma: ${suma}${ziua ? `\nZiua: ${ziua}` : ""}
Pentru: ${pentruCe(d.destinatie)}

Dacă rămâi alături de noi, nu trebuie să faci nimic. Suma se ia singură, ca până acum.

Dacă vrei s-o oprești, fără motivare:
${opreste ?? `scrie-ne la ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat}`}

Îți poți schimba suma oricând: oprești donația și pornești alta, cu cât vrei tu.

${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}
${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}

${ASOCIATIA.motto}`,
  };
}

export async function trimiteVesteaReinnoirii(
  d: VesteReinnoire,
): Promise<boolean> {
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compuneVesteaReinnoirii(d),
  });
}
