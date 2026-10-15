import { email as emailValid, esteRobot, limitaDeRata, raspuns, text } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { salveazaCerere } from "@/lib/crm";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";

/**
 * „Am completat formularul 230” — anunțul, nu formularul.
 *
 * **Site-ul nu primește poza și nu ține niciun CNP.** Omul o trimite pe
 * WhatsApp sau pe e-mail, direct la asociație, iar hârtia semnată o aduce sau
 * o trimite prin poștă. Aici se adună doar cine a completat, cum se ia
 * legătura cu el și pe câți ani a bifat.
 *
 * **De ce nu primim și poza, deși am putea.** Am construit și varianta cu
 * fișier urcat în depozit privat. Dar ea nu înlocuiește WhatsApp-ul, îl
 * dublează: oamenii trimit poza pe WhatsApp oricum, iar o a doua copie pe
 * site înseamnă încă un loc în care stă același CNP, nu unul mai puțin. Codul
 * de urcare a rămas în depozit, oprit, dacă vreodată se schimbă socoteala.
 *
 * Ce rămâne aici sunt date obișnuite de contact — ca la orice formular de pe
 * site, nu date fiscale.
 *
 * **Se scrie în CRM, nu într-un tabel al lui.** Prima versiune avea tabelul ei
 * de formulare, pe lângă `cereri`, care are deja categoria „Redirecționare
 * 3,5%" și în care scrie formularul de pași de pe aceeași pagină. Două liste
 * cu aceiași oameni înseamnă două căutări, două exporturi și două locuri în
 * care cineva e marcat „rezolvat" doar într-unul.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "formular-230",
    maxim: 6,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  if (esteRobot(Object.fromEntries(formular.entries()))) {
    return raspuns("Mulțumim! Am notat.", 200);
  }

  const nume = text(camp("nume"), 120);
  if (!nume || nume.length < 2) {
    return raspuns("Scrie-ți numele, ca să știm al cui e formularul.", 400);
  }
  if (!emailValid(camp("email"))) {
    return raspuns("Introdu o adresă de e-mail validă.", 400);
  }
  if (formular.get("acord") !== "da") {
    return raspuns("Bifează acordul pentru a putea trimite.", 400);
  }

  /*
    Pe câți ani a bifat. Formularul 230 are opțiunea de distribuire pe doi
    ani; cine a bifat-o nu mai trebuie căutat la anul. Dacă n-a răspuns,
    rămâne gol — nu se presupune unul.
  */
  const aniScris = camp("ani");
  const ani = aniScris === "2" ? 2 : aniScris === "1" ? 1 : null;

  if (!areBazaDeDate()) {
    return raspuns(
      `Nu putem nota asta acum. Scrie-ne pe ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat}.`,
      503,
    );
  }

  await salveazaCerere({
    fel: "redirectionare",
    nume,
    email: camp("email"),
    telefon: camp("telefon") || undefined,
    detalii: {
      "A completat formularul": "da",
      ...(ani ? { "Pe câți ani": ani === 2 ? "2 ani" : "1 an" } : {}),
    },
  });

  return raspuns(
    "Am notat, mulțumim! Mai rămâne un lucru: trimite-ne poza formularului pe WhatsApp și hârtia semnată prin poștă sau adu-o la Casa Teona. Fără hârtie, ANAF nu poate înregistra redirecționarea.",
    200,
  );
}
