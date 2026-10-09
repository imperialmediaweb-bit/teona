/**
 * Randarea unei pagini legale din textul preluat din WordPress.
 *
 * Textul vine ca un singur șir, cu rânduri goale între blocuri. Trei forme de
 * rând, recunoscute după cum arată:
 *
 * - „2. Colectarea și utilizarea informațiilor” — titlu de capitol, devine `h2`;
 * - un rând care începe cu tab (așa a ieșit lista din editorul WordPress) —
 *   element de listă;
 * - restul — paragraf.
 *
 * Împărțirea se face aici, o dată, nu cu `dangerouslySetInnerHTML`: textul
 * ajunge pe pagină ca text, nu ca HTML de încredere.
 */

type Bloc =
  | { fel: "titlu"; text: string }
  | { fel: "paragraf"; text: string }
  | { fel: "lista"; elemente: string[] };

const TITLU = /^\d+\.\s+\S/;

function imparte(text: string): Bloc[] {
  const blocuri: Bloc[] = [];

  for (const brut of text.split(/\n\s*\n/)) {
    const rand = brut.replace(/\s+$/, "");
    if (!rand.trim()) continue;

    const esteElement = /^[ \t]*\t/.test(rand);
    const continut = rand.trim();

    if (esteElement) {
      const ultimul = blocuri.at(-1);
      if (ultimul?.fel === "lista") ultimul.elemente.push(continut);
      else blocuri.push({ fel: "lista", elemente: [continut] });
      continue;
    }

    if (
      TITLU.test(continut) &&
      continut.length < 120 &&
      !/\.\s/.test(continut.slice(3))
    ) {
      blocuri.push({ fel: "titlu", text: continut });
      continue;
    }

    blocuri.push({ fel: "paragraf", text: continut });
  }

  return blocuri;
}

export default function TextLegal({ text }: { text: string }) {
  const blocuri = imparte(text);

  return (
    <div className="grid gap-5 text-[1.0625rem] leading-[1.75]">
      {blocuri.map((bloc, i) => {
        if (bloc.fel === "titlu") {
          return (
            <h2
              key={i}
              className="mt-8 border-t border-hartie-umbra pt-7 text-h4 text-cerneala first:mt-0 first:border-t-0 first:pt-0"
            >
              {bloc.text}
            </h2>
          );
        }
        if (bloc.fel === "lista") {
          return (
            <ul
              key={i}
              className="grid list-disc gap-2 pl-5 text-cerneala-moale marker:text-caramiziu-400"
            >
              {bloc.elemente.map((element) => (
                <li key={element}>{element}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-cerneala-moale">
            {bloc.text}
          </p>
        );
      })}
    </div>
  );
}
