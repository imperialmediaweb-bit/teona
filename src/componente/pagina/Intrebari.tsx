import Image from "next/image";
import Decor from "../Decor";
import Pictograma from "../Pictograma";
import TitluSectiune from "./TitluSectiune";

export type Intrebare = { intrebare: string; raspuns: React.ReactNode };

/**
 * Întrebările frecvente (2.5, 7.7, 8.5).
 *
 * Făcute cu `<details>`/`<summary>`, nu cu stare în JavaScript. Trei motive,
 * toate practice: se deschid și fără JavaScript, cititoarele de ecran le
 * anunță corect din start, iar căutarea în pagină cu Ctrl+F găsește și
 * răspunsurile închise — browserele moderne deschid singure acordeonul când
 * textul căutat e înăuntru. O variantă scrisă de mână pierde toate trei.
 *
 * Lista nu mai stă singură pe o coloană de alb: lângă ea, pe ecran lat, e o
 * fotografie pe un bloc de miere, ca întrebările să nu arate ca un capăt de
 * pagină „de bifat”. Fără poză, coloana de întrebări ocupă singură centrul.
 */

const CULORI = [
  "bg-caramiziu-500 text-hartie",
  "bg-miere-400 text-cerneala",
  "bg-turcoaz-500 text-hartie",
] as const;

export default function Intrebari({
  titlu = "Întrebări frecvente",
  scris,
  intrebari,
  poza,
}: {
  titlu?: string;
  scris?: string;
  intrebari: ReadonlyArray<Intrebare>;
  poza?: { cale: string; alt: string; legenda?: string };
}) {
  const lista = (
    <ul className="grid gap-3">
      {intrebari.map((item, i) => (
        <li key={item.intrebare}>
          <details
            className={`group ${i % 2 === 0 ? "colt-a" : "colt-b"} border border-hartie-umbra bg-hartie px-5 py-4 shadow-[0_14px_32px_-22px_rgba(35,35,35,0.45)] transition-shadow duration-300 ease-cald open:shadow-[0_20px_40px_-20px_rgba(247,79,34,0.4)] sm:px-6 sm:py-5`}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 font-titlu text-amplu font-bold text-cerneala marker:hidden [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center ${
                  i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                } font-titlu text-mic font-extrabold ${CULORI[i % 3]}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">{item.intrebare}</span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-caramiziu-100 text-caramiziu-600 transition-transform duration-300 ease-cald group-open:rotate-90">
                <Pictograma nume="sageata" className="size-4" />
              </span>
            </summary>
            <div className="mt-4 grid gap-3 pl-0 text-cerneala-moale sm:pl-13">
              {item.raspuns}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="relative overflow-hidden bg-hartie pt-10 pb-24 lg:pt-16 lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor semn="spirala" className="pluteste-lent absolute top-16 right-[4%] size-9 text-turcoaz-200 lg:size-12" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {poza ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <TitluSectiune scris={scris} titlu={titlu} />
              <figure className="relative mt-10 hidden lg:block">
                <span
                  aria-hidden="true"
                  className="absolute -right-4 -bottom-4 h-[70%] w-[70%] colt-a bg-miere-200"
                />
                {/* Poza e înaltă doar când lista e lungă; lângă patru
                    întrebări, un portret ar coborî singur sub ele. */}
                <div
                  className={`colt-b relative overflow-hidden bg-hartie-calda shadow-[0_26px_52px_-24px_rgba(255,172,0,0.6)] ${
                    intrebari.length >= 5 ? "aspect-[4/5]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={poza.cale}
                    alt={poza.alt}
                    fill
                    sizes="(min-width: 1024px) 440px, 0px"
                    className="object-cover"
                  />
                </div>
                {poza.legenda && (
                  <figcaption className="colt-mic-b absolute -bottom-3.5 left-5 bg-caramiziu-500 px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
                    <span className="scris text-corp leading-none text-hartie">
                      {poza.legenda}
                    </span>
                  </figcaption>
                )}
              </figure>
            </div>
            <div className="lg:pt-2">{lista}</div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <TitluSectiune scris={scris} titlu={titlu} />
            <div className="mt-10">{lista}</div>
          </div>
        )}
      </div>
    </section>
  );
}
