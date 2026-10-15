import { ASOCIATIA, ADRESE, JURIDIC, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { Cursor, MOALE, documentNou } from "./pdf";
import { rgb } from "pdf-lib";

/**
 * Contractul de sponsorizare, scris ca PDF.
 *
 * **De ce îl generăm.** O firmă care trimite formularul primește un răspuns,
 * apoi cineva deschide un document Word, completează șapte câmpuri de mână și
 * îl trimite înapoi. Între „vreau să sponsorizez” și contractul în inbox
 * treceau zile. Acum, din fișa firmei, un buton.
 *
 * **Textul e cel al asociației, nu unul scris de mine.** Clauzele sunt
 * transcrise din contractul lor (`continut/contract-sponsorizare-2026.pdf`,
 * primit pe 14 octombrie 2026), cuvânt cu cuvânt. Un contract nu e un loc
 * unde se îmbunătățește formularea: dacă vor altceva, schimbă ei textul și îl
 * schimbăm aici, conștient.
 *
 * **Ce rămâne gol rămâne gol.** Un câmp necompletat se scrie cu puncte de
 * suspensie, exact ca în formularul lor tipărit, și se completează cu pixul.
 * Nu se inventează un sediu ca să arate documentul plin.
 */

const PUNCTE = "…………………………………";

export type DateContract = {
  numar: string;
  data: string;
  denumire: string;
  sediu: string;
  judet: string;
  cui: string;
  regCom: string;
  reprezentant: string;
  calitate: string;
  telefon: string;
  email: string;
  /** Valoarea scrisă de om, în lei: „5.000” sau „5000,50”. */
  valoare: string;
  dataSemnarii: string;
  /**
   * Semnătura desenată pe ecran, ca PNG.
   *
   * Lipsește când contractul se scoate din panou ca să fie semnat cu pixul;
   * există când firma l-a semnat online, pe site.
   */
  semnatura?: Uint8Array;
  /**
   * Urma semnăturii electronice: când și de unde a fost aplicată.
   *
   * Scrie în document, sub semnătură, nu doar în baza noastră de date. O
   * semnătură desenată are putere de probă doar împreună cu împrejurările în
   * care a fost dată; dacă acelea stau numai la noi, firma le poate contesta
   * fără să aibă ce contrazice.
   */
  urmaSemnaturii?: string;
};

/** Valoarea câmpului, sau punctele de completat cu pixul. */
function sau(valoare: string, lungime = 1): string {
  const curat = valoare.trim();
  return curat || PUNCTE.slice(0, Math.max(10, lungime));
}

const PORTOCALIU = rgb(0.84, 0.27, 0.08);

export async function contractDeSponsorizare(
  date: DateContract,
): Promise<Uint8Array> {
  const doc = await documentNou();
  const c = new Cursor(doc);

  c.scrie(ASOCIATIA.denumire, { gros: true, marime: 13, spatiuDupa: 2 });
  c.scrie(
    `${ADRESE.sediuSocial.strada}, ${ADRESE.sediuSocial.oras} · ${TELEFON_PRINCIPAL.afisat} · ${JURIDIC.email}`,
    { marime: 8.5, culoare: MOALE, spatiuDupa: 14 },
  );

  c.scrie("CONTRACT DE SPONSORIZARE", {
    gros: true,
    marime: 15,
    culoare: PORTOCALIU,
    spatiuDupa: 4,
  });
  c.scrie(`Nr. ${sau(date.numar)}   din data de ${sau(date.data)}`, {
    marime: 10,
    culoare: MOALE,
    spatiuDupa: 13,
  });

  c.scrie("I. PĂRȚILE CONTRACTANTE", {
    gros: true,
    marime: 11,
    culoare: PORTOCALIU,
  });
  c.linie();
  c.scrie("Art. 1. Între:", { gros: true, spatiuDupa: 8 });

  const rand = (eticheta: string, valoare: string) =>
    c.scrie(`${eticheta}  ${sau(valoare, 60)}`, { spatiuDupa: 5, indent: 14 });

  rand("Denumire:", date.denumire);
  rand("cu sediul în", `${date.sediu}${date.judet ? `, jud. ${date.judet}` : ""}`);
  rand("CUI/CIF", `${date.cui}     Nr. Reg. Com.  ${sau(date.regCom, 30)}`);
  rand(
    "reprezentată legal prin",
    `${date.reprezentant}     în calitate de  ${sau(date.calitate, 24)}`,
  );
  rand("telefon", `${date.telefon}     e-mail  ${sau(date.email, 30)}`);

  c.spatiu(4);
  c.scrie("denumită în continuare SPONSOR", { spatiuDupa: 8 });
  c.scrie("și", { marime: 10, culoare: MOALE, spatiuDupa: 8, indent: 230 });

  c.scrie(ASOCIATIA.denumireLegala, { gros: true, spatiuDupa: 7 });
  const rand2 = (eticheta: string, valoare: string) =>
    c.scrie(`${eticheta.padEnd(18, " ")} ${valoare}`, {
      marime: 9.5,
      spatiuDupa: 3,
      indent: 14,
    });
  rand2(
    "Sediul",
    `${ADRESE.sediuSocial.strada}, ${ADRESE.sediuSocial.oras}, jud. Suceava`,
  );
  rand2("CIF", ASOCIATIA.cif);
  rand2("Registrul special", JURIDIC.registru);
  rand2("Telefon / e-mail", `${TELEFON_PRINCIPAL.afisat} · ${JURIDIC.email}`);
  for (const cont of JURIDIC.conturi) {
    rand2(`Cont ${cont.moneda}`, `${cont.iban} – ${cont.banca}`);
  }
  rand2("Reprezentant legal", `${JURIDIC.reprezentant}, ${JURIDIC.calitate}`);

  c.spatiu(6);
  c.scrie("denumită în continuare BENEFICIAR", { spatiuDupa: 6 });
  c.scrie(
    "au convenit încheierea prezentului contract de sponsorizare, în următoarele condiții.",
    { spatiuDupa: 9 },
  );

  c.scrie("II. OBIECTUL ȘI VALOAREA CONTRACTULUI", {
    gros: true,
    marime: 11,
    culoare: PORTOCALIU,
  });
  c.linie();
  c.scrie(
    "Art. 2. Având în vedere că Asociația Teona Ariana Suceava este o organizație de sine stătătoare, neguvernamentală, apolitică și fără scop patrimonial, cu patrimoniu și scop determinat, cu personalitate juridică conform legii, având ca scop identificarea și ajutorarea copiilor, tinerilor și adulților cu probleme de sănătate și a celor cu dizabilități, a vârstnicilor neajutorați, integrarea acestora în standardele unei societăți civilizate, precum și ajutorarea familiilor nevoiașe și a altor persoane care necesită ajutor, inclusiv prin activități de voluntariat,",
    { spatiuDupa: 8 },
  );
  c.scrie(
    "obiectul prezentului contract îl constituie sponsorizarea de către SPONSOR a proiectelor desfășurate de BENEFICIAR.",
    { spatiuDupa: 8 },
  );
  c.scrie(`Art. 3. Valoarea contractului este de ${sau(date.valoare, 24)} lei`, {
    spatiuDupa: 9,
  });

  c.scrie("III. OBLIGAȚIILE PĂRȚILOR", {
    gros: true,
    marime: 11,
    culoare: PORTOCALIU,
  });
  c.linie();
  c.scrie(
    "Art. 4. SPONSORUL se obligă să vireze în contul BENEFICIARULUI sau să înmâneze în numerar suma prevăzută la Art. 3.",
    { spatiuDupa: 8 },
  );
  c.scrie("Art. 5. BENEFICIARUL se obligă:", { spatiuDupa: 6 });
  c.scrie(
    "•  să aducă la cunoștința publicului larg numele SPONSORULUI, prin diverse modalități;",
    { spatiuDupa: 4, indent: 14 },
  );
  c.scrie(
    "•  să folosească sumele primite exclusiv în scop caritabil și pentru ajutorarea persoanelor aflate în nevoie.",
    { spatiuDupa: 9, indent: 14 },
  );

  c.scrie("IV. DURATA CONTRACTULUI", {
    gros: true,
    marime: 11,
    culoare: PORTOCALIU,
  });
  c.linie();
  c.scrie(
    "Art. 6. Prezentul contract intră în vigoare la data semnării și este valabil până la îndeplinirea obligațiilor de către ambele părți.",
    { spatiuDupa: 9 },
  );

  c.scrie("V. FORȚA MAJORĂ", { gros: true, marime: 11, culoare: PORTOCALIU });
  c.linie();
  c.scrie(
    "Art. 7. Forța majoră exonerează părțile de răspundere în cazul neexecutării parțiale sau totale a obligațiilor asumate prin prezentul contract. Prin forță majoră se înțelege un eveniment independent de voința părților, imprevizibil și insurmontabil, apărut după încheierea contractului, care împiedică părțile să își execute total sau parțial obligațiile asumate.",
    { spatiuDupa: 9 },
  );

  c.scrie("VI. NOTIFICĂRI", { gros: true, marime: 11, culoare: PORTOCALIU });
  c.linie();
  c.scrie(
    "Art. 8. Orice notificare adresată de una dintre părți celeilalte se va face prin scrisoare recomandată (prin poștă sau curier) cu confirmare de primire sau prin e-mail cu confirmare de primire.",
    { spatiuDupa: 9 },
  );

  c.scrie("VII. CLAUZA DE CONTINUITATE", {
    gros: true,
    marime: 11,
    culoare: PORTOCALIU,
  });
  c.linie();
  c.scrie(
    "Art. 9. Prezentul contract poate fi continuat de succesorii legali ai semnatarilor, cu acordul expres al celeilalte părți.",
    { spatiuDupa: 9 },
  );

  c.scrie("VIII. ÎNCETAREA CONTRACTULUI", {
    gros: true,
    marime: 11,
    culoare: PORTOCALIU,
  });
  c.linie();
  c.scrie(
    "Art. 10. Contractul poate înceta numai cu acordul scris al ambelor părți, cu excepția următoarelor situații:",
    { spatiuDupa: 6 },
  );
  c.scrie("a)  realizarea obiectului contractului devine în mod evident imposibilă;", {
    spatiuDupa: 4,
    indent: 20,
  });
  c.scrie("b)  intervine un caz de forță majoră.", { spatiuDupa: 11, indent: 20 });

  c.scrie(
    `Prezentul contract s-a încheiat și semnat astăzi, ${sau(date.dataSemnarii, 22)}, în două exemplare originale, cu aceeași valoare juridică, câte unul pentru fiecare parte.`,
    { spatiuDupa: 26 },
  );

  /*
    Semnăturile, una lângă alta, ca în contractul lor tipărit.

    `rezerva` întâi: blocul fie încape întreg pe pagina asta, fie trece tot pe
    următoarea. Despicat între pagini, un contract pare trimis greșit.
  */
  c.rezerva(date.semnatura ? 160 : 90);
  const sus = c.pozitia();

  c.scrie("SPONSOR", { gros: true, marime: 10, culoare: PORTOCALIU, spatiuDupa: 14 });
  if (date.semnatura) {
    await c.imagine(date.semnatura, { latime: 150, inaltime: 52 });
  }
  c.scrie(sau(date.reprezentant, 40), { spatiuDupa: 2 });
  c.scrie("Reprezentant legal", { marime: 9, culoare: MOALE, spatiuDupa: 0 });
  if (date.urmaSemnaturii) {
    c.scrie(date.urmaSemnaturii, { marime: 7, culoare: MOALE, spatiuDupa: 0 });
  }
  const dupaSponsor = c.pozitia();

  const DREAPTA = 250;
  c.laPozitia(sus);
  c.scrie("BENEFICIAR", {
    gros: true,
    marime: 10,
    culoare: PORTOCALIU,
    spatiuDupa: 14,
    indent: DREAPTA,
  });
  c.scrie(ASOCIATIA.denumire, { gros: true, spatiuDupa: 2, indent: DREAPTA });
  c.scrie(`${JURIDIC.calitate}, ${JURIDIC.reprezentant}`, {
    marime: 9,
    culoare: MOALE,
    spatiuDupa: 0,
    indent: DREAPTA,
  });

  c.laPozitia(Math.min(dupaSponsor, c.pozitia()));

  return doc.pdf.save();
}

/** Numele fișierului: se vede în inbox-ul firmei, deci spune ce e. */
export function numeleFisierului(date: DateContract): string {
  const firma = date.denumire
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `Contract-sponsorizare-${firma || "firma"}.pdf`;
}
