import { ASOCIATIA, ADRESE, JURIDIC, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { A4, Cursor, MARGINE, MOALE, documentNou } from "./pdf";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

/**
 * Care dintre cele două contracte ale asociației.
 *
 * - `direct` — firma virează ea banii și scade suma din impozitul pe profit.
 * - `declaratia177` — suma o virează **ANAF**, din impozitul firmei, pe baza
 *   Declarației 177 (Ordinul ANAF nr. 1679/2022). E ruta microîntreprinderilor
 *   pe impozit pe venit, adică exact firmele cărora calculatorul de pe
 *   `/directioneaza-20` le spune că n-au de unde scădea o sponsorizare.
 *
 * Nu sunt două formatări ale aceluiași document: diferă cine plătește, deci
 * diferă ce semnează firma și când intră banii.
 */
export type FelContract = "direct" | "declaratia177";

/**
 * Singurul loc în care textul celor două contracte diferă.
 *
 * Restul clauzelor — părțile, obiectul, durata, forța majoră, notificările,
 * continuitatea, încetarea — sunt identice, cuvânt cu cuvânt. Scrise o dată,
 * aici, fiindcă le folosesc și PDF-ul (`contract.ts`) și Word-ul
 * (`contract-word.ts`): două copii s-ar depărta la prima corectură.
 *
 * Textul vine din contractul asociației (`contract sponsorizare 177
 * 2026.pdf`, primit pe 16 octombrie 2026), cu două greșeli de tipar
 * îndreptate — „autoritatea fiscal" → „fiscală" și „se oblige" → „se obligă".
 * Atât: un contract nu e loc de reformulat.
 */
export const CLAUZE_PLATA: Readonly<
  Record<FelContract, { art4: string; obligatiaSponsorului?: string }>
> = {
  direct: {
    art4: "SPONSORUL se obligă să vireze în contul BENEFICIARULUI sau să înmâneze în numerar suma prevăzută la Art. 3.",
  },
  declaratia177: {
    art4: "Plata sumei ce face obiectul prezentului contract se va efectua de către autoritatea fiscală (ANAF), în baza Declarației 177, completată și depusă de SPONSOR, în conformitate cu Ordinul ANAF nr. 1679/2022.",
    obligatiaSponsorului:
      "SPONSORUL se obligă să depună în termen Declarația 177 la ANAF și să anexeze prezentul contract la dosarul fiscal justificativ.",
  },
};

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
  /** Care contract. Lipsă înseamnă cel dintâi, ca înainte de 16 oct. 2026. */
  fel?: FelContract;
};

/** Valoarea câmpului, sau punctele de completat cu pixul. */
function sau(valoare: string, lungime = 1): string {
  const curat = valoare.trim();
  return curat || PUNCTE.slice(0, Math.max(10, lungime));
}

const PORTOCALIU = rgb(0.84, 0.27, 0.08);
const PIERSICA = rgb(0.995, 0.955, 0.925);

export async function contractDeSponsorizare(
  date: DateContract,
): Promise<Uint8Array> {
  const doc = await documentNou();
  // 46 de puncte sus pentru antetul cu siglă, desenat pe fiecare pagină la final.
  const c = new Cursor(doc, undefined, 46);
  const normal = doc.normal;

  c.scrieRarit("CONTRACT DE SPONSORIZARE", {
    marime: 15,
    culoare: PORTOCALIU,
    rarire: 2.2,
    centrat: true,
    spatiuDupa: 2,
  });
  c.scrieBogat(
    [
      { text: "Nr. ", culoare: MOALE },
      { text: sau(date.numar) },
      { text: "   din data de ", culoare: MOALE },
      { text: sau(date.data) },
    ],
    { marime: 9.5, centrat: true, spatiuDupa: 14 },
  );

  const titlu = (text: string) => {
    // Un titlu nu rămâne singur jos pe pagină: trece cu primul rând după el.
    c.rezerva(60);
    c.scrieRarit(text, { marime: 10.5, culoare: PORTOCALIU, rarire: 1.1, spatiuDupa: 0 });
    c.linie();
  };
  const articol = (nr: string, text: string, spatiuDupa = 7) =>
    c.scrieBogat(
      [{ text: `Art. ${nr}. `, gros: true, culoare: PORTOCALIU }, { text }],
      { justificat: true, spatiuDupa, marime: 9.5 },
    );
  const punct = (text: string, spatiuDupa = 3) =>
    c.scrieBogat(
      [{ text: "•  ", gros: true, culoare: PORTOCALIU }, { text }],
      { justificat: true, spatiuDupa, marime: 9.5, indent: 14 },
    );

  titlu("I. PĂRȚILE CONTRACTANTE");
  c.scrieBogat([{ text: "Art. 1. ", gros: true, culoare: PORTOCALIU }, { text: "Între:" }], {
    marime: 9.5,
    spatiuDupa: 5,
  });

  // Firma: rândurile din contractul lor, cu bară portocalie în stânga.
  const eticheta = (text: string, gros = false) => ({ text, culoare: MOALE, gros });
  const susFirma = c.pozitia();
  const randFirma = (bucati: Parameters<Cursor["scrieBogat"]>[0]) =>
    c.scrieBogat(bucati, { marime: 9.5, indent: 14, spatiuDupa: 4 });
  c.rezerva(110);
  c.spatiu(2);
  randFirma([eticheta("Denumire: ", true), { text: sau(date.denumire, 60) }]);
  randFirma([
    eticheta("cu sediul în "),
    { text: sau(date.sediu, 50) },
    eticheta("   jud. "),
    { text: sau(date.judet, 16) },
  ]);
  randFirma([
    eticheta("CUI/CIF "),
    { text: sau(date.cui, 20) },
    eticheta("   Nr. Reg. Com. "),
    { text: sau(date.regCom, 30) },
  ]);
  randFirma([
    eticheta("reprezentată legal prin "),
    { text: sau(date.reprezentant, 30) },
    eticheta("   în calitate de "),
    { text: sau(date.calitate, 24) },
  ]);
  randFirma([
    eticheta("telefon "),
    { text: sau(date.telefon, 24) },
    eticheta("   e-mail "),
    { text: sau(date.email, 30) },
  ]);
  c.baraDeLa(susFirma - 2, PORTOCALIU, 2.5);
  c.spatiu(6);
  c.scrieBogat([{ text: "denumită în continuare " }, { text: "SPONSOR", gros: true }], {
    marime: 9.5,
    spatiuDupa: 6,
  });
  c.scrieBogat([{ text: "și", culoare: MOALE }], { marime: 9.5, centrat: true, spatiuDupa: 8 });

  // Asociația: tabel în chenar, cu fundal, ca în contractul lor.
  const COLOANA = 112;
  const MARIME_TABEL = 8.8;
  const randuriAsociatie: Array<[string, string]> = [
    ["Sediul", `${ADRESE.sediuSocial.strada}, ${ADRESE.sediuSocial.oras}, jud. Suceava`],
    ["CIF", ASOCIATIA.cif],
    ["Registrul special", JURIDIC.registru],
    ["Telefon / e-mail", `${TELEFON_PRINCIPAL.afisat} · ${JURIDIC.email}`],
    ...JURIDIC.conturi.map((cont): [string, string] => [`Cont ${cont.moneda}`, `${cont.iban} – ${cont.banca}`]),
    ["Reprezentant legal", `${JURIDIC.reprezentant}, ${JURIDIC.calitate}`],
  ];
  const latValoare = A4.latime - 2 * MARGINE - COLOANA - 10;
  const linii = (text: string) => {
    let n = 1;
    let rand = "";
    for (const cuv of text.split(" ")) {
      const inc = rand ? `${rand} ${cuv}` : cuv;
      if (normal.widthOfTextAtSize(inc, MARIME_TABEL) > latValoare && rand) {
        n++;
        rand = cuv;
      } else rand = inc;
    }
    return n;
  };
  const inaltimeRand = MARIME_TABEL * 1.45;
  const inaltimeChenar =
    10 + 9.5 * 1.45 + 5 + randuriAsociatie.reduce((s, [, v]) => s + linii(v) * inaltimeRand + 1.5, 0) + 9;
  c.chenar(inaltimeChenar, { fundal: PIERSICA, bara: PORTOCALIU, latimeBara: 2.5 });
  c.spatiu(10);
  c.scrie(ASOCIATIA.denumireLegala, { gros: true, marime: 9.5, spatiuDupa: 5, indent: 14 });
  for (const [et, val] of randuriAsociatie) {
    const y0 = c.pozitia();
    c.scrieBogat([{ text: val }], {
      marime: MARIME_TABEL,
      indent: COLOANA,
      latime: latValoare,
      spatiuDupa: 1.5,
    });
    c.pozitie.pagina.drawText(et, {
      x: MARGINE + 14,
      y: y0 - inaltimeRand,
      size: MARIME_TABEL,
      font: normal,
      color: MOALE,
    });
  }
  c.spatiu(9 + 8);

  c.scrieBogat([{ text: "denumită în continuare " }, { text: "BENEFICIAR", gros: true }], {
    marime: 9.5,
    spatiuDupa: 4,
  });
  c.scrieBogat(
    [{ text: "au convenit încheierea prezentului contract de sponsorizare, în următoarele condiții." }],
    { marime: 9.5, spatiuDupa: 10 },
  );

  titlu("II. OBIECTUL ȘI VALOAREA CONTRACTULUI");
  articol(
    "2",
    "Având în vedere că Asociația Teona Ariana Suceava este o organizație de sine stătătoare, neguvernamentală, apolitică și fără scop patrimonial, cu patrimoniu și scop determinat, cu personalitate juridică conform legii, având ca scop identificarea și ajutorarea copiilor, tinerilor și adulților cu probleme de sănătate și a celor cu dizabilități, a vârstnicilor neajutorați, integrarea acestora în standardele unei societăți civilizate, precum și ajutorarea familiilor nevoiașe și a altor persoane care necesită ajutor, inclusiv prin activități de voluntariat,",
  );
  c.scrieBogat(
    [{ text: "obiectul prezentului contract îl constituie sponsorizarea de către SPONSOR a proiectelor desfășurate de BENEFICIAR." }],
    { marime: 9.5, justificat: true, spatiuDupa: 7 },
  );
  c.scrieBogat(
    [
      { text: "Art. 3. ", gros: true, culoare: PORTOCALIU },
      { text: "Valoarea contractului este de " },
      { text: `${sau(date.valoare, 24)} lei`, gros: true },
    ],
    { marime: 9.5, spatiuDupa: 10 },
  );

  titlu("III. OBLIGAȚIILE PĂRȚILOR");
  const clauze = CLAUZE_PLATA[date.fel ?? "direct"];
  articol("4", clauze.art4);
  articol("5", "BENEFICIARUL se obligă:", 4);
  punct("să aducă la cunoștința publicului larg numele SPONSORULUI, prin diverse modalități;");
  punct(
    "să folosească sumele primite exclusiv în scop caritabil și pentru ajutorarea persoanelor aflate în nevoie.",
    clauze.obligatiaSponsorului ? 5 : 10,
  );
  if (clauze.obligatiaSponsorului) {
    c.scrieBogat([{ text: clauze.obligatiaSponsorului }], {
      marime: 9.5,
      justificat: true,
      indent: 14,
      spatiuDupa: 10,
    });
  }

  titlu("IV. DURATA CONTRACTULUI");
  articol(
    "6",
    "Prezentul contract intră în vigoare la data semnării și este valabil până la îndeplinirea obligațiilor de către ambele părți.",
    10,
  );

  titlu("V. FORȚA MAJORĂ");
  articol(
    "7",
    "Forța majoră exonerează părțile de răspundere în cazul neexecutării parțiale sau totale a obligațiilor asumate prin prezentul contract. Prin forță majoră se înțelege un eveniment independent de voința părților, imprevizibil și insurmontabil, apărut după încheierea contractului, care împiedică părțile să își execute total sau parțial obligațiile asumate.",
    10,
  );

  titlu("VI. NOTIFICĂRI");
  articol(
    "8",
    "Orice notificare adresată de una dintre părți celeilalte se va face prin scrisoare recomandată (prin poștă sau curier) cu confirmare de primire sau prin e-mail cu confirmare de primire.",
    10,
  );

  titlu("VII. CLAUZA DE CONTINUITATE");
  articol(
    "9",
    "Prezentul contract poate fi continuat de succesorii legali ai semnatarilor, cu acordul expres al celeilalte părți.",
    10,
  );

  titlu("VIII. ÎNCETAREA CONTRACTULUI");
  articol(
    "10",
    "Contractul poate înceta numai cu acordul scris al ambelor părți, cu excepția următoarelor situații:",
    4,
  );
  c.scrieBogat([{ text: "a)  ", gros: true, culoare: PORTOCALIU }, { text: "realizarea obiectului contractului devine în mod evident imposibilă;" }], {
    marime: 9.5,
    indent: 20,
    spatiuDupa: 3,
  });
  c.scrieBogat([{ text: "b)  ", gros: true, culoare: PORTOCALIU }, { text: "intervine un caz de forță majoră." }], {
    marime: 9.5,
    indent: 20,
    spatiuDupa: 11,
  });

  c.scrieBogat(
    [
      {
        text: `Prezentul contract s-a încheiat și semnat astăzi, ${sau(date.dataSemnarii, 22)}, în două exemplare originale, cu aceeași valoare juridică, câte unul pentru fiecare parte.`,
      },
    ],
    { marime: 9.5, justificat: true, spatiuDupa: 26 },
  );

  /*
    Semnăturile, una lângă alta, ca în contractul lor tipărit.

    `rezerva` întâi: blocul fie încape întreg pe pagina asta, fie trece tot pe
    următoarea. Despicat între pagini, un contract pare trimis greșit.
  */
  c.rezerva(90);
  const sus = c.pozitia();

  c.scrie("SPONSOR", { gros: true, marime: 10, culoare: PORTOCALIU, spatiuDupa: 14 });
  c.scrie(sau(date.reprezentant, 40), { spatiuDupa: 2 });
  c.scrie("Reprezentant legal", { marime: 9, culoare: MOALE, spatiuDupa: 0 });
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

  await antetSiSubsol(doc);
  return doc.pdf.save();
}

/**
 * Sigla și datele de contact sus, numărul paginii jos — pe fiecare pagină,
 * ca în contractul tipărit al asociației. Sigla e cea scoasă din PDF-ul lor
 * (`continut/sigla-contract.jpg`), aceeași pe care o pune și varianta Word.
 */
async function antetSiSubsol(doc: Awaited<ReturnType<typeof documentNou>>) {
  let sigla = null;
  try {
    sigla = await doc.pdf.embedJpg(readFileSync(join(process.cwd(), "continut", "sigla-contract.jpg")));
  } catch {
    // Fără siglă, contractul tot se poate semna: rămâne numele scris.
  }
  const pagini = doc.pdf.getPages();
  const contact = `${ADRESE.sediuSocial.strada}, ${ADRESE.sediuSocial.oras} · ${TELEFON_PRINCIPAL.afisat} · ${JURIDIC.email}`;
  pagini.forEach((p, i) => {
    const susY = A4.inaltime - 30;
    if (sigla) {
      const lat = 104;
      const inalt = (lat * sigla.height) / sigla.width;
      p.drawImage(sigla, { x: MARGINE - 4, y: susY - inalt, width: lat, height: inalt });
    } else {
      p.drawText(ASOCIATIA.denumire, { x: MARGINE, y: susY - 20, size: 12, font: doc.gros, color: PORTOCALIU });
    }
    const lc = doc.normal.widthOfTextAtSize(contact, 7.5);
    p.drawText(contact, { x: A4.latime - MARGINE - lc, y: susY - 30, size: 7.5, font: doc.normal, color: MOALE });

    p.drawLine({
      start: { x: MARGINE, y: 40 },
      end: { x: A4.latime - MARGINE, y: 40 },
      thickness: 0.5,
      color: rgb(0.85, 0.82, 0.8),
    });
    const stanga = `Contract de sponsorizare · ${ASOCIATIA.denumire}`;
    p.drawText(stanga, { x: MARGINE, y: 28, size: 7.5, font: doc.normal, color: MOALE });
    const dreapta = `Pagina ${i + 1} din ${pagini.length}`;
    const ld = doc.normal.widthOfTextAtSize(dreapta, 7.5);
    p.drawText(dreapta, { x: A4.latime - MARGINE - ld, y: 28, size: 7.5, font: doc.normal, color: MOALE });
  });
}

/** Numele fișierului: se vede în inbox-ul firmei, deci spune ce e. */
export function numeleFisierului(date: DateContract): string {
  const firma = date.denumire
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  // Cele două contracte ajung în același inbox. Dacă s-ar numi la fel, al
  // doilea l-ar suprascrie pe primul în Descărcări, fără să spună nimic.
  const coada = date.fel === "declaratia177" ? "-declaratia-177" : "";
  return `Contract-sponsorizare${coada}-${firma || "firma"}.pdf`;
}
