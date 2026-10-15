import { citesteJson, limitaDeRata, raspuns } from "@/lib/api";
import { areAsistent, indreaptaTextul } from "@/lib/asistent";
import { LIMITE } from "@/date/aniversari";

/**
 * Îndreaptă textul scris de cineva pe pagina lui de campanie.
 *
 * **Nu-l rescrie.** Corectează diacriticele, greșelile de scris și
 * punctuația; nu schimbă ce a vrut omul să spună, nu adaugă cifre, nu adaugă
 * îndemnuri. Textul de pe pagina lui trebuie să rămână al lui — altfel
 * prietenii care îl citesc recunosc imediat vocea unui robot, și nu mai dă
 * nimeni nimic.
 *
 * **De ce e limitată tare.** E singurul capăt public care costă bani la
 * fiecare apăsare: 4 cereri la 30 de minute de la aceeași adresă, cel mult
 * atâtea semne câte încap în câmp. Fără limită, oricine ar putea să ne
 * golească punga cu un script.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "asistent-aniversare",
    maxim: 4,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  if (!areAsistent()) {
    return raspuns("Asistentul nu e pornit acum. Scrie textul cum îți vine.", 503);
  }

  const citit = await citesteJson(cerere);
  if (!citit.ok) return citit.raspuns;

  const text = String(citit.corp.text ?? "").trim();
  if (text.length < 20) {
    return raspuns("Scrie întâi câteva rânduri, apoi ți le îndrept.", 400);
  }
  if (text.length > LIMITE.mesaj) {
    return raspuns("Textul e mai lung decât încape în câmp.", 400);
  }

  const indreptat = await indreaptaTextul(text);
  if (!indreptat) {
    return raspuns("N-am putut îndrepta textul acum. Încearcă din nou.", 502);
  }

  return Response.json({ text: indreptat });
}
