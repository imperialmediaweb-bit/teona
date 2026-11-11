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

export type Culoare = ReturnType<typeof rgb>;

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
    /** Loc lăsat sus pe fiecare pagină, pentru un antet desenat după. */
    private sus = 0,
  ) {
    this.pagina = doc.pdf.addPage([A4.latime, A4.inaltime]);
    this.y = A4.inaltime - MARGINE - sus;
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
      this.y = A4.inaltime - MARGINE - this.sus;
    }
  }

  scrie(
    text: string,
    {
      gros = false,
      marime = 10,
      culoare = CERNEALA,
      spatiuDupa = 6,
      indent = 0,
    } = {},
  ): this {
    const font = gros ? this.doc.gros : this.doc.normal;
    const inaltimeRand = marime * 1.45;
    for (const rand of this.randuri(text, font, marime, this.latime - indent)) {
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

  /**
   * Trece pe pagină nouă dacă blocul care urmează n-ar încăpea întreg.
   *
   * Pentru lucruri care n-au voie să se rupă: un bloc de semnături despicat
   * între pagini arată ca un document trimis greșit, iar cineva care primește
   * un contract cu semnăturile orfane pe pagina trei se întreabă dacă lipsește
   * ceva.
   */
  rezerva(inaltime: number): this {
    this.locPentru(inaltime);
    return this;
  }

  /**
   * Unde a ajuns cursorul, și cum se pune înapoi acolo.
   *
   * `pdf-lib` scrie la coordonate absolute, iar cursorul merge doar în jos.
   * Două coloane alăturate — semnăturile — se scriu scriind prima, revenind
   * la înălțimea de dinainte și scriind-o pe a doua cu un `indent`. Se
   * folosește numai după `rezerva`, ca amândouă să fie sigur pe aceeași
   * pagină.
   */
  pozitia(): number {
    return this.y;
  }

  laPozitia(y: number): this {
    this.y = y;
    return this;
  }

  linie(): this {
    this.locPentru(12);
    this.y -= 6;
    this.pagina.drawLine({
      start: { x: MARGINE, y: this.y },
      end: { x: A4.latime - MARGINE, y: this.y },
      thickness: 0.6,
      color: rgb(0.85, 0.82, 0.8),
    });
    this.y -= 6;
    return this;
  }

  /**
   * Un tabel simplu: prima coloană la stânga, restul la dreapta.
   *
   * Cifrele se citesc pe coloană, deci se aliniază la dreapta — altfel „1.250"
   * și „980" încep în același loc și ochiul compară lungimi de cuvinte, nu
   * mărimi. Lățimea coloanelor de cifre e fixă, a primei e tot ce rămâne: un
   * nume lung de campanie se taie cu trei puncte în loc să împingă sumele
   * afară din pagină.
   */
  tabel(
    randuri: ReadonlyArray<readonly string[]>,
    {
      capete,
      marime = 9.5,
      latimeCifre = 95,
      spatiuDupa = 10,
    }: {
      capete?: readonly string[];
      marime?: number;
      latimeCifre?: number;
      spatiuDupa?: number;
    } = {},
  ): this {
    const coloane = Math.max(
      capete?.length ?? 0,
      ...randuri.map((r) => r.length),
      1,
    );
    const inaltimeRand = marime * 2;
    const latimePrima = this.latime - (coloane - 1) * latimeCifre;

    const scrieRand = (celule: readonly string[], gros: boolean) => {
      this.locPentru(inaltimeRand);
      this.y -= inaltimeRand * 0.72;
      const font = gros ? this.doc.gros : this.doc.normal;
      for (let i = 0; i < coloane; i++) {
        const text = celule[i] ?? "";
        if (!text) continue;
        if (i === 0) {
          this.pagina.drawText(this.taie(text, font, marime, latimePrima - 6), {
            x: MARGINE,
            y: this.y,
            size: marime,
            font,
            color: gros ? CERNEALA : CERNEALA,
          });
        } else {
          const dreapta = MARGINE + latimePrima + i * latimeCifre - 6;
          this.pagina.drawText(text, {
            x: dreapta - font.widthOfTextAtSize(text, marime),
            y: this.y,
            size: marime,
            font,
            color: CERNEALA,
          });
        }
      }
      this.y -= inaltimeRand * 0.28;
    };

    if (capete) {
      scrieRand(capete, true);
      this.linie();
    }
    for (const rand of randuri) scrieRand(rand, false);
    this.y -= spatiuDupa;
    return this;
  }

  /** Textul, scurtat cu „…" dacă nu încape pe lățimea dată. */
  private taie(
    text: string,
    font: PDFFont,
    marime: number,
    latime: number,
  ): string {
    if (font.widthOfTextAtSize(text, marime) <= latime) return text;
    let scurt = text;
    while (
      scurt.length > 1 &&
      font.widthOfTextAtSize(`${scurt}…`, marime) > latime
    ) {
      scurt = scurt.slice(0, -1);
    }
    return `${scurt}…`;
  }

  /** O imagine PNG — semnătura desenată pe ecran. */
  async imagine(
    png: Uint8Array,
    { latime = 170, inaltime = 65, x = MARGINE } = {},
  ): Promise<this> {
    const imagine = await this.doc.pdf.embedPng(png);
    this.locPentru(inaltime + 6);
    this.y -= inaltime;
    this.pagina.drawImage(imagine, {
      x,
      y: this.y,
      width: latime,
      height: inaltime,
    });
    this.y -= 6;
    return this;
  }

  /**
   * Text din bucăți cu înfățișări diferite — „Art. 4.” îngroșat și portocaliu,
   * apoi clauza —, tăiat în rânduri ca unul singur.
   *
   * `justificat` întinde rândurile pline până la marginea din dreapta, ca în
   * contractul tipărit al asociației; ultimul rând al paragrafului rămâne la
   * stânga, altfel ar avea goluri de un deget între cuvinte.
   */
  scrieBogat(
    bucati: ReadonlyArray<{ text: string; gros?: boolean; culoare?: Culoare }>,
    {
      marime = 10,
      spatiuDupa = 6,
      indent = 0,
      latime,
      justificat = false,
      centrat = false,
      interlinie = 1.45,
    }: {
      marime?: number;
      spatiuDupa?: number;
      indent?: number;
      latime?: number;
      justificat?: boolean;
      centrat?: boolean;
      interlinie?: number;
    } = {},
  ): this {
    type Cuvant = { text: string; font: PDFFont; culoare: Culoare; lat: number; lipit: boolean };
    const cuvinte: Cuvant[] = [];
    // Un spațiu la capătul unei bucăți desparte și de bucata următoare.
    let dupaSpatiu = true;
    for (const b of bucati) {
      const font = b.gros ? this.doc.gros : this.doc.normal;
      const parti = b.text.split(/(\s+)/);
      let lipit = !dupaSpatiu && !/^\s/.test(b.text);
      dupaSpatiu = /\s$/.test(b.text) || (dupaSpatiu && b.text.trim() === "");
      for (const p of parti) {
        if (!p) continue;
        if (/^\s+$/.test(p)) {
          lipit = false;
          continue;
        }
        cuvinte.push({ text: p, font, culoare: b.culoare ?? CERNEALA, lat: font.widthOfTextAtSize(p, marime), lipit });
        lipit = true;
      }
    }
    const spatiu = this.doc.normal.widthOfTextAtSize(" ", marime);
    const loc = latime ?? this.latime - indent;
    const randuri: Cuvant[][] = [];
    let rand: Cuvant[] = [];
    let ocupat = 0;
    for (const c of cuvinte) {
      const adaos = rand.length && !c.lipit ? spatiu + c.lat : c.lat;
      if (rand.length && !c.lipit && ocupat + adaos > loc) {
        randuri.push(rand);
        rand = [{ ...c, lipit: false }];
        ocupat = c.lat;
      } else {
        rand.push(c);
        ocupat += adaos;
      }
    }
    if (rand.length) randuri.push(rand);

    const inaltimeRand = marime * interlinie;
    randuri.forEach((r, i) => {
      this.locPentru(inaltimeRand);
      this.y -= inaltimeRand;
      const goluri = r.filter((c, k) => k > 0 && !c.lipit).length;
      const latRand = r.reduce((s, c, k) => s + c.lat + (k > 0 && !c.lipit ? spatiu : 0), 0);
      const ultimul = i === randuri.length - 1;
      const extra = justificat && !ultimul && goluri > 0 ? (loc - latRand) / goluri : 0;
      let x = MARGINE + indent + (centrat ? (loc - latRand) / 2 : 0);
      r.forEach((c, k) => {
        if (k > 0 && !c.lipit) x += spatiu + extra;
        this.pagina.drawText(c.text, { x, y: this.y, size: marime, font: c.font, color: c.culoare });
        x += c.lat;
      });
    });
    this.y -= spatiuDupa;
    return this;
  }

  /** Un titlu cu literele rărite, centrat sau la stânga. */
  scrieRarit(
    text: string,
    {
      marime = 15,
      culoare = CERNEALA,
      rarire = 2,
      centrat = false,
      spatiuDupa = 6,
    }: { marime?: number; culoare?: Culoare; rarire?: number; centrat?: boolean; spatiuDupa?: number } = {},
  ): this {
    const font = this.doc.gros;
    const litere = [...text];
    const lat =
      litere.reduce((s, l) => s + font.widthOfTextAtSize(l, marime), 0) +
      rarire * (litere.length - 1);
    const inaltimeRand = marime * 1.45;
    this.locPentru(inaltimeRand);
    this.y -= inaltimeRand;
    let x = centrat ? MARGINE + (this.latime - lat) / 2 : MARGINE;
    for (const l of litere) {
      this.pagina.drawText(l, { x, y: this.y, size: marime, font, color: culoare });
      x += font.widthOfTextAtSize(l, marime) + rarire;
    }
    this.y -= spatiuDupa;
    return this;
  }

  /**
   * Un chenar cu fundal și bară în stânga, desenat **înainte** de textul din
   * el: pdf-lib pictează în ordinea apelurilor, deci un fundal pus după ar
   * acoperi scrisul. De aceea înălțimea se dă dinainte, iar blocul întreg se
   * mută pe pagina următoare dacă n-ar încăpea.
   */
  chenar(
    inaltime: number,
    { fundal, bara, latimeBara = 3 }: { fundal?: Culoare; bara?: Culoare; latimeBara?: number } = {},
  ): this {
    this.locPentru(inaltime);
    if (fundal) {
      this.pagina.drawRectangle({ x: MARGINE, y: this.y - inaltime, width: this.latime, height: inaltime, color: fundal });
    }
    if (bara) {
      this.pagina.drawRectangle({ x: MARGINE, y: this.y - inaltime, width: latimeBara, height: inaltime, color: bara });
    }
    return this;
  }

  /** O bară verticală în stânga, de la `y` până unde a ajuns cursorul (aceeași pagină). */
  baraDeLa(y: number, culoare: Culoare, latime = 3): this {
    this.pagina.drawRectangle({ x: MARGINE, y: this.y, width: latime, height: y - this.y, color: culoare });
    return this;
  }

  /** Documentul din spate — pentru ce nu trece prin cursor, ca o siglă în colț. */
  get document(): Document {
    return this.doc;
  }

  /** Unde a ajuns cursorul, dacă e nevoie să se deseneze ceva lângă. */
  get pozitie(): { pagina: PDFPage; y: number } {
    return { pagina: this.pagina, y: this.y };
  }
}
