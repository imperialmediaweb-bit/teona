import Image from "next/image";
import { RUTE } from "@/date/asociatie";
import { SIGLE_PRIMA_PAGINA } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import Pictograma from "@/componente/Pictograma";

/**
 * 1.6 — „Ne susțin”: siglele sponsorilor, cu linkul spre pagina lor.
 *
 * O grilă de sigle în cutii albe e cel mai anonim lucru dintr-un site de
 * ONG. Aici, lângă sigle, stă fotografia copiilor care țin afișele „Vă
 * mulțumim” desenate de ei — e răspunsul la întrebarea „de ce ne susțin?”
 * înainte ca cineva s-o pună. Sub poză, un bloc de miere decalat, ca o
 * hârtie colorată pusă dedesubt.
 *
 * Siglele își păstrează culorile: multe sunt deja pe alb și, trecute prin
 * alb-negru, aproape dispăreau. Chenarul le dă aceeași înălțime, așa cum cere
 * caietul, fără să le deformeze.
 */

const POZA = {
  cale: "/poze/2024/11/286989555_1077194023007628_4114758998092629050_n-1024x768.jpg",
  alt: "Copii țin două afișe desenate de mână, cu „Vă mulțumim” și numele asociației, în fața unei pensiuni de lemn cu flori la ferestre",
} as const;

/** Linia colorată de sus a fiecărei cutii, în cele trei culori, pe rând. */
const LINII = ["border-t-caramiziu-400", "border-t-miere-400", "border-t-turcoaz-400"] as const;

export default function NeSustin() {
  return (
    <section className="granulatie relative overflow-hidden bg-hartie-calda pt-8 pb-24 lg:pt-12 lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor semn="soare" className="pluteste-lent absolute top-10 right-[5%] size-10 text-miere-300 lg:size-14" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <Aparitie className="lg:col-span-5">
            <div className="relative mx-auto max-w-md pt-5 pr-5 lg:max-w-none">
              {/* Blocul de miere de sub poză: decalat, ca să iasă din chenar. */}
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 bottom-8 left-8 colt-b bg-miere-300"
              />
              <Fotografie
                cale={POZA.cale}
                alt={POZA.alt}
                legenda="Vă mulțumim"
                umbra="miere"
                colt="a"
                raport="aspect-[4/3]"
                dimensiuni="(min-width: 1024px) 480px, 90vw"
              />
            </div>
          </Aparitie>

          <Aparitie intarziere={0.08} className="lg:col-span-7">
            <h2 className="text-h2 text-cerneala">Ne susțin</h2>

            <ul className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {SIGLE_PRIMA_PAGINA.map((sigla, i) => (
                <li key={sigla.nume}>
                  <div
                    className={`${i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"} flex h-20 items-center justify-center border-t-4 bg-hartie p-3 shadow-[0_14px_30px_-18px_rgba(35,35,35,0.5)] transition-all duration-400 ease-cald hover:-translate-y-1 hover:shadow-[0_18px_34px_-16px_rgba(247,79,34,0.45)] motion-reduce:hover:translate-y-0 sm:h-24 sm:p-4 ${LINII[i % 3]}`}
                  >
                    <Image
                      src={sigla.cale}
                      alt={sigla.nume}
                      width={200}
                      height={80}
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <Buton
              href={RUTE.sponsori}
              varianta="contur"
              className="mt-8"
            >
              Vezi toți sponsorii
              <Pictograma nume="sageata" className="size-4" />
            </Buton>
          </Aparitie>
        </div>
      </div>
    </section>
  );
}
