import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import {
  ETICHETA_TESTIMONIALE,
  faceTestimonial,
  schimbaStareaTestimonialului,
  schimbaTestimonial,
} from "@/lib/testimoniale";

/**
 * Testimonialele de pe prima pagină: adăugate, schimbate, oprite.
 *
 * Mesajele se întorc prin adresă, ca un cod scurt pe care pagina îl traduce
 * în română. Textul scris de om nu trece niciodată prin bara browserului: ar
 * ajunge în istoric și în jurnalele serverului, iar un citat de la un părinte
 * n-are ce căuta acolo.
 */

const INAPOI = "/admin/testimoniale";

function gata(cerere: Request, cod: string) {
  return NextResponse.redirect(
    new URL(`${INAPOI}?stare=${encodeURIComponent(cod)}`, cerere.url),
    { status: 303 },
  );
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-testimoniale",
    maxim: 40,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const fel = String(formular.get("fel") ?? "");
  const id = String(formular.get("id") ?? "").trim();

  if (fel === "opreste" || fel === "porneste") {
    const schimbat = await schimbaStareaTestimonialului(
      id,
      fel === "porneste",
    ).catch(() => false);
    if (schimbat) revalidateTag(ETICHETA_TESTIMONIALE, "max");
    return gata(cerere, schimbat ? "stare" : "necunoscut");
  }

  const citat = text(formular.get("citat"), 1200) ?? "";
  const semnatura = text(formular.get("semnatura"), 120) ?? "";
  const sursa = text(formular.get("sursa"), 80) ?? null;

  /*
    Se verifică doar ce se poate verifica.

    Caietul cere 20–35 de cuvinte, prenume și rol, fără nume de familie. Din
    astea, baza poate ști dacă citatul e gol sau dacă semnătura lipsește.
    Cuvintele se numără în pagină, sub ochiul omului, și nu-l opresc: un
    testimonial bun de 38 de cuvinte nu merită refuzat de un server, iar unul
    de 12 se vede că e scurt fără să i-o spună cineva.
  */
  if (citat.length < 20) return gata(cerere, "citat");
  if (!semnatura) return gata(cerere, "semnatura");

  if (id) {
    const schimbat = await schimbaTestimonial(id, {
      citat,
      semnatura,
      sursa,
    }).catch(() => false);
    if (schimbat) revalidateTag(ETICHETA_TESTIMONIALE, "max");
    return gata(cerere, schimbat ? "schimbat" : "necunoscut");
  }

  const facut = await faceTestimonial({ citat, semnatura, sursa }).catch(
    () => false,
  );
  if (facut) revalidateTag(ETICHETA_TESTIMONIALE, "max");
  return gata(cerere, facut ? "facut" : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
