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

/*
  `/api/` — rutele formularelor. `/admin/` — zona de verificare a campaniilor.
  `/ziua-ta/` — paginile personale de campanie: fiecare are deja `noindex` în
  metadate, dar sunt pagini despre oameni, iar regula asta le ține în afara
  căutărilor și dacă cineva uită vreodată metadata. Distribuirea pe Facebook
  nu e afectată: rețelele citesc `og:`, nu `robots.txt`.
*/
const INTERZISE = ["/api/", "/admin/", "/ziua-ta/"];

/**
 * Roboții care alimentează răspunsurile din ChatGPT, Claude, Perplexity și
 * din rezumatele AI ale Google.
 *
 * **Grupul ăsta nu schimbă nimic funcțional.** Regula `*` de mai jos le
 * permite deja tot, iar un robot care nu-și găsește numele cade pe ea. Există
 * din două motive practice:
 *
 * 1. E răspunsul scris la întrebarea „are voie ChatGPT să citească site-ul?”.
 *    Oricine deschide `robots.txt` vede decizia, nu trebuie s-o deducă.
 * 2. Dacă vreodată asociația vrea să oprească antrenarea pe conținutul ei,
 *    se schimbă `allow` în `disallow` aici, pe un rând, fără să atingă
 *    regula pentru motoarele de căutare obișnuite.
 *
 * Grupul repetă lista de interziceri: un robot care-și găsește numele într-un
 * grup propriu **nu mai citește** grupul `*`. Fără repetare, ChatGPT ar avea
 * voie în `/admin/`, iar Google nu.
 *
 * Decizia e „da, au voie”, pentru că scopul e să fie găsită asociația. Un om
 * care întreabă un model „cui pot dona pentru copii cu autism în Suceava”
 * trebuie să primească răspunsul corect, cu IBAN-ul corect. Prețul e că
 * aceleași modele se antrenează pe text și pe fotografii — inclusiv pe
 * fotografii cu copii, publicate cu acordul părinților. Dacă asociația
 * preferă altfel, vezi punctul 2.
 *
 * Lista e scurtă intenționat: doar roboții documentați public de cei care îi
 * trimit. Cei care nu respectă `robots.txt` oricum nu se opresc dintr-un
 * fișier text.
 */
const ROBOTI_AI = [
  // OpenAI: antrenare, căutare în ChatGPT, și cererea făcută când un om
  // întreabă despre o pagină anume.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic: antrenare, căutare, cerere pornită de un om.
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity.
  "PerplexityBot",
  "Perplexity-User",
  // Google: `Google-Extended` nu e un robot separat, e comutatorul pentru
  // Gemini. Indexarea obișnuită și rezumatele AI din rezultate țin de
  // Googlebot, deci de regula `*`.
  "Google-Extended",
  // Apple (Siri, rezumatele din Safari) și Meta.
  "Applebot-Extended",
  "meta-externalagent",
  // Common Crawl: arhiva publică din care învață aproape toate modelele.
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABIL) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: INTERZISE },
      { userAgent: ROBOTI_AI, allow: "/", disallow: INTERZISE },
    ],
    sitemap: `${ADRESA_SITE}/sitemap.xml`,
  };
}
