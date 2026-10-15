import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { areR2, urcaInR2 } from "@/lib/r2";
import { CHEIE_FORMULAR } from "@/app/formular-230/route";

/**
 * Urcarea fișierului 230 gol, cel pe care îl descarcă oamenii.
 *
 * Atât face ruta asta. Anunțurile „am completat formularul" sunt cereri
 * obișnuite în CRM și se mută de acolo, cu `/api/admin/cereri` — site-ul nu
 * primește poza formularului și nu ține niciun CNP.
 *
 * Fișierul gol n-are nicio dată personală în el: e formularul tipizat, cu
 * datele asociației completate.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-formulare",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();
  const actiune = camp("actiune");

  if (actiune === "urca-gol") {
    const fisier = formular.get("fisier");
    if (!(fisier instanceof File) || fisier.size === 0) {
      return raspuns("Alege fișierul PDF al formularului.", 400);
    }
    if (fisier.size > 10 * 1024 * 1024) {
      return raspuns("Fișierul e prea mare.", 400);
    }
    const octeti = new Uint8Array(await fisier.arrayBuffer());
    const estePdf =
      octeti[0] === 0x25 &&
      octeti[1] === 0x50 &&
      octeti[2] === 0x44 &&
      octeti[3] === 0x46;
    if (!estePdf) return raspuns("Fișierul nu e un PDF.", 400);
    if (!areR2()) return raspuns("Depozitul de fișiere nu e configurat.", 503);

    const urcat = await urcaInR2(CHEIE_FORMULAR, octeti, "application/pdf");
    if (!urcat) return raspuns("N-am putut urca fișierul.", 502);
    return inapoi(cerere, "urcat");
  }

  return raspuns("Acțiune necunoscută.", 400);
}

function inapoi(cerere: Request, ce: string) {
  return NextResponse.redirect(
    new URL(`/admin/formulare?gata=${ce}`, cerere.url),
    { status: 303 },
  );
}
