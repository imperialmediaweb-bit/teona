import { NextResponse } from "next/server";
import { citesteJson, esteRobot, limitaDeRata, raspuns } from "@/lib/api";
import { arePayPal, deschideComanda } from "@/lib/plati/paypal";
import { DESTINATII } from "@/date/plati";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Pornește o donație în euro, prin PayPal.
 *
 * Sumele sunt în euro de la cap la coadă, nu convertite din lei: PayPal nu
 * suportă leul, iar un buton care scrie „100 lei” și debitează 19,65 € ar fi
 * exact genul de lucru care strică încrederea.
 */
const EURO_MINIM = 2;
const EURO_MAXIM = 10_000;

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
  if (!Number.isFinite(euro) || euro < EURO_MINIM || euro > EURO_MAXIM) {
    return raspuns(
      `Suma trebuie să fie între ${EURO_MINIM} și ${EURO_MAXIM} de euro.`,
      400,
    );
  }

  const destinatie =
    typeof corp.destinatie === "string" && corp.destinatie in DESTINATII
      ? corp.destinatie
      : "oriunde";

  try {
    const comanda = await deschideComanda({
      euro,
      destinatie,
      adresaSite: ADRESA_SITE,
    });
    return NextResponse.json(
      { adresa: comanda.adresa },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return raspuns(
      "Nu am putut porni plata prin PayPal. Încearcă din nou peste câteva minute.",
      502,
    );
  }
}
