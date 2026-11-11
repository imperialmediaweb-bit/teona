import { curataHtml } from "@/lib/curata-html";
import { esteHtml, textSimplu } from "@/lib/text-bogat";
import { revalidateTag } from "next/cache";
import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata, text, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import {
  ETICHETA_TEXTE_PAGINI,
  esteBogat,
  paginiCuTexte,
  readuTextPagina,
  schimbaTextPagina,
} from "@/lib/texte-pagini";

/**
 * Textele paginilor fixe, schimbate din panou.
 *
 * Ruta e separată de `/api/admin/texte`, care face noutăți și campanii: alea
 * sunt texte cu viață proprie — ciornă, publicare, adresă —, astea sunt
 * bucăți dintr-o pagină care există deja. Un singur capăt pentru amândouă ar
 * fi însemnat o rută care se întreabă la fiecare cerere ce fel de text
 * primește.
 *
 * Cheia nu e crezută pe cuvânt: se caută în lista fixă din `lib/texte-pagini.ts`.
 */

const INAPOI = "/admin/texte";

function gata(cerere: Request, cod: string, pagina = "") {
  // Înapoi pe aceeași pagină din „Pagini”, nu pe lista tuturor textelor.
  const pe = pagina ? `&pagina=${encodeURIComponent(pagina)}` : "";
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}${pe}#stare`);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-texte-pagini",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const { formular } = citit;

  const cheie = text(formular.get("cheie"), 80) ?? "";
  const pagina = paginiCuTexte().find((p) => p === formular.get("pagina")) ?? "";

  if (String(formular.get("fel") ?? "") === "inapoi") {
    const readus = await readuTextPagina(cheie).catch(() => false);
    if (readus) revalidateTag(ETICHETA_TEXTE_PAGINI, { expire: 0 });
    return gata(cerere, readus ? "readus" : "necunoscut", pagina);
  }

  const scris = text(formular.get("continut"), 20_000) ?? "";
  // Blocurile lungi vin din editorul cu bară, ca HTML: se curăță aici.
  const continut =
    esteBogat(cheie) && esteHtml(scris) ? curataHtml(scris) : scris;
  if (textSimplu(continut).join(" ").length > 6000) {
    return raspuns("Textul e prea lung (peste 6.000 de semne).", 413);
  }
  /*
    Un text gol ar lăsa un paragraf alb în mijlocul paginii, între o
    fotografie și un titlu — adică ar arăta ca o pagină stricată, nu ca o
    alegere. Cine vrea textul scurtat îl scurtează; cine vrea secțiunea goală
    îmi spune, fiindcă atunci dispare și fotografia de lângă ea.
  */
  if (textSimplu(continut).join(" ").trim().length < 3) return gata(cerere, "gol", pagina);

  const schimbat = await schimbaTextPagina(cheie, continut).catch(() => false);
  if (schimbat) revalidateTag(ETICHETA_TEXTE_PAGINI, { expire: 0 });
  return gata(cerere, schimbat ? "schimbat" : "necunoscut", pagina);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
