import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areR2, urcaInR2 } from "@/lib/r2";
import { documentDupaSlug } from "@/lib/documente";
import { ETICHETA_DOCUMENTE } from "@/lib/documente-gata";

/**
 * Urcarea unui document de descărcat.
 *
 * Slugul vine din formular, dar nu e crezut pe cuvânt: se caută în lista fixă
 * din `lib/documente.ts`, iar cheia din R2 se ia de acolo. Altfel cineva ar
 * putea scrie în formular orice cale și ar scrie peste orice fișier din
 * depozit.
 *
 * Fișierul se înlocuiește, nu se păstrează și cel vechi: două modele de
 * contract în circulație înseamnă două contracte diferite semnate de două
 * firme, iar diferența se vede abia la contabilitate.
 */

const INAPOI = "/admin/documente";
const MAXIM = 10 * 1024 * 1024;

function gata(cerere: Request, cod: string) {
  return NextResponse.redirect(
    new URL(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`, cerere.url),
    { status: 303 },
  );
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-documente",
    maxim: 30,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const doc = documentDupaSlug(text(formular.get("slug"), 60) ?? "");
  if (!doc) return gata(cerere, "necunoscut");

  const fisier = formular.get("fisier");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return gata(cerere, "fisier");
  }
  if (fisier.size > MAXIM) return gata(cerere, "mare");

  const octeti = new Uint8Array(await fisier.arrayBuffer());

  /*
    Se verifică primii patru octeți, nu numele fișierului.

    „%PDF". Un document Word redenumit în .pdf trece orice verificare pe
    extensie, iar firma care îl descarcă primește un fișier care nu se
    deschide — și crede că e vina ei.
  */
  const estePdf =
    octeti[0] === 0x25 &&
    octeti[1] === 0x50 &&
    octeti[2] === 0x44 &&
    octeti[3] === 0x46;
  if (!estePdf) return gata(cerere, "pdf");

  if (!areR2()) return gata(cerere, "depozit");

  const urcat = await urcaInR2(doc.cheie, octeti, "application/pdf").catch(
    () => null,
  );
  /*
    Golirea etichetei nu e un amănunt: de ea atârnă butonul.

    Cardurile de pe pagina de 3,5% sunt inactive cât timp documentul nu
    există. Fără golire, omul urcă declarația și butonul rămâne stins încă o
    oră — adică exact purtarea care îl face să creadă că n-a urcat nimic.
  */
  if (urcat) revalidateTag(ETICHETA_DOCUMENTE, "max");
  return gata(cerere, urcat ? "urcat" : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
