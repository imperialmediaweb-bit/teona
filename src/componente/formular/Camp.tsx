import type { ReactNode } from "react";

/**
 * Un câmp de formular: etichetă, control, notă și mesaj de eroare.
 *
 * Toate formularele site-ului (contact, voluntariat, donație) arată la fel și
 * se comportă la fel, de aici. Două lucruri sunt obligatorii prin construcție,
 * nu prin disciplină:
 *
 * - eticheta e un `<label>` legat prin `htmlFor`, nu un text pus deasupra;
 * - mesajul de eroare stă **lângă câmp** (cerut explicit la 2.2), e legat prin
 *   `aria-describedby` și marchează controlul cu `aria-invalid`, ca să fie
 *   anunțat de cititoarele de ecran, nu doar colorat în roșu.
 */

export const claseControl =
  "colt-mic-a w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp text-cerneala transition outline-none focus:border-caramiziu-400";

export const claseControlGresit =
  "colt-mic-a w-full border-2 border-caramiziu-500 bg-caramiziu-50 px-4 py-3 text-corp text-cerneala transition outline-none focus:border-caramiziu-600";

export default function Camp({
  id,
  eticheta,
  obligatoriu = false,
  nota,
  eroare,
  children,
  className = "",
}: {
  id: string;
  eticheta: string;
  obligatoriu?: boolean;
  nota?: string;
  eroare?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block font-titlu text-mic font-semibold text-cerneala"
      >
        {eticheta}{" "}
        {obligatoriu ? (
          <span className="text-caramiziu-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal text-cerneala-slab">(opțional)</span>
        )}
      </label>

      {children}

      {nota && (
        <p id={`${id}-nota`} className="mt-1.5 text-nota text-cerneala-slab">
          {nota}
        </p>
      )}

      {eroare && (
        <p
          id={`${id}-eroare`}
          className="mt-1.5 font-titlu text-mic font-semibold text-caramiziu-700"
        >
          {eroare}
        </p>
      )}
    </div>
  );
}
