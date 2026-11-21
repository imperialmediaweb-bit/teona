import Image from "next/image";
import { RUTE } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import { proiecteleToate } from "@/date/proiecte";
import { cuPozeDinCloud } from "@/date/proiecte-cloud";
import Carusel from "@/componente/Carusel";
import IlustratieUmanitara from "./IlustratieUmanitara";

/**
 * 1.7 — „Ce am realizat împreună în ultimul an”: cinci carduri statice.
 *
 * „Fără animații” înseamnă aici exact asta: niciun card nu se ridică și nu-și
 * schimbă umbra la trecerea cu mouse-ul.
 *
 * Toate cinci au aceeași formă: fotografia sus, cu numărul lipit în colț,
 * apoi titlul și fraza. Fotografiile vin din proiectul despre care vorbește
 * cardul: pentru tabăra copiilor care au trecut prin cancer și pentru
 * „Susținem Performanța”, coperta din folderul lor din Cloudinary (`slug`);
 * pentru autism și Casa Teona, poze din arhivă. Cazurile umanitare n-au
 * fotografie publicabilă (fără chipuri, cere caietul), deci au ilustrația.
 * Un proiect fără nicio poză încă primește și el ilustrația, nu un gol.
 */
const REALIZARI: ReadonlyArray<{
  titlu: string;
  text: string;
  pictograma: NumePictograma;
  poza?: { cale: string; alt: string };
  /** Proiectul din care se ia coperta, când poza nu e scrisă aici. */
  slug?: string;
}> = [
  {
    titlu: "Prima tabără pentru copii care au trecut prin cancer",
    text: "Zile de bucurie pentru copii și pentru familiile lor.",
    pictograma: "inima",
    slug: "respiro-impreuna-a-32-a-tabara-septembrie-2026",
  },
  {
    titlu: "Tabăra Susținem Performanța",
    text: "Pentru copii premianți din sistemul de protecție a copilului.",
    pictograma: "stea",
    slug: "tabara-respiro-sustinem-performanta-iulie-2026",
  },
  {
    titlu: "Două tabere pentru copii cu autism și sindrom Down",
    text: "Tabere dedicate, cu activități adaptate nevoilor lor.",
    pictograma: "infinit",
    // Tabăra din aprilie 2024, una dintre cele două.
    poza: {
      cale: "/poze/2024/11/438814270_2663080130535965_2029375574315086726_n-766x1024.jpg",
      alt: "Copii și voluntari, la o masă plină cu hârtie creponată colorată, carioci și boluri, la un atelier creativ din tabără",
    },
  },
  {
    titlu: "Peste 80 de copii la Casa Teona",
    text: "Ludoterapie, activități, minipetreceri de ziua lor, joacă și socializare.",
    pictograma: "joaca",
    poza: {
      cale: "/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.17.jpeg",
      alt: "Copii fac brățări din mărgele la o masă, lângă o fată în tricoul asociației, în sala cu pictura din junglă de la Casa Teona",
    },
  },
  {
    titlu: "Cazuri umanitare",
    text: "Sprijin medical, ajutor pentru familii în nevoie și donații de laptopuri.",
    pictograma: "maini",
  },
];

function Numar({ n, className }: { n: number; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`font-titlu leading-none font-extrabold tracking-tight ${className}`}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

const CULORI = [
  {
    numar:
      "bg-caramiziu-700 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]",
    umbra: "shadow-[0_24px_50px_-28px_rgba(247,79,34,0.55)]",
    pictograma: "bg-caramiziu-100 text-caramiziu-700",
  },
  {
    numar:
      "bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]",
    umbra: "shadow-[0_24px_50px_-28px_rgba(255,172,0,0.6)]",
    pictograma: "bg-miere-100 text-miere-800",
  },
  {
    numar:
      "bg-turcoaz-600 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]",
    umbra: "shadow-[0_24px_50px_-28px_rgba(42,159,163,0.55)]",
    pictograma: "bg-turcoaz-100 text-turcoaz-700",
  },
] as const;

/** Coperta proiectului, cu un text alternativ care spune de unde e. */
async function copertaProiectului(
  slug: string | undefined,
): Promise<{ cale: string; alt: string } | undefined> {
  if (!slug) return undefined;
  const proiect = (await proiecteleToate()).find((p) => p.slug === slug);
  if (!proiect) return undefined;
  const cuPoze = await cuPozeDinCloud(proiect);
  return cuPoze.coperta
    ? { cale: cuPoze.coperta, alt: `Fotografie din ${cuPoze.titlu}` }
    : undefined;
}

export default async function Realizari() {
  const carduri = await Promise.all(
    REALIZARI.map(async (r) => ({
      ...r,
      poza: r.poza ?? (await copertaProiectului(r.slug)),
    })),
  );

  return (
    <section className="relative overflow-hidden bg-hartie pt-10 pb-20 lg:pt-16 lg:pb-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="spirala"
          className="pluteste-lent absolute top-14 right-[5%] size-12 text-miere-300 hidden opacity-50 md:block"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="scris text-amplu text-caramiziu-700">
          Impactul campaniilor noastre.
        </p>
        <h2 className="mt-2 max-w-3xl text-h2 text-cerneala">
          Ce am realizat împreună în ultimul an
        </h2>

        {/* Trei carduri pe primul rând și două, mai late, pe al doilea.
            Ordinea din caiet e ordinea din listă. */}
        <Carusel
          ordonata
          eticheta="Ce am realizat împreună"
          className="mt-12 gap-4 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-6"
        >
          {carduri.map((card, i) => {
            const c = CULORI[i % CULORI.length];
            const lat = i >= 3;
            return (
              <li
                key={card.titlu}
                className={
                  i === 4
                    ? "md:col-span-2 lg:col-span-3"
                    : lat
                      ? "lg:col-span-3"
                      : "lg:col-span-2"
                }
              >
                <article
                  className={`flex h-full flex-col overflow-hidden ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } border border-hartie-umbra bg-hartie ${c.umbra}`}
                >
                  <div
                    className={`relative w-full ${lat ? "aspect-[16/9]" : "aspect-[16/10]"}`}
                  >
                    {card.poza ? (
                      <Image
                        src={card.poza.cale}
                        alt={card.poza.alt}
                        fill
                        sizes={
                          lat
                            ? "(min-width: 1024px) 600px, 92vw"
                            : "(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
                        }
                        quality={86}
                        className="object-cover"
                      />
                    ) : (
                      <IlustratieUmanitara />
                    )}
                    <span
                      className={`${i % 2 === 0 ? "colt-mic-b" : "colt-mic-a"} absolute top-4 left-4 flex h-12 min-w-12 items-center justify-center px-3 ${c.numar}`}
                    >
                      <Numar n={i + 1} className="text-[1.5rem]" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <span
                      className={`${i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"} flex size-11 items-center justify-center ${c.pictograma}`}
                    >
                      <Pictograma nume={card.pictograma} className="size-6" />
                    </span>
                    <h3 className="mt-4 text-h4 text-cerneala">{card.titlu}</h3>
                    <p className="mt-2 text-corp text-cerneala-moale">
                      {card.text}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </Carusel>

        {/* „Sub carduri: butonul Vezi toate proiectele” (1.7). */}
        <div className="mt-12 text-center">
          <Buton href={RUTE.proiecte} varianta="secundar" marime="mare">
            Vezi toate proiectele
          </Buton>
        </div>
      </div>
    </section>
  );
}
