import { NextResponse } from "next/server";
import { citesteJson, limitaDeRata, raspuns } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { areStripe } from "@/lib/plati/stripe";
import { arePayPal } from "@/lib/plati/paypal";
import {
  confirmaSesiuneaStripe,
  incaseazaSiInregistreaza,
} from "@/lib/plati/confirmare";

/**
 * Confirmarea plății din pagina de mulțumire.
 *
 * Pagina primește în adresă identificatorul plății (`sesiune` de la Stripe,
 * `token` de la PayPal) și îl trimite aici. Adresa n-are nicio autoritate:
 * oricine o poate scrie. De aceea nu se crede nimic din ea — se întreabă
 * Stripe sau PayPal, cu cheile secrete, dacă plata chiar s-a făcut.
 *
 * La Stripe e a doua cale, pe lângă webhook: dacă anunțul nu ajunge, donația
 * apare totuși în panou în clipa în care omul vede pagina de mulțumire. La
 * PayPal e calea principală: aici se încasează comanda aprobată.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "confirma-plata",
    maxim: 20,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;
  if (!areBazaDeDate()) return NextResponse.json({ stare: "necunoscuta" });

  const citire = await citesteJson(cerere, 2048);
  if (!citire.ok) return citire.raspuns;
  const { sesiune, paypal } = citire.corp;

  try {
    if (typeof sesiune === "string" && areStripe()) {
      return NextResponse.json({ stare: await confirmaSesiuneaStripe(sesiune) });
    }
    if (typeof paypal === "string" && arePayPal()) {
      const ok = await incaseazaSiInregistreaza(paypal);
      return NextResponse.json({ stare: ok ? "platita" : "neplatita" });
    }
  } catch (e) {
    console.error("Confirmarea plății:", e instanceof Error ? e.message : "eroare");
    return raspuns("Nu am putut verifica plata acum.", 502);
  }
  return NextResponse.json({ stare: "necunoscuta" });
}
