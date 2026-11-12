import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { adresaPoza, areCloudinary, tipDinOcteti, urcaPoza } from "@/lib/poza-urcata";

/**
 * O poză pusă în mijlocul textului, din butonul „Poză” al editorului.
 *
 * Merge în Cloudinary, în subdosarul `texte`, și se întoarce adresa ei, pe
 * care editorul o pune în text. Răspunsul e JSON: îl citește `EditorText`.
 */
const MAXIM = 25 * 1024 * 1024;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-poza-in-text",
    maxim: 200,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/scrie"))) return sesiuneExpirata();
  if (!areCloudinary()) {
    return raspuns("Lipsesc cheile Cloudinary din Railway; pozele nu se pot urca.", 503);
  }

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const fisier = citit.formular.get("poza");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return raspuns("N-a venit nicio poză.", 400);
  }
  if (fisier.size > MAXIM) return raspuns("Poza are peste 25 MB.", 413);

  const octeti = new Uint8Array(await fisier.arrayBuffer());
  const tip = tipDinOcteti(octeti);
  if (!tip) {
    return raspuns(
      "Fișierul nu e JPEG, PNG sau WebP (pozele HEIC de pe iPhone trebuie salvate întâi ca JPEG).",
      415,
    );
  }
  const urcata = await urcaPoza(octeti, tip, "texte");
  if (!urcata) return raspuns("Poza n-a putut fi urcată. Încearcă din nou.", 503);

  return Response.json(
    { id: urcata.id, adresa: adresaPoza(urcata.id, 1400), latime: urcata.latime, inaltime: urcata.inaltime },
    { headers: { "Cache-Control": "no-store" } },
  );
}
