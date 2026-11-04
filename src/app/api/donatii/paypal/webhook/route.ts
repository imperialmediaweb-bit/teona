import { NextResponse } from "next/server";
import { raspuns, limitaDeRata, octetiCuLimita } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { evenimentNou } from "@/lib/plati/donatii";
import { semnaturaEValida } from "@/lib/plati/paypal";
import { incaseazaSiInregistreaza, inregistreazaPayPal } from "@/lib/plati/confirmare";

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
  // Fiecare cerere cu antetele puse costă o întrebare la PayPal: limita
  // oprește pe cineva care ar bate la ușa asta în buclă.
  const prea = limitaDeRata(cerere, {
    cheie: "paypal-webhook",
    maxim: 120,
    fereastraMs: 60 * 1000,
  });
  if (prea) return prea;

  const octeti = await octetiCuLimita(cerere, 256 * 1024).catch(() => null);
  if (!octeti) return raspuns("Cerere invalidă.", 413);
  const corp = octeti.toString("utf8");

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
    await inregistreazaPayPal({
      id: resursa.id ?? eveniment.id,
      bani: Math.round(Number(resursa.amount?.value ?? 0) * 100),
      moneda: resursa.amount?.currency_code ?? "EUR",
      email: resursa.payer?.email_address ?? null,
      // „destinatie|canal", cum l-am trimis noi la deschiderea comenzii.
      customId: resursa.custom_id ?? "",
    });
  }

  /*
    Omul a aprobat plata, dar a închis fila înainte de pagina de mulțumire:
    comanda trebuie încasată de aici, altfel expiră și banii nu se iau.
  */
  if (eveniment.event_type === "CHECKOUT.ORDER.APPROVED" && eveniment.resource?.id) {
    try {
      await incaseazaSiInregistreaza(eveniment.resource.id);
    } catch (e) {
      console.error("PayPal:", e instanceof Error ? e.message : "încasare picată");
    }
  }

  return NextResponse.json({ primit: true });
}
