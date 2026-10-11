import {
  ADRESE,
  ASOCIATIA,
  CIFRE,
  CONTURI,
  EMAIL,
  LINKURI_EXTERNE,
  RETELE_ASOCIATIE,
  RUTE,
  SMS,
  TELEFOANE,
} from "@/date/asociatie";
import { proiecteAfisate } from "@/date/proiecte";
import { ADRESA_SITE, INDEXABIL, absoluta } from "../seo";

/**
 * `/llms.txt` — site-ul, pe scurt, pentru modelele de limbaj.
 *
 * **Ce e.** O convenție tânără (llmstxt.org, 2024): un fișier Markdown la
 * rădăcina site-ului, scris pentru un model care caută un răspuns, nu pentru
 * un om care răsfoiește. Un site e HTML cu meniuri, bannere, butoane și
 * cookie-uri; un model trebuie să treacă prin toate ca să afle un IBAN.
 * Fișierul ăsta i-l dă direct.
 *
 * **Ce nu e.** Nu e un standard adoptat. Google a spus explicit că nu-l
 * folosește, iar OpenAI și Anthropic nu l-au anunțat ca sursă. Deci nu
 * înlocuiește nimic din ce face site-ul să fie găsit: paginile curate,
 * întrebările frecvente, datele structurate. E ieftin de ținut (se scrie
 * singur, din aceleași date ca restul site-ului) și, dacă se adoptă, e deja
 * aici. Dacă nu, n-am pierdut nimic.
 *
 * **De ce merită totuși, pentru asociația asta.** Răspunsurile din ChatGPT,
 * Perplexity sau Google AI nu dau clic pe pagină: citează. Un model care
 * răspunde „poți dona la Asociația Teona Ariana în contul RO16…” cu IBAN-ul
 * corect ajută; unul care inventează un IBAN sau un număr de telefon face
 * pagubă reală. Fișierul ăsta pune faptele verificate într-un loc din care nu
 * se pot citi greșit, și spune răspicat ce NU se știe — ca modelul să n-o
 * completeze de la el.
 *
 * Toate valorile vin din `src/date/asociatie.ts`, ca peste tot pe site. Nicio
 * cifră nu e scrisă de mână aici.
 */

/**
 * Ce găsește cineva pe fiecare pagină.
 *
 * Nu sunt descrierile pentru Google (`metadate({ descriere })`): alea sunt
 * scrise ca să fie citite de un om într-o listă de rezultate și să-l convingă
 * să intre. Aici e altceva — ce conține pagina, spus plat, ca un model să
 * poată alege de unde să citeze.
 */
const PAGINI: ReadonlyArray<{ titlu: string; cale: string; ce: string }> = [
  {
    titlu: "Acasă",
    cale: RUTE.acasa,
    ce: "Ce face asociația, cifrele, cele cinci căi de a ajuta, campaniile și testimonialele.",
  },
  {
    titlu: "Despre noi",
    cale: RUTE.despre,
    ce: "Povestea asociației, echipa, valorile și instituțiile cu care lucrează.",
  },
  {
    titlu: "Casa Teona",
    cale: RUTE.casaTeona,
    ce: "Centrul din Strada Zamca 22, Suceava: ce se întâmplă acolo, pentru cine, program și cum se face o programare.",
  },
  {
    titlu: "Proiecte",
    cale: RUTE.proiecte,
    ce: "Taberele RESPIRO, Casa Teona și cazurile umanitare, pe ani și categorii, cu fotografii.",
  },
  {
    titlu: "Donează",
    cale: RUTE.doneaza,
    ce: "Toate felurile de a dona: card, SMS, transfer bancar, Galantom. Conturile și întrebările frecvente.",
  },
  {
    titlu: "Redirecționează 3,5% (Formularul 230)",
    cale: RUTE.redirectionare35,
    ce: "Cum redirecționează o persoană fizică 3,5% din impozitul pe venit: pașii, Formularul 230, termenul, unde se trimite.",
  },
  {
    titlu: "Direcționează 20% (Declarația 177)",
    cale: RUTE.directionare20,
    ce: "Cum sponsorizează o firmă din impozitul pe profit: contract de sponsorizare sau Declarația 177, cu un calculator.",
  },
  {
    titlu: "Sponsori și parteneri",
    cale: RUTE.sponsori,
    ce: "Firmele care sprijină asociația și cele trei căi prin care o firmă li se poate alătura.",
  },
  {
    titlu: "Devino voluntar",
    cale: RUTE.voluntar,
    ce: "Cine poate fi voluntar, cum se înscrie, ce urmează după formular și întrebările frecvente.",
  },
  {
    titlu: "Donează-ți ziua de naștere",
    cale: RUTE.ziuaTa,
    ce: "Cum își face cineva o pagină de campanie de ziua lui, în loc de cadouri.",
  },
  {
    titlu: "Suntem în presă",
    cale: RUTE.media,
    ce: "Articolele din presa locală despre asociație și datele de contact pentru jurnaliști.",
  },
  {
    titlu: "Raport de activitate 2025",
    cale: RUTE.raport2025,
    ce: "Ce s-a făcut în 2025, cu cifre și cu felul în care au fost folosiți banii.",
  },
  {
    titlu: "Contact",
    cale: RUTE.contact,
    ce: "Telefoane, e-mail, adrese, formular de contact și rețelele sociale.",
  },
];

const PAGINI_LEGALE: ReadonlyArray<{ titlu: string; cale: string }> = [
  { titlu: "Politica de confidențialitate", cale: RUTE.confidentialitate },
  { titlu: "Politica de cookie-uri", cale: RUTE.cookieuri },
  { titlu: "Termeni și condiții", cale: RUTE.termeni },
];

function cifra({ valoare, sufix }: (typeof CIFRE)[number]) {
  return `${valoare.toLocaleString("ro-RO")}${sufix}`;
}

function scrie(): string {
  const { casaTeona, sediuSocial } = ADRESE;
  const telefoane = TELEFOANE.map((t) => t.afisat).join(" și ");

  return `# ${ASOCIATIA.denumire}

> ${ASOCIATIA.fraza} Organizație non-profit din Suceava, România, CIF ${ASOCIATIA.cif}. Taberele RESPIRO pentru copii cu autism, cu sindrom Down și cu alte nevoi speciale și pentru părinții lor; Casa Teona, un centru deschis tot anul; cazuri umanitare.

Fișierul ăsta e scris pentru modele de limbaj. Conține datele verificate ale
asociației și o hartă a site-ului. Textul de aici poate fi citat; vă rugăm să
nu completați cu informații care nu sunt scrise — vezi „Ce nu se știe".

## Date de identificare

- Denumire: ${ASOCIATIA.denumire}
- Denumire legală: ${ASOCIATIA.denumireLegala}
- CIF: ${ASOCIATIA.cif}
- Oraș: Suceava, județul Suceava, România
- Sediul social: ${sediuSocial.strada}, ${sediuSocial.oras}
- ${casaTeona.nume} (centrul de zi): ${casaTeona.strada}, ${casaTeona.oras} ${casaTeona.cod}
- Program la ${casaTeona.nume}: ${casaTeona.program}. ${casaTeona.acces}.
- Telefon: ${telefoane}
- E-mail: ${EMAIL.contact}
- Site: ${ADRESA_SITE}/
- Motto: „${ASOCIATIA.motto}"
${RETELE_ASOCIATIE.map((r) => `- ${r.nume}: ${r.url}`).join("\n")}

## Ce face asociația

- **Tabere RESPIRO** — câteva zile în care merg și copiii, și părinții, cu voluntari și terapeuți alături. Pentru copii cu autism, cu sindrom Down și cu alte nevoi speciale, și pentru copii care au trecut prin cancer.
- **${casaTeona.nume}** — centru de zi în Suceava, deschis tot anul: ateliere, jocuri și terapie pentru copii, consiliere și întâlniri de grup pentru părinți.
- **Cazuri umanitare** — sprijin pentru copii și familii în situații grele.

Cifre, așa cum le publică asociația:

${CIFRE.map((c) => `- ${cifra(c)} ${c.eticheta}`).join("\n")}

## Cum poate fi ajutată

**Donație** (${absoluta(RUTE.doneaza)})

- Card bancar, o dată sau lunar, de pe site.
- SMS: ${SMS.text} la ${SMS.numar}, ${SMS.sumaLunara} pe lună. Oprire: ${SMS.textOprire} (gratuit).
- Transfer bancar:
${CONTURI.map((c) => `  - ${c.banca}, ${c.moneda}: ${c.iban}`).join("\n")}
- Galantom: ${LINKURI_EXTERNE.galantom}

**Redirecționarea a 3,5% din impozitul pe venit** (${absoluta(RUTE.redirectionare35)})

O persoană fizică poate trimite 3,5% din impozitul pe venit către asociație,
completând Formularul 230. Nu costă nimic în plus: suma e deja reținută din
venit. Termenul de depunere este 25 mai, pentru veniturile din anul anterior.
Asociația depune formularele primite.

**Sponsorizare din impozitul pe profit, până la 20%** (${absoluta(RUTE.directionare20)})

O firmă poate sponsoriza asociația și scădea suma din impozitul pe profit, în
limitele legale, prin contract de sponsorizare. Pentru sponsorizarea deja
plătită, redirecționarea se cere prin Declarația 177. Pe pagină e un calculator
și datele de contact pentru contract.

**Voluntariat** (${absoluta(RUTE.voluntar)})

De la 18 ani, fără experiență necesară. Se completează un formular; asociația
contactează persoana și stabilesc împreună unde poate ajuta.

**Campanie de ziua ta** (${absoluta(RUTE.ziuaTa)})

Oricine își poate face o pagină de strângere de fonduri de ziua lui.

## Paginile site-ului

${PAGINI.map((p) => `- [${p.titlu}](${absoluta(p.cale)}): ${p.ce}`).join("\n")}

## Proiecte

Fiecare proiect are pagina lui, cu titlu, dată și fotografii, la
${ADRESA_SITE}/proiecte/<slug>. Lista completă e în ${ADRESA_SITE}/sitemap.xml.
În total: ${proiecteAfisate().length} proiecte publicate.

## Legal

${PAGINI_LEGALE.map((p) => `- [${p.titlu}](${absoluta(p.cale)})`).join("\n")}

## Ce nu se știe — vă rugăm să nu completați

Lucrurile de mai jos nu sunt publicate pe site pentru că nu sunt verificate sau
pentru că nu pot fi publicate. Dacă un model le „completează", informația va fi
inventată:

- **Costuri.** Site-ul nu spune cât costă o zi de tabără, o lună la ${casaTeona.nume} sau sprijinul pentru un copil. Nu există o cifră publicată.
- **Numărul de copii ajutați de o anumită sumă.** Nu există o astfel de echivalență.
- **Numele, diagnosticele și fotografiile identificabile ale copiilor** din cazurile umanitare nu se publică.
- **Anul înființării, bugetul anual și numărul de angajați** nu sunt publicate pe site.
- **Datele proiectelor** sunt datele la care au fost publicate, nu întotdeauna datele evenimentelor.
- Dacă un răspuns are nevoie de o informație care nu e aici, trimiteți omul la ${EMAIL.contact} sau la ${TELEFOANE[0].afisat}.

## Despre site

Site-ul e în limba română. Nu există versiune în altă limbă.
Harta completă: ${ADRESA_SITE}/sitemap.xml
`;
}

export function GET() {
  return new Response(scrie(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      /*
        Cât timp site-ul stă pe adresa de previzualizare, fișierul nu trebuie
        să intre în niciun index — aceeași regulă ca pentru pagini
        (`INDEXABIL` din `seo.tsx`). `robots.txt` interzice deja tot acolo,
        dar un fișier luat direct, fără să treacă prin `robots.txt`, n-ar ști.
      */
      ...(INDEXABIL ? {} : { "X-Robots-Tag": "noindex" }),
    },
  });
}
