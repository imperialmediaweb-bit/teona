import Aparitie from "../Aparitie";
import Decor from "../Decor";
import Pictograma, { type NumePictograma } from "../Pictograma";

/**
 * Pașii numerotați (7.3 „Trei pași”, 8.2 „patru pași”, 11.2 „Cum funcționează”).
 *
 * E o listă ordonată, nu un rând de carduri cu cifre desenate: ordinea e
 * informație, iar un cititor de ecran trebuie să o audă ca ordine. Numărul
 * mare e decor peste `<ol>`, marcat `aria-hidden`, ca să nu se audă de două ori.
 *
 * Cardurile nu sunt identice. Primul pas e un câmp plin de culoare, al doilea
 * stă pe miere, al treilea pe turcoaz, al patrulea pe hârtie: trei cutii albe
 * cu o cifră gri erau exact genul de rând „din același șablon” pe care l-a
 * respins clientul la prima pagină.
 */

const FELURI = [
  {
    card: "granulatie bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 text-hartie shadow-[0_28px_56px_-26px_rgba(247,79,34,0.85)]",
    numar: "text-hartie/20",
    text: "text-hartie",
    pictograma: "bg-hartie/20 text-hartie",
    semn: "text-hartie/25",
  },
  {
    card: "granulatie bg-miere-300 text-cerneala shadow-[0_28px_56px_-26px_rgba(255,172,0,0.8)]",
    numar: "text-miere-100/90",
    text: "text-miere-900",
    pictograma: "bg-cerneala/10 text-cerneala",
    semn: "text-miere-200",
  },
  {
    card: "granulatie bg-turcoaz-100 text-cerneala shadow-[0_28px_56px_-26px_rgba(42,159,163,0.6)]",
    numar: "text-turcoaz-200",
    text: "text-turcoaz-900",
    pictograma: "bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]",
    semn: "text-turcoaz-200",
  },
  {
    card: "border border-hartie-umbra bg-hartie text-cerneala shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)]",
    numar: "text-caramiziu-100",
    text: "text-cerneala",
    pictograma: "bg-caramiziu-100 text-caramiziu-600",
    semn: "text-caramiziu-100",
  },
] as const;

const SEMNE = ["stea", "unda", "spirala", "soare"] as const;

export type Pas = { text: string; pictograma?: NumePictograma };

export default function Pasi({
  pasi,
  className = "",
}: {
  pasi: ReadonlyArray<string | Pas>;
  className?: string;
}) {
  const coloane =
    pasi.length === 2
      ? "lg:grid-cols-2"
      : pasi.length === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ol className={`grid gap-5 ${coloane} ${className}`}>
      {pasi.map((pas, i) => {
        const p = typeof pas === "string" ? { text: pas } : pas;
        const fel = FELURI[i % FELURI.length];
        return (
          <li key={p.text}>
            <Aparitie intarziere={i * 0.05} className="h-full">
              <div
                className={`relative flex h-full min-h-[11rem] flex-col overflow-hidden p-6 sm:p-7 ${
                  i % 2 === 0 ? "colt-a" : "colt-b"
                } ${fel.card}`}
              >
                <Decor
                  semn={SEMNE[i % SEMNE.length]}
                  strokeWidth={0.8}
                  className={`absolute -right-8 -bottom-8 size-32 ${fel.semn}`}
                />
                <span
                  aria-hidden="true"
                  className={`absolute -top-3 -right-1 font-titlu text-[6.5rem] leading-none font-extrabold tracking-tight ${fel.numar}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.pictograma && (
                  <span
                    className={`relative flex size-12 items-center justify-center ${
                      i % 2 === 0 ? "colt-mic-b" : "colt-mic-a"
                    } ${fel.pictograma}`}
                  >
                    <Pictograma nume={p.pictograma} className="size-6" />
                  </span>
                )}
                <p
                  className={`relative mt-auto pt-10 font-titlu text-amplu leading-snug font-bold ${fel.text}`}
                >
                  {p.text}
                </p>
              </div>
            </Aparitie>
          </li>
        );
      })}
    </ol>
  );
}
