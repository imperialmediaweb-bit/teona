import { NextResponse } from "next/server";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import { ADRESA_SITE } from "@/app/seo";
import { linkInvitatie } from "@/lib/invitatie";
import { trimiteInvitatia } from "@/lib/email/invitatie";
import {
  MINIM_PAROLA,
  esteRol,
  faceUtilizator,
  normalizeazaEmail,
  schimbaParola,
  schimbaRolul,
  schimbaStarea,
  pregatesteInvitatia,
  utilizatorDupaId,
  type Utilizator,
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

/**
 * Pune o invitație în aer și o trimite pe e-mail.
 *
 * **Dacă e-mailul nu pleacă, se spune pe față.** Contul rămâne făcut, dar fără
 * parolă — deci omul nu poate intra, iar administratorul trebuie să știe că
 * trebuie să retrimită sau să-i scrie o parolă de mână. Un „gata!" după un
 * e-mail care n-a plecat e felul în care cineva așteaptă o săptămână un mesaj
 * care nu vine.
 */
async function trimite(
  cerere: Request,
  id: string,
  nume: string,
  email: string,
  cine: Awaited<ReturnType<typeof cineEsteConectat>>,
) {
  const clipa = await pregatesteInvitatia(id).catch(() => null);
  if (!clipa) return gata(cerere, "necunoscut");

  const link = linkInvitatie(ADRESA_SITE, id, clipa);
  /*
    Fără cheie de semnat (nici `SECRET_SESIUNE`, nici o `PAROLA_ADMIN` de cel
    puțin 16 semne) nu se poate face un link. Se spune, nu se tace.
  */
  if (!link) return gata(cerere, "fara-cheie");

  /* „De la cine" e un nume de om, nu o adresă: mesajul e citit de un om. */
  const deLa =
    cine?.fel === "cont" ? (cine.utilizator as Utilizator).nume : null;

  const plecat = await trimiteInvitatia({ email, nume, link, deLa }).catch(
    () => false,
  );
  return gata(cerere, plecat ? "invitat" : "fara-email");
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

  if (fel === "adauga" || fel === "invita") {
    const email = normalizeazaEmail(String(formular.get("email") ?? ""));
    const nume = text(formular.get("nume"), 120);
    const rol = formular.get("rol");
    const parola = String(formular.get("parola") ?? "");
    const prinInvitatie = fel === "invita";

    if (!email.includes("@") || email.length > 200)
      return gata(cerere, "email");
    if (!nume) return gata(cerere, "nume");
    if (!esteRol(rol)) return gata(cerere, "rol");
    if (!prinInvitatie && parola.length < MINIM_PAROLA) {
      return gata(cerere, "scurta");
    }

    /*
      Căderea se deosebește de adresa luată, și nu e un amănunt.

      Varianta de dinainte prindea orice eroare și spunea „există deja un cont
      cu adresa asta". Când baza de date n-a răspuns — și asta se întâmplă —
      administratorul citea că adresa e luată, încerca alta, primea același
      mesaj, și rămânea fără nicio idee ce se petrece. Proba a prins-o exact
      așa: cu Postgres oprit, panoul dădea vina pe adresă.

      `null` fără excepție înseamnă într-adevăr `ON CONFLICT DO NOTHING`.
    */
    let facut;
    try {
      facut = await faceUtilizator({
        email,
        nume,
        rol,
        /*
          Pe calea cu invitație contul se naște **fără parolă**, iar omul și-o
          pune singur. Nu e o ușă deschisă: `intraCuParola` cere o amprentă ca
          s-o compare, iar un cont fără ea nu poate intra.
        */
        ...(prinInvitatie ? {} : { parola }),
      });
    } catch {
      return gata(cerere, "necunoscut");
    }

    if (!facut) return gata(cerere, "exista");
    if (!prinInvitatie) return gata(cerere, "facut");

    return trimite(cerere, facut.id, facut.nume, facut.email, cine);
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) return gata(cerere, "necunoscut");

  if (fel === "reinvita") {
    const om = await utilizatorDupaId(id).catch(() => null);
    if (!om) return gata(cerere, "necunoscut");
    return trimite(cerere, om.id, om.nume, om.email, cine);
  }

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
