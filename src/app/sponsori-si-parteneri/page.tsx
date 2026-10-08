import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RUTE } from "@/date/asociatie";
import { SIGLE_SPONSORI } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";

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
 */
const TESTIMONIALE_SPONSORI = [
  {
    citat:
      "Suntem recunoscători pentru oportunitatea de a putea aduce bucurie acestor copii minunați. Ne-au învățat că adevărata frumusețe a lumii se simte dincolo de cuvinte.",
    firma: "EGGER Group",
    sigla: "/poze/2024/11/05LG_EG_egger_cmyk-Small.jpg",
  },
] as const;

export default function SponsoriSiParteneri() {
  return (
    <>
      <AntetPagina
        titlu="Sponsori și parteneri"
        subtitlu="Mulțumim companiilor care ne sunt alături."
        poza={{
          cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
          alt: "Grup de copii și adulți în tabără, ținând litere care formează cuvântul „Mulțumim”",
          legenda: "Mulțumim",
        }}
      />

      {/* 6.2 */}
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Ce spun sponsorii noștri</h2>

          <ul className="grid gap-5">
            {TESTIMONIALE_SPONSORI.map((testimonial) => (
              <li key={testimonial.firma}>
                <Aparitie>
                  <figure className="colt-a relative bg-hartie-calda p-8 shadow-[0_22px_45px_-24px_rgba(247,79,34,0.5)] sm:p-10">
                    {/* Ghilimelele desenate, nu un semn de citat în text. */}
                    <span
                      aria-hidden="true"
                      className="scris absolute top-2 left-7 text-[5rem] leading-none text-caramiziu-200"
                    >
                      „
                    </span>
                    <blockquote className="relative">
                      <p className="text-h4 leading-snug text-cerneala">
                        {testimonial.citat}
                      </p>
                    </blockquote>
                    <figcaption className="mt-7 flex items-center gap-4">
                      <Image
                        src={testimonial.sigla}
                        alt=""
                        aria-hidden="true"
                        width={160}
                        height={80}
                        className="h-12 w-auto object-contain"
                      />
                      <span className="font-titlu text-amplu font-bold text-cerneala">
                        {testimonial.firma}
                      </span>
                    </figcaption>
                  </figure>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6.3 — Ne-au fost alături */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Ne-au fost alături</h2>
          <p className="mt-3 max-w-2xl text-cerneala-moale">
            Firmele care au sprijinit taberele, Casa Teona și cazurile
            umanitare. Lista crește pe măsură ce ni se alătură alte companii.
          </p>

          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SIGLE_SPONSORI.map((sigla) => (
              <li key={sigla.nume}>
                <div className="colt-mic-a flex h-full flex-col items-center justify-center gap-3 bg-hartie p-4 shadow-[0_12px_28px_-20px_rgba(35,35,35,0.5)] transition-all duration-300 ease-cald hover:-translate-y-1 hover:shadow-[0_18px_34px_-16px_rgba(247,79,34,0.4)] motion-reduce:hover:translate-y-0">
                  <div className="flex h-16 w-full items-center justify-center">
                    <Image
                      src={sigla.cale}
                      alt={`Sigla ${sigla.nume}`}
                      width={220}
                      height={110}
                      className="max-h-16 w-auto object-contain"
                    />
                  </div>
                  <span className="text-center font-titlu text-nota font-semibold text-cerneala-moale">
                    {sigla.nume}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-mic text-cerneala-slab">
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

      {/* 6.4 */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Vrei să te alături lor?</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează
            </Buton>
            <Buton href={RUTE.directionare20} varianta="contur" marime="mare">
              Pentru firme
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
