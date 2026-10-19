import { cacheLife, cacheTag } from "next/cache";
import { PREFIX_CLOUD } from "./cloud";
import { PE_PRIMA_PAGINA, SIGLE_SPONSORI, type Sigla } from "@/date/sponsori";
import { areBazaDeDate, intreaba } from "./baza";

/**
 * Siglele sponsorilor, adăugate de asociație.
 *
 * **De ce ies din cod.** Întrebarea e a lor, pusă în octombrie 2026: „La
 * Sponsori o să pot și eu adăuga ulterior sigle? Ei sunt mai mulți decât apar
 * acum pe site." Caietul cere la 6.3 să se adauge „și alte sigle ale
 * sponsorilor care au mai apărut pe parcurs (de trimis de la asociație)" —
 * adică, până acum, trimise mie.
 *
 * O siglă nouă e cel mai mic lucru pe care și-l poate dori cineva de la un
 * site, și era printre cele care treceau neapărat prin dezvoltator. Un sponsor
 * care sună în decembrie să întrebe de ce nu apare pe site e o discuție pe
 * care asociația o are degeaba.
 *
 * **Sigla cere un nume.** Fără el, textul alternativ ar fi „siglă de sponsor",
 * care nu spune nimic nimănui, și n-am avea ce scrie sub ea. Regula e de
 * dinainte, din `date/sponsori.ts`, și rămâne.
 *
 * **Două feluri de cale, un singur câmp.** Cele 36 de sigle moștenite sunt
 * fișiere din depozit (`/poze/2024/11/…`); cele adăugate din panou stau în
 * Cloudinary și se scriu `/cloud/<identificator>`, convenția care există deja
 * pentru pozele scrise din panou. `next/image` le tratează la fel, prin
 * încărcătorul din `incarcator-imagini.ts`.
 *
 * **Sămânța se pune o singură dată**, și numai dacă tabelul e gol — ca la
 * testimoniale. Altfel o siglă scoasă de asociație ar învia la următoarea
 * pornire.
 *
 * **Rezerva sunt siglele din cod**, nu o listă goală: o bandă „Ne susțin" fără
 * nimic în ea, pe prima pagină, spune despre asociație că n-are sponsori.
 */

export type SiglaPanou = Sigla & {
  id: string;
  activ: boolean;
  ordine: number;
};

const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS sponsori (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nume        text NOT NULL,
    cale        text NOT NULL,
    adresa      text,
    activ       boolean NOT NULL DEFAULT true,
    ordine      integer NOT NULL DEFAULT 0,
    creat_la    timestamptz NOT NULL DEFAULT now(),
    schimbat_la timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS sponsori_afisati
    ON sponsori (activ, ordine, creat_la);
`;

let gata: Promise<void> | null = null;

const COLOANE = "id, nume, cale, adresa, activ, ordine";

async function pregateste(): Promise<void> {
  gata ??= (async () => {
    await intreaba(DEFINITIE);
    const [{ cate }] = await intreaba<{ cate: string }>(
      "SELECT count(*)::text AS cate FROM sponsori",
    );
    if (Number(cate) > 0) return;
    for (const [i, s] of SIGLE_SPONSORI.entries()) {
      await intreaba(
        `INSERT INTO sponsori (nume, cale, adresa, ordine)
         VALUES ($1, $2, $3, $4)`,
        [s.nume, s.cale, s.adresa ?? null, i],
      ).catch(() => undefined);
    }
  })().catch((eroare) => {
    gata = null;
    throw eroare;
  });
  return gata;
}

/** Eticheta cache-ului. Se golește la fiecare schimbare din panou. */
export const ETICHETA_SPONSORI = "sponsori";

/** Câte sigle intră în banda de pe prima pagină. Scris în `date/sponsori.ts`. */
export { PE_PRIMA_PAGINA };

type Rand = {
  id: string;
  nume: string;
  cale: string;
  adresa: string | null;
  activ: boolean;
  ordine: number;
};

function catreSigla(r: Rand): Sigla {
  return { nume: r.nume, cale: r.cale, adresa: r.adresa ?? undefined };
}

async function citesteActive(): Promise<Sigla[]> {
  await pregateste();
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM sponsori WHERE activ ORDER BY ordine, creat_la`,
  );
  return randuri.map(catreSigla);
}

/**
 * Siglele de pe site, în ordinea aleasă.
 *
 * Prinderea erorii stă **înăuntrul** funcției cu „use cache": din afară nu se
 * mai poate prinde, iar o publicare întreagă ar cădea. Vezi CLAUDE.md,
 * „Railway construiește cu baza de date pusă, dar nu accesibilă".
 */
export async function sigleSponsori(): Promise<ReadonlyArray<Sigla>> {
  "use cache";
  cacheLife("hours");
  cacheTag(ETICHETA_SPONSORI);
  if (!areBazaDeDate()) return SIGLE_SPONSORI;
  const ale = await citesteActive().catch(() => []);
  return ale.length > 0 ? ale : SIGLE_SPONSORI;
}

/** Cele care intră în banda de pe prima pagină. */
export async function siglePrimaPagina(): Promise<ReadonlyArray<Sigla>> {
  return (await sigleSponsori()).slice(0, PE_PRIMA_PAGINA);
}

/** Toate, inclusiv cele oprite: lista din panou. */
export async function sponsoriPanou(): Promise<SiglaPanou[]> {
  if (!areBazaDeDate()) return [];
  await pregateste();
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM sponsori ORDER BY activ DESC, ordine, creat_la`,
  );
  return randuri.map((r) => ({
    ...catreSigla(r),
    id: r.id,
    activ: r.activ,
    ordine: r.ordine,
  }));
}

/** Adaugă o siglă. `pozaId` e identificatorul din Cloudinary. */
export async function faceSponsor(date: {
  nume: string;
  pozaId: string;
  adresa?: string | null;
}): Promise<boolean> {
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `INSERT INTO sponsori (nume, cale, adresa, ordine)
     VALUES ($1, $2, $3,
       COALESCE((SELECT max(ordine) + 1 FROM sponsori), 0))
     RETURNING id`,
    [
      date.nume.trim(),
      `${PREFIX_CLOUD}${date.pozaId}`,
      date.adresa?.trim() || null,
    ],
  );
  return randuri.length > 0;
}

/** Schimbă numele și adresa. Sigla în sine se înlocuiește urcând alta. */
export async function schimbaSponsor(
  id: string,
  date: { nume: string; adresa?: string | null },
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE sponsori SET nume = $2, adresa = $3, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, date.nume.trim(), date.adresa?.trim() || null],
  );
  return randuri.length > 0;
}

/**
 * O scoate de pe site sau o pune înapoi.
 *
 * Nu se șterge: un sponsor de anul trecut rămâne un sponsor de anul trecut, iar
 * dacă revine, sigla lui e tot acolo. Ștergerea ar duce și fișierul din
 * Cloudinary la o a doua urcare, cu alt identificator, degeaba.
 */
export async function schimbaStareaSponsorului(
  id: string,
  activ: boolean,
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE sponsori SET activ = $2, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, activ],
  );
  return randuri.length > 0;
}

/**
 * Mută o siglă mai sus sau mai jos.
 *
 * Ordinea contează: pe prima pagină intră primele douăsprezece. Fără un fel de
 * a le muta, un sponsor nou ar rămâne pe veci al 37-lea — adică nevăzut de
 * nimeni care nu deschide pagina de sponsori.
 */
export async function mutaSponsor(
  id: string,
  incotro: "sus" | "jos",
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await pregateste();

  /*
    Aceeași ordine ca în panou: cele de pe site întâi, cele scoase după.
    Altfel indicele din pagină nu e indicele de aici.
  */
  const toate = await intreaba<{ id: string; activ: boolean }>(
    "SELECT id, activ FROM sponsori ORDER BY activ DESC, ordine, creat_la",
  );
  const acesta = toate.find((s) => s.id === id);
  if (!acesta) return false;

  /*
    Se mută **între siglele la fel de vizibile**, nu peste cele ascunse.

    Prima variantă schimba locul cu vecinul din lista întreagă. Dacă vecinul
    era o siglă scoasă de pe site, schimbul se făcea în baza de date și **pe
    site nu se vedea nimic**: omul apăsa „sus" o dată, nu se mișca nimic, și
    conchidea că butonul e stricat. Cu douăzeci de sigle scoase, ar fi trebuit
    să apese douăzeci de ori.

    Grupurile sunt lipite în ordinea de mai sus, deci bucata se scoate, se
    rearanjează în ea și se pune la loc pe aceleași poziții.
  */
  const deLa = toate.findIndex((s) => s.activ === acesta.activ);
  const grup = toate.filter((s) => s.activ === acesta.activ);
  const unde = grup.findIndex((s) => s.id === id);
  const vecin = incotro === "sus" ? unde - 1 : unde + 1;
  if (vecin < 0 || vecin >= grup.length) return false;
  [grup[unde], grup[vecin]] = [grup[vecin], grup[unde]];

  /*
    Ordinea se rescrie întreagă, nu se schimbă două valori între ele.

    Rândurile moștenite pot avea ordini egale sau cu goluri, iar un schimb de
    două valori ar lăsa două sigle pe aceeași poziție — și atunci ordinea
    depinde de `creat_la`, deci apăsarea n-ar face nimic vizibil.
  */
  const rearanjat = [...toate];
  rearanjat.splice(deLa, grup.length, ...grup);
  for (const [i, s] of rearanjat.entries()) {
    await intreaba("UPDATE sponsori SET ordine = $2 WHERE id = $1", [s.id, i]);
  }
  return true;
}
