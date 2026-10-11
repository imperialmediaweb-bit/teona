import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { esteStadiuFirma, schimbaStadiulFirmei } from "@/lib/crm";
import { citesteSuma } from "@/lib/suma";
import { inBani } from "@/date/plati";

/** Mută o firmă dintr-un stadiu în altul și, la final, notează suma încasată. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-firme",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Firmă necunoscută.", 400);

  const stadiu = formular.get("stadiu");
  if (!esteStadiuFirma(stadiu)) return raspuns("Stadiu necunoscut.", 400);

  // Suma e opțională: de obicei se completează abia la „bani încasați”.
  // Scrisă greșit, nu pierdem mutarea stadiului — o lăsăm neschimbată.
  const brut = String(formular.get("suma") ?? "").trim();
  const { suma } = brut ? citesteSuma(brut) : { suma: null };

  await schimbaStadiulFirmei(
    id,
    stadiu,
    suma === null ? null : inBani(suma),
  );

  return NextResponse.redirect(new URL(`/admin/firme#${id}`, cerere.url), {
    status: 303,
  });
}
