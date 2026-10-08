import Image from "next/image";

/**
 * Fotografii reale din tabere și de la Casa Teona, agățate pe o sârmă cu
 * cârlige de rufe.
 *
 * E singura secțiune fără titlu și fără buton — lasă pozele să vorbească.
 * Varianta de dinainte era o bandă care se mișca încontinuu spre stânga. Aici
 * nimic nu se mișcă: pozele atârnă pe sfoară, fiecare puțin altfel, și pe
 * telefon se derulează cu degetul. Sârma e desenată, cârligele sunt tăiate
 * din hârtie, iar pozele au rama lor albă, ca cele din erou.
 *
 * Textele alternative sunt scrise după ce m-am uitat la fiecare poză.
 */
const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg",
    alt: "O voluntară învârte un copil în brațe, pe iarbă, în fața unei clădiri de lemn din tabără; părul îi flutură în vânt",
  },
  {
    cale: "/poze/2024/11/poza2_enhanced-1.webp",
    alt: "Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde",
  },
  {
    cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
    alt: "Grup de copii și adulți în tabără, ținând litere care formează cuvântul „Mulțumim”",
  },
  {
    cale: "/poze/2024/11/339454935_239875385107246_1378022596723045576_n-1.jpg",
    alt: "Un copil se joacă pe covor cu piese colorate și creioane",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Voluntari și copii, în grup, la apus",
  },
  {
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară desenează împreună cu un copil, la masă",
  },
] as const;

/** Fiecare poză atârnă puțin altfel: înclinare și înălțime proprii. */
const AGATARI = [
  "rotate-2 mt-6",
  "-rotate-2 mt-2",
  "rotate-1 mt-8",
  "-rotate-3 mt-3",
  "rotate-2 mt-7",
  "-rotate-1 mt-4",
] as const;

export default function Sarma() {
  return (
    <section
      aria-label="Fotografii din tabere și de la Casa Teona"
      className="relative overflow-hidden bg-hartie py-10 lg:py-14"
    >
      <div className="overflow-x-auto pb-6 [scrollbar-width:thin]">
        {/* Sârma stă în același container cu pozele, ca să se deruleze cu ele. */}
        <div className="relative mx-auto flex w-max gap-6 px-6 pt-8 sm:gap-8 lg:gap-6 xl:gap-8">
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 60"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-0 h-10 w-full text-cerneala-moale/60"
          >
            <path
              d="M0 8C200 40 400 48 500 46s300-10 500-38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {FOTOGRAFII.map((fotografie, i) => (
            <figure
              key={fotografie.cale}
              // Pe ecran lat, toate șase încap pe sârmă fără derulare; pe telefon
              // sunt mai mari și se derulează cu degetul.
              className={`relative w-56 shrink-0 rounded-[5px_10px_6px_12px] bg-hartie p-2 pb-7 shadow-[0_18px_36px_-18px_rgba(35,35,35,0.35),0_2px_5px_rgba(35,35,35,0.08)] sm:w-64 lg:w-48 xl:w-52 ${AGATARI[i]}`}
            >
              {/* Cârligul de rufe, tăiat din hârtie. */}
              <span
                aria-hidden="true"
                className={`absolute -top-5 left-1/2 h-9 w-3.5 -translate-x-1/2 rounded-[3px] ${
                  i % 3 === 0
                    ? "bg-caramiziu-400"
                    : i % 3 === 1
                      ? "bg-miere-400"
                      : "bg-turcoaz-400"
                } shadow-[0_2px_3px_rgba(35,35,35,0.2)]`}
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-hartie-umbra">
                <Image
                  src={fotografie.cale}
                  alt={fotografie.alt}
                  fill
                  sizes="(min-width: 1024px) 208px, (min-width: 640px) 256px, 224px"
                  className="object-cover"
                />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
