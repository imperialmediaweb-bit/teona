import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { esteStadiuCerere, schimbaStadiulCererii } from "@/lib/crm";

/** Mută o cerere între „nou”, „în lucru” și „rezolvat”. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-cereri",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Cerere necunoscută.", 400);

  const stadiu = formular.get("stadiu");
  if (!esteStadiuCerere(stadiu)) return raspuns("Stadiu necunoscut.", 400);

  await schimbaStadiulCererii(id, stadiu);

  const fel = String(formular.get("fel") ?? "");
  return NextResponse.redirect(
    new URL(`/admin/cereri${/^\w+$/.test(fel) ? `?fel=${fel}` : ""}`, cerere.url),
    { status: 303 },
  );
}
