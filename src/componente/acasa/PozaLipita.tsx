import Image from "next/image";
import type { ReactNode } from "react";
import { Banda } from "./Ilustratii";

/**
 * O fotografie lipită în album.
 *
 * Rama e groasă, din hârtie albă, cu loc dedesubt pentru o legendă scrisă de
 * mână — ca pozele instant puse într-un album de familie. Fiecare ramă e
 * ușor strâmbă, cu câteva grade, și ținută cu o bucată de bandă adezivă.
 *
 * Nu există niciun efect la trecerea cu mouse-ul: poza nu se apropie, nu se
 * ridică, nu se mișcă. O poză lipită într-un album stă pe loc — și, pentru
 * un copil care se sprijină pe repere stabile, asta e o calitate, nu o lipsă.
 *
 * Colțurile au raze diferite, ca o hârtie tăiată cu foarfeca, nu cu ghilotina.
 */

const INCLINARI = {
  stanga: "-rotate-2",
  "stanga-mult": "-rotate-3",
  dreapta: "rotate-2",
  "dreapta-mult": "rotate-3",
  drept: "",
} as const;

export type Inclinare = keyof typeof INCLINARI;

export default function PozaLipita({
  cale,
  alt,
  legenda,
  inclinare = "stanga",
  raport = "aspect-[4/3]",
  dimensiuni = "(min-width: 1024px) 460px, 92vw",
  prioritara = false,
  banda = "sus",
  /** În loc de fotografie: un desen sau orice alt conținut în ramă. */
  continut,
  className = "",
}: {
  cale?: string;
  alt?: string;
  legenda?: string;
  inclinare?: Inclinare;
  raport?: string;
  dimensiuni?: string;
  prioritara?: boolean;
  banda?: "sus" | "colturi" | "fara";
  continut?: ReactNode;
  className?: string;
}) {
  // Cine așază poza absolut (colajele din erou și de la Casa Teona) dă
  // poziția prin `className`; altfel `relative` al ramei ar câștiga în foaia
  // de stiluri și poza ar rămâne în flux, sub cea dinainte.
  const pozitie = /\babsolute\b/.test(className) ? "" : "relative";

  return (
    <figure
      className={`${pozitie} rounded-[6px_12px_7px_14px] bg-hartie p-2.5 pb-10 shadow-[0_18px_40px_-18px_rgba(35,35,35,0.35),0_2px_6px_rgba(35,35,35,0.08)] sm:p-3 sm:pb-11 ${INCLINARI[inclinare]} ${className}`}
    >
      {banda === "sus" && (
        <Banda className="-top-3 left-1/2 z-10 -translate-x-1/2 -rotate-3" />
      )}
      {banda === "colturi" && (
        <>
          <Banda className="-top-2.5 -left-7 z-10 w-20 -rotate-45" />
          <Banda className="-right-7 -bottom-2.5 z-10 w-20 -rotate-45" />
        </>
      )}

      <div className={`relative overflow-hidden rounded-[3px] bg-hartie-umbra ${raport}`}>
        {continut ??
          (cale && (
            <Image
              src={cale}
              alt={alt ?? ""}
              fill
              priority={prioritara}
              sizes={dimensiuni}
              className="object-cover"
            />
          ))}
      </div>

      {legenda && (
        <figcaption // Pe telefon ramele mici au ~150 px: legenda e mai măruntă, ca să încapă.
          className="scris absolute inset-x-3 bottom-2 truncate text-center text-nota leading-none text-cerneala-moale sm:text-corp lg:text-amplu">
          {legenda}
        </figcaption>
      )}
    </figure>
  );
}
