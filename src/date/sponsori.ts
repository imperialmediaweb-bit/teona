/**
 * Siglele sponsorilor pentru banda „Ne susțin” (1.6).
 *
 * Aici sunt doar siglele al căror nume îl putem citi din fișier sau din siglă.
 * Pagina Sponsori și parteneri păstrează grila completă.
 *
 * Restul fișierelor de pe pagina veche sunt capturi de ecran („Captura-de-ecran-
 * 2024-10-25-…”) din care nu se poate deduce cu certitudine firma. Caietul de
 * sarcini cere oricum de la asociație „siglele și adresele sponsorilor” — când
 * vin, se adaugă aici, cu numele și adresa fiecăruia.
 */
export type Sigla = {
  nume: string;
  cale: string;
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
];
