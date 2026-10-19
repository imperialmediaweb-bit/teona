import { FRAZELE_LOR, REGULI } from "@/lib/ton-asociatie";

/**
 * „Cum scriem" — frazele asociației și ce se vede în ele.
 *
 * **De ce stă lângă câmp, și nu într-un fișier de instrucțiuni.** Nimeni nu
 * deschide un ghid de scris înainte să scrie o noutate. Caseta asta e lângă
 * locul unde se scrie, închisă, și se deschide dintr-o apăsare — ca regulile
 * de la testimoniale, care stau deasupra câmpului.
 *
 * **Frazele sunt ale lor.** Nu sunt un exemplu compus de mine: sunt cele două
 * texte scrise de asociație în documentul din 16 octombrie. De aceea caseta
 * are rost și pentru mine: când adaug o pagină, scriu după ele, nu după cum
 * îmi vine.
 *
 * `deschis` o lasă desfăcută la un text nou, când omul n-a scris încă nimic,
 * și strânsă la unul la care se întoarce.
 */
export default function CumScriem({ deschis = false }: { deschis?: boolean }) {
  return (
    <details
      open={deschis}
      className="mb-7 max-w-3xl colt-mic-a border-t-4 border-miere-400 bg-hartie-calda p-5"
    >
      <summary className="cursor-pointer font-titlu font-bold text-cerneala">
        Cum scriem
        <span className="ml-2 font-normal text-mic text-cerneala-slab">
          — cele două fraze scrise de voi, și ce se vede în ele
        </span>
      </summary>

      <div className="mt-4 grid gap-4">
        {FRAZELE_LOR.map((f) => (
          <blockquote
            key={f.unde}
            className="border-l-4 border-miere-300 pl-4 text-amplu text-cerneala"
          >
            {f.text}
            <footer className="mt-1 text-nota text-cerneala-slab">
              {f.unde}
            </footer>
          </blockquote>
        ))}

        <ul className="grid gap-2 text-mic text-cerneala-moale">
          {REGULI.map((r) => (
            <li key={r.regula}>
              <strong className="font-titlu font-bold text-cerneala">
                {r.regula}.
              </strong>{" "}
              {r.lamurire}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
