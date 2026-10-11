import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Scrierea documentelor PDF: contractul de sponsorizare și ce mai urmează.
 *
 * **De ce un font adus cu noi.** Fonturile standard din PDF (Helvetica și
 * restul) sunt codate WinAnsi, care n-are ș și ț cu virgulă dedesubt —
 * literele românești. pdf-lib le-ar înlocui tăcut sau ar arunca o eroare la
 * primul „ț" dintr-un nume de firmă. DejaVu Sans le are pe toate, e liber de
 * redistribuit (vezi `src/fonturi/LICENTA.txt`), iar textul rămâne text: se
 * poate căuta și copia din PDF, ceea ce pentru un contract contează.
 *
 * Fonturile se citesc o singură dată și se țin în memorie: 1,4 MB citite la
 * fiecare contract ar fi risipă, iar pe Railway discul e lent.
 */

const CALE = join(process.cwd(), "src", "fonturi");

let octeti: { normal: Buffer; gros: Buffer } | null = null;

function fonturi() {
  octeti ??= {
    normal: readFileSync(join(CALE, "DejaVuSans.ttf")),
    gros: readFileSync(join(CALE, "DejaVuSans-Bold.ttf")),
  };
  return octeti;
}

export const CERNEALA = rgb(0.14, 0.14, 0.14);
export const MOALE = rgb(0.38, 0.38, 0.38);

/** A4 în puncte, la 72 pe țol. */
export const A4 = { latime: 595.28, inaltime: 841.89 };
export const MARGINE = 56;

export type Document = {
  pdf: PDFDocument;
  normal: PDFFont;
  gros: PDFFont;
};

export async function documentNou(): Promise<Document> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const f = fonturi();
  return {
    pdf,
    // `subset: true` scoate glifele nefolosite: un PDF de o pagină ajunge
    // ~30 kB în loc de 1,4 MB.
    normal: await pdf.embedFont(f.normal, { subset: true }),
    gros: await pdf.embedFont(f.gros, { subset: true }),
  };
}

/**
 * Un cursor care scrie de sus în jos și trece singur pe pagina următoare.
 *
 * pdf-lib desenează la coordonate absolute, cu originea jos-stânga, și nu
 * are noțiunea de „rândul următor”. Fără asta, fiecare text ar trebui
 * poziționat de mână, iar un paragraf mai lung decât se aștepta cineva ar
 * scrie peste cel de dedesubt sau ar ieși pe sub marginea paginii.
 */
export class Cursor {
  private pagina: PDFPage;
  private y: number;

  constructor(
    private doc: Document,
    private latime = A4.latime - 2 * MARGINE,
  ) {
    this.pagina = doc.pdf.addPage([A4.latime, A4.inaltime]);
    this.y = A4.inaltime - MARGINE;
  }

  /** Taie textul în rânduri care încap pe lățimea dată. */
  private randuri(text: string, font: PDFFont, marime: number, latime: number) {
    const iesire: string[] = [];
    for (const paragraf of text.split("\n")) {
      let rand = "";
      for (const cuvant of paragraf.split(/\s+/)) {
        const incercare = rand ? `${rand} ${cuvant}` : cuvant;
        if (font.widthOfTextAtSize(incercare, marime) <= latime) {
          rand = incercare;
        } else {
          if (rand) iesire.push(rand);
          rand = cuvant;
        }
      }
      iesire.push(rand);
    }
    return iesire;
  }

  /** Face loc pentru `inaltime` puncte, trecând pe pagină nouă dacă nu încape. */
  private locPentru(inaltime: number) {
    if (this.y - inaltime < MARGINE) {
      this.pagina = this.doc.pdf.addPage([A4.latime, A4.inaltime]);
      this.y = A4.inaltime - MARGINE;
    }
  }

  scrie(
    text: string,
    {
      gros = false,
      marime = 10.5,
      culoare = CERNEALA,
      spatiuDupa = 6,
      indent = 0,
    } = {},
  ): this {
    const font = gros ? this.doc.gros : this.doc.normal;
    const inaltimeRand = marime * 1.45;
    for (const rand of this.randuri(
      text,
      font,
      marime,
      this.latime - indent,
    )) {
      this.locPentru(inaltimeRand);
      this.y -= inaltimeRand;
      this.pagina.drawText(rand, {
        x: MARGINE + indent,
        y: this.y,
        size: marime,
        font,
        color: culoare,
      });
    }
    this.y -= spatiuDupa;
    return this;
  }

  spatiu(puncte = 10): this {
    this.y -= puncte;
    return this;
  }

  linie(): this {
    this.locPentru(12);
    this.y -= 8;
    this.pagina.drawLine({
      start: { x: MARGINE, y: this.y },
      end: { x: A4.latime - MARGINE, y: this.y },
      thickness: 0.6,
      color: rgb(0.85, 0.82, 0.8),
    });
    this.y -= 8;
    return this;
  }

  /** O imagine PNG — semnătura desenată pe ecran. */
  async imagine(
    png: Uint8Array,
    { latime = 170, inaltime = 65, x = MARGINE } = {},
  ): Promise<this> {
    const imagine = await this.doc.pdf.embedPng(png);
    this.locPentru(inaltime + 6);
    this.y -= inaltime;
    this.pagina.drawImage(imagine, { x, y: this.y, width: latime, height: inaltime });
    this.y -= 6;
    return this;
  }

  /** Unde a ajuns cursorul, dacă e nevoie să se deseneze ceva lângă. */
  get pozitie(): { pagina: PDFPage; y: number } {
    return { pagina: this.pagina, y: this.y };
  }
}
