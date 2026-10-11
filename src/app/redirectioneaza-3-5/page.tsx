import type { Metadata } from "next";
import { JsonLd, jsonLdFir, jsonLdIntrebari, metadate } from "@/app/seo";
import Link from "next/link";
import {
  ADRESE,
  ASOCIATIA,
  CONTURI,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { anulCurent } from "@/lib/an";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import Formular230 from "@/componente/pagina/Formular230";
import FormularRedirectionare from "@/componente/formular/FormularRedirectionare";
import AntetPagina from "@/componente/pagina/AntetPagina";
import DeCopiat from "@/componente/pagina/DeCopiat";
import DocumentDeDescarcat from "@/componente/pagina/DocumentDeDescarcat";
import Intrebari, { type Intrebare } from "@/componente/pagina/Intrebari";
import Pasi from "@/componente/pagina/Pasi";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = metadate({
  titlu: "Redirecționează 3,5%",
  descriere:
    "Formularul 230: redirecționezi 3,5% din impozitul pe venit către Asociația Teona Ariana Suceava, fără niciun cost. Pași, documente și termenul de 25 mai.",
  cale: "/redirectioneaza-3-5",
});

/** 7.4 — unde se trimit formularele. */
const UNDE: ReadonlyArray<{
  pictograma: NumePictograma;
  titlu: string;
  text: React.ReactNode;
  clase: string;
}> = [
  {
    pictograma: "plic",
    titlu: "Pe email",
    clase:
      "bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]",
    text: (
      <>
        Scanat sau fotografiat, la{" "}
        <a
          href={`mailto:${EMAIL.redirectionare}`}
          className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
        >
          {EMAIL.redirectionare}
        </a>
        .
      </>
    ),
  },
  {
    pictograma: "harta",
    titlu: "În persoană",
    clase:
      "bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]",
    text: (
      <>
        La Casa Teona, {ADRESE.casaTeona.strada}, {ADRESE.casaTeona.oras}.{" "}
        {ADRESE.casaTeona.program}.
      </>
    ),
  },
  {
    pictograma: "comunicare",
    titlu: "Primești confirmare",
    clase:
      "bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]",
    text: "Îți confirmăm că am primit formularul și, ulterior, că a fost depus la ANAF.",
  },
];

/**
 * Întrebările frecvente, în afara componentei: aceeași listă ajunge și pe
 * pagină, și în datele structurate (`FAQPage`), deci nu pot diverge.
 */
const INTREBARI: ReadonlyArray<Intrebare> = [
  {
    intrebare: "Ce înseamnă să redirecționez?",
    raspuns: (
      <p>
        Înseamnă că alegi ca 3,5% din impozitul pe venit, pe care oricum îl
        plătești statului, să ajungă la Asociația Teona Ariana. Faci asta
        completând Formularul 230 și îl depui o singură dată pe an.
      </p>
    ),
  },
  {
    intrebare: "Mă costă ceva?",
    raspuns: (
      <p>
        Nu. Nu plătești nimic în plus și nu pierzi nimic. Statul îți ia oricum
        impozitul pe venit, iar prin Formularul 230 alegi doar unde merge 3,5%
        din el. Dacă nu completezi formularul, acei bani rămân la stat.
      </p>
    ),
  },
  {
    intrebare: "Pot anula sau modifica?",
    raspuns: (
      <p>
        Da, până la termenul de depunere. Dacă te răzgândești, depui un nou
        Formular 230 și cel mai recent formular depus în termen este cel luat în
        calcul. După termen, alegerea făcută rămâne valabilă pentru anul
        respectiv.
      </p>
    ),
  },
  {
    intrebare: "Până când trebuie să depun?",
    raspuns: (
      <p>
        Formularul 230 se depune în fiecare an, până la 25 mai, pentru
        veniturile din anul anterior. Tu trebuie doar să îl completezi, cu
        datele tale și semnătura. Noi ne ocupăm de restul: îl depunem pentru
        tine, la termen.
      </p>
    ),
  },
];

export default async function Redirectioneaza35() {
  const an = await anulCurent();
  const bcr = CONTURI[0];

  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Redirecționează 3,5%", cale: RUTE.redirectionare35 },
        ])}
      />
      <AntetPagina
        scris="Un formular, o dată pe an"
        titlu="Redirecționează 3,5% din impozitul tău"
        subtitlu="Nu te costă nimic în plus. Tu alegi unde ajunge o parte din impozitul pe venit."
        poza={{
          cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
          alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
          legenda: "Tabăra RESPIRO",
        }}
        pozaMica={{
          cale: "/poze/2024/11/438814270_2663080130535965_2029375574315086726_n-766x1024.jpg",
          alt: "Copii și voluntari, la o masă plină cu hârtie creponată colorată, carioci și boluri, la un atelier creativ din tabără",
        }}
        butoane={
          <Buton href="#documente" marime="mare">
            Descarcă Formularul 230
            <Pictograma nume="sageata" className="size-5 rotate-90" />
          </Buton>
        }
      />

      {/* 7.2 — mesajul cheie, cu termenul-limită alături. Ies peste valul
          antetului, ca banda de cifre de pe prima pagină. */}
      {/* Fără `overflow-hidden`: cardurile de dedesubt sunt trase în sus
          intenționat, ca să iasă peste valul antetului. Cu el, secțiunea
          le reteza exact partea ieșită — primul rând de text apărea tăiat
          pe jumătate. */}
      <section className="relative bg-hartie pb-24 lg:pb-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative z-20 -mt-6 grid gap-5 sm:-mt-10 lg:-mt-16 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
            <div className="granulatie relative overflow-hidden colt-a border border-hartie-umbra bg-hartie p-8 shadow-[0_34px_70px_-30px_rgba(247,79,34,0.5)] sm:p-10">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 -right-2 font-titlu text-[8rem] leading-none font-extrabold tracking-tight text-caramiziu-50 select-none sm:text-[10rem]"
              >
                3,5%
              </span>
              <p className="relative max-w-2xl font-titlu text-h4 leading-snug font-bold text-cerneala sm:text-h3">
                Redirecționarea nu te costă nimic. Impozitul pe venit îl
                plătești oricum, iar prin Formularul 230 alegi ca 3,5% din el să
                meargă la o asociație în care ai încredere.
              </p>
            </div>

            <div className="granulatie relative flex flex-col items-start gap-2 overflow-hidden colt-b bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-8 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.9)]">
              <span
                aria-hidden="true"
                className="absolute -right-12 -bottom-16 size-48 rounded-full border-2 border-hartie/20"
              />
              <span className="relative font-titlu text-nota font-bold tracking-wider uppercase opacity-85">
                Termen-limită {an}
              </span>
              {/*
                Data e cea din lege, repetată și în întrebările frecvente din
                caiet: „Formularul 230 se depune în fiecare an, până la 25 mai”.
                Anul e cel curent, luat de pe server — nu îngheață la build.
              */}
              <span className="relative font-titlu text-[3.2rem] leading-none font-extrabold tracking-tight sm:text-[3.8rem]">
                25 mai
              </span>
              <span className="relative text-mic opacity-90">
                Pentru veniturile din anul anterior.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7.3 — trei pași */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-12 right-[6%] size-8 text-miere-300 lg:size-11"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune scris="Simplu ca o scrisoare" titlu="Trei pași" />
          <Pasi
            className="mt-12"
            pasi={[
              {
                text: "Completezi Formularul 230 cu datele tale.",
                pictograma: "document",
              },
              {
                text: "Semnezi formularul și declarația de consimțământ.",
                pictograma: "maini",
              },
              {
                text: "Ni-l trimiți nouă. Asociația îl depune la ANAF, în numele tău, înainte de termen.",
                pictograma: "plic",
              },
            ]}
          />
        </div>
      </section>

      {/* 7.4 — unde se trimit formularele */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-24 left-[3%] size-10 text-turcoaz-200 lg:size-14"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune titlu="Unde trimiți formularul" />

          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            {UNDE.map((loc, i) => (
              <li key={loc.titlu}>
                <Aparitie intarziere={i * 0.05} className="h-full">
                  <div
                    className={`flex h-full flex-col ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } border border-hartie-umbra bg-hartie p-7 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)]`}
                  >
                    <span
                      className={`flex size-14 items-center justify-center ${
                        i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                      } ${loc.clase}`}
                    >
                      <Pictograma nume={loc.pictograma} className="size-7" />
                    </span>
                    <h3 className="mt-6 text-h4 text-cerneala">{loc.titlu}</h3>
                    <p className="mt-2 text-corp text-cerneala-moale">
                      {loc.text}
                    </p>
                  </div>
                </Aparitie>
              </li>
            ))}
          </ul>

          {/*
            Mesajul de siguranță a datelor, cerut explicit la 7.4. Caietul lasă
            perioada de păstrare în alb — o completează asociația, împreună cu
            responsabilul de date. Până atunci spunem doar ce știm sigur: la ce
            se folosesc datele. O perioadă inventată aici ar fi o promisiune
            pe care nimeni nu s-a angajat să o țină.
          */}
          <p className="mt-8 flex items-start gap-4 colt-mic-b bg-turcoaz-50 px-5 py-4 text-corp text-turcoaz-900">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-turcoaz-500 text-hartie">
              <Pictograma nume="maini" className="size-5" />
            </span>
            <span className="pt-1.5">
              Datele tale sunt folosite doar pentru depunerea Formularului 230
              la ANAF, în numele tău. Nu le folosim în alt scop și nu le dăm
              nimănui.
            </span>
          </p>
        </div>
      </section>

      {/* 7.5 — documente */}
      <Val culoare="text-tenta-cald" className={VAL_PESTE} />
      <section
        id="documente"
        className="granulatie relative scroll-mt-32 overflow-hidden bg-tenta-cald pt-6 pb-24 lg:pt-10 lg:pb-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="spirala"
            className="pluteste-lent absolute top-14 right-[5%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Tot ce ai nevoie, într-un loc"
            titlu="Documente de descărcat"
          />

          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            <li>
              <Aparitie className="h-full">
                <DocumentDeDescarcat
                  titlu="Formularul 230"
                  descriere="Completat în prealabil cu datele asociației. Tu adaugi doar datele tale și semnătura."
                  format="PDF"
                  colt="a"
                />
              </Aparitie>
            </li>
            <li>
              <Aparitie intarziere={0.06} className="h-full">
                <DocumentDeDescarcat
                  titlu="Declarația de consimțământ"
                  descriere="Ne dai dreptul să depunem formularul la ANAF în numele tău."
                  format="PDF"
                  colt="b"
                />
              </Aparitie>
            </li>
            <li>
              <Aparitie intarziere={0.12} className="h-full">
                <DocumentDeDescarcat
                  titlu="Informare GDPR"
                  descriere="Ce date primim, pentru ce le folosim și cât le păstrăm."
                  format="PDF"
                  colt="a"
                />
              </Aparitie>
            </li>
          </ul>
        </div>
      </section>

      {/*
        7.10 — completarea online a Formularului 230.

        Caietul o pune în „etapa 2, după validare juridică și securizare”, și
        adaugă că CNP-ul se cere doar dacă e strict necesar. Formular230.ro
        face exact asta ca serviciu, iar asociația are deja cont acolo: site-ul
        vechi îl încorpora cu același token. Așa datele omului nu trec prin
        site-ul nostru deloc.
      */}
      <Val culoare="text-tenta-miere" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-miere pt-6 pb-24 lg:pt-10 lg:pb-28">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Fără drum la poștă"
            titlu="Completează formularul online"
            text="Îl completezi și îl semnezi pe ecran. Noi îl depunem la ANAF, în numele tău, înainte de termen."
          />
          <div className="mt-10">
            <Formular230 linkDescarcare="#documente" />
          </div>

          {/*
            Pentru cine citește de pe telefon și n-are cum să completeze
            acum. Îi trimitem pașii pe e-mail, cu linkul de mai sus înăuntru,
            ca să-i găsească atunci când se așază cu actele în față.
          */}
          <div id="pasi-pe-email" className="mt-16 scroll-mt-32">
            <TitluSectiune
              scris="Nu acum?"
              titlu="Îți trimitem pașii pe e-mail"
              text="Nu cerem CNP și nicio altă dată fiscală — doar unde să-ți scriem."
              culoare="turcoaz"
            />
            <div className="mt-10">
              <FormularRedirectionare />
            </div>
          </div>
        </div>
      </section>

      {/* 7.6 — De ce Asociația Teona Ariana */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <TitluSectiune
                scris="Unde ajung banii"
                titlu="De ce Asociația Teona Ariana"
              />
              <div className="mt-6 grid gap-4 text-amplu text-cerneala-moale">
                <p>
                  Pentru copiii cu nevoi speciale și pentru familiile lor, o zi
                  bună nu vine de la sine. De aceea organizăm tabere în care
                  copiii se joacă, își fac prieteni și descoperă că pot, iar
                  părinții respiră și află că nu sunt singuri. Am organizat 33
                  de tabere și am avut alături peste 1.500 de participanți.
                </p>
                <p>
                  Bucuria nu ține doar câteva zile pe an. La Casa Teona, copiii
                  vin pe tot parcursul anului la jocuri și ateliere, iar
                  părinții găsesc consiliere și întâlniri de grup.
                </p>
                <p>
                  Fiecare sumă redirecționată ajută la acest lucru: tabere,
                  activități și un loc sigur pentru copii și familiile lor.
                </p>
              </div>
            </div>
            <Fotografie
              cale="/poze/2024/11/462119250_122094741458569469_941841061673534153_n.jpg"
              alt="Copii, părinți și voluntari în tricouri albe, pe iarbă, în fața pensiunii din tabăra RESPIRO; câțiva copii fac cu mâna"
              legenda="Familii în tabără"
              umbra="miere"
              bloc="miere"
              colt="b"
              raport="aspect-[4/3]"
              dimensiuni="(min-width: 1024px) 480px, 92vw"
              className="mx-auto w-full max-w-xl lg:col-span-5 lg:max-w-none"
            />
          </div>

          <div className="relative mt-16 colt-a border border-hartie-umbra bg-hartie px-5 py-10 shadow-[0_34px_70px_-30px_rgba(247,79,34,0.45)] lg:mt-20 lg:px-12 lg:py-12">
            <Decor
              semn="unda"
              className="absolute top-4 right-6 size-8 text-miere-300 lg:size-10"
            />
            <Decor
              semn="stea"
              className="absolute bottom-4 left-6 size-6 text-caramiziu-200 lg:size-8"
            />
            <h3 className="sr-only">Rezultatele noastre</h3>
            <Cifre />
          </div>
        </div>
      </section>

      {/* 7.7 */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <JsonLd date={jsonLdIntrebari(INTREBARI)} />
      <Intrebari
        scris="Pe scurt"
        poza={{
          cale: "/poze/2024/11/386090253_3250740235223267_8748916196061085905_n.jpg",
          alt: "Fete și femei la o masă cu prăjituri, sub pergola de lemn a pensiunii, în tabără",
          legenda: "La masă, în tabără",
        }}
        intrebari={INTREBARI}
      />

      {/* 7.8 — datele asociației */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-12 right-[5%] size-9 text-miere-300 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Pentru Formularul 230"
            titlu="Datele asociației"
          />

          <div className="mt-10 grid gap-3">
            <DeCopiat eticheta="Denumire" valoare={ASOCIATIA.denumireLegala} />
            <DeCopiat
              eticheta="CIF"
              valoare={ASOCIATIA.cif}
              culoare="miere"
              colt="b"
            />
            <DeCopiat
              eticheta={`IBAN ${bcr.banca} (${bcr.moneda})`}
              valoare={bcr.iban}
              deCopiat={bcr.iban.replace(/\s/g, "")}
              culoare="turcoaz"
            />
          </div>

          <p className="mt-8 text-mic text-cerneala-moale">
            Ai întrebări? Scrie-ne la{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              {EMAIL.contact}
            </a>{" "}
            sau sună-ne la{" "}
            <a
              href={`tel:${TELEFON_PRINCIPAL.apel}`}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              {TELEFON_PRINCIPAL.afisat}
            </a>
            . Pentru firme, vezi{" "}
            <Link
              href={RUTE.directionare20}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              Direcționează 20%
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 7.9 — „Butoanele Donează și Devino voluntar”. */}
      <IndemnFinal
        peste
        butoane="doua"
        titlu="Mulțumim că ai ales să fii alături de copiii noștri"
      />
    </>
  );
}
