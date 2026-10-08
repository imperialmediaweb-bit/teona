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
 */
export default function DocumentDeDescarcat({
  titlu,
  descriere,
  fisier,
  format,
}: {
  titlu: string;
  descriere: string;
  /** Calea fișierului din `public/`. Lipsă = documentul nu e încă pregătit. */
  fisier?: string;
  /** „PDF”, „Word” — apare lângă titlu, ca omul să știe ce deschide. */
  format?: string;
}) {
  const continut = (
    <>
      <span
        className={`colt-mic-a flex size-12 shrink-0 items-center justify-center ${
          fisier
            ? "bg-caramiziu-500 text-hartie"
            : "bg-hartie-umbra text-cerneala-slab"
        }`}
      >
        <Pictograma nume="document" className="size-6" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-titlu text-amplu font-bold text-cerneala">
          {titlu}
          {format && (
            <span className="ml-2 font-text text-nota font-normal text-cerneala-slab">
              {format}
            </span>
          )}
        </span>
        <span className="mt-1 block text-mic text-cerneala-moale">
          {descriere}
        </span>
        {!fisier && (
          <span className="mt-2 inline-block rounded-full bg-miere-100 px-3 py-1 font-titlu text-nota font-semibold text-miere-800">
            În pregătire la asociație
          </span>
        )}
      </span>

      {fisier && (
        <span className="shrink-0 self-center font-titlu text-mic font-semibold text-caramiziu-600">
          Descarcă
        </span>
      )}
    </>
  );

  const clase =
    "flex h-full items-start gap-4 colt-a bg-hartie p-6 shadow-[0_16px_34px_-22px_rgba(35,35,35,0.5)]";

  if (!fisier) {
    return <div className={`${clase} opacity-80`}>{continut}</div>;
  }

  return (
    <a
      href={fisier}
      download
      className={`${clase} transition-all duration-300 ease-cald hover:-translate-y-1 hover:shadow-[0_22px_40px_-20px_rgba(247,79,34,0.45)] motion-reduce:hover:translate-y-0`}
    >
      {continut}
    </a>
  );
}
