import { after } from "next/server";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { email as emailValid } from "@/lib/api";
import { areBazaDeDate, intreaba } from "@/lib/baza";
import { salveazaFirma, scrieInteractiune } from "@/lib/crm";
import { numarPentruContract } from "@/lib/contracte";
import { inBani } from "@/date/plati";
import {
  anuntaDescarcarea,
  trimiteContractulNesemnat,
} from "@/lib/email/contract";
import {
  contractDeSponsorizare,
  numeleFisierului,
  type DateContract,
} from "@/lib/contract";
import { contractWord } from "@/lib/contract-word";
import { cuiValid, curataCui } from "@/lib/cui";
import { citesteSuma, scrieCifre } from "@/lib/suma";

/**
 * Contractul de sponsorizare, de descărcat.
 *
 * Două feluri, din aceleași date:
 *
 * - **modelul gol** (`GET`), pentru cine vrea să-l completeze de mână sau
 *   să-l aibă la dosar;
 * - **contractul completat** (`POST`), cu datele firmei scrise în el, în Word
 *   sau în PDF. Firma îl semnează cum vrea — cu certificatul calificat, care
 *   are prin lege puterea semnăturii olografe, sau tipărit, cu pixul — și ni-l
 *   trimite pe e-mail.
 *
 * **Aici nu se semnează nimic și nu se salvează nimic.** O descărcare nu e un
 * angajament, iar un document cu datele unei firme, generat și uitat într-o
 * bază de date pentru că cineva a apăsat un buton, e o colecție de date fără
 * rost. Contractul intră în evidență abia când e semnat.
 */

type Citire = { eroare?: string; date?: DateContract };

/** Ce completează firma în formular, curățat. */
function citesteDatele(formular: FormData): Citire {
  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  const denumire = text(camp("denumire"), 200);
  if (!denumire || denumire.length < 3) {
    return { eroare: "Scrieți denumirea firmei, ca în actele ei." };
  }

  const numarCui = curataCui(camp("cui"));
  if (numarCui === null || !cuiValid(numarCui)) {
    return { eroare: "CUI-ul nu e valid. Verificați cifrele." };
  }

  /*
    Câmpurile cu steluță se cer și aici, nu doar în pagină: un formular
    trimis pe lângă pagină (sau o pagină veche, din cache) ar scoate altfel
    un contract fără reprezentant, fără sumă și fără o adresă la care
    asociația să se mai poată întoarce — și fără nicio urmă în panou.
  */
  const reprezentant = text(camp("reprezentant"), 120);
  if (!reprezentant || reprezentant.length < 3) {
    return { eroare: "Scrieți numele celui care semnează." };
  }

  let valoare = "";
  const { suma, eroare: eroareSuma } = citesteSuma(camp("valoare"));
  if (eroareSuma) return { eroare: eroareSuma };
  if (suma === null || !(suma > 0)) {
    return { eroare: "Scrieți suma sponsorizării, în lei." };
  }
  valoare = scrieCifre(suma);

  const adresa = camp("email");
  if (!adresa) {
    return { eroare: "Scrieți adresa de e-mail. Pe ea primiți și copia contractului." };
  }
  if (!emailValid(adresa)) {
    return { eroare: "Adresa de e-mail nu e scrisă corect." };
  }

  return {
    date: {
      numar: "",
      data: "",
      denumire,
      sediu: text(camp("sediu"), 200) ?? "",
      judet: text(camp("judet"), 80) ?? "",
      cui: String(numarCui),
      regCom: text(camp("regCom"), 80) ?? "",
      reprezentant,
      calitate: text(camp("calitate"), 80) ?? "",
      telefon: text(camp("telefon"), 40) ?? "",
      email: adresa,
      valoare,
      dataSemnarii: "",
    },
  };
}

function fisier(
  continut: Uint8Array,
  nume: string,
  tip: string,
): Response {
  return new Response(new Uint8Array(continut), {
    headers: {
      "Content-Type": tip,
      "Content-Disposition": `attachment; filename="${nume}"`,
      // Contractul unei firme n-are ce căuta în niciun cache de pe drum.
      "Cache-Control": "no-store",
    },
  });
}

const WORD =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Modelul gol, în Word. Linkul de pe pagina pentru firme. */
export async function GET() {
  const document = await contractWord();
  return fisier(document, "Contract-de-sponsorizare.docx", WORD);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "contract-descarca",
    maxim: 20,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const citit = citesteDatele(formular);
  if (citit.eroare || !citit.date) {
    return raspuns(citit.eroare ?? "Datele nu sunt complete.", 400);
  }

  const fel = String(formular.get("fel") ?? "pdf");
  if (fel !== "pdf" && fel !== "word") {
    return raspuns("Format necunoscut.", 400);
  }

  /*
    Firma intră în panou ÎNAINTE de a primi documentul, nu după.

    Înainte, fișa se scria abia după răspuns, iar contractul ieșea fără număr
    și fără dată, și nu apărea în registrul de contracte: în panou rămânea cel
    mult o notiță. Acum, ca la un contract generat din panou: fișa firmei (cu
    cine semnează și cât), un număr din registru, data de azi, stadiul
    „contract trimis” și o notiță cu tot ce a completat. Dacă baza nu
    răspunde, contractul se face oricum, fără număr — o firmă care așteaptă
    e mai rea decât un contract fără număr.
  */
  if (areBazaDeDate()) {
    const d = citit.date;
    const firma = await salveazaFirma({
      cui: d.cui,
      denumire: d.denumire,
      persoana: d.reprezentant,
      email: d.email,
      telefon: d.telefon || undefined,
      cale: "Contract de sponsorizare",
      sumaEstimata: d.valoare || undefined,
    }).catch(() => null);
    if (firma) {
      const { suma } = citesteSuma(d.valoare);
      const inregistrat = await numarPentruContract({
        firmaId: firma.id,
        denumire: d.denumire,
        cui: d.cui,
        valoareBani: suma === null ? null : inBani(suma),
      }).catch(() => null);
      if (inregistrat) {
        d.numar = inregistrat.scris;
        d.data = new Intl.DateTimeFormat("ro-RO", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Europe/Bucharest",
        }).format(new Date());
      }
      // O firmă nouă trece la „contract trimis”; una aflată deja mai departe
      // (semnat, bani încasați) nu se dă înapoi.
      await intreaba(
        "UPDATE firme SET stadiu = 'contract_trimis', schimbat_la = now() WHERE id = $1 AND stadiu = 'cerere'",
        [firma.id],
      ).catch(() => undefined);
      await scrieInteractiune({
        firmaId: firma.id,
        fel: "email",
        rezumat:
          `Și-a generat de pe site contractul de sponsorizare (${fel === "word" ? "Word" : "PDF"})` +
          (d.numar ? `, nr. ${d.numar}` : "") +
          `, pentru ${d.valoare} lei. Semnează: ${d.reprezentant}` +
          (d.calitate ? `, ${d.calitate}` : "") +
          `. E-mail: ${d.email}` +
          (d.telefon ? `, telefon: ${d.telefon}` : "") +
          (d.sediu ? `. Sediu: ${d.sediu}` : "") +
          (d.regCom ? `. Reg. com.: ${d.regCom}` : "") +
          ".",
      }).catch(() => undefined);
    }
  }

  try {
    const nume =
      fel === "word"
        ? numeleFisierului(citit.date).replace(/\.pdf$/, ".docx")
        : numeleFisierului(citit.date);
    const document =
      fel === "word"
        ? await contractWord(citit.date)
        : await contractDeSponsorizare(citit.date);

    /*
      Copia pe e-mail și anunțul către asociație, după ce fișierul a plecat:
      descărcarea nu așteaptă după Resend. Fișa și registrul s-au scris mai
      sus, înainte de document.
    */
    if (citit.date.email) {
      const date = citit.date;
      after(async () => {
        await Promise.allSettled([
          trimiteContractulNesemnat({
            denumire: date.denumire,
            reprezentant: date.reprezentant,
            email: date.email,
            valoare: date.valoare,
            numeFisier: nume,
            pdf: document,
          }),
          anuntaDescarcarea({
            denumire: date.denumire,
            cui: date.cui,
            reprezentant: date.reprezentant,
            email: date.email,
            telefon: date.telefon || undefined,
            valoare: date.valoare,
            fel: fel === "word" ? "Word" : "PDF",
          }),
        ]);
      });
    }

    return fisier(document, nume, fel === "word" ? WORD : "application/pdf");
  } catch {
    return raspuns(
      "Nu am putut scrie contractul. Încercați din nou în câteva minute.",
      500,
    );
  }
}
