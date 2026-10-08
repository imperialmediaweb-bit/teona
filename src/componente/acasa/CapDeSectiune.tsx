import type { ReactNode } from "react";
import { LINIE } from "./grila";

/**
 * Capul unei secțiuni: numărul, rândul scris de mână și titlul mare.
 *
 * Toate secțiunile pornesc la fel, de la o linie trasă de-a latul paginii,
 * cu numărul secțiunii deasupra ei ca un număr de pagină dintr-o revistă.
 * Titlul ia toată lățimea de care are nevoie — e cel mai mare lucru de pe
 * ecran în momentul acela, nu un rând de douăzeci de pixeli deasupra unor
 * carduri.
 *
 * Rândul scris de mână e opțional: la 1.3 caietul cere titlul singur, fără
 * frază introductivă.
 */
export default function CapDeSectiune({
  numar,
  titlu,
  scris,
  culoareScris = "text-caramiziu-600",
  dreapta,
  className = "",
}: {
  numar: string;
  titlu: ReactNode;
  scris?: string;
  culoareScris?: string;
  /** Ce stă pe aceeași linie cu titlul, la dreapta: un link, un rând de text. */
  dreapta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`border-t ${LINIE} pt-5 ${className}`}>
      <p className="font-titlu text-nota font-bold tracking-[0.2em] text-cerneala-slab uppercase">
        {numar}
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-4xl">
          {scris && (
            <p className={`scris text-amplu lg:text-h4 ${culoareScris}`}>{scris}</p>
          )}
          <h2
            className={`text-afis leading-[0.98] tracking-[-0.03em] text-cerneala ${scris ? "mt-3" : ""}`}
          >
            {titlu}
          </h2>
        </div>
        {dreapta && <div className="shrink-0 lg:pb-2">{dreapta}</div>}
      </div>
    </header>
  );
}
