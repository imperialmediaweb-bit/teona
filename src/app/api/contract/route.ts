import {
  email as emailValid,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
} from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { contractDeSponsorizare, numeleFisierului } from "@/lib/contract";
import { salveazaContract } from "@/lib/contracte";
import {
  anuntaContractulLaAsociatie,
  trimiteContractulFirmei,
} from "@/lib/email/contract";
import { cuiValid, curataCui } from "@/lib/cui";
import { citesteSuma, scrieCifre } from "@/lib/suma";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";

/**
 * Contractul de sponsorizare, semnat online de firmă.
 *
 * Firma completează datele, vede clauzele, semnează cu degetul sau cu
 * mouse-ul. Aici se face PDF-ul — același generator ca în panou, aceleași
 * clauze — cu semnătura desenată lipită în dreptul sponsorului, se păstrează
 * documentul întreg în baza de date și pleacă pe loc câte o copie la firmă și
 * la asociație.
 *
 * **Ce verifică serverul, și de ce.** Tot ce vine de la un formular public
 * poate fi scris de mână, cu orice conținut, de oricine. Aici se scrie un
 * document care poartă numele asociației, deci:
 *
 * - CUI-ul trece prin cifra de control, nu doar prin „are cifre”;
 * - suma e citită cu aceeași regulă ca în calculator (punctul desparte miile,
 *   virgula zecimalele), ca „12,500.50” să nu intre ca 12 lei și 50 de bani;
 * - semnătura trebuie să fie chiar o imagine PNG, nu orice șir trimis în locul
 *   ei, și e limitată ca mărime: o pânză de semnătură iese sub 100 KB, iar un
 *   fișier de câțiva megaocteți ar umple baza de date de la o singură cerere.
 */

/** Cât poate cântări desenul semnăturii. O pânză obișnuită iese sub 100 KB. */
const SEMNATURA_MAXIMA = 400 * 1024;
const PNG = [0x89, 0x50, 0x4e, 0x47];

/** Decodează `data:image/png;base64,…` și verifică faptul că chiar e PNG. */
function citesteSemnatura(brut: string): Uint8Array | null {
  const potrivire = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(
    brut.trim(),
  );
  if (!potrivire) return null;
  let octeti: Buffer;
  try {
    octeti = Buffer.from(potrivire[1], "base64");
  } catch {
    return null;
  }
  if (octeti.length < 200 || octeti.length > SEMNATURA_MAXIMA) return null;
  if (!PNG.every((b, i) => octeti[i] === b)) return null;
  return new Uint8Array(octeti);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "contract-online",
    maxim: 6,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  if (esteRobot(Object.fromEntries(formular.entries()))) {
    return raspuns("Mulțumim! Contractul a fost trimis.", 200);
  }

  const denumire = text(camp("denumire"), 200);
  if (!denumire || denumire.length < 3) {
    return raspuns("Scrieți denumirea firmei, ca în actele ei.", 400);
  }

  const numarCui = curataCui(camp("cui"));
  if (numarCui === null || !cuiValid(numarCui)) {
    return raspuns("CUI-ul nu e valid. Verificați cifrele.", 400);
  }
  const cui = String(numarCui);

  const reprezentant = text(camp("reprezentant"), 120);
  if (!reprezentant || reprezentant.length < 3) {
    return raspuns("Scrieți numele celui care semnează.", 400);
  }

  const adresa = camp("email");
  if (!emailValid(adresa)) {
    return raspuns(
      "Adresa de e-mail nu e scrisă corect. Acolo trimitem contractul.",
      400,
    );
  }

  const { suma, eroare } = citesteSuma(camp("valoare"));
  if (eroare) return raspuns(eroare, 400);
  if (suma === null || suma <= 0) {
    return raspuns("Scrieți valoarea contractului, în lei.", 400);
  }

  if (formular.get("acord") !== "da") {
    return raspuns(
      "Bifați că ați citit contractul și că semnați în numele firmei.",
      400,
    );
  }

  const semnatura = citesteSemnatura(camp("semnatura"));
  if (!semnatura) {
    return raspuns("Semnați în casetă înainte de a trimite.", 400);
  }

  /*
    Împrejurările semnăturii, scrise în document, nu doar în baza noastră.
    Ora e cea a serverului, scrisă în fus orar românesc: un contract semnat
    „la 03:14 UTC" nu spune nimic nimănui.
  */
  const acum = new Date();
  const cand = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  }).format(acum);
  const ip =
    cerere.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const agent = cerere.headers.get("user-agent") ?? undefined;

  const date = {
    numar: "",
    data: "",
    denumire,
    sediu: text(camp("sediu"), 200) ?? "",
    judet: text(camp("judet"), 80) ?? "",
    cui,
    regCom: text(camp("regCom"), 80) ?? "",
    reprezentant,
    calitate: text(camp("calitate"), 80) ?? "",
    telefon: text(camp("telefon"), 40) ?? "",
    email: adresa,
    valoare: scrieCifre(suma),
    dataSemnarii: cand,
    semnatura,
    urmaSemnaturii: `Semnătură electronică aplicată online la ${cand}${ip ? `, de la adresa IP ${ip}` : ""}.`,
  };

  let pdf: Uint8Array;
  try {
    pdf = await contractDeSponsorizare(date);
  } catch {
    return raspuns(
      "Nu am putut scrie contractul. Încercați din nou în câteva minute.",
      500,
    );
  }

  /*
    Baza de date se verifică abia aici, după ce documentul e scris.

    Invers ar fi fost mai ieftin, dar ar fi însemnat că proba care rulează
    fără bază de date nu trece niciodată prin scrierea PDF-ului — adică exact
    prin partea care lipește semnătura desenată în pagină.
  */
  if (!areBazaDeDate()) {
    return raspuns(
      `Nu putem înregistra contractul acum. Scrieți-ne la ${EMAIL.contact} sau sunați la ${TELEFON_PRINCIPAL.afisat}.`,
      503,
    );
  }

  const salvat = await salveazaContract({
    denumire,
    cui,
    sediu: date.sediu || undefined,
    regCom: date.regCom || undefined,
    reprezentant,
    calitate: date.calitate || undefined,
    telefon: date.telefon || undefined,
    email: adresa,
    valoare: date.valoare,
    pdf,
    ip,
    agent,
  });

  if (!salvat) {
    return raspuns(
      `Nu am putut înregistra contractul. Scrieți-ne la ${EMAIL.contact}.`,
      500,
    );
  }

  const comun = {
    denumire,
    reprezentant,
    email: adresa,
    valoare: date.valoare,
    amprenta: salvat.amprenta,
    numeFisier: numeleFisierului(date),
    pdf,
  };

  // E-mailurile nu opresc răspunsul: contractul e deja salvat, iar dacă
  // Resend nu răspunde, asociația îl vede oricum în panou.
  await Promise.allSettled([
    trimiteContractulFirmei(comun),
    anuntaContractulLaAsociatie({
      ...comun,
      cui,
      telefon: date.telefon || undefined,
      ip,
    }),
  ]);

  return raspuns(
    "Contractul e semnat și înregistrat. V-am trimis o copie pe e-mail, iar asociația îl contrasemnează și vi-l trimite înapoi.",
    200,
  );
}
