import { intreaba } from "@/lib/baza";
import { blocheaza, deblocheaza, valoareDeBlocat } from "@/lib/spam";
import { probaAreVoie } from "@/lib/proba";
import { cuBaza, formularAdmin, limitaDeRata, nuTrece, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { arePermisiune, numeleConectat } from "@/lib/admin";
import {
  esteFelCerere,
  esteStadiuCerere,
  salveazaCerere,
  schimbaStadiulCererii,
} from "@/lib/crm";

/**
 * Cererile din panou: se mută între stadii, sau se adaugă de mână.
 *
 * Adăugarea de mână e pentru ce vine pe WhatsApp, pe telefon sau pe hârtie —
 * adică pentru tot ce nu trece prin formularele site-ului. Până acum, cineva
 * care trimitea poza pe WhatsApp rămânea doar în conversația aia.
 */
export const POST = cuBaza(posteaza);

async function posteaza(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-cereri",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/cereri"))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const { formular } = citit;

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  /*
    Adăugarea de mână, pentru ce vine pe WhatsApp sau pe telefon.

    Nu toată lumea trece prin formularul de pe site. Cineva trimite poza pe
    WhatsApp și atât; până acum, singurul loc în care rămânea era conversația
    aia. Acum se trece în aceeași listă ca restul, cu aceleași stadii și
    același export.

    E-mailul nu e obligatoriu aici: de pe WhatsApp ai un număr, nu o adresă.
    Cerut cu forța, cineva ar fi inventat una.
  */
  if (camp("actiune") === "adauga") {
    const nume = camp("nume");
    if (nume.length < 2) return nuTrece("Scrie numele.");
    if (!camp("email") && !camp("telefon")) {
      return nuTrece("Scrie măcar un telefon sau un e-mail.");
    }

    const felNou = camp("fel");
    if (!esteFelCerere(felNou)) return nuTrece("Fel necunoscut.");

    const ani = camp("ani");
    const deUnde = camp("deUnde");
    await salveazaCerere({
      fel: felNou,
      nume,
      email: camp("email") || undefined,
      telefon: camp("telefon") || undefined,
      detalii: {
        "Adăugat de mână": "da",
        ...(deUnde ? { "A venit prin": deUnde } : {}),
        ...(ani === "1" || ani === "2"
          ? { "Pe câți ani": ani === "2" ? "2 ani" : "1 an" }
          : {}),
        ...(camp("observatii") ? { Observații: camp("observatii") } : {}),
      },
    });

    return trimiteLa(camp("inapoi") || "/admin/cereri");
  }

  // Deblocarea, de la Setări → „Adrese blocate”.
  if (camp("actiune") === "deblocheaza") {
    const v = camp("valoare").toLowerCase();
    if (!(await probaAreVoie("email", v))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
    if (v) await deblocheaza(v);
    return trimiteLa("/admin/setari#spam");
  }

  const id = String(formular.get("id") ?? "");
  if (!(await probaAreVoie("cereri", id))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return nuTrece("Cerere necunoscută.");

  /*
    „Spam: șterge și blochează”: cererea pleacă de tot, iar adresa (sau tot
    domeniul, dacă e bifat și nu e Gmail & co.) intră pe lista blocaților —
    mesajele noi de acolo se opresc în tăcere (lib/spam.ts).
  */
  if (camp("actiune") === "spam") {
    const r = await intreaba<{ email: string | null }>(`SELECT email FROM cereri WHERE id = $1`, [id]);
    if (!r[0]) return nuTrece("Cerere necunoscută.");
    const valoare = r[0].email ? valoareDeBlocat(r[0].email, camp("domeniu") === "1") : null;
    if (valoare) await blocheaza(valoare, "spam, din Cereri", await numeleConectat());
    await intreaba(`DELETE FROM raspunsuri_voluntari WHERE cerere_id = $1`, [id]).catch(() => {});
    await intreaba(`DELETE FROM cereri WHERE id = $1`, [id]);
    return trimiteLa(`/admin/cereri?stare=${valoare ? "blocat" : "sters"}`);
  }

  const stadiu = formular.get("stadiu");
  if (!esteStadiuCerere(stadiu)) return nuTrece("Stadiu necunoscut.");

  await schimbaStadiulCererii(id, stadiu);

  const fel = String(formular.get("fel") ?? "");
  return trimiteLa(`/admin/cereri${/^\w+$/.test(fel) ? `?fel=${fel}` : ""}`);
}
