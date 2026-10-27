import { limitaDeRata, nuTrece, raspuns } from "@/lib/api";
import { arePermisiune, numeleConectat } from "@/lib/admin";
import {
  firma as iaFirma,
  schimbaStadiulFirmei,
  scrieInteractiune,
} from "@/lib/crm";
import {
  contractDeSponsorizare,
  numeleFisierului,
  type DateContract,
} from "@/lib/contract";
import { numarPentruContract } from "@/lib/contracte";
import { citesteSuma } from "@/lib/suma";
import { inBani } from "@/date/plati";
import { contractWord } from "@/lib/contract-word";

/**
 * Contractul de sponsorizare, ca fișier PDF.
 *
 * Se generează la fiecare apăsare, din ce e în formular — nu se ține nicăieri.
 * Un contract salvat pe disc ar fi al treilea loc în care aceleași date pot
 * ajunge să difere, iar discul containerului oricum dispare la fiecare
 * publicare. Ce rămâne e urma din istoricul firmei: cine și când a generat
 * contractul, și pe ce sumă.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-contract",
    maxim: 30,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/firme"))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();
  const id = camp("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return nuTrece("Firmă necunoscută.");

  const firma = await iaFirma(id);
  if (!firma) return nuTrece("Firmă necunoscută.");

  /*
    Numărul vine din registru, nu din capul omului.

    Dacă în formular s-a scris unul, ăla rămâne — un contract vechi, refăcut,
    își păstrează numărul. Dacă nu, se ia următorul liber pe anul ăsta și se
    scrie în registru, ca la final de an să existe lista pe care o cere
    contabilul. Dacă baza nu răspunde, contractul se face oricum, fără număr:
    mai bine un contract fără număr decât o firmă care așteaptă.
  */
  let numar = camp("numar");
  if (!numar) {
    const inregistrat = await numarPentruContract({
      firmaId: id,
      denumire: camp("denumire") || firma.denumire,
      cui: camp("cui") || firma.cui,
      /*
        În registru suma stă în bani, ca peste tot în baza asta. Fără
        înmulțire, 1.500 de lei ar fi intrat ca 15 lei — iar totalul anului
        ar fi fost de o sută de ori mai mic, fără ca nimic să arate de ce.
      */
      valoareBani: (() => {
        const { suma } = citesteSuma(camp("valoare"));
        return suma === null ? null : inBani(suma);
      })(),
    }).catch(() => null);
    if (inregistrat) numar = inregistrat.scris;
  }

  const date: DateContract = {
    numar,
    data: camp("data"),
    denumire: camp("denumire") || firma.denumire,
    sediu: camp("sediu"),
    judet: camp("judet"),
    cui: camp("cui") || firma.cui,
    regCom: camp("regCom"),
    reprezentant: camp("reprezentant"),
    calitate: camp("calitate"),
    telefon: camp("telefon"),
    email: camp("email"),
    valoare: camp("valoare"),
    dataSemnarii: camp("dataSemnarii"),
    /*
      Care dintre cele două contracte. Vine dintr-un câmp al formularului,
      deci din afară: orice altceva decât valoarea cunoscută înseamnă cel
      dintâi contract, nu o eroare. Un buton nou în panou n-are voie să
      schimbe clauzele dacă cineva trimite o valoare inventată.
    */
    fel: String(formular.get("contract") ?? "").startsWith("declaratia177")
      ? "declaratia177"
      : "direct",
  };
  /*
    Word sau PDF, tot din valoarea butonului apăsat („direct-word”,
    „declaratia177-word”): manualul spune „Descarci în Word (dacă mai schimbi
    ceva) sau în PDF (dacă e gata)”, iar panoul dădea doar PDF. Generatorul de
    Word e același cu cel de pe pagina publică pentru firme.
  */
  const word = String(formular.get("contract") ?? "").endsWith("-word");

  // Lungimile sunt generoase pentru o denumire de firmă și strâmte cât să nu
  // intre un roman într-un câmp care ajunge într-un PDF.
  if (
    Object.values(date).some((v) => typeof v === "string" && v.length > 300)
  ) {
    return nuTrece("Un câmp e prea lung.");
  }

  const pdf = word ? await contractWord(date) : await contractDeSponsorizare(date);

  /*
    Urma din istoric se scrie înainte de a trimite fișierul, și nu oprește
    descărcarea dacă pică: un contract generat e un contract generat, chiar
    dacă notița n-a apucat să se scrie.
  */
  await scrieInteractiune({
    firmaId: id,
    fel: "notita",
    rezumat: `${
      date.fel === "declaratia177"
        ? "Contract pentru Declarația 177 generat"
        : "Contract generat"
    }${date.numar ? ` (nr. ${date.numar})` : ""}${
      date.valoare ? `, ${date.valoare} lei` : ""
    }`,
    scrisDe: (await numeleConectat()) ?? undefined,
  }).catch(() => undefined);

  if (formular.get("muta") === "da" && firma.stadiu === "cerere") {
    await schimbaStadiulFirmei(id, "contract_trimis").catch(() => undefined);
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": word
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf",
      "content-disposition": `attachment; filename="${numeleFisierului(date).replace(/\.pdf$/i, word ? ".docx" : ".pdf")}"`,
      "cache-control": "no-store",
    },
  });
}
