import type { ReactNode } from "react";
import { curataHtml } from "@/lib/curata-html";
import { esteHtml } from "@/lib/text-bogat";

/**
 * Textul scris în panou, transformat în pagină.
 *
 * **Text simplu, cu câteva semne.** Cine scrie e un om de la asociație, nu
 * un redactor. Un editor care ține HTML aduce cu el text lipit din Word, cu
 * `<span style="font-family:Calibri">`, și strică pagina în feluri greu de
 * explicat. Aici se salvează text simplu, iar semnele le pun butoanele din
 * `EditorText`:
 *
 *     Un rând gol desparte paragrafele.
 *     ## subtitlu        - punct de listă
 *     **îngroșat**       [cuvinte](adresă)
 *
 * Culori și mărimi nu există: felul în care arată textul îl dă site-ul.
 *
 * **Nimic nu se randează ca HTML.** Textul vine dintr-un câmp pe care îl
 * completează un om, iar `dangerouslySetInnerHTML` ar face din panou o cale de
 * a băga script în pagina publică. Se construiesc elemente React, deci orice
 * `<script>` scris în câmp apare pe ecran ca text, nu rulează.
 */

/**
 * Îngroșat și linkuri, în interiorul unui rând: `**așa**` și
 * `[cuvinte](adresă)`. Le pun butoanele din `EditorText`. Tot elemente
 * React, nu HTML: adresa trece numai dacă începe cu http(s), `/`, `mailto:`
 * sau `tel:`, deci un `javascript:` scris în câmp rămâne text pe ecran.
 */
export function inRand(text: string): ReactNode[] {
  const bucati: ReactNode[] = [];
  const tipar =
    /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(((?:https?:\/\/|\/|mailto:|tel:)[^\s)]+)\)/g;
  let ultim = 0;
  let cheie = 0;
  for (const m of text.matchAll(tipar)) {
    const unde = m.index ?? 0;
    if (unde > ultim) bucati.push(text.slice(ultim, unde));
    if (m[1] !== undefined) {
      bucati.push(
        <strong key={cheie++} className="font-bold text-cerneala">
          {m[1]}
        </strong>,
      );
    } else {
      const afara = /^https?:\/\//.test(m[3]) && !m[3].startsWith("https://teona-ariana.ro");
      bucati.push(
        <a
          key={cheie++}
          href={m[3]}
          {...(afara ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="font-semibold text-caramiziu-700 underline underline-offset-4 hover:text-caramiziu-800"
        >
          {m[2]}
        </a>,
      );
    }
    ultim = unde + m[0].length;
  }
  if (ultim < text.length) bucati.push(text.slice(ultim));
  return bucati;
}

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
  /*
    Textele scrise în editorul nou sunt HTML. Trec prin `curataHtml` și aici,
    nu doar la salvare: un rând pus în baza de date pe altă cale (o probă, un
    import) n-ar fi fost curățat.
  */
  if (esteHtml(continut)) {
    return (
      <div
        className="text-bogat"
        dangerouslySetInnerHTML={{ __html: curataHtml(continut) }}
      />
    );
  }
  const bucati = imparte(continut);
  if (bucati.length === 0) return null;

  return (
    <div className="grid gap-5">
      {bucati.map((bucata, i) => {
        if (bucata.fel === "titlu") {
          return (
            <h2 key={i} className="mt-4 text-h3 text-cerneala first:mt-0">
              {bucata.text.replace(/\*\*/g, "")}
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
                  {inRand(punct)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-amplu text-cerneala-moale">
            {inRand(bucata.text)}
          </p>
        );
      })}
    </div>
  );
}
