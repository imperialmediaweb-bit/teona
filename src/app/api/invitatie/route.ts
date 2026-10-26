import { limitaDeRata, raspuns, text, trimiteLa } from "@/lib/api";
import { dinLinkulDeInvitatie } from "@/lib/invitatie";
import { MINIM_PAROLA, puneParolaDinInvitatie } from "@/lib/utilizatori";

/**
 * Parola pusă din invitație.
 *
 * **Capăt public, deci limitat.** Cine are linkul poate scrie parola unui cont
 * de panou; fără limită, cineva ar putea încerca semnături la nesfârșit. Zece
 * pe oră pe adresă: un om își pune parola o dată, poate de două ori dacă
 * greșește la repetare.
 *
 * **Parola nu se întoarce niciodată în adresă.** La greșeală pleacă un cod
 * scurt, iar dovada se pune la loc în adresă ca omul să poată încerca din nou
 * fără să caute e-mailul.
 */

function inapoi(cerere: Request, d: Record<string, string>, gresit?: string) {
  const cauta = new URLSearchParams(d);
  if (gresit) cauta.set("gresit", gresit);
  return trimiteLa(`/invitatie?${cauta}`);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "invitatie",
    maxim: 10,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const dovada = {
    u: text(formular.get("u"), 40) ?? "",
    i: text(formular.get("i"), 20) ?? "",
    p: text(formular.get("p"), 20) ?? "",
    s: text(formular.get("s"), 80) ?? "",
  };

  const invitatie = dinLinkulDeInvitatie(dovada);
  /*
    Linkul stricat nu primește un mesaj de eroare, ci pagina care spune
    „linkul nu mai e bun" — aceeași pe care o vede oricine deschide o adresă
    veche. Fără dovadă n-are rost nici să citim parola.
  */
  if (!invitatie) return inapoi(cerere, dovada);

  const parola = String(formular.get("parola") ?? "");
  const iar = String(formular.get("iar") ?? "");

  if (parola.length < MINIM_PAROLA) return inapoi(cerere, dovada, "scurta");
  if (parola !== iar) return inapoi(cerere, dovada, "diferite");

  const pusa = await puneParolaDinInvitatie(
    invitatie.id,
    invitatie.invitatLaMs,
    parola,
  ).catch(() => false);

  /*
    `false` înseamnă că invitația nu mai e în aer: fie omul a pus deja parola
    (și linkul s-a stins), fie contul a fost oprit, fie a plecat între timp o
    invitație nouă. Toate trei se citesc la fel pentru cel din fața
    ecranului, și pagina i-o spune pe toate trei.
  */
  if (!pusa) return inapoi(cerere, dovada, "folosit");

  /* Gata. Intră cu parola lui, ca oricine altcineva. */
  return trimiteLa("/admin?parola=pusa");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
