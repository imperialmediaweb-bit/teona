import { NextResponse } from "next/server";
import { citesteJson, limitaDeRata, raspuns } from "@/lib/api";
import { cineEsteConectat } from "@/lib/admin";
import {
  abonamentValid,
  areNotificari,
  notificaPanoul,
  salveazaAbonament,
  stergeAbonament,
} from "@/lib/notificari";

/**
 * Abonarea unui telefon la notificările panoului.
 *
 * `fac`: „aboneaza” (cu abonamentul dat de browser), „dezaboneaza” sau
 * „proba” (trimite o notificare de probă, ca omul să vadă pe loc că merge).
 * Deschisă oricui e înăuntru: o donație nouă e o veste pentru toți cei care
 * lucrează la asociație.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-push",
    maxim: 30,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;
  const cine = await cineEsteConectat();
  if (!cine) return raspuns("Nu ești în panou.", 403);
  if (!areNotificari()) return raspuns("Notificările nu sunt pornite pe server.", 503);

  const citire = await citesteJson(cerere, 4096);
  if (!citire.ok) return citire.raspuns;
  const { fac, abonament } = citire.corp;

  if (fac === "aboneaza") {
    if (!abonamentValid(abonament)) return raspuns("Abonament invalid.", 400);
    await salveazaAbonament(abonament, cine.fel === "cont" ? cine.utilizator.id : null);
    return NextResponse.json({ ok: true });
  }
  if (fac === "dezaboneaza") {
    if (!abonamentValid(abonament)) return raspuns("Abonament invalid.", 400);
    await stergeAbonament(abonament.endpoint);
    return NextResponse.json({ ok: true });
  }
  if (fac === "proba") {
    const trimise = await notificaPanoul({
      titlu: "Notificările merg",
      text: "Așa vei afla de fiecare donație nouă.",
      adresa: "/admin/donatii",
    });
    return NextResponse.json({ ok: true, trimise });
  }
  return raspuns("Cerere necunoscută.", 400);
}
