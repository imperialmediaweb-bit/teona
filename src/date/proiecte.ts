import { cacheRezerva } from "@/lib/cache-panou";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pozaLocala, proiecte as proiecteBrute } from "@/lib/continut";
import { curataTitlu, faSlug } from "@/lib/slug-proiecte.mjs";
import { PROIECTE_SCRISE } from "./proiecte-scrise";
import { CATEGORII as CATEGORIILE } from "./proiecte-tipuri";
import type { IdCategorie, ProiectAfisat } from "./proiecte-tipuri";
import { cacheLife, cacheTag } from "next/cache";
import { areBazaDeDate } from "@/lib/baza";
import { textePublicate, textPublicat, type Text as TextPanou } from "@/lib/texte";
import { PREFIX_CLOUD } from "@/lib/cloud";

export { CATEGORII } from "./proiecte-tipuri";
export type { IdCategorie, ProiectAfisat } from "./proiecte-tipuri";

/**
 * Proiectele, pregătite pentru pagina Proiecte (capitolul 5 din caiet).
 *
 * Trei lucruri se întâmplă aici, și fiecare are un motiv:
 *
 * 1. **Titlurile se curăță.** În WordPress erau titluri de postare de
 *    Facebook, cu emoji în mijloc („…autism🪐 04-08 septembrie 2023”). Unul
 *    dintre ele folosea chiar piesa de puzzle — simbol respins de comunitatea
 *    autistă și evitat peste tot pe site-ul ăsta.
 *
 * 2. **Slugurile se regenerează.** Cele din export erau tăiate la 40 de
 *    caractere, așa că nouă proiecte diferite aveau toate slugul
 *    `tabara-respiro-dedicata-copiilor-cu-auti`. Aici slugul se face din titlu
 *    plus data, deci e unic și stabil.
 *
 * 3. **Textele NU se preiau.** Sunt postări de Facebook importate cu tot cu
 *    marcajul `[ad_1]`, iar mai multe conțin nume de familii, localități și
 *    diagnostice ale unor copii. Caietul interzice explicit publicarea lor:
 *    „La Cazuri umanitare nu se publică nume și nici diagnostice.” Descrierile
 *    de două-trei fraze le scrie asociația, din listele pe care urmează să ni
 *    le trimită. Până atunci, un proiect are titlu, dată, categorie și poze.
 */

/** Categoriile vechi din WordPress care înseamnă „caz umanitar”. */
const CATEGORII_UMANITARE = new Set(["Cazuri medicale", "Strângere Fonduri"]);

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

function dataCitita(iso: string): string {
  const [an, luna, zi] = iso.slice(0, 10).split("-").map(Number);
  return `${zi} ${LUNI[luna - 1]} ${an}`;
}

/**
 * Calea unei poze, dacă fișierul chiar există pe disc.
 *
 * WordPress genera pentru fiecare imagine mai multe mărimi
 * (`…_n-1024x485.jpg`), iar unele proiecte trimit la o astfel de variantă, nu
 * la original. Variantele n-au fost descărcate toate, așa că una dintre ele
 * cerea un fișier inexistent: galeria proiectului „Prima tabără Respiro”
 * afișa un pătrat gol, iar serverul răspundea 404.
 *
 * Aici, dacă varianta lipsește, cădem pe originalul fără sufixul de mărime.
 * Dacă nici el nu există, poza iese din listă: mai bine o galerie cu o poză
 * mai puțin decât un dreptunghi gol pe pagină.
 */
function pozaCareExista(cale: string | null): string | null {
  if (!cale) return null;
  const peDisc = (c: string) => existsSync(join(process.cwd(), "public", c));
  if (peDisc(cale)) return cale;

  const original = cale.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, "$1");
  return original !== cale && peDisc(original) ? original : null;
}

/** Proiectele preluate, curățate și cu slug unic. */
/** Cele cu `inFata` stau primele; restul, cronologic, cea mai nouă prima. */
function inOrdine(a: ProiectAfisat, b: ProiectAfisat): number {
  if (Boolean(a.inFata) !== Boolean(b.inFata)) return a.inFata ? -1 : 1;
  return b.data.localeCompare(a.data);
}

export function proiecteAfisate(): ProiectAfisat[] {
  // Slugurile scrise de mână se rezervă primele: dacă vreodată un proiect din
  // export ar genera același slug, el primește sufixul cu data, nu invers.
  // Altfel o adresă deja trimisă într-un e-mail ar ajunge pe alt proiect.
  const folosite = new Set<string>(PROIECTE_SCRISE.map((p) => p.slug));

  /*
    Un proiect scris de mână îl înlocuiește pe cel din export, nu i se adaugă.

    „Prima tabără Respiro" exista deja din exportul WordPress, cu titlu, dată
    și o fotografie, dar fără descriere. Când asociația a trimis textul, el a
    intrat în `PROIECTE_SCRISE` cu același slug — iar fără rândul de mai jos,
    cel din export ar fi rămas în listă cu slugul plus data, deci aceeași
    tabără ar fi apărut de două ori, o dată cu text și o dată fără.

    Potrivirea se face pe titlul curățat, nu pe slug: slugul export-ului se
    schimbă singur când se ciocnește, titlul nu.
  */
  const titluriScrise = new Set(PROIECTE_SCRISE.map((p) => p.titlu));

  const dinExport = proiecteBrute()
    .filter((proiect) => !titluriScrise.has(curataTitlu(proiect.titlu)))
    .map((proiect): ProiectAfisat => {
      const titlu = curataTitlu(proiect.titlu);
      const data = proiect.data.slice(0, 10);
      const an = Number(data.slice(0, 4));

      // Slug unic: titlul curățat, plus anul dacă titlul singur se repetă.
      let slug = faSlug(titlu);
      if (folosite.has(slug)) slug = `${slug}-${data}`;
      folosite.add(slug);

      const umanitar = proiect.categorii.some((c) =>
        CATEGORII_UMANITARE.has(c),
      );
      const categorie: IdCategorie = umanitar
        ? "umanitare"
        : an >= 2026
          ? "2026"
          : an === 2025
            ? "2025"
            : "2021-2024";

      const poze = proiect.poze
        .map(pozaLocala)
        .map(pozaCareExista)
        .filter((p): p is string => Boolean(p));

      return {
        slug,
        titlu,
        data,
        dataCitita: dataCitita(data),
        categorie,
        coperta:
          pozaCareExista(pozaLocala(proiect.pozaPrincipala)) ?? poze[0] ?? null,
        poze,
      };
    });

  return [...PROIECTE_SCRISE, ...dinExport].sort(inOrdine);
}

export function proiectDupaSlug(slug: string): ProiectAfisat | undefined {
  return proiecteAfisate().find((p) => p.slug === slug);
}

/**
 * Proiectele scrise din panou, aduse în forma celorlalte.
 *
 * O tabără adăugată de asociație arată pe site exact ca una scrisă în cod:
 * aceeași pagină, aceeași galerie, același loc în listă. Diferența e numai de
 * unde vine, iar asta nu trebuie să se vadă nicăieri.
 */
/** Eticheta cache-ului, golită la fiecare salvare din panou. */
export const ETICHETA_PROIECTE_PANOU = "proiecte-din-panou";

async function dinPanou(): Promise<ProiectAfisat[]> {
  /*
    Cachéul nu e aici pentru viteză, ci ca citirea să fie îngăduită la
    pregenerare: fără el, Next oprește construirea cu „uncached or runtime
    data during prerendering".

    Dar un cache pe minute înseamnă că omul publică o descriere și n-o vede —
    adică exact purtarea care îl face să creadă că panoul e stricat. De aceea
    poartă etichetă, iar ruta care salvează o golește: publicarea se vede pe
    loc, nu la expirare.
  */
  "use cache";
  cacheLife("hours");
  cacheTag(ETICHETA_PROIECTE_PANOU);
  // Railway construiește fără acces la bază: lista goală de la build se ținea
  // o oră, timp în care taberele scrise din panou dispăreau de pe /proiecte
  // și paginile lor dădeau 404 (auditul din 4 noiembrie 2026). Rezerva nu se
  // ține: primul vizitator după publicare o reîmprospătează.
  if (!areBazaDeDate()) {
    cacheRezerva();
    return [];
  }

  const texte = await textePublicate("proiect", 300).catch(() => null);
  if (texte === null) {
    cacheRezerva();
    return [];
  }
  return texte.map(dinText);
}

/** Un text de fel „proiect”, din panou, în forma pe care o afișează site-ul. */
function dinText(t: TextPanou): ProiectAfisat {
  return {
    slug: t.slug,
    titlu: t.titlu,
    // Fără dată de început, data publicării ține locul doar la ordonare.
    data: t.dataInceput ?? (t.publicatLa ?? "").slice(0, 10),
    dataCitita: t.dataCitita,
    categorie: (CATEGORIILE.find((c) => c.id === t.categorie)?.id ??
      "2026") as IdCategorie,
    coperta: t.poza ? `${PREFIX_CLOUD}${t.poza.id}` : null,
    poze: [],
    dosarCloud: t.dosarCloud ?? undefined,
    areDataScrisa: Boolean(t.dataInceput),
    areCategorieScrisa: Boolean(t.categorie),
    descriere: t.continut
      .split(/(?:\r?\n){2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

/**
 * Toate proiectele: cele din cod, cele din export și cele scrise din panou.
 *
 * Asincronă pentru că ultimele vin din baza de date. `proiecteAfisate()`
 * rămâne sincronă și e folosită acolo unde nu se poate aștepta — la
 * generarea paginilor dinainte, de pildă — iar asta se folosește peste tot
 * unde lista trebuie să fie completă.
 */
export async function proiecteleToate(): Promise<ProiectAfisat[]> {
  const panou = await dinPanou();
  // Un slug scris din panou îl bate pe cel din cod: dacă asociația rescrie o
  // tabără, versiunea ei e cea bună.
  const ale = new Set(panou.map((p) => p.slug));
  const dinCod = proiecteAfisate();
  /*
    Ce scrie panoul se pune peste tabăra veche (`peste`, mai jos).
  */
  const imbinate = panou.map((p) =>
    peste(p, dinCod.find((v) => v.slug === p.slug)),
  );
  // Aceeași ordine ca în `proiecteAfisate`: cele cu `inFata` primele, restul
  // cronologic. Sortarea era scrisă de două ori, iar a doua rămăsese fără
  // `inFata` — pagina Proiecte, care trece pe aici, nu-l asculta deloc.
  return [...imbinate, ...dinCod.filter((p) => !ale.has(p.slug))].sort(
    inOrdine,
  );
}

/**
 * Un proiect, căutat întâi în cod și abia apoi în baza de date.
 *
 * **Ordinea nu e o optimizare, e ce face construirea posibilă.** Paginile
 * proiectelor din cod se pregătesc dinainte, la publicare. Dacă s-ar întreba
 * baza de date pentru fiecare, Next oprește construirea: „uncached or runtime
 * data during prerendering" — exact eroarea care a picat trei publicări la
 * rând. Căutarea sincronă răspunde pentru toate cele din cod fără să atingă
 * baza de date, deci pregenerarea merge mai departe; se întreabă numai pentru
 * un slug care nu e în cod, adică pentru o tabără adăugată din panou, iar
 * pagina aia se randează oricum la cerere.
 *
 * Local eroarea nu se vedea: construiam fără `DATABASE_URL`, iar atunci
 * `areBazaDeDate()` e fals și nu se întreabă nimic. Pe Railway variabila
 * există și la construire. De aceea proba de construire o pune și ea.
 */
export async function proiectDupaSlugPeste(
  slug: string,
): Promise<ProiectAfisat | undefined> {
  /*
    Panoul bate codul, și aici, nu doar în listă.

    Până acum pagina unei tabere se oprea la prima potrivire din cod, în timp
    ce `proiecteleToate()` lăsa textul din panou să câștige. Ieșea pe dos:
    în listă se vedea titlul scris de asociație, iar pagina lui arăta
    descrierea mea. Pentru cine voia să rescrie descrierea unei tabere, asta
    însemna că scrie degeaba.

    Întrebarea către baza de date se poate face și la pregenerare de când
    `dinPanou()` e un „use cache": eroarea de dinainte — „uncached or runtime
    data during prerendering" — venea din citirea necachată, nu din citirea
    în sine. Cu cache, Next o pregenerează cu ce era la construire și o
    împrospătează singur după.
  */
  const alLor = areBazaDeDate()
    ? (await dinPanou()).find((p) => p.slug === slug)
    : undefined;
  if (alLor) return peste(alLor, proiectDupaSlug(slug));
  const dinCod = proiectDupaSlug(slug);
  if (dinCod) return dinCod;
  /*
    Nici în lista ținută, nici în cod — dar `proxy.ts` a lăsat cererea să
    treacă, deci în bază e publicat. Lista e în urmă: pe site, prima
    deschidere a unei tabere abia publicate arăta „Pagina nu a fost găsită”
    și abia a doua mergea (prins pe 11 noiembrie 2026, apăsând „Vezi pe
    site” imediat după „Publică”). Se citește direct, fără cache; se ajunge
    aici numai pentru sluguri care nu se pregenerează.
  */
  if (!areBazaDeDate()) return undefined;
  const proaspat = await textPublicat("proiect", slug).catch(() => null);
  return proaspat ? dinText(proaspat) : undefined;
}

/**
 * Textul din panou pus **peste** tabăra veche cu același slug, nu în locul ei.
 *
 * Butonul „Scrie descrierea” de la taberele moștenite face un text cu același
 * slug, fără poze. Înlocuită întreagă, tabăra și-ar fi pierdut fotografiile
 * din exportul WordPress în clipa publicării descrierii.
 */
function peste(
  p: ProiectAfisat,
  vechi: ProiectAfisat | undefined,
): ProiectAfisat {
  if (!vechi) return p;
  return {
    ...vechi,
    ...p,
    coperta: p.coperta ?? vechi.coperta,
    poze: p.poze.length > 0 ? p.poze : vechi.poze,
    /*
      „Scrie descrierea” trimite numai titlul și textul. Data publicării și
      categoria „2026”, puse din oficiu, ar fi mutat o tabără din 2023 în
      capul listei și i-ar fi căutat pozele în folderul anului greșit; un
      `dosarCloud` lipsă l-ar fi șters pe cel din cod (Banca pentru Alimente).
    */
    data: p.areDataScrisa ? p.data : vechi.data,
    categorie: p.areCategorieScrisa ? p.categorie : vechi.categorie,
    dosarCloud: p.dosarCloud ?? vechi.dosarCloud,
    dataCitita: p.dataCitita ?? vechi.dataCitita,
    descriere: p.descriere?.length ? p.descriere : vechi.descriere,
  };
}

/**
 * Toate fotografiile unui proiect, coperta inclusă și fără duplicate.
 *
 * Două proiecte au copertă, dar lista `poze` goală: pagina lor rămânea fără
 * nicio imagine, deși cardul din listă afișa coperta.
 *
 * Stă aici, nu în pagină, pentru că o folosesc amândouă: pagina, ca să arate
 * galeria, și `sitemap.xml`, ca să-i spună lui Google ce poze sunt pe ea.
 * Dacă s-ar calcula în două locuri, sitemapul ar ajunge să promită altceva
 * decât ce e pe pagină.
 */
export function pozeleProiectului(proiect: ProiectAfisat): string[] {
  return proiect.coperta && !proiect.poze.includes(proiect.coperta)
    ? [proiect.coperta, ...proiect.poze]
    : proiect.poze;
}
