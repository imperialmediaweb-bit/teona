import { ADRESA_SITE } from "@/app/seo";
import {
  ADRESE,
  ASOCIATIA,
  CONTACT_FIRME,
  EMAIL,
  JURIDIC,
  LINKURI_EXTERNE,
  RETELE_ASOCIATIE,
  RUTE,
  SMS,
  TELEFOANE,
} from "@/date/asociatie";
import { CIFRE_DIN_COD, type Cifra } from "@/lib/cifre";

/**
 * Cele două șabloane de campanie pentru MailerLite.
 *
 * **De ce două și nu unul.** Un om și o firmă nu pot da în același fel. Omul
 * donează cu cardul, prin SMS sau prin transfer, își poate face o campanie de
 * ziua lui, poate redirecționa 3,5% din impozitul pe venit. Firma semnează un
 * contract de sponsorizare și scade suma din impozitul pe profit. Un singur
 * e-mail cu toate butoanele la grămadă n-ar vorbi cu niciunul dintre ei: cel
 * mai bun buton e cel pe care omul care citește îl poate apăsa chiar acum.
 *
 * **Ce se schimbă la fiecare campanie și ce nu.** Se schimbă titlul,
 * paragrafele și poza — atât. Toate butoanele, casetele, IBAN-urile, datele
 * de contact și subsolul legal sunt deja aici, scrise o dată și verificate o
 * dată. Așa o campanie trimisă în grabă, joi seara, are aceleași căi de
 * donație ca una pregătită o săptămână — iar un IBAN greșit nu se poate
 * strecura prin copy-paste.
 *
 * **Regulile de HTML pentru e-mail** sunt cele din `sablon.ts`: tabele pentru
 * așezare, stiluri scrise în linie, lățime 600 px, butoane făcute din celule
 * de tabel. Outlook randează cu motorul Word, Gmail taie `<style>` din
 * `<head>`, iar `flex` și `grid` nu există nicăieri.
 *
 * **Linkurile poartă etichete UTM.** Google Analytics le citește singur, deci
 * se vede în rapoarte ce a adus buletinul — fără nicio altă schimbare pe site.
 */

const PORTOCALIU = "#b82b09";
const TURCOAZ = "#1e454a";
const CERNEALA = "#232323";
const MOALE = "#616161";
const CERNEALA_MAI_DESCHIS = "#3a3a3a";
const HARTIE_CALDA = "#f9f5f2";
const UMBRA = "#efe7e1";
const FONT = "Arial,Helvetica,sans-serif";

/** Sigla, ca fișier servit de site: într-un e-mail, adresele trebuie să fie întregi. */
const SIGLA = `${ADRESA_SITE}/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1.png`;

/**
 * Poza de deasupra, când nu s-a pus alta.
 *
 * Un e-mail fără nicio imagine arată a notificare de bancă. E o fotografie
 * adevărată de la o tabără RESPIRO, nu imaginea de distribuire a site-ului:
 * aceea are sigla și motto-ul pe ea, care apar deja în antet, iar un e-mail
 * care își repetă antetul în poză arată a șablon.
 *
 * Fișierul e o copie micșorată la 1200 px și 194 kB. Originalul are 811 kB,
 * iar un e-mail se deschide des pe telefon, pe date mobile: poza e singurul
 * lucru din mesaj care poate cântări cât tot restul la un loc.
 */
/** Pozele fixe ale cardurilor de jos, micșorate pentru e-mail. */
const POZE = {
  campanii: {
    adresa: `${ADRESA_SITE}/poze/email/campanii.jpg`,
    alt: "Copii în echipament de cățărare, la o tabără Teona Ariana",
  },
  tabere: {
    adresa: `${ADRESA_SITE}/poze/email/tabere.jpg`,
    alt: "O fată zâmbind pe iarbă, la o tabără RESPIRO",
  },
} as const;

const POZA_IMPLICITA = {
  adresa: `${ADRESA_SITE}/poze/email/tabara-respiro.jpg`,
  alt: "Copiii, părinții și voluntarii Asociației Teona Ariana, la o tabără RESPIRO",
};

export type FelSablon = "persoane" | "firme";

export const FELURI_SABLON = [
  {
    id: "persoane",
    eticheta: "Persoane fizice",
    descriere:
      "Pentru lista de donatori și prieteni ai asociației: card, lunar, 3,5%, SMS, transfer, ziua ta, voluntariat.",
  },
  {
    id: "firme",
    eticheta: "Firme",
    descriere:
      "Pentru lista de firme: calculatorul, contractul de sponsorizare, Declarația 177 și un om cu care să vorbească.",
  },
] as const;

export function esteFelSablon(x: unknown): x is FelSablon {
  return x === "persoane" || x === "firme";
}

/**
 * Ce e în fiecare șablon, pe scurt, pentru panou.
 *
 * Nu e documentație de dragul documentației: e lista pe care o citește cineva
 * înainte să aleagă șablonul, ca să știe ce butoane pleacă odată cu el. Scrisă
 * lângă șabloane, nu în pagină, ca să se schimbe în același loc cu ele.
 */
export type Bloc = { id: string; eticheta: string };

/**
 * Blocurile fiecărui șablon, în ordinea din e-mail. Fundraiserul bifează în
 * panou care apar (noiembrie 2026: „să aleg ce apare în mailuri, acum sunt
 * multe presetate”). Subsolul legal, cu dezabonarea, nu e în listă: apare
 * mereu, așa cer legea și MailerLite.
 */
export const BLOCURI: Record<FelSablon, readonly Bloc[]> = {
  persoane: [
    { id: "donez", eticheta: "Butonul mare „Donez acum”" },
    { id: "sume", eticheta: "Butoanele 20 / 50 / 100 lei" },
    { id: "lunar", eticheta: "Caseta „Donez lunar”" },
    { id: "campanii", eticheta: "Card cu poză: campaniile deschise" },
    { id: "tabere", eticheta: "Card cu poză: taberele RESPIRO" },
    { id: "redirectionare", eticheta: "Redirecționează 3,5%" },
    { id: "sms", eticheta: "SMS cu SUSTIN la 8835" },
    { id: "ziuata", eticheta: "Campanie de ziua ta" },
    { id: "voluntar", eticheta: "Vino voluntar" },
    { id: "galantom", eticheta: "Galantom" },
    { id: "transfer", eticheta: "Transfer bancar, cu conturile" },
    { id: "distribuie", eticheta: "Distribuie pe Facebook și WhatsApp" },
    { id: "cifre", eticheta: "Banda cu cifrele asociației" },
  ],
  firme: [
    { id: "sponsorizez", eticheta: "Butonul mare „Vreau să sponsorizez”" },
    { id: "regula", eticheta: "Caseta cu 20% / 0,75% și calculatorul" },
    { id: "pasi", eticheta: "Cei trei pași" },
    { id: "documente", eticheta: "Contractul și Declarația 177" },
    { id: "primeste", eticheta: "Ce primește firma" },
    { id: "tabere", eticheta: "Card cu poză: taberele RESPIRO" },
    { id: "campanii", eticheta: "Card cu poză: campaniile deschise" },
    { id: "contact", eticheta: "„Hai să vorbim”: telefonul și e-mailul" },
    { id: "cifre", eticheta: "Banda cu cifrele asociației" },
  ],
};

/** Ce e în fiecare șablon, pe scurt, pentru panou. */
export const CUPRINS: Record<FelSablon, readonly string[]> = {
  persoane: BLOCURI.persoane.map((b) => b.eticheta),
  firme: BLOCURI.firme.map((b) => b.eticheta),
};

/** Blocul apare? Fără alegere făcută (șablonul gol, ciornele vechi), apar toate. */
function are(c: ContinutCampanie, id: string): boolean {
  return !c.blocuri || c.blocuri.includes(id);
}

export type ContinutCampanie = {
  titlu: string;
  /** Paragrafele, în ordine. Text simplu — nu se interpretează ca marcaj. */
  paragrafe: string[];
  poza?: { adresa: string; alt: string } | null;
  /**
   * Slugul campaniei de pe site, dacă e una. Intră în etichetele UTM și în
   * linkul de donație, ca să se vadă în panou cât a strâns campania asta.
   */
  campanie?: string | null;
  /** Adresa de dezabonare. MailerLite o înlocuiește cu a lui. */
  dezabonare?: string;
  /** Blocurile bifate în panou (`BLOCURI`). Lipsă = toate. */
  blocuri?: readonly string[];
};

function curat(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Un link către site, cu etichetele de urmărire lipite.
 *
 * `utm_source`, `utm_medium` și `utm_campaign` sunt citite din oficiu de
 * Google Analytics, care e deja pe site. Fără ele, toate vizitele venite din
 * buletin apar ca „direct" și nu se poate ști dacă e-mailul a adus ceva.
 */
function link(
  cale: string,
  fel: FelSablon,
  campanie: string | null | undefined,
  parametri: Record<string, string> = {},
): string {
  const adresa = new URL(cale, ADRESA_SITE);
  for (const [cheie, valoare] of Object.entries(parametri)) {
    adresa.searchParams.set(cheie, valoare);
  }
  adresa.searchParams.set("utm_source", "mailerlite");
  adresa.searchParams.set("utm_medium", "email");
  adresa.searchParams.set(
    "utm_campaign",
    campanie || (fel === "firme" ? "buletin-firme" : "buletin-persoane"),
  );
  return adresa.toString();
}

/** Buton plin, pentru acțiunea principală. */
function butonPlin(eticheta: string, adresa: string, culoare = PORTOCALIU) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td align="center" bgcolor="${culoare}" style="border-radius:999px;"><a href="${curat(adresa)}" style="display:inline-block;padding:16px 38px;font-family:${FONT};font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${curat(eticheta)}</a></td></tr></table>`;
}

/** Buton cu contur, pentru alegerile de pe al doilea rând. */
function butonGol(eticheta: string, adresa: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 4px 8px;"><tr><td align="center" bgcolor="#ffffff" style="border:2px solid ${PORTOCALIU};border-radius:999px;"><a href="${curat(adresa)}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:16px;font-weight:bold;color:${PORTOCALIU};text-decoration:none;border-radius:999px;">${curat(eticheta)}</a></td></tr></table>`;
}

/** O secțiune cu titlu mic, deasupra unui grup de butoane. */
function titluMic(text: string) {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:13px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${MOALE};">${curat(text)}</p>`;
}

/** O cutie cu chenar, pentru o listă care trebuie să se citească ca un bloc. */
function cutie(continut: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid ${UMBRA};border-radius:14px;"><tr><td style="padding:20px 20px 8px;">${continut}</td></tr></table>`;
}

function caseta(continut: string, fundal = HARTIE_CALDA) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;background-color:${fundal};border-radius:14px;"><tr><td style="padding:22px 24px;">${continut}</td></tr></table>`;
}

/** Un rând dintr-o listă de căi de ajutor: ce e, într-o frază, plus un link. */
function rand(
  titlu: string,
  text: string,
  link?: { eticheta: string; adresa: string },
) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;"><tr>
    <td style="padding:0 0 14px;border-bottom:1px solid ${UMBRA};">
      <p style="margin:0 0 4px;font-family:${FONT};font-size:16px;font-weight:bold;color:${CERNEALA};">${curat(titlu)}</p>
      <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${MOALE};">${curat(text)}${
        link
          ? ` <a href="${curat(link.adresa)}" style="color:${PORTOCALIU};font-weight:bold;text-decoration:underline;">${curat(link.eticheta)}</a>`
          : ""
      }</p>
    </td></tr></table>`;
}

/**
 * Un card cu fotografie: poză lată, titlu, o frază, buton.
 *
 * Poza stă deasupra, nu lângă text. Alăturate, pe un telefon de 360 px
 * rămâne fiecăreia câte un deget de lățime și nu se mai înțelege nici poza,
 * nici fraza. Una peste alta arată la fel de bine la 600 px și la 320.
 */
function cardFoto(d: {
  poza: string;
  alt: string;
  titlu: string;
  text: string;
  eticheta: string;
  adresa: string;
}): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background-color:${HARTIE_CALDA};border-radius:14px;overflow:hidden;">
    <tr><td style="font-size:0;line-height:0;">
      <img src="${curat(d.poza)}" alt="${curat(d.alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;" />
    </td></tr>
    <tr><td style="padding:18px 20px 20px;">
      <p style="margin:0 0 4px;font-family:${FONT};font-size:18px;font-weight:bold;color:${CERNEALA};">${curat(d.titlu)}</p>
      <p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${MOALE};">${curat(d.text)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#ffffff" style="border:2px solid ${PORTOCALIU};border-radius:999px;"><a href="${curat(d.adresa)}" style="display:inline-block;padding:10px 22px;font-family:${FONT};font-size:15px;font-weight:bold;color:${PORTOCALIU};text-decoration:none;border-radius:999px;">${curat(d.eticheta)}</a></td></tr></table>
    </td></tr>
  </table>`;
}

/** Pașii, ca tabel: `<ol>` iese strâmb în Outlook. */
function pasi(lista: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${lista
    .map(
      (pas, i) => `<tr>
        <td width="30" valign="top" style="padding:0 0 10px;font-family:${FONT};font-size:16px;font-weight:bold;color:${PORTOCALIU};">${i + 1}.</td>
        <td valign="top" style="padding:0 0 10px;font-family:${FONT};font-size:15px;line-height:1.6;color:${CERNEALA};">${curat(pas)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

/* ── Partea de jos, aceeași la amândouă ──────────────────────────────── */

function subsol(continut: ContinutCampanie) {
  // MailerLite cere un link de dezabonare în orice HTML propriu. `{$unsubscribe}`
  // e variabila lui; o lăsăm ca atare dacă nu primim alta.
  const dezabonare = continut.dezabonare ?? "{$unsubscribe}";
  const telefoane = TELEFOANE.map((t) => t.afisat).join(" · ");

  /*
    Subsolul e o bandă închisă la culoare, nu text mărunt pe alb.

    Două motive. Unul: închide mesajul — ochiul vede unde se termină e-mailul
    și nu mai caută. Celălalt: rețelele stau aici, iar pe fundal alb trei
    linkuri portocalii arătau a notă de subsol. Pe închis arată a invitație.
  */
  const retele = RETELE_ASOCIATIE.map(
    (r) =>
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 4px 8px;"><tr><td align="center" bgcolor="${CERNEALA_MAI_DESCHIS}" style="border-radius:999px;border:1px solid rgba(255,255,255,0.22);"><a href="${r.url}" style="display:inline-block;padding:10px 20px;font-family:${FONT};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${r.nume}</a></td></tr></table>`,
  ).join("");

  return `
    <tr><td bgcolor="${CERNEALA}" style="background-color:${CERNEALA};padding:30px 32px 10px;" align="center">
      <p style="margin:0 0 14px;font-family:${FONT};font-size:13px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Ne găsești și aici</p>
      ${retele}
    </td></tr>
    <tr><td bgcolor="${CERNEALA}" style="background-color:${CERNEALA};padding:8px 32px 30px;">
      <div style="height:1px;background-color:rgba(255,255,255,0.14);font-size:0;line-height:0;margin-bottom:20px;">&nbsp;</div>
      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);">
        <strong style="color:#ffffff;">${curat(ASOCIATIA.denumireLegala)}</strong> · CIF ${curat(ASOCIATIA.cif)} · ${curat(JURIDIC.registru)}
      </p>
      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);">
        ${curat(ADRESE.casaTeona.strada)}, ${curat(ADRESE.casaTeona.oras)} ${curat(ADRESE.casaTeona.cod)}
      </p>
      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);">
        ${curat(telefoane)} · ${curat(EMAIL.contact)}
      </p>
      <p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:rgba(255,255,255,0.55);">
        Primești mesajul ăsta pentru că ți-ai dat acordul.
        <a href="${dezabonare}" style="color:rgba(255,255,255,0.85);text-decoration:underline;">Dezabonează-te</a> oricând, dintr-un clic.
      </p>
    </td></tr>`;
}

/**
 * Cifrele asociației, într-o bandă.
 *
 * Patru numere verificate, aceleași care sunt pe site. Într-un e-mail de
 * strângere de fonduri ele fac munca pe care n-o poate face textul: arată că
 * în spatele cererii stau unsprezece ani de tabere, nu o idee bună.
 */
function cifre(lista: ReadonlyArray<Cifra>): string {
  // „1.500+", nu „1500+": mia se desparte cu punct în română.
  const mii = new Intl.NumberFormat("ro-RO");
  const celule = lista.map(
    (c) =>
      `<td align="center" width="25%" style="padding:4px 6px;">
         <p style="margin:0;font-family:${FONT};font-size:22px;font-weight:bold;color:${PORTOCALIU};">${mii.format(c.valoare)}${c.sufix}</p>
         <p style="margin:2px 0 0;font-family:${FONT};font-size:12px;line-height:1.35;color:${MOALE};">${curat(c.eticheta)}</p>
       </td>`,
  ).join("");
  return `<tr><td style="padding:6px 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${HARTIE_CALDA}" style="background-color:${HARTIE_CALDA};border-radius:14px;">
      <tr><td style="padding:18px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${celule}</tr></table></td></tr>
    </table>
  </td></tr>`;
}

/**
 * Învelișul comun: antetul colorat, poza, titlul, textul.
 *
 * Antetul e o bandă portocalie cu sigla pe ea, nu o siglă pe alb. Pe alb,
 * mesajul începea cu un gol de trei centimetri și arăta a chitanță; banda îl
 * face să semene cu ce e — un mesaj de la o asociație, nu o notificare.
 *
 * Poza stă imediat sub antet și e mare dinadins: e singurul lucru din e-mail
 * care spune, fără cuvinte, despre cine e vorba.
 */
function invelis(
  continut: ContinutCampanie,
  corp: string,
  preheader: string,
  aleLor: ReadonlyArray<Cifra>,
): string {
  const paragrafe = continut.paragrafe
    .filter((p) => p.trim() !== "")
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:17px;line-height:1.65;color:${CERNEALA};">${curat(p)}</p>`,
    )
    .join("");

  const poza = continut.poza ?? POZA_IMPLICITA;

  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${curat(continut.titlu)}</title>
</head>
<body style="margin:0;padding:0;background-color:${HARTIE_CALDA};-webkit-font-smoothing:antialiased;">
  <!-- Rândul din inbox, de sub subiect. Nu se vede în mesaj. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${curat(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${HARTIE_CALDA}" style="background-color:${HARTIE_CALDA};">
    <tr><td align="center" style="padding:24px 12px 36px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(35,35,35,0.06);">

        <!-- Antetul -->
        <tr><td align="center" bgcolor="${PORTOCALIU}" style="background-color:${PORTOCALIU};padding:26px 32px 22px;">
          <img src="${SIGLA}" alt="" width="52" height="52" style="display:block;border:0;margin:0 auto 10px;" />
          <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;">
            ${curat(ASOCIATIA.denumire)}
          </p>
          <p style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:rgba(255,255,255,0.85);">
            „${curat(ASOCIATIA.motto)}”
          </p>
        </td></tr>

        <!-- Poza -->
        <tr><td style="font-size:0;line-height:0;">
          <img src="${curat(poza.adresa)}" alt="${curat(poza.alt)}" width="600"
               style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <h1 style="margin:0 0 18px;font-family:${FONT};font-size:28px;line-height:1.25;color:${CERNEALA};">${curat(continut.titlu)}</h1>
        </td></tr>

        <tr><td style="padding:0 32px;">${paragrafe}</td></tr>

        ${corp}

        ${are(continut, "cifre") ? cifre(aleLor) : ""}

        ${subsol(continut)}

      </table>

      <!-- Sub card: pentru cine se uită pe telefon, cu imaginile oprite. -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr><td align="center" style="padding:16px 24px 0;">
          <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MOALE};">
            ${curat(ASOCIATIA.denumire)} · ${curat(ADRESE.casaTeona.oras)}
          </p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Persoane fizice ─────────────────────────────────────────────────── */

function corpPersoane(c: ContinutCampanie): string {
  const campanie = c.campanie ?? null;
  const catre = (parametri: Record<string, string> = {}) =>
    link(RUTE.doneaza, "persoane", campanie, {
      ...(campanie ? { campanie } : {}),
      ...parametri,
    });

  const adresaCampaniei = campanie
    ? link(`${RUTE.campanii}/${campanie}`, "persoane", campanie)
    : link(RUTE.doneaza, "persoane", campanie);
  const deDistribuit = encodeURIComponent(adresaCampaniei);
  const textDistribuit = encodeURIComponent(
    `${c.titlu} — ${ASOCIATIA.denumire}`,
  );

  const conturi = JURIDIC.conturi
    .map(
      (cont) =>
        `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;line-height:1.5;color:${CERNEALA};"><strong>${curat(cont.banca)}</strong> (${curat(cont.moneda)})<br /><span style="font-family:Courier New,Courier,monospace;font-size:14px;color:${MOALE};">${curat(cont.iban)}</span></p>`,
    )
    .join("");

  const randuri = [
    are(c, "redirectionare")
      ? rand(
          "Redirecționează 3,5% din impozitul pe venit",
          "Nu te costă nimic: sunt bani pe care oricum îi plătești statului. Completezi formularul 230 în câteva minute.",
          {
            eticheta: "Vezi cum",
            adresa: link(RUTE.redirectionare35, "persoane", campanie),
          },
        )
      : "",
    are(c, "sms")
      ? rand(
          `Trimite un SMS cu ${SMS.text} la ${SMS.numar}`,
          `${SMS.sumaLunara} pe lună, din abonamentul tău. Te oprești trimițând ${SMS.textOprire}, gratuit.`,
        )
      : "",
    are(c, "ziuata")
      ? rand(
          "Fă-ți o campanie de ziua ta",
          "În loc de cadouri, prietenii tăi donează pentru copii. Pagina ta, cu numele și poza ta.",
          {
            eticheta: "Îmi fac pagina",
            adresa: link(RUTE.ziuaTa, "persoane", campanie),
          },
        )
      : "",
    are(c, "voluntar")
      ? rand(
          "Vino voluntar",
          "La tabere, la Casa Teona sau la evenimente. Avem nevoie și de câteva ore pe lună.",
          {
            eticheta: "Mă înscriu",
            adresa: link(RUTE.voluntar, "persoane", campanie),
          },
        )
      : "",
    are(c, "galantom")
      ? rand(
          "Donează prin Galantom",
          "Platforma de donații recurente, dacă îți e mai la îndemână.",
          { eticheta: "Deschide Galantom", adresa: LINKURI_EXTERNE.galantom },
        )
      : "",
  ].filter(Boolean);

  const carduri = [
    are(c, "campanii")
      ? cardFoto({
          poza: POZE.campanii.adresa,
          alt: POZE.campanii.alt,
          titlu: "Campaniile deschise acum",
          text: "Fiecare campanie spune limpede pentru ce se strâng banii și cât s-a strâns până acum.",
          eticheta: "Vezi campaniile",
          adresa: link(RUTE.campanii, "persoane", campanie),
        })
      : "",
    are(c, "tabere")
      ? cardFoto({
          poza: POZE.tabere.adresa,
          alt: POZE.tabere.alt,
          titlu: "Taberele RESPIRO",
          text: "O săptămână în care copiii se joacă, iar părinții răsuflă. Toate taberele de până acum, cu poze.",
          eticheta: "Vezi taberele",
          adresa: link(RUTE.proiecte, "persoane", campanie),
        })
      : "",
  ].filter(Boolean);

  return [
    are(c, "donez")
      ? `<tr><td align="center" style="padding:10px 32px 8px;">
      ${butonPlin("Donez acum", catre())}
    </td></tr>`
      : "",
    are(c, "sume")
      ? `<tr><td align="center" style="padding:14px 32px 6px;">
      ${titluMic(are(c, "donez") ? "sau alege o sumă" : "alege o sumă")}
      ${butonGol("20 lei", catre({ suma: "20" }))}${butonGol("50 lei", catre({ suma: "50" }))}${butonGol("100 lei", catre({ suma: "100" }))}
    </td></tr>`
      : "",
    are(c, "lunar")
      ? `<tr><td style="padding:18px 32px 0;">
      ${caseta(
        `<p style="margin:0 0 6px;font-family:${FONT};font-size:17px;font-weight:bold;color:${CERNEALA};">Cel mai mult ajută o donație lunară</p>
         <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${MOALE};">Cu o sumă mică, dar în fiecare lună, asociația poate promite unui copil că tabăra de anul viitor are loc. Se oprește oricând, dintr-un clic.</p>
         ${butonPlin("Donez lunar", catre({ frecventa: "lunar" }), TURCOAZ)}`,
      )}
    </td></tr>`
      : "",
    carduri.length
      ? `<tr><td style="padding:22px 32px 0;">
      ${titluMic("unde se duc banii")}
      ${carduri.join("")}
    </td></tr>`
      : "",
    randuri.length
      ? `<tr><td style="padding:6px 32px 0;">
      ${titluMic("alte feluri de a ajuta, fără să scoți un leu în plus")}
      ${cutie(randuri.join(""))}
    </td></tr>`
      : "",
    are(c, "transfer")
      ? `<tr><td style="padding:10px 32px 0;">
      ${caseta(
        `<p style="margin:0 0 10px;font-family:${FONT};font-size:15px;font-weight:bold;color:${CERNEALA};">Transfer bancar</p>
         ${conturi}
         <p style="margin:10px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MOALE};">După transfer, spune-ne pe site ca să-l găsim în extras și să-ți mulțumim.</p>`,
      )}
    </td></tr>`
      : "",
    are(c, "distribuie")
      ? `<tr><td align="center" style="padding:8px 32px 22px;">
      ${titluMic("spune mai departe")}
      ${butonGol("Pe Facebook", `https://www.facebook.com/sharer/sharer.php?u=${deDistribuit}`)}${butonGol("Pe WhatsApp", `https://wa.me/?text=${textDistribuit}%20${deDistribuit}`)}
    </td></tr>`
      : `<tr><td style="padding:0 0 14px;"></td></tr>`,
  ].join("\n");
}

/* ── Firme ───────────────────────────────────────────────────────────── */

function corpFirme(c: ContinutCampanie): string {
  const campanie = c.campanie ?? null;
  const om = CONTACT_FIRME[0];
  const pagina = link(RUTE.directionare20, "firme", campanie);
  const calculator = `${link(RUTE.directionare20, "firme", campanie)}#calculator`;

  const primeste = are(c, "primeste");
  const carduri = [
    are(c, "tabere")
      ? cardFoto({
          poza: POZE.tabere.adresa,
          alt: POZE.tabere.alt,
          titlu: "Taberele RESPIRO",
          text: "O săptămână în care copiii cu nevoi speciale se joacă, iar părinții răsuflă. Toate taberele de până acum, cu poze.",
          eticheta: "Vezi taberele",
          adresa: link(RUTE.proiecte, "firme", campanie),
        })
      : "",
    are(c, "campanii")
      ? cardFoto({
          poza: POZE.campanii.adresa,
          alt: POZE.campanii.alt,
          titlu: "Campaniile deschise acum",
          text: "Dacă firma vrea să susțină un lucru anume, de aici se alege.",
          eticheta: "Vezi campaniile",
          adresa: link(RUTE.campanii, "firme", campanie),
        })
      : "",
  ].filter(Boolean);

  return [
    are(c, "sponsorizez")
      ? `<tr><td align="center" style="padding:10px 32px 8px;">
      ${butonPlin("Vreau să sponsorizez", pagina)}
    </td></tr>`
      : "",
    are(c, "regula")
      ? `<tr><td style="padding:20px 32px 0;">
      ${caseta(
        `<p style="margin:0 0 6px;font-family:${FONT};font-size:17px;font-weight:bold;color:${CERNEALA};">Cât poate da firma ta, fără cost în plus</p>
         <p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${MOALE};">Sponsorizarea se scade din impozit: <strong style="color:${CERNEALA};">20% din impozitul pe profit</strong> sau <strong style="color:${CERNEALA};">0,75% din cifra de afaceri</strong> — se ia suma mai mică dintre ele. Sunt bani care altfel ar rămâne la stat.</p>
         <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${MOALE};">Scrii CUI-ul, iar calculatorul ia restul datelor de la ANAF și îți arată suma.</p>
         ${butonPlin("Calculează suma firmei mele", calculator, TURCOAZ)}`,
      )}
    </td></tr>`
      : "",
    are(c, "pasi")
      ? `<tr><td style="padding:4px 32px 0;">
      ${titluMic("trei pași, un sfert de oră")}
      ${pasi([
        "Scrii CUI-ul în calculator și vezi suma maximă.",
        "Descarci contractul, deja completat cu datele firmei, în Word sau PDF.",
        `Îl semnezi și ni-l trimiți pe e-mail, la ${EMAIL.contact}. Îl contrasemnăm și îți trimitem exemplarul semnat de amândoi.`,
      ])}
    </td></tr>`
      : "",
    are(c, "documente")
      ? `<tr><td align="center" style="padding:20px 32px 4px;">
      ${titluMic("documentele")}
      ${butonGol("Modelul de contract", `${ADRESA_SITE}/api/contract/descarca`)}${butonGol("Declarația 177", `${pagina}#documente`)}
    </td></tr>`
      : "",
    primeste
      ? `<tr><td style="padding:14px 32px 0;">
      ${titluMic("ce primește firma")}
      ${cutie(`${rand(
        "Numele și sigla pe site",
        "La Sponsori și parteneri, cu link către site-ul firmei.",
        {
          eticheta: "Vezi pagina",
          adresa: link(RUTE.sponsori, "firme", campanie),
        },
      )}
      ${rand(
        "Materiale pentru comunicarea voastră",
        "Fotografii și text despre proiectul pe care îl susțineți, de folosit pe canalele firmei.",
      )}`)}
    </td></tr>`
      : "",
    carduri.length
      ? `<tr><td style="padding:20px 32px 0;">
      ${titluMic("ce susține firma")}
      ${carduri.join("")}
    </td></tr>`
      : "",
    are(c, "contact")
      ? `<tr><td style="padding:12px 32px 0;">
      ${caseta(
        `<p style="margin:0 0 6px;font-family:${FONT};font-size:17px;font-weight:bold;color:${CERNEALA};">Hai să vorbim</p>
         <p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${MOALE};">${curat(om.nume)}, ${curat(om.rol)}. Dacă firma are nevoie de alt text în contract sau de o întâlnire, se rezolvă într-un telefon.</p>
         <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
           <td style="padding-right:8px;">${butonGol(om.telefon.afisat, `tel:${om.telefon.apel}`)}</td>
           <td>${butonGol("Scrie-ne", `mailto:${om.email}`)}</td>
         </tr></table>`,
      )}
    </td></tr>`
      : "",
  ].join("\n");
}

/* ── Ce se cheamă din afară ──────────────────────────────────────────── */

export function sablonCampanie(
  fel: FelSablon,
  continut: ContinutCampanie,
  aleLor: ReadonlyArray<Cifra> = CIFRE_DIN_COD,
): string {
  const preheader =
    continut.paragrafe.find((p) => p.trim() !== "")?.slice(0, 140) ??
    continut.titlu;
  return invelis(
    continut,
    fel === "firme" ? corpFirme(continut) : corpPersoane(continut),
    preheader,
    aleLor,
  );
}

/** Varianta în text simplu, pentru clienții care nu afișează HTML. */
export function textSimpluCampanie(
  fel: FelSablon,
  c: ContinutCampanie,
): string {
  const campanie = c.campanie ?? null;
  const linii: string[] = [
    c.titlu,
    "",
    ...c.paragrafe.filter((p) => p.trim() !== ""),
    "",
  ];

  if (fel === "firme") {
    const om = CONTACT_FIRME[0];
    const r = (id: string, ...x: string[]) => (are(c, id) ? x : []);
    linii.push(
      ...r("sponsorizez", `Vreau să sponsorizez: ${link(RUTE.directionare20, fel, campanie)}`),
      ...r("regula", `Calculează suma firmei: ${link(RUTE.directionare20, fel, campanie)}#calculator`),
      ...r("documente", `Modelul de contract: ${ADRESA_SITE}/api/contract/descarca`),
      ...r("primeste", `Ce primesc sponsorii: ${link(RUTE.sponsori, fel, campanie)}`),
      ...r("tabere", `Taberele RESPIRO: ${link(RUTE.proiecte, fel, campanie)}`),
      ...r("campanii", `Campaniile deschise: ${link(RUTE.campanii, fel, campanie)}`),
      "",
      ...r("regula", `20% din impozitul pe profit sau 0,75% din cifra de afaceri — suma mai mică dintre ele.`),
      ...r("contact", `${om.nume}, ${om.rol} · ${om.telefon.afisat} · ${om.email}`),
    );
  } else {
    const catre = (p: Record<string, string> = {}) =>
      link(RUTE.doneaza, fel, campanie, {
        ...(campanie ? { campanie } : {}),
        ...p,
      });
    const r = (id: string, ...x: string[]) => (are(c, id) ? x : []);
    linii.push(
      ...r("donez", `Donez acum: ${catre()}`),
      ...r("lunar", `Donez lunar: ${catre({ frecventa: "lunar" })}`),
      ...r("redirectionare", `Redirecționez 3,5%: ${link(RUTE.redirectionare35, fel, campanie)}`),
      ...r("sms", `SMS: ${SMS.text} la ${SMS.numar} (${SMS.sumaLunara} pe lună, oprire cu ${SMS.textOprire})`),
      ...r("campanii", `Campaniile deschise: ${link(RUTE.campanii, fel, campanie)}`),
      ...r("tabere", `Taberele RESPIRO: ${link(RUTE.proiecte, fel, campanie)}`),
      ...r("ziuata", `Campanie de ziua ta: ${link(RUTE.ziuaTa, fel, campanie)}`),
      ...r("voluntar", `Voluntariat: ${link(RUTE.voluntar, fel, campanie)}`),
      ...r("galantom", `Galantom: ${LINKURI_EXTERNE.galantom}`),
      ...r(
        "transfer",
        "",
        "Transfer bancar:",
        ...JURIDIC.conturi.map((c2) => `  ${c2.banca} (${c2.moneda}): ${c2.iban}`),
      ),
    );
  }

  linii.push(
    "",
    "—",
    `${ASOCIATIA.denumireLegala} · CIF ${ASOCIATIA.cif}`,
    `${ADRESE.casaTeona.strada}, ${ADRESE.casaTeona.oras} ${ADRESE.casaTeona.cod}`,
    `${TELEFOANE.map((t) => t.afisat).join(" · ")} · ${EMAIL.contact}`,
    "",
    `Dezabonare: ${c.dezabonare ?? "{$unsubscribe}"}`,
  );
  return linii.join("\n");
}
