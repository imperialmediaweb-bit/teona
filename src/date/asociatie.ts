/**
 * Datele asociației, într-un singur loc.
 *
 * Caietul de sarcini cere ca cifrele să fie „aceleași peste tot” și „preluate
 * automat din aceleași date, ca să nu apară variante diferite”. De aceea nicio
 * pagină nu scrie o cifră, un telefon sau un IBAN direct — toate citesc de aici.
 *
 * Nimic din acest fișier nu se inventează. Fiecare valoare e verificată și
 * apare în CLAUDE.md sau în caietul de sarcini.
 */

export const ASOCIATIA = {
  denumire: "Asociația Teona Ariana Suceava",
  denumireLegala: "ASOCIAȚIA TEONA ARIANA SUCEAVA",
  cif: "43533953",
  motto: "Nimic fără Dumnezeu",
  fraza:
    "Aducem bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor.",
} as const;

/** Telefoanele, cu forma pentru `tel:` alături de forma citibilă. */
export const TELEFOANE = [
  { afisat: "0754 510 167", apel: "+40754510167" },
  { afisat: "0748 250 704", apel: "+40748250704" },
] as const;

/** Telefonul principal — cel din butoanele „Sună pentru programare”. */
export const TELEFON_PRINCIPAL = TELEFOANE[0];

export const EMAIL = {
  contact: "contact@teona-ariana.ro",
  /**
   * Alias, cerut explicit la 7.4: „Adresa se creează ca alias, ca persoana
   * care le gestionează să poată fi schimbată fără a modifica site-ul.”
   * Redirecționează acum către mihaela.sfichi@teona-ariana.ro.
   */
  redirectionare: "redirectionare@teona-ariana.ro",
  fundraising: "mihaela.sfichi@teona-ariana.ro",
} as const;

/** Persoanele de contact pentru firme (8.7). */
export const CONTACT_FIRME = [
  {
    nume: "Mihaela Sfichi",
    rol: "Manager fundraising",
    email: "mihaela.sfichi@teona-ariana.ro",
    telefon: { afisat: "0748 250 704", apel: "+40748250704" },
  },
  {
    nume: "Cristea Costiuc",
    rol: "Președinte",
    email: "contact@teona-ariana.ro",
    telefon: { afisat: "0754 510 167", apel: "+40754510167" },
  },
] as const;

export const ADRESE = {
  casaTeona: {
    nume: "Casa Teona",
    strada: "Strada Zamca 22",
    oras: "Suceava",
    cod: "720215",
    harta: "https://www.google.com/maps/search/?api=1&query=Strada+Zamca+22%2C+Suceava+720215",
    program: "Luni–vineri, 9:00–17:00",
    acces: "Acces gratuit, pe bază de programare",
  },
  sediuSocial: {
    nume: "Sediul social",
    strada: "Strada Nicolae Milescu nr. 7",
    oras: "Suceava",
  },
} as const;

export const CONTURI = [
  { banca: "BCR", moneda: "RON", iban: "RO16 RNCB 0234 1852 3366 0001" },
  { banca: "UniCredit Bank", moneda: "RON", iban: "RO57 BACX 0000 0021 0940 3001" },
  { banca: "UniCredit Bank", moneda: "EUR", iban: "RO30 BACX 0000 0021 0940 3002" },
] as const;

export const SMS = {
  text: "SUSTIN",
  numar: "8835",
  sumaLunara: "5 €",
  textOprire: "SUSTIN STOP",
} as const;

export const LINKURI_EXTERNE = {
  galantom: "https://ata-suceava.galantom.ro/",
  galantomZiuaTa:
    "https://dar.galantom.ro/fundraising_pages/create?id_project=2457",
} as const;

export const RETELE_ASOCIATIE = [
  { nume: "Facebook", url: "https://facebook.com/asociatia.teona.ariana" },
  { nume: "Instagram", url: "https://instagram.com/teonaariana_sv" },
  { nume: "TikTok", url: "https://tiktok.com/@teonaarianasv" },
] as const;

/**
 * Cele patru cifre din bara de rezultate. Apar identic pe prima pagină, pe
 * Despre noi și pe Redirecționează 3,5%, pentru că vin de aici.
 */
export const CIFRE = [
  { valoare: 33, sufix: "", eticheta: "tabere organizate" },
  { valoare: 1500, sufix: "+", eticheta: "participanți" },
  { valoare: 80, sufix: "+", eticheta: "copii la Casa Teona" },
  { valoare: 300, sufix: "+", eticheta: "voluntari" },
] as const;

/** Rutele site-ului. Butoanele le folosesc de aici, ca să nu existe link mort. */
export const RUTE = {
  acasa: "/",
  despre: "/despre-noi",
  casaTeona: "/casa-teona",
  proiecte: "/proiecte",
  sponsori: "/sponsori-si-parteneri",
  redirectionare35: "/redirectioneaza-3-5",
  directionare20: "/directioneaza-20",
  media: "/suntem-in-presa",
  voluntar: "/devino-voluntar",
  contact: "/contact",
  doneaza: "/doneaza",
  confidentialitate: "/politica-de-confidentialitate",
  termeni: "/termeni-si-conditii",
  cookieuri: "/politica-de-cookieuri",
  raport2025: "/raport-de-activitate-2025",
} as const;

/** Meniul principal, în ordinea cerută de caietul de sarcini (12.1). */
export const MENIU: ReadonlyArray<{
  eticheta: string;
  href?: string;
  subpagini?: ReadonlyArray<{ eticheta: string; href: string }>;
}> = [
  { eticheta: "Acasă", href: RUTE.acasa },
  { eticheta: "Despre noi", href: RUTE.despre },
  { eticheta: "Casa Teona", href: RUTE.casaTeona },
  { eticheta: "Proiecte", href: RUTE.proiecte },
  { eticheta: "Sponsori și parteneri", href: RUTE.sponsori },
  {
    eticheta: "Redirecționează",
    subpagini: [
      { eticheta: "Redirecționează 3,5%", href: RUTE.redirectionare35 },
      { eticheta: "Direcționează 20%", href: RUTE.directionare20 },
    ],
  },
  { eticheta: "Media", href: RUTE.media },
  { eticheta: "Devino voluntar", href: RUTE.voluntar },
  { eticheta: "Contact", href: RUTE.contact },
];

/** Destinațiile pentru care se poate alege o donație (2.2 din caiet). */
export const DESTINATII_DONATIE = [
  { id: "oriunde", eticheta: "Oriunde e nevoie" },
  { id: "tabere", eticheta: "Tabere" },
  { id: "casa-teona", eticheta: "Casa Teona" },
  { id: "cazuri-umanitare", eticheta: "Cazuri umanitare" },
] as const;
