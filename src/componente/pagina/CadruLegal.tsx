import { pagini } from "@/lib/continut";
import Val, { VAL_PESTE } from "../Val";
import TextLegal from "./TextLegal";

/**
 * Cadrul comun al celor trei pagini legale (12.6): „Politica de
 * confidențialitate, Termenii și condițiile și Politica de cookie-uri există
 * pe site-ul actual și rămân.”
 *
 * Textele se citesc din conținutul preluat, nu se rescriu: sunt documente
 * juridice, iar o reformulare „ca să sune mai bine” le schimbă înțelesul.
 * Trec totuși prin repararea diacriticelor, ca restul site-ului.
 *
 * Paginile rămân sobre: fără fotografii, fără carduri. Ce au în plus față de
 * restul site-ului e doar o lățime de rând confortabilă (65–70 de semne) și
 * aer între capitole, ca un text lung să se poată citi până la capăt.
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
      <section className="granulatie bg-hartie-calda pt-10 pb-24 lg:pt-16 lg:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
            Document
          </p>
          <h1 className="mt-2 text-h1 text-cerneala">{titlu}</h1>
        </div>
      </section>
      <Val culoare="text-hartie" className={VAL_PESTE} />

      <section className="bg-hartie pt-4 pb-24 lg:pt-8 lg:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <TextLegal text={pagina.textHtml} />
        </div>
      </section>
    </>
  );
}
