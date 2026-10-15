import { legaturaSemnata, areR2 } from "@/lib/r2";
import { EMAIL } from "@/date/asociatie";

/**
 * Formularul 230 gol, pe care îl descarcă oamenii.
 *
 * Fișierul îl urcă asociația din panou și stă în R2, privat. Ruta asta îl
 * aduce și îl trimite mai departe, ca adresa publică să rămână
 * `teona-ariana.ro/formular-230` — una scurtă, de pus într-o postare, care
 * nu se schimbă când se înlocuiește fișierul.
 *
 * Nu se redirecționează către legătura semnată: aia expiră în zece minute,
 * iar o adresă trimisă pe WhatsApp e deschisă și a doua zi.
 */
export const CHEIE_FORMULAR = "public/formular-230.pdf";

export async function GET() {
  if (!areR2()) return lipseste();

  const legatura = legaturaSemnata(CHEIE_FORMULAR, 120);
  if (!legatura) return lipseste();

  try {
    const raspuns = await fetch(legatura, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!raspuns.ok || !raspuns.body) return lipseste();

    return new Response(raspuns.body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition":
          'inline; filename="Formular-230-Teona-Ariana.pdf"',
        // O zi: formularul se schimbă o dată pe an, dar nu vrem să rămână
        // vechiul în cache o lună după ce s-a înlocuit.
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return lipseste();
  }
}

function lipseste() {
  return new Response(
    `Formularul nu e încă încărcat pe site. Scrie-ne la ${EMAIL.contact} și ți-l trimitem.`,
    { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
