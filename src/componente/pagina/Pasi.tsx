import Aparitie from "../Aparitie";

/**
 * Pașii numerotați (7.3 „Trei pași”, 8.2 „patru pași”, 11.2 „Cum funcționează”).
 *
 * E o listă ordonată, nu un rând de carduri cu cifre desenate: ordinea e
 * informație, iar un cititor de ecran trebuie să o audă ca ordine. Numărul
 * mare e decor peste `<ol>`, marcat `aria-hidden`, ca să nu se audă de două ori.
 */

const CULORI = [
  "text-caramiziu-200",
  "text-miere-300",
  "text-turcoaz-200",
  "text-caramiziu-300",
] as const;

export default function Pasi({
  pasi,
  className = "",
}: {
  pasi: ReadonlyArray<string>;
  className?: string;
}) {
  return (
    <ol className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {pasi.map((pas, i) => (
        <li key={pas} className={pasi.length === 4 ? "lg:col-span-1" : ""}>
          <Aparitie intarziere={i * 0.05} className="h-full">
            <div
              className={`flex h-full items-start gap-4 ${
                i % 2 === 0 ? "colt-a" : "colt-b"
              } bg-hartie p-6 shadow-[0_16px_34px_-20px_rgba(35,35,35,0.4)]`}
            >
              <span
                aria-hidden="true"
                className={`font-titlu text-h2 leading-none font-extrabold ${CULORI[i % 4]}`}
              >
                {i + 1}
              </span>
              <p className="min-w-0 text-cerneala">{pas}</p>
            </div>
          </Aparitie>
        </li>
      ))}
    </ol>
  );
}
