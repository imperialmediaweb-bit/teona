import Image from "next/image";

/**
 * O fotografie într-o arcadă, cu un contur desenat decalat în spate.
 *
 * Forma e semnul vizual al site-ului. O arcadă — rotunjită sus, dreaptă jos —
 * citește a poartă, a intrare, ceea ce se potrivește unei case în care copiii
 * sunt primiți. Și o deosebește de la prima vedere de dreptunghiul plin pe
 * care îl are orice șablon de ONG.
 *
 * Conturul din spate e o linie, nu o umbră estompată: dă adâncime fără ceața
 * aceea cenușie pe care o pun toate temele sub carduri. Arată desenat, nu
 * generat.
 */
export default function Arcada({
  cale,
  alt,
  legenda,
  /** Culoarea conturului decalat. */
  contur = "border-caramiziu-300",
  /** În ce parte iese conturul. */
  spre = "dreapta",
  raport = "aspect-[4/5]",
  cuApropiere = false,
  prioritara = false,
  dimensiuni = "(min-width: 1024px) 460px, 92vw",
  className = "",
}: {
  cale: string;
  alt: string;
  legenda?: string;
  contur?: string;
  spre?: "dreapta" | "stanga";
  raport?: string;
  cuApropiere?: boolean;
  prioritara?: boolean;
  dimensiuni?: string;
  className?: string;
}) {
  const decalaj =
    spre === "dreapta" ? "translate-x-3 translate-y-3" : "-translate-x-3 translate-y-3";

  return (
    <figure className={`group relative ${className}`}>
      <div className={`relative ${raport}`}>
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-t-full rounded-b-amplu border-2 ${contur} ${decalaj}`}
        />
        <div className="relative size-full overflow-hidden rounded-t-full rounded-b-amplu bg-hartie-calda">
          <Image
            src={cale}
            alt={alt}
            fill
            priority={prioritara}
            sizes={dimensiuni}
            className={`object-cover ${
              cuApropiere
                ? "transition-transform duration-[1200ms] ease-cald group-hover:scale-[1.06]"
                : ""
            }`}
          />
        </div>
      </div>

      {legenda && (
        <figcaption className="absolute -bottom-3 left-5 rounded-full bg-cerneala px-4 py-1.5 shadow-[0_10px_26px_-14px_rgba(35,35,35,0.7)]">
          <span className="scris text-corp leading-none text-miere-300">
            {legenda}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
