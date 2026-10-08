import Pictograma from "../Pictograma";

/**
 * Un document de descărcat (7.5, 8.3).
 *
 * Caietul e explicit: documentele le pregătește asociația și „fără ele,
 * butoanele de descărcare rămân inactive la lansare”. Un buton care arată a
 * buton dar nu descarcă nimic e cea mai proastă variantă — omul îl apasă de
 * trei ori și crede că site-ul e stricat.
 *
 * De aceea, fără fișier, elementul nu e buton: e un card care spune ce
 * document e și că se pregătește. Când fișierul vine, se completează `fisier`
 * și același card devine link de descărcare, fără altă modificare.
 *
 * Cardul arată ca o filă: un câmp de culoare sus, cu formatul scris mare, și
 * textul dedesubt. Documentul care se pregătește are câmpul pe hârtie, hașurat
 * ușor — se vede de la distanță care e gata și care nu.
 */
export default function DocumentDeDescarcat({
  titlu,
  descriere,
  fisier,
  format,
  colt = "a",
}: {
  titlu: string;
  descriere: string;
  /** Calea fișierului din `public/`. Lipsă = documentul nu e încă pregătit. */
  fisier?: string;
  /** „PDF”, „Word” — apare mare pe filă, ca omul să știe ce deschide. */
  format?: string;
  colt?: "a" | "b";
}) {
  const continut = (
    <>
      <span
        className={`relative flex h-28 items-end justify-between overflow-hidden px-6 pb-4 ${
          fisier
            ? "bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 text-hartie"
            : "bg-hartie-umbra text-cerneala-slab"
        }`}
      >
        {!fisier && (
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-50 [background-image:repeating-linear-gradient(135deg,transparent_0_10px,rgba(255,255,255,0.7)_10px_12px)]"
          />
        )}
        <span
          aria-hidden="true"
          className="absolute -top-6 -right-6 size-24 rounded-full border-2 border-current/20"
        />
        <span className="relative font-titlu text-[2.5rem] leading-none font-extrabold tracking-tight">
          {format ?? "PDF"}
        </span>
        <span
          className={`relative flex size-11 items-center justify-center colt-mic-b ${
            fisier ? "bg-hartie/20" : "bg-hartie/70"
          }`}
        >
          <Pictograma nume="document" className="size-6" />
        </span>
      </span>

      <span className="flex flex-1 flex-col p-6">
        <span className="font-titlu text-amplu leading-snug font-bold text-cerneala">
          {titlu}
        </span>
        <span className="mt-2 flex-1 text-mic text-cerneala-moale">
          {descriere}
        </span>
        {fisier ? (
          <span className="mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600">
            Descarcă
            <Pictograma nume="sageata" className="size-4 rotate-90" />
          </span>
        ) : (
          <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-miere-100 px-3 py-1.5 font-titlu text-nota font-semibold text-miere-800">
            <span aria-hidden="true" className="size-2 rounded-full bg-miere-500" />
            În pregătire la asociație
          </span>
        )}
      </span>
    </>
  );

  const clase = `flex h-full flex-col overflow-hidden colt-${colt} border border-hartie-umbra bg-hartie shadow-[0_20px_42px_-24px_rgba(35,35,35,0.45)]`;

  if (!fisier) {
    return <div className={clase}>{continut}</div>;
  }

  return (
    <a
      href={fisier}
      download
      className={`${clase} transition-all duration-500 ease-cald hover:-translate-y-1.5 hover:shadow-[0_26px_52px_-24px_rgba(247,79,34,0.55)] motion-reduce:hover:translate-y-0`}
    >
      {continut}
    </a>
  );
}
