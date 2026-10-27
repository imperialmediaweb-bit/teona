import { after } from "next/server";
import { limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { hotaraste, scaneaza } from "@/lib/radar";

/**
 * Ce face omul cu pistele găsite de radar: le urmărește, le respinge, sau
 * cere o scanare pe loc.
 *
 * Scanarea de aici e pentru când cineva vrea să vadă acum ce e nou, fără să
 * aștepte ziua de luni. Costă bani, deci are limita ei, separată de cea a
 * capătului de cron.
 */
const INAPOI = "/admin/radar";

function gata(cerere: Request, cod: string) {
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
}

export async function POST(cerere: Request) {
  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const fel = String(formular.get("fel") ?? "");

  if (fel === "scanează") {
    /*
      Trei scanări la oră, de la aceeași adresă. O scanare ia zeci de secunde
      și costă căutări plătite; cine apasă de zece ori crede că s-a blocat, nu
      că pornește de zece ori — iar factura n-ar spune diferența.
    */
    const prea = limitaDeRata(cerere, {
      cheie: "radar-panou",
      maxim: 3,
      fereastraMs: 60 * 60 * 1000,
    });
    if (prea) return prea;

    /*
      Scanarea rulează după ce răspunsul a plecat, nu în timpul lui.

      Ia câteva minute — zeci de căutări, cu reluări la `pause_turn`. Ținută
      în cerere, conexiunea se închidea înainte (proxy-ul Railway răspundea
      502), iar scanarea murea odată cu ea, fără să lase vreun rând în
      `radar_scanari`: omul apăsa, aștepta, primea o pagină de eroare și nu
      rămânea nicio urmă. Acum butonul răspunde pe loc, iar rezultatul — sau
      eroarea — se scrie în tabel când e gata și se vede la „Ultimele scanări".
    */
    after(async () => {
      await scaneaza().catch(() => undefined);
    });
    return gata(cerere, "pornit");
  }

  const id = String(formular.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return gata(cerere, "necunoscut");

  if (fel === "urmarit" || fel === "respins") {
    const schimbat = await hotaraste(id, fel).catch(() => false);
    return gata(cerere, schimbat ? fel : "necunoscut");
  }

  return gata(cerere, "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
