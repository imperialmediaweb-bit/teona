import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { hotarasteTransfer } from "@/lib/plati/donatori";

/**
 * Confirmarea unui transfer anunțat de donator.
 *
 * Donatorul spune pe site că a făcut transferul; anunțul lui nu se numără
 * nicăieri. Aici, după ce cineva l-a găsit în extrasul de cont, devine
 * donație adevărată — sau se respinge, dacă banii n-au ajuns niciodată.
 *
 * Confirmarea e singurul loc în care o sumă venită dintr-un formular public
 * intră în totalurile asociației. De asta trece prin panou, cu parolă, și nu
 * se întâmplă singură.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-transfer",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const inapoi = (parametru: string) =>
    NextResponse.redirect(
      new URL(`/admin/donatii?${parametru}`, cerere.url),
      { status: 303 },
    );

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return inapoi(`eroare=${encodeURIComponent("Transfer necunoscut.")}`);
  }

  const hotarare = String(formular.get("hotarare") ?? "");
  if (hotarare !== "confirma" && hotarare !== "respinge") {
    return inapoi(`eroare=${encodeURIComponent("Hotărâre necunoscută.")}`);
  }

  const schimbat = await hotarasteTransfer(id, hotarare === "confirma");

  if (!schimbat) {
    return inapoi(
      `eroare=${encodeURIComponent(
        "Transferul ăsta a fost deja rezolvat — poate de altcineva, între timp.",
      )}`,
    );
  }

  return inapoi(hotarare === "confirma" ? "gata=1" : "respins=1");
}
