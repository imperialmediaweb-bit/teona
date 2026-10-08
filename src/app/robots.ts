import type { MetadataRoute } from "next";
import { ADRESA_SITE, INDEXABIL } from "./seo";

/**
 * `robots.txt`.
 *
 * Pe domeniul final, totul e permis în afară de `/api/` (rutele formularelor
 * nu au ce căuta în rezultate). Pe orice altă adresă — cea de previzualizare
 * de pe Railway, de pildă — se interzice tot, ca Google să nu indexeze o
 * copie a site-ului înainte de lansare. Motivul întreg e la `INDEXABIL`.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABIL) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${ADRESA_SITE}/sitemap.xml`,
  };
}
