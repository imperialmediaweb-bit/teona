import { NextResponse } from "next/server";
import { raspuns } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import {
  evenimentNou,
  marcheazaPlatita,
  scrieInitiata,
} from "@/lib/plati/donatii";
import { semnaturaEValida } from "@/lib/plati/paypal";

/**
 * Confirmarea plăților, de la PayPal.
 *
 * Ca la Stripe: pagina de întoarcere nu dovedește nimic, doar mesajul
 * verificat al procesatorului. PayPal nu semnează într-un fel pe care să-l
 * putem verifica singuri, deci întrebăm serverul lor dacă antetele sunt
 * bune — o cerere în plus la fiecare eveniment, dar e singura verificare
 * adevărată.
 */
export async function POST(cerere: Request) {
  const corp = await cerere.text();

  if (!(await semnaturaEValida(cerere.headers, corp))) {
    return raspuns("Semnătură invalidă.", 400);
  }

  let eveniment: {
    id?: string;
    event_type?: string;
    resource?: {
      id?: string;
      amount?: { value?: string; currency_code?: string };
      custom_id?: string;
      payer?: { email_address?: string };
    };
  };
  try {
    eveniment = JSON.parse(corp);
  } catch {
    return raspuns("Corp invalid.", 400);
  }

  if (!eveniment.id) return raspuns("Eveniment fără identificator.", 400);
  if (!areBazaDeDate()) return NextResponse.json({ primit: true });

  if (!(await evenimentNou("paypal", eveniment.id))) {
    return NextResponse.json({ primit: true, repetat: true });
  }

  if (eveniment.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resursa = eveniment.resource ?? {};
    const referinta = resursa.id ?? eveniment.id;
    const bani = Math.round(Number(resursa.amount?.value ?? 0) * 100);

    await scrieInitiata({
      procesator: "paypal",
      referinta,
      sumaBani: bani,
      moneda: resursa.amount?.currency_code ?? "EUR",
      frecventa: "o-data",
      destinatie: resursa.custom_id ?? "oriunde",
      email: resursa.payer?.email_address ?? null,
      prenume: null,
      nume: null,
      telefon: null,
      // PayPal nu ne poate transmite o bifă pe care omul n-a văzut-o pe
      // site-ul nostru. Fără acord explicit, nimeni nu ajunge pe listă.
      acordBuletin: false,
    });
    await marcheazaPlatita("paypal", referinta, bani);
  }

  return NextResponse.json({ primit: true });
}
