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
