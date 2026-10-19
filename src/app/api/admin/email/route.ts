import { raspuns } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { exemplu } from "@/lib/email/exemple";

/**
 * Un mesaj, arătat așa cum ajunge în inbox.
 *
 * Datele sunt de probă, dar cere oricum sesiune: cine nu e în asociație n-are
 * de ce să vadă cum arată mesajele ei pe dinăuntru, iar o pagină publică din
 * care se poate copia plicul asociației e un dar pentru cine vrea să trimită
 * ceva care seamănă cu ele.
 */
export async function GET(cerere: Request) {
  if (!(await arePermisiune("/admin/emailuri"))) return raspuns("Nu ai acces.", 403);

  const cauta = new URL(cerere.url).searchParams;
  const gasit = exemplu(cauta.get("ce") ?? "");
  if (!gasit) return raspuns("Mesaj necunoscut.", 404);

  const text = cauta.get("fel") === "text";
  return new Response(text ? gasit.compus.text : gasit.compus.html, {
    headers: {
      "content-type": text
        ? "text/plain; charset=utf-8"
        : "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
