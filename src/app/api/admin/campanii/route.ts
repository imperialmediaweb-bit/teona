import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { hotaraste } from "@/lib/campanii";

/** Publicarea sau respingerea unei campanii, din lista de verificare. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-campanii",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const id = String(formular.get("id") ?? "");
  const hotarare = String(formular.get("hotarare") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return raspuns("Campanie necunoscută.", 400);
  if (hotarare !== "publicata" && hotarare !== "respinsa") {
    return raspuns("Hotărâre necunoscută.", 400);
  }

  await hotaraste(
    id,
    hotarare,
    String(formular.get("motiv") ?? "") || undefined,
  );
  return NextResponse.redirect(new URL("/admin/campanii", cerere.url), {
    status: 303,
  });
}
