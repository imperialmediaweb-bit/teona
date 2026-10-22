import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import {
  ETICHETA_TEXTE_PAGINI,
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

function gata(cerere: Request, cod: string) {
  return NextResponse.redirect(
    new URL(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`, cerere.url),
    { status: 303 },
  );
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-texte-pagini",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const cheie = text(formular.get("cheie"), 80) ?? "";

  if (String(formular.get("fel") ?? "") === "inapoi") {
    const readus = await readuTextPagina(cheie).catch(() => false);
    if (readus) revalidateTag(ETICHETA_TEXTE_PAGINI, "max");
    return gata(cerere, readus ? "readus" : "necunoscut");
  }

  const continut = text(formular.get("continut"), 6000) ?? "";
  /*
    Un text gol ar lăsa un paragraf alb în mijlocul paginii, între o
    fotografie și un titlu — adică ar arăta ca o pagină stricată, nu ca o
    alegere. Cine vrea textul scurtat îl scurtează; cine vrea secțiunea goală
    îmi spune, fiindcă atunci dispare și fotografia de lângă ea.
  */
  if (continut.trim().length < 3) return gata(cerere, "gol");

  const schimbat = await schimbaTextPagina(cheie, continut).catch(() => false);
  if (schimbat) revalidateTag(ETICHETA_TEXTE_PAGINI, "max");
  return gata(cerere, schimbat ? "schimbat" : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
