import { NextResponse } from "next/server";
import {
  citesteJson,
  email as citesteEmail,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
} from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { scrieInitiata } from "@/lib/plati/donatii";
import { areStripe, deschideSesiune } from "@/lib/plati/stripe";
import { DESTINATII, inBani, sumaAcceptata } from "@/date/plati";
import { ADRESA_SITE } from "@/app/seo";

/** Pornește o plată cu cardul și întoarce adresa paginii de plată Stripe. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "donatii-stripe",
    maxim: 10,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!areStripe()) {
    return raspuns(
      "Plata cu cardul nu e încă pornită. Poți dona prin transfer bancar, prin SMS sau pe Galantom.",
      503,
    );
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

  const lei = Number(corp.lei);
  if (!sumaAcceptata(lei)) {
    return raspuns("Suma trebuie să fie între 5 și 50.000 de lei.", 400);
  }

  const frecventa = corp.frecventa === "lunar" ? "lunar" : "o-data";

  // Destinația vine din browser, deci nu e de încredere: se acceptă doar una
  // dintre cele patru din caiet.
  const destinatie =
    typeof corp.destinatie === "string" && corp.destinatie in DESTINATII
      ? corp.destinatie
      : "oriunde";

  const email = citesteEmail(corp.email);
  if (!email) return raspuns("Introdu o adresă de e-mail validă.", 400);

  if (corp.acord !== "da") {
    return raspuns("Bifează acordul pentru a continua.", 400);
  }

  try {
    const sesiune = await deschideSesiune({
      lei,
      frecventa,
      destinatie,
      email,
      prenume: text(corp.prenume, 80),
      nume: text(corp.nume, 80),
      telefon: text(corp.telefon, 40),
      acordBuletin: corp.buletin === "da",
      campanieSlug: text(corp.campanie, 120),
      adresaSite: ADRESA_SITE,
    });

    // Rândul „initiata” se scrie înainte de redirecționare, ca o plată
    // confirmată să aibă unde ateriza. Dacă baza nu răspunde, plata merge
    // mai departe: webhookul o va scrie oricum, iar o donație pierdută e
    // mai gravă decât o evidență incompletă.
    if (areBazaDeDate()) {
      await scrieInitiata({
        procesator: "stripe",
        referinta: sesiune.id,
        sumaBani: inBani(lei),
        moneda: "RON",
        frecventa,
        destinatie,
        email,
        prenume: text(corp.prenume, 80),
        nume: text(corp.nume, 80),
        telefon: text(corp.telefon, 40),
        acordBuletin: corp.buletin === "da",
        campanieSlug: text(corp.campanie, 120),
      }).catch(() => undefined);
    }

    return NextResponse.json(
      { adresa: sesiune.adresa },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return raspuns(
      "Nu am putut porni plata. Încearcă din nou peste câteva minute.",
      502,
    );
  }
}
