import Link from "next/link";
import { slugEticheta } from "@/lib/etichete";

/**
 * Cuvintele cheie de sub un text. Cu `cale`, fiecare duce la lista cu
 * aceeași etichetă (`/noutati?eticheta=tabara`); fără, sunt doar de citit.
 */
export default function Etichete({
  etichete,
  cale,
}: {
  etichete: readonly string[];
  cale?: string;
}) {
  if (etichete.length === 0) return null;
  const clasa =
    "inline-flex min-h-9 items-center rounded-full border border-hartie-umbra bg-hartie px-4 py-1.5 font-titlu text-mic font-semibold text-cerneala-moale";
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Cuvinte cheie">
      {etichete.map((e) => (
        <li key={e}>
          {cale ? (
            <Link
              href={`${cale}?eticheta=${encodeURIComponent(slugEticheta(e))}`}
              className={`${clasa} transition-colors hover:border-caramiziu-300 hover:text-caramiziu-700`}
            >
              #{e}
            </Link>
          ) : (
            <span className={clasa}>#{e}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
