import { textelePaginilor } from "@/lib/texte-pagini";
import { testimonialePublice } from "@/lib/testimoniale";

/**
 * „Ce face donația ta”: exemple de sume și ce face asociația cu ele, plus un
 * citat de la cineva care a fost în tabere.
 *
 * **Exemplele le scrie asociația**, la Panou → Texte → Donează, câte unul pe
 * rând („50 lei — …”). Până atunci blocul lipsește: o sumă pusă lângă un
 * efect pe care nu l-a confirmat nimeni ar fi o cifră inventată tocmai pe
 * pagina pe care omul dă bani.
 *
 * Citatul e primul testimonial publicat care nu e al unui voluntar, cu
 * semnătura lui, cum e scrisă în panou.
 */

/** „50 lei — o zi de terapie” → { suma, efect }. Rândurile fără sumă se sar. */
export function exempleDeEfect(text: string): Array<{ suma: string; efect: string }> {
  return text
    .split(/\r?\n/)
    .map((rand) => rand.trim().match(/^(.*\d.*?)\s+[—–-]\s+(.+)$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ suma: m[1].trim(), efect: m[2].trim() }))
    .slice(0, 4);
}

export default async function DonatiaTa() {
  const [texte, marturii] = await Promise.all([
    textelePaginilor(),
    testimonialePublice().catch(() => []),
  ]);
  const exemple = exempleDeEfect(texte["doneaza.efect"] ?? "");
  const marturie = marturii.find((t) => !/voluntar/i.test(t.semnatura));
  if (exemple.length === 0 && !marturie) return null;

  return (
    <aside aria-label="Ce face donația ta" className="grid gap-5">
      {exemple.length > 0 && (
        <div className="colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_48px_-28px_rgba(35,35,35,0.45)] sm:p-7">
          <h2 className="font-titlu text-h4 font-bold text-cerneala">
            Ce face donația ta
          </h2>
          <ul className="mt-5 grid gap-4">
            {exemple.map((e) => (
              <li key={e.suma} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4">
                <span className="font-titlu text-amplu font-extrabold text-caramiziu-700">
                  {e.suma}
                </span>
                <span className="text-corp text-cerneala-moale">{e.efect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {marturie && (
        <figure className="colt-b bg-miere-100 p-6 sm:p-7">
          <blockquote className="text-amplu text-miere-900">
            <p>„{marturie.citat.replace(/^[„"“]+|[”"“]+$/g, "")}”</p>
          </blockquote>
          <figcaption className="mt-4 font-titlu text-mic font-bold text-miere-900">
            {marturie.semnatura}
            {marturie.sursa && (
              <span className="font-normal text-miere-800"> · {marturie.sursa}</span>
            )}
          </figcaption>
        </figure>
      )}
    </aside>
  );
}
