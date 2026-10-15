import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { hotarasteContract } from "@/lib/contracte";

/**
 * Contrasemnarea unui contract semnat online de firmă.
 *
 * Nu pune nicio semnătură în document — asociația semnează pe hârtie sau cu
 * certificatul ei, în afara site-ului. Butonul de aici spune doar că treaba
 * s-a făcut, ca lista să nu mai ceară o faptă deja făcută.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-contracte",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const id = String(formular.get("id") ?? "");
  const hotarare = String(formular.get("hotarare") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.redirect(
      new URL(
        `/admin/contracte?eroare=${encodeURIComponent("Contract necunoscut.")}`,
        cerere.url,
      ),
      { status: 303 },
    );
  }
  if (hotarare !== "contrasemnat" && hotarare !== "anulat") {
    return raspuns("Hotărâre necunoscută.", 400);
  }

  const schimbat = await hotarasteContract(id, hotarare);
  const unde = schimbat
    ? `/admin/contracte?gata=${hotarare}`
    : `/admin/contracte?eroare=${encodeURIComponent("Contractul fusese deja rezolvat.")}`;

  return NextResponse.redirect(new URL(unde, cerere.url), { status: 303 });
}
