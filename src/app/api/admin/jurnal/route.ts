import { NextResponse } from "next/server";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { esteFelInteractiune, scrieInteractiune } from "@/lib/crm";

/**
 * Scrie un rând în jurnalul discuțiilor.
 *
 * `inapoi` spune unde se întoarce omul după salvare — lista din care a
 * deschis jurnalul, cu filtrele ei cu tot. Vine dintr-un câmp de formular,
 * deci din afară: se acceptă numai o cale din panou, altfel răspunsul ar
 * putea fi folosit ca trambulină de redirecționare către alt sit.
 */
const INAPOI = /^\/admin\/(firme|donatori|cereri)(\?[\w=&%.\-+]*)?$/;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-jurnal",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const fel = formular.get("fel");
  if (!esteFelInteractiune(fel)) return raspuns("Fel necunoscut.", 400);

  const rezumat = text(formular.get("rezumat"), 2_000);
  if (!rezumat) return raspuns("Scrie ce s-a vorbit.", 400);

  const email = String(formular.get("email") ?? "").trim() || undefined;
  const firmaId = String(formular.get("firma_id") ?? "").trim() || undefined;
  if (firmaId && !/^[0-9a-f-]{36}$/i.test(firmaId)) {
    return raspuns("Firmă necunoscută.", 400);
  }
  if (!email && !firmaId) return raspuns("Cerere invalidă.", 400);

  const scris = await scrieInteractiune({ email, firmaId, fel, rezumat });
  if (!scris) return raspuns("Nu am putut salva.", 502);

  const cerut = String(formular.get("inapoi") ?? "");
  const inapoi = INAPOI.test(cerut) ? cerut : "/admin";
  const cheie = firmaId ?? email ?? "";
  const separator = inapoi.includes("?") ? "&" : "?";

  return NextResponse.redirect(
    new URL(
      `${inapoi}${separator}deschis=${encodeURIComponent(cheie)}${firmaId ? `#${firmaId}` : ""}`,
      cerere.url,
    ),
    { status: 303 },
  );
}
