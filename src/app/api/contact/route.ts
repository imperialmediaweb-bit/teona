import {
  citesteJson,
  email,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
  textOptional,
} from "@/lib/api";

/**
 * Formularul de contact (10.4) și cel de voluntariat (11.4).
 *
 * Caietul cere ca toate cererile să ajungă la contact@teona-ariana.ro, cu
 * eticheta potrivită, și ca expeditorul să primească un email automat de
 * primire. Pentru asta e nevoie de un serviciu de trimitere a emailului,
 * configurat pe gazdă — nu există încă unul ales.
 *
 * Până atunci ruta validează cererea și răspunde cinstit că trimiterea nu e
 * conectată, trimițând omul spre email și telefon. Nu afișăm „Am primit
 * formularul tău” pentru un mesaj care n-a plecat nicăieri și nu stocăm date
 * personale într-un loc din care n-am ști să le scoatem.
 *
 * Limitele (corp, rată, lungimi) sunt puse de pe acum, nu când se conectează
 * emailul: atunci fiecare cerere va costa un email, și e mai ușor să ai
 * apărarea gata decât să o adaugi după primul val de spam.
 *
 * Când se alege serviciul, se schimbă doar fișierul ăsta.
 */

/** Cele două formulare care trimit aici; orice altceva e o cerere construită de mână. */
const FELURI = new Set(["contact", "voluntariat"]);

/**
 * Lungimile maxime ale câmpurilor. Sunt generoase pentru un om și strâmte
 * pentru cineva care încearcă să bage un roman într-un câmp de nume.
 */
const MAXIM = {
  nume: 120,
  telefon: 40,
  scurt: 120,
  mesaj: 5_000,
} as const;

/**
 * Vârsta împlinită, calculată pe lună și zi, nu pe milisecunde: diferența
 * împărțită la un an greșește cu o zi exact în jurul zilei de naștere.
 */
function varsta(nastere: Date, azi: Date): number {
  let ani = azi.getFullYear() - nastere.getFullYear();
  const inainteDeZi =
    azi.getMonth() < nastere.getMonth() ||
    (azi.getMonth() === nastere.getMonth() && azi.getDate() < nastere.getDate());
  if (inainteDeZi) ani -= 1;
  return ani;
}

export async function POST(cerere: Request) {
  // Întâi ce e ieftin: contorul, apoi corpul.
  const prea = limitaDeRata(cerere, {
    cheie: "contact",
    maxim: 6,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const citire = await citesteJson(cerere);
  if (!citire.ok) return citire.raspuns;
  const corp = citire.corp;

  if (esteRobot(corp)) {
    // Răspuns „ca și cum a mers”, ca robotul să nu insiste. Nu se trimite nimic.
    return raspuns("Mulțumim! Am primit mesajul tău.", 200);
  }

  if (typeof corp.fel !== "string" || !FELURI.has(corp.fel)) {
    return raspuns("Cerere invalidă.", 400);
  }

  const nume = text(corp.nume, MAXIM.nume);
  if (!nume || nume.length < 2) {
    return raspuns("Scrie-ți numele, ca să știm cui să răspundem.", 400);
  }

  if (!email(corp.email)) {
    return raspuns("Introdu o adresă de e-mail validă.", 400);
  }

  if (corp.acord !== true) {
    return raspuns("Bifează acordul pentru a continua.", 400);
  }

  // Câmpurile opționale pot lipsi, dar nu pot fi oricât de lungi.
  const scurte: Array<[unknown, number]> = [
    [corp.telefon, MAXIM.telefon],
    [corp.interes, MAXIM.scurt],
    [corp.localitate, MAXIM.scurt],
    [corp.experienta, MAXIM.scurt],
    [corp.disponibilitate, MAXIM.scurt],
    [corp.experientaCopii, MAXIM.scurt],
    [corp.limbi, MAXIM.scurt],
    [corp.permis, MAXIM.scurt],
    [corp.aflat, MAXIM.scurt],
    [corp.nastere, MAXIM.scurt],
    [corp.mesaj, MAXIM.mesaj],
    [corp.motiv, MAXIM.mesaj],
  ];
  if (!scurte.every(([valoare, maxim]) => textOptional(valoare, maxim))) {
    return raspuns("Mesajul e prea lung.", 400);
  }

  if (corp.fel === "voluntariat") {
    // Formularul verifică vârsta în browser, dar browserul poate fi ocolit.
    // Caietul (11.4) e categoric: sub 18 ani formularul nu se trimite. Datele
    // unui minor nu trebuie să ajungă nici măcar într-un email.
    const nastere = typeof corp.nastere === "string" ? corp.nastere : "";
    const data = new Date(`${nastere}T00:00:00`);
    if (!nastere || Number.isNaN(data.getTime())) {
      return raspuns("Completează data nașterii.", 400);
    }
    if (varsta(data, new Date()) < 18) {
      return raspuns(
        "Ne bucurăm că vrei să te implici! Deocamdată putem primi voluntari doar de la 18 ani.",
        400,
      );
    }
  }

  return raspuns(
    "Trimiterea formularului nu este încă activă pe site-ul nou — se conectează înainte de lansare. Până atunci scrie-ne direct:",
    503,
  );
}
