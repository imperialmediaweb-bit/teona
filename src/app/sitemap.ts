import type { MetadataRoute } from "next";
import { RUTE } from "@/date/asociatie";
import { proiecteAfisate } from "@/date/proiecte";
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

  const proiecte = proiecteAfisate().map((proiect) => ({
    url: `${ADRESA_SITE}/proiecte/${proiect.slug}`,
  }));

  return [...pagini, ...proiecte];
}
