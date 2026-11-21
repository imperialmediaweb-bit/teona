import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";

/**
 * Locul fotografiei pentru „Cazuri umanitare”.
 *
 * Caietul cere aici o imagine fără chipuri recognoscibile, iar toate pozele
 * din proiectele umanitare arată fața unui copil bolnav. Deci o ilustrație,
 * în aceeași ramă și pe aceeași suprafață ca fotografiile vecine: mâinile
 * care sprijină, pe hârtie caldă, fără text în ea — titlul e dedesubt.
 */
export default function IlustratieUmanitara() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-turcoaz-100 via-hartie-calda to-miere-100"
    >
      <Decor
        semn="inima"
        strokeWidth={0.8}
        className="absolute -right-10 -bottom-12 size-56 text-miere-300/70"
      />
      <span className="absolute top-1/2 left-1/2 aspect-square w-[46%] max-w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hartie/80 shadow-[0_24px_48px_-24px_rgba(42,159,163,0.6)]" />
      <Pictograma
        nume="maini"
        strokeWidth={1.3}
        className="absolute top-1/2 left-1/2 aspect-square w-[24%] max-w-28 -translate-x-1/2 -translate-y-1/2 text-turcoaz-700"
      />
    </div>
  );
}
