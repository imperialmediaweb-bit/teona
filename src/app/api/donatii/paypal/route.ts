import { NextResponse } from "next/server";
import { citesteJson, esteRobot, limitaDeRata, raspuns } from "@/lib/api";
import { arePayPal, deschideComanda } from "@/lib/plati/paypal";
import {
  EURO_MAXIM,
  EURO_MINIM,
  esteDestinatie,
  euroAcceptat,
} from "@/date/plati";
import { esteCanal } from "@/lib/atribuire";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Pornește o donație în euro, prin PayPal.
 *
 * Sumele sunt în euro de la cap la coadă, nu convertite din lei: PayPal nu
 * suportă leul, iar un buton care scrie „100 lei” și debitează 19,65 € ar fi
 * exact genul de lucru care strică încrederea.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "donatii-paypal",
    maxim: 10,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!arePayPal()) {
    return raspuns("Plata prin PayPal nu e încă pornită.", 503);
  }

  const citire = await citesteJson(cerere);
  if (!citire.ok) return citire.raspuns;
  const corp = citire.corp;

  if (esteRobot(corp)) {
    return NextResponse.json(
      { adresa: `${ADRESA_SITE}/multumim` },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  const euro = Number(corp.euro);
  if (!euroAcceptat(euro)) {
    return raspuns(
      `Suma trebuie să fie între ${EURO_MINIM} și ${EURO_MAXIM} de euro.`,
      400,
    );
  }

  const destinatie =
    esteDestinatie(corp.destinatie)
      ? corp.destinatie
      : "oriunde";

  try {
    const comanda = await deschideComanda({
      euro,
      destinatie,
      canal: esteCanal(corp.canal) ? corp.canal : null,
      adresaSite: ADRESA_SITE,
    });
    return NextResponse.json(
      { adresa: comanda.adresa },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (eroare) {
    /*
      Motivul, în jurnalul serverului.

      Donatorul vede un mesaj omenesc, dar cineva trebuie să poată afla de ce
      n-a mers — altfel „PayPal nu merge" rămâne o vorbă, iar cauza (chei de
      probă într-un cont de producție, cont fără euro, jeton refuzat) se caută
      pe ghicite. Mesajele aruncate de `paypal.ts` conțin numai codul de
      răspuns, niciodată cheile.
    */
    console.error(
      "PayPal:",
      eroare instanceof Error ? eroare.message : "eroare necunoscută",
    );
    /*
      Nu 502: Cloudflare înlocuiește un 502 venit de la server cu pagina lui
      de eroare, deci butonul primea HTML în loc de mesaj și scria „încearcă
      din nou”. Așa a arătat, pe 11 noiembrie 2026, contul PayPal restricționat
      (PAYEE_ACCOUNT_RESTRICTED): „încearcă din nou” nu ajuta pe nimeni.
      Căile celelalte (card, transfer) le scrie butonul, sub mesaj.
    */
    const restrictionat =
      eroare instanceof Error && /ACCOUNT_RESTRICTED|PAYEE_ACCOUNT/i.test(eroare.message);
    return raspuns(
      restrictionat
        ? "PayPal nu primește donații pentru asociație în acest moment."
        : "Nu am putut porni plata prin PayPal. Încearcă din nou peste câteva minute.",
      503,
    );
  }
}
