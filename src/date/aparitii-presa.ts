/*
  Aparițiile în presă de la lansare. De la 11 noiembrie 2026 lista adevărată
  se ține din panou (`/admin/aparitii`, `lib/aparitii.ts`); asta e punctul
  de plecare și rezerva cât baza de date nu răspunde.
*/

/** Siglele publicațiilor, așa cum erau și pe site-ul vechi. */
export const PUBLICATII = {
  monitorul: {
    nume: "Monitorul de Suceava",
    sigla: "/poze/2024/11/download.png",
  },
  obiectiv: {
    nume: "Obiectiv de Suceava",
    sigla: "/poze/2024/11/download-1.png",
  },
  svnews: { nume: "Suceava News", sigla: "/poze/2024/11/download.jpeg" },
  suceavaOnline: {
    nume: "suceava.online",
    sigla: "/poze/2024/11/Screenshot_2.png",
  },
  /*
    Două surse video, fără siglă: nu avem logourile lor și nu le luăm de pe
    site-urile lor. Cardul arată atunci numele publicației scris, ca lista
    echipei care pune inițialele în locul unei siluete de stoc.
  */
  intermedia: { nume: "Televiziunea Intermedia" },
  institutulBucovina: { nume: "Asociația Institutul Bucovina" },
  antena3: { nume: "Antena 3 Suceava" },
} as const;

/**
 * Aparițiile în presă, în ordinea de pe site-ul vechi (de la cea mai nouă).
 *
 * Caietul cere la capitolul 9 ca linkurile să fie testate înainte de publicare.
 * Au fost testate, toate, iar rezultatul e scris aici lângă fiecare.
 *
 * **Cele șapte adăugate pe 16 octombrie 2026** vin din lista trimisă de
 * asociație („PRESĂ 2026.docx"). Lista dă sursa și o descriere, nu titlul
 * articolului: titlurile de mai jos sunt citite de pe paginile adevărate, iar
 * cele cinci adrese de la Monitorul de Suceava au răspuns 200 la verificare.
 *
 * Datele celor două clipuri sunt scrise **numai cu anul**: YouTube nu dă data
 * urcării fără cheie, iar o zi inventată într-o listă de presă e exact genul
 * de amănunt pe care nu-l verifică nimeni a doua oară. Lista asociației
 * spunea „Mai 2026" în dreptul clipului de la Institutul Bucovina, dar însuși
 * titlul lui e „Săptămâna Națională a Voluntariatului 2021" — deci anul scris
 * aici e 2021, nu 2026. De confirmat cu asociația.
 *
 * Mai rămân de pus cele două filmări de la Antena 3 Suceava din aceeași
 * listă: Facebook nu dă titlul fără autentificare, iar fără titlu cardul ar
 * rămâne gol.
 *
 * Verificările mai vechi:
 *
 * - svnews.ro — răspunde 200, link activ;
 * - obiectivdesuceava.ro (ambele) — răspund 403 la verificarea automată, ceea
 *   ce e protecție anti-robot, nu link mort: se deschid normal din browser;
 * - monitorulsv.ro, 20 august 2024 — adresa salvată în WordPress dă 404,
 *   articolul a fost mutat sau scos;
 * - suceava.online, 21 martie 2024 — adresa dă 404, deși site-ul funcționează;
 * - monitorulsv.ro, 14 iunie 2023 — în exportul WordPress nu există nicio
 *   adresă pentru această apariție.
 *
 * Aparițiile fără adresă validă rămân pe pagină, cu sursa și titlul, dar fără
 * buton: caietul interzice butoanele care nu duc nicăieri. Adresele corecte
 * vin din lista pe care o trimite asociația.
 */
const APARITII_COD: ReadonlyArray<{
  publicatie: keyof typeof PUBLICATII;
  data: string;
  an: string;
  titlu: string;
  adresa?: string;
  /**
   * Filmare de pe Facebook, arătată în pagină sub card.
   *
   * Facebook nu dă titlul unei postări fără cont, deci pentru cele două
   * filmări de la Antena 3 nu aveam ce scrie pe card — iar un card gol n-are
   * rost. Încorporate, titlul îl pune playerul lor; ce scriem noi deasupra e
   * descrierea trimisă de asociație, ca text de orientare, nu ca titlu de
   * articol.
   */
  incorporare?: string;
}> = [
  {
    publicatie: "monitorul",
    data: "15 septembrie 2026",
    an: "2026",
    titlu:
      "O nouă tabără dedicată copiilor cu tulburări din spectrul autist și părinților lor, la Vama",
    adresa:
      "https://www.monitorulsv.ro/o-noua-tabara-dedicata-copiilor-cu-tulburari-din-spectrul-autist-si-parintilor-lor-la-vama_698303/",
  },
  {
    publicatie: "monitorul",
    data: "7 septembrie 2026",
    an: "2026",
    titlu:
      "Asociația Teona Ariana Suceava a organizat prima tabără din regiunea Moldovei dedicată copiilor aflați în remisiune după cancer",
    adresa:
      "https://www.monitorulsv.ro/asociatia-teona-ariana-suceava-a-organizat-prima-tabara-din-regiunea-moldovei-dedicata-copiilor-aflati-in-remisiune-dupa-cancer_2242ee/",
  },
  {
    publicatie: "antena3",
    data: "septembrie 2026",
    an: "2026",
    titlu: "Tabăra Respiro Împreună Oncologie, la televizor",
    adresa: "https://www.facebook.com/reel/1958097188211260",
    incorporare: "https://www.facebook.com/reel/1958097188211260",
  },
  {
    publicatie: "monitorul",
    data: "9 iulie 2026",
    an: "2026",
    titlu:
      "34 de copii premianți din sistemul de protecție socială sucevean, răsplătiți cu o tabără de neuitat",
    adresa:
      "https://www.monitorulsv.ro/34-de-copii-premianti-din-sistemul-de-protectie-sociala-sucevean-rasplatiti-cu-o-tabara-de-neuitat_15868a/",
  },
  {
    publicatie: "monitorul",
    data: "4 mai 2026",
    an: "2026",
    titlu:
      "42 de copii cu nevoi speciale și familiile lor au participat în Tabăra „Respiro”, la Vama",
    adresa:
      "https://www.monitorulsv.ro/42-de-copii-cu-nevoi-speciale-si-familiile-lor-au-participat-in-tabara-respiro-la-vama_1a2cba/",
  },
  {
    publicatie: "antena3",
    data: "2026",
    an: "2026",
    titlu: "Informare înainte de Tabăra Respiro Împreună Oncologie",
    adresa: "https://www.facebook.com/watch/?v=1526997765333388",
    incorporare: "https://www.facebook.com/watch/?v=1526997765333388",
  },
  {
    publicatie: "monitorul",
    data: "20 noiembrie 2025",
    an: "2025",
    titlu:
      "Casa Teona împlinește un an – un an de joacă, terapie și comunitate pentru copiii cu cerințe speciale din județul Suceava",
    adresa:
      "https://www.monitorulsv.ro/casa-teona-implineste-un-an-un-an-de-joaca-terapie-si-comunitate-pentru-copiii-cu-cerinte-speciale-din-judetul-suceava_495d66/",
  },
  {
    publicatie: "intermedia",
    data: "2024",
    an: "2024",
    titlu:
      "A fost deschisă Casa Teona, locul de respiro pentru copii cu dizabilități și părinții acestora",
    adresa: "https://www.youtube.com/watch?v=aKvAHWGRetM",
  },
  {
    publicatie: "monitorul",
    data: "20 august 2024",
    an: "2024",
    titlu:
      "24 de copii cu deficiențe de auz și vorbire au fost în Tabăra Respiro, la Vama, organizată de Asociația Teona Ariana Suceava",
  },
  {
    publicatie: "suceavaOnline",
    data: "21 martie 2024",
    an: "2024",
    titlu:
      "„Împreună, prieteni!”, un eveniment dedicat Zilei Mondiale a Sindromului Down la Suceava",
  },
  {
    publicatie: "monitorul",
    data: "14 iunie 2023",
    an: "2023",
    titlu:
      "Asociația Teona Ariana a „adoptat” 26 de elevi cu deficiențe de auz și vorbire și le-a oferit o tabără „Respiro”",
  },
  {
    publicatie: "obiectiv",
    data: "14 iunie 2023",
    an: "2023",
    titlu:
      "Asociația Teona Ariana a „adoptat” 26 de elevi cu deficiențe de auz și vorbire și le-a oferit o tabără „Respiro”",
    adresa:
      "https://www.obiectivdesuceava.ro/local/26-de-copii-cu-deficiente-de-vorbire-si-auz-au-avut-parte-de-o-saptamana-de-relaxare-oferita-de-asociatia-teona-ariana/",
  },
  {
    publicatie: "svnews",
    data: "12 mai 2023",
    an: "2023",
    titlu:
      "Tabăra RESPIRO din mai 2023, dedicată copiilor cu autism, cu sindrom Down și părinților lor, „a fost despre iubire necondiționată”",
    adresa:
      "https://www.svnews.ro/tabara-respiro-din-mai-2023-dedicata-copiilor-cu-autism-cu-sindrom-down-si-parintilor-lor-a-fost-despre-iubire-neconditionata/339507/",
  },
  {
    publicatie: "obiectiv",
    data: "17 iunie 2021",
    an: "2021",
    titlu:
      "Asociația Teona Ariana din Suceava a organizat prima tabără pentru copiii cu autism și sindrom Down",
    adresa:
      "https://www.obiectivdesuceava.ro/local/asociatia-teona-ariana-din-suceava-a-organizat-prima-tabara-pentru-copiii-cu-autism-si-sindrom-down/",
  },
  {
    publicatie: "institutulBucovina",
    data: "2021",
    an: "2021",
    titlu:
      "Săptămâna Națională a Voluntariatului 2021 — Tabăra „RESPIRO” (Vama, Suceava)",
    adresa: "https://www.youtube.com/watch?v=WWlZH1QIbzY",
  },
];


/** O apariție, cum o arată pagina: publicația e scrisă cu numele ei. */
export type AparitiePresa = {
  publicatie: string;
  data: string;
  an: string;
  titlu: string;
  adresa?: string;
  incorporare?: string;
};

/** Aparițiile de la lansare, punctul de plecare al tabelului din panou. */
export const APARITII: ReadonlyArray<AparitiePresa> = APARITII_COD.map((a) => ({
  ...a,
  publicatie: PUBLICATII[a.publicatie].nume,
}));

/**
 * Sigla unei publicații, după nume. O publicație scrisă în panou cu alt nume
 * decât cele cunoscute apare cu numele scris, fără siglă, ca Antena 3.
 */
export function siglaPublicatiei(nume: string): string | undefined {
  const cheie = nume.trim().toLocaleLowerCase("ro-RO");
  for (const p of Object.values(PUBLICATII)) {
    if (p.nume.toLocaleLowerCase("ro-RO") === cheie && "sigla" in p) return p.sigla;
  }
  return undefined;
}
