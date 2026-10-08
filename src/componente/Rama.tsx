import Image from "next/image";

/**
 * O fotografie în ramă albă, ca o poză tipărită.
 *
 * Rama e aceeași peste tot pe site: chenar alb gros, colțuri rotunjite —
 * rotunjite, nu rotunde, ca poza să rămână dreptunghiulară și să se vadă
 * întreagă. Pe fundalul cald, ramele dau paginii aerul unui album de tabără,
 * nu al unei grile de miniaturi.
 *
 * Legenda, când există, e scrisă de mână și stă pe o pastilă portocalie care
 * iese puțin din ramă — ca o etichetă lipită pe spatele pozei.
 */
export default function Rama({
  cale,
  alt,
  legenda,
  /** Raportul laturilor. Implicit 4:3, pentru fotografii de grup. */
  raport = "aspect-[4/3]",
  /** Înclinare ușoară, în grade. Zero înseamnă dreaptă. */
  inclinare = 0,
  /** Mărește poza puțin la trecerea cu mouse-ul. */
  cuApropiere = false,
  prioritara = false,
  dimensiuni = "(min-width: 1024px) 560px, 100vw",
  className = "",
}: {
  cale: string;
  alt: string;
  legenda?: string;
  raport?: string;
  inclinare?: number;
  cuApropiere?: boolean;
  prioritara?: boolean;
  dimensiuni?: string;
  className?: string;
}) {
  return (
    <figure
      className={`group relative ${className}`}
      style={inclinare ? { transform: `rotate(${inclinare}deg)` } : undefined}
    >
      <div
        className={`relative overflow-hidden rounded-amplu border-[10px] border-hartie bg-hartie shadow-[0_18px_50px_-24px_rgba(35,35,35,0.45)] ${raport}`}
      >
        <Image
          src={cale}
          alt={alt}
          fill
          priority={prioritara}
          sizes={dimensiuni}
          className={`rounded-[1rem] object-cover ${
            cuApropiere
              ? "transition-transform duration-[1200ms] ease-cald group-hover:scale-[1.06]"
              : ""
          }`}
        />
      </div>

      {legenda && (
        <figcaption className="absolute -bottom-3 left-6 rounded-full bg-caramiziu-500 px-4 py-1.5 shadow-[0_6px_18px_-8px_rgba(247,79,34,0.9)]">
          <span className="scris text-corp leading-none text-hartie">
            {legenda}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
