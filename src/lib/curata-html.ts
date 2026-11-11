import sanitizeHtml from "sanitize-html";
import { adresaVideo } from "@/lib/text-bogat";

/**
 * HTML-ul din editor, curățat înainte de salvare și înainte de afișare.
 *
 * Câmpul e completat de un om, dar orice cerere poate trimite orice în el.
 * Trece numai ce poate face editorul: paragrafe, subtitluri, liste, citat,
 * îngroșat, cursiv, subliniat, culoare, link, poză din Cloudinary sau de pe
 * site, filmare YouTube sau Facebook. Restul se aruncă: `<script>`,
 * `onclick`, `javascript:`, stilurile lipite din Word, cadre spre alte site-uri.
 */
const CULOARE = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/i;

export function curataHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3",
      "ul", "ol", "li", "blockquote", "a", "span", "img", "div", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      img: ["src", "alt", "width", "height"],
      div: ["data-video"],
      iframe: ["src", "allowfullscreen", "allow", "loading", "title"],
    },
    allowedStyles: { span: { color: [CULOARE] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => {
      if (frame.tag === "img") {
        const src = frame.attribs.src ?? "";
        return !(src.startsWith("https://res.cloudinary.com/") || src.startsWith("/"));
      }
      if (frame.tag === "iframe") {
        const src = frame.attribs.src ?? "";
        return !src || adresaVideo(src) !== src;
      }
      return false;
    },
    transformTags: {
      b: "strong",
      i: "em",
      h1: "h2",
      h4: "h3",
      a: (tag, attribs) => {
        const href = attribs.href ?? "";
        // Un link fără adresă (de ex. un `javascript:` scos mai sus) rămâne text.
        if (!href) return { tagName: "span", attribs: {} };
        const afara =
          /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?teona-ariana\.ro(\/|$)/.test(href);
        return {
          tagName: "a",
          attribs: (afara
            ? { href, target: "_blank", rel: "noopener noreferrer" }
            : { href }) as Record<string, string>,
        };
      },
      iframe: (tag, attribs) => ({
        tagName: "iframe",
        attribs: {
          src: attribs.src ?? "",
          title: "Filmare",
          loading: "lazy",
          allow: "encrypted-media; picture-in-picture; fullscreen",
          allowfullscreen: "true",
        },
      }),
    },
  });
}
