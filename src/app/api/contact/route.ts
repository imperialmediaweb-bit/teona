import {
  citesteJson,
  email,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
  textOptional,
} from "@/lib/api";
import { areEmail } from "@/lib/email/trimite";
import {
  trimiteConfirmareaDeContact,
  trimiteMesajulDeContact,
} from "@/lib/email/contact";
import { areBazaDeDate } from "@/lib/baza";
import { salveazaCerere } from "@/lib/crm";

/**
 * Formularul de contact (10.4) și cel de voluntariat (11.4).
 *
 * Caietul cere ca toate cererile să ajungă la contact@teona-ariana.ro, cu
 * eticheta potrivită, și ca expeditorul să primească un email automat de
 * primire. Se trimit două mesaje: unul către asociație, cu tot ce a completat
 * omul și cu `reply_to` pe adresa lui — ca răspunsul să plece direct din
 * inbox — și unul scurt către om, ca să știe că a ajuns.
 *
 * Fără `RESEND_API_KEY`, ruta răspunde cinstit că trimiterea nu e conectată și
 * dă telefonul și adresa. Nu afișăm „Am primit formularul tău” pentru un mesaj
 * care n-a plecat nicăieri.
 *
 * Dacă mesajul către asociație nu pleacă, omul **nu** primește confirmare:
 * altfel ar crede că a scris cuiva, iar la asociație n-ar ști nimeni.
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
  /** Adresa unei firme, așa cum o scrie ANAF, e mai lungă decât un oraș. */
  adresa: 300,
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
    (azi.getMonth() === nastere.getMonth() &&
      azi.getDate() < nastere.getDate());
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

  // Mesajul e marcat obligatoriu pe pagina de contact: se cere și aici.
  if (
    corp.fel === "contact" &&
    (typeof corp.mesaj !== "string" || corp.mesaj.trim().length < 5)
  ) {
    return raspuns("Scrie-ne câteva cuvinte despre ce ai nevoie.", 400);
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
    // Datele firmei, când mesajul vine din partea uneia. Se completează din
    // CUI, din datele publice ale ANAF, și se pot corecta de mână.
    [corp.firma, MAXIM.nume],
    [corp.cui, MAXIM.telefon],
    [corp.nrRegCom, MAXIM.scurt],
    [corp.adresaFirmei, MAXIM.adresa],
    [corp.mesaj, MAXIM.mesaj],
    [corp.motiv, MAXIM.mesaj],
  ];
  if (!scurte.every(([valoare, maxim]) => textOptional(valoare, maxim))) {
    return raspuns("Mesajul e prea lung.", 400);
  }

  if (corp.fel === "voluntariat") {
    // Formularul verifică vârsta în browser, dar browserul poate fi ocolit.
    // Sub vârsta minimă formularul nu se trimite: datele unui copil prea mic
    // nu trebuie să ajungă nici măcar într-un email.
    //
    // Pragul e **16 ani**, nu 18. Caietul (11.4) scrie 18, dar asociația a
    // corectat cifra în precizările din 16 octombrie 2026 („trebuie să aibă
    // minim 16 ani, nu 18, am greșit eu aici"). Scris aici ca să nu fie pus
    // cineva pe gânduri de nepotrivirea cu caietul și să-l dea înapoi.
    const nastere = typeof corp.nastere === "string" ? corp.nastere : "";
    const data = new Date(`${nastere}T00:00:00`);
    if (!nastere || Number.isNaN(data.getTime())) {
      return raspuns("Completează data nașterii.", 400);
    }
    if (varsta(data, new Date()) < 16) {
      return raspuns(
        "Ne bucurăm că vrei să te implici! Deocamdată putem primi voluntari doar de la 16 ani.",
        400,
      );
    }
  }

  const voluntariat = corp.fel === "voluntariat";
  const adresaOmului = String(corp.email);
  const numeleOmului = String(corp.nume ?? "").trim();

  // În CRM înainte de e-mail: un mesaj citit și uitat dispare din inbox, un
  // rând în `cereri` rămâne, cu stadiul lui — nou, în lucru, rezolvat.
  if (areBazaDeDate()) {
    await salveazaCerere({
      fel: voluntariat ? "voluntariat" : "contact",
      nume: numeleOmului,
      email: adresaOmului,
      telefon: String(corp.telefon ?? "").trim() || undefined,
      detalii: Object.fromEntries(
        (
          [
            ["Interesat de", corp.interes],
            ["Firma", corp.firma],
            ["CUI", corp.cui],
            ["Nr. reg. com.", corp.nrRegCom],
            ["Sediul firmei", corp.adresaFirmei],
            ["Localitate", corp.localitate],
            ["Data nașterii", corp.nastere],
            ["Disponibilitate", corp.disponibilitate],
            ["Experiență cu copii", corp.experientaCopii],
            ["Limbi", corp.limbi],
            ["Permis", corp.permis],
            ["Cum a aflat", corp.aflat],
            ["Motivul", corp.motiv],
            ["Mesaj", corp.mesaj],
          ] as Array<[string, unknown]>
        )
          .map(([k, v]) => [k, String(v ?? "").trim()] as [string, string])
          .filter(([, v]) => v !== ""),
      ),
    }).catch(() => null);
  }

  if (!areEmail()) {
    return raspuns(
      "Trimiterea formularului nu este încă activă pe site-ul nou. Până atunci scrie-ne direct:",
      503,
    );
  }

  const campuri: Array<[string, string]> = [
    ["Nume", numeleOmului],
    ["E-mail", adresaOmului],
    ["Telefon", String(corp.telefon ?? "")],
    ["Interesat de", String(corp.interes ?? "")],
    ["Firma", String(corp.firma ?? "")],
    ["CUI", String(corp.cui ?? "")],
    ["Nr. reg. com.", String(corp.nrRegCom ?? "")],
    ["Sediul firmei", String(corp.adresaFirmei ?? "")],
    ["Localitate", String(corp.localitate ?? "")],
    ["Data nașterii", String(corp.nastere ?? "")],
    ["Disponibilitate", String(corp.disponibilitate ?? "")],
    ["Experiență cu copii", String(corp.experientaCopii ?? "")],
    ["Limbi", String(corp.limbi ?? "")],
    ["Permis", String(corp.permis ?? "")],
    ["Cum a aflat", String(corp.aflat ?? "")],
    ["Motivul", String(corp.motiv ?? "")],
    ["Mesaj", String(corp.mesaj ?? "")],
  ];

  const mesaj = {
    nume: numeleOmului,
    email: adresaOmului,
    voluntariat,
    campuri,
  };

  const catreAsociatie = await trimiteMesajulDeContact(mesaj);

  if (!catreAsociatie) {
    // Mesajul n-a ajuns la asociație. Omul trebuie să afle, nu să plece
    // liniștit că a scris cuiva.
    return raspuns(
      "Nu am putut trimite mesajul acum. Încearcă din nou peste câteva minute sau scrie-ne direct:",
      502,
    );
  }

  // Confirmarea către om. Dacă ea nu pleacă, nu e grav: mesajul lui a ajuns
  // deja unde trebuie, iar asociația îl va contacta.
  await trimiteConfirmareaDeContact(mesaj);

  return raspuns(
    voluntariat
      ? "Mulțumim! Am primit cererea ta și te contactăm în curând."
      : "Mulțumim! Am primit mesajul tău și îți răspundem cât putem de repede.",
    200,
  );
}
