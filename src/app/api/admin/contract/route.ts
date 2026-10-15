import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
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

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();
  const id = camp("id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Firmă necunoscută.", 400);

  const firma = await iaFirma(id);
  if (!firma) return raspuns("Firmă necunoscută.", 400);

  const date: DateContract = {
    numar: camp("numar"),
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
  };

  // Lungimile sunt generoase pentru o denumire de firmă și strâmte cât să nu
  // intre un roman într-un câmp care ajunge într-un PDF.
  if (Object.values(date).some((v) => v.length > 300)) {
    return raspuns("Un câmp e prea lung.", 400);
  }

  const pdf = await contractDeSponsorizare(date);

  /*
    Urma din istoric se scrie înainte de a trimite fișierul, și nu oprește
    descărcarea dacă pică: un contract generat e un contract generat, chiar
    dacă notița n-a apucat să se scrie.
  */
  await scrieInteractiune({
    firmaId: id,
    fel: "notita",
    rezumat: `Contract generat${date.numar ? ` (nr. ${date.numar})` : ""}${
      date.valoare ? `, ${date.valoare} lei` : ""
    }`,
  }).catch(() => undefined);

  if (formular.get("muta") === "da" && firma.stadiu === "cerere") {
    await schimbaStadiulFirmei(id, "contract_trimis").catch(() => undefined);
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${numeleFisierului(date)}"`,
      "cache-control": "no-store",
    },
  });
}
