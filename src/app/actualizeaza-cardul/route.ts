import { clientulDinLink } from "@/lib/card-nou";
import { adresaPortalului } from "@/lib/plati/stripe";
import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Schimbarea cardului, din linkul primit pe e-mail.
 *
 * **De ce o rută și nu o pagină cu buton**, ca la oprirea donației: aici nu
 * se schimbă nimic la deschidere. Linkul duce într-un portal al lui Stripe,
 * unde omul trebuie să scrie el cardul — un scaner de e-mail care deschide
 * adresa din reflex ajunge pe o pagină de formular și pleacă. N-are ce opri
 * și n-are ce porni.
 *
 * **De ce se cere sesiunea abia acum.** Sesiunile de portal ale lui Stripe
 * expiră în câteva minute; una pusă în e-mail ar fi moartă până să-l
 * deschidă omul, seara.
 */
export async function GET(cerere: Request) {
  const adresa = new URL(cerere.url);
  const client = clientulDinLink({
    c: adresa.searchParams.get("c") ?? "",
    p: adresa.searchParams.get("p") ?? "",
    s: adresa.searchParams.get("s") ?? "",
  });

  if (!client) return pagina("expirat");

  const portal = await adresaPortalului(
    client,
    `${ADRESA_SITE}/contul-meu`,
  );
  if (!portal) return pagina("fara-portal");

  return Response.redirect(portal, 303);
}

/**
 * Când linkul nu mai e bun, sau portalul nu răspunde.
 *
 * Omul ăsta tocmai a apăsat „Schimbă cardul" dintr-un mesaj în care i-am
 * spus că donația lui n-a trecut. Dacă aici dă de o pagină albă cu o eroare,
 * nu mai încearcă pe altă cale: crede că s-a stricat ceva la noi și renunță.
 * Deci primește un telefon și o adresă, pe o pagină care seamănă cu site-ul.
 */
function pagina(fel: "expirat" | "fara-portal") {
  const titlu =
    fel === "expirat"
      ? "Linkul nu mai e bun"
      : "Schimbarea cardului nu merge chiar acum";
  const explicatie =
    fel === "expirat"
      ? "A trecut prea mult timp de când ți-am trimis mesajul. Sună-ne și pornim donația din nou, în două minute."
      : "E ceva la noi, nu la tine. Sună-ne sau scrie-ne și o rezolvăm pe loc.";

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
</style></head>
<body><main><div class="card">
  <h1>${scapa(titlu)}</h1>
  <p>${scapa(explicatie)}</p>
  <p>
    Sună la <a href="tel:${TELEFON_PRINCIPAL.apel}">${scapa(TELEFON_PRINCIPAL.afisat)}</a><br />
    sau scrie la <a href="mailto:${EMAIL.contact}">${scapa(EMAIL.contact)}</a>
  </p>
  <p>Nu ne datorezi nimic și nu s-a pierdut nimic — donația lunară pur și simplu nu s-a mai luat.</p>
</div></main></body></html>`;

  return new Response(html, {
    status: fel === "expirat" ? 410 : 503,
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
