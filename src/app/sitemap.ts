import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { RUTE } from "@/date/asociatie";
import { pozeleProiectului, proiecteleToate } from "@/date/proiecte";
import { listaCuPozeDinCloud } from "@/date/proiecte-cloud";
import { areBazaDeDate } from "@/lib/baza";
import { FELURI, textePublicate } from "@/lib/texte";
import { adresaPentruDistribuire } from "@/lib/poza-urcata";
import { adresaPublica } from "@/lib/cloud";
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
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
    Se reface din oră în oră.

    Fără asta, fișierul se naște o dată, la construire, și rămâne așa: o
    noutate publicată din panou marți n-ar ajunge în sitemap până la
    următoarea publicare de cod. Cu `cacheComponents` pornit, `revalidate` ca
    export de rută nu e permis — `cacheLife` e felul în care se cere același
    lucru.
  */
  "use cache";
  cacheLife("hours");

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
  const proiecte = (await listaCuPozeDinCloud(await proiecteleToate())).map(
    (proiect) => {
      const poze = pozeleProiectului(proiect);
      return {
        url: `${ADRESA_SITE}/proiecte/${proiect.slug}`,
        ...(poze.length
          ? {
              // `adresaPublica` lasă căile din `public/` așa cum sunt și
              // transformă pozele din Cloudinary în adresa lor completă —
              // altfel ar fi promise pe domeniul nostru, unde nu există.
              images: poze.map((cale) => {
                const adresa = adresaPublica(cale);
                return adresa.startsWith("http")
                  ? adresa
                  : `${ADRESA_SITE}${adresa}`;
              }),
            }
          : {}),
      };
    },
  );

  /*
    Noutățile și campaniile scrise din panou.

    Nu sunt în cod, deci nu pot fi știute la construire: se citesc din baza de
    date. Fără bază de date — în dezvoltare, de pildă — sitemapul rămâne cel
    al paginilor fixe, în loc să cadă cu totul.
  */
  const scrise = areBazaDeDate()
    ? (
        await Promise.all(
          FELURI.map(async (fel) => {
            const texte = await textePublicate(fel.id, 500).catch(() => []);
            return texte.map((text) => ({
              url: `${ADRESA_SITE}${fel.cale}/${text.slug}`,
              ...(text.publicatLa
                ? { lastModified: new Date(text.publicatLa) }
                : {}),
              ...(text.poza
                ? { images: [adresaPentruDistribuire(text.poza.id)] }
                : {}),
            }));
          }),
        )
      ).flat()
    : [];

  return [...pagini, ...proiecte, ...scrise];
}
