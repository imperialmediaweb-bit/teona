import { ASOCIATIA, CIFRE } from "@/date/asociatie";

/**
 * Textele mulțumirii, în mai multe variante.
 *
 * **De ce mai multe.** Un donator lunar primește douăsprezece mesaje pe an.
 * Dacă toate sunt aceeași propoziție, de la al treilea încolo nu se mai
 * citesc — și, mai rău, se vede că nu le-a scris nimeni. Un om care dă bani
 * în fiecare lună merită să i se vorbească în fiecare lună, nu să primească
 * o chitanță cu numele lui pe ea.
 *
 * **Cum se alege varianta.** Din săptămâna donației plus o cifră scoasă din
 * adresa de e-mail. Așa:
 *
 * - același donator, luni diferite → variante diferite. Două donații lunare
 *   sunt la ~4,35 săptămâni una de alta; cu un număr impar de variante
 *   (șapte) indicele se plimbă prin toate înainte să se repete;
 *   - doi donatori diferiți, în aceeași zi → variante diferite, de la adresă;
 * - aceeași donație compusă de două ori (o retrimitere, o probă) → aceeași
 *   variantă, fiindcă nu intervine ceasul, ci ziua.
 *
 * **Ce nu e aici:** nicio cifră pe care n-o știm. Cât costă o zi de tabără,
 * câți copii ajung dintr-o sumă, ce s-a cumpărat din banii lui — nu știm, și
 * un text care „sună bine" costă exact lucrul pe care mesajul îl apără.
 */

const TABERE = CIFRE[0].valoare;
const PARTICIPANTI = CIFRE[1].valoare.toLocaleString("ro-RO");
const COPII = CIFRE[2].valoare;

/** Al doilea paragraf: unde ajung banii, spus în șapte feluri. */
const CE_FACEM = [
  `Banii merg la copiii cu nevoi speciale, la cei care au trecut prin cancer și la familiile lor. Până acum am făcut ${TABERE} de tabere, cu peste ${PARTICIPANTI} de participanți, iar la Casa Teona vin acum peste ${COPII} de copii. De azi ești și tu în socoteala asta.`,

  `La Casa Teona, pe Strada Zamca, vin acum peste ${COPII} de copii: terapie, activități, un loc unde nu trebuie să explice nimeni nimic. Banii tăi țin ușa aia deschisă.`,

  `Taberele RESPIRO sunt pentru copiii cu nevoi speciale și pentru părinții lor deodată — o săptămână în care familia respiră. Am făcut ${TABERE} până acum, cu peste ${PARTICIPANTI} de participanți.`,

  `Nu avem o clădire plătită de nimeni și nici un buget care vine de la sine. Tot ce facem — ${TABERE} de tabere, Casa Teona, cazurile pe care le ducem — stă pe oameni care au hotărât, ca tine, să dea.`,

  `Cei mai mulți dintre copiii noștri au o boală care nu trece. Ce se poate schimba e restul: dacă au unde merge, dacă au cu cine, dacă familia lor mai are o săptămână în care nu e singură. Acolo intră banii tăi.`,

  `Peste ${COPII} de copii vin la Casa Teona, iar vara îi ducem în tabere — ${TABERE} de când am început. Partea pe care n-o vezi în cifre e drumul până la ei: telefoane, drumuri, mâncare, un terapeut plătit la timp.`,

  `Aducem bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor. Nu e un slogan pus pe site: e tot ce facem, și e singurul lucru în care intră banii tăi.`,
] as const;

/**
 * Citatul de la sfârșit.
 *
 * **De verificat de asociație, o dată.** Versetele sunt scrise aici în forma
 * din traducerea sinodală; proverbele n-au autor, deci n-au ce greși. Un
 * verset citat greșit, într-un mesaj semnat de o asociație al cărei motto e
 * „Nimic fără Dumnezeu", e mai rău decât niciun citat — de aceea nu există
 * aici niciun citat „celebru" fără sursă sigură: jumătate din ce circulă pe
 * internet e pus în gura altcuiva.
 */
const CITATE: ReadonlyArray<{ text: string; sursa: string }> = [
  {
    text: "Mai fericit este a da decât a lua.",
    sursa: "Faptele Apostolilor 20, 35",
  },
  {
    text: "Întrucât ați făcut unuia dintr-acești frați ai Mei prea mici, Mie Mi-ați făcut.",
    sursa: "Matei 25, 40",
  },
  {
    text: "Pe dătătorul de bunăvoie îl iubește Dumnezeu.",
    sursa: "II Corinteni 9, 7",
  },
  { text: "Să nu știe stânga ta ce face dreapta ta.", sursa: "Matei 6, 3" },
  { text: "Purtați-vă sarcinile unii altora.", sursa: "Galateni 6, 2" },
  { text: "Omul sfințește locul.", sursa: "proverb românesc" },
  { text: ASOCIATIA.motto, sursa: "deviza asociației" },
];

/** Deschiderea, pe felul donației. Trei variante de fiecare. */
const DESCHIDERI = {
  unica: [
    "Ai făcut asta pentru niște copii pe care poate nu i-ai întâlnit niciodată. Nu te-a obligat nimeni și nu primești nimic înapoi — de asta contează.",
    "Ai dat fără să-ți ceară cineva și fără să afle cineva. Nu știm ce te-a făcut s-o faci, dar a ajuns unde trebuia.",
    "Mulțumim. Nu pentru sumă — pentru că te-ai oprit din ce făceai și ai hotărât că merită.",
  ],
  lunara: [
    "Ai ales să dai în fiecare lună. E lucrul cel mai greu de obținut și cel mai de folos: lunar înseamnă că putem spune „da” unei familii înainte să avem banii în cont.",
    "Ai ales să dai lunar. Asta ne schimbă felul în care lucrăm: putem plănui o tabără în februarie, nu în iunie, când vedem cât s-a strâns.",
    "Lunar e cea mai bună veste pe care o putem primi. Un buget pe care te poți bizui e diferența dintre „sperăm” și „am rezervat”.",
  ],
  reinnoire: [
    "S-a reînnoit donația ta lunară. Nu trebuie să faci nimic — îți scriem doar ca să știi că a mers. Și ca să-ți mulțumim încă o dată: nu ne-am obișnuit.",
    "Ți s-a reînnoit donația lunară. N-ai de făcut nimic. Îți scriem fiindcă ni se pare că un om care dă în fiecare lună merită să audă „mulțumim” în fiecare lună.",
    "A mers și luna asta. Nu-ți cerem nimic — e doar rândul nostru să spunem că n-am uitat.",
  ],
  transfer: [
    "Am găsit transferul tău în extrasul de cont. De acum e al copiilor.",
    "L-am găsit în extras. Mulțumim că ne-ai și spus — altfel îl căutam pe ghicite.",
    "Transferul tău a ajuns și l-am găsit. E trecut în evidență, cu ziua în care l-ai făcut tu.",
  ],
} as const;

export type FelMultumire = keyof typeof DESCHIDERI;

/**
 * Indicele variantei.
 *
 * Săptămâna donației, plus suma codurilor din adresă. Fără ceas: aceeași
 * donație compusă de două ori dă același text, deci o probă din panou arată
 * exact ce a primit omul.
 */
function indice(email: string, cand: Date): number {
  const saptamana = Math.floor(cand.getTime() / (7 * 24 * 3600 * 1000));
  const sare = email
    .toLowerCase()
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  // `% n` pe un număr sigur pozitiv: ambele părți sunt pozitive.
  return saptamana + sare;
}

export function texteleMultumirii(
  fel: FelMultumire,
  email: string,
  cand: Date,
): {
  deschidere: string;
  ceFacem: string;
  citat: { text: string; sursa: string };
} {
  const i = indice(email, Number.isNaN(cand.getTime()) ? new Date() : cand);
  const deschideri = DESCHIDERI[fel];
  return {
    deschidere: deschideri[i % deschideri.length],
    ceFacem: CE_FACEM[i % CE_FACEM.length],
    citat: CITATE[i % CITATE.length],
  };
}
