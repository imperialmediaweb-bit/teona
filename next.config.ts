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
 *   randează nicăieri conținut scris de vizitatori și nu folosește
 *   `dangerouslySetInnerHTML`, deci nu are prin ce să intre un script
 *   străin. Celelalte directive rămân în vigoare: scripturi doar de la noi
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

const politicaDeContinut = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dezvoltare ? " 'unsafe-eval'" : ""} ${FORMULAR230}`,
  `style-src 'self' 'unsafe-inline' ${FORMULAR230}`,
  // `data:` pentru fundalurile SVG din CSS și pentru pozele neclare de
  // încărcare ale lui `next/image`; `blob:` pentru previzualizări locale.
  `img-src 'self' data: blob:${cloudinary ? " https://res.cloudinary.com" : ""}`,
  // Fonturile vin de pe domeniul nostru, prin `next/font`. Dacă aici ar
  // trebui vreodată adăugat Google Fonts, înseamnă că s-a stricat ceva.
  "font-src 'self'",
  `connect-src 'self'${dezvoltare ? " ws: wss:" : ""}`,
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

  images: cloudinary
    ? { loader: "custom", loaderFile: "./src/lib/incarcator-imagini.ts" }
    : {},

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
