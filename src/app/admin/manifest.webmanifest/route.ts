/**
 * Manifestul aplicației „Panou Teona” — numai pentru panou.
 *
 * `scope` e `/admin/`: instalată pe telefon sau pe calculator, aplicația se
 * deschide direct în panou și nu înghite site-ul public. Linkurile spre site
 * se deschid în browser, ca orice adresă din afara aplicației.
 */

export function GET() {
  return Response.json(
    {
      // Raza e `/admin`, fără bară: `start_url` e `/admin` (Next mută `/admin/`
      // cu 308), iar o rază `/admin/` nu-l acoperea — Chrome o ignora și
      // aplicația înghițea tot site-ul public (auditul din 4 noiembrie 2026).
      id: "/admin",
      name: "Panou Asociația Teona Ariana",
      short_name: "Panou Teona",
      description: "Panoul de lucru al Asociației Teona Ariana Suceava.",
      lang: "ro",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#f4f5f7",
      theme_color: "#232323",
      icons: [
        { src: "/panou/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/panou/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/panou/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
