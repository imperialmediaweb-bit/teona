import { cacheTag } from "next/cache";
import { cachePanou } from "./cache-panou";
import { CIFRE, type Cifra } from "@/date/asociatie";
import { areBazaDeDate, intreaba } from "./baza";

/**
 * Cifrele asociației: 33 de tabere, 1.500+ participanți, 80+ copii, 300+ voluntari.
 *
 * **De ce ies din cod.** Caietul de sarcini le cere la pagina 1, printre
 * regulile valabile pe tot site-ul: „Cifrele sunt aceleași peste tot […]
 * **Asociația le poate modifica singură.**" Până acum stăteau în
 * `date/asociatie.ts`, adică la mine: a 34-a tabără însemna un mesaj către
 * mine și o publicare.
 *
 * **Se schimbă într-un loc și se schimbă peste tot.** Caietul cere asta pe
 * față — „preluată automat din aceleași date, ca să nu apară variante
 * diferite". Deci nu doar banda de pe prima pagină: și pagina Despre noi, și
 * cea de 3,5%, și ce știe asistentul de pe site, și ce primește modelul când
 * scrie o ciornă, și șablonul de e-mail, și `llms.txt`.
 *
 * **Rezerva e `CIFRE`, nu o listă goală.** Dacă baza nu răspunde — la build,
 * de pildă, când rețeaua privată a Railway nu se rezolvă — paginile arată
 * cifrele verificate din cod, nu o bandă fără nimic. Cifrele astea nu sunt
 * decor: o bandă goală pe prima pagină spune despre asociație că n-a făcut
 * nimic.
 *
 * **Prinderea erorii stă înăuntrul funcției cu „use cache".** Din afară nu se
 * mai poate prinde, și o publicare întreagă cade. Vezi CLAUDE.md, „Railway
 * construiește cu baza de date pusă, dar nu accesibilă".
 */

/** Tipul stă în `date/asociatie.ts`, ca să-l poată citi și browserul. */
export type { Cifra };

/** Eticheta cache-ului. Se golește când asociația schimbă o cifră. */
export const ETICHETA_CIFRE = "cifre";

const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS cifre (
    ordine      integer PRIMARY KEY,
    valoare     integer NOT NULL,
    sufix       text NOT NULL DEFAULT '',
    eticheta    text NOT NULL,
    schimbat_la timestamptz NOT NULL DEFAULT now()
  );
`;

let gata: Promise<void> | null = null;

/**
 * Sămânța se pune o singură dată, și numai dacă tabelul e gol.
 *
 * Ca la testimoniale și la lista de presă: altfel o cifră schimbată de
 * asociație ar fi dusă înapoi la valoarea din cod la fiecare pornire, iar
 * omul ar crede că panoul nu-l ascultă.
 */
async function pregateste(): Promise<void> {
  gata ??= (async () => {
    await intreaba(DEFINITIE);
    const [{ cate }] = await intreaba<{ cate: string }>(
      "SELECT count(*)::text AS cate FROM cifre",
    );
    if (Number(cate) > 0) return;
    for (const [i, c] of CIFRE.entries()) {
      await intreaba(
        `INSERT INTO cifre (ordine, valoare, sufix, eticheta)
         VALUES ($1, $2, $3, $4) ON CONFLICT (ordine) DO NOTHING`,
        [i, c.valoare, c.sufix, c.eticheta],
      ).catch(() => undefined);
    }
  })().catch((eroare) => {
    gata = null;
    throw eroare;
  });
  return gata;
}

/** Cifrele din cod, ca tip al nostru. Rezerva, și sămânța. */
export const CIFRE_DIN_COD: ReadonlyArray<Cifra> = CIFRE.map((c) => ({
  valoare: c.valoare,
  sufix: c.sufix,
  eticheta: c.eticheta,
}));

async function citeste(): Promise<Cifra[]> {
  await pregateste();
  return intreaba<Cifra>(
    "SELECT valoare, sufix, eticheta FROM cifre ORDER BY ordine",
  );
}

/**
 * Cifrele de arătat. Citite din panou, cu cele din cod ca rezervă.
 *
 * Întoarce întotdeauna patru cifre: nicio pagină n-are de verificat dacă are
 * ce afișa.
 */
export async function cifreSite(): Promise<ReadonlyArray<Cifra>> {
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_CIFRE);
  if (!areBazaDeDate()) return CIFRE_DIN_COD;
  const ale = await citeste().catch(() => []);
  return ale.length === CIFRE_DIN_COD.length ? ale : CIFRE_DIN_COD;
}

/** Lista pentru panou. Aici lipsa bazei de date se vede, nu se acoperă. */
export async function cifrePanou(): Promise<Cifra[]> {
  if (!areBazaDeDate()) return [...CIFRE_DIN_COD];
  await pregateste();
  return citeste();
}

/**
 * Schimbă cele patru cifre.
 *
 * Etichetele se schimbă și ele: „participanți" poate deveni „copii în tabere"
 * fără să treacă prin mine. Dar numărul de rânduri rămâne patru — banda e
 * desenată pentru patru, iar a cincea ar rupe rândul pe telefon.
 */
export async function schimbaCifrele(cifre: Cifra[]): Promise<boolean> {
  if (cifre.length !== CIFRE_DIN_COD.length) return false;
  await pregateste();
  for (const [i, c] of cifre.entries()) {
    await intreaba(
      `UPDATE cifre SET valoare = $2, sufix = $3, eticheta = $4,
         schimbat_la = now() WHERE ordine = $1`,
      [i, c.valoare, c.sufix, c.eticheta],
    );
  }
  return true;
}
