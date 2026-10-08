import type { Metadata } from "next";
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
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import DeCopiat from "@/componente/pagina/DeCopiat";
import DocumentDeDescarcat from "@/componente/pagina/DocumentDeDescarcat";
import Intrebari from "@/componente/pagina/Intrebari";
import Pasi from "@/componente/pagina/Pasi";

export const metadata: Metadata = {
  title: "Redirecționează 3,5%",
  description:
    "Nu te costă nimic în plus. Prin Formularul 230 alegi ca 3,5% din impozitul pe venit să ajungă la copiii noștri.",
};

/** 7.4 — unde se trimit formularele. */
const UNDE: ReadonlyArray<{
  pictograma: NumePictograma;
  titlu: string;
  text: React.ReactNode;
}> = [
  {
    pictograma: "plic",
    titlu: "Pe email",
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
    text: "Îți confirmăm că am primit formularul și, ulterior, că a fost depus la ANAF.",
  },
];

export default async function Redirectioneaza35() {
  const an = await anulCurent();
  const bcr = CONTURI[0];

  return (
    <>
      <AntetPagina
        titlu="Redirecționează 3,5% din impozitul tău"
        subtitlu="Nu te costă nimic în plus. Tu alegi unde ajunge o parte din impozitul pe venit."
        poza={{
          cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
          alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
          legenda: "Tabăra RESPIRO",
        }}
        butoane={
          <Buton href="#documente" marime="mare">
            Descarcă Formularul 230
          </Buton>
        }
      />

      {/* 7.2 — mesajul cheie, cu termenul-limită alături. */}
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1.6fr_1fr] lg:gap-10 lg:px-8">
          <div className="colt-a bg-tenta-cald p-8 shadow-[0_20px_42px_-24px_rgba(247,79,34,0.5)] sm:p-10">
            <p className="text-h4 leading-snug text-cerneala">
              Redirecționarea nu te costă nimic. Impozitul pe venit îl plătești
              oricum, iar prin Formularul 230 alegi ca 3,5% din el să meargă la o
              asociație în care ai încredere.
            </p>
          </div>

          <div className="colt-b flex flex-col items-start gap-2 bg-caramiziu-500 p-8 text-hartie shadow-[0_20px_42px_-22px_rgba(247,79,34,0.9)]">
            <span className="font-titlu text-nota font-bold tracking-wider uppercase opacity-85">
              Termen-limită {an}
            </span>
            {/*
              Data e cea din lege, repetată și în întrebările frecvente din
              caiet: „Formularul 230 se depune în fiecare an, până la 25 mai”.
              Anul e cel curent, luat de pe server — nu îngheață la build.
            */}
            <span className="font-titlu text-h2 leading-none font-extrabold">
              25 mai
            </span>
            <span className="text-mic opacity-90">
              Pentru veniturile din anul anterior.
            </span>
          </div>
        </div>
      </section>

      {/* 7.3 — trei pași */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pb-20 lg:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-12 right-[6%] size-8 text-miere-300 lg:size-11"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Trei pași</h2>
          <Pasi
            className="mt-10"
            pasi={[
              "Completezi Formularul 230 cu datele tale.",
              "Semnezi formularul și declarația de consimțământ.",
              "Ni-l trimiți nouă. Asociația îl depune la ANAF, în numele tău, înainte de termen.",
            ]}
          />
        </div>
      </section>

      {/* 7.4 — unde se trimit formularele */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Unde trimiți formularul</h2>

          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {UNDE.map((loc, i) => (
              <li key={loc.titlu}>
                <div
                  className={`flex h-full flex-col ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } bg-hartie-calda p-7 shadow-[0_18px_38px_-22px_rgba(35,35,35,0.45)]`}
                >
                  <span className="colt-mic-a flex size-12 items-center justify-center bg-caramiziu-100 text-caramiziu-600">
                    <Pictograma nume={loc.pictograma} className="size-6" />
                  </span>
                  <h3 className="mt-5 text-h4 text-cerneala">{loc.titlu}</h3>
                  <p className="mt-2 text-mic text-cerneala-moale">{loc.text}</p>
                </div>
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
          <p className="colt-mic-a mt-8 flex items-start gap-3 bg-turcoaz-50 px-5 py-4 text-mic text-turcoaz-900">
            <span className="mt-0.5 shrink-0 text-turcoaz-600">
              <Pictograma nume="maini" className="size-5" />
            </span>
            Datele tale sunt folosite doar pentru depunerea Formularului 230 la
            ANAF, în numele tău. Nu le folosim în alt scop și nu le dăm nimănui.
          </p>
        </div>
      </section>

      {/* 7.5 — documente */}
      <Val culoare="text-tenta-cald" />
      <section
        id="documente"
        className="granulatie scroll-mt-32 bg-tenta-cald pb-20 lg:pb-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Documente de descărcat</h2>

          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            <li>
              <DocumentDeDescarcat
                titlu="Formularul 230"
                descriere="Completat în prealabil cu datele asociației. Tu adaugi doar datele tale și semnătura."
                format="PDF"
              />
            </li>
            <li>
              <DocumentDeDescarcat
                titlu="Declarația de consimțământ"
                descriere="Ne dai dreptul să depunem formularul la ANAF în numele tău."
                format="PDF"
              />
            </li>
            <li>
              <DocumentDeDescarcat
                titlu="Informare GDPR"
                descriere="Ce date primim, pentru ce le folosim și cât le păstrăm."
                format="PDF"
              />
            </li>
          </ul>
        </div>
      </section>

      {/* 7.6 — De ce Asociația Teona Ariana */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">De ce Asociația Teona Ariana</h2>
          <div className="mt-6 grid gap-4 text-amplu text-cerneala-moale">
            <p>
              Pentru copiii cu nevoi speciale și pentru familiile lor, o zi bună
              nu vine de la sine. De aceea organizăm tabere în care copiii se
              joacă, își fac prieteni și descoperă că pot, iar părinții respiră
              și află că nu sunt singuri. Am organizat 33 de tabere și am avut
              alături peste 1.500 de participanți.
            </p>
            <p>
              Bucuria nu ține doar câteva zile pe an. La Casa Teona, copiii vin
              pe tot parcursul anului la jocuri și ateliere, iar părinții găsesc
              consiliere și întâlniri de grup.
            </p>
            <p>
              Fiecare sumă redirecționată ajută la acest lucru: tabere,
              activități și un loc sigur pentru copii și familiile lor.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
          <h3 className="sr-only">Rezultatele noastre</h3>
          <Cifre />
        </div>
      </section>

      {/* 7.7 */}
      <Val culoare="text-hartie" />
      <Intrebari
        intrebari={[
          {
            intrebare: "Ce înseamnă să redirecționez?",
            raspuns: (
              <p>
                Înseamnă că alegi ca 3,5% din impozitul pe venit, pe care oricum
                îl plătești statului, să ajungă la Asociația Teona Ariana. Faci
                asta completând Formularul 230 și îl depui o singură dată pe an.
              </p>
            ),
          },
          {
            intrebare: "Mă costă ceva?",
            raspuns: (
              <p>
                Nu. Nu plătești nimic în plus și nu pierzi nimic. Statul îți ia
                oricum impozitul pe venit, iar prin Formularul 230 alegi doar
                unde merge 3,5% din el. Dacă nu completezi formularul, acei bani
                rămân la stat.
              </p>
            ),
          },
          {
            intrebare: "Pot anula sau modifica?",
            raspuns: (
              <p>
                Da, până la termenul de depunere. Dacă te răzgândești, depui un
                nou Formular 230 și cel mai recent formular depus în termen este
                cel luat în calcul. După termen, alegerea făcută rămâne valabilă
                pentru anul respectiv.
              </p>
            ),
          },
          {
            intrebare: "Până când trebuie să depun?",
            raspuns: (
              <p>
                Formularul 230 se depune în fiecare an, până la 25 mai, pentru
                veniturile din anul anterior. Tu trebuie doar să îl completezi,
                cu datele tale și semnătura. Noi ne ocupăm de restul: îl depunem
                pentru tine, la termen.
              </p>
            ),
          },
        ]}
      />

      {/* 7.8 — datele asociației */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Datele asociației</h2>

          <div className="mt-8 grid gap-3">
            <DeCopiat eticheta="Denumire" valoare={ASOCIATIA.denumireLegala} />
            <DeCopiat eticheta="CIF" valoare={ASOCIATIA.cif} />
            <DeCopiat
              eticheta={`IBAN ${bcr.banca} (${bcr.moneda})`}
              valoare={bcr.iban}
              deCopiat={bcr.iban.replace(/\s/g, "")}
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

      {/* 7.9 */}
      <IndemnFinal titlu="Mulțumim că ai ales să fii alături de copiii noștri" />
    </>
  );
}
