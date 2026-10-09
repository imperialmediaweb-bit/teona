import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { areBazaDeDate, intreaba } from "@/lib/baza";

/**
 * Trimiterea către Revolut, cu numărarea apăsărilor.
 *
 * Ce e de știut înainte de a folosi blocul ăsta, scris o dată aici ca să nu
 * se piardă: **un link Revolut nu se poate contoriza.** Banii nu trec prin
 * site, deci site-ul nu află niciodată că s-a plătit, cât s-a plătit sau de
 * către cine. Tot ce putem număra e de câte ori s-a apăsat butonul — adică
 * intenția, nu donația. Ruta asta numără exact atât, și nimic mai mult.
 *
 * Mai e ceva: un link `revolut.me` primește cel mult ~250 £ pe săptămână prin
 * card și cel mult 20 de plăți pe săptămână. O campanie care merge bine
 * lovește plafonul. Dacă linkul din `REVOLUT_LINK` e unul personal, și nu al
 * asociației, donațiile ajung într-un cont pe numele unei persoane — ceea ce
 * strică și contabilitatea, și încrederea.
 *
 * Nimic din toate astea nu se rezolvă din cod. Blocul apare doar dacă cineva
 * pune `REVOLUT_LINK` în mediu, adică doar dacă asociația a decis că vrea.
 */
export async function GET(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "revolut",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const link = process.env.REVOLUT_LINK;
  if (!link || !/^https:\/\//i.test(link)) {
    return raspuns("Plata prin Revolut nu e configurată.", 503);
  }

  if (areBazaDeDate()) {
    await intreaba(
      `INSERT INTO apasari (ce, cand) VALUES ('revolut', now())`,
    ).catch(() => undefined);
  }

  return NextResponse.redirect(link, {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
}
