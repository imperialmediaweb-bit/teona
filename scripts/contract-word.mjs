/**
 * Contractul de sponsorizare, ca document Word de completat.
 *
 * Pe site, la „Documente de descărcat”, firma găsea până acum un card care
 * spunea că documentul „se pregătește”. Asociația are contractul ei
 * (`continut/contract-sponsorizare-2026.pdf`), dar un PDF nu se completează
 * decât cu pixul, după ce îl tipărești. Firmele vor un `.docx`: îl deschid,
 * scriu denumirea și suma, îl trimit la semnat.
 *
 * **Textul e al asociației, cuvânt cu cuvânt.** Clauzele sunt transcrise din
 * contractul lor, la fel ca în generatorul de PDF (`src/lib/contract.ts`). Un
 * contract nu e un loc unde se îmbunătățește formularea.
 *
 * **Ce se schimbă față de hârtia lor e doar așezarea.** Pe foaia tipărită,
 * patru câmpuri stau pe același rând, despărțite de puncte. Într-un document
 * care se completează la tastatură asta e o capcană: scrii în primul câmp și
 * se mută tot rândul. Aici fiecare câmp are rândul lui, cu linia punctată
 * dusă până la marginea paginii.
 *
 * Rularea (cere pachetul `docx`, care nu e dependență a site-ului — fișierul
 * ieșit se pune în depozit, deci construirea nu depinde de el):
 *
 *     node scripts/contract-word.mjs
 *
 * Iese `public/documente/contract-de-sponsorizare.docx`.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let docx;
try {
  docx = require("docx");
} catch {
  console.error(
    "Lipsește pachetul `docx`. Instalează-l o dată, oriunde:\n" +
      "    npm install --no-save docx\n" +
      "Documentul ieșit se pune în depozit, deci site-ul nu depinde de el.",
  );
  process.exit(2);
}

const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = docx;

/* Datele verificate ale asociației. Nu se scriu de două ori: aici și în
   `src/date/asociatie.ts`, și nu se inventează niciuna. */
const ASOCIATIA = {
  denumire: "ASOCIAȚIA TEONA ARIANA SUCEAVA",
  sediu: "str. Nicolae Milescu nr. 7, Suceava, jud. Suceava",
  cif: "43533953",
  registru: "nr. 1/14.01.2021 (registrul persoanelor juridice)",
  contact: "0754 510 167 · ata.suceava@gmail.com",
  conturi: [
    "RO57 BACX 0000 0021 0940 3001 – UniCredit Bank, Suc. Curtea Domnească Suceava",
    "RO30 BACX 0000 0021 0940 3002 – UniCredit Bank, Suc. Curtea Domnească Suceava",
    "RO16 RNCB 0234 1852 3366 0001 – BCR Suceava",
  ],
  reprezentant: "Corneliu Cristea Costiuc, Președinte",
};

const NEGRU = "1F1F1F";
const MOALE = "5A5A5A";
const PORTOCALIU = "D64515";

/*
  Linia de completat e scrisă cu puncte adevărate, nu cu un tab cu „leader”.

  Punctele de tabulare le desenează programul care deschide documentul, iar
  Word și LibreOffice nu le desenează la fel: la prima probă, convertit cu
  LibreOffice, rândul „Denumire:” a ieșit cu linia goală de tot. Punctele
  scrise ca text arată la fel oriunde se deschide fișierul — și exact ca pe
  hârtia tipărită a asociației.
*/
/*
  Câte puncte intră pe un rând.

  Fontul e proporțional: un punct e de vreo două ori mai îngust decât o
  literă. Numărate ca simple caractere, rândurile ieșeau zimțate — „Denumire:”
  se termina cu cinci centimetri înaintea marginii, „Reprezentată legal prin:”
  aproape de ea. Numerele de mai jos sunt lățimile măsurate pe documentul
  convertit, în puncte: o literă face cât două puncte și ceva.
*/
const PUNCTE_PE_RAND = 178;
const O_LITERA = 2;

/** Un rând de completat: eticheta, apoi puncte până la marginea paginii. */
function campDeCompletat(eticheta) {
  const cate = Math.round(PUNCTE_PE_RAND - O_LITERA * eticheta.length);
  const puncte = ".".repeat(Math.max(12, cate));
  return new Paragraph({
    spacing: { after: 140 },
    children: [
      new TextRun({ text: eticheta, size: 21 }),
      new TextRun({ text: puncte, size: 21, color: MOALE }),
    ],
  });
}

function text(continut, optiuni = {}) {
  const { gros = false, marime = 21, culoare = NEGRU, dupa = 140, ...rest } = optiuni;
  return new Paragraph({
    spacing: { after: dupa, line: 276 },
    children: [
      new TextRun({ text: continut, bold: gros, size: marime, color: culoare }),
    ],
    ...rest,
  });
}

/** Titlu de capitol: „I. PĂRȚILE CONTRACTANTE”. */
function capitol(continut) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({ text: continut, bold: true, size: 23, color: PORTOCALIU }),
    ],
  });
}

/** Datele asociației, pe două coloane, fără chenare care să le încarce. */
function tabelulBeneficiarului() {
  const randuri = [
    ["Sediul", ASOCIATIA.sediu],
    ["CIF", ASOCIATIA.cif],
    ["Registrul special", ASOCIATIA.registru],
    ["Telefon / e-mail", ASOCIATIA.contact],
    ["Cont LEI", ASOCIATIA.conturi[0]],
    ["Cont EURO", ASOCIATIA.conturi[1]],
    ["Cont LEI", ASOCIATIA.conturi[2]],
    ["Reprezentant legal", ASOCIATIA.reprezentant],
  ];

  const fara = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const subtire = { style: BorderStyle.SINGLE, size: 2, color: "DCDCDC" };

  return new Table({
    columnWidths: [2600, 6600],
    width: { size: 9200, type: WidthType.DXA },
    borders: { top: fara, bottom: fara, left: fara, right: fara, insideVertical: fara, insideHorizontal: subtire },
    rows: randuri.map(
      ([eticheta, valoare]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2600, type: WidthType.DXA },
              margins: { top: 60, bottom: 60, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: eticheta, size: 20, color: MOALE }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 6600, type: WidthType.DXA },
              margins: { top: 60, bottom: 60 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: valoare, size: 20 })],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

/** Cele două semnături, una lângă alta, ca pe hârtia lor. */
function tabelulSemnaturilor() {
  const fara = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const celula = (copii) =>
    new TableCell({
      width: { size: 4600, type: WidthType.DXA },
      margins: { top: 120, bottom: 120, right: 200 },
      children: copii,
    });

  const linie = () =>
    new Paragraph({
      spacing: { before: 420, after: 60 },
      // Jumătate de rând: linia stă într-o celulă de tabel, nu pe toată pagina.
      children: [new TextRun({ text: ".".repeat(80), size: 21, color: MOALE })],
    });

  return new Table({
    columnWidths: [4600, 4600],
    width: { size: 9200, type: WidthType.DXA },
    borders: { top: fara, bottom: fara, left: fara, right: fara, insideVertical: fara, insideHorizontal: fara },
    rows: [
      new TableRow({
        children: [
          celula([
            text("SPONSOR", { gros: true, marime: 21, dupa: 0 }),
            linie(),
            text("Reprezentant legal", { marime: 19, culoare: MOALE, dupa: 0 }),
          ]),
          celula([
            text("BENEFICIAR", { gros: true, marime: 21, dupa: 0 }),
            linie(),
            text("Asociația Teona Ariana Suceava", { marime: 19, dupa: 0 }),
            text(`Președinte, ${ASOCIATIA.reprezentant.split(",")[0]}`, {
              marime: 19,
              culoare: MOALE,
              dupa: 0,
            }),
          ]),
        ],
      }),
    ],
  });
}

const document = new Document({
  creator: "Asociația Teona Ariana Suceava",
  /*
    Fără asta, Word deschide documentul cu fontul lui implicit, care la
    conversie a ieșit un serif de secol trecut. Calibri e pe orice calculator
    pe care se deschide un contract, și are diacriticele românești întregi.
  */
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 21, color: NEGRU } },
    },
  },
  title: "Contract de sponsorizare",
  description: "Model de contract de sponsorizare, de completat de firma sponsor.",
  numbering: {
    config: [
      {
        reference: "obligatii",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 260 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1130, bottom: 1130, left: 1130, right: 1130 } },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Contract de sponsorizare · Asociația Teona Ariana Suceava · pagina ",
                  size: 16,
                  color: MOALE,
                }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MOALE }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ─── Antetul asociației ──────────────────────────────────────────
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: ASOCIATIA.denumire, bold: true, size: 26 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 320 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "E6E6E6", space: 8 },
          },
          children: [
            new TextRun({
              text: `${ASOCIATIA.sediu} · ${ASOCIATIA.contact}`,
              size: 17,
              color: MOALE,
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "CONTRACT DE SPONSORIZARE",
              bold: true,
              size: 32,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: "Nr. …………………… din data de ……………………………",
              size: 21,
              color: MOALE,
            }),
          ],
        }),

        // ─── I. Părțile ──────────────────────────────────────────────────
        capitol("I. PĂRȚILE CONTRACTANTE"),
        text("Art. 1. Între:"),
        campDeCompletat("Denumire: "),
        campDeCompletat("Cu sediul în: "),
        campDeCompletat("Județul: "),
        campDeCompletat("CUI/CIF: "),
        campDeCompletat("Nr. Reg. Com.: "),
        campDeCompletat("Reprezentată legal prin: "),
        campDeCompletat("În calitate de: "),
        campDeCompletat("Telefon: "),
        campDeCompletat("E-mail: "),
        text("denumită în continuare SPONSOR", { gros: true, dupa: 200 }),
        text("și", { dupa: 160 }),
        text(ASOCIATIA.denumire, { gros: true, dupa: 120 }),
        tabelulBeneficiarului(),
        new Paragraph({
          spacing: { before: 200, after: 140 },
          children: [
            new TextRun({ text: "denumită în continuare BENEFICIAR", bold: true, size: 21 }),
          ],
        }),
        text(
          "au convenit încheierea prezentului contract de sponsorizare, în următoarele condiții.",
        ),

        // ─── II. Obiectul ────────────────────────────────────────────────
        capitol("II. OBIECTUL ȘI VALOAREA CONTRACTULUI"),
        text(
          "Art. 2. Având în vedere că Asociația Teona Ariana Suceava este o organizație de sine stătătoare, neguvernamentală, apolitică și fără scop patrimonial, cu patrimoniu și scop determinat, cu personalitate juridică conform legii, având ca scop identificarea și ajutorarea copiilor, tinerilor și adulților cu probleme de sănătate și a celor cu dizabilități, a vârstnicilor neajutorați, integrarea acestora în standardele unei societăți civilizate, precum și ajutorarea familiilor nevoiașe și a altor persoane care necesită ajutor, inclusiv prin activități de voluntariat, obiectul prezentului contract îl constituie sponsorizarea de către SPONSOR a proiectelor desfășurate de BENEFICIAR.",
        ),
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: "Art. 3. Valoarea contractului este de ", size: 21 }),
            new TextRun({ text: ".".repeat(96), size: 21, color: MOALE }),
            new TextRun({ text: " lei", size: 21 }),
          ],
        }),

        // ─── III. Obligațiile ────────────────────────────────────────────
        capitol("III. OBLIGAȚIILE PĂRȚILOR"),
        text(
          "Art. 4. SPONSORUL se obligă să vireze în contul BENEFICIARULUI sau să înmâneze în numerar suma prevăzută la Art. 3.",
        ),
        text("Art. 5. BENEFICIARUL se obligă:", { dupa: 80 }),
        new Paragraph({
          numbering: { reference: "obligatii", level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "să aducă la cunoștința publicului larg numele SPONSORULUI, prin diverse modalități;",
              size: 21,
            }),
          ],
        }),
        new Paragraph({
          numbering: { reference: "obligatii", level: 0 },
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: "să folosească sumele primite exclusiv în scop caritabil și pentru ajutorarea persoanelor aflate în nevoie.",
              size: 21,
            }),
          ],
        }),

        // ─── IV–VIII ─────────────────────────────────────────────────────
        capitol("IV. DURATA CONTRACTULUI"),
        text(
          "Art. 6. Prezentul contract intră în vigoare la data semnării și este valabil până la îndeplinirea obligațiilor de către ambele părți.",
        ),

        capitol("V. FORȚA MAJORĂ"),
        text(
          "Art. 7. Forța majoră exonerează părțile de răspundere în cazul neexecutării parțiale sau totale a obligațiilor asumate prin prezentul contract. Prin forță majoră se înțelege un eveniment independent de voința părților, imprevizibil și insurmontabil, apărut după încheierea contractului, care împiedică părțile să își execute total sau parțial obligațiile asumate.",
        ),

        capitol("VI. NOTIFICĂRI"),
        text(
          "Art. 8. Orice notificare adresată de una dintre părți celeilalte se va face prin scrisoare recomandată (prin poștă sau curier) cu confirmare de primire sau prin e-mail cu confirmare de primire.",
        ),

        capitol("VII. CLAUZA DE CONTINUITATE"),
        text(
          "Art. 9. Prezentul contract poate fi continuat de succesorii legali ai semnatarilor, cu acordul expres al celeilalte părți.",
        ),

        capitol("VIII. ÎNCETAREA CONTRACTULUI"),
        text(
          "Art. 10. Contractul poate înceta numai cu acordul scris al ambelor părți, cu excepția următoarelor situații:",
          { dupa: 60 },
        ),
        text("a) realizarea obiectului contractului devine în mod evident imposibilă;", {
          dupa: 60,
          indent: { left: 360 },
        }),
        text("b) intervine un caz de forță majoră.", {
          dupa: 200,
          indent: { left: 360 },
        }),
        text(
          "Prezentul contract s-a încheiat și semnat astăzi, …………………………, în două exemplare originale, cu aceeași valoare juridică, câte unul pentru fiecare parte.",
          { dupa: 240 },
        ),

        tabelulSemnaturilor(),
      ],
    },
  ],
});

const unde = "public/documente/contract-de-sponsorizare.docx";
await mkdir("public/documente", { recursive: true });
await writeFile(unde, await Packer.toBuffer(document));
console.log(`Scris: ${unde}`);
