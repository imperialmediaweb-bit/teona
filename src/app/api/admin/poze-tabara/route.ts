import { revalidateTag } from "next/cache";
import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areCloudinary, tipDinOcteti, urcaPoza } from "@/lib/poza-urcata";
import { puneDosarCloud } from "@/lib/texte";
import { ETICHETA_PROIECTE_PANOU } from "@/date/proiecte";
import { ETICHETA_POZE_CLOUD, RADACINA } from "@/date/proiecte-cloud";
import { calePozeTabara } from "@/lib/cale-poze-tabara";

/**
 * Pozele unei tabere, urcate din panou, una pe cerere.
 *
 * Asociația n-are cont în Cloudinary — contul e al dezvoltatorului. Până aici,
 * galeria unei tabere noi se putea doar *alege* dintr-un folder făcut acolo,
 * deci o tabără nouă cerea tot un mesaj către mine. Acum folderul se face
 * singur, la prima poză urcată în el.
 *
 * **O poză pe cerere**, nu toate deodată: o sută de poze, chiar micșorate în
 * browser, trec de limita de 30 MB a corpului, iar o cerere de câteva minute
 * e tăiată de proxy-ul Railway. Browserul le trimite pe rând și numără.
 *
 * Răspunsul e JSON: îl citește componenta `UrcaPozeTabara`, nu un om.
 */
const MAXIM_POZA = 25 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-poze-tabara",
    maxim: 600,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/scrie"))) return sesiuneExpirata();
  if (!areCloudinary()) {
    return raspuns("Lipsesc cheile Cloudinary din Railway; pozele nu se pot urca.", 503);
  }

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const f = citit.formular;

  const cale = calePozeTabara(
    RADACINA,
    String(f.get("cale") ?? ""),
    String(f.get("an") ?? ""),
    String(f.get("nume") ?? ""),
  );
  if (!cale) return raspuns("Scrie numele folderului (de ex. numele taberei cu data).", 400);

  const fisier = f.get("poza");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return raspuns("N-a venit nicio poză.", 400);
  }
  if (fisier.size > MAXIM_POZA) {
    return raspuns(`„${fisier.name}” are peste 25 MB.`, 413);
  }
  const octeti = new Uint8Array(await fisier.arrayBuffer());
  const tip = tipDinOcteti(octeti);
  if (!tip) {
    return raspuns(
      `„${fisier.name}” nu e JPEG, PNG sau WebP (pozele HEIC de pe iPhone trebuie salvate întâi ca JPEG).`,
      415,
    );
  }

  const urcata = await urcaPoza(octeti, tip, cale.slice(RADACINA.length + 1));
  if (!urcata) return raspuns(`„${fisier.name}” n-a putut fi urcată în Cloudinary. Încearcă din nou.`, 502);

  // Legătura cu tabăra se scrie de la prima poză: dacă omul închide fila la
  // jumătate, ce s-a urcat apare totuși pe pagina taberei.
  const id = String(f.get("id") ?? "");
  if (UUID.test(id)) {
    await puneDosarCloud(id, cale).catch((e) => {
      console.error(`[poze-tabara] n-am putut lega folderul de ${id}: ${(e as Error).message}`);
    });
  }
  revalidateTag(ETICHETA_POZE_CLOUD, "max");
  revalidateTag(ETICHETA_PROIECTE_PANOU, "max");

  return Response.json(
    { cale, id: urcata.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
