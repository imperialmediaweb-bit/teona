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
 * Banda stă pe hârtie caldă, nu pe portocaliu închis ca înainte: fundalul
 * întunecat le stingea culorile și era aceeași nuanță cafenie pe care
 * clientul a respins-o la erou. Pe deschis, pozele rămân în culorile lor.
 *
 * Mișcarea e CSS pur, nu JavaScript: nu consumă nimic la derulare și se oprește
 * singură la `prefers-reduced-motion`, unde banda devine o galerie derulabilă
 * cu degetul. 90 de secunde pe un ciclu: se simte că se mișcă, nu că fuge.
 */

const FOTOGRAFII = [
  {
    // Originalul nedeformat; varianta `-1.webp` era întinsă pe lățime.
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură",
  },
  {
    cale: "/poze/2024/11/poza2_enhanced-1.webp",
    alt: "Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde",
  },
  {
    cale: "/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg",
    // Textul vechi spunea că un copil sare în aer. Nu: o voluntară îl
    // învârte în brațe. Corectat după ce m-am uitat la poză.
    alt: "O voluntară învârte un copil în brațe, pe iarbă, în fața unei clădiri de lemn din tabără; părul îi flutură în vânt",
  },
  {
    cale: "/poze/2024/11/poza1_enhanced-1.webp",
    alt: "Un copil arată copăcelul din hârtie cu frunze verzi făcut la atelierul creativ",
  },
  {
    cale: "/poze/2024/11/412883312_386434367290241_7393749290576299021_n.jpg",
    alt: "Voluntari în veste albe cu sigla asociației, într-o cameră modestă, alături de o familie cu copii mici și pungi cu daruri",
  },
  {
    cale: "/poze/2024/11/339454935_239875385107246_1378022596723045576_n-1.jpg",
    alt: "O fetiță îl sărută pe obraz pe un băiețel; stau pe covor, între bețișoare colorate, un puzzle cu forme și cuburi",
  },
  {
    cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
    alt: "Copii și adulți în tricouri EGGER țin litere care formează „Mulțumim Egger”, în fața unui hambar de lemn negru cu o lună aurie și textul „Love you to the moon and back”",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Opt voluntari tineri, în veste albe cu sigla asociației, în grup, la apus",
  },
  {
    cale: "/poze/2024/11/144023475_332382214670592_1377571819752151730_n.jpg",
    alt: "Două fetițe țin în brațe cadouri împachetate în hârtie de Crăciun, pe o canapea, acasă",
  },
  {
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară stă la masă lângă un băiețel care ține creioane colorate deasupra unui desen",
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
      className="granulatie relative overflow-hidden bg-hartie-calda py-10 lg:py-14"
    >
      {/* Marginile se sting în fundal, ca banda să nu pară tăiată cu cuțitul. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-hartie-calda to-transparent sm:w-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-hartie-calda to-transparent sm:w-28"
      />
      <div
        className={
          fara_miscare
            ? "flex snap-x gap-5 overflow-x-auto px-4 pb-3"
            : "group flex w-max gap-5 [animation:deplasare_90s_linear_infinite] hover:[animation-play-state:paused]"
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
                ? "colt-a h-52 w-72 shadow-[0_18px_36px_-20px_rgba(247,79,34,0.45)] sm:h-72 sm:w-[26rem]"
                : "colt-b mt-8 h-44 w-60 shadow-[0_18px_36px_-20px_rgba(255,172,0,0.5)] sm:h-60 sm:w-80"
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
              sizes="(min-width: 640px) 416px, 288px"
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
