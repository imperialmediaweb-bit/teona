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

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

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
