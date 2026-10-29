import {
  email as emailValid,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
  formularCuLimita,
} from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { anuntaTransfer } from "@/lib/plati/donatori";
import { anuntaTransferulPeEmail } from "@/lib/email/transfer";
import { citesteSuma } from "@/lib/suma";
import { esteCanal } from "@/lib/atribuire";
import { esteDestinatie, inBani, sumaAcceptata } from "@/date/plati";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";

/**
 * „Am făcut transferul” — anunțul donatorului, nu plata.
 *
 * Transferul bancar nu trece prin site: omul îl face din aplicația băncii
 * lui, iar banii apar în extrasul asociației. Site-ul n-are cum să-i vadă —
 * nu există API de bancă, extrasul se citește de om. Până acum, un transfer
 * rămânea invizibil până când cineva îl bătea de mână, iar donatorul n-avea
 * nicio urmă că a dat.
 *
 * De aici intră în panou, cu starea `anuntata`: **nu se numără nicăieri**
 * până când cineva îl găsește în extras și apasă „Confirmă". Altfel, orice
 * om cu un browser ar putea umfla totalurile din raportul anual dintr-un
 * formular public.
 *
 * Suma, data și destinația sunt verificate aici, nu doar în browser: ce vine
 * de la un formular public poate fi scris de mână, cu orice conținut.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "anunt-transfer",
    maxim: 8,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await formularCuLimita(cerere, 16 * 1024);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  if (esteRobot(Object.fromEntries(formular.entries()))) {
    return raspuns("Mulțumim! Am notat transferul.", 200);
  }

  const nume = text(camp("nume"), 120);
  if (!nume || nume.length < 2) {
    return raspuns(
      "Scrie-ți numele, exact cum apare pe transfer — după el îl găsim în extras.",
      400,
    );
  }

  /*
    Bifa. Ea e tot rostul formularului: omul spune că a făcut transferul, nu
    că vrea să-l facă. Fără ea ar intra în panou intenții, nu plăți — și
    cineva ar căuta în extras bani care n-au plecat niciodată.
  */
  if (formular.get("confirm") !== "da") {
    return raspuns(
      "Bifează „Am făcut transferul” — altfel nu știm ce să căutăm în extras.",
      400,
    );
  }

  const { suma, eroare } = citesteSuma(camp("suma"));
  if (eroare) return raspuns(eroare, 400);
  if (suma === null || !sumaAcceptata(suma)) {
    return raspuns("Scrie suma transferului, în lei.", 400);
  }

  const destinatie = camp("destinatie") || "oriunde";
  if (!esteDestinatie(destinatie)) {
    return raspuns("Alege pentru ce e donația.", 400);
  }

  const data = camp("data");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return raspuns("Alege data la care ai făcut transferul.", 400);
  }
  // Ziua întreagă, la prânz: un transfer scris „2026-03-04" nu trebuie să
  // cadă în luna precedentă din cauza fusului orar.
  const cand = new Date(`${data}T12:00:00Z`);
  if (Number.isNaN(cand.getTime())) {
    return raspuns("Data nu e scrisă corect.", 400);
  }
  if (cand.getTime() > Date.now() + 24 * 3600 * 1000) {
    return raspuns(
      "Data e în viitor. Anunță-ne după ce ai făcut transferul.",
      400,
    );
  }
  // Un an în urmă e deja o greșeală de tastare la an, nu un transfer uitat.
  if (cand.getTime() < Date.now() - 365 * 24 * 3600 * 1000) {
    return raspuns("Data e mai veche de un an. Verifică anul.", 400);
  }

  const adresa = camp("email");
  if (adresa && !emailValid(adresa)) {
    return raspuns(
      "Adresa de e-mail nu e scrisă corect. Lasă câmpul gol dacă preferi.",
      400,
    );
  }

  if (!areBazaDeDate()) {
    return raspuns(
      `Nu putem nota asta acum. Scrie-ne pe ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat} și notăm noi transferul.`,
      503,
    );
  }

  /*
    Referința ține laolaltă data, suma și omul. Pe coloana asta tabelul are o
    constrângere de unicitate, deci o a doua apăsare pe „Trimite" — sau un
    formular trimis de două ori dintr-o conexiune proastă — nu produce două
    transferuri de căutat în extras. Două transferuri chiar diferite
    (altă zi, altă sumă) au referințe diferite și intră amândouă.
  */
  const referinta =
    `${data} · ${suma} lei · ${adresa || camp("telefon") || nume}`.slice(
      0,
      120,
    );

  const rezultat = await anuntaTransfer({
    referinta,
    sumaBani: inBani(suma),
    destinatie,
    data: cand.toISOString(),
    email: emailValid(adresa) ?? undefined,
    nume,
    telefon: text(camp("telefon"), 40) ?? undefined,
    observatii: text(camp("observatii"), 1_000) ?? undefined,
    /*
      De unde a venit donatorul. Mai ales aici: cât timp plata cu cardul nu e
      pornită, transferul anunțat e singura donație care trece prin site, deci
      singura care poate spune dacă afișul cu cod QR sau reclama au adus ceva.
    */
    canal: esteCanal(camp("canal")) ? camp("canal") : null,
    sursa: text(camp("sursa"), 120) ?? null,
  });

  /*
    Mesajele pleacă după ce anunțul e în bază, nu înainte: un e-mail trimis
    pentru un rând care n-a intrat ar trimite asociația să caute în extras un
    transfer care nu e nicăieri. Dacă trimiterea cade, anunțul rămâne —
    numărul lui stă oricum în „De făcut acum".
  */
  if (rezultat.ok) {
    await anuntaTransferulPeEmail({
      nume,
      email: emailValid(adresa) ?? undefined,
      telefon: text(camp("telefon"), 40) ?? undefined,
      sumaBani: inBani(suma),
      destinatie,
      data: cand.toISOString(),
      observatii: text(camp("observatii"), 1_000) ?? undefined,
    });
  }

  if (!rezultat.ok) {
    return raspuns(
      rezultat.motiv === "duplicat"
        ? "Transferul ăsta e deja notat — l-am primit o dată. Mulțumim!"
        : "Nu am putut nota transferul. Încearcă din nou în câteva minute.",
      rezultat.motiv === "duplicat" ? 200 : 500,
    );
  }

  return raspuns(
    adresa
      ? "Mulțumim! Am notat transferul și îl căutăm în extrasul de cont. Ți-am trimis pe e-mail ce ne-ai scris, iar când găsim transferul îți scriem din nou."
      : "Mulțumim! Am notat transferul și îl căutăm în extrasul de cont. Dacă ai nevoie de o confirmare scrisă, scrie-ne la " +
          `${EMAIL.contact}.`,
    200,
  );
}
