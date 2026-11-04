import { limitaDeRata, trimiteLa } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { notificaPanoul } from "@/lib/notificari";
import { apelDupaId, linkRaspunsTine, scrieRaspuns } from "@/lib/voluntari";

/**
 * Răspunsul unui voluntar la un apel: „pot" sau „nu pot".
 *
 * Vine de pe pagina `/voluntari/raspuns`, de la un buton apăsat de om (POST),
 * nu la deschiderea linkului. Semnătura acoperă apelul și voluntarul, deci
 * linkul unui om nu poate răspunde pentru altul. Un răspuns se poate schimba:
 * cine a zis „nu pot" și s-a eliberat apasă iar.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "voluntari-raspuns",
    maxim: 30,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  const a = String(formular?.get("a") ?? "");
  const c = String(formular?.get("c") ?? "");
  const s = String(formular?.get("s") ?? "");
  const r = String(formular?.get("raspuns") ?? "");
  const inapoi = (stare: string) =>
    trimiteLa(`/voluntari/raspuns?${new URLSearchParams({ a, c, s, gata: stare })}`);

  if (!linkRaspunsTine(a, c, s) || (r !== "pot" && r !== "nu-pot")) {
    return inapoi("gresit");
  }
  if (!areBazaDeDate()) return inapoi("eroare");

  const scris = await scrieRaspuns(a, c, r).catch(() => null);
  if (!scris) return inapoi("eroare");

  // Asociația află pe loc de cine poate veni; un „nu pot" se vede în panou.
  if (r === "pot" && scris.schimbat) {
    const apel = await apelDupaId(a).catch(() => null);
    await notificaPanoul({
      titlu: "Voluntar disponibil",
      text: `${scris.nume.trim().split(/\s+/)[0]} poate veni${apel ? `: ${apel.titlu}, ${apel.cand}` : ""}.`,
      adresa: `/admin/voluntari#apel-${a}`,
    }).catch(() => 0);
  }
  return inapoi(r);
}
