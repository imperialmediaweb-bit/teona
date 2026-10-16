import { ADRESA_SITE } from "@/app/seo";
import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { DESTINATII } from "@/date/plati";
import { scrieSuma } from "@/lib/suma";
import { linkCardNou } from "@/lib/card-nou";
import { curat, trimiteEmail } from "./trimite";
import { CULORI, MIC, P, buton, caseta, pagina, paginaInterna } from "./plic";
import type { Compus } from "./campanie";

/**
 * Plata lunară n-a trecut: mesajul către donator și anunțul către asociație.
 *
 * **Ce greșesc aproape toate mesajele astea.** Sună a somație de la furnizorul
 * de curent: „plata dumneavoastră a eșuat”, cu roșu. Dar omul ăsta nu
 * datorează nimic nimănui — face o donație, din bunăvoință, iar cardul lui a
 * expirat. Dacă primește un mesaj care îl ceartă, nu-și schimbă cardul: se
 * supără și termină cu asociația.
 *
 * De aceea mesajul spune, în ordinea asta: nu s-a întâmplat nimic rău, nu ni
 * se datorează nimic, cardul probabil a expirat, și dacă vrei să continui
 * dureaza un minut. Iar la final, răspicat: **dacă nu mai vrei, nu trebuie să
 * faci nimic** — se oprește singură. Un om lăsat să plece frumos se întoarce
 * peste un an; unul fugărit, nu.
 *
 * **Pleacă o singură dată pe factură.** Stripe reîncearcă plata de câteva
 * ori; dacă am trimite la fiecare încercare, omul ar primi patru mesaje
 * despre același card. Al doilea nu se mai citește, al treilea se marchează
 * ca spam — și pierdem și donatorul, și adresa.
 */

export type PlataEsuata = {
  email: string;
  prenume: string | null;
  sumaBani: number;
  moneda: string;
  destinatie: string;
  /** Clientul Stripe, pentru linkul de schimbat cardul. */
  client: string | null;
  /** Ce a spus banca, dacă a spus ceva de înțeles. */
  motiv?: string | null;
};

function pentruCe(destinatie: string): string {
  const brut = (DESTINATII[destinatie] ?? DESTINATII.oriunde).replace(
    /^Donație — /,
    "",
  );
  return brut.charAt(0).toUpperCase() + brut.slice(1);
}

export function compunePlataEsuata(d: PlataEsuata): Compus {
  const suma = scrieSuma(d.sumaBani / 100, d.moneda);
  const salut = d.prenume?.trim() ? `Bună, ${d.prenume.trim()},` : "Bună,";
  const link = d.client ? linkCardNou(ADRESA_SITE, d.client) : null;
  const titlu = "Donația ta lunară n-a putut fi luată luna asta";

  const corp = `
    <p style="${P}">${curat(salut)}</p>
    <p style="${P}">Banca n-a lăsat să treacă donația ta lunară de ${curat(suma)} de luna asta. Se întâmplă des și aproape întotdeauna din același motiv: cardul a expirat sau a fost reemis.</p>
    <p style="${P}"><strong>Nu ne datorezi nimic</strong> și nu s-a pierdut nimic. Îți scriem doar fiindcă tu nu ai de unde să știi — pentru tine donația pare că merge mai departe.</p>
    ${caseta(
      `<p style="${MIC}margin-bottom:6px;"><strong style="color:${CULORI.cerneala};">Suma</strong> · ${curat(suma)} pe lună</p>
       <p style="${MIC}margin-bottom:0;"><strong style="color:${CULORI.cerneala};">Pentru</strong> · ${curat(pentruCe(d.destinatie))}</p>`,
    )}
    ${
      link
        ? `<p style="${P}">Dacă vrei să continue, schimbă cardul de aici. Durează un minut și nu trebuie să scrii nimic altceva:</p>
           ${buton("Schimbă cardul", link)}`
        : `<p style="${P}">Dacă vrei să continue, sună-ne la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong> sau scrie la <a href="mailto:${EMAIL.contact}" style="color:${CULORI.accent};">${EMAIL.contact}</a> și o pornim din nou împreună.</p>`
    }
    <p style="${P}"><strong>Dacă nu mai vrei să continui, nu trebuie să faci nimic.</strong> Donația se oprește singură și nu-ți mai scriem despre ea. Ne-ai ajutat deja, și pentru asta îți mulțumim.</p>
    <p style="${MIC}margin-bottom:0;">Dacă ai o întrebare, răspunde la mesajul ăsta sau sună la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong>. Îți răspunde un om.</p>`;

  return {
    subiect: `Cardul n-a mers la donația lunară de ${suma}`,
    html: pagina(
      titlu,
      corp,
      "Nu ne datorezi nimic — probabil a expirat cardul.",
    ),
    text: `${salut}

Banca n-a lăsat să treacă donația ta lunară de ${suma} de luna asta. Se întâmplă des și aproape întotdeauna din același motiv: cardul a expirat sau a fost reemis.

Nu ne datorezi nimic și nu s-a pierdut nimic. Îți scriem doar fiindcă tu nu ai de unde să știi.

Suma: ${suma} pe lună
Pentru: ${pentruCe(d.destinatie)}

${
  link
    ? `Dacă vrei să continue, schimbă cardul de aici:\n${link}`
    : `Dacă vrei să continue, sună la ${TELEFON_PRINCIPAL.afisat} sau scrie la ${EMAIL.contact}.`
}

Dacă nu mai vrei să continui, nu trebuie să faci nimic: donația se oprește singură. Ne-ai ajutat deja, și pentru asta îți mulțumim.

${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}
${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}

${ASOCIATIA.motto}`,
  };
}

export async function trimitePlataEsuata(d: PlataEsuata): Promise<boolean> {
  return trimiteEmail({
    catre: d.email,
    raspundeLa: EMAIL.contact,
    ...compunePlataEsuata(d),
  });
}

/**
 * Anunțul către asociație.
 *
 * **De ce și un mesaj intern.** Mesajul către donator rezolvă cazul în care
 * omul deschide e-mailul. Jumătate nu-l deschid. Pentru ei rămâne un singur
 * lucru care funcționează: un telefon de la cineva din asociație, în aceeași
 * săptămână — nu peste trei luni, când se vede în raport că „a scăzut ce vine
 * lunar".
 */
export function compuneAnuntPlataEsuata(d: PlataEsuata): Compus {
  const suma = scrieSuma(d.sumaBani / 100, d.moneda);
  const cine = [d.prenume?.trim(), d.email].filter(Boolean).join(" · ");

  const corp = `
    <p style="${P}">O donație lunară n-a putut fi luată. Donatorul a primit un mesaj cu linkul de schimbat cardul, dar jumătate nu-l deschid — un telefon în săptămâna asta recuperează donația.</p>
    ${caseta(
      `<p style="${MIC}margin-bottom:6px;"><strong style="color:${CULORI.cerneala};">Donator</strong> · ${curat(cine)}</p>
       <p style="${MIC}margin-bottom:6px;"><strong style="color:${CULORI.cerneala};">Suma</strong> · ${curat(suma)} pe lună</p>
       <p style="${MIC}margin-bottom:${d.motiv ? "6px" : "0"};"><strong style="color:${CULORI.cerneala};">Pentru</strong> · ${curat(pentruCe(d.destinatie))}</p>
       ${d.motiv ? `<p style="${MIC}margin-bottom:0;"><strong style="color:${CULORI.cerneala};">Ce a spus banca</strong> · ${curat(d.motiv)}</p>` : ""}`,
    )}
    <p style="${MIC}margin-bottom:0;">Stripe mai încearcă de câteva ori în zilele următoare. Dacă nici atunci nu trece, abonamentul se oprește singur la el.</p>`;

  return {
    subiect: `Plată lunară eșuată · ${suma} · ${d.email}`,
    html: paginaInterna(
      "O donație lunară n-a trecut",
      corp,
      `${suma} pe lună, de la ${d.email}`,
    ),
    text: `O donație lunară n-a putut fi luată.

Donator: ${cine}
Suma: ${suma} pe lună
Pentru: ${pentruCe(d.destinatie)}${d.motiv ? `\nCe a spus banca: ${d.motiv}` : ""}

Donatorul a primit un mesaj cu linkul de schimbat cardul. Un telefon în săptămâna asta recuperează donația.`,
  };
}

export async function anuntaPlataEsuata(d: PlataEsuata): Promise<boolean> {
  return trimiteEmail({
    catre: EMAIL.contact,
    raspundeLa: d.email,
    ...compuneAnuntPlataEsuata(d),
  });
}
