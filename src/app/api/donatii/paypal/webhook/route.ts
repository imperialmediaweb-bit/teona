import { NextResponse } from "next/server";
import { raspuns, limitaDeRata, octetiCuLimita } from "@/lib/api";
import { areBazaDeDate, intreaba } from "@/lib/baza";
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

  try {
    await prelucreaza(eveniment);
  } catch (e) {
    /*
      Ca la Stripe: o eroare (PayPal sau baza nu răspund) cere reîncercarea.
      Rândul din evenimente_plati se șterge înainte, altfel la reîncercare
      evenimentul ar ieși pe „repetat” și comanda ar expira neîncasată.
    */
    console.error("PayPal:", e instanceof Error ? e.message : "eroare");
    await intreaba(
      "DELETE FROM evenimente_plati WHERE procesator = 'paypal' AND eveniment = $1",
      [eveniment.id],
    ).catch(() => undefined);
    return raspuns("Nu am putut prelucra evenimentul.", 500);
  }

  return NextResponse.json({ primit: true });
}

type EvenimentPayPal = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    amount?: { value?: string; currency_code?: string };
    custom_id?: string;
    payer?: { email_address?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

async function prelucreaza(eveniment: EvenimentPayPal) {
  /*
    Încasarea s-a făcut. Resursa e o încasare, nu o comandă, și n-are adresa
    donatorului; se citește comanda ei, ca mulțumirea să aibă unde pleca. Altfel,
    dacă anunțul ăsta ajungea înaintea paginii de mulțumire, donația se scria
    fără e-mail și nimeni nu mai primea nimic.
  */
  if (eveniment.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resursa = eveniment.resource ?? {};
    const comanda = resursa.supplementary_data?.related_ids?.order_id;
    if (comanda && (await incaseazaSiInregistreaza(comanda))) return;
    await inregistreazaPayPal({
      id: resursa.id ?? eveniment.id ?? "",
      bani: Math.round(Number(resursa.amount?.value ?? 0) * 100),
      moneda: resursa.amount?.currency_code ?? "EUR",
      email: resursa.payer?.email_address ?? null,
      // „destinatie|canal", cum l-am trimis noi la deschiderea comenzii.
      customId: resursa.custom_id ?? "",
    });
    return;
  }

  /*
    Omul a aprobat plata, dar a închis fila înainte de pagina de mulțumire:
    comanda se încasează de aici, altfel expiră și banii nu se iau.
  */
  if (eveniment.event_type === "CHECKOUT.ORDER.APPROVED" && eveniment.resource?.id) {
    await incaseazaSiInregistreaza(eveniment.resource.id);
  }
}
