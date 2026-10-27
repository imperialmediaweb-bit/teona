import { limitaDeRata, nuTrece, raspuns, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areR2, urcaInR2 } from "@/lib/r2";
import { CHEIE_FORMULAR } from "@/lib/documente";

/**
 * Urcarea fișierului 230 gol, cel pe care îl descarcă oamenii.
 *
 * Atât face ruta asta. Anunțurile „am completat formularul" sunt cereri
 * obișnuite în CRM și se mută de acolo, cu `/api/admin/cereri` — site-ul nu
 * primește poza formularului și nu ține niciun CNP.
 *
 * Fișierul gol n-are nicio dată personală în el: e formularul tipizat, cu
 * datele asociației completate.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-formulare",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/formulare"))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();
  const actiune = camp("actiune");

  if (actiune === "urca-gol") {
    const fisier = formular.get("fisier");
    if (!(fisier instanceof File) || fisier.size === 0) {
      return nuTrece("Alege fișierul PDF al formularului.");
    }
    if (fisier.size > 10 * 1024 * 1024) {
      return nuTrece("Fișierul e prea mare.");
    }
    const octeti = new Uint8Array(await fisier.arrayBuffer());
    const estePdf =
      octeti[0] === 0x25 &&
      octeti[1] === 0x50 &&
      octeti[2] === 0x44 &&
      octeti[3] === 0x46;
    if (!estePdf) return nuTrece("Fișierul nu e un PDF.");
    if (!areR2()) return nuTrece("Depozitul de fișiere nu e configurat.", 503);

    const urcat = await urcaInR2(CHEIE_FORMULAR, octeti, "application/pdf");
    if (!urcat) return nuTrece("N-am putut urca fișierul.", 502);
    return inapoi(cerere, "urcat");
  }

  return nuTrece("Acțiune necunoscută.");
}

function inapoi(cerere: Request, ce: string) {
  return trimiteLa(`/admin/formulare?gata=${ce}`);
}
