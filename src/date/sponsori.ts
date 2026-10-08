/**
 * Siglele sponsorilor și ale partenerilor instituționali.
 *
 * Fiecare siglă are un nume, citit de pe fișier sau de pe siglă. O siglă fără
 * nume n-are ce căuta pe pagină: textul alternativ ar fi „siglă de sponsor”,
 * ceea ce nu spune nimic nimănui, și n-am avea ce scrie sub ea.
 *
 * Două curățenii făcute aici, nu pe pagină:
 *
 * 1. Grila veche conținea **14 sigle demo ale temei Risehand**
 *    (`brand-dark-1-1.png` … `brand-white-7-1.png`). Nu erau sponsori ai
 *    asociației, ci firme inventate care vin cu șablonul. Fișierele au fost
 *    deja șterse din depozit; aici nu se mai întorc.
 * 2. Instituțiile (Consiliul Județean Suceava) stăteau amestecate printre
 *    sponsori. Caietul cere la 6.3 ca ele să nu apară pe pagina Sponsori, ci
 *    pe Despre noi — deci sunt într-o listă separată.
 *
 * Caietul cere de la asociație „siglele și adresele sponsorilor”. Când vin,
 * fiecare intrare primește și `adresa`, iar sigla devine link.
 */
export type Sigla = {
  nume: string;
  cale: string;
  /** Site-ul firmei, când îl primim de la asociație. */
  adresa?: string;
};

export const SIGLE_SPONSORI: ReadonlyArray<Sigla> = [
  { nume: "EGGER", cale: "/poze/2024/11/05LG_EG_egger_cmyk-Small.jpg" },
  {
    nume: "nolte Küchen",
    cale: "/poze/2024/11/WhatsApp-Image-2024-10-25-at-11.42.15.jpeg",
  },
  {
    nume: "Sab Clean",
    cale: "/poze/2024/11/452416396_122103578816434704_6686589108493791862_n.jpg",
  },
  {
    nume: "FD Figurina",
    cale: "/poze/2024/11/333042059_897342214910553_1125039654881115746_n.jpg",
  },
  {
    nume: "Copilul din Soare",
    cale: "/poze/2024/11/308670940_449656227198245_5309278592595544474_n.png",
  },
  {
    nume: "Rocast Nord",
    cale: "/poze/2024/11/305967823_494038079397459_503575458591392637_n.png",
  },
  {
    nume: "Dasmar Termo",
    cale: "/poze/2024/11/291279579_5288997921221101_1835757406614018145_n.jpg",
  },
  {
    nume: "Best Distribution",
    cale: "/poze/2024/11/Best-Distribution-logo-cu-alb-blending-2-copy.png",
  },
  {
    nume: "Bukowina Gerüstbau",
    cale: "/poze/2024/11/BUKOWINA-GERUSTBAU-1.png",
  },
  { nume: "General Electric", cale: "/poze/2024/11/GENERAL-ELECTRIC.png" },
  { nume: "IT Cont Group", cale: "/poze/2024/11/IT-CONT-GROUP.png" },
  { nume: "Estrella Nord", cale: "/poze/2024/11/logo-estrella-nord.png" },
  {
    nume: "Eve și Cran",
    cale: "/poze/2024/11/logo-evesicran-final-transparent.png",
  },
  // Citite de pe siglă: pe site-ul vechi, fișierele se numeau
  // „Captura-de-ecran-2024-10-25-…” și „Screenshot_…”.
  {
    nume: "Destine Broker de Asigurare",
    cale: "/poze/2024/11/Captura-de-ecran-2024-10-25-154244.png",
  },
  {
    nume: "Romfour",
    cale: "/poze/2024/11/Captura-de-ecran-2024-10-25-111639.png",
  },
  {
    nume: "Thermo Deluxe",
    cale: "/poze/2024/11/Captura-de-ecran-2024-10-25-105859.png",
  },
  {
    nume: "Tarsin",
    cale: "/poze/2024/11/Captura-de-ecran-2024-10-25-105352.png",
  },
  {
    nume: "Eurospeed",
    cale: "/poze/2024/11/Captura-de-ecran-2024-10-25-110258.png",
  },
  { nume: "Fundația Umanitară ASSIST", cale: "/poze/2024/11/WhiteNo.png" },
  { nume: "Lusek", cale: "/poze/2024/11/LUSEK.jpg" },
  { nume: "Yulidey Spedition", cale: "/poze/2024/11/Screenshot_51.png" },
  {
    nume: "Sonic Comunicații & Securitate",
    cale: "/poze/2024/11/Screenshot_52.png",
  },
  { nume: "AutoDel", cale: "/poze/2024/11/Screenshot_54.png" },
  { nume: "Netcom Activ", cale: "/poze/2024/11/Screenshot_55.png" },
  { nume: "Marelvi", cale: "/poze/2024/11/Screenshot_56.png" },
  { nume: "Electroaxa", cale: "/poze/2024/11/Screenshot_1.png" },
  { nume: "Taco Loco", cale: "/poze/2024/11/TacoLocoLogo-1.jpg" },
  { nume: "Sistem Conect", cale: "/poze/2024/11/Sigla-Sistem-Conect.jpg" },
  { nume: "Mangusta", cale: "/poze/2024/11/logo-mangusta-1.jpg" },
  { nume: "Oskar Shop", cale: "/poze/2024/11/logo-oskar-versiune-mare.jpg" },
];

/**
 * Siglele pe care prima pagină le arată în banda „Ne susțin” (1.6).
 *
 * Grila completă rămâne pe pagina Sponsori și parteneri; pe prima pagină intră
 * primele paisprezece, cât să umple două rânduri fără să împingă restul
 * paginii în jos.
 */
export const SIGLE_PRIMA_PAGINA = SIGLE_SPONSORI.slice(0, 14);

/**
 * Partenerii instituționali (3.7) — pe pagina Despre noi, nu pe Sponsori.
 *
 * Doar Consiliul Județean Suceava are siglă în arhiva preluată. Restul apar cu
 * numele, până primim siglele și adresele de la asociație.
 */
export const PARTENERI_INSTITUTIONALI: ReadonlyArray<Sigla> = [
  {
    nume: "Consiliul Județean Suceava",
    cale: "/poze/2024/11/273840958_255539003431803_4458284824664985562_n.jpg",
  },
];

export const PARTENERI_FARA_SIGLA = [
  "DGASPC Suceava",
  "Spitalul Județean de Urgență „Sfântul Ioan cel Nou” Suceava",
  "Colegiul Psihologilor din România (COPSI)",
  "Universitatea „Ștefan cel Mare” din Suceava",
] as const;
