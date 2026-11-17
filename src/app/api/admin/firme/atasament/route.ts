import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { raspuns, sesiuneExpirata } from "@/lib/api";
import { atasamentul, tipDupaNume } from "@/lib/mesaje-firme";

/** Un atașament dintr-un e-mail cu o firmă (trimis sau primit). Numai pentru panou. */
export async function GET(cerere: Request) {
  if (!(await arePermisiune("/admin/firme"))) return sesiuneExpirata();
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  const id = new URL(cerere.url).searchParams.get("id") ?? "";
  const a = await atasamentul(id);
  if (!a) return raspuns("Fișierul nu există.", 404);
  // Tipul real: cel venit cu fișierul sau, dacă a venit „octet-stream”, cel după extensie.
  const tip = a.tip && a.tip !== "application/octet-stream" ? a.tip : tipDupaNume(a.nume);
  /*
    PDF-urile și pozele se deschid în browser; restul se descarcă. Niciodată
    deschis aici HTML sau SVG: ar rula în adresa panoului.
    PDF-ul n-are `sandbox` în CSP: cititorul de PDF din Chrome nu se deschide
    sub el (pagină albă). Cititorul rulează oricum separat de pagină.
  */
  const poza = /^image\/(jpeg|png|webp|gif)$/.test(tip);
  const pdf = tip === "application/pdf";
  const nume = encodeURIComponent(a.nume);
  return new Response(new Uint8Array(a.continut), {
    headers: {
      "content-type": poza || pdf ? tip : /^(text\/html|image\/svg|application\/xhtml)/i.test(tip) ? "application/octet-stream" : tip,
      "content-disposition": `${poza || pdf ? "inline" : "attachment"}; filename*=UTF-8''${nume}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      ...(pdf ? {} : { "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }),
    },
  });
}
