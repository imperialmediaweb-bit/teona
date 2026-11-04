import { clientulDinLink } from "@/lib/card-nou";
import { pagina } from "./pagina";

/**
 * Schimbarea cardului, din linkul primit pe e-mail.
 *
 * Pagina arată un buton; abia apăsarea lui (`POST /api/cont/card`) cere
 * sesiunea de portal de la Stripe și duce omul acolo. Până pe 4 noiembrie
 * 2026 portalul se deschidea la GET: un scaner de e-mail care deschide
 * adresa din reflex ajungea autentificat în portalul donatorului, cu cardul
 * lui pe ecran. Sesiunile de portal expiră în câteva minute, deci se cer
 * atunci, nu se pun în e-mail.
 */
export async function GET(cerere: Request) {
  const adresa = new URL(cerere.url);
  const dovada = {
    c: adresa.searchParams.get("c") ?? "",
    p: adresa.searchParams.get("p") ?? "",
    s: adresa.searchParams.get("s") ?? "",
  };
  if (!clientulDinLink(dovada)) return pagina("expirat");
  return pagina("buton", dovada);
}

