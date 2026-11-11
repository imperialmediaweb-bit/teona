/**
 * Textul unui articol, al unei campanii sau al unei tabere, scris în editorul
 * din panou (`componente/admin/EditorText.tsx`).
 *
 * Din 11 noiembrie 2026 editorul arată textul ca pe pagină: îngroșat,
 * culoare, link, poză și filmare în text, fără semne de scris de mână.
 * Asociația: „un editor sus, să pună un link, să evidențieze ceva, să
 * adauge poze în text, video de pe YouTube, Facebook”. Ce se salvează e
 * HTML, iar HTML-ul trece prin `curataHtml` (`lib/curata-html.ts`) și la
 * salvare, și la afișare.
 *
 * Textele scrise înainte, cu semne (`##`, `- `, `**…**`, `[…](…)`), rămân
 * cum sunt și se afișează ca până acum; la prima deschidere în editor se
 * transformă în HTML cu `semneInHtml`.
 *
 * Fișierul n-are nicio dependență de server: îl folosesc și editorul din
 * browser, și paginile.
 */

/** Textul salvat e HTML (din editorul nou) sau text cu semne (de dinainte)? */
export function esteHtml(text: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|div|figure|img)[\s>]/i.test(text);
}

function scapa(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inRandHtml(rand: string): string {
  let ies = "";
  let ultim = 0;
  const tipar =
    /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(((?:https?:\/\/|\/|mailto:|tel:)[^\s)]+)\)/g;
  for (const m of rand.matchAll(tipar)) {
    const unde = m.index ?? 0;
    ies += scapa(rand.slice(ultim, unde));
    ies +=
      m[1] !== undefined
        ? `<strong>${scapa(m[1])}</strong>`
        : `<a href="${scapa(m[3])}">${scapa(m[2])}</a>`;
    ultim = unde + m[0].length;
  }
  return ies + scapa(rand.slice(ultim));
}

/** Text cu semnele de dinainte → HTML pentru editor. */
export function semneInHtml(text: string): string {
  const ies: string[] = [];
  let paragraf: string[] = [];
  let lista: string[] = [];
  const inchide = () => {
    if (paragraf.length) ies.push(`<p>${paragraf.map(inRandHtml).join(" ")}</p>`);
    if (lista.length) ies.push(`<ul>${lista.map((l) => `<li><p>${inRandHtml(l)}</p></li>`).join("")}</ul>`);
    paragraf = [];
    lista = [];
  };
  for (const rand of text.replace(/\r\n?/g, "\n").split("\n")) {
    const r = rand.trim();
    if (!r) {
      inchide();
      continue;
    }
    const titlu = r.match(/^#{1,6}\s+(.+)$/);
    const punct = r.match(/^[-•*]\s+(.+)$/);
    if (titlu) {
      inchide();
      ies.push(`<h2>${inRandHtml(titlu[1].replace(/\*\*/g, ""))}</h2>`);
    } else if (punct) {
      if (paragraf.length) {
        ies.push(`<p>${paragraf.map(inRandHtml).join(" ")}</p>`);
        paragraf = [];
      }
      lista.push(punct[1]);
    } else {
      if (lista.length) {
        ies.push(`<ul>${lista.map((l) => `<li><p>${inRandHtml(l)}</p></li>`).join("")}</ul>`);
        lista = [];
      }
      paragraf.push(r);
    }
  }
  inchide();
  return ies.join("");
}

/**
 * Textul fără nicio formatare, pe paragrafe: pentru rezumate, descrieri de
 * pagină și verificarea „ai scris destul”.
 */
export function textSimplu(text: string): string[] {
  if (!esteHtml(text)) {
    return text
      .replace(/\*\*/g, "")
      .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
      .replace(/^\s*(#+\s*|[-•*]\s+)/gm, "")
      .split(/(?:\r?\n){2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return text
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|h[1-6]|li|blockquote|div|figure)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Adresa de pus în cadrul video, din linkul lipit de om.
 *
 * Numai YouTube și Facebook: alte adrese în cadru ar însemna orice site
 * deschis în pagina asociației. YouTube merge pe `youtube-nocookie.com`,
 * care nu pune cookie-uri până nu apasă omul „play”.
 */
export function adresaVideo(link: string): string | null {
  let u: URL;
  try {
    u = new URL(link.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const gazda = u.hostname.replace(/^(www\.|m\.)/, "");

  let idYoutube: string | null = null;
  if (gazda === "youtu.be") idYoutube = u.pathname.slice(1).split("/")[0];
  else if (gazda === "youtube.com" || gazda === "youtube-nocookie.com") {
    if (u.pathname === "/watch") idYoutube = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      if (m) idYoutube = m[1];
    }
  }
  if (idYoutube) {
    return /^[A-Za-z0-9_-]{6,20}$/.test(idYoutube)
      ? `https://www.youtube-nocookie.com/embed/${idYoutube}`
      : null;
  }

  if (gazda === "facebook.com" || gazda === "fb.watch") {
    if (u.pathname.startsWith("/plugins/video.php")) {
      const href = u.searchParams.get("href");
      return href ? adresaVideo(href) : null;
    }
    const curat = `${u.origin}${u.pathname}${u.search}`;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(curat)}&show_text=false`;
  }
  return null;
}
