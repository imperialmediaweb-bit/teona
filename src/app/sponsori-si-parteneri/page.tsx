import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import { SIGLE_SPONSORI } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = {
  title: "Sponsori și parteneri",
  description: "Mulțumim companiilor care ne sunt alături.",
};

/**
 * 6.2 — testimonialele sponsorilor.
 *
 * Caietul dă unul singur, al EGGER Group, și spune: „Dacă sunt doar unul sau
 * două, se afișează simplu, fără carusel.” Deci e un card, nu un carusel cu un
 * singur element și săgeți care nu duc nicăieri.
 *
 * Lângă citat stă fotografia copiilor care țin literele „Mulțumim Egger”:
 * e, cuvânt cu cuvânt, răspunsul copiilor la vorbele sponsorului.
 */
const TESTIMONIALE_SPONSORI = [
  {
    citat:
      "Suntem recunoscători pentru oportunitatea de a putea aduce bucurie acestor copii minunați. Ne-au învățat că adevărata frumusețe a lumii se simte dincolo de cuvinte.",
    firma: "EGGER Group",
    sigla: "/poze/2024/11/05LG_EG_egger_cmyk-Small.jpg",
    poza: {
      cale: "/poze/2024/11/459590851_545309534736056_5697611419655887236_n.jpg",
      alt: "Copii în tricouri albe țin litere colorate care formează „Mulțumim Egger”, între două bannere ale asociației, în fața pensiunii din tabără",
      legenda: "Mulțumim, EGGER",
    },
  },
] as const;

/** Linia colorată de sus a fiecărei sigle, în cele trei culori, pe rând. */
const LINII = ["border-t-caramiziu-400", "border-t-miere-400", "border-t-turcoaz-400"] as const;

export default function SponsoriSiParteneri() {
  return (
    <>
      <AntetPagina
        scris="Împreună cu cei care cred în noi"
        titlu="Sponsori și parteneri"
        subtitlu="Mulțumim companiilor care ne sunt alături."
        accent="miere"
        poza={{
          cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
          alt: "Grup de copii și adulți în tabără, ținând litere care formează cuvântul „Mulțumim”",
          legenda: "Mulțumim",
        }}
        pozaMica={{
          cale: "/poze/2024/11/201900074_446697883239024_8848375334977008378_n-1-1.jpg",
          alt: "Copii și voluntari ridică foi cu litere care formează „Mulțumim Destine”, în fața pensiunii cu flori la ferestre",
        }}
      />

      {/* 6.2 */}
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-16 right-[4%] size-9 text-miere-300 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune scris="Ce spun cei care ne susțin" titlu="Cuvintele lor" />

          <ul className="mt-12 grid gap-10">
            {TESTIMONIALE_SPONSORI.map((testimonial, i) => (
              <li key={testimonial.firma}>
                <Aparitie>
                  <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                    <figure className="relative lg:col-span-7">
                      <div className="granulatie relative overflow-hidden colt-a bg-miere-300 p-8 shadow-[0_30px_60px_-28px_rgba(255,172,0,0.85)] sm:p-10 lg:p-12">
                        <Decor semn="inima" strokeWidth={0.8} className="absolute -right-12 -bottom-12 size-52 text-miere-200/80" />
                        {/* Ghilimelele desenate, nu un semn de citat în text. */}
                        <span
                          aria-hidden="true"
                          className="scris absolute top-1 left-7 text-[6rem] leading-none text-miere-500/70"
                        >
                          „
                        </span>
                        <blockquote className="relative pt-8">
                          <p className="font-titlu text-h4 leading-snug font-bold text-miere-900 sm:text-h3">
                            {testimonial.citat}
                          </p>
                        </blockquote>
                        <figcaption className="relative mt-8 flex items-center gap-4">
                          <span className="flex h-14 items-center colt-mic-a bg-hartie px-4 shadow-[0_12px_26px_-14px_rgba(35,35,35,0.5)]">
                            <Image
                              src={testimonial.sigla}
                              alt=""
                              aria-hidden="true"
                              width={160}
                              height={80}
                              className="h-9 w-auto object-contain"
                            />
                          </span>
                          <span className="font-titlu text-amplu font-bold text-miere-900">
                            {testimonial.firma}
                          </span>
                        </figcaption>
                      </div>
                    </figure>

                    <Fotografie
                      cale={testimonial.poza.cale}
                      alt={testimonial.poza.alt}
                      legenda={testimonial.poza.legenda}
                      umbra="caramiziu"
                      bloc="caramiziu"
                      colt={i % 2 === 0 ? "b" : "a"}
                      raport="aspect-[4/3]"
                      dimensiuni="(min-width: 1024px) 480px, 92vw"
                      className="mx-auto w-full max-w-xl lg:col-span-5 lg:max-w-none"
                    />
                  </div>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6.3 — Ne-au fost alături */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="soare" className="pluteste-lent absolute top-10 right-[5%] size-10 text-miere-300 lg:size-14" />
          <Decor semn="spirala" className="pluteste-lent absolute bottom-24 left-[3%] size-9 text-turcoaz-200 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Firmele care ne sunt alături"
            titlu="Ne-au fost alături"
            text="Firmele care au sprijinit taberele, Casa Teona și cazurile umanitare. Lista crește pe măsură ce ni se alătură alte companii."
          />

          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {SIGLE_SPONSORI.map((sigla, i) => (
              <li key={sigla.nume}>
                <Aparitie intarziere={Math.min(i % 5, 5) * 0.03} className="h-full">
                  <div
                    className={`flex h-full flex-col items-center justify-center gap-3 ${
                      i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                    } border-t-4 bg-hartie p-4 shadow-[0_14px_30px_-18px_rgba(35,35,35,0.5)] transition-all duration-500 ease-cald hover:-translate-y-1.5 hover:shadow-[0_22px_40px_-16px_rgba(247,79,34,0.4)] motion-reduce:hover:translate-y-0 ${LINII[i % 3]}`}
                  >
                    <div className="flex h-16 w-full items-center justify-center">
                      <Image
                        src={sigla.cale}
                        alt={`Sigla ${sigla.nume}`}
                        width={220}
                        height={110}
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
                    <span className="text-center font-titlu text-nota font-bold text-cerneala-moale">
                      {sigla.nume}
                    </span>
                  </div>
                </Aparitie>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-mic text-cerneala-slab">
            Instituțiile cu care lucrăm — DGASPC Suceava, spitalul județean,
            USV, Colegiul Psihologilor, Consiliul Județean — sunt pe pagina{" "}
            <Link
              href={RUTE.despre}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              Despre noi
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 6.4 — „Vrei să te alături lor?”, cu butonul Donează. Pe aceeași
          fâșie de identitate cu care se închid celelalte pagini. */}
      <Val culoare="text-caramiziu-500" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-700 pb-20 lg:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute -top-40 -right-24 size-[34rem] rounded-full border-2 border-hartie/15" />
          <span className="absolute -bottom-52 -left-20 size-[30rem] rounded-full border-2 border-hartie/15" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="scris text-h3 text-hartie/85">„{ASOCIATIA.motto}”</p>
          <h2 className="mt-3 text-h2 text-hartie">Vrei să te alături lor?</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Buton
              href={RUTE.doneaza}
              varianta="contur"
              marime="mare"
              className="border-hartie bg-hartie text-caramiziu-600 hover:border-hartie hover:text-caramiziu-700"
            >
              Donează
            </Buton>
            <Buton
              href={RUTE.directionare20}
              varianta="contur"
              marime="mare"
              className="border-hartie/50 bg-transparent text-hartie hover:border-hartie hover:bg-hartie/10 hover:text-hartie"
            >
              Pentru firme
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
