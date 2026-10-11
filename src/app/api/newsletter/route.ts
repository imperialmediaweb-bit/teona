import {
  citesteJson,
  email,
  esteRobot,
  limitaDeRata,
  raspuns,
  textOptional,
} from "@/lib/api";
import { areBuletin, laBuletin } from "@/lib/buletin";

/**
 * Abonarea la newsletter.
 *
 * Platforma aleasă e MailerLite. Adresa pleacă acolo direct, iar confirmarea
 * și dezabonarea le gestionează ei — caietul (12.4) cere dezabonare dintr-un
 * click și export de date, pe care le are.
 *
 * Fără `MAILERLITE_API_KEY`, ruta răspunde cinstit că abonarea nu e activă.
 * Nu stocăm adrese într-un loc din care n-am ști să le scoatem, și nu arătăm
 * „Mulțumim!” pentru o abonare care nu s-a întâmplat.
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

  if (!areBuletin()) {
    return raspuns(
      "Abonarea la buletinul informativ nu este încă activă. Până atunci ne poți scrie direct:",
      503,
    );
  }

  const adresa = email(corp.email);
  if (!adresa) return raspuns("Introdu o adresă de e-mail validă.", 400);

  const dus = await laBuletin(adresa);
  if (!dus) {
    return raspuns(
      "Nu am putut finaliza abonarea acum. Încearcă din nou peste câteva minute sau scrie-ne direct:",
      502,
    );
  }

  return raspuns(
    "Mulțumim! Verifică-ți emailul pentru a confirma abonarea.",
    200,
  );
}
