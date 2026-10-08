import type { ReactNode } from "react";

/**
 * Capul unei secțiuni: rândul scris de mână, titlul și, opțional, o frază.
 *
 * Pe prima pagină fiecare secțiune mare începe așa, iar paginile interioare
 * începeau cu un `h2` singur, mai mic decât restul. De aici vine jumătate din
 * diferența pe care a simțit-o clientul între „acasă” și „celelalte”. Acum
 * e aceeași formă peste tot, dintr-un singur loc.
 *
 * Rândul scris de mână e opțional și nu înlocuiește niciodată titlul din
 * caiet: titlul rămâne cel cerut, rândul stă doar deasupra.
 */

const CULORI = {
  caramiziu: "text-caramiziu-600",
  miere: "text-miere-700",
  turcoaz: "text-turcoaz-700",
} as const;

export default function TitluSectiune({
  scris,
  titlu,
  text,
  culoare = "caramiziu",
  centrat = false,
  /** `h2` de regulă; `h3` când secțiunea e deja într-un `h2`. */
  nivel = "h2",
  className = "",
}: {
  scris?: string;
  titlu: ReactNode;
  text?: ReactNode;
  culoare?: keyof typeof CULORI;
  centrat?: boolean;
  nivel?: "h2" | "h3";
  className?: string;
}) {
  const Titlu = nivel;
  return (
    <div className={`${centrat ? "mx-auto text-center" : ""} ${className}`}>
      {scris && (
        <p className={`scris text-amplu ${CULORI[culoare]}`}>{scris}</p>
      )}
      <Titlu
        className={`${scris ? "mt-2" : ""} ${
          nivel === "h2" ? "text-h2" : "text-h3"
        } text-cerneala ${centrat ? "mx-auto max-w-3xl" : "max-w-3xl"}`}
      >
        {titlu}
      </Titlu>
      {text && (
        <p
          className={`mt-4 text-amplu text-cerneala-moale ${
            centrat ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );
}
