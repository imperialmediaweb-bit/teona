import { intreaba } from "./baza";

/**
 * Listele din panou, descărcate ca fișier pentru Excel.
 *
 * **De ce există.** Contabila cere donațiile pe an, raportul de activitate
 * cere totalurile, iar declarația către ANAF cere sponsorizările. Până acum
 * singura cale era să se uite cineva pe ecran și să le scrie de mână într-un
 * tabel — adică exact felul în care apar greșeli într-un raport semnat.
 *
 * **Punct și virgulă, nu virgulă.** Excel-ul pe români citește fișierele CSV
 * cu `;`, pentru că virgula e separatorul zecimal. Cu `,`, 1.250,50 ajunge pe
 * două coloane, iar tabelul se face praf la prima deschidere.
 *
 * **Cu BOM la început.** Fără el, Excel citește fișierul ca Windows-1252 și
 * fiecare „ă” devine „Äƒ”. Trei octeți care scutesc pe cineva de o oră de
 * căutat prin setări.
 */

const BOM = "﻿";

/**
 * O sumă, scrisă cum o citește Excel-ul românesc: cu virgulă zecimală.
 *
 * Postgres întoarce `150.0000000000000000` dintr-o împărțire cu `numeric`.
 * Lăsat așa, Excel-ul pe setări românești citește punctul ca separator de mii
 * și face din 150 de lei o sută cincizeci de milioane de miliarde. Cifra din
 * raport ar fi fost greșită fără ca nimic s-o arate.
 */
function bani(valoare: unknown): string {
  if (valoare === null || valoare === undefined || valoare === "") return "";
  const numar = Number(valoare);
  if (!Number.isFinite(numar)) return String(valoare);
  return numar.toFixed(2).replace(".", ",");
}

/** O dată, scrisă scurt. ISO fără milisecunde: se sortează corect ca text. */
function cand(valoare: unknown): string {
  if (!valoare) return "";
  const data = valoare instanceof Date ? valoare : new Date(String(valoare));
  return Number.isNaN(data.getTime())
    ? String(valoare)
    : data.toISOString().slice(0, 19).replace("T", " ");
}

/** Da/nu, nu `true`/`false`: fișierul se citește de oameni. */
function daNu(valoare: unknown): string {
  if (valoare === null || valoare === undefined || valoare === "") return "";
  return valoare === true || valoare === "t" || valoare === "true" ? "da" : "nu";
}

/** O valoare, pregătită pentru o celulă. */
function celula(valoare: unknown): string {
  if (valoare === null || valoare === undefined) return "";

  if (valoare instanceof Date) return `"${cand(valoare)}"`;

  const text = String(valoare);
  /*
    Un text care începe cu `=`, `+`, `-` sau `@` e tratat de Excel ca
    formulă. Un nume de firmă nu poate face rău, dar un câmp scris de un
    vizitator ar putea: `=HYPERLINK(...)` într-un fișier deschis de contabilă
    e o injecție de formulă. Un apostrof în față îl face text.
  */
  const sigur = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${sigur.replace(/"/g, '""')}"`;
}

export function caTabel(
  antet: readonly string[],
  randuri: ReadonlyArray<readonly unknown[]>,
): string {
  const linii = [antet.map(celula).join(";")];
  for (const rand of randuri) linii.push(rand.map(celula).join(";"));
  return BOM + linii.join("\r\n") + "\r\n";
}

export const LISTE = [
  { id: "donatii", eticheta: "Donații" },
  { id: "donatori", eticheta: "Donatori" },
  { id: "firme", eticheta: "Firme" },
  { id: "cereri", eticheta: "Cereri" },
] as const;

export type ListaExport = (typeof LISTE)[number]["id"];

export function esteLista(x: unknown): x is ListaExport {
  return LISTE.some((l) => l.id === x);
}

/**
 * Datele unei liste, gata de scris.
 *
 * Sumele se dau în lei, cu virgulă zecimală, nu în bani: fișierul se deschide
 * într-un tabel, nu într-un program. Cine adună coloana vrea lei.
 */
type Coloana = {
  titlu: string;
  cheie: string;
  cum?: (valoare: unknown) => unknown;
};

/**
 * Coloanele fiecărei liste, cu felul în care se scrie fiecare.
 *
 * Scrise pe nume, nu luate din ordinea câmpurilor din interogare: altfel o
 * coloană adăugată în SELECT mută toate valorile cu o poziție, iar fișierul
 * iese cu sumele în dreptul telefoanelor — fără nicio eroare nicăieri.
 */
const COLOANE: Record<ListaExport, Coloana[]> = {
  donatii: [
    { titlu: "Plătită la", cheie: "platita_la", cum: cand },
    { titlu: "Creată la", cheie: "creat_la", cum: cand },
    { titlu: "Prin", cheie: "procesator" },
    { titlu: "Referință", cheie: "referinta" },
    { titlu: "Sumă", cheie: "suma", cum: bani },
    { titlu: "Monedă", cheie: "moneda" },
    { titlu: "Frecvență", cheie: "frecventa" },
    { titlu: "Destinație", cheie: "destinatie" },
    { titlu: "Campanie", cheie: "campanie_slug" },
    { titlu: "Stare", cheie: "stare" },
    { titlu: "Prenume", cheie: "prenume" },
    { titlu: "Nume", cheie: "nume" },
    { titlu: "E-mail", cheie: "email" },
    { titlu: "Telefon", cheie: "telefon" },
    { titlu: "Acord buletin", cheie: "acord_buletin", cum: daNu },
    { titlu: "Adăugată de", cheie: "adaugat_de" },
    { titlu: "Observații", cheie: "observatii" },
  ],
  donatori: [
    { titlu: "E-mail", cheie: "email" },
    { titlu: "Prenume", cheie: "prenume" },
    { titlu: "Nume", cheie: "nume" },
    { titlu: "Telefon", cheie: "telefon" },
    { titlu: "Câte donații", cheie: "donatii" },
    { titlu: "Total lei", cheie: "total_lei", cum: bani },
    { titlu: "Prima donație", cheie: "prima", cum: cand },
    { titlu: "Ultima donație", cheie: "ultima", cum: cand },
    { titlu: "Are donație lunară", cheie: "are_lunara", cum: daNu },
    { titlu: "Acord buletin", cheie: "acord_buletin", cum: daNu },
    { titlu: "Notiță", cheie: "notita" },
  ],
  firme: [
    { titlu: "Creată la", cheie: "creat_la", cum: cand },
    { titlu: "Schimbată la", cheie: "schimbat_la", cum: cand },
    { titlu: "Denumire", cheie: "denumire" },
    { titlu: "CUI", cheie: "cui" },
    { titlu: "Stadiu", cheie: "stadiu" },
    { titlu: "Persoană", cheie: "persoana" },
    { titlu: "E-mail", cheie: "email" },
    { titlu: "Telefon", cheie: "telefon" },
    { titlu: "Sumă estimată", cheie: "suma_estimata" },
    { titlu: "Încasat (lei)", cheie: "incasat_lei", cum: bani },
    { titlu: "De pe pagina", cheie: "cale" },
    { titlu: "Mesaj", cheie: "mesaj" },
  ],
  cereri: [
    { titlu: "Creată la", cheie: "creat_la", cum: cand },
    { titlu: "Schimbată la", cheie: "schimbat_la", cum: cand },
    { titlu: "Fel", cheie: "fel" },
    { titlu: "Stadiu", cheie: "stadiu" },
    { titlu: "Nume", cheie: "nume" },
    { titlu: "E-mail", cheie: "email" },
    { titlu: "Telefon", cheie: "telefon" },
    {
      titlu: "Detalii",
      cheie: "detalii",
      // `detalii` e JSON în baza de date; într-un tabel e mai de folos ca
      // „Localitate: Suceava · Mesaj: …" decât ca acolade.
      cum: (v) =>
        v && typeof v === "object"
          ? Object.entries(v as Record<string, unknown>)
              .map(([k, valoare]) => `${k}: ${valoare}`)
              .join(" · ")
          : (v ?? ""),
    },
  ],
};

const INTEROGARI: Record<ListaExport, string> = {
  donatii: `SELECT platita_la, creat_la, procesator, referinta,
                   (suma_bani::numeric / 100) AS suma, moneda, frecventa,
                   destinatie, campanie_slug, stare,
                   prenume, nume, email, telefon,
                   acord_buletin, adaugat_de, observatii
              FROM donatii
             ORDER BY COALESCE(platita_la, creat_la) DESC`,

  donatori: `SELECT d.email,
                    MAX(COALESCE(d.prenume, '')) AS prenume,
                    MAX(COALESCE(d.nume, ''))    AS nume,
                    MAX(COALESCE(d.telefon, '')) AS telefon,
                    COUNT(*)                     AS donatii,
                    (SUM(d.suma_bani) FILTER (WHERE d.moneda = 'RON')::numeric / 100)
                                                 AS total_lei,
                    MIN(d.platita_la)            AS prima,
                    MAX(d.platita_la)            AS ultima,
                    BOOL_OR(d.frecventa = 'lunar') AS are_lunara,
                    BOOL_OR(d.acord_buletin)       AS acord_buletin,
                    MAX(n.text)                    AS notita
               FROM donatii d
               LEFT JOIN note_donatori n ON n.email = d.email
              WHERE d.email IS NOT NULL AND d.stare = 'platita'
              GROUP BY d.email
              ORDER BY MAX(d.platita_la) DESC NULLS LAST`,

  firme: `SELECT creat_la, schimbat_la, denumire, cui, stadiu, persoana, email,
                 telefon, suma_estimata,
                 (suma_bani::numeric / 100) AS incasat_lei, cale, mesaj
            FROM firme
           ORDER BY schimbat_la DESC`,

  cereri: `SELECT creat_la, schimbat_la, fel, stadiu, nume, email, telefon, detalii
             FROM cereri
            ORDER BY creat_la DESC`,
};

export async function dateleListei(
  lista: ListaExport,
): Promise<{ antet: string[]; randuri: unknown[][] }> {
  const coloane = COLOANE[lista];
  const randuri = await intreaba<Record<string, unknown>>(INTEROGARI[lista]);

  return {
    antet: coloane.map((c) => c.titlu),
    randuri: randuri.map((r) =>
      coloane.map((c) => (c.cum ? c.cum(r[c.cheie]) : r[c.cheie])),
    ),
  };
}

/** Numele fișierului: lista și ziua, ca să nu se suprascrie în Descărcări. */
export function numeleFisierului(lista: ListaExport): string {
  const zi = new Date().toISOString().slice(0, 10);
  return `teona-${lista}-${zi}.csv`;
}
