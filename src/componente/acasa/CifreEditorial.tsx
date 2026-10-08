import { CIFRE } from "@/date/asociatie";
import { LINIE } from "./grila";

/** 1.500 se scrie cu punct în română; 33 și 80 rămân cum sunt. */
const formateaza = new Intl.NumberFormat("ro-RO").format;

/**
 * Liniile dintre celule, pe telefon (două pe rând) și pe ecran lat (patru).
 * Fiecare celulă își trage singură linia din stânga și de sus, ca să nu
 * apară linii duble unde se întâlnesc două.
 */
const POZITII = [
  "pr-6 lg:pr-10",
  "border-l pl-6 lg:pl-10",
  "border-t pr-6 lg:border-t-0 lg:border-l lg:pr-10 lg:pl-10",
  "border-l border-t pl-6 lg:border-t-0 lg:pl-10",
] as const;

/**
 * Bara cu cifre (1.2), ca un tabel dintr-un raport anual tipărit.
 *
 * Patru coloane despărțite de linii subțiri, cifra uriașă în cerneală,
 * eticheta mică dedesubt. Nu numără de la zero: aici cifrele stau nemișcate,
 * ca pe hârtie. Pe prima pagină tot ce se mișcă trebuie să merite, iar un
 * contor care aleargă nu spune nimic în plus față de cifra scrisă.
 *
 * Fără JavaScript în browser: componenta e randată pe server, din aceleași
 * date pe care le citesc și Despre noi și Redirecționează 3,5%.
 *
 * Semnul „+” e singurul lucru colorat: el spune „cel puțin atât”, și e
 * singurul loc în care cifra face o promisiune — de aceea poartă culoarea
 * de identitate.
 */
export default function CifreEditorial() {
  return (
    <ul className={`grid grid-cols-2 border-t border-b ${LINIE} lg:grid-cols-4`}>
      {CIFRE.map((cifra, i) => (
        <li
          key={cifra.eticheta}
          className={`py-8 lg:py-12 ${LINIE} ${POZITII[i]}`}
        >
          <p className="font-titlu text-[clamp(3.25rem,11vw,4.25rem)] leading-none font-extrabold tracking-[-0.05em] text-cerneala tabular-nums lg:text-[4.75rem] xl:text-[5.25rem]">
            {formateaza(cifra.valoare)}
            {cifra.sufix && (
              <span className="text-caramiziu-500">{cifra.sufix}</span>
            )}
          </p>
          <p className="mt-4 font-titlu text-nota font-bold tracking-[0.16em] text-cerneala-moale uppercase sm:text-mic">
            {cifra.eticheta}
          </p>
        </li>
      ))}
    </ul>
  );
}
