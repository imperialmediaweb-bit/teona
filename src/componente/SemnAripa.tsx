import Image from "next/image";

const ARIPA = "/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1.png";

/**
 * Aripa din siglă, folosită ca filigran pe benzile închise.
 *
 * E singurul element grafic al asociației care nu e nici text, nici fotografie,
 * și e deja al lor. Pus mare și foarte palid, leagă secțiunile între ele fără
 * să ceară atenție — altfel benzile închise ar fi dreptunghiuri goale.
 *
 * Pur decorativ: `aria-hidden`, `alt` gol, și nu intră niciodată peste text.
 */
export default function SemnAripa({
  className = "",
  /** Cât de tare se vede. Sub 0,1 pe fundal închis, altfel fură privirea. */
  opacitate = 0.06,
}: {
  className?: string;
  opacitate?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ opacity: opacitate }}
    >
      <Image
        src={ARIPA}
        alt=""
        aria-hidden="true"
        width={512}
        height={512}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
