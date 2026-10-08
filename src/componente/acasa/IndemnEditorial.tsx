import { ASOCIATIA, RUTE } from "@/date/asociatie";
import ButonEditorial from "./ButonEditorial";
import { CONTINUT, GRILA } from "./grila";

/**
 * Închiderea primei pagini: un bloc plin, în culoarea de identitate.
 *
 * Copie locală a lui `IndemnFinal`, cu aceleași trei butoane și aceleași
 * destinații — caietul le cere identice pe toate paginile — dar fără valul
 * de deasupra și fără cercurile din fundal. Aici e singura suprafață mare de
 * portocaliu din pagină, ca un ultim afiș; ea închide, nu decorează.
 *
 * Titlul și motto-ul stau pe stânga, butoanele în coloana din dreapta,
 * sus-jos, nu unul lângă altul: trei rânduri citite ca o listă de alegeri.
 */
export default function IndemnEditorial({
  titlu = "Alege cum vrei să ajuți",
}: {
  titlu?: string;
}) {
  return (
    <section className={`${GRILA} bg-caramiziu-500 text-hartie`}>
      <div className={`${CONTINUT} grid gap-12 py-20 lg:grid-cols-12 lg:gap-8 lg:py-28`}>
        <div className="lg:col-span-7">
          <p className="scris text-h4 text-hartie/85 lg:text-h3">„{ASOCIATIA.motto}”</p>
          <h2 className="mt-4 text-afis leading-[0.98] tracking-[-0.03em] text-hartie lg:text-[5.5rem]">
            {titlu}
          </h2>
        </div>

        <ul className="flex flex-col gap-3 lg:col-span-4 lg:col-start-9 lg:self-end">
          <li>
            <ButonEditorial
              href={RUTE.doneaza}
              varianta="pe-portocaliu"
              marime="mare"
              className="w-full"
            >
              Donează
            </ButonEditorial>
          </li>
          <li>
            <ButonEditorial
              href={RUTE.voluntar}
              varianta="pe-portocaliu"
              marime="mare"
              className="w-full border-hartie/60 bg-transparent text-hartie hover:border-hartie hover:bg-hartie hover:text-caramiziu-600"
            >
              Devino voluntar
            </ButonEditorial>
          </li>
          <li>
            <ButonEditorial
              href={RUTE.directionare20}
              varianta="pe-portocaliu"
              marime="mare"
              className="w-full border-hartie/60 bg-transparent text-hartie hover:border-hartie hover:bg-hartie hover:text-caramiziu-600"
            >
              Devino partener
            </ButonEditorial>
          </li>
        </ul>
      </div>
    </section>
  );
}
