import type { MetadataRoute } from "next";
import { RUTE } from "@/date/asociatie";
import { pozeleProiectului, proiecteAfisate } from "@/date/proiecte";
import { ADRESA_SITE } from "./seo";

/**
 * `sitemap.xml`: toate paginile publice, plus câte o intrare pentru fiecare
 * proiect, din aceeași listă din care se generează și paginile lor.
 *
 * Fără `lastModified`: data unui proiect e data taberei, nu data la care s-a
 * schimbat pagina, iar o dată inventată face Google să ignore tot fișierul.
 * Fără `priority` și `changeFrequency`: Google le ignoră oricum.
 *
 * Pagina 404 nu intră; e marcată `noindex` în `not-found.tsx`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /*
    Pagina de mulțumire e `noindex` — se ajunge la ea doar după o plată. O
    adresă `noindex` trecută în sitemap e un semnal contradictoriu pentru
    Google: o dată îi spunem „uite-o”, apoi „n-o indexa”.
  */
  const pagini = Object.values(RUTE)
    .filter((cale) => cale !== RUTE.multumim)
    .map((cale) => ({ url: `${ADRESA_SITE}${cale}` }));

  /*
    Fotografiile, declarate pe pagina pe care se află.

    Taberele se caută cu ochii: un părinte scrie „tabără copii autism” și se
    uită la imagini. Pozele sunt pe paginile de proiect, câte 1–20 pe fiecare,
    iar aici îi spunem lui Google unde să le găsească, cu adresa fișierului
    din `public/poze/` — nu cu cea prin `/_next/image`, care se naște la prima
    cerere și are lățimea în adresă.

    Numai paginile de proiect primesc poze în sitemap, pentru că numai pentru
    ele lista se poate calcula din date (`pozeleProiectului`, aceeași funcție
    care randează galeria). Pozele din prima pagină, din Casa Teona sau din
    Despre noi sunt alese în componente, iar o listă scrisă de mână aici ar
    promite pe o pagină poze care nu sunt pe ea.
  */
  const proiecte = proiecteAfisate().map((proiect) => {
    const poze = pozeleProiectului(proiect);
    return {
      url: `${ADRESA_SITE}/proiecte/${proiect.slug}`,
      ...(poze.length
        ? { images: poze.map((cale) => `${ADRESA_SITE}${cale}`) }
        : {}),
    };
  });

  return [...pagini, ...proiecte];
}
