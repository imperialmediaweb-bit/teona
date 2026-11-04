import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { DESTINATII } from "@/date/plati";
import { scrieSuma } from "@/lib/suma";
import { ADRESA_SITE } from "@/app/seo";
import { curat, tabel, trimiteEmail } from "./trimite";
import { CULORI, MIC, P, buton, caseta, pagina, paginaInterna } from "./plic";

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
  /** Numai în anunțul către asociație: a plecat mulțumirea către donator? */
  multumireTrimisa?: boolean;
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

/**
 * Linkul spre cont, cu adresa deja completată. Nu deschide contul: acolo omul
 * apasă „Trimite-mi linkul” și primește un link de intrare care merge o dată.
 * Un link care ar deschide direct istoricul donațiilor ar fi o cheie plimbată
 * prin lume odată cu e-mailul (retrimis, tipărit, ajuns la altcineva).
 */
function linkCont(email: string): string {
  // După „#”, nu după „?”: fragmentul nu pleacă la server, deci adresa nu
  // ajunge nici în jurnalul HTTP, nici în Google Analytics.
  return `${ADRESA_SITE}/contul-meu#email=${encodeURIComponent(email)}`;
}

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
    ? "Donația ta lunară a fost reînnoită"
    : d.prinTransfer
      ? "Am confirmat transferul tău"
      : "Mulțumim pentru donația ta";

  /*
    Textul e același de fiecare dată, scris sobru.

    Suma nu apare în deschidere, ci în tabel: e locul în care o caută omul,
    iar o mulțumire care începe cu cifra împarte donatorii, fără să vrea, în
    mari și mici.

    Ce nu scrie nicăieri: cât costă o zi de tabără, câți copii ajung dintr-o
    sumă, la ce anume au mers banii lui. Nu știm.
  */
  const deschidere = d.reinnoire
    ? "Donația ta lunară a fost reînnoită. Nu trebuie să faci nimic — îți scriem doar pentru confirmare."
    : d.prinTransfer
      ? "Am identificat transferul tău în extrasul de cont și l-am înregistrat ca donație. Îți mulțumim."
      : lunar
        ? "Îți mulțumim pentru donația ta lunară. Prima plată a fost înregistrată, iar următoarea se face automat, în aceeași zi a lunii viitoare."
        : "Îți mulțumim pentru donația ta. Am înregistrat-o și o folosim pentru copiii și familiile pe care le sprijinim.";

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
    "",
    ...randuri.map(([e, v]) => `${e}: ${v}`),
    "",
    lunar
      ? `Poți opri donația lunară oricând, singur, din contul tău (${linkCont(d.email)}). Sau scrie-ne la ${EMAIL.contact}.`
      : `Dacă ai nevoie de o confirmare scrisă din partea asociației, scrie-ne la ${EMAIL.contact}.`,
    "",
    `Contul tău, cu toate donațiile și insignele, fără parolă: ${linkCont(d.email)}`,
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
    <p style="${P}">${curat(deschidere)}</p>
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
        ? `Poți opri donația lunară oricând, singur, din <a href="${linkCont(d.email)}" style="color:${CULORI.accent};">contul tău</a>, fără motivare. Sau scrie-ne la <a href="mailto:${EMAIL.contact}" style="color:${CULORI.accent};">${EMAIL.contact}</a>.`
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
    <div style="margin:20px 0 0;text-align:center;">${buton("Vezi donațiile tale", linkCont(d.email))}</div>
    <p style="${MIC}margin:8px 0 0;text-align:center;">
      În contul tău vezi toate donațiile și insignele, și poți opri o donație lunară. Nu-ți trebuie parolă: primești pe e-mail un link de intrare.
    </p>
    <!--
      Motto-ul, la sfârșit, nu în antet.

      În antet ar fi un slogan de firmă, lângă siglă. Jos de tot, după ce
      omul a citit tot, e felul în care se încheie o scrisoare — și e ce
      spune asociația despre ea însăși de dinainte să existe site-ul.
    -->
    <p style="margin:22px 0 0;font-family:Arial,sans-serif;font-size:13px;text-align:center;color:${CULORI.moale};">${curat(ASOCIATIA.motto)}</p>`;

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

/**
 * Către asociație: a intrat o donație cu cardul.
 *
 * Până în noiembrie 2026 nu pleca nimic către asociație la o plată cu cardul:
 * donația apărea doar în panou, iar panoul se deschide când se deschide. La
 * o donație de probă făcută de fundraiser, „n-am primit nimic” era adevărat
 * și pe e-mail. Reînnoirile lunare nu trec pe aici: ar umple căsuța cu același
 * om în fiecare lună; se văd în panou, la „cât vine lunar”.
 */
export function compuneAnuntDonatie(d: Date): Compus {
  const suma = sumaScrisa(d);
  const nume = [d.prenume, d.nume].filter(Boolean).join(" ") || d.email;
  const titlu = "Donație nouă";
  const lunar = d.frecventa === "lunar";
  const campuri = tabel([
    ["Cine", nume],
    ["Suma", lunar ? `${suma} pe lună` : suma],
    ["Pentru", Object.hasOwn(DESTINATII, d.destinatie) ? DESTINATII[d.destinatie] : d.destinatie],
    ["E-mail", d.email],
  ]);
  const corp = `
    <p style="${P}">A intrat o donație pe site. E deja în panou, ca plătită. ${d.multumireTrimisa === false ? "<strong>Mulțumirea către donator n-a putut pleca</strong>; scrieți-i voi." : "I-am trimis donatorului mulțumirea."}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${campuri.html}</table>
    ${buton("Deschide donațiile", `${ADRESA_SITE}/admin/donatii`)}`;
  return {
    subiect: `${titlu} — ${nume}, ${lunar ? `${suma}/lună` : suma}`,
    html: paginaInterna(titlu, corp, `${nume} · ${suma}`),
    text: `A intrat o donație pe site.\n\n${campuri.text}\n\n${ADRESA_SITE}/admin/donatii`,
  };
}

export async function anuntaDonatia(d: Date): Promise<boolean> {
  return trimiteEmail({
    catre: EMAIL.contact,
    raspundeLa: d.email,
    ...compuneAnuntDonatie(d),
  });
}
