import { cookies } from "next/headers";
import { COOKIE_ADMIN, sesiuneaResemnata } from "@/lib/admin";
import { utilizatorDupaId } from "@/lib/utilizatori";
import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
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
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
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

  if (!(await arePermisiune(INAPOI))) return sesiuneExpirata();

  const cine = await cineEsteConectat();
  /*
    Cheia asociației n-are parolă de schimbat de aici: ea stă în Railway, în
    `PAROLA_ADMIN`, și se schimbă acolo. Un formular care ar pretinde altceva
    ar lăsa omul convins că a schimbat-o.
  */
  if (cine?.fel !== "cont") return gata(cerere, "fara-cont");

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const { formular } = citit;

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
  /*
    Parola nouă a închis toate sesiunile contului, și pe asta. Dispozitivul
    de pe care s-a schimbat rămâne înăuntru: i se semnează din nou aceeași
    sesiune, cu versiunea nouă. Celelalte ies la următoarea cerere.
  */
  const raspunsul = gata(cerere, "schimbata");
  const cont = await utilizatorDupaId(cine.utilizator.id).catch(() => null);
  const borcan = await cookies();
  const noua_sesiune = cont
    ? sesiuneaResemnata(borcan.get(COOKIE_ADMIN)?.value, cont.versiuneSesiune)
    : null;
  if (noua_sesiune) {
    const expira = Number(noua_sesiune.split(":")[2]);
    raspunsul.cookies.set(COOKIE_ADMIN, noua_sesiune, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.max(60, expira - Math.floor(Date.now() / 1000)),
    });
  }
  return raspunsul;
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
