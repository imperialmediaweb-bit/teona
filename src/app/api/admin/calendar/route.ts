import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { planificaText } from "@/lib/texte";

/** Pune sau scoate ziua în care se vrea publicat un text. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-calendar",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/calendar"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Text necunoscut.", 400);

  const zi = String(formular.get("zi") ?? "").trim();
  // Ziua goală scoate planificarea. Orice altceva trebuie să fie o zi scrisă
  // cum o scrie browserul: `2026-11-03`.
  if (zi && !/^\d{4}-\d{2}-\d{2}$/.test(zi)) {
    return raspuns("Ziua nu e scrisă corect.", 400);
  }

  await planificaText(id, zi || null);

  const luna = String(formular.get("luna") ?? "");
  const unde = new URL("/admin/calendar", cerere.url);
  if (/^\d{4}-\d{2}$/.test(luna)) unde.searchParams.set("luna", luna);
  return NextResponse.redirect(unde, 303);
}
