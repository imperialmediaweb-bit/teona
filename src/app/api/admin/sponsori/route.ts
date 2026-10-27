import { revalidateTag } from "next/cache";
import { limitaDeRata, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { POZA_MAXIM, pareImagine, urcaPoza } from "@/lib/poza-urcata";
import {
  ETICHETA_SPONSORI,
  faceSponsor,
  mutaSponsor,
  schimbaSponsor,
  schimbaStareaSponsorului,
} from "@/lib/sponsori";
import { pareSvg, potrivesteSigla } from "@/lib/sigla-potrivita";

/**
 * Siglele sponsorilor: adăugate, schimbate, scoase, mutate.
 *
 * Sigla urcată merge în Cloudinary, în subdosarul `sigle` — separat de pozele
 * de la vizitatori și de cele ale asociației. Un fișier de siglă e mic și se
 * schimbă rar; n-are ce căuta amestecat cu fotografiile din tabere.
 */

const INAPOI = "/admin/sponsori";

function gata(cerere: Request, cod: string) {
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-sponsori",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const fel = String(formular.get("fel") ?? "");
  const id = String(formular.get("id") ?? "").trim();

  if (fel === "opreste" || fel === "porneste") {
    const schimbat = await schimbaStareaSponsorului(
      id,
      fel === "porneste",
    ).catch(() => false);
    if (schimbat) revalidateTag(ETICHETA_SPONSORI, "max");
    return gata(cerere, schimbat ? "stare" : "necunoscut");
  }

  if (fel === "sus" || fel === "jos") {
    const mutat = await mutaSponsor(id, fel).catch(() => false);
    if (mutat) revalidateTag(ETICHETA_SPONSORI, "max");
    return gata(cerere, mutat ? "mutat" : "necunoscut");
  }

  const nume = text(formular.get("nume"), 120) ?? "";
  const adresa = text(formular.get("adresa"), 200) ?? null;

  /*
    Numele e singurul lucru pe care nu-l putem completa noi.

    Fără el, textul alternativ al siglei ar fi „siglă de sponsor" — care nu
    spune nimic cui ascultă pagina cu un cititor de ecran — iar sub siglă n-am
    avea ce scrie. Regula e de dinainte, din `date/sponsori.ts`.
  */
  if (!nume) return gata(cerere, "nume");

  if (id) {
    const schimbat = await schimbaSponsor(id, { nume, adresa }).catch(
      () => false,
    );
    if (schimbat) revalidateTag(ETICHETA_SPONSORI, "max");
    return gata(cerere, schimbat ? "schimbat" : "necunoscut");
  }

  const fisier = formular.get("poza");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return gata(cerere, "poza");
  }
  if (fisier.size > POZA_MAXIM) return gata(cerere, "mare");

  const octeti = new Uint8Array(await fisier.arrayBuffer());
  /*
    Se verifică octeții, nu extensia: un fișier oarecare redenumit în .png ar
    ajunge pe prima pagină ca o imagine ruptă, lângă sigle adevărate.
  */
  if (!pareImagine(fisier.type, octeti) && !pareSvg(fisier.type, octeti)) {
    return gata(cerere, "imagine");
  }

  // Oricum vine — cu margini, în SVG, albă pe transparent —, iese potrivită.
  const sigla = await potrivesteSigla(octeti, fisier.type).catch(() => null);
  if (!sigla) return gata(cerere, "imagine");

  const urcata = await urcaPoza(sigla.octeti, sigla.tip, "sigle").catch(() => null);
  if (!urcata) return gata(cerere, "depozit");

  const facut = await faceSponsor({
    nume,
    pozaId: urcata.id,
    adresa,
  }).catch(() => false);
  if (facut) revalidateTag(ETICHETA_SPONSORI, "max");
  return gata(cerere, facut ? "facut" : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
