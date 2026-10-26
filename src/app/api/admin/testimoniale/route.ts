import { revalidateTag } from "next/cache";
import { limitaDeRata, raspuns, text, trimiteLa } from "@/lib/api";
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

/**
 * Cât încape în textul lung.
 *
 * O scrisoare de la o familie are câteva mii de semne; peste atât e altceva
 * și merită o pagină de noutate, nu un testimonial.
 */
const LUNG_MAXIM = 6000;

function gata(cerere: Request, cod: string) {
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
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
    Textul lung e opțional, dar dacă e prea lung se spune, nu se taie.

    `text()` întoarce `null` și când textul depășește limita, nu doar când
    lipsește. Scris ca `text(...) ?? null`, un text de 7000 de semne s-ar fi
    salvat ca „niciun text lung": omul apasă Salvează, primește „Schimbat", și
    scrisoarea pe care a lipit-o nu e nicăieri. Deci se compară cu ce a venit
    din formular: dacă a scris ceva și n-a trecut, se întoarce cu mesaj.
  */
  const lungBrut = String(formular.get("text_lung") ?? "").trim();
  const textLung = lungBrut ? text(lungBrut, LUNG_MAXIM) : null;
  if (lungBrut && !textLung) return gata(cerere, "lung");

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
      textLung,
    }).catch(() => false);
    if (schimbat) revalidateTag(ETICHETA_TESTIMONIALE, "max");
    return gata(cerere, schimbat ? "schimbat" : "necunoscut");
  }

  const facut = await faceTestimonial({
    citat,
    semnatura,
    sursa,
    textLung,
  }).catch(() => false);
  if (facut) revalidateTag(ETICHETA_TESTIMONIALE, "max");
  return gata(cerere, facut ? "facut" : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
