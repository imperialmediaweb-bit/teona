import { limitaDeRata, raspuns } from "@/lib/api";
import { cautaFirma, cuiValid, curataCui } from "@/lib/anaf";

/**
 * Caută o firmă după CUI, în datele publice ale ANAF.
 *
 * Folosită de calculatorul de sponsorizare și de formularul firmelor: omul
 * scrie CUI-ul, restul se completează singur.
 *
 * **De ce trece prin serverul nostru și nu direct din browser.** ANAF nu
 * trimite antetele care ar lăsa un browser să-i citească răspunsul de pe alt
 * domeniu; o cerere din pagină ar fi oprită oricum. În plus, aici putem ține
 * răspunsurile în memorie și putem pune o limită, ca site-ul să nu ajungă să
 * bată la ușa ANAF de o mie de ori pe minut.
 *
 * Datele sunt publice și sunt despre firme, nu despre persoane.
 */
export async function GET(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "firma",
    maxim: 30,
    fereastraMs: 60_000,
  });
  if (prea) return prea;

  const brut = new URL(cerere.url).searchParams.get("cui") ?? "";
  const cui = curataCui(brut);
  if (cui === null || !cuiValid(cui)) {
    return raspuns("CUI-ul nu pare bun. Verifică cifrele.", 400);
  }

  const firma = await cautaFirma(cui);
  if (!firma) {
    return raspuns("Nu am găsit nicio firmă cu CUI-ul ăsta la ANAF.", 404);
  }

  return Response.json(firma, { headers: { "Cache-Control": "no-store" } });
}
