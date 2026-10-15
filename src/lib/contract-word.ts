import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { DateContract } from "./contract";

/**
 * Contractul de sponsorizare, ca document Word.
 *
 * Două întrebuințări, din același cod:
 *
 * - **modelul gol**, de descărcat de pe pagina pentru firme și completat de
 *   mână;
 * - **contractul completat** cu datele firmei, pe care ea îl semnează cu
 *   certificatul calificat sau îl tipărește și îl semnează cu pixul.
 *
 * Modelul gol se scria până acum cu un script, iar fișierul ieșit stătea în
 * depozit. A trebuit mutat aici când a apărut varianta completată: două
 * generatoare cu aceeași așezare se depărtează unul de altul la prima
 * schimbare, iar firma ar fi primit un model gol care nu seamănă cu
 * contractul completat.
 *
 * **Documentul e copia hârtiei lor, nu o variantă a mea.** Sigla, antetul cu
 * adresa, portocaliul titlurilor (#E17127, luat cu pipeta din PDF-ul lor),
 * caseta bej a beneficiarului cu linia portocalie pe stânga, câmpurile pe
 * aceleași rânduri, subsolul cu numărul paginii. Clauzele sunt transcrise
 * cuvânt cu cuvânt, la fel ca în generatorul de PDF (`src/lib/contract.ts`).
 */

/* ── Culorile hârtiei lor ──────────────────────────────────────────────── */
const PORTOCALIU = "E17127"; // luat cu pipeta din PDF-ul asociației
const NEGRU = "262626";
const MOALE = "6E6E6E";
const BEJ = "FEF1E8";
const LINIE = "E2E2E2";

/* ── Datele verificate ale asociației ──────────────────────────────────── */
const ASOCIATIA = {
  denumire: "ASOCIAȚIA TEONA ARIANA SUCEAVA",
  antet:
    "str. Nicolae Milescu nr. 7, Suceava  ·  0754 510 167  ·  ata.suceava@gmail.com",
  randuri: [
    ["Sediul", "str. Nicolae Milescu nr. 7, Suceava, jud. Suceava", ""],
    ["CIF", "43533953", ""],
    ["Registrul special", "nr. 1/14.01.2021 (registrul persoanelor juridice)", ""],
    ["Telefon / e-mail", "0754 510 167  ·  ata.suceava@gmail.com", ""],
    [
      "Cont LEI",
      "RO57 BACX 0000 0021 0940 3001",
      " – UniCredit Bank, Suc. Curtea Domnească Suceava",
    ],
    [
      "Cont EURO",
      "RO30 BACX 0000 0021 0940 3002",
      " – UniCredit Bank, Suc. Curtea Domnească Suceava",
    ],
    ["Cont LEI", "RO16 RNCB 0234 1852 3366 0001", " – BCR Suceava"],
    ["Reprezentant legal", "Corneliu Cristea Costiuc, Președinte", ""],
  ] as const,
};

const CORP = 21; // 10,5 pt, în jumătăți de punct

/*
  Câte puncte intră pe un rând.

  Fontul e proporțional: un punct e de vreo două ori mai îngust decât o
  literă. Numărate ca simple caractere, rândurile ies zimțate. Numerele astea
  sunt măsurate pe documentul convertit în PDF: un rând întreg ține 178 de
  puncte, iar fiecare literă mănâncă două. Punctele de tabulare cu „leader”
  ar fi fost mai curate, dar Word și LibreOffice le desenează altfel — la
  prima probă rândurile au ieșit goale de tot.
*/
const PUNCTE_PE_RAND = 178;
const O_LITERA = 2;
const INDENTARE = 7; // puncte mâncate de retragerea blocului de câmpuri

const FARA = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

type Parte = {
  eticheta: string;
  /** Ce parte din punctele rămase pe rând îi revine. */
  cota: number;
  /** Valoarea completată. Gol = rândul rămâne de completat cu pixul. */
  valoare?: string;
  gros?: boolean;
};

/**
 * Un rând cu unul sau mai multe câmpuri.
 *
 * Valoarea completată se scrie îngroșată, iar punctele umplu doar ce rămâne:
 * rândul se termină tot la marginea paginii, fie că e gol, fie că e plin.
 */
function rand(parti: Parte[]): Paragraph {
  const semne = parti.reduce(
    (t, p) => t + p.eticheta.length + (p.valoare?.length ?? 0),
    0,
  );
  const buget = Math.max(
    8 * parti.length,
    PUNCTE_PE_RAND - INDENTARE - Math.round(O_LITERA * semne),
  );
  const totalCote = parti.reduce((t, p) => t + p.cota, 0);

  const copii: TextRun[] = [];
  for (const parte of parti) {
    copii.push(
      new TextRun({
        text: parte.eticheta,
        size: CORP,
        bold: Boolean(parte.gros),
      }),
    );
    if (parte.valoare) {
      copii.push(
        new TextRun({ text: parte.valoare, size: CORP, bold: true }),
      );
    }
    copii.push(
      new TextRun({
        text: ".".repeat(Math.round((buget * parte.cota) / totalCote)),
        size: CORP,
        color: MOALE,
      }),
    );
  }

  return new Paragraph({
    indent: { left: 340 },
    spacing: { after: 110, line: 264 },
    children: copii,
  });
}

function text(
  continut: string,
  optiuni: {
    gros?: boolean;
    culoare?: string;
    dupa?: number;
    aliniat?: boolean;
  } = {},
): Paragraph {
  const { gros = false, culoare = NEGRU, dupa = 140, aliniat = true } = optiuni;
  return new Paragraph({
    alignment: aliniat ? AlignmentType.JUSTIFIED : undefined,
    spacing: { after: dupa, line: 264 },
    children: [
      new TextRun({ text: continut, bold: gros, size: CORP, color: culoare }),
    ],
  });
}

/** „Art. 4.” portocaliu îngroșat, apoi textul articolului. */
function articol(numar: number, continut: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 264 },
    children: [
      new TextRun({
        text: `Art. ${numar}. `,
        bold: true,
        size: CORP,
        color: PORTOCALIU,
      }),
      new TextRun({ text: continut, size: CORP, color: NEGRU }),
    ],
  });
}

/** Titlu de capitol: portocaliu, cu literele răsfirate, ca la ei. */
function capitol(continut: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 150 },
    children: [
      new TextRun({
        text: continut,
        bold: true,
        size: 21,
        color: PORTOCALIU,
        characterSpacing: 24,
      }),
    ],
  });
}

/** Caseta beneficiarului: fond bej, linie portocalie groasă pe stânga. */
function casetaBeneficiarului(): Table {
  const umbra = { type: ShadingType.CLEAR, color: "auto", fill: BEJ };
  const celula = (
    latime: number,
    copii: Paragraph[],
    extra: Record<string, unknown> = {},
  ) =>
    new TableCell({
      width: { size: latime, type: WidthType.DXA },
      shading: umbra,
      margins: { top: 40, bottom: 40, left: 180, right: 120 },
      children: copii,
      ...extra,
    });

  return new Table({
    columnWidths: [2200, 6900],
    width: { size: 9100, type: WidthType.DXA },
    borders: {
      top: FARA,
      bottom: FARA,
      right: FARA,
      left: { style: BorderStyle.SINGLE, size: 18, color: PORTOCALIU },
      insideVertical: FARA,
      insideHorizontal: FARA,
    },
    rows: [
      new TableRow({
        children: [
          celula(
            9100,
            [
              new Paragraph({
                spacing: { before: 100, after: 80 },
                children: [
                  new TextRun({
                    text: ASOCIATIA.denumire,
                    bold: true,
                    size: CORP,
                    color: NEGRU,
                  }),
                ],
              }),
            ],
            { columnSpan: 2 },
          ),
        ],
      }),
      ...ASOCIATIA.randuri.map(
        ([eticheta, valoare, coada]) =>
          new TableRow({
            children: [
              celula(2200, [
                new Paragraph({
                  spacing: { after: 20 },
                  children: [
                    new TextRun({ text: eticheta, size: 19, color: MOALE }),
                  ],
                }),
              ]),
              celula(6900, [
                new Paragraph({
                  spacing: { after: 20 },
                  children: [
                    /*
                      IBAN-ul e subliniat la ei, și are rost: e singura parte
                      din rând pe care cineva o copiază în aplicația băncii.
                    */
                    new TextRun({
                      text: valoare,
                      size: 19,
                      color: NEGRU,
                      underline: coada ? {} : undefined,
                    }),
                    ...(coada
                      ? [new TextRun({ text: coada, size: 19, color: NEGRU })]
                      : []),
                  ],
                }),
              ]),
            ],
          }),
      ),
    ],
  });
}

/** Semnăturile, una lângă alta, cu linia de sub fiecare. */
function semnaturi(reprezentant: string): Table {
  const centrat = (copii: TextRun[], dupa = 40) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: dupa },
      children: copii,
    });

  const celula = (copii: Paragraph[]) =>
    new TableCell({
      width: { size: 4350, type: WidthType.DXA },
      margins: { top: 120, bottom: 160, left: 120, right: 120 },
      verticalAlign: VerticalAlign.TOP,
      borders: {
        top: FARA,
        left: FARA,
        right: FARA,
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "9A9A9A" },
      },
      children: copii,
    });

  const titlu = (continut: string) =>
    centrat([
      new TextRun({
        text: continut,
        bold: true,
        size: CORP,
        color: PORTOCALIU,
        characterSpacing: 24,
      }),
    ]);

  /*
    Între cele două coloane stă o a treia, goală: fără ea, liniile de sub
    semnături se lipesc într-una singură, cât pagina, iar pe hârtia lor sunt
    două linii despărțite.
  */
  const gol = new TableCell({
    width: { size: 400, type: WidthType.DXA },
    borders: { top: FARA, left: FARA, right: FARA, bottom: FARA },
    children: [new Paragraph({ children: [] })],
  });

  return new Table({
    columnWidths: [4350, 400, 4350],
    width: { size: 9100, type: WidthType.DXA },
    borders: {
      top: FARA,
      bottom: FARA,
      left: FARA,
      right: FARA,
      insideVertical: FARA,
      insideHorizontal: FARA,
    },
    rows: [
      new TableRow({
        children: [
          celula([
            titlu("SPONSOR"),
            centrat(
              reprezentant
                ? [
                    new TextRun({
                      text: reprezentant,
                      bold: true,
                      size: CORP,
                      color: NEGRU,
                    }),
                  ]
                : [
                    new TextRun({
                      text: ".".repeat(80),
                      size: CORP,
                      color: MOALE,
                    }),
                  ],
            ),
            centrat(
              [
                new TextRun({
                  text: "Reprezentant legal",
                  size: 19,
                  color: MOALE,
                }),
              ],
              0,
            ),
          ]),
          gol,
          celula([
            titlu("BENEFICIAR"),
            centrat([
              new TextRun({
                text: "Asociația Teona Ariana Suceava",
                bold: true,
                size: CORP,
                color: NEGRU,
              }),
            ]),
            centrat(
              [
                new TextRun({
                  text: "Președinte, Corneliu Cristea Costiuc",
                  size: 19,
                  color: MOALE,
                }),
              ],
              0,
            ),
          ]),
        ],
      }),
    ],
  });
}

/**
 * Sigla, citită de pe disc.
 *
 * E scoasă din PDF-ul lor, deci e chiar sigla de pe antetul contractului.
 * Fișierele din `continut/` sunt citite și în altă parte în același fel
 * (`src/lib/continut.ts`), iar construirea nu le mută nicăieri.
 */
function sigla(): Buffer {
  return readFileSync(join(process.cwd(), "continut", "sigla-contract.jpg"));
}

function antet(): Header {
  return new Header({
    children: [
      new Table({
        columnWidths: [3200, 5900],
        width: { size: 9100, type: WidthType.DXA },
        borders: {
          top: FARA,
          left: FARA,
          right: FARA,
          insideVertical: FARA,
          insideHorizontal: FARA,
          bottom: { style: BorderStyle.SINGLE, size: 4, color: LINIE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 3200, type: WidthType.DXA },
                margins: { bottom: 80 },
                borders: { top: FARA, left: FARA, right: FARA, bottom: FARA },
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: sigla(),
                        type: "jpg",
                        // 471×174 px la 300 ppi = 1,57 × 0,58 țoli.
                        transformation: { width: 151, height: 56 },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 5900, type: WidthType.DXA },
                margins: { bottom: 80 },
                verticalAlign: VerticalAlign.BOTTOM,
                borders: { top: FARA, left: FARA, right: FARA, bottom: FARA },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: ASOCIATIA.antet,
                        size: 15,
                        color: MOALE,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
    ],
  });
}

const subsol = () =>
  new Footer({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({
            text: "Contract de sponsorizare  ·  Asociația Teona Ariana Suceava",
            size: 15,
            color: MOALE,
          }),
          new TextRun({ text: "\t", size: 15 }),
          new TextRun({ text: "Pagina ", size: 15, color: MOALE }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 15,
            color: MOALE,
          }),
          new TextRun({ text: " din ", size: 15, color: MOALE }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 15,
            color: MOALE,
          }),
        ],
      }),
    ],
  });

/**
 * Contractul, completat cu ce se știe.
 *
 * Fără niciun câmp, iese modelul gol de pe pagina pentru firme. Cu datele
 * firmei, iese contractul ei, gata de semnat — cu certificatul calificat sau
 * cu pixul, după ce îl tipărește.
 */
export async function contractWord(
  date: Partial<DateContract> = {},
): Promise<Uint8Array> {
  const document = new Document({
    creator: "Asociația Teona Ariana Suceava",
    title: "Contract de sponsorizare",
    description:
      "Model de contract de sponsorizare, de completat de firma sponsor.",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: CORP, color: NEGRU } },
      },
    },
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
              style: { paragraph: { indent: { left: 700, hanging: 280 } } },
            },
          ],
        },
        {
          reference: "incetare",
          levels: [
            {
              level: 0,
              format: LevelFormat.LOWER_LETTER,
              text: "%1)",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 700, hanging: 280 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1500, bottom: 1130, left: 1130, right: 1130 } },
        },
        headers: { default: antet() },
        footers: { default: subsol() },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 90 },
            children: [
              new TextRun({
                text: "CONTRACT DE SPONSORIZARE",
                bold: true,
                size: 34,
                color: PORTOCALIU,
                characterSpacing: 40,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Nr. ……………  din data de  ……………………………",
                size: CORP,
                color: MOALE,
              }),
            ],
          }),

          capitol("I. PĂRȚILE CONTRACTANTE"),
          articol(1, "Între:"),
          rand([
            {
              eticheta: "Denumire: ",
              cota: 1,
              gros: true,
              valoare: date.denumire,
            },
          ]),
          rand([
            { eticheta: "cu sediul în ", cota: 2.6, valoare: date.sediu },
            { eticheta: " jud. ", cota: 1, valoare: date.judet },
          ]),
          rand([
            { eticheta: "CUI/CIF ", cota: 1, valoare: date.cui },
            { eticheta: "  Nr. Reg. Com. ", cota: 1.8, valoare: date.regCom },
          ]),
          rand([
            {
              eticheta: "reprezentată legal prin ",
              cota: 1.2,
              valoare: date.reprezentant,
            },
            {
              eticheta: "  în calitate de ",
              cota: 1.2,
              valoare: date.calitate,
            },
          ]),
          rand([
            { eticheta: "telefon ", cota: 1, valoare: date.telefon },
            { eticheta: "  e-mail ", cota: 1.9, valoare: date.email },
          ]),
          new Paragraph({
            spacing: { before: 60, after: 160 },
            children: [
              new TextRun({ text: "denumită în continuare ", size: CORP }),
              new TextRun({ text: "SPONSOR", bold: true, size: CORP }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({ text: "și", size: CORP })],
          }),
          casetaBeneficiarului(),
          new Paragraph({
            spacing: { before: 160, after: 140 },
            children: [
              new TextRun({ text: "denumită în continuare ", size: CORP }),
              new TextRun({ text: "BENEFICIAR", bold: true, size: CORP }),
            ],
          }),
          text(
            "au convenit încheierea prezentului contract de sponsorizare, în următoarele condiții.",
          ),

          capitol("II. OBIECTUL ȘI VALOAREA CONTRACTULUI"),
          articol(
            2,
            "Având în vedere că Asociația Teona Ariana Suceava este o organizație de sine stătătoare, neguvernamentală, apolitică și fără scop patrimonial, cu patrimoniu și scop determinat, cu personalitate juridică conform legii, având ca scop identificarea și ajutorarea copiilor, tinerilor și adulților cu probleme de sănătate și a celor cu dizabilități, a vârstnicilor neajutorați, integrarea acestora în standardele unei societăți civilizate, precum și ajutorarea familiilor nevoiașe și a altor persoane care necesită ajutor, inclusiv prin activități de voluntariat,",
          ),
          text(
            "obiectul prezentului contract îl constituie sponsorizarea de către SPONSOR a proiectelor desfășurate de BENEFICIAR.",
          ),
          new Paragraph({
            spacing: { after: 140, line: 264 },
            children: [
              new TextRun({
                text: "Art. 3. ",
                bold: true,
                size: CORP,
                color: PORTOCALIU,
              }),
              new TextRun({
                text: "Valoarea contractului este de ",
                size: CORP,
              }),
              ...(date.valoare
                ? [new TextRun({ text: date.valoare, bold: true, size: CORP })]
                : []),
              new TextRun({
                text: ".".repeat(
                  Math.max(10, 96 - Math.round(2 * (date.valoare?.length ?? 0))),
                ),
                size: CORP,
                color: MOALE,
              }),
              new TextRun({ text: " lei", bold: true, size: CORP }),
            ],
          }),

          capitol("III. OBLIGAȚIILE PĂRȚILOR"),
          articol(
            4,
            "SPONSORUL se obligă să vireze în contul BENEFICIARULUI sau să înmâneze în numerar suma prevăzută la Art. 3.",
          ),
          articol(5, "BENEFICIARUL se obligă:"),
          new Paragraph({
            numbering: { reference: "obligatii", level: 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 70, line: 264 },
            children: [
              new TextRun({
                text: "să aducă la cunoștința publicului larg numele SPONSORULUI, prin diverse modalități;",
                size: CORP,
              }),
            ],
          }),
          new Paragraph({
            numbering: { reference: "obligatii", level: 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140, line: 264 },
            children: [
              new TextRun({
                text: "să folosească sumele primite exclusiv în scop caritabil și pentru ajutorarea persoanelor aflate în nevoie.",
                size: CORP,
              }),
            ],
          }),

          capitol("IV. DURATA CONTRACTULUI"),
          articol(
            6,
            "Prezentul contract intră în vigoare la data semnării și este valabil până la îndeplinirea obligațiilor de către ambele părți.",
          ),

          capitol("V. FORȚA MAJORĂ"),
          articol(
            7,
            "Forța majoră exonerează părțile de răspundere în cazul neexecutării parțiale sau totale a obligațiilor asumate prin prezentul contract. Prin forță majoră se înțelege un eveniment independent de voința părților, imprevizibil și insurmontabil, apărut după încheierea contractului, care împiedică părțile să își execute total sau parțial obligațiile asumate.",
          ),

          capitol("VI. NOTIFICĂRI"),
          articol(
            8,
            "Orice notificare adresată de una dintre părți celeilalte se va face prin scrisoare recomandată (prin poștă sau curier) cu confirmare de primire sau prin e-mail cu confirmare de primire.",
          ),

          capitol("VII. CLAUZA DE CONTINUITATE"),
          articol(
            9,
            "Prezentul contract poate fi continuat de succesorii legali ai semnatarilor, cu acordul expres al celeilalte părți.",
          ),

          capitol("VIII. ÎNCETAREA CONTRACTULUI"),
          articol(
            10,
            "Contractul poate înceta numai cu acordul scris al ambelor părți, cu excepția următoarelor situații:",
          ),
          new Paragraph({
            numbering: { reference: "incetare", level: 0 },
            spacing: { after: 70, line: 264 },
            children: [
              new TextRun({
                text: "realizarea obiectului contractului devine în mod evident imposibilă;",
                size: CORP,
              }),
            ],
          }),
          new Paragraph({
            numbering: { reference: "incetare", level: 0 },
            spacing: { after: 200, line: 264 },
            children: [
              new TextRun({
                text: "intervine un caz de forță majoră.",
                size: CORP,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300, line: 264 },
            children: [
              new TextRun({
                text: "Prezentul contract s-a încheiat și semnat astăzi, ",
                size: CORP,
              }),
              new TextRun({ text: ".".repeat(26), size: CORP, color: MOALE }),
              new TextRun({
                text: ", în două exemplare originale, cu aceeași valoare juridică, câte unul pentru fiecare parte.",
                size: CORP,
              }),
            ],
          }),

          semnaturi(date.reprezentant ?? ""),
        ],
      },
    ],
  });

  const octeti = await Packer.toBuffer(document);
  return new Uint8Array(octeti);
}
