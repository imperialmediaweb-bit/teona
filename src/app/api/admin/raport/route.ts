import { limitaDeRata, raspuns } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { pdfAnual, pdfCampanie, pdfLunar } from "@/lib/rapoarte/scrie";

/**
 * Un raport, scos ca PDF.
 *
 * Aceleași paze ca la exportul pentru Excel: cere sesiune, nu se ține în
 * niciun cache și e limitat la rată. Raportul lunar conține nume de donatori,
 * iar celelalte două, chiar fără nume, sunt cifrele financiare ale asociației
 * — nu stau la adresă publică.
 *
 * Perioada vine din adresă, deci se verifică cifră cu cifră: o lună scrisă
 * altfel decât `2026-10` sau un an din afara intervalului în care asociația
 * a existat nu ajung la baza de date, ci primesc 400.
 */

const LUNA = /^\d{4}-(0[1-9]|1[0-2])$/;
/** Asociația e înscrisă în registru din 2021; un an dinainte n-are sens. */
const PRIMUL_AN = 2021;

function numeFisier(parti: string[]): string {
  return `${parti.join("-")}.pdf`;
}

export async function GET(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-raport",
    maxim: 20,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/rapoarte"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const cauta = new URL(cerere.url).searchParams;
  const fel = cauta.get("fel");

  let pdf: Uint8Array | null = null;
  let nume = "";

  if (fel === "lunar") {
    const luna = cauta.get("luna") ?? "";
    if (!LUNA.test(luna)) return raspuns("Luna nu e scrisă corect.", 400);
    pdf = await pdfLunar(luna);
    nume = numeFisier(["Raport", "lunar", luna]);
  } else if (fel === "anual") {
    const an = Number(cauta.get("an"));
    const acum = new Date().getUTCFullYear();
    if (!Number.isInteger(an) || an < PRIMUL_AN || an > acum) {
      return raspuns("Anul nu e valid.", 400);
    }
    pdf = await pdfAnual(an);
    nume = numeFisier(["Raport", "anual", String(an)]);
  } else if (fel === "campanie") {
    const slug = cauta.get("campanie") ?? "";
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) {
      return raspuns("Campanie necunoscută.", 400);
    }
    pdf = await pdfCampanie(slug);
    if (!pdf) return raspuns("Campania nu există.", 404);
    nume = numeFisier(["Raport", "campanie", slug]);
  } else {
    return raspuns("Raport necunoscut.", 400);
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nume}"`,
      "cache-control": "no-store",
    },
  });
}
