import {
  ADRESE,
  ASOCIATIA,
  CIFRE,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { DESTINATII } from "@/date/plati";
import { scrieSuma } from "@/lib/suma";
import { ADRESA_SITE } from "@/app/seo";
import { curat, trimiteEmail } from "./trimite";
import { CULORI, MIC, P, caseta, pagina } from "./plic";

/**
 * Mulțumirea pentru o donație.
 *
 * Nu e o chitanță fiscală și nu se numește așa. Caietul de sarcini spune
 * limpede că donația unei persoane fizice **nu** se deduce din impozitul pe
 * venit, deci nu există document fiscal de emis și nu-i promitem unul. Ce
 * conține e tot ce-i trebuie unui om ca dovadă: suma, data, destinația,
 * denumirea legală și CIF-ul asociației.
 *
 * Pentru firme e altceva — acolo e contract de sponsorizare, semnat, și se
 * ocupă asociația de el.
 *
 * Mesajul pleacă din webhook, adică abia după ce procesatorul a confirmat
 * plata. Niciodată de pe pagina de mulțumire: adresa aia o poate deschide
 * oricine, iar o mulțumire pentru bani care n-au intrat e mai rea decât
 * tăcerea.
 */

type Date = {
  email: string;
  prenume: string | null;
  nume: string | null;
  sumaBani: number;
  moneda: string;
  frecventa: string;
  destinatie: string;
  /** `true` la reînnoirea lunară: textul e altul, nu „bine ai venit”. */
  reinnoire?: boolean;
  /**
   * Ziua donației, dacă nu e azi.
   *
   * La card pleacă în aceeași clipă, deci ziua e azi. La un transfer bancar
   * nu: omul l-a făcut acum o săptămână, iar mulțumirea pleacă abia când
   * cineva l-a găsit în extras. Scrisă „azi", data din mesaj n-ar fi data
   * donației — nici pentru om, nici pentru contabilitatea asociației.
   */
  cand?: string;
  /**
   * `true` când donația e un transfer bancar găsit în extras.
   *
   * Mulțumirea pleacă atunci cu alte cuvinte: omul ne-a anunțat transferul cu
   * zile în urmă și a primit deja un mesaj care spunea „îl căutăm". Al doilea
   * mesaj trebuie să-i spună ce s-a schimbat — l-am găsit —, altfel pare că
   * i-am scris de două ori același lucru.
   */
  prinTransfer?: boolean;
};

function salut(d: Date): string {
  const prenume = (d.prenume ?? "").trim();
  // Caietul (2.2) cere exact asta: fără prenume completat, mesajul începe
  // cu „Bună,” — nu cu „Bună , ” sau cu numele de familie.
  return prenume ? `Bună, ${prenume}` : "Bună";
}

function sumaScrisa(d: Date): string {
  const valoare = d.sumaBani / 100;
  return d.moneda === "RON"
    ? scrieSuma(valoare)
    : `${valoare.toFixed(2)} ${d.moneda}`;
}

type Compus = { subiect: string; html: string; text: string };

export function construiesteMultumirea(d: Date): Compus {
  const lunar = d.frecventa === "lunar";
  const suma = sumaScrisa(d);
  // „Donație — tabere RESPIRO" → „Tabere RESPIRO": numele destinației se
  // scrie cu majusculă când stă singur într-un tabel, nu în mijlocul unei
  // propoziții de pe extrasul de cont.
  const brut = (DESTINATII[d.destinatie] ?? DESTINATII.oriunde).replace(
    /^Donație — /,
    "",
  );
  const unde = brut.charAt(0).toUpperCase() + brut.slice(1);
  const ziua = d.cand ? new Date(d.cand) : new Date();
  const azi = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    // Ziua scrisă de donator vine ca ISO la prânz UTC; citită în fusul
    // serverului, „1 martie" ar putea aluneca în 28 februarie.
    ...(d.cand ? { timeZone: "UTC" as const } : {}),
  }).format(Number.isNaN(ziua.getTime()) ? new Date() : ziua);

  const titlu = d.reinnoire
    ? "A mers. Mulțumim din nou."
    : d.prinTransfer
      ? "Am găsit transferul tău. Mulțumim!"
      : "Mulțumim.";

  /*
    Deschiderea.

    Un mesaj care începe cu „Donația ta de 150 lei a fost procesată" e un bon
    de casă. Omul tocmai a dat bani unei asociații de copii cu dizabilități,
    fără să fie obligat și fără să primească nimic înapoi — merită o
    propoziție scrisă pentru el, nu una generată.

    Ce nu scrie aici: cât costă o zi de tabără, câți copii ajung dintr-o sumă,
    la ce anume merg banii lui. Nu știm, iar o cifră inventată ca „să sune
    bine" costă exact lucrul pe care îl apără mesajul ăsta.
  */
  const deschidere = d.reinnoire
    ? `S-a reînnoit donația ta lunară de ${suma}. Nu trebuie să faci nimic — îți scriem doar ca să știi că a mers. Și ca să-ți mulțumim încă o dată: nu ne-am obișnuit.`
    : d.prinTransfer
      ? `Am găsit transferul tău de ${suma} în extrasul de cont. De acum e al copiilor.`
      : lunar
        ? `Ai ales să dai ${suma} în fiecare lună. Asta e lucrul cel mai greu de obținut și cel mai de folos: lunar înseamnă că putem spune „da" unei familii înainte să avem banii în cont.`
        : `Ai dat ${suma}. Nu te-a obligat nimeni și nu primești nimic înapoi — de asta contează.`;

  /** Al doilea paragraf: unde ajunge, în cuvinte pe care le putem susține. */
  const unde_ajunge = d.reinnoire
    ? ""
    : `Banii merg la copiii cu nevoi speciale, la cei care au trecut prin cancer și la familiile lor. Până acum am făcut ${CIFRE[0].valoare} de tabere, cu peste ${CIFRE[1].valoare.toLocaleString("ro-RO")} de participanți, iar la Casa Teona vin acum peste ${CIFRE[2].valoare} de copii. De azi ești și tu în socoteala asta.`;

  const randuri: Array<[string, string]> = [
    ["Suma", suma],
    ["Data", azi],
    ["Pentru", unde],
    [
      "Tip",
      lunar
        ? "Donație lunară"
        : d.prinTransfer
          ? "Transfer bancar"
          : "Donație unică",
    ],
  ];

  const textSimplu = [
    `${salut(d)},`,
    "",
    deschidere,
    ...(unde_ajunge ? ["", unde_ajunge] : []),
    "",
    ...randuri.map(([e, v]) => `${e}: ${v}`),
    "",
    lunar
      ? `Poți opri donația lunară oricând, fără motivare — scrie-ne la ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat}.`
      : `Dacă ai nevoie de o confirmare scrisă din partea asociației, scrie-ne la ${EMAIL.contact}.`,
    "",
    `Îți poți vedea oricând toate donațiile, fără parolă: ${ADRESA_SITE}/contul-meu`,
    "",
    `${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}`,
    `${ADRESE.casaTeona.strada}, ${ADRESE.casaTeona.oras} ${ADRESE.casaTeona.cod}`,
    `${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}`,
    "",
    ASOCIATIA.motto,
  ].join("\n");

  /*
    Mesajul folosește plicul comun, nu unul al lui.

    Avea aceeași structură scrisă încă o dată: bandă portocalie, antet, subsol
    cu datele de contact. Două plicuri înseamnă că o schimbare — un telefon
    nou, sigla în antet — se face într-unul și se uită în celălalt, iar
    donatorul primește alt mesaj decât restul lumii.
  */
  const corp = `
    <p style="${P}">${curat(salut(d))},</p>
    <p style="${P}font-size:18px;">${curat(deschidere)}</p>
    ${unde_ajunge ? `<p style="${P}">${curat(unde_ajunge)}</p>` : ""}
    ${caseta(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${randuri
        .map(
          ([eticheta, valoare], i) =>
            `<tr><td style="padding:${i === 0 ? "0" : "8px"} 12px 0 0;font-family:Arial,sans-serif;font-size:14px;color:${CULORI.moale};white-space:nowrap;">${curat(eticheta)}</td><td align="right" style="padding:${i === 0 ? "0" : "8px"} 0 0;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${CULORI.cerneala};">${curat(valoare)}</td></tr>`,
        )
        .join("")}</table>`,
    )}
    <p style="${MIC}">${
      lunar
        ? `Poți opri donația lunară oricând, fără motivare și fără explicații — scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:${CULORI.accent};">${EMAIL.contact}</a> sau sună la <strong>${curat(TELEFON_PRINCIPAL.afisat)}</strong>.`
        : `Dacă ai nevoie de o confirmare scrisă din partea asociației, scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:${CULORI.accent};">${EMAIL.contact}</a>.`
    }</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:6px 0 2px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${CULORI.accent}" style="border-radius:999px;">
        <a href="${ADRESA_SITE}${RUTE.proiecte}" style="display:inline-block;padding:13px 30px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">Vezi ce facem cu banii</a>
      </td></tr></table>
    </td></tr></table>
    <!--
      Contul donatorului.

      Linkul duce la pagina de intrare, nu la un cont deschis: un e-mail poate
      fi retrimis, tipărit sau ajuns la altcineva, iar un link care deschide
      direct istoricul donațiilor ar fi o cheie plimbată prin lume. Acolo cere
      singur un link de intrare, care merge o dată.
    -->
    <p style="${MIC}margin:16px 0 0;text-align:center;">
      Îți poți vedea oricând toate donațiile în
      <a href="${ADRESA_SITE}/contul-meu" style="color:${CULORI.accent};font-weight:bold;">contul tău</a>.
      Nu-ți trebuie parolă.
    </p>
    <!--
      Motto-ul, la sfârșit, nu în antet.

      În antet ar fi un slogan de firmă, lângă siglă. Jos de tot, după ce
      omul a citit tot, e felul în care se încheie o scrisoare — și e ce
      spune asociația despre ea însăși de dinainte să existe site-ul.
    -->
    <p style="margin:22px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-style:italic;text-align:center;color:${CULORI.accent};">${curat(ASOCIATIA.motto)}</p>`;

  const html = pagina(titlu, corp, deschidere);

  return {
    subiect: d.reinnoire
      ? `Donația ta lunară de ${suma} · ${ASOCIATIA.denumire}`
      : d.prinTransfer
        ? "Am găsit transferul tău. Mulțumim!"
        : "Mulțumim pentru donația ta",
    html,
    text: textSimplu,
  };
}

export async function trimiteMultumirea(d: Date): Promise<boolean> {
  const compus = construiesteMultumirea(d);
  return trimiteEmail({
    catre: d.email,
    subiect: compus.subiect,
    raspundeLa: EMAIL.contact,
    html: compus.html,
    text: compus.text,
  });
}
