import { Fragment, type ReactNode } from "react";
import { curataHtml } from "@/lib/curata-html";
import { esteHtml } from "@/lib/text-bogat";

/**
 * Un bloc de text de pe o pagină fixă (`/admin/texte`), pe paragrafe.
 *
 * Text simplu (cum era la lansare): rând gol = paragraf nou. HTML (din
 * editorul cu bară): fiecare `<p>` e un paragraf, cu îngroșat, culoare și
 * link înăuntru, curățat de `curataHtml`. Pagina își pune singură `<p>`-ul,
 * cu clasele ei — de aici vine doar conținutul lui.
 */
export function paragrafeBogate(text: string): ReactNode[] {
  if (!esteHtml(text ?? "")) {
    return (text ?? "")
      .split(/(?:\r?\n){2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  const curat = curataHtml(text);
  const bucati = [...curat.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((m) => m[1].trim())
    .filter((p) => p && p !== "<br />");
  return bucati.map((html, i) => (
    <span key={i} className="text-in-rand" dangerouslySetInnerHTML={{ __html: html }} />
  ));
}

/** Același bloc, într-un singur `<p>` al paginii: paragrafele, cu rând liber între ele. */
export function intrUnParagraf(text: string): ReactNode {
  return paragrafeBogate(text).map((bucata, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <>
          <br />
          <br />
        </>
      )}
      {bucata}
    </Fragment>
  ));
}
