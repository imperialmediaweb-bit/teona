import {
  citesteJson,
  email as citesteEmail,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
  textOptional,
} from "@/lib/api";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { areEmail } from "@/lib/email/trimite";
import {
  trimiteRedirectionare,
  trimiteSponsorizare,
} from "@/lib/email/formulare";
import {
  CAI_SPONSORIZARE,
  PREFERINTE_REDIRECTIONARE,
} from "@/date/formulare";
import { areBazaDeDate } from "@/lib/baza";
import { salveazaCerere, salveazaFirma } from "@/lib/crm";

/**
 * Cele două formulare fiscale: 20% pentru firme (8) și 3,5% pentru persoane
 * fizice (7).
 *
 * Nu merg prin `/api/contact`: acolo mesajul e scris de om și pleacă unul
 * singur, aici câmpurile sunt fixe și pleacă două mesaje diferite, dintre
 * care unul e explicația pe care omul a cerut-o.
 *
 * Ce contează la fiecare e altceva, deci și eroarea e alta:
 *
 * - la **firme**, mesajul important e cel către asociație — firma așteaptă să
 *   fie sunată. Dacă acela nu pleacă, omul află, nu primește o confirmare
 *   pentru o cerere pe care n-a văzut-o nimeni;
 * - la **3,5%**, mesajul important e cel către om — el a cerut pașii. Dacă
 *   acela nu pleacă, degeaba are asociația evidența.
 *
 * Fără `RESEND_API_KEY` ambele răspund cinstit că trimiterea nu e activă și
 * dau telefonul. Nu afișăm „ți-am trimis” pentru un e-mail care n-a plecat.
 *
 * **Fiecare cerere se scrie și în CRM**, nu doar pe e-mail. Un e-mail se
 * pierde într-un inbox aglomerat și nu se poate filtra, număra sau urmări;
 * un rând în `firme` sau `cereri` rămâne și după ce mesajul a fost citit și
 * uitat. Scrierea se face prima, tocmai ca să nu depindă de Resend.
 */

const MAXIM = {
  nume: 120,
  cui: 20,
  telefon: 40,
  scurt: 120,
  mesaj: 2_000,
} as const;

/**
 * CUI-ul, așa cum îl scrie lumea: cu sau fără „RO”, cu spații sau fără.
 * Nu verificăm cifra de control — un CUI scris puțin greșit tot îi spune
 * asociației cu cine vorbește, iar un formular care respinge o firmă reală
 * costă mai mult decât o literă în plus într-un e-mail.
 */
const CUI = /^(ro)?\s?\d{2,10}$/i;

/**
 * Se verifică **după** validarea câmpurilor, nu înainte.
 *
 * Altfel o firmă care greșește CUI-ul ar primi „trimiterea nu e activă” în
 * loc de „CUI-ul e scris greșit”, și n-ar afla niciodată ce are de corectat.
 * Ordinea asta se vede doar când Resend nu e conectat, dar serverul nu are
 * voie să se bazeze pe faptul că browserul a verificat deja.
 */
function nuPleacaNimic(fel: "sponsorizare" | "redirectionare") {
  if (areEmail()) return null;
  const adresa =
    fel === "sponsorizare" ? EMAIL.contact : EMAIL.redirectionare;
  return raspuns(
    `Trimiterea nu este încă activă pe site-ul nou. Scrie-ne direct la ${adresa} sau sună la ${TELEFON_PRINCIPAL.afisat}.`,
    503,
  );
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "formulare",
    maxim: 6,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const citire = await citesteJson(cerere);
  if (!citire.ok) return citire.raspuns;
  const corp = citire.corp;

  if (esteRobot(corp)) {
    // Ca și cum a mers, ca robotul să nu insiste. Nu pleacă nimic.
    return raspuns("Mulțumim! Ți-am trimis un e-mail cu toți pașii.", 200);
  }

  const fel = corp.fel;
  if (fel !== "sponsorizare" && fel !== "redirectionare") {
    return raspuns("Cerere invalidă.", 400);
  }

  // Pagina pentru firme vorbește cu „dumneavoastră”, cea pentru persoane cu
  // „tu”. Mesajele de eroare trebuie să sune ca formularul din care vin,
  // altfel se vede că răspunde altcineva decât pagina.
  const firme = fel === "sponsorizare";

  const adresa = citesteEmail(corp.email);
  if (!adresa) {
    return raspuns(
      firme
        ? "Introduceți o adresă de e-mail validă."
        : "Introdu o adresă de e-mail validă.",
      400,
    );
  }

  if (corp.acord !== true) {
    return raspuns(
      firme
        ? "Bifați acordul pentru a continua."
        : "Bifează acordul pentru a continua.",
      400,
    );
  }

  if (!textOptional(corp.telefon, MAXIM.telefon)) {
    return raspuns("Numărul de telefon e prea lung.", 400);
  }
  const telefon = String(corp.telefon ?? "").trim() || undefined;

  if (firme) {
    const firma = text(corp.firma, MAXIM.nume);
    if (!firma || firma.length < 2) {
      return raspuns("Scrieți denumirea firmei.", 400);
    }

    const cui = text(corp.cui, MAXIM.cui);
    if (!cui || !CUI.test(cui)) {
      return raspuns(
        "Scrieți CUI-ul firmei: doar cifrele, sau cu „RO” în față.",
        400,
      );
    }

    const persoana = text(corp.persoana, MAXIM.nume);
    if (!persoana || persoana.length < 2) {
      return raspuns("Scrieți numele persoanei de contact.", 400);
    }

    const cale = String(corp.cale ?? "");
    if (!CAI_SPONSORIZARE.some((c) => c.valoare === cale)) {
      return raspuns("Alegeți cum vreți să direcționați.", 400);
    }

    if (
      !textOptional(corp.suma, MAXIM.scurt) ||
      !textOptional(corp.mesaj, MAXIM.mesaj)
    ) {
      return raspuns("Mesajul e prea lung.", 400);
    }

    const suma = String(corp.suma ?? "").trim() || undefined;
    const mesaj = String(corp.mesaj ?? "").trim() || undefined;

    // Întâi în CRM. Dacă pică baza, mergem mai departe cu e-mailul: o cerere
    // ajunsă doar pe e-mail e mai bună decât una pierdută.
    const inCrm = areBazaDeDate()
      ? await salveazaFirma({
          cui,
          denumire: firma,
          persoana,
          email: adresa,
          telefon,
          cale,
          sumaEstimata: suma,
          mesaj,
        }).catch(() => null)
      : null;

    const inactiv = nuPleacaNimic(fel);
    // Fără Resend, cererea tot e salvată — deci nu mai e o cerere pierdută.
    // Omul află totuși că nu i-am trimis nimic pe e-mail.
    if (inactiv && !inCrm) return inactiv;

    const { catreAsociatie } = inactiv
      ? { catreAsociatie: false }
      : await trimiteSponsorizare({
          firma,
          cui,
          persoana,
          email: adresa,
          telefon,
          cale,
          suma,
          mesaj,
        });

    if (!catreAsociatie && !inCrm) {
      return raspuns(
        `Nu am putut trimite cererea acum. Încearcă din nou peste câteva minute sau scrie-ne la ${EMAIL.contact}.`,
        502,
      );
    }

    return raspuns(
      catreAsociatie
        ? "Mulțumim! V-am trimis pașii pe e-mail și vă contactăm în curând."
        : "Mulțumim! V-am înregistrat cererea și vă contactăm în curând.",
      200,
    );
  }

  const nume = text(corp.nume, MAXIM.nume);
  if (!nume || nume.length < 2) {
    return raspuns("Scrie-ți numele, ca să știm cui scriem.", 400);
  }

  const preferinta = String(corp.preferinta ?? "");
  if (!PREFERINTE_REDIRECTIONARE.some((p) => p.valoare === preferinta)) {
    return raspuns("Alege cum vrei să completezi formularul.", 400);
  }

  if (areBazaDeDate()) {
    await salveazaCerere({
      fel: "redirectionare",
      nume,
      email: adresa,
      telefon,
      detalii: { preferinta },
    }).catch(() => null);
  }

  const inactiv = nuPleacaNimic(fel);
  if (inactiv) return inactiv;

  const { catreOm } = await trimiteRedirectionare({
    nume,
    email: adresa,
    telefon,
    preferinta,
  });

  if (!catreOm) {
    return raspuns(
      `Nu am putut trimite e-mailul acum. Încearcă din nou peste câteva minute sau scrie-ne la ${EMAIL.redirectionare}.`,
      502,
    );
  }

  return raspuns(
    "Ți-am trimis un e-mail cu toți pașii. Verifică-ți inboxul.",
    200,
  );
}
