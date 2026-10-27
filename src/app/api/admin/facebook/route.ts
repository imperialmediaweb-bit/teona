import { limitaDeRata, nuTrece, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { marcheazaFacebook, textDupaId, felul } from "@/lib/texte";
import { arePagina, publicaPePagina } from "@/lib/reclame/pagina-fb";

/**
 * Trimite o noutate sau o campanie pe pagina de Facebook.
 *
 * **Se apasă, nu se întâmplă singur.** Textul bun pentru site poate fi
 * nepotrivit pentru pagină în ziua aceea, iar un program nu știe asta.
 *
 * **Pleacă o singură dată.** Rândul se marchează cu identificatorul postării
 * înainte de a se întoarce răspunsul; a doua apăsare nu mai trimite nimic.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-facebook",
    maxim: 20,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/facebook"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  if (!arePagina()) return inapoi(cerere, "fara-pagina");

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const id = String(formular.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return nuTrece("Text necunoscut.");

  const scris = await textDupaId(id);
  if (!scris) return nuTrece("Text necunoscut.", 404);
  if (!scris.publicat) return inapoi(cerere, "nepublicat");
  if (scris.facebookId) return inapoi(cerere, "deja");

  /*
    Mesajul: ce a scris omul în panou, dacă a scris ceva, altfel titlul și
    rezumatul textului. Nu se compune nimic „frumos" din bucăți — un text
    scris de un program se vede de la o poștă pe o pagină de asociație.
  */
  const brut = String(formular.get("mesaj") ?? "").trim();
  if (brut.length > 2_000) {
    return inapoi(cerere, "prea-lung");
  }
  const scrisDeMana = text(brut, 2_000);
  const mesaj =
    scrisDeMana ||
    [scris.titlu, scris.rezumat].filter(Boolean).join("\n\n").slice(0, 2_000);

  const cale = `${felul(scris.fel).cale}/${scris.slug}`;
  const iesit = await publicaPePagina({ mesaj, cale });

  if (!iesit.ok) {
    return inapoi(cerere, "n-a-mers", iesit.motiv);
  }

  await marcheazaFacebook(id, iesit.id).catch(() => undefined);
  return inapoi(cerere, null);
}

function inapoi(cerere: Request, gresit: string | null, motiv?: string) {
  const unde = new URL("/admin/facebook", cerere.url);
  if (gresit) unde.searchParams.set("ratat", gresit);
  if (motiv) unde.searchParams.set("motiv", motiv.slice(0, 200));
  return trimiteLa(unde);
}
