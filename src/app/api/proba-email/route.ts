import { NextResponse } from "next/server";
import { raspuns } from "@/lib/api";
import { construiesteMultumirea } from "@/lib/email/donatie";

/**
 * Previzualizarea șabloanelor de e-mail, numai în dezvoltare.
 *
 * Un e-mail nu se poate verifica din cod: tabelele, stilurile în linie și
 * butoanele din celule arată altfel decât par. Ruta asta îl randează ca
 * pagină, ca să poată fi privit și fotografiat. În producție răspunde 404 —
 * n-are ce căuta pe un site viu.
 */
export async function GET(cerere: Request) {
  if (process.env.NODE_ENV === "production") {
    return raspuns("Indisponibil.", 404);
  }

  const fel = new URL(cerere.url).searchParams.get("fel") ?? "o-data";
  const compus = construiesteMultumirea({
    email: "ana@example.com",
    prenume: fel === "fara-nume" ? null : "Ana",
    nume: "Pop",
    sumaBani: fel === "lunar" || fel === "reinnoire" ? 5000 : 15000,
    moneda: "RON",
    frecventa: fel === "lunar" || fel === "reinnoire" ? "lunar" : "o-data",
    destinatie: "tabere",
    reinnoire: fel === "reinnoire",
  });

  return new NextResponse(compus.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
