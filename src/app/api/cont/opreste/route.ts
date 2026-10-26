import { limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import { abonamentulDinLink } from "@/lib/oprire-lunara";
import { areStripe, opresteAbonamentulDupaId } from "@/lib/plati/stripe";

/**
 * Oprirea donației lunare din linkul trimis pe e-mail.
 *
 * **Numai POST.** Un GET ar fi oprit donația la simpla deschidere a adresei,
 * iar scanerele de e-mail ale firmelor deschid din reflex toate adresele
 * dintr-un mesaj — asociația ar fi pierdut donatori fără ca nimeni să apese
 * nimic.
 *
 * **Autorizarea e semnătura, nu sesiunea.** Linkul a plecat pe adresa
 * donatorului și e semnat cu cheia serverului peste identificatorul
 * abonamentului și ziua expirării. Nu se poate schimba abonamentul din el și
 * nu se poate folosi după expirare. A cere și o intrare în cont ar însemna
 * încă două e-mailuri pentru un gest pe care asociația îl face la un telefon.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "oprire-lunara",
    maxim: 20,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const dovada = {
    a: String(formular.get("a") ?? ""),
    p: String(formular.get("p") ?? ""),
    s: String(formular.get("s") ?? ""),
  };
  const abonament = abonamentulDinLink(dovada);

  const inapoi = (coada: string) =>
    trimiteLa(`/opreste-donatia${coada}`);

  if (!abonament) return inapoi("");
  if (!areStripe()) {
    return inapoi(`?a=${dovada.a}&p=${dovada.p}&s=${dovada.s}&eroare=1`);
  }

  const oprit = await opresteAbonamentulDupaId(abonament).catch(() => false);
  if (!oprit) {
    return inapoi(`?a=${dovada.a}&p=${dovada.p}&s=${dovada.s}&eroare=1`);
  }
  return trimiteLa("/oprit");
}
