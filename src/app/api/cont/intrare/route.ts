import {
  citesteJson,
  email as citesteEmail,
  esteRobot,
  limitaDeRata,
  raspuns,
} from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { areConturi, ceareJeton, curataJetoane } from "@/lib/cont";
import { areDonatii } from "@/lib/plati/donatori";
import { areEmail } from "@/lib/email/trimite";
import { trimiteIntrarea } from "@/lib/email/cont";

/**
 * Cere linkul de intrare în contul donatorului.
 *
 * **Răspunsul e același, orice s-ar întâmpla.** Fie că adresa a donat
 * vreodată, fie că nu, mesajul e identic. Altfel formularul ar deveni un
 * instrument prin care oricine poate afla dacă o anumită persoană a donat la
 * o asociație de copii cu dizabilități — o listă pe care nu trebuie s-o
 * poată face nimeni, cu atât mai puțin de pe site-ul asociației.
 *
 * Din același motiv, limita de rată e strânsă: fiecare cerere e un e-mail
 * trimis la o adresă pe care o alege cel care completează formularul, deci
 * fără limită site-ul ar fi o unealtă de bombardat pe cineva cu mesaje.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "cont-intrare",
    maxim: 5,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  const LINIȘTITOR =
    "Dacă adresa are donații la noi, ți-am trimis un link de intrare. Verifică-ți inboxul, și dosarul „Spam”.";

  const citire = await citesteJson(cerere);
  if (!citire.ok) return citire.raspuns;
  const corp = citire.corp;

  if (esteRobot(corp)) return raspuns(LINIȘTITOR, 200);

  const adresa = citesteEmail(corp.email);
  if (!adresa) return raspuns("Introdu o adresă de e-mail validă.", 400);

  if (!areBazaDeDate() || !areConturi() || !areEmail()) {
    return raspuns(
      "Contul donatorului nu e încă pornit pe site-ul nou. Scrie-ne și îți trimitem istoricul donațiilor:",
      503,
    );
  }

  // Din când în când, nu la fiecare cerere: tabelul e mic și curățarea n-are
  // de ce să stea în calea omului care așteaptă un e-mail.
  if (Math.random() < 0.05) await curataJetoane();

  if (await areDonatii(adresa)) {
    const jeton = await ceareJeton(adresa);
    // Dacă e-mailul nu pleacă, tot nu spunem nimic diferit: altfel timpul de
    // răspuns și mesajul ar trăda care adrese există.
    await trimiteIntrarea({ email: adresa, jeton }).catch(() => undefined);
  }

  return raspuns(LINIȘTITOR, 200);
}
