import { formularCuLimita, limitaDeRata, raspuns } from "@/lib/api";
import { clientulDinLink } from "@/lib/card-nou";
import { adresaPortalului } from "@/lib/plati/stripe";
import { ADRESA_SITE } from "@/app/seo";
import { pagina } from "@/app/actualizeaza-cardul/pagina";

/**
 * Butonul „Schimbă cardul” de pe `/actualizeaza-cardul`: cere **acum** o
 * sesiune de portal de la Stripe și duce omul acolo. Prin POST, ca un scaner
 * de e-mail să nu ajungă în portalul donatorului (vezi pagina).
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "cont-card",
    maxim: 10,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await formularCuLimita(cerere, 8 * 1024);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const client = clientulDinLink({
    c: String(formular.get("c") ?? ""),
    p: String(formular.get("p") ?? ""),
    s: String(formular.get("s") ?? ""),
  });
  if (!client) return pagina("expirat");

  const portal = await adresaPortalului(client, `${ADRESA_SITE}/contul-meu`);
  if (!portal) return pagina("fara-portal");

  // Adresă din afară (Stripe): aici redirecționarea absolută e cea corectă.
  return Response.redirect(portal, 303);
}
