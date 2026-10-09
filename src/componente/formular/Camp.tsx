import type { ReactNode } from "react";
import Pictograma, { type NumePictograma } from "../Pictograma";

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
 *
 * Tot de aici vin bifa (`Bifa`) și alegerile în carduri (`Optiuni`). Sunt
 * controale native — `<input type="checkbox">`, `<input type="radio">` — cu
 * aspect de card, nu carduri care imită un control: tastatura, cititorul de
 * ecran și `FormData` le văd ca pe orice bifă sau alegere.
 */

export const claseControl =
  "colt-mic-a w-full min-h-12 border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp text-cerneala transition-colors duration-200 outline-none placeholder:text-cerneala-slab focus:border-caramiziu-400 focus:bg-caramiziu-50/40";

export const claseControlGresit =
  "colt-mic-a w-full min-h-12 border-2 border-caramiziu-500 bg-caramiziu-50 px-4 py-3 text-corp text-cerneala transition-colors duration-200 outline-none focus:border-caramiziu-600";

/** Butonul principal al unui formular. */
export const claseButonTrimite =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-caramiziu-500 px-8 py-3.5 font-titlu font-semibold text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:bg-caramiziu-600 disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:hover:translate-y-0";

/** Butonul secundar: „Înapoi”. */
export const claseButonInapoi =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-cerneala/15 bg-hartie px-6 py-3 font-titlu font-semibold text-cerneala transition-all duration-200 ease-cald hover:border-caramiziu-500 hover:text-caramiziu-600";

export function Eroare({ id, text }: { id?: string; text?: string }) {
  if (!text) return null;
  return (
    <p
      id={id}
      className="mt-2 flex items-start gap-2 font-titlu text-mic font-semibold text-caramiziu-700"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-caramiziu-500 text-[0.65rem] text-hartie"
      >
        !
      </span>
      {text}
    </p>
  );
}

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
        className="mb-2 block font-titlu text-mic font-bold text-cerneala"
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
        <p id={`${id}-nota`} className="mt-2 text-nota text-cerneala-slab">
          {nota}
        </p>
      )}

      <Eroare id={`${id}-eroare`} text={eroare} />
    </div>
  );
}

/**
 * O bifă cu aspect de card. Zona de apăsat e tot cardul, deci cel puțin
 * 44 px pe înălțime — o bifă de 16 px e greu de nimerit cu degetul.
 */
export function Bifa({
  name,
  value = "da",
  children,
  obligatoriu = false,
  eroare,
  defaultChecked,
  className = "",
}: {
  name: string;
  value?: string;
  children: ReactNode;
  obligatoriu?: boolean;
  eroare?: string;
  defaultChecked?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        className={`flex min-h-12 cursor-pointer items-start gap-3 colt-mic-b border-2 px-4 py-3 text-mic text-cerneala-moale transition-colors duration-200 has-checked:border-turcoaz-400 has-checked:bg-turcoaz-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-caramiziu-500 ${
          eroare
            ? "border-caramiziu-500 bg-caramiziu-50"
            : "border-hartie-umbra bg-hartie"
        }`}
      >
        <input
          name={name}
          value={value}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-invalid={Boolean(eroare)}
          className="mt-0.5 size-5 shrink-0 accent-turcoaz-600"
        />
        <span>
          {children}
          {obligatoriu && (
            <>
              {" "}
              <span className="text-caramiziu-600" aria-hidden="true">
                *
              </span>
            </>
          )}
        </span>
      </label>
      <Eroare text={eroare} />
    </div>
  );
}

/**
 * Alegeri în carduri: un `<fieldset>` cu butoane radio. Cardul ales se
 * colorează; cel cu focalizare primește inelul site-ului. Fără JavaScript.
 */
export function Optiuni({
  name,
  legenda,
  optiuni,
  defaultValue,
  obligatoriu = false,
  nota,
  coloane = 2,
  className = "",
}: {
  name: string;
  legenda: string;
  optiuni: ReadonlyArray<{
    valoare: string;
    eticheta: string;
    descriere?: string;
    pictograma?: NumePictograma;
  }>;
  defaultValue?: string;
  obligatoriu?: boolean;
  nota?: string;
  coloane?: 2 | 3;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 font-titlu text-mic font-bold text-cerneala">
        {legenda}{" "}
        {obligatoriu ? (
          <span className="text-caramiziu-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal text-cerneala-slab">(opțional)</span>
        )}
      </legend>
      <div
        className={`grid gap-2.5 ${
          coloane === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {optiuni.map((optiune, i) => (
          <label
            key={optiune.valoare}
            className={`flex min-h-12 cursor-pointer items-center gap-3 ${
              i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
            } border-2 border-hartie-umbra bg-hartie px-4 py-3 transition-colors duration-200 hover:border-caramiziu-300 has-checked:border-caramiziu-500 has-checked:bg-caramiziu-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-caramiziu-500`}
          >
            <input
              type="radio"
              name={name}
              value={optiune.valoare}
              defaultChecked={defaultValue === optiune.valoare}
              className="size-5 shrink-0 accent-caramiziu-500"
            />
            {optiune.pictograma && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-caramiziu-100 text-caramiziu-600">
                <Pictograma nume={optiune.pictograma} className="size-5" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-titlu text-corp font-bold text-cerneala">
                {optiune.eticheta}
              </span>
              {optiune.descriere && (
                <span className="block text-nota text-cerneala-moale">
                  {optiune.descriere}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      {nota && <p className="mt-2 text-nota text-cerneala-slab">{nota}</p>}
    </fieldset>
  );
}
