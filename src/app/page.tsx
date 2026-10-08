import type { Metadata } from "next";
import Image from "next/image";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import Erou from "@/componente/acasa/Erou";
import Sustinere from "@/componente/acasa/Sustinere";
import Campanii from "@/componente/acasa/Campanii";
import FasieDeFotografii from "@/componente/acasa/FasieDeFotografii";
import NeSustin from "@/componente/acasa/NeSustin";
import Realizari from "@/componente/acasa/Realizari";
import Testimoniale, { type Testimonial } from "@/componente/acasa/Testimoniale";
import { metadate } from "./seo";

export const metadata: Metadata = metadate({
  titlu: "Asociația Teona Ariana Suceava · ONG pentru copii cu dizabilități",
  titluAbsolut: true,
  descriere:
    "Tabere RESPIRO, Casa Teona și sprijin pentru copiii cu autism, sindrom Down sau alte nevoi speciale și familiile lor, în Suceava. Donează sau fii voluntar.",
  cale: "/",
});

/**
 * Valul dintre secțiuni se trage peste capătul secțiunii de deasupra.
 *
 * Fără asta, partea transparentă a curbei lasă să se vadă fundalul paginii
 * (alb), nu culoarea secțiunii de sus — și între două secțiuni colorate
 * apărea o pană albă. Secțiunile de deasupra au spațiu jos cât înălțimea
 * valului, ca nimic din conținut să nu intre sub el.
 */
const VAL_PESTE = "relative z-10 -mt-10 sm:-mt-14 lg:-mt-20";

const PUNCTE_CASA: ReadonlyArray<{ text: string; pictograma: NumePictograma }> = [
  { text: "Joacă și activități adaptate fiecărui copil", pictograma: "joaca" },
  { text: "Sprijin pentru întreaga familie", pictograma: "familie" },
];

function citesteTestimoniale(): Testimonial[] {
  return JSON.parse(
    readFileSync(join(process.cwd(), "continut", "testimoniale.json"), "utf8"),
  );
}

/*
  Liniile scrise de mână de deasupra titlurilor sunt textele de pe prima
  pagină a site-ului vechi, nu formulări noi. Caietul dictează titlurile și
  textele secțiunilor; aceste rânduri stau doar unde el nu spune nimic.

  Secțiunile mari (1.3, 1.4, 1.6, 1.7) au fiecare componenta ei în
  `componente/acasa/`: pagina rămâne lizibilă, iar fiecare secțiune își ține
  fotografiile și motivele lângă ea.
*/
export default function PrimaPagina() {
  const testimoniale = citesteTestimoniale();

  return (
    <>
      <Erou />

      {/* 1.2 — bara cu cifre, fără titlu. Cifrele stau într-un panou care
          iese peste marginea curbă a eroului, nu într-o fâșie goală de alb:
          așa pagina nu se „rupe” după fotografie, ci continuă. */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="bg-hartie pb-4 lg:pb-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultatele noastre</h2>
          <div className="granulatie relative z-20 -mt-6 colt-a border border-hartie-umbra bg-hartie px-5 py-10 shadow-[0_34px_70px_-30px_rgba(247,79,34,0.45)] sm:-mt-10 lg:-mt-16 lg:px-12 lg:py-12">
            <Decor semn="unda" className="absolute top-4 right-6 size-8 text-miere-300 lg:size-10" />
            <Decor semn="stea" className="absolute bottom-4 left-6 size-6 text-caramiziu-200 lg:size-8" />
            <Cifre />
          </div>
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții */}
      <Sustinere />

      {/* 1.4 — Campaniile noastre */}
      <Val culoare="text-tenta-cald" className={VAL_PESTE} />
      <Campanii />

      {/* 1.5 — Casa Teona */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-10 pb-24 lg:pt-16 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="soare" className="pluteste-lent absolute top-12 left-[3%] size-9 text-miere-300 lg:size-12" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Aparitie>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Un bloc turcoaz, decalat sub poze: pozele nu mai plutesc
                  pe alb, ci stau pe ceva. */}
              <span
                aria-hidden="true"
                className="absolute -top-5 -left-5 h-[70%] w-[62%] colt-b bg-turcoaz-100"
              />
              <Fotografie
                cale="/poze/2024/11/poza2_enhanced-1.webp"
                alt="Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde"
                legenda="Casa Teona"
                umbra="turcoaz"
                colt="a"
                raport="aspect-[4/5]"
                dimensiuni="(min-width: 1024px) 420px, 88vw"
                className="w-[80%]"
              />
              {/* Clădirea, mai mică, suprapusă — ca o poză pusă peste alta. */}
              <div className="absolute right-0 bottom-6 w-[44%]">
                <div className="relative aspect-square overflow-hidden colt-b border-[6px] border-hartie bg-hartie shadow-[0_20px_40px_-18px_rgba(255,172,0,0.7)]">
                  <Image
                    src="/poze/2024/11/poza3_enhanced.webp"
                    alt="Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării"
                    fill
                    sizes="(min-width: 1024px) 240px, 44vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </Aparitie>

          <Aparitie intarziere={0.1}>
            <p className="scris text-amplu text-turcoaz-700">
              Ne dedicăm îmbunătățirii calității vieții copiilor cu nevoi speciale.
            </p>
            <h2 className="mt-2 text-h2 text-cerneala">Casa Teona</h2>

            <ul className="mt-8 grid gap-4">
              {PUNCTE_CASA.map((punct, i) => (
                <li
                  key={punct.text}
                  className={`${i % 2 === 0 ? "colt-a" : "colt-b"} flex items-center gap-4 border border-turcoaz-100 bg-turcoaz-50 p-4 shadow-[0_16px_32px_-20px_rgba(42,159,163,0.9)] sm:p-5`}
                >
                  <span className={`${i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"} flex size-12 shrink-0 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]`}>
                    <Pictograma nume={punct.pictograma} className="size-6" />
                  </span>
                  <span className="font-titlu text-amplu font-bold text-cerneala">{punct.text}</span>
                </li>
              ))}
            </ul>

            <Buton href={RUTE.casaTeona} className="mt-9">
              Află mai multe
              <span className="sr-only">despre Casa Teona</span>
            </Buton>
          </Aparitie>
        </div>
      </section>

      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <FasieDeFotografii />

      {/* 1.6 — Ne susțin. Pe aceeași hârtie caldă ca fâșia de deasupra. */}
      <NeSustin />

      {/* 1.7 — Ce am realizat împreună în ultimul an */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <Realizari />

      {/* 1.8 — nu se randează cât timp asociația nu ne trimite testimonialele. */}
      <Testimoniale testimoniale={testimoniale} />

      <IndemnFinal titlu="Dăruiește timp, dăruiește speranță!" />
    </>
  );
}
