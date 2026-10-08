"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";

/**
 * Fotografii reale din tabere și de la Casa Teona, într-o bandă care se mișcă
 * încet spre stânga.
 *
 * E singura secțiune fără titlu și fără buton — lasă pozele să vorbească.
 * Asociația are 220 de fotografii reale; până acum, prima pagină nu arăta
 * aproape niciuna.
 *
 * Mișcarea e CSS pur, nu JavaScript: nu consumă nimic la derulare și se oprește
 * singură la `prefers-reduced-motion`, unde banda devine o galerie derulabilă
 * cu degetul.
 */

const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n-1.webp",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură",
  },
  {
    cale: "/poze/2024/11/poza2_enhanced-1.webp",
    alt: "Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde",
  },
  {
    cale: "/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg",
    alt: "Un copil sare în aer pe iarbă, cu părul în vânt",
  },
  {
    cale: "/poze/2024/11/poza1_enhanced-1.webp",
    alt: "Un copil arată copăcelul din hârtie cu frunze verzi făcut la atelierul creativ",
  },
  {
    cale: "/poze/2024/11/412883312_386434367290241_7393749290576299021_n.jpg",
    alt: "Copii și adulți la o petrecere, într-o sală decorată",
  },
  {
    cale: "/poze/2024/11/339454935_239875385107246_1378022596723045576_n-1.jpg",
    alt: "Un copil se joacă pe covor cu piese colorate și creioane",
  },
  {
    cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
    alt: "Grup de copii și adulți în tabără, ținând litere care formează cuvântul „Mulțumim”",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Voluntari și copii, în grup, la apus",
  },
  {
    cale: "/poze/2024/11/144023475_332382214670592_1377571819752151730_n.jpg",
    alt: "Doi copii cu un tort, la o aniversare",
  },
  {
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară desenează împreună cu un copil, la masă",
  },
] as const;

export default function FasieDeFotografii() {
  const fara_miscare = useReducedMotion();

  // Lista e dublată, cap la cap, ca animația să se reia fără salt. Copia e
  // ascunsă de cititoarele de ecran, ca să nu se audă de două ori.
  const banda = [
    ...FOTOGRAFII.map((f) => ({ ...f, copie: false })),
    ...FOTOGRAFII.map((f) => ({ ...f, copie: true })),
  ];

  return (
    <section
      aria-label="Fotografii din tabere și de la Casa Teona"
      className="granulatie relative overflow-hidden bg-caramiziu-900 py-8"
    >
      {/* Marginile se sting în fundal, ca banda să nu pară tăiată cu cuțitul. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-caramiziu-900 to-transparent sm:w-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-caramiziu-900 to-transparent sm:w-28"
      />
      <div
        className={
          fara_miscare
            ? "flex snap-x gap-4 overflow-x-auto px-4 pb-3"
            : "group flex w-max gap-4 [animation:deplasare_70s_linear_infinite] hover:[animation-play-state:paused]"
        }
      >
        {banda.map((fotografie, i) => (
          <figure
            key={`${fotografie.cale}-${i}`}
            aria-hidden={fotografie.copie || undefined}
            // Înălțimi alternate și colțuri decupate: o bandă de dreptunghiuri
            // egale e un carusel de șablon, nu un album.
            className={`relative shrink-0 snap-start overflow-hidden ${
              i % 2 === 0
                ? "colt-a h-48 w-72 sm:h-64 sm:w-96"
                : "colt-b mt-6 h-40 w-60 sm:h-52 sm:w-80"
            }`}
          >
            <Image
              src={fotografie.cale}
              alt={fotografie.copie ? "" : fotografie.alt}
              // Copia e decorativă: `alt=""` singur arată ca o scăpare, așa că
              // o marcăm și explicit, și pentru verificarea de dinainte de
              // publicare, care altfel o semnalează pe bună dreptate.
              aria-hidden={fotografie.copie || undefined}
              fill
              sizes="(min-width: 640px) 384px, 288px"
              className="object-cover"
            />
          </figure>
        ))}
      </div>

      <style>{`
        @keyframes deplasare {
          from { transform: translate3d(0, 0, 0); }
          /* Jumătate, fiindcă lista e dublată: acolo imaginea se repetă exact. */
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </section>
  );
}
