import { cacheTag } from "next/cache";
import { cachePanou } from "./cache-panou";
import type { Cifra } from "@/date/asociatie";
import { areBazaDeDate, intreaba } from "./baza";

/**
 * Textele paginilor fixe, scrise de asociație.
 *
 * **Ultimul lucru care trecea neapărat prin mine.** Noutățile, campaniile,
 * descrierile taberelor, testimonialele, cifrele, documentele și siglele se
 * fac din panou. Paginile fixe — Despre noi, Casa Teona, Donează — aveau
 * textul în cod: o virgulă schimbată însemna un mesaj către mine și o
 * publicare.
 *
 * **Nimic nu se șterge.** Textul de acum rămâne scris aici, în `implicit`,
 * pentru totdeauna. Panoul salvează o schimbare ca rând nou în tabel; „Pune
 * textul de la început" șterge rândul ăla, nu textul — și se întoarce exact
 * ce scria înainte. Așa o greșeală de la ora unsprezece noaptea se repară cu
 * un apăsat, fără mine.
 *
 * **Lista e fixă.** Fiecare slot e un loc anume din pagină, cu numele lui.
 * Nu se adaugă secțiuni din panou: un text fără un loc în care să încapă ar
 * fi scris degeaba, iar cine l-a scris ar crede că l-a publicat.
 *
 * **Se schimbă ce scrie, nu cum arată.** Titlurile de secțiuni, fotografiile,
 * butoanele și așezarea rămân în cod. Rând gol = paragraf nou; atât. Vezi
 * `componente/pagina/TextScris.tsx` pentru de ce nu un editor bogat.
 */

/**
 * Locurile de completat cu cifre.
 *
 * Textul de la „De ce Asociația Teona Ariana" avea cifrele scrise de mână —
 * „33 de tabere", „1.500 de participanți". Caietul cere ca cifrele să fie
 * „aceleași peste tot […] preluate automat din aceleași date", iar scrise în
 * proză se învecheau în ziua în care asociația trecea la a 34-a tabără, fără
 * să observe nimeni.
 *
 * Acum se scrie `{tabere}` și cifra vine din panou. **Ce nu e în lista asta
 * rămâne exact cum a fost scris** — nu dispare și nu devine gol: un
 * `{tabre}` scris greșit se vede pe pagină, iar pagina din panou îl
 * semnalează înainte de salvare. Un loc necompletat care dispare în liniște
 * e felul în care o frază ajunge pe prima pagină fără jumătate din ea.
 */
export const LOCURI = ["tabere", "participanti", "copii", "voluntari"] as const;

/** Pune cifrele în locurile lor. Ordinea e cea din bandă. */
export function completeazaCifrele(
  text: string,
  cifre: ReadonlyArray<Cifra>,
): string {
  const mii = new Intl.NumberFormat("ro-RO");
  return text.replace(/\{([a-z]+)\}/g, (tot, nume) => {
    const unde = LOCURI.indexOf(nume as (typeof LOCURI)[number]);
    const cifra = unde === -1 ? undefined : cifre[unde];
    return cifra ? mii.format(cifra.valoare) : tot;
  });
}

export type Slot = {
  cheie: string;
  /** Pagina pe care apare, pentru gruparea din panou. */
  pagina: string;
  titlu: string;
  /** Un rând de lămurire, când locul nu e limpede din titlu. */
  ajutor?: string;
  /** Textul de acum, din cod. Rezerva, și ce se întoarce la „de la început". */
  implicit: string;
};

export const SLOTURI: ReadonlyArray<Slot> = [
  {
    cheie: "acasa.fraza",
    pagina: "Prima pagină",
    titlu: "Fraza de sub titlu",
    ajutor: "Primul lucru care se citește pe site. Două propoziții ajung.",
    implicit: `Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere, terapie prin joacă și consiliere. Alătură-te celor care schimbă vieți.`,
  },
  {
    cheie: "despre.antet",
    pagina: "Despre noi",
    titlu: "Fraza din capul paginii",
    implicit: `Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere, terapie prin joacă și consiliere.`,
  },
  {
    cheie: "despre.poveste.1",
    pagina: "Despre noi",
    titlu: "Povestea: „Cum am pornit”",
    ajutor: "Rând gol între paragrafe.",
    implicit: `Asociația Teona Ariana Suceava a luat ființă în ianuarie 2021. Am pornit la drum cu o idee simplă: copiii cu nevoi speciale și familiile lor merită să aibă, din când în când, un loc în care să se simtă bine exact așa cum sunt. Nu aveam planuri mari, ci dorința de a face ceva concret, împreună cu oameni care gândesc la fel, indiferent de confesiune sau de opinii, pentru că bucuria nu ține de nicio etichetă.

Așa au apărut taberele RESPIRO. Ne-am dorit să fie o pauză pentru copii și pentru părinții lor, și de la o tabără la alta au venit tot mai multe familii, tot mai mulți voluntari și tot mai multe prietenii. Acolo copiii se joacă, încearcă lucruri noi și se împrietenesc, iar părinții au timp să respire și să vorbească cu alți părinți. Din primele tabere am învățat ce contează cu adevărat: ritmul fiecărui copil, atenția și răbdarea.

Pe drum, ne-am dorit să ajungem și la alți copii. Am început să sprijinim copii din sistemul de protecție a copilului, cu rezultate școlare deosebite, ca un „bravo” concret pentru munca lor, și să oferim burse și sprijin educațional, pentru ca fiecare copil să-și poată urma visul.`,
  },
  {
    cheie: "despre.poveste.2",
    pagina: "Despre noi",
    titlu: "Povestea: „Casa Teona”",
    implicit: `Apoi ne-am dorit ca bucuria să nu fie doar o vacanță. Casa Teona a devenit locul în care copiii vin pe tot parcursul anului: terapii de grup, ateliere creative, meloterapie, stimulare senzorială, activități de socializare și consiliere pentru părinți. Toate sunt gratuite, iar terapia prin joacă este adaptată fiecărui copil.`,
  },
  {
    cheie: "despre.poveste.3",
    pagina: "Despre noi",
    titlu: "Povestea: „Respiro Împreună”",
    implicit: `În 2026 am organizat prima tabără pentru copiii care au trecut prin cancer și pentru familiile lor, Respiro Împreună, un pas pe care ni l-am dorit de mult și care ne-a arătat cât de mult mai putem face.

Motto-ul nostru, „Nimic fără Dumnezeu”, ne amintește că tot ce am realizat s-a născut din încredere, din bunătate și din faptul că am fost împreună.

Povestea noastră continuă. Dacă vrei să faci parte din ea, te așteptăm.`,
  },
  {
    cheie: "despre.misiune",
    pagina: "Despre noi",
    titlu: "Misiune",
    implicit: `Aducem bucurie și sprijin copiilor cu nevoi speciale, copiilor care au trecut prin cancer și celor din medii defavorizate, prin tabere, joacă și consiliere pentru întreaga familie.`,
  },
  {
    cheie: "despre.viziune",
    pagina: "Despre noi",
    titlu: "Viziune",
    implicit: `O comunitate în care fiecare copil, indiferent de dificultățile sale sau de condițiile în care s-a născut, are șansa să se joace, să învețe și să viseze liber, iar fiecare părinte știe că nu e singur.`,
  },
  {
    cheie: "despre.voluntari",
    pagina: "Despre noi",
    titlu: "Culegătorii de Zâmbete",
    ajutor: "Primul paragraf; al doilea, cu îndemnul, rămâne în pagină.",
    implicit: `Voluntarii sunt o parte esențială a activităților noastre. În tabere și la Casa Teona se joacă cu copiii, îi însoțesc pe parcursul zilei, ajută la organizare și îi sprijină pe părinți. Datorită lor, fiecare copil primește atenția de care are nevoie, iar activitățile se desfășoară în siguranță și cu bucurie.`,
  },
  {
    cheie: "casa.antet",
    pagina: "Casa Teona",
    titlu: "Fraza din capul paginii",
    implicit: `Un loc unde copiii cu nevoi speciale învață prin joacă, iar părinții găsesc consiliere și sprijin.`,
  },
  {
    cheie: "casa.bloc.1",
    pagina: "Casa Teona",
    titlu: "Jocuri și ateliere",
    implicit: `Zilele la Casa Teona sunt pline de activități. Copiii se joacă prin jocuri senzoriale, care îi ajută să-și descopere simțurile și să se liniștească. Desenează, pictează și lucrează în ateliere creative, unde contează mai mult cât se bucură decât cât de bine le iese. Învață prin joacă, pentru că așa învață cel mai bine, și își fac prieteni cu care se simt în largul lor.`,
  },
  {
    cheie: "casa.bloc.2",
    pagina: "Casa Teona",
    titlu: "Petreceri",
    implicit: `Pentru mulți dintre copiii noștri, o petrecere obișnuită nu e ușor de organizat, iar aici găsesc un spațiu al lor, cu baloane, tort și oameni care se bucură împreună cu ei. Pentru un copil, să se simtă sărbătorit contează foarte mult.`,
  },
  {
    cheie: "casa.bloc.3",
    pagina: "Casa Teona",
    titlu: "Întâlnirile cu părinții",
    implicit: `Părinții sunt la fel de importanți ca și copiii. Mulți dintre ei duc zilnic o încărcătură pe care puțini o văd. De aceea, la Casa Teona au loc întâlniri de terapie de grup pentru părinți, în care pot vorbi deschis despre ce îi preocupă, pot primi consiliere și pot descoperi că alți părinți trec prin aceleași lucruri. Uneori, simplul fapt de a fi ascultat și înțeles face o mare diferență.

Casa Teona înseamnă, în același timp, joacă, încredere, sprijin și apartenență la o comunitate. Este locul în care copiii pot fi copii, iar părinții pot respira. Dacă vrei să ne cunoști mai bine, să ne vizitezi sau să ne sprijini, ne bucurăm să te primim.`,
  },
  {
    cheie: "doneaza.antet",
    pagina: "Donează",
    titlu: "Fraza din capul paginii",
    implicit: `Alege modul care ți se potrivește. Donația ta ne ajută enorm să oferim în continuare sprijin celor care au atât de mare nevoie.`,
  },
  {
    cheie: "voluntar.antet",
    pagina: "Devino voluntar",
    titlu: "Fraza din capul paginii",
    implicit: `Implică-te activ, schimbă vieți! Alătură-te Culegătorilor de Zâmbete și fii alături de copiii cu nevoi speciale și de familiile lor, în tabere, la Casa Teona și la alte activități ale asociației.`,
  },
  {
    cheie: "redirectionare.antet",
    pagina: "Redirecționează 3,5%",
    titlu: "Fraza din capul paginii",
    implicit: `Nu te costă nimic în plus. Tu alegi unde ajunge o parte din impozitul pe venit.`,
  },
  {
    cheie: "redirectionare.de-ce",
    pagina: "Redirecționează 3,5%",
    titlu: "„De ce Asociația Teona Ariana”",
    ajutor: "Aici sunt locuri de completat cu cifre — vezi mai sus.",
    implicit: `În zilele de tabără, copiii se joacă, își fac prieteni și prind curaj, înconjurați de oameni care îi înțeleg și îi încurajează. Până acum, cele {tabere} de tabere au adunat peste {participanti} de participanți.

În restul anului, Casa Teona este locul în care peste {copii} de copii vin la ateliere și jocuri, iar familiile lor primesc sfaturi și sprijin.

Redirecționarea ta ajunge exact aici: în zilele de tabără și în fiecare zi de după ele.`,
  },
  {
    cheie: "firme.antet",
    pagina: "Direcționează 20%",
    titlu: "Fraza din capul paginii",
    implicit: `Firma ta poate susține copiii noștri, fără costuri suplimentare față de impozitul pe care îl plătește oricum.`,
  },
  {
    cheie: "sponsori.antet",
    pagina: "Sponsori și parteneri",
    titlu: "Fraza din capul paginii",
    implicit: `Mulțumim companiilor care ne sunt alături.`,
  },
] as const;

export function slotDupaCheie(cheie: string): Slot | undefined {
  return SLOTURI.find((s) => s.cheie === cheie);
}

/** Paginile, în ordinea în care apar în panou. */
export function paginiCuTexte(): string[] {
  return [...new Set(SLOTURI.map((s) => s.pagina))];
}

const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS texte_pagini (
    cheie       text PRIMARY KEY,
    continut    text NOT NULL,
    schimbat_la timestamptz NOT NULL DEFAULT now()
  );
`;

let gata: Promise<void> | null = null;

/**
 * Tabelul nu se seamănă.
 *
 * La testimoniale și la cifre, sămânța se pune o dată. Aici nu: un rând
 * înseamnă „asociația a schimbat textul ăsta". Fără rând, se folosește cel
 * din cod. Așa „Pune textul de la început" e o ștergere de rând, nu o
 * rescriere — iar textul de pornire nu se poate pierde niciodată.
 */
async function pregateste(): Promise<void> {
  gata ??= (async () => {
    await intreaba(DEFINITIE);
  })().catch((eroare) => {
    gata = null;
    throw eroare;
  });
  return gata;
}

/** Eticheta cache-ului. Se golește la fiecare schimbare din panou. */
export const ETICHETA_TEXTE_PAGINI = "texte-pagini";

/** Textele din cod, pe cheie. Rezerva. */
const DIN_COD: Readonly<Record<string, string>> = Object.fromEntries(
  SLOTURI.map((s) => [s.cheie, s.implicit]),
);

async function citeste(): Promise<Record<string, string>> {
  await pregateste();
  const randuri = await intreaba<{ cheie: string; continut: string }>(
    "SELECT cheie, continut FROM texte_pagini",
  );
  const ale: Record<string, string> = { ...DIN_COD };
  for (const r of randuri) {
    if (r.cheie in DIN_COD) ale[r.cheie] = r.continut;
  }
  return ale;
}

/**
 * Toate textele paginilor, cu cele din cod acolo unde asociația n-a schimbat
 * nimic.
 *
 * Prinderea erorii stă **înăuntrul** funcției cu „use cache": din afară nu se
 * mai poate prinde, iar o publicare întreagă ar cădea. Vezi CLAUDE.md,
 * „Railway construiește cu baza de date pusă, dar nu accesibilă".
 */
export async function textelePaginilor(): Promise<
  Readonly<Record<string, string>>
> {
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_TEXTE_PAGINI);
  if (!areBazaDeDate()) return DIN_COD;
  return citeste().catch(() => DIN_COD);
}

/** Lista pentru panou: textul de acum și dacă e schimbat sau cel din cod. */
export async function textePanou(): Promise<
  Array<Slot & { continut: string; schimbat: boolean }>
> {
  if (!areBazaDeDate()) {
    return SLOTURI.map((s) => ({
      ...s,
      continut: s.implicit,
      schimbat: false,
    }));
  }
  await pregateste();
  const randuri = await intreaba<{ cheie: string; continut: string }>(
    "SELECT cheie, continut FROM texte_pagini",
  );
  const ale = new Map(randuri.map((r) => [r.cheie, r.continut]));
  return SLOTURI.map((s) => ({
    ...s,
    continut: ale.get(s.cheie) ?? s.implicit,
    schimbat: ale.has(s.cheie),
  }));
}

export async function schimbaTextPagina(
  cheie: string,
  continut: string,
): Promise<boolean> {
  if (!slotDupaCheie(cheie)) return false;
  await pregateste();
  const randuri = await intreaba<{ cheie: string }>(
    `INSERT INTO texte_pagini (cheie, continut) VALUES ($1, $2)
     ON CONFLICT (cheie) DO UPDATE
       SET continut = $2, schimbat_la = now()
     RETURNING cheie`,
    [cheie, continut],
  );
  return randuri.length > 0;
}

/**
 * Pune înapoi textul de la început.
 *
 * Se șterge rândul din tabel, nu textul: cel din cod e tot acolo și se
 * întoarce întreg. Asta e tot rostul felului în care e făcut tabelul.
 */
export async function readuTextPagina(cheie: string): Promise<boolean> {
  if (!slotDupaCheie(cheie)) return false;
  await pregateste();
  await intreaba("DELETE FROM texte_pagini WHERE cheie = $1", [cheie]);
  return true;
}
