import { pagini } from "@/lib/continut";
import Val from "../Val";
import TextLegal from "./TextLegal";

/**
 * Cadrul comun al celor trei pagini legale (12.6): „Politica de
 * confidențialitate, Termenii și condițiile și Politica de cookie-uri există
 * pe site-ul actual și rămân.”
 *
 * Textele se citesc din conținutul preluat, nu se rescriu: sunt documente
 * juridice, iar o reformulare „ca să sune mai bine” le schimbă înțelesul.
 * Trec totuși prin repararea diacriticelor, ca restul site-ului.
 */
export default function CadruLegal({
  titlu,
  slugVechi,
}: {
  titlu: string;
  /** Slugul paginii în exportul WordPress. */
  slugVechi: string;
}) {
  const pagina = pagini().find((p) => p.slug === slugVechi);

  if (!pagina?.textHtml?.trim()) {
    throw new Error(
      `Pagina legală „${slugVechi}” nu are text în continut/pagini.json. ` +
        `O pagină legală goală nu se publică.`,
    );
  }

  return (
    <>
      <section className="granulatie bg-tenta-cald pt-10 pb-14 lg:pt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-h1 text-cerneala">{titlu}</h1>
        </div>
      </section>
      <Val culoare="text-hartie" />

      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <TextLegal text={pagina.textHtml} />
        </div>
      </section>
    </>
  );
}
