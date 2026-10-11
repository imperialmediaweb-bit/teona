import { NextResponse } from "next/server";
import { citesteJson, limitaDeRata, raspuns, text } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { areAsistent, esteFel, scrieCiorna } from "@/lib/asistent";

/**
 * Ciorna scrisă de asistent, pentru panoul de admin.
 *
 * Ruta nu trimite nimic nimănui: întoarce un titlu și un text, care ajung în
 * câmpurile formularului. Omul le citește, le schimbă, și abia pe urmă face
 * ciorna în MailerLite — pe care tot el o trimite.
 *
 * Limita de rată e mai strânsă decât pe formularele publice, și din alt
 * motiv: aici fiecare cerere costă bani la Anthropic. Zece pe oră ajung
 * pentru cineva care scrie un buletin informativ; o buclă dintr-un script nu
 * apucă să facă pagubă.
 */

/** Cât poate scrie omul în brief. Destul pentru context, nu cât o carte. */
const MAXIM_DESPRE = 4_000;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-asistent",
    maxim: 10,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  if (!areAsistent()) {
    return raspuns(
      "Asistentul nu e pornit. Lipsește ANTHROPIC_API_KEY din Railway.",
      503,
    );
  }

  const citire = await citesteJson(cerere);
  if (!citire.ok) return citire.raspuns;
  const corp = citire.corp;

  if (!esteFel(corp.fel)) {
    return raspuns("Alege ce fel de text vrei.", 400);
  }

  const despre = text(corp.despre, MAXIM_DESPRE);
  if (!despre || despre.length < 10) {
    return raspuns(
      "Scrie în câteva rânduri despre ce e vorba — altfel asistentul inventează, iar asta nu vrem.",
      400,
    );
  }

  const ciorna = await scrieCiorna({ fel: corp.fel, despre });
  if (!ciorna) {
    return raspuns(
      "Nu am putut scrie ciorna acum. Încearcă din nou peste un minut.",
      502,
    );
  }

  return NextResponse.json(ciorna, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
