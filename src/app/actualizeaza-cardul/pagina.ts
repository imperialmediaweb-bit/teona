import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";

/**
 * Când linkul nu mai e bun, sau portalul nu răspunde.
 *
 * Omul ăsta tocmai a apăsat „Schimbă cardul" dintr-un mesaj în care i-am
 * spus că donația lui n-a trecut. Dacă aici dă de o pagină albă cu o eroare,
 * nu mai încearcă pe altă cale: crede că s-a stricat ceva la noi și renunță.
 * Deci primește un telefon și o adresă, pe o pagină care seamănă cu site-ul.
 */
export function pagina(
  fel: "buton" | "expirat" | "fara-portal",
  dovada?: { c: string; p: string; s: string },
) {
  const titlu =
    fel === "buton"
      ? "Schimbă cardul donației lunare"
      : fel === "expirat"
        ? "Linkul nu mai e bun"
        : "Schimbarea cardului nu merge chiar acum";
  const explicatie =
    fel === "buton"
      ? "Apasă butonul și ajungi la procesatorul de plăți, unde scrii cardul nou. Noi nu-l vedem."
      : fel === "expirat"
        ? "A trecut prea mult timp de când ți-am trimis mesajul. Sună-ne și pornim donația din nou, în două minute."
        : "E ceva la noi, nu la tine. Sună-ne sau scrie-ne și o rezolvăm pe loc.";
  const formular =
    fel === "buton" && dovada
      ? `<form action="/api/cont/card" method="post">
    <input type="hidden" name="c" value="${scapa(dovada.c)}" />
    <input type="hidden" name="p" value="${scapa(dovada.p)}" />
    <input type="hidden" name="s" value="${scapa(dovada.s)}" />
    <button type="submit">Schimbă cardul</button>
  </form>`
      : "";

  const html = `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${scapa(titlu)} · ${scapa(ASOCIATIA.denumire)}</title>
<meta name="robots" content="noindex" />
<style>
  :root{color-scheme:light}
  body{margin:0;background:#f9f5f2;color:#232323;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;line-height:1.6}
  main{max-width:34rem;margin:0 auto;padding:4rem 1.25rem}
  h1{font-size:1.6rem;line-height:1.25;margin:0 0 1rem}
  p{margin:0 0 1rem;color:#4a4a4a}
  a{color:#b82b09;font-weight:700}
  .card{background:#fff;border:1px solid #efe7e1;border-radius:14px;padding:1.5rem}
  button{min-height:2.75rem;border:0;border-radius:999px;background:#232323;color:#fff;padding:.75rem 1.5rem;font:inherit;font-weight:700;cursor:pointer}
</style></head>
<body><main><div class="card">
  <h1>${scapa(titlu)}</h1>
  <p>${scapa(explicatie)}</p>
  ${formular}
  <p>
    Sună la <a href="tel:${TELEFON_PRINCIPAL.apel}">${scapa(TELEFON_PRINCIPAL.afisat)}</a><br />
    sau scrie la <a href="mailto:${EMAIL.contact}">${scapa(EMAIL.contact)}</a>
  </p>
  <p>Nu ne datorezi nimic și nu s-a pierdut nimic — donația lunară pur și simplu nu s-a mai luat.</p>
</div></main></body></html>`;

  return new Response(html, {
    status: fel === "buton" ? 200 : fel === "expirat" ? 410 : 503,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function scapa(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
