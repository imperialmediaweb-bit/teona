import Image from "next/image";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";

/**
 * 1.4 — trei campanii fixe, fără sume, fără bare de progres și fără termene.
 *
 * Fiecare campanie e o fotografie cu un card de text tras peste marginea ei
 * de jos, ca o etichetă lipită peste poză — nu o poză cu un text așezat
 * cuminte dedesubt. Taberele, prima campanie, ocupă jumătate din rând:
 * trei coloane egale arătau ca trei cutii din același șablon.
 *
 * „Cazuri umanitare” nu are fotografie: caietul cere o imagine fără chipuri
 * recognoscibile, iar în arhiva preluată nu există una verificată. Locul ei
 * îl ține motto-ul, pe miere.
 */
const CAMPANII: ReadonlyArray<{
  titlu: string;
  text: string;
  destinatie: string;
  poza?: { cale: string; alt: string; legenda: string };
}> = [
  {
    titlu: "Tabere pentru copii și părinți",
    text: "Zile de joacă, liniște și sprijin pentru copiii cu nevoi speciale sau care au trecut prin cancer și familiile lor.",
    destinatie: "tabere",
    poza: {
      cale: "/poze/2024/11/438127627_457431750190502_3491066331294449444_n.jpg",
      alt: "Copii, părinți și voluntari în tricouri albe, în fața pensiunii din tabăra RESPIRO, sub un cer cu nori albi",
      legenda: "Tabăra RESPIRO",
    },
  },
  {
    titlu: "Casa Teona",
    text: "Un loc în care copiii învață prin joacă, iar părinții găsesc consiliere și sprijin.",
    destinatie: "casa-teona",
    poza: {
      cale: "/poze/2024/11/poza1_enhanced-1.webp",
      alt: "Un copil arată copăcelul din hârtie cu frunze verzi pe care l-a făcut la un atelier de la Casa Teona",
      legenda: "Atelier creativ",
    },
  },
  {
    titlu: "Cazuri umanitare",
    text: "Ajutăm copii și familii în situații grele, acolo unde nevoia e urgentă.",
    destinatie: "cazuri-umanitare",
  },
];

/** Umbra fotografiei, în culoarea accentului: una gri ar părea murdară pe cald. */
const UMBRE = [
  "shadow-[0_26px_52px_-22px_rgba(247,79,34,0.6)]",
  "shadow-[0_26px_52px_-22px_rgba(42,159,163,0.55)]",
  "shadow-[0_26px_52px_-22px_rgba(255,172,0,0.6)]",
] as const;

export default function Campanii() {
  return (
    <section className="granulatie relative overflow-hidden bg-tenta-cald pt-10 pb-28 lg:pt-16 lg:pb-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="stea"
          className="pluteste-lent absolute top-16 right-[7%] size-8 text-caramiziu-300 lg:size-11"
        />
        <Decor
          semn="unda"
          className="pluteste-lent absolute bottom-28 left-[4%] size-10 text-miere-300 lg:size-14"
        />
        <Decor
          semn="soare"
          className="pluteste-lent absolute top-1/3 right-[2%] hidden size-14 text-miere-200 lg:block"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="scris text-amplu text-caramiziu-600">
          Schimbăm vieți, construim speranță.
        </p>
        <h2 className="mt-2 max-w-2xl text-h2 text-cerneala">
          Campaniile noastre
        </h2>

        <ul className="mt-14 grid gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-12">
          {CAMPANII.map((campanie, i) => {
            const mare = i === 0;
            return (
              <li
                key={campanie.titlu}
                className={
                  mare ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3"
                }
              >
                <Aparitie intarziere={i * 0.07} className="h-full">
                  <article className="group flex h-full flex-col">
                    <div
                      className={`relative overflow-hidden ${i % 2 === 0 ? "colt-a" : "colt-b"} bg-hartie-calda transition-transform duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0 ${
                        mare
                          ? "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10]"
                          : "aspect-[4/3] lg:aspect-[4/5]"
                      } ${UMBRE[i]}`}
                    >
                      {campanie.poza ? (
                        <>
                          <Image
                            src={campanie.poza.cale}
                            alt={campanie.poza.alt}
                            fill
                            sizes={
                              mare
                                ? "(min-width: 1024px) 620px, 92vw"
                                : "(min-width: 1024px) 300px, (min-width: 640px) 46vw, 92vw"
                            }
                            className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                          />
                          {/* Legenda stă sus, nu jos: jos vine cardul de text. */}
                          <span className="absolute top-4 left-4 rounded-full bg-caramiziu-500 px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
                            <span className="scris text-corp leading-none text-hartie">
                              {campanie.poza.legenda}
                            </span>
                          </span>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-miere-100">
                          <Decor
                            semn="inima"
                            strokeWidth={0.9}
                            className="absolute -right-14 -bottom-12 size-64 text-miere-300"
                          />
                          <Decor
                            semn="stea"
                            className="absolute top-8 left-8 size-10 text-caramiziu-300"
                          />
                          <Decor
                            semn="soare"
                            className="absolute top-16 right-10 size-12 text-miere-400"
                          />
                          <div className="relative flex size-full items-center justify-center px-8">
                            <p className="scris text-center text-h3 leading-tight text-caramiziu-700">
                              „{ASOCIATIA.motto}”
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cardul de text, tras peste poză. Marginile laterale îl
                        fac mai îngust decât poza, ca ea să rămână vizibilă pe
                        laturi: altfel ar fi doar o poză cu un chenar sub ea. */}
                    <div
                      className={`relative z-10 -mt-12 mr-4 ml-4 flex flex-1 flex-col ${i % 2 === 0 ? "colt-b" : "colt-a"} border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_48px_-26px_rgba(35,35,35,0.5)] sm:mr-6 sm:ml-6 ${
                        mare ? "lg:mr-10 lg:ml-10 lg:p-8" : ""
                      }`}
                    >
                      <h3
                        className={`text-cerneala ${mare ? "text-h3" : "text-h4"}`}
                      >
                        {campanie.titlu}
                      </h3>
                      <p
                        className={`mt-2 flex-1 text-cerneala-moale ${mare ? "max-w-lg text-corp" : "text-mic"}`}
                      >
                        {campanie.text}
                      </p>
                      <Buton
                        href={`${RUTE.doneaza}?destinatie=${campanie.destinatie}`}
                        varianta={mare ? "principal" : "contur"}
                        marime={mare ? "normal" : "mic"}
                        className="mt-5 self-start"
                      >
                        Susține
                      </Buton>
                    </div>
                  </article>
                </Aparitie>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
