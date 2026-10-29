import type { NextConfig } from "next";
import { REDIRECTIONARI } from "./src/date/redirectionari";
import { redirectionariProiecte } from "./src/lib/redirectionari-proiecte.mjs";

/**
 * Cloudinary e folosit doar dacă e configurat.
 *
 * Alegerea se face aici, nu în încărcător, dintr-un motiv practic: când
 * `images.loader` e „custom”, Next **nu mai servește deloc** ruta proprie
 * `/_next/image`. Un încărcător care ar vrea să cadă înapoi pe ea ar cere o
 * adresă care nu există, și toate pozele ar da 404.
 *
 * Așa:
 *   · cu `CLOUDINARY_CLOUD_NAME` setat -> pozele vin din Cloudinary,
 *     redimensionate de ei;
 *   · fără -> optimizatorul propriu al lui Next, ca înainte.
 *
 * Ștergerea variabilei readuce site-ul pe fișierele locale, fără modificări
 * de cod.
 */
const cloudinary = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();

/**
 * Antetele de securitate, pe fiecare răspuns.
 *
 * Site-ul cere date personale (contact, voluntariat, donații) și încorporează
 * formularul de la formular230.ro, unde oamenii scriu CNP și adresă. Antetele
 * de aici nu apără datele din formularul lor — acelea stau în iframe-ul lor,
 * sub politica lor — dar apără pagina **în jurul** lui: să nu poată fi pusă
 * într-un cadru pe alt site (phishing cu adresa noastră în spate), să nu
 * încarce scripturi de altundeva și să nu vorbească HTTP niciodată.
 *
 * Politica de conținut (CSP) e scrisă după ce am verificat în browser ce
 * încarcă scriptul de la formular230.ro: scriptul însuși, o foaie de stil
 * (`/erp/deploy/client.css`) și un iframe către `/share/<id>/form`. De aceea
 * domeniul lor apare la `script-src`, `style-src` și `frame-src`, și nicăieri
 * altundeva.
 *
 * Două concesii, amândouă deliberate:
 *
 * - `'unsafe-inline'` la **scripturi**: Next.js pune în pagină scripturi
 *   inline (datele componentelor serverului, `self.__next_f.push(...)`).
 *   Singura cale curată de a le permite fără `'unsafe-inline'` e un nonce
 *   generat la fiecare cerere, în `src/proxy.ts`, ceea ce înseamnă că nicio
 *   pagină nu mai poate fi prerandată static — fiecare vizită ar fi randată
 *   pe loc. E o decizie de arhitectură, nu de audit: până se ia, site-ul nu
 *   randează nicăieri conținut scris de vizitatori ca HTML. Folosește
 *   `dangerouslySetInnerHTML` în trei locuri, toate cu conținut făcut de noi:
 *   datele structurate JSON-LD (`seo.tsx`, `layout.tsx`, cu `<` scăpat) și
 *   codul QR din panou (SVG generat de bibliotecă, din linkul nostru). Deci
 *   nu are prin ce să intre un script străin. Celelalte directive rămân în vigoare: scripturi doar de la noi
 *   și de la formular230.ro, nimic în `<object>`, fără `<base>` străin.
 * - `'unsafe-inline'` la **stiluri**: React scrie atribute `style="..."` pe
 *   elemente (animațiile din `motion`, lățimile calculate), iar scriptul de
 *   la formular230.ro setează `style.display` și `z-index` direct. Un nonce
 *   nu se poate pune pe atribute. Riscul unui stil inline injectat e mic (nu
 *   rulează cod) și nu există loc prin care să intre.
 *
 * `'unsafe-eval'` apare **doar** în dezvoltare: `next dev` îl cere pentru
 * reîncărcarea la cald. În producție nu e.
 *
 * Imaginile de pe Cloudinary sunt permise numai când Cloudinary e configurat —
 * aceeași condiție ca pentru încărcător, mai sus.
 */
const dezvoltare = process.env.NODE_ENV === "development";
const FORMULAR230 = "https://formular230.ro";

/*
  Google Analytics, pornit doar cu acord (vezi `src/componente/Analitice.tsx`).

  Domeniile stau în politică tot timpul, nu doar când cineva a bifat: politica
  pleacă într-un antet, la fiecare cerere, iar antetul nu poate ști ce a bifat
  vizitatorul. Permisiunea nu încarcă nimic singură — scriptul intră în pagină
  doar după acord.
*/
const GOOGLE_SCRIPT = "https://www.googletagmanager.com";
const GOOGLE_DATE =
  "https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com";

/*
  Statisticile Cloudflare (Web Analytics), puse în pagină de Cloudflare, nu de
  noi: proxy-ul lipește scriptul la sfârșitul fiecărei pagini. Fără ele în
  politică, browserul îl refuza și scria o eroare în consolă la fiecare
  vizită — eroare pe care Lighthouse o numără la „bune practici”. Nu pune
  cookie-uri și nu urmărește omul între site-uri, deci nu atârnă de acord.
  Dacă statisticile se opresc din Cloudflare, rândul ăsta nu mai face nimic.
*/
const CLOUDFLARE_STATISTICI = "https://static.cloudflareinsights.com";
const CLOUDFLARE_DATE = "https://cloudflareinsights.com";

const politicaDeContinut = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dezvoltare ? " 'unsafe-eval'" : ""} ${FORMULAR230} ${GOOGLE_SCRIPT} ${CLOUDFLARE_STATISTICI}`,
  `style-src 'self' 'unsafe-inline' ${FORMULAR230}`,
  // `data:` pentru fundalurile SVG din CSS și pentru pozele neclare de
  // încărcare ale lui `next/image`; `blob:` pentru previzualizări locale.
  `img-src 'self' data: blob:${cloudinary ? " https://res.cloudinary.com" : ""} ${GOOGLE_DATE}`,
  // Fonturile vin de pe domeniul nostru, prin `next/font`. Dacă aici ar
  // trebui vreodată adăugat Google Fonts, înseamnă că s-a stricat ceva.
  "font-src 'self'",
  `connect-src 'self'${dezvoltare ? " ws: wss:" : ""} ${GOOGLE_DATE} ${CLOUDFLARE_DATE}`,
  `frame-src ${FORMULAR230}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self'",
].join("; ");

const ANTETE_DE_SECURITATE = [
  { key: "Content-Security-Policy", value: politicaDeContinut },
  // Doi ani, cu subdomeniile. `preload` se adaugă după lansare, când site-ul
  // nou e pe domeniul final și s-a verificat că totul e pe HTTPS: odată
  // intrat în lista de preîncărcare a browserelor, nu mai iese cu una, cu două.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Adresa completă a paginii nu pleacă spre alte domenii: linkurile din
  // „Suntem în presă” și cele spre rețele primesc doar domeniul nostru.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Dublează `frame-ancestors`, pentru browserele vechi.
  { key: "X-Frame-Options", value: "DENY" },
  // Site-ul nu folosește niciunul dintre senzori; le închidem, ca niciun
  // script — al nostru sau al formular230.ro — să nu le poată cere.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()",
  },
  // Ferestrele deschise cu `target="_blank"` nu mai primesc nicio legătură
  // înapoi la fereastra noastră, chiar dacă vreun link ar uita `noopener`.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // `X-Powered-By: Next.js` spunea fiecărui vizitator ce rulează pe server.
  // Nu e un secret mare, dar e o informație gratuită pentru cine caută
  // versiuni vulnerabile.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/(.*)", headers: ANTETE_DE_SECURITATE }];
  },

  /*
    Calitatea la care se comprimă fotografiile.

    Next comprimă implicit la 75. Pentru un site în care fotografia e
    conținutul — copii în tabără, Casa Teona, oameni —, 75 în WebP netezește
    tocmai detaliul care contează: firele de păr, textura hainelor, ochii.
    La mărimile mari de pe ecranele dese se vede ca o ceață fină peste toată
    pagina, iar cine o vede nu zice „e comprimată", zice „arată ieftin".

    86 costă vreo 40% mai mulți octeți pe fotografiile mari și opresc acolo:
    peste 90, WebP crește repede fără să se mai vadă diferența.

    Lista trebuie scrisă aici: din Next 15.4 orice calitate necerută explicit
    e refuzată, ca să nu poată cineva cere 100 pentru fiecare poză dintr-o
    adresă și să încarce serverul. 75 rămâne în listă pentru pictograme și
    sigle, unde nu se vede oricum.
  */
  images: cloudinary
    ? {
        loader: "custom",
        loaderFile: "./src/lib/incarcator-imagini.ts",
        qualities: [75, 86],
      }
    : { qualities: [75, 86] },

  env: {
    // Încărcătorul rulează și în browser, deci numele contului trebuie să fie
    // o variabilă publică. Nu e un secret: apare în fiecare adresă de imagine.
    // Cheia și secretul rămân doar pe server și nu sunt folosite de site — ele
    // trebuie doar ca să urci sau să listezi fișiere.
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloudinary,
    NEXT_PUBLIC_CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER ?? "Teona",
  },

  /**
   * Adresele vechi de pe teona-ariana.ro, redirecționate permanent.
   * Lista și motivele sunt în `src/date/redirectionari.ts`.
   * Adresele de proiect (`/portfolio/...`) se rezolvă în cod, nu aici.
   */
  async redirects() {
    const reguli = [...REDIRECTIONARI, ...redirectionariProiecte()].map(
      ({ de_la, la }) => ({ source: de_la, destination: la, permanent: true }),
    );

    // Pagina de verificare a aniversărilor s-a numit „campanii" până când
    // campaniile asociației au ajuns și ele în panou. Semnul de carte al
    // cuiva nu trebuie să se rupă pentru asta.
    reguli.push({
      source: "/admin/campanii",
      destination: "/admin/aniversari",
      permanent: false,
    });

    // Ultima, după cele punctuale: orice altă adresă veche de proiect duce la
    // lista de proiecte, nu la 404.
    reguli.push({
      source: "/portfolio/:slug*",
      destination: "/proiecte",
      permanent: true,
    });

    return reguli;
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
