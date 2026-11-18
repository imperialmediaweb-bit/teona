import { NextResponse } from "next/server";
import { arePermisiune, rolulConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { limitaDeRata, sesiuneExpirata } from "@/lib/api";
import { cautaPeste, type FelGasit } from "@/lib/cautare";
import { poateVedea } from "@/lib/utilizatori";

/**
 * Căutarea rapidă (Ctrl K): rezultatele cât scrii, cel mult cinci pe grup.
 * Fiecare grup apare numai dacă omul are voie pe pagina la care duce, ca
 * fereastra să nu arate ce n-ar putea deschide.
 */

const PAGINA: Record<FelGasit, string> = {
  firma: "/admin/firme",
  donator: "/admin/donatori",
  cerere: "/admin/cereri",
  voluntar: "/admin/voluntari",
  contract: "/admin/contracte",
  text: "/admin/scrie",
  presa: "/admin/presa",
};

export async function GET(cerere: Request) {
  // Cât scrie omul pleacă o cerere la fiecare pauză: limita e largă, ca să prindă doar un robot.
  const prea = limitaDeRata(cerere, { cheie: "admin-cauta-rapid", maxim: 600, fereastraMs: 10 * 60 * 1000 });
  if (prea) return prea;
  if (!(await arePermisiune("/admin/cauta"))) return sesiuneExpirata();
  const q = (new URL(cerere.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2 || !areBazaDeDate()) return NextResponse.json({ rezultate: [] }, { headers: { "Cache-Control": "no-store" } });
  const rol = await rolulConectat();
  const gasite = await cautaPeste(q, 5);
  const rezultate = rol ? gasite.filter((g) => poateVedea(rol, PAGINA[g.fel])) : gasite;
  return NextResponse.json({ rezultate }, { headers: { "Cache-Control": "no-store" } });
}
