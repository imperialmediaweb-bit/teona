import { limitaDeRata, raspuns, text } from "@/lib/api";
import {
  SCHIMBURI,
  areAsistentPeSite,
  raspunde,
  type Mesaj,
} from "@/lib/intreaba/raspunde";

/**
 * Întrebările vizitatorilor către asistent.
 *
 * **Capăt public care cheamă un API plătit**, deci strâns legat:
 *
 * - **douăzeci de întrebări pe oră, pe adresă.** Un om care se lămurește pune
 *   trei-patru. Cine pune douăzeci nu se mai lămurește de pe site;
 * - **întrebarea taie la 600 de semne**, conversația la șase schimburi.
 *   Cineva care lipește în casetă un roman întreg plătește cât un roman
 *   întreg — dar nu de pe punga asociației;
 * - **răspunsul pleacă pe măsură ce se scrie**, ca omul să nu se uite la o
 *   casetă goală câteva secunde.
 *
 * Nimic din ce scrie omul nu se salvează nicăieri: conversația trăiește în
 * fila lui și atât. Pentru o casetă în care oamenii scriu uneori despre
 * boala copilului, a nu ține nimic e singura purtare cuviincioasă.
 */

const LUNGIME_INTREBARE = 600;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "intreaba",
    maxim: 20,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!areAsistentPeSite()) {
    return raspuns("Asistentul nu e pornit acum.", 503);
  }

  const corp = (await cerere.json().catch(() => null)) as {
    mesaje?: Array<{ rol?: unknown; text?: unknown }>;
  } | null;
  if (!corp || !Array.isArray(corp.mesaje)) {
    return raspuns("Cerere invalidă.", 400);
  }

  /*
    O întrebare prea lungă e refuzată, nu tăiată.

    Tăiată, omul ar primi răspuns la jumătate din ce a întrebat și n-ar ști de
    ce. Caseta oprește oricum scrisul la 600 de semne; aici se prinde ce vine
    din altă parte decât caseta.
  */
  if (
    corp.mesaje.some(
      (m) => String(m.text ?? "").trim().length > LUNGIME_INTREBARE,
    )
  ) {
    return raspuns(
      `Întrebarea e prea lungă. Scrie-o în cel mult ${LUNGIME_INTREBARE} de semne.`,
      400,
    );
  }

  const istoric: Mesaj[] = corp.mesaje
    .slice(-SCHIMBURI * 2)
    .map((m) => ({
      rol: m.rol === "asistent" ? ("asistent" as const) : ("om" as const),
      text: text(String(m.text ?? ""), LUNGIME_INTREBARE) ?? "",
    }))
    .filter((m) => m.text.length > 0);

  if (istoric.length === 0) return raspuns("Scrie o întrebare.", 400);
  if (istoric[istoric.length - 1].rol !== "om") {
    return raspuns("Ultimul mesaj trebuie să fie al omului.", 400);
  }

  const flux = new ReadableStream<Uint8Array>({
    async start(controller) {
      const codor = new TextEncoder();
      try {
        for await (const bucata of raspunde(istoric)) {
          controller.enqueue(codor.encode(bucata));
        }
      } catch {
        controller.enqueue(
          codor.encode(
            "Nu am putut răspunde acum. Sună la 0754 510 167 sau scrie la contact@teona-ariana.ro.",
          ),
        );
      }
      controller.close();
    },
  });

  return new Response(flux, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      // Fără asta, proxiul de pe drum adună tot răspunsul și îl dă la final,
      // iar transmiterea pe bucăți nu se mai vede.
      "x-accel-buffering": "no",
    },
  });
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
