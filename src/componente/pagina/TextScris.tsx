/**
 * Textul scris în panou, transformat în pagină.
 *
 * **De ce nu un editor bogat.** Cine scrie e un om de la asociație, nu un
 * redactor. Un editor cu butoane de stil aduce cu el HTML lipit din Word, cu
 * `<span style="font-family:Calibri">` în el, și strică pagina în feluri greu
 * de explicat. Aici se scrie text simplu, iar formatarea e cât se poate de
 * puțină:
 *
 *     Un rând gol desparte paragrafele.
 *     ## Un rând care începe cu ## e un subtitlu.
 *     - Un rând care începe cu - e un punct de listă.
 *
 * Atât. Nu există bold, nu există culori, nu există mărimi: felul în care
 * arată textul îl dă site-ul, nu cel care scrie. Așa o noutate scrisă în
 * grabă arată la fel de bine ca restul paginilor.
 *
 * **Nimic nu se randează ca HTML.** Textul vine dintr-un câmp pe care îl
 * completează un om, iar `dangerouslySetInnerHTML` ar face din panou o cale de
 * a băga script în pagina publică. Se construiesc elemente React, deci orice
 * `<script>` scris în câmp apare pe ecran ca text, nu rulează.
 */

type Bucata =
  | { fel: "titlu"; text: string }
  | { fel: "paragraf"; text: string }
  | { fel: "lista"; puncte: string[] };

export function imparte(continut: string): Bucata[] {
  const bucati: Bucata[] = [];
  let paragraf: string[] = [];
  let lista: string[] = [];

  const inchideParagraf = () => {
    if (paragraf.length > 0) {
      bucati.push({ fel: "paragraf", text: paragraf.join(" ") });
      paragraf = [];
    }
  };
  const inchideLista = () => {
    if (lista.length > 0) {
      bucati.push({ fel: "lista", puncte: lista });
      lista = [];
    }
  };

  for (const rand of continut.replace(/\r\n/g, "\n").split("\n")) {
    const curat = rand.trim();

    if (curat === "") {
      inchideParagraf();
      inchideLista();
      continue;
    }
    if (curat.startsWith("##")) {
      inchideParagraf();
      inchideLista();
      const text = curat.replace(/^#+\s*/, "").trim();
      if (text) bucati.push({ fel: "titlu", text });
      continue;
    }
    if (/^[-•*]\s+/.test(curat)) {
      inchideParagraf();
      lista.push(curat.replace(/^[-•*]\s+/, "").trim());
      continue;
    }
    inchideLista();
    paragraf.push(curat);
  }

  inchideParagraf();
  inchideLista();
  return bucati;
}

export default function TextScris({ continut }: { continut: string }) {
  const bucati = imparte(continut);
  if (bucati.length === 0) return null;

  return (
    <div className="grid gap-5">
      {bucati.map((bucata, i) => {
        if (bucata.fel === "titlu") {
          return (
            <h2 key={i} className="mt-4 text-h3 text-cerneala first:mt-0">
              {bucata.text}
            </h2>
          );
        }
        if (bucata.fel === "lista") {
          return (
            <ul key={i} className="grid gap-2.5">
              {bucata.puncte.map((punct, j) => (
                <li
                  key={j}
                  className="relative pl-6 text-amplu text-cerneala-moale"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-[0.7em] left-0 size-2 rounded-full bg-caramiziu-600"
                  />
                  {punct}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-amplu text-cerneala-moale">
            {bucata.text}
          </p>
        );
      })}
    </div>
  );
}
