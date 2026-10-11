import { NextResponse } from "next/server";
import { raspuns } from "@/lib/api";
import { construiesteMultumirea } from "@/lib/email/donatie";
import {
  compuneAnunt,
  compuneHotarare,
  compuneTrimisa,
} from "@/lib/email/campanie";

/**
 * Previzualizarea șabloanelor de e-mail, numai în dezvoltare.
 *
 * Un e-mail nu se poate verifica din cod: tabelele, stilurile în linie și
 * butoanele din celule arată altfel decât par. Ruta asta îl randează ca
 * pagină, ca să poată fi privit și fotografiat. În producție răspunde 404 —
 * n-are ce căuta pe un site viu.
 *
 * `?fel=` alege șablonul:
 * - donații: `o-data`, `lunar`, `reinnoire`, `fara-nume`
 * - campanii aniversare: `campanie-trimisa`, `campanie-anunt`,
 *   `campanie-publicata`, `campanie-respinsa`
 */

const CAMPANIE = {
  email: "ana@example.com",
  numePublic: "Ana Pop",
  titlu: "Ziua mea, pentru copiii de la Casa Teona",
  slug: "ziua-mea-pentru-copiii-de-la-casa-teona",
};

function alege(fel: string) {
  switch (fel) {
    case "campanie-trimisa":
      return compuneTrimisa({ ...CAMPANIE, jeton: "a".repeat(32) });
    case "campanie-anunt":
      return compuneAnunt(CAMPANIE);
    case "campanie-publicata":
      return compuneHotarare({ ...CAMPANIE, publicata: true });
    case "campanie-respinsa":
      return compuneHotarare({
        ...CAMPANIE,
        publicata: false,
        motiv:
          "În poză apar copii care nu sunt ai tăi, iar noi nu putem publica fotografii fără acordul părinților.",
      });
    default:
      return construiesteMultumirea({
        email: "ana@example.com",
        prenume: fel === "fara-nume" ? null : "Ana",
        nume: "Pop",
        sumaBani: fel === "lunar" || fel === "reinnoire" ? 5000 : 15000,
        moneda: "RON",
        frecventa: fel === "lunar" || fel === "reinnoire" ? "lunar" : "o-data",
        destinatie: "tabere",
        reinnoire: fel === "reinnoire",
      });
  }
}

export async function GET(cerere: Request) {
  if (process.env.NODE_ENV === "production") {
    return raspuns("Indisponibil.", 404);
  }

  const fel = new URL(cerere.url).searchParams.get("fel") ?? "o-data";
  return new NextResponse(alege(fel).html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
