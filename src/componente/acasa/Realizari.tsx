import Image from "next/image";
import { RUTE } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";

/**
 * 1.7 — „Ce am realizat împreună în ultimul an”: cinci carduri statice.
 *
 * „Fără animații” înseamnă aici exact asta: niciun card nu se ridică, nu
 * se rotește și nu-și schimbă umbra la trecerea cu mouse-ul. Pot fi însă
 * bogate: unul e portocaliu plin, două au fotografii, celelalte au numărul
 * de ordine scris mare, în culoarea lor. Cinci cutii identice cu un număr gri
 * erau exact ce a numit clientul „praf”.
 *
 * Fotografiile sunt puse doar unde știu sigur ce arată: taberele pentru copii
 * cu autism și sindrom Down din 2024 au poze în arhivă, Casa Teona la fel.
 * Pentru tabăra copiilor care au trecut prin cancer și pentru „Susținem
 * Performanța” nu există încă poze clasificate (caietul le cere de la
 * asociație), iar la cazurile umanitare nu se publică chipuri. Acolo cardul
 * își ține singur greutatea, prin culoare și cifră, nu printr-o poză care
 * ar sugera altceva decât e.
 */
const REALIZARI: ReadonlyArray<{
  titlu: string;
  text: string;
  pictograma: NumePictograma;
  poza?: { cale: string; alt: string };
}> = [
  {
    titlu: "Prima tabără pentru copii care au trecut prin cancer",
    text: "Zile de bucurie pentru copii și pentru familiile lor.",
    pictograma: "inima",
  },
  {
    titlu: "Tabăra Susținem Performanța",
    text: "Pentru copii premianți din sistemul de protecție a copilului.",
    pictograma: "stea",
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

/** Fotografia unui card, cu numărul de ordine lipit în colț. */
function Poza({
  poza,
  n,
  culoare,
  colt,
  dimensiuni,
  className,
}: {
  poza: { cale: string; alt: string } | undefined;
  n: number;
  culoare: string;
  colt: "a" | "b";
  dimensiuni: string;
  className: string;
}) {
  if (!poza) return null;
  return (
    <div className={`relative ${className}`}>
      <Image
        src={poza.cale}
        alt={poza.alt}
        fill
        sizes={dimensiuni}
        className="object-cover"
      />
      <span
        className={`colt-mic-${colt} absolute top-4 left-4 flex h-12 min-w-12 items-center justify-center px-3 text-hartie ${culoare}`}
      >
        <Numar n={n} className="text-[1.5rem]" />
      </span>
    </div>
  );
}

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

export default function Realizari() {
  const [cancer, performanta, autism, casa, umanitare] = REALIZARI;

  return (
    <section className="relative overflow-hidden bg-hartie pt-10 pb-20 lg:pt-16 lg:pb-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="spirala"
          className="pluteste-lent absolute top-14 right-[5%] size-9 text-miere-300 lg:size-12"
        />
        <Decor
          semn="stea"
          className="pluteste-lent absolute bottom-16 left-[4%] size-7 text-caramiziu-300 lg:size-10"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="scris text-amplu text-caramiziu-600">
          Impactul campaniilor noastre.
        </p>
        <h2 className="mt-2 max-w-3xl text-h2 text-cerneala">
          Ce am realizat împreună în ultimul an
        </h2>

        {/* Trei carduri pe primul rând și două, mai late, pe al doilea.
            Ordinea din caiet e ordinea din listă; se schimbă doar forma. */}
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {/* 1 — portocaliu plin: prima tabără de felul ăsta merită culoarea
              de identitate. */}
          <li className="lg:col-span-2">
            <article className="granulatie relative flex h-full min-h-[18rem] flex-col overflow-hidden colt-a bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-7 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.8)]">
              <Numar
                n={1}
                className="absolute -top-6 -right-3 text-[9rem] text-hartie/15"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-20 -left-12 size-52 rounded-full border-2 border-hartie/20"
              />
              <span className="colt-mic-b relative flex size-12 items-center justify-center bg-hartie/20 text-hartie">
                <Pictograma nume={cancer.pictograma} className="size-6" />
              </span>
              <h3 className="relative mt-auto pt-8 text-h3 text-hartie">
                {cancer.titlu}
              </h3>
              <p className="relative mt-3 text-corp text-hartie/90">
                {cancer.text}
              </p>
            </article>
          </li>

          {/* 2 — pe hârtie, cu numărul în miere, mare cât un sfert de card. */}
          <li className="lg:col-span-2">
            <article className="relative flex h-full flex-col overflow-hidden colt-b border border-hartie-umbra bg-hartie-calda p-7 shadow-[0_24px_50px_-28px_rgba(255,172,0,0.6)]">
              <Decor
                semn="stea"
                strokeWidth={0.8}
                className="absolute -top-8 -right-8 size-32 text-miere-200"
              />
              <div className="relative flex items-start justify-between gap-4">
                <span className="colt-mic-a flex size-12 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                  <Pictograma
                    nume={performanta.pictograma}
                    className="size-6"
                  />
                </span>
                <Numar n={2} className="text-[4.5rem] text-miere-400" />
              </div>
              <h3 className="relative mt-auto pt-8 text-h3 text-cerneala">
                {performanta.titlu}
              </h3>
              <p className="relative mt-3 text-corp text-cerneala-moale">
                {performanta.text}
              </p>
            </article>
          </li>

          {/* 3 — cu fotografie: atelierul din tabăra din aprilie 2024. */}
          <li className="lg:col-span-2">
            <article className="flex h-full flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-28px_rgba(42,159,163,0.55)]">
              <Poza
                poza={autism.poza}
                n={3}
                colt="b"
                culoare="bg-turcoaz-500 shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]"
                dimensiuni="(min-width: 1024px) 400px, 92vw"
                className="aspect-[16/10] w-full"
              />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="text-h4 text-cerneala">{autism.titlu}</h3>
                <p className="mt-2 text-mic text-cerneala-moale">
                  {autism.text}
                </p>
              </div>
            </article>
          </li>

          {/* 4 — lat, cu poza pe o latură: cardul se citește ca o pagină de album. */}
          <li className="lg:col-span-3">
            <article className="flex h-full flex-col overflow-hidden colt-b border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-28px_rgba(247,79,34,0.5)] lg:flex-row">
              <Poza
                poza={casa.poza}
                n={4}
                colt="a"
                culoare="bg-caramiziu-500 shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]"
                dimensiuni="(min-width: 1024px) 300px, 92vw"
                className="aspect-[16/10] w-full lg:aspect-auto lg:min-h-[15rem] lg:w-[46%]"
              />
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-7 lg:p-8">
                <span className="colt-mic-b flex size-11 items-center justify-center bg-caramiziu-100 text-caramiziu-600">
                  <Pictograma nume={casa.pictograma} className="size-6" />
                </span>
                <h3 className="mt-5 text-h3 text-cerneala">{casa.titlu}</h3>
                <p className="mt-2 text-corp text-cerneala-moale">
                  {casa.text}
                </p>
              </div>
            </article>
          </li>

          {/* 5 — fără poză (fără chipuri la cazuri umanitare), cu turcoaz calm. */}
          <li className="sm:col-span-2 lg:col-span-3">
            <article className="granulatie relative flex h-full flex-col justify-center overflow-hidden colt-a bg-turcoaz-100 p-7 shadow-[0_24px_50px_-28px_rgba(42,159,163,0.6)] lg:p-8">
              <Numar
                n={5}
                className="absolute -top-5 -right-2 text-[9rem] text-turcoaz-200/70"
              />
              <Decor
                semn="inima"
                strokeWidth={0.8}
                className="absolute -bottom-10 -left-6 size-40 text-turcoaz-200/80"
              />
              <span className="colt-mic-a relative flex size-12 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                <Pictograma nume={umanitare.pictograma} className="size-6" />
              </span>
              <h3 className="relative mt-5 text-h3 text-turcoaz-900">
                {umanitare.titlu}
              </h3>
              <p className="relative mt-2 max-w-md text-corp text-turcoaz-900/80">
                {umanitare.text}
              </p>
            </article>
          </li>
        </ol>

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
