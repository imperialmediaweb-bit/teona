import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import { Nor } from "./Ilustratii";

/**
 * Închiderea paginii, ca un apus peste dealuri.
 *
 * E varianta ilustrată a `IndemnFinal`-ului de pe celelalte pagini: aceleași
 * trei butoane, aceeași culoare de identitate, dar în loc de valul curb și
 * cercurile din fundal, soarele coboară în spatele a două dealuri tăiate din
 * hârtie portocalie. E ultima pagină a albumului; sfârșitul zilei de tabără.
 *
 * Copiată local, nu modificată în `IndemnFinal`: celelalte pagini rămân cum
 * sunt.
 */
export default function IndemnIlustrat({
  titlu = "Alege cum vrei să ajuți",
}: {
  titlu?: string;
}) {
  return (
    <div className="relative">
      {/* Apusul: cerul, soarele pe jumătate și dealurile — un singur desen,
          cu exact lățimea paginii. Dealul din față are culoarea secțiunii. */}
      <div aria-hidden="true" className="pointer-events-none relative -mb-px">
        <svg
          viewBox="0 0 1440 260"
          preserveAspectRatio="none"
          className="block h-32 w-full sm:h-44 lg:h-64"
          focusable="false"
        >
          <circle cx="1040" cy="190" r="120" className="text-miere-300" fill="currentColor" />
          <path
            className="text-caramiziu-300"
            fill="currentColor"
            d="M0 260V176c170-50 330-62 520-30 150 26 270 54 430 30 170-26 320-80 490-52v136z"
          />
          <path
            className="text-caramiziu-400"
            fill="currentColor"
            d="M0 260v-46c200-38 380-36 560-6 170 28 310 36 470 10 140-22 270-40 410-20v62z"
          />
          <path
            className="text-caramiziu-500"
            fill="currentColor"
            d="M0 260v-22c230-26 420-20 620 2 180 20 320 20 500-4 120-16 230-20 320-6v30z"
          />
        </svg>
        <Nor className="absolute top-2 left-[8%] w-32 text-hartie/40 sm:w-44 lg:top-4" />
        <Nor className="absolute top-8 right-[22%] hidden w-36 text-hartie/30 lg:block" />
      </div>

      <section className="granulatie relative overflow-hidden bg-caramiziu-500 pb-20 lg:pb-24">
        <div className="relative mx-auto max-w-4xl px-4 pt-6 text-center sm:px-6 lg:px-8 lg:pt-8">
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
    </div>
  );
}
