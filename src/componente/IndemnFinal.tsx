import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Buton from "./Buton";
import SemnAripa from "./SemnAripa";

/**
 * „Alege cum vrei să ajuți” — cele trei butoane de la finalul paginilor.
 *
 * Caietul le cere identice pe Despre noi (3.9), Casa Teona (4.7) și la finalul
 * celorlalte pagini, cu „Devino partener” ducând peste tot la Direcționează 20%.
 * De aceea sunt într-o componentă, nu copiate de unsprezece ori.
 */
export default function IndemnFinal({
  titlu = "Alege cum vrei să ajuți",
}: {
  titlu?: string;
}) {
  return (
    <section className="granulatie relative overflow-hidden bg-cerneala py-20 lg:py-24">
      <SemnAripa className="-bottom-24 -left-16 h-80 w-80 lg:h-[28rem] lg:w-[28rem]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="scris text-h3 text-miere-300">„{ASOCIATIA.motto}”</p>
        <h2 className="mt-4 text-h2 text-hartie">{titlu}</h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Buton href={RUTE.doneaza} marime="mare">
            Donează
          </Buton>
          <Buton href={RUTE.voluntar} varianta="secundar" marime="mare">
            Devino voluntar
          </Buton>
          <Buton href={RUTE.directionare20} varianta="contur" marime="mare">
            Devino partener
          </Buton>
        </div>
      </div>
    </section>
  );
}
