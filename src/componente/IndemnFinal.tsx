import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Buton from "./Buton";
import Val from "./Val";

/**
 * „Alege cum vrei să ajuți” — cele trei butoane de la finalul paginilor.
 *
 * Caietul le cere identice pe Despre noi (3.9), Casa Teona (4.7) și la finalul
 * celorlalte pagini, cu „Devino partener” ducând peste tot la Direcționează 20%.
 * De aceea sunt într-o componentă, nu copiate de unsprezece ori.
 *
 * Închiderea nu e banda neagră cu care se termină orice șablon. E o fâșie în
 * culoarea de identitate, cu motto-ul scris de mână — ultimul lucru pe care îl
 * vede cineva care a derulat toată pagina.
 */
export default function IndemnFinal({
  titlu = "Alege cum vrei să ajuți",
}: {
  titlu?: string;
}) {
  return (
    <>
      <Val culoare="text-caramiziu-500" />
      <section className="granulatie relative overflow-hidden bg-caramiziu-500 pb-20 lg:pb-24">
        {/* Cercuri mari, abia vizibile, în loc de un fundal plat. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute -top-40 -right-24 size-[34rem] rounded-full border-2 border-hartie/15" />
          <span className="absolute -bottom-52 -left-20 size-[30rem] rounded-full border-2 border-hartie/15" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="scris text-h3 text-hartie/85">„{ASOCIATIA.motto}”</p>
          <h2 className="mt-3 text-h2 text-hartie">{titlu}</h2>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {/* Pe portocaliu, butonul portocaliu ar dispărea. Aici cel mai
                puternic contrast e albul plin. */}
            <Buton
              href={RUTE.doneaza}
              varianta="contur"
              marime="mare"
              className="border-hartie bg-hartie text-caramiziu-600 hover:border-hartie hover:text-caramiziu-700"
            >
              Donează
            </Buton>
            <Buton href={RUTE.voluntar} varianta="secundar" marime="mare">
              Devino voluntar
            </Buton>
            <Buton
              href={RUTE.directionare20}
              varianta="contur"
              marime="mare"
              className="border-hartie/50 bg-transparent text-hartie hover:border-hartie hover:bg-hartie/10 hover:text-hartie"
            >
              Devino partener
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
