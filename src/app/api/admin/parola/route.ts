import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import { MINIM_PAROLA, schimbaParolaProprie } from "@/lib/utilizatori";

/**
 * Omul își schimbă parola lui.
 *
 * Există ca să nu rămână pe veci parola scrisă de administrator la facerea
 * contului — știută de doi oameni și trimisă, de obicei, pe WhatsApp.
 *
 * Se cere parola de acum, deși omul e deja conectat. Un cookie furat sau un
 * laptop lăsat deschis ar fi altfel de ajuns ca să iei contul definitiv, nu
 * doar să te uiți prin el până expiră sesiunea.
 */
const INAPOI = "/admin/parola";

function gata(cerere: Request, cod: string) {
  return NextResponse.redirect(
    new URL(`${INAPOI}?stare=${encodeURIComponent(cod)}`, cerere.url),
    { status: 303 },
  );
}

export async function POST(cerere: Request) {
  // Strâns: formularul ăsta e un loc în care se ghicește parola cuiva care e
  // deja înăuntru, iar o greșeală omenească nu se repetă de patruzeci de ori.
  const prea = limitaDeRata(cerere, {
    cheie: "admin-parola",
    maxim: 10,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const cine = await cineEsteConectat();
  /*
    Cheia asociației n-are parolă de schimbat de aici: ea stă în Railway, în
    `PAROLA_ADMIN`, și se schimbă acolo. Un formular care ar pretinde altceva
    ar lăsa omul convins că a schimbat-o.
  */
  if (cine?.fel !== "cont") return gata(cerere, "fara-cont");

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const veche = String(formular.get("veche") ?? "");
  const noua = String(formular.get("noua") ?? "");
  const iar = String(formular.get("iar") ?? "");

  if (noua.length < MINIM_PAROLA) return gata(cerere, "scurta");
  if (noua !== iar) return gata(cerere, "diferite");
  if (noua === veche) return gata(cerere, "aceeasi");

  const cum = await schimbaParolaProprie(
    cine.utilizator.id,
    veche,
    noua,
  ).catch(() => "nu-există" as const);

  if (cum === "veche-greșită") return gata(cerere, "veche");
  if (cum !== "ok") return gata(cerere, "necunoscut");
  return gata(cerere, "schimbata");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
