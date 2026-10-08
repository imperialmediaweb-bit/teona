import Pictograma from "../Pictograma";

export type Intrebare = { intrebare: string; raspuns: React.ReactNode };

/**
 * Întrebările frecvente (2.5, 7.7, 8.5).
 *
 * Făcute cu `<details>`/`<summary>`, nu cu stare în JavaScript. Trei motive,
 * toate practice: se deschid și fără JavaScript, cititoarele de ecran le
 * anunță corect din start, iar căutarea în pagină cu Ctrl+F găsește și
 * răspunsurile închise — browserele moderne deschid singure acordeonul când
 * textul căutat e înăuntru. O variantă scrisă de mână pierde toate trei.
 */
export default function Intrebari({
  titlu = "Întrebări frecvente",
  intrebari,
}: {
  titlu?: string;
  intrebari: ReadonlyArray<Intrebare>;
}) {
  return (
    <section className="bg-hartie pb-20 lg:pb-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-h2 text-cerneala">{titlu}</h2>

        <ul className="mt-10 grid gap-3">
          {intrebari.map((item, i) => (
            <li key={item.intrebare}>
              <details
                className={`group ${i % 2 === 0 ? "colt-a" : "colt-b"} bg-hartie-calda px-6 py-5 shadow-[0_14px_32px_-22px_rgba(35,35,35,0.5)] transition-shadow duration-300 ease-cald open:shadow-[0_18px_38px_-20px_rgba(247,79,34,0.35)]`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-titlu text-amplu font-bold text-cerneala marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.intrebare}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-caramiziu-100 text-caramiziu-600 transition-transform duration-300 ease-cald group-open:rotate-90">
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </summary>
                <div className="mt-4 grid gap-3 text-cerneala-moale">
                  {item.raspuns}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
