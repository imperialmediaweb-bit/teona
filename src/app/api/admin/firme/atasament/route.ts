import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { raspuns, sesiuneExpirata } from "@/lib/api";
import { atasamentul } from "@/lib/mesaje-firme";

/** Un atașament dintr-un e-mail cu o firmă (trimis sau primit). */
export async function GET(cerere: Request) {
  if (!(await arePermisiune("/admin/firme"))) return sesiuneExpirata();
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  const id = new URL(cerere.url).searchParams.get("id") ?? "";
  const a = await atasamentul(id);
  if (!a) return raspuns("Fișierul nu există.", 404);
  // Pozele și PDF-urile se deschid în browser; restul se descarcă.
  const inline = /^image\/(jpeg|png|webp|gif)$|^application\/pdf$/.test(a.tip);
  const nume = encodeURIComponent(a.nume);
  return new Response(new Uint8Array(a.continut), {
    headers: {
      "content-type": inline ? a.tip : "application/octet-stream",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${nume}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
