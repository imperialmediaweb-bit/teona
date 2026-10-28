import { Suspense, cache } from "react";
import Link from "next/link";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Sigla from "@/componente/Sigla";
import InstaleazaAplicatia from "@/componente/admin/InstaleazaAplicatia";
import { cineEsteConectat, esteAutentificat, rolulConectat } from "@/lib/admin";
import { NUMELE_ROLULUI, poateVedea } from "@/lib/utilizatori";
import { areBazaDeDate } from "@/lib/baza";
import { deFacutAcum } from "@/lib/statistici";

/**
 * Cadrul comun al panoului.
 *
 * **De ce nu seamănă cu site-ul.** Aici se văd nume, adrese de e-mail și sume
 * de bani. Cu cât panoul seamănă mai puțin cu pagina publică, cu atât mai greu
 * e să confunzi una cu alta — să crezi că ești pe site când de fapt ești într-un
 * tabel cu donatori, sau să lași panoul deschis crezând că e pagina de pornire.
 * De aceea bara din stânga e închisă la culoare: se vede dintr-o privire, de la
 * doi metri, pe ce fel de pagină ești.
 *
 * **De ce în stânga și nu sus.** Varianta dinainte avea o linie de linkuri
 * deasupra, toate la fel de mari, fără grupare. Șapte pagini pe un rând arată
 * ca un meniu de site, nu ca un instrument: nu se vede unde ești, nu se vede
 * ce ține de ce, iar pe un ecran lat rămânea o bandă goală de 1.400 px lângă
 * ele. O coloană în stânga ține toate paginile la vedere tot timpul, le lasă
 * grupate pe înțelesul treburilor (banii, oamenii, trimisul) și eliberează
 * lățimea pentru tabele și grafice, care de asta au nevoie.
 *
 * Pe telefon coloana devine o bandă care se derulează lateral: o bară laterală
 * fixă ar mânca jumătate din ecran.
 */

type Intrare = {
  href: string;
  eticheta: string;
  pictograma: NumePictograma;
  /** Alte adrese pe care intrarea asta e „aici” (paginile strânse sub ea). */
  si?: readonly string[];
};

/**
 * Paginile, grupate pe treburi.
 *
 * Ordinea nu e alfabetică și nici întâmplătoare: e ordinea în care se umblă
 * prin ele într-o zi obișnuită — întâi vezi cum stai, apoi te uiți la bani,
 * apoi la oamenii care așteaptă un răspuns, și abia la urmă trimiți ceva.
 */
const GRUPURI: ReadonlyArray<{ titlu: string; pagini: readonly Intrare[] }> = [
  {
    titlu: "Cum stăm",
    pagini: [
      { href: "/admin", eticheta: "Tablou de bord", pictograma: "panou" },
      { href: "/admin/rapoarte", eticheta: "Rapoarte", pictograma: "grafic" },
      { href: "/admin/analiza", eticheta: "Analiză", pictograma: "stea" },
      { href: "/admin/radar", eticheta: "Radar finanțări", pictograma: "harta" },
    ],
  },
  {
    titlu: "Banii",
    pagini: [
      { href: "/admin/donatii", eticheta: "Donații", pictograma: "inima" },
      { href: "/admin/donatori", eticheta: "Donatori", pictograma: "familie" },
      { href: "/admin/firme", eticheta: "Firme", pictograma: "cladire" },
      { href: "/admin/contracte", eticheta: "Contracte", pictograma: "document" },
    ],
  },
  {
    titlu: "Oameni care așteaptă",
    pagini: [
      { href: "/admin/cereri", eticheta: "Cereri", pictograma: "plic" },
      { href: "/admin/formulare", eticheta: "Formulare 230", pictograma: "document" },
      { href: "/admin/aniversari", eticheta: "Aniversări de aprobat", pictograma: "maini" },
    ],
  },
  /*
    Ce se schimbă pe site, pe nume: blogul, campaniile, taberele, paginile.

    Înainte era o listă de treisprezece intrări sub „Site”, cu „Scrie pe
    site” (trei file înăuntru) lângă „Textele paginilor”, „Cifrele”,
    „Documente”, „Sponsori”, „Testimoniale” — omul nu știa unde să caute.
    Acum ce ține de o pagină anume e sub „Pagini”, pe cardul paginii.
    Adresele vechi merg mai departe.
  */
  {
    titlu: "Site",
    pagini: [
      {
        href: "/admin/scrie?fel=noutate",
        eticheta: "Blog",
        pictograma: "document",
        si: ["/admin/scrie"],
      },
      { href: "/admin/scrie?fel=campanie", eticheta: "Campanii", pictograma: "inima" },
      { href: "/admin/scrie?fel=proiect", eticheta: "Tabere și proiecte", pictograma: "harta" },
      {
        href: "/admin/pagini",
        eticheta: "Pagini",
        pictograma: "panou",
        si: [
          "/admin/texte",
          "/admin/cifre",
          "/admin/documente",
          "/admin/sponsori",
          "/admin/testimoniale",
        ],
      },
      { href: "/admin/poze", eticheta: "Poze", pictograma: "arta" },
    ],
  },
  {
    titlu: "E-mail și promovare",
    pagini: [
      { href: "/admin/sabloane", eticheta: "Șabloane de e-mail", pictograma: "plic" },
      { href: "/admin/emailuri", eticheta: "Mesajele trimise", pictograma: "plic" },
      { href: "/admin/facebook", eticheta: "Facebook", pictograma: "comunicare" },
      { href: "/admin/presa", eticheta: "Presă", pictograma: "document" },
      { href: "/admin/calendar", eticheta: "Calendar", pictograma: "harta" },
      { href: "/admin/qr", eticheta: "Cod QR", pictograma: "panou" },
    ],
  },
  {
    titlu: "Contul",
    pagini: [
      { href: "/admin/utilizatori", eticheta: "Utilizatori", pictograma: "familie" },
      { href: "/admin/parola", eticheta: "Parola mea", pictograma: "stea" },
    ],
  },
];


/**
 * Cât așteaptă pe fiecare pagină, ca să se vadă din meniu.
 *
 * Cifrele sunt aceleași care stau în „De făcut acum" pe tabloul de bord, doar
 * că aici se văd de pe orice pagină a panoului: cine intră să caute un donator
 * vede în trecere că au venit trei cereri, fără să se întoarcă la tablou.
 *
 * `cache` de la React, nu un `Map` global: fiecare intrare de meniu își cere
 * singură cifra, iar fără dedublare asta ar fi însemnat nouă interogări
 * identice la fiecare pagină. Cu `cache`, prima o face, celelalte o primesc.
 *
 * Interogările se fac **numai** după ce omul a intrat cu parola. Pe ecranul de
 * intrare, cadrul se randează la fel, dar un om din afară n-are de ce să afle
 * din meniu câte cereri are asociația pe masă.
 */
const semne = cache(async (): Promise<ReadonlyMap<string, number>> => {
  if (!areBazaDeDate() || !(await esteAutentificat())) return new Map();
  const lucruri = await deFacutAcum().catch(() => []);
  const pe = new Map<string, number>();
  for (const lucru of lucruri) {
    pe.set(lucru.unde, (pe.get(lucru.unde) ?? 0) + lucru.nr);
  }
  return pe;
});

/** Pastila cu cifra, lângă numele paginii. Lipsește de tot când nu e nimic. */
async function Semn({ href, aici }: { href: string; aici: boolean }) {
  const nr = href.includes("?") ? 0 : ((await semne()).get(href) ?? 0);
  if (nr === 0) return null;
  return (
    /*
      Înțelesul cifrei stă în `aria-label`, nu într-un `<span className="sr-only">`
      alăturat.

      `sr-only` ascunde cu `position: absolute`, iar aici n-avea niciun
      strămoș poziționat: blocul lui de referință ajungea să fie pagina
      întreagă, deci spanul ieșea din bara care se derulează lateral și
      lățea documentul cu 120 px pe un ecran de 390. Pagina nu se derula
      vizibil, dar `scrollWidth` creștea — și proba de lățime a prins-o.
      Aceeași capcană ca la tabelele ascunse de sub grafice.
    */
    <span
      role="img"
      aria-label={`${nr} de făcut`}
      className={`ml-auto grid min-w-5 shrink-0 place-items-center rounded-full px-1.5 py-0.5 font-titlu text-nota font-bold ${
        aici ? "bg-hartie text-caramiziu-900" : "bg-caramiziu-700 text-hartie"
      }`}
    >
      {nr}
    </span>
  );
}

/**
 * Meniul, din care lipsesc paginile pe care rolul tău nu le vede.
 *
 * Ascunsul nu e protecția — aia e în pagină și în rută, care refuză chiar și
 * adresa scrisă de mână. Meniul se curăță pentru că un link care duce la
 * „pagina asta nu e deschisă pentru tine" e o promisiune pe care panoul n-o
 * ține: omul îl apasă o dată, poate de două ori, și învață să nu se mai uite
 * în bară.
 *
 * Grupurile rămase goale nu se mai scriu, altfel ar rămâne un titlu de
 * secțiune cu nimic sub el.
 */
async function Nav({ activ }: { activ?: string }) {
  const rol = await rolulConectat();
  const grupuri = rol
    ? GRUPURI.map((grup) => ({
        ...grup,
        pagini: grup.pagini.filter((p) =>
          poateVedea(rol, p.href.split("?")[0]),
        ),
      })).filter((grup) => grup.pagini.length > 0)
    : GRUPURI;
  const eAici = (p: Intrare) =>
    activ === p.href || Boolean(activ && p.si?.includes(activ));

  /*
    Grupele se strâng: deschisă e numai cea în care ești. Douăzeci și cinci de
    linkuri unul sub altul erau „un cârnaț” în care nu găsea nimeni nimic;
    șase titluri se citesc dintr-o privire. Pe tabloul de bord, unde nu ești
    în nicio grupă, se deschide prima.
  */
  const areActiv = grupuri.some((g) => g.pagini.some(eAici));

  return (
    <div className="grid gap-1">
      {grupuri.map((grup, i) => {
        const deschis = grup.pagini.some(eAici) || (!areActiv && i === 0);
        return (
          <details key={grup.titlu} open={deschis} className="group/grupa">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 font-titlu text-mic font-bold text-hartie/85 transition-colors hover:bg-hartie/10 hover:text-hartie [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className="text-hartie/50 transition-transform group-open/grupa:rotate-90"
              >
                ›
              </span>
              {grup.titlu}
              <Suspense fallback={null}>
                <SemnGrupa hrefuri={grup.pagini.map((p) => p.href)} />
              </Suspense>
            </summary>
            <ul className="mt-0.5 mb-2 grid gap-0.5 pl-3">
              {grup.pagini.map((p) => {
                const aici = eAici(p);
                return (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      /* Fără preîncărcare: fiecare pagină de panou interoghează baza. */
                      prefetch={false}
                      aria-current={aici ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 font-titlu text-mic font-semibold whitespace-nowrap transition-colors ${
                        aici
                          ? "bg-caramiziu-600 text-hartie"
                          : "text-hartie/70 hover:bg-hartie/10 hover:text-hartie"
                      }`}
                    >
                      <Pictograma
                        nume={p.pictograma}
                        aria-hidden="true"
                        className="size-4 shrink-0"
                      />
                      {p.eticheta}
                      <Suspense fallback={null}>
                        <Semn href={p.href} aici={aici} />
                      </Suspense>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

/** Cât așteaptă într-o grupă strânsă, ca să nu se piardă cererile noi. */
async function SemnGrupa({ hrefuri }: { hrefuri: readonly string[] }) {
  const pe = await semne();
  const nr = hrefuri.reduce((t, h) => t + (pe.get(h) ?? 0), 0);
  if (nr === 0) return null;
  return (
    <span
      role="img"
      aria-label={`${nr} de făcut`}
      className="ml-auto grid min-w-5 place-items-center rounded-full bg-caramiziu-700 px-1.5 py-0.5 font-titlu text-nota font-bold text-hartie group-open/grupa:hidden"
    >
      {nr}
    </span>
  );
}

/**
 * Butonul de ieșire — numai când e cineva înăuntru.
 *
 * Pe ecranul de intrare n-are ce căuta: n-ai de unde ieși dacă n-ai intrat.
 * Și mai rău, stă în cod **înaintea** formularului de parolă, fiindcă bara e
 * în stânga: primul `button[type="submit"]` din pagină devenea el, iar
 * probele automate — și orice browser care trimite formularul cu Enter de pe
 * un câmp fără buton propriu — nimereau ieșirea în loc de intrare. Prins de
 * `scripts/qa/crm.mjs`, care de la o zi la alta nu mai reușea să intre în
 * panou, deși parola era bună.
 */
async function Iesirea() {
  const cine = await cineEsteConectat();
  if (!cine) return null;
  return (
    <form action="/api/admin/iesire" method="post">
      {/*
        Cine e înăuntru, scris lângă butonul de ieșire.

        Cu o parolă comună întrebarea n-avea rost. Cu conturi are: pe
        calculatorul din birou intră azi unul, mâine altul, iar cine scrie un
        rând de jurnal trebuie să vadă cu al cui nume îl scrie înainte să-l
        scrie, nu după.
      */}
      <p className="px-3 pb-1 font-titlu text-nota text-hartie/45">
        {cine.nume} · {NUMELE_ROLULUI[cine.rol]}
      </p>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 font-titlu text-nota font-semibold whitespace-nowrap text-hartie/65 transition-colors hover:bg-hartie/10 hover:text-hartie"
      >
        <Pictograma
          nume="sageata"
          aria-hidden="true"
          className="size-3.5 shrink-0"
        />
        Ieși din panou
      </button>
    </form>
  );
}

export default function Cadru({
  titlu,
  descriere,
  activ,
  actiuni,
  faraMeniu,
  children,
}: {
  titlu: string;
  /** O frază sub titlu: ce e pagina asta și la ce folosește. */
  descriere?: string;
  activ?: string;
  /** Butoane sau filtre, în dreapta titlului. */
  actiuni?: React.ReactNode;
  /**
   * Bara laterală, fără meniu.
   *
   * Pe pagina de intrare, meniul întreg se desena și pentru cine nu era
   * autentificat: douăzeci de linkuri, căutarea, butonul de ieșire. Arăta a
   * panou deschis deși nu era, iar formularul de intrare de alături părea o
   * casetă oarecare din pagină — un om a scris în el adresa și parola colegei
   * pe care voia s-o adauge. Linkurile nici nu duceau nicăieri: fiecare
   * pagină cerea din nou parola.
   *
   * Rămâne sigla, ca omul să vadă unde a nimerit, și atât.
   */
  faraMeniu?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id="panou-admin" className="min-h-screen bg-hartie-calda lg:flex">
      {/* Bara laterală. Pe ecran lat stă lipită și nu se derulează cu pagina. */}
      <div className="bg-cerneala lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
        {/*
          Sigla adevărată, nu un pătrat portocaliu.

          Aici stătea o pictogramă oarecare într-un pătrat, cu numele scris
          lângă: semăna cu panoul oricui. Omul care deschide panoul dimineața
          vede acum aceeași siglă care e pe site, pe contract și pe adeverințe
          — e panoul asociației lui, nu un instrument străin. Pe fundal închis,
          numele ia treapta mai deschisă a culorilor de brand.
        */}
        <div className="px-4 py-3 lg:px-5 lg:py-5">
          <Link
            href="/admin"
            prefetch={false}
            className="inline-flex rounded-lg transition-opacity hover:opacity-80"
          >
            <Sigla peFundalInchis className="text-[38px]" />
            <span className="sr-only">Tabloul de bord</span>
          </Link>
        </div>

        {/*
          Căutarea peste tot, în bara din stânga.

          Sună cineva și spune un nume. Până acum trebuia ghicit în ce listă e
          — donator, firmă, om care a trimis un formular — și deschise trei
          pagini. Un singur câmp le caută pe toate trei.
        */}
        {!faraMeniu && (
          <>
            <form
              action="/admin/cauta"
              method="get"
              role="search"
              className="px-3 pb-3 lg:pb-1"
            >
              <label htmlFor="cautare-panou" className="sr-only">
                Caută în panou
              </label>
              <input
                id="cautare-panou"
                name="q"
                type="search"
                placeholder="Caută nume, e-mail, CUI…"
                className="w-full rounded-lg border border-hartie/20 bg-hartie/10 px-3 py-2 text-mic text-hartie placeholder:text-hartie/45 focus:border-hartie/40 focus:outline-none"
              />
            </form>

            <nav
              aria-label="Panou"
              className="overflow-x-auto px-3 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:overflow-y-auto lg:pb-6"
            >
              {/*
            `Suspense`, fiindcă meniul își cere acum rolul din baza de date ca
            să știe ce linkuri să arate. Fără el, bara ar ține toată pagina în
            loc până răspunde Postgres.
          */}
              <Suspense fallback={null}>
                <Nav activ={activ} />
              </Suspense>

            </nav>

            <InstaleazaAplicatia />

            {/*
          Jos: site-ul și ieșirea.

          Până acum nu exista nicio cale de a ieși din panou. Parola e una
          singură, pentru toți cei din asociație, și cookie-ul ține
          douăsprezece ore: pe un laptop împrumutat sau pe calculatorul din
          birou, „am terminat" trebuia să însemne ceva. Ieșirea merge prin
          POST, nu printr-un link: un link s-ar deschide din greșeală, iar
          orice imagine străină cu adresa aceea ar fi dat afară omul din panou.
        */}
            <div className="flex items-center justify-between gap-2 border-t border-hartie/10 px-3 py-2 lg:grid lg:gap-0.5 lg:py-2.5">
              <Link
                href="/"
                prefetch={false}
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 font-titlu text-nota font-semibold whitespace-nowrap text-hartie/65 transition-colors hover:bg-hartie/10 hover:text-hartie"
              >
                <Pictograma
                  nume="sageata"
                  aria-hidden="true"
                  className="size-3.5 shrink-0 -rotate-45"
                />
                Vezi site-ul
              </Link>
              <Suspense fallback={null}>
                <Iesirea />
              </Suspense>
            </div>
          </>
        )}
      </div>

      {/*
        `div`, nu `main`.

        Paginile panoului se randează înăuntrul aspectului site-ului, care are
        deja `<main id="continut">`. Două `main` imbricate sunt HTML invalid,
        iar un cititor de ecran care sare „la conținutul principal” nu mai
        știe unde să ducă omul. Prins de proba automată, care a dat peste două
        elemente acolo unde se aștepta la unul.
      */}
      <div className="min-w-0 flex-1">
        <div className="border-b border-hartie-umbra bg-hartie">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4 px-4 py-6 sm:px-8">
            <div>
              <h1 className="text-h3 text-cerneala">{titlu}</h1>
              {descriere && (
                <p className="mt-1 text-mic text-cerneala-moale">{descriere}</p>
              )}
            </div>
            {actiuni}
          </div>
        </div>

        {/*
          Zona de conținut are nume propriu, nu doar `#panou-admin`.

          Probele automate alegeau „primul `li` din panou" ca să ajungă la
          primul rând dintr-un tabel. De când meniul e o listă în stânga,
          primul `li` din panou e o intrare de meniu, iar proba de CRM a
          început să încerce să schimbe stadiul... linkului „Tablou de bord".
          Cu un nume separat, nu se mai pot confunda.
        */}
        <div
          id="continut-panou"
          className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
