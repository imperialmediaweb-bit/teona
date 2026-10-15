import { ADRESA_SITE } from "@/app/seo";
import { ASOCIATIA, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { DESTINATII } from "@/date/plati";
import { scrieSuma } from "@/lib/suma";
import { curat, tabel, trimiteEmail } from "./trimite";
import { MIC, P, buton, caseta, paginaInterna, pagina } from "./plic";
import type { Compus } from "./campanie";

/**
 * Transferul bancar anunțat de donator: cele două mesaje din jurul lui.
 *
 * Transferul nu trece prin site, deci site-ul nu poate ști că s-a făcut —
 * banii apar în extrasul de cont, pe care îl citește un om. Între gestul
 * donatorului și clipa în care cineva din asociație îl găsește în extras trec
 * zile. Fără mesajele astea, zilele alea sunt tăcere: omul a dat bani și n-a
 * primit nicio urmă scrisă, iar asociația află că are ceva de căutat doar
 * dacă deschide panoul.
 *
 * **Confirmarea nu e o chitanță și nu se preface că este.** Scrie limpede ce
 * s-a întâmplat: am notat ce ai spus, căutăm în extras, îți scriem când o
 * găsim. O mulțumire trimisă acum, pentru bani pe care nu i-a văzut nimeni,
 * ar fi exact greșeala de care se feresc toate interogările care cer
 * `stare = 'platita'`.
 */

type Anuntat = {
  nume: string;
  email?: string;
  telefon?: string;
  sumaBani: number;
  destinatie: string;
  /** Ziua scrisă de donator, în format ISO. */
  data: string;
  observatii?: string;
};

function ziua(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function pentruCe(destinatie: string): string {
  const brut = (DESTINATII[destinatie] ?? DESTINATII.oriunde).replace(
    /^Donație — /,
    "",
  );
  return brut.charAt(0).toUpperCase() + brut.slice(1);
}

/** Către donator: am notat, urmează controlul în extras. */
export function compuneTransferAnuntat(d: Anuntat): Compus {
  const suma = scrieSuma(d.sumaBani / 100);
  const titlu = "Am notat transferul tău";
  const campuri = tabel([
    ["Nume pe transfer", d.nume],
    ["Suma", suma],
    ["Ziua transferului", ziua(d.data)],
    ["Pentru", pentruCe(d.destinatie)],
  ]);

  const corp = `
    <p style="${P}">Bună, ${curat(d.nume.split(" ")[0])},</p>
    <p style="${P}">Ne-ai spus pe site că ai făcut un transfer către asociație. Am notat ce ai scris și îl căutăm în extrasul de cont — <strong>îți scriem imediat ce îl găsim</strong>.</p>
    ${caseta(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${campuri.html}</table>`,
    )}
    <p style="${P}">De ce durează: transferul bancar nu trece prin site, deci nu-l vedem în clipa în care îl faci. Apare în extrasul nostru de cont, pe care îl citește un om — de obicei în câteva zile lucrătoare.</p>
    <p style="${MIC}">Până atunci, mesajul ăsta nu e o chitanță: e dovada că ne-ai anunțat. Dacă ai nevoie de o confirmare scrisă din partea asociației, scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:#b82b09;">${EMAIL.contact}</a> sau sună la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong>.</p>
    ${buton("Vezi ce facem cu banii", `${ADRESA_SITE}${RUTE.proiecte}`)}`;

  return {
    subiect: titlu,
    html: pagina(
      titlu,
      corp,
      "Îl căutăm în extrasul de cont și îți scriem când îl găsim.",
    ),
    text: `Bună, ${d.nume},

Ne-ai spus pe site că ai făcut un transfer către asociație. Am notat ce ai scris și îl căutăm în extrasul de cont — îți scriem imediat ce îl găsim.

${campuri.text}

Transferul bancar nu trece prin site, deci nu-l vedem în clipa în care îl faci: apare în extrasul nostru de cont, pe care îl citește un om, de obicei în câteva zile lucrătoare.

Mesajul ăsta nu e o chitanță, e dovada că ne-ai anunțat. Dacă ai nevoie de o confirmare scrisă, scrie-ne la ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat}.

${ASOCIATIA.denumire}
${ASOCIATIA.motto}`,
  };
}

/** Către asociație: un transfer de căutat în extras. */
export function compuneAnuntTransfer(d: Anuntat): Compus {
  const suma = scrieSuma(d.sumaBani / 100);
  const titlu = "Un transfer de căutat în extras";
  const campuri = tabel([
    ["Nume pe transfer", d.nume],
    ["Suma", suma],
    ["Ziua transferului", ziua(d.data)],
    ["Pentru", pentruCe(d.destinatie)],
    ["E-mail", d.email ?? ""],
    ["Telefon", d.telefon ?? ""],
    ["Ce a scris", d.observatii ?? ""],
  ]);

  const corp = `
    <p style="${P}">Cineva a bifat pe site că a făcut un transfer bancar. <strong>Nu se numără nicăieri</strong> până nu-l găsește cineva în extrasul de cont și apasă „Am găsit-o în extras”.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${campuri.html}</table>
    ${buton("Deschide transferurile anunțate", `${ADRESA_SITE}/admin/donatii`)}
    <p style="${MIC}margin-bottom:0;">${d.email ? "Omul a primit confirmarea că i-am notat anunțul. Când apăsați „Am găsit-o în extras”, primește și mulțumirea." : "Omul n-a lăsat o adresă de e-mail, deci n-a primit nicio confirmare și nu va primi nici mulțumirea."}</p>`;

  return {
    subiect: `${titlu} — ${d.nume}, ${suma}`,
    html: paginaInterna(titlu, corp, `${d.nume} · ${suma} · ${ziua(d.data)}`),
    text: `Cineva a bifat pe site că a făcut un transfer bancar. Nu se numără nicăieri până nu-l găsiți în extrasul de cont.

${campuri.text}

${ADRESA_SITE}/admin/donatii`,
  };
}

/**
 * Amândouă, în ordinea care contează.
 *
 * Întâi cel către asociație: dacă el nu pleacă, transferul rămâne doar în
 * panou, iar panoul se deschide când se deschide. Cel către donator e o
 * curtoazie; cel către asociație e lucrul de făcut.
 */
export async function anuntaTransferulPeEmail(d: Anuntat): Promise<void> {
  await trimiteEmail({
    catre: EMAIL.contact,
    raspundeLa: d.email,
    ...compuneAnuntTransfer(d),
  });

  if (d.email) {
    await trimiteEmail({
      catre: d.email,
      raspundeLa: EMAIL.contact,
      ...compuneTransferAnuntat(d),
    });
  }
}
