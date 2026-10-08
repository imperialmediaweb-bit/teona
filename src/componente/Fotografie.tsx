import Image from "next/image";

/**
 * O fotografie cu colțuri rotunjite și umbră caldă.
 *
 * Umbra nu e cenușie. E colorată, în nuanța accentului, și așezată jos —
 * ca lumina să pară că vine de sus. O umbră gri peste o pagină caldă o face
 * să pară murdară; una portocalie o face să pară luminată.
 *
 * Colțurile sunt rotunjite generos, dar rămân colțuri: nici arcade, nici
 * cercuri. Fotografia se vede întreagă și nu capătă un aer de altceva.
 */

const UMBRE = {
  caramiziu: "shadow-[0_22px_45px_-20px_rgba(247,79,34,0.55)]",
  miere: "shadow-[0_22px_45px_-20px_rgba(255,172,0,0.55)]",
  turcoaz: "shadow-[0_22px_45px_-20px_rgba(42,159,163,0.5)]",
  neutru: "shadow-[0_22px_45px_-22px_rgba(35,35,35,0.45)]",
} as const;

export type Umbra = keyof typeof UMBRE;

export default function Fotografie({
  cale,
  alt,
  legenda,
  umbra = "neutru",
  raport = "aspect-[4/3]",
  cuApropiere = true,
  prioritara = false,
  dimensiuni = "(min-width: 1024px) 460px, 92vw",
  className = "",
}: {
  cale: string;
  alt: string;
  legenda?: string;
  umbra?: Umbra;
  raport?: string;
  cuApropiere?: boolean;
  prioritara?: boolean;
  dimensiuni?: string;
  className?: string;
}) {
  return (
    <figure className={`group relative ${className}`}>
      <div
        className={`relative overflow-hidden rounded-[1.75rem] bg-hartie-calda transition-all duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0 ${raport} ${UMBRE[umbra]}`}
      >
        <Image
          src={cale}
          alt={alt}
          fill
          priority={prioritara}
          sizes={dimensiuni}
          className={`object-cover ${
            cuApropiere
              ? "transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.07]"
              : ""
          }`}
        />
      </div>

      {legenda && (
        <figcaption className="absolute -bottom-3.5 left-5 rounded-full bg-caramiziu-500 px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)] transition-transform duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0">
          <span className="scris text-corp leading-none text-hartie">
            {legenda}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
