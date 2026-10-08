/**
 * Grila primei pagini: douăsprezece coloane între două margini elastice.
 *
 * Toată pagina stă pe aceeași grilă, ca într-o revistă tipărită: textul
 * începe de la o linie de coloană și se oprește la alta, iar fotografiile
 * pot ieși până la marginea ecranului fără să părăsească grila — intră pur și
 * simplu în coloana marginii.
 *
 * Coloanele din mijloc cresc până la 76rem împreună (cât `max-w-7xl` fără
 * spațiul lateral); marginile iau restul, dar nu coboară sub spațiul de
 * siguranță al telefonului. Așa conținutul se aliniază cu meniul și cu
 * subsolul, care folosesc `max-w-7xl` cu `px-4/6/8`.
 *
 * Numerotarea coloanelor în `col-start`/`col-end`:
 *   1       — marginea din stânga
 *   2 … 13  — cele douăsprezece coloane de conținut
 *   14      — marginea din dreapta (se termină la 15)
 */
export const GRILA =
  "grid grid-cols-[minmax(1rem,1fr)_repeat(12,minmax(0,6.3333rem))_minmax(1rem,1fr)] sm:grid-cols-[minmax(1.5rem,1fr)_repeat(12,minmax(0,6.3333rem))_minmax(1.5rem,1fr)] lg:grid-cols-[minmax(2rem,1fr)_repeat(12,minmax(0,6.3333rem))_minmax(2rem,1fr)]";

/** Toată lățimea de conținut, între cele două margini. */
export const CONTINUT = "col-start-2 col-end-14";

/** Linia subțire care ține pagina: cerneală la 15%, niciodată mai groasă. */
export const LINIE = "border-cerneala/15";
