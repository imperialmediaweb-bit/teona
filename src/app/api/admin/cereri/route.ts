import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import {
  esteFelCerere,
  esteStadiuCerere,
  salveazaCerere,
  schimbaStadiulCererii,
} from "@/lib/crm";

/**
 * Cererile din panou: se mută între stadii, sau se adaugă de mână.
 *
 * Adăugarea de mână e pentru ce vine pe WhatsApp, pe telefon sau pe hârtie —
 * adică pentru tot ce nu trece prin formularele site-ului. Până acum, cineva
 * care trimitea poza pe WhatsApp rămânea doar în conversația aia.
 */
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

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  /*
    Adăugarea de mână, pentru ce vine pe WhatsApp sau pe telefon.

    Nu toată lumea trece prin formularul de pe site. Cineva trimite poza pe
    WhatsApp și atât; până acum, singurul loc în care rămânea era conversația
    aia. Acum se trece în aceeași listă ca restul, cu aceleași stadii și
    același export.

    E-mailul nu e obligatoriu aici: de pe WhatsApp ai un număr, nu o adresă.
    Cerut cu forța, cineva ar fi inventat una.
  */
  if (camp("actiune") === "adauga") {
    const nume = camp("nume");
    if (nume.length < 2) return raspuns("Scrie numele.", 400);
    if (!camp("email") && !camp("telefon")) {
      return raspuns("Scrie măcar un telefon sau un e-mail.", 400);
    }

    const felNou = camp("fel");
    if (!esteFelCerere(felNou)) return raspuns("Fel necunoscut.", 400);

    const ani = camp("ani");
    const deUnde = camp("deUnde");
    await salveazaCerere({
      fel: felNou,
      nume,
      email: camp("email") || undefined,
      telefon: camp("telefon") || undefined,
      detalii: {
        "Adăugat de mână": "da",
        ...(deUnde ? { "A venit prin": deUnde } : {}),
        ...(ani === "1" || ani === "2"
          ? { "Pe câți ani": ani === "2" ? "2 ani" : "1 an" }
          : {}),
        ...(camp("observatii") ? { Observații: camp("observatii") } : {}),
      },
    });

    return NextResponse.redirect(
      new URL(camp("inapoi") || "/admin/cereri", cerere.url),
      { status: 303 },
    );
  }

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Cerere necunoscută.", 400);

  const stadiu = formular.get("stadiu");
  if (!esteStadiuCerere(stadiu)) return raspuns("Stadiu necunoscut.", 400);

  await schimbaStadiulCererii(id, stadiu);

  const fel = String(formular.get("fel") ?? "");
  return NextResponse.redirect(
    new URL(
      `/admin/cereri${/^\w+$/.test(fel) ? `?fel=${fel}` : ""}`,
      cerere.url,
    ),
    { status: 303 },
  );
}
