import { readFileSync } from "node:fs";
import { join } from "node:path";
import { rgb } from "pdf-lib";
import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { A4, Cursor, MARGINE, MOALE, documentNou } from "@/lib/pdf";
import { scrieSuma } from "@/lib/suma";
import {
  campaniileDeRaportat,
  raportAnual,
  raportCampanie,
  raportLunar,
  type Perioada,
} from "./date";

/**
 * Rapoartele, scrise ca PDF.
 *
 * **La ce folosesc.** Cifrele se văd și în panou, pe ecran. Un raport e
 * altceva: e ce atașezi la un e-mail către consiliul director, ce tipărești
 * pentru ședință, ce trimiți unei firme care întreabă „ce ați făcut cu
 * banii?". Până acum fiecare dintre ele însemna o oră de copiat cifre într-un
 * document, cu riscul obișnuit al copiatului de mână.
 *
 * **Două feluri de documente, nu unul.** Raportul lunar conține nume de
 * donatori, deci e un document intern și o scrie pe el. Raportul anual și cel
 * pe campanie n-au niciun nume: sunt făcute ca să plece din asociație. Nu e o
 * subtilitate — e diferența dintre un raport pe care îl poți atașa liniștit
 * și unul care, trimis din reflex, înseamnă o scurgere de date personale.
 *
 * **Nicio cifră nu se inventează ca să arate bine.** O lună fără donații se
 * scrie cu zero. O campanie fără țintă n-are procent. Sumele în euro apar
 * separat, neconvertite.
 */

const PORTOCALIU = rgb(0.84, 0.27, 0.08);
const SIGLA = join(process.cwd(), "continut", "sigla-contract.jpg");

let siglaOcteti: Buffer | null = null;
function sigla(): Buffer {
  siglaOcteti ??= readFileSync(SIGLA);
  return siglaOcteti;
}

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

const LUNI_SCURT = [
  "ian.",
  "feb.",
  "mar.",
  "apr.",
  "mai",
  "iun.",
  "iul.",
  "aug.",
  "sep.",
  "oct.",
  "nov.",
  "dec.",
];

/** `2026-10` → „octombrie 2026". */
function numeleLunii(luna: string, scurt = false): string {
  const [an, nr] = luna.split("-");
  const lista = scurt ? LUNI_SCURT : LUNI;
  return `${lista[Number(nr) - 1]} ${scurt ? an.slice(2) : an}`;
}

const ZIUA = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Lei, din bani. Toate sumele trec pe aici. */
function lei(bani: number): string {
  return scrieSuma(bani / 100);
}

function procent(parte: number, intreg: number): string {
  if (intreg <= 0) return "—";
  return `${Math.round((parte / intreg) * 100)}%`;
}

/**
 * Antetul fiecărui raport: sigla, cine îl scoate, ce perioadă, când.
 *
 * Data scoaterii nu e un ornament. Cifrele se schimbă — o donație confirmată
 * mâine intră în luna de ieri — iar două rapoarte pe aceeași lună, scoase la
 * o săptămână distanță, pot arăta diferit. Fără data pe hârtie, cineva care
 * le compară peste un an crede că una din ele e greșită.
 */
async function antet(
  c: Cursor,
  titlu: string,
  subtitlu: string,
): Promise<void> {
  const { pagina } = c.pozitie;
  const imagine = await c.document.pdf.embedJpg(sigla());
  const latime = 46;
  const inaltime = (imagine.height / imagine.width) * latime;
  pagina.drawImage(imagine, {
    x: A4.latime - MARGINE - latime,
    y: A4.inaltime - MARGINE - inaltime + 10,
    width: latime,
    height: inaltime,
  });

  c.scrie(ASOCIATIA.denumire, { gros: true, marime: 11, spatiuDupa: 1 });
  c.scrie(
    `CIF ${ASOCIATIA.cif} · ${TELEFON_PRINCIPAL.afisat} · ${EMAIL.contact}`,
    { marime: 8.5, culoare: MOALE, spatiuDupa: 16 },
  );
  c.scrie(titlu, {
    gros: true,
    marime: 18,
    culoare: PORTOCALIU,
    spatiuDupa: 3,
  });
  c.scrie(subtitlu, { marime: 9.5, culoare: MOALE, spatiuDupa: 4 });
  c.scrie(`Scos din panou pe ${ZIUA.format(new Date())}.`, {
    marime: 8.5,
    culoare: MOALE,
  });
  c.linie();
  c.spatiu(6);
}

function titlu(c: Cursor, text: string): void {
  c.rezerva(60);
  c.spatiu(6);
  c.scrie(text, { gros: true, marime: 12, spatiuDupa: 8 });
}

/** Secțiunile comune: pe ce s-au dat banii, pe ce cale au intrat. */
function felii(c: Cursor, p: Perioada): void {
  if (p.peDestinatii.length > 0) {
    titlu(c, "Pe ce s-au dat banii");
    c.tabel(
      p.peDestinatii.map((d) => [
        d.eticheta,
        String(d.nr),
        lei(d.bani),
        procent(d.bani, p.bani),
      ]),
      { capete: ["Destinație", "Donații", "Sumă", "Din total"] },
    );
  }

  if (p.peMetode.length > 0) {
    titlu(c, "Pe ce cale au intrat");
    c.tabel(
      p.peMetode.map((m) => [
        m.eticheta,
        String(m.nr),
        lei(m.bani),
        procent(m.bani, p.bani),
      ]),
      { capete: ["Cale", "Donații", "Sumă", "Din total"] },
    );
  }

  if (p.alteMonede.length > 0) {
    titlu(c, "În altă monedă");
    c.tabel(
      p.alteMonede.map((m) => [
        m.moneda,
        String(m.nr),
        scrieSuma(m.bani / 100, m.moneda),
      ]),
      { capete: ["Monedă", "Donații", "Sumă"] },
    );
    c.scrie(
      "Sumele de mai sus nu sunt adunate la total și nu sunt convertite: cursul care contează e al băncii, în ziua încasării.",
      { marime: 8.5, culoare: MOALE },
    );
  }
}

/** Nota de la sfârșit: ce fel de document e și ce are voie să i se facă. */
function incheiere(c: Cursor, intern: boolean): void {
  c.spatiu(10);
  c.linie();
  c.scrie(
    intern
      ? "Document intern. Conține nume de donatori, deci nu pleacă în afara asociației și nu se publică."
      : "Document fără date personale. Se poate trimite unui sponsor, unui finanțator sau publica în raportul de activitate.",
    { marime: 8.5, culoare: MOALE, spatiuDupa: 2 },
  );
  c.scrie(
    "Cuprinde numai donațiile încasate. Un transfer anunțat de donator, dar negăsit încă în extrasul de cont, nu e numărat nicăieri.",
    { marime: 8.5, culoare: MOALE },
  );
}

export async function pdfLunar(luna: string): Promise<Uint8Array> {
  const r = await raportLunar(luna);
  const doc = await documentNou();
  const c = new Cursor(doc);

  await antet(
    c,
    `Raport lunar · ${numeleLunii(luna)}`,
    "Cât a intrat, de la cine și pe ce cale.",
  );

  const { acum, inainte } = r;
  const fataDe =
    inainte.bani > 0
      ? `${acum.bani >= inainte.bani ? "+" : ""}${Math.round(
          ((acum.bani - inainte.bani) / inainte.bani) * 100,
        )}% față de luna trecută.`
      : "Luna trecută n-a intrat nimic, deci nu există cu ce compara.";

  titlu(c, "Pe scurt");
  c.tabel(
    [
      ["Total încasat", lei(acum.bani)],
      ["Luna trecută", lei(inainte.bani)],
      ["Donații", String(acum.donatii)],
      ["Donatori", String(acum.donatori)],
      ["Dintre ei, la prima donație", String(acum.donatoriNoi)],
      [
        "Din plăți lunare",
        `${lei(acum.baniRecurenti)} (${procent(acum.baniRecurenti, acum.bani)})`,
      ],
    ],
    { latimeCifre: 160 },
  );
  c.scrie(fataDe, { marime: 9, culoare: MOALE });

  felii(c, acum);

  if (r.celeMariDonatii.length > 0) {
    titlu(c, "Cele mai mari donații ale lunii");
    c.tabel(
      r.celeMariDonatii.map((d) => [
        d.cine + (d.lunar ? " (lunar)" : ""),
        ZIUA.format(new Date(d.cand)),
        lei(d.bani),
      ]),
      { capete: ["Donator", "Când", "Sumă"], latimeCifre: 110 },
    );
  }

  if (r.deVerificat > 0) {
    titlu(c, "De verificat în extrasul de cont");
    c.scrie(
      `${r.deVerificat} ${
        r.deVerificat === 1
          ? "transfer anunțat de donator așteaptă"
          : "transferuri anunțate de donatori așteaptă"
      } confirmarea. Până atunci nu sunt în niciun total de mai sus.`,
      { marime: 9.5 },
    );
  }

  incheiere(c, true);
  return doc.pdf.save();
}

export async function pdfAnual(an: number): Promise<Uint8Array> {
  const r = await raportAnual(an);
  const doc = await documentNou();
  const c = new Cursor(doc);

  await antet(
    c,
    `Raport anual · ${an}`,
    "Cât s-a strâns, de la câți oameni și pe ce s-a dus.",
  );

  const t = r.total;
  titlu(c, "Pe scurt");
  c.tabel(
    [
      ["Total încasat", lei(t.bani)],
      ["Donații", String(t.donatii)],
      ["Donatori", String(t.donatori)],
      ["Dintre ei, la prima donație", String(t.donatoriNoi)],
      [
        "Din plăți lunare",
        `${lei(t.baniRecurenti)} (${procent(t.baniRecurenti, t.bani)})`,
      ],
    ],
    { latimeCifre: 160 },
  );

  titlu(c, "Lună de lună");
  c.tabel(
    r.luni.map((l) => [numeleLunii(l.luna), String(l.donatii), lei(l.bani)]),
    { capete: ["Luna", "Donații", "Sumă"] },
  );

  felii(c, t);

  if (r.campanii.length > 0) {
    titlu(c, "Campanii");
    c.tabel(
      r.campanii.map((x) => [
        x.titlu,
        lei(x.bani),
        x.tintaBani === null ? "fără țintă" : lei(x.tintaBani),
        x.tintaBani === null || x.tintaBani === 0
          ? "—"
          : procent(x.bani, x.tintaBani),
      ]),
      { capete: ["Campanie", "Strâns", "Țintă", "Din țintă"], latimeCifre: 85 },
    );
    c.scrie(
      "Se numără donațiile care poartă eticheta campaniei — cele venite prin butonul „Donează pentru campania asta”.",
      { marime: 8.5, culoare: MOALE },
    );
  }

  titlu(c, "Sponsorizări de la firme");
  c.tabel(
    r.firme.peStadii.map((s) => [s.stadiu, String(s.nr)]),
    { capete: ["Unde a ajuns firma", "Firme"], latimeCifre: 160 },
  );
  c.scrie(
    `Cele ${r.firme.incasate} ${
      r.firme.incasate === 1
        ? "firmă care a virat banii adună"
        : "firme care au virat banii adună"
    } ${lei(r.firme.bani)}, după fișele din panou.`,
    { marime: 9.5, spatiuDupa: 4 },
  );
  c.scrie(
    "Cifra vine din fișele firmelor, completate de mână, nu din extrasul de cont, și nu e adunată la totalul donațiilor de sus.",
    { marime: 8.5, culoare: MOALE },
  );

  incheiere(c, false);
  return doc.pdf.save();
}

export async function pdfCampanie(slug: string): Promise<Uint8Array | null> {
  const r = await raportCampanie(slug);
  if (!r) return null;

  const doc = await documentNou();
  const c = new Cursor(doc);

  await antet(
    c,
    r.titlu,
    r.publicatLa
      ? `Campanie publicată pe ${ZIUA.format(new Date(r.publicatLa))}.`
      : "Campanie nepublicată încă.",
  );

  if (r.rezumat) c.scrie(r.rezumat, { marime: 10, spatiuDupa: 10 });

  titlu(c, "Cât s-a strâns");
  c.tabel(
    [
      ["Strâns până acum", lei(r.bani)],
      ["Țintă", r.tintaBani === null ? "fără țintă" : lei(r.tintaBani)],
      [
        "Din țintă",
        r.tintaBani === null || r.tintaBani === 0
          ? "—"
          : procent(r.bani, r.tintaBani),
      ],
      ["Donații", String(r.donatii)],
      ["Donatori", String(r.donatori)],
    ],
    { latimeCifre: 160 },
  );

  if (r.luni.length > 0) {
    titlu(c, "Lună de lună");
    c.tabel(
      r.luni.map((l) => [numeleLunii(l.luna), String(l.donatii), lei(l.bani)]),
      { capete: ["Luna", "Donații", "Sumă"] },
    );
  } else {
    c.scrie("Nu a intrat încă nicio donație pe campania asta.", {
      marime: 9.5,
      culoare: MOALE,
    });
  }

  incheiere(c, false);
  return doc.pdf.save();
}

export { campaniileDeRaportat };
