import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { areR2, urcaInR2 } from "@/lib/r2";
import {
  esteStadiu230,
  schimbaStarea230,
  stergeFormular230,
} from "@/lib/formulare230";
import { CHEIE_FORMULAR } from "@/app/formular-230/route";

/**
 * Ce se face din panou cu formularele 230: se urcă cel gol, se mută stadiul
 * celor primite, se șterg.
 *
 * Ștergerea e singurul loc din tot panoul care scoate definitiv un fișier cu
 * CNP pe el. De aceea șterge întâi din R2 și abia apoi rândul: invers, o
 * cădere ar lăsa în depozit o fotografie pe care nimeni n-ar mai putea s-o
 * găsească.
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

  const id = camp("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Formular necunoscut.", 400);

  if (actiune === "sterge") {
    const sters = await stergeFormular230(id);
    return inapoi(cerere, sters ? "sters" : "nesters");
  }

  const stare = camp("stare");
  if (!esteStadiu230(stare)) return raspuns("Stadiu necunoscut.", 400);
  await schimbaStarea230(id, stare, camp("observatii") || undefined);
  return inapoi(cerere, "mutat");
}

function inapoi(cerere: Request, ce: string) {
  return NextResponse.redirect(
    new URL(`/admin/formulare?gata=${ce}`, cerere.url),
    { status: 303 },
  );
}
