import { NextResponse } from "next/server";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import {
  MINIM_PAROLA,
  esteRol,
  faceUtilizator,
  normalizeazaEmail,
  schimbaParola,
  schimbaRolul,
  schimbaStarea,
} from "@/lib/utilizatori";

/**
 * Conturile oamenilor din asociație: făcute, oprite, cu rolul schimbat.
 *
 * **Mesajele se întorc prin adresă, parolele niciodată.** Ce scrie în bara
 * browserului ajunge în istoric, în jurnalele serverului și în ce se vede
 * peste umăr. De aceea aici pleacă înapoi doar un cod scurt — `facut`,
 * `scurta`, `exista` — pe care pagina îl traduce în română. Parola pusă de
 * administrator o știe el, fiindcă el a scris-o; n-o mai spune nimeni
 * altcineva, și nici noi.
 */

/** Unde se întoarce omul. O singură pagină, deci nu e nimic de validat. */
const INAPOI = "/admin/utilizatori";

function gata(cerere: Request, cod: string) {
  return NextResponse.redirect(
    new URL(`${INAPOI}?stare=${encodeURIComponent(cod)}`, cerere.url),
    { status: 303 },
  );
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-utilizatori",
    maxim: 40,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const fel = String(formular.get("fel") ?? "");
  const id = String(formular.get("id") ?? "").trim();
  const cine = await cineEsteConectat();

  /*
    Nimeni nu se poate opri singur și nu-și poate scădea singur rolul.

    Nu e o chestiune de siguranță — `PAROLA_ADMIN` scoate oricum pe oricine
    din orice încurcătură. E că greșeala costă un telefon și o explicație, iar
    butonul „oprește" stă pe același rând pentru toți: al tău e primul pe care
    îl nimerești.
  */
  const peMine = cine?.fel === "cont" && cine.utilizator.id === id;

  if (fel === "adauga") {
    const email = normalizeazaEmail(String(formular.get("email") ?? ""));
    const nume = text(formular.get("nume"), 120);
    const rol = formular.get("rol");
    const parola = String(formular.get("parola") ?? "");

    if (!email.includes("@") || email.length > 200) return gata(cerere, "email");
    if (!nume) return gata(cerere, "nume");
    if (!esteRol(rol)) return gata(cerere, "rol");
    if (parola.length < MINIM_PAROLA) return gata(cerere, "scurta");

    const facut = await faceUtilizator({ email, nume, rol, parola }).catch(
      () => null,
    );
    // `null` înseamnă că adresa era deja luată: `ON CONFLICT DO NOTHING`.
    return gata(cerere, facut ? "facut" : "exista");
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) return gata(cerere, "necunoscut");

  if (fel === "parola") {
    const parola = String(formular.get("parola") ?? "");
    if (parola.length < MINIM_PAROLA) return gata(cerere, "scurta");
    const schimbat = await schimbaParola(id, parola).catch(() => false);
    return gata(cerere, schimbat ? "parola" : "necunoscut");
  }

  if (fel === "rol") {
    const rol = formular.get("rol");
    if (!esteRol(rol)) return gata(cerere, "rol");
    if (peMine) return gata(cerere, "nu-pe-mine");
    const schimbat = await schimbaRolul(id, rol).catch(() => false);
    return gata(cerere, schimbat ? "rol-schimbat" : "necunoscut");
  }

  if (fel === "opreste" || fel === "porneste") {
    if (peMine) return gata(cerere, "nu-pe-mine");
    const activ = fel === "porneste";
    const schimbat = await schimbaStarea(id, activ).catch(() => false);
    if (!schimbat) return gata(cerere, "necunoscut");
    return gata(cerere, activ ? "pornit" : "oprit");
  }

  return gata(cerere, "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
