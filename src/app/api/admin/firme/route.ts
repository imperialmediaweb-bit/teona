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

  /*
    Suma e opțională: de obicei se completează abia la „bani încasați".

    Dar dacă e scrisă și nu se poate citi, **omul trebuie să afle**. Înainte
    eroarea era aruncată la gunoi: stadiul se muta, suma rămânea
    neschimbată, iar răspunsul arăta exact ca o reușită. Cineva care scria
    „12.500 lei." vedea firma mutată și pleca liniștit, fără sumă trecută.
  */
  const brut = String(formular.get("suma") ?? "").trim();
  const citita = brut ? citesteSuma(brut) : { suma: null, eroare: undefined };

  if (brut && (citita.eroare || citita.suma === null)) {
    return NextResponse.redirect(
      new URL(
        `/admin/firme?eroare=${encodeURIComponent(citita.eroare ?? "Nu am înțeles suma.")}#${id}`,
        cerere.url,
      ),
      { status: 303 },
    );
  }

  await schimbaStadiulFirmei(
    id,
    stadiu,
    citita.suma === null ? null : inBani(citita.suma),
  );

  return NextResponse.redirect(new URL(`/admin/firme#${id}`, cerere.url), {
    status: 303,
  });
}
