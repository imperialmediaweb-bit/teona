import {
  citesteJson,
  email,
  esteRobot,
  limitaDeRata,
  raspuns,
  textOptional,
} from "@/lib/api";

/**
 * Abonarea la newsletter.
 *
 * Decizia e încă deschisă: caietul de sarcini (12.4) spune că asociația nu are
 * încă o platformă de newsletter și că se alege împreună înainte de lansare, cu
 * servere în Uniunea Europeană, dezabonare dintr-un click și export de date.
 *
 * Până atunci ruta răspunde cinstit că abonarea nu e activă. Nu stocăm adrese
 * într-un loc din care n-am ști să le scoatem, și nu arătăm „Mulțumim!” pentru
 * o abonare care nu s-a întâmplat.
 *
 * Limita de rată e aici de pe acum: când platforma va fi conectată, fiecare
 * cerere va fi un email de confirmare trimis la adresa din formular — adică
 * oricine ar putea folosi site-ul ca să bombardeze cu emailuri o adresă
 * străină.
 *
 * Când platforma e aleasă, se schimbă doar fișierul ăsta.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "newsletter",
    maxim: 6,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const citire = await citesteJson(cerere);
  if (!citire.ok) return citire.raspuns;
  const corp = citire.corp;

  if (esteRobot(corp)) {
    return raspuns(
      "Mulțumim! Verifică-ți emailul pentru a confirma abonarea.",
      200,
    );
  }

  if (!email(corp.email)) {
    return raspuns("Introdu o adresă de e-mail validă.", 400);
  }

  if (!textOptional(corp.nume, 120)) {
    return raspuns("Numele e prea lung.", 400);
  }

  if (corp.acord !== true) {
    return raspuns("Bifează acordul pentru a continua.", 400);
  }

  return raspuns(
    "Abonarea la buletinul informativ nu este încă activă — alegem platforma înainte de lansare. Până atunci ne poți scrie direct:",
    503,
  );
}
