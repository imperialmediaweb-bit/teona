/**
 * Anul unei asociații, scris o dată.
 *
 * **De ce există.** Comunicarea unui ONG mic se face în rafale: trei
 * postări într-o săptămână, apoi șase săptămâni de tăcere, și campania de
 * Crăciun începută pe 20 decembrie, când toată lumea a dat deja. Lucrurile
 * care se repetă în fiecare an — termenul de 25 mai, începutul școlii,
 * taberele, sărbătorile — se pot ști dinainte, deci se scriu aici o dată și
 * apar singure în calendar, în fiecare an.
 *
 * **Ce nu e aici:** zile pe care nu le putem verifica. Termenul Declarației
 * 177 nu e trecut ca dată fiindcă îl confirmă contabilitatea firmei, nu noi
 * (apare ca lucru de confirmat, nu ca zi sigură). O dată greșită într-un
 * calendar e mai rea decât una lipsă: după ea se face muncă.
 */

export type Moment = {
  /** Luna, 1–12. */
  luna: number;
  /** Ziua. Lipsă = „undeva în luna asta". */
  zi?: number;
  titlu: string;
  /** Ce se face, pe scurt. */
  ce: string;
  fel: "termen" | "zi-tematica" | "sezon" | "ritm";
};

export const MOMENTE: ReadonlyArray<Moment> = [
  {
    luna: 1,
    titlu: "Raportul anului trecut, către donatori",
    ce: "Scoate raportul anual din panou și trimite-l celor care au donat anul trecut. E singurul mesaj din an care nu cere nimic.",
    fel: "sezon",
  },
  {
    luna: 2,
    zi: 15,
    titlu: "Ziua internațională a copiilor cu cancer",
    ce: "Taberele oncologice au poveștile potrivite pentru ziua asta. Postare pe pagină și, dacă e o tabără aproape, un comunicat.",
    fel: "zi-tematica",
  },
  {
    luna: 3,
    titlu: "Pregătirea campaniei de 3,5%",
    ce: "Formularul 230 completat online e cea mai ieftină sursă de bani a asociației: nu costă donatorul nimic. Textele și linkurile se pregătesc acum, nu în mai.",
    fel: "sezon",
  },
  {
    luna: 4,
    zi: 2,
    titlu: "Ziua internațională de conștientizare a autismului",
    ce: "Casa Teona și taberele de autism. Ziua în care presa locală caută subiecte pe tema asta — comunicatul are cele mai mari șanse.",
    fel: "zi-tematica",
  },
  {
    luna: 5,
    zi: 25,
    titlu: "Termenul Formularului 230",
    ce: "Ultima zi în care se mai poate depune pentru anul trecut. Ultimul mesaj pleacă cu câteva zile înainte, nu în ziua aia.",
    fel: "termen",
  },
  {
    luna: 6,
    zi: 1,
    titlu: "Ziua Copilului",
    ce: "Ziua cu cel mai mare interes pentru o asociație de copii. Postare, și o campanie dacă e ceva de strâns.",
    fel: "zi-tematica",
  },
  {
    luna: 6,
    titlu: "Începe sezonul taberelor",
    ce: "De aici până în septembrie se adună materialul pentru tot anul: fotografii mari, povești, acordul părinților pentru poze. Fără ele, toamna n-ai ce publica.",
    fel: "sezon",
  },
  {
    luna: 9,
    titlu: "Începutul școlii",
    ce: "Campania de ghiozdane și rechizite. Se anunță la sfârșitul lui august, nu pe 10 septembrie.",
    fel: "sezon",
  },
  {
    luna: 11,
    titlu: "Pregătirea campaniei de sărbători",
    ce: "Jumătate din donațiile unui an se strâng în ultimele șase săptămâni. Textele, pozele și pagina de campanie se fac acum.",
    fel: "sezon",
  },
  {
    luna: 12,
    zi: 3,
    titlu: "Ziua internațională a persoanelor cu dizabilități",
    ce: "Ziua cea mai potrivită pentru Casa Teona. Comunicat către presa locală.",
    fel: "zi-tematica",
  },
  {
    luna: 12,
    titlu: "Sponsorizările firmelor, până la final de an",
    ce: "Sponsorizarea se scade din impozitul anului în care a fost plătită, deci firmele care vor să o folosească pe anul ăsta trebuie să plătească până la 31 decembrie. Termenul exact al Declarației 177 îl confirmă contabilitatea firmei.",
    fel: "termen",
  },
];

/** Ce se face în fiecare lună, indiferent de an. */
export const RITM_LUNAR: ReadonlyArray<{ titlu: string; ce: string }> = [
  {
    titlu: "Raportul lunii încheiate",
    ce: "Se scoate din panou în primele zile, pentru ședință și consiliul director.",
  },
  {
    titlu: "Un buletin de e-mail",
    ce: "Unul pe lună e destul; două sunt prea multe, zero înseamnă că lista se răcește și la anul nu mai deschide nimeni.",
  },
  {
    titlu: "Donatorii care s-au oprit",
    ce: "Segmentul din panou: cine a dat de cel puțin două ori și n-a mai dat de patru luni. Un telefon aduce mai mult decât zece e-mailuri.",
  },
  {
    titlu: "Firmele fără răspuns",
    ce: "Cele din pâlnie care n-au răspuns de două săptămâni, din „De făcut acum\".",
  },
];
