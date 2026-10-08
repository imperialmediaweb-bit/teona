import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ADRESE, ASOCIATIA, RUTE, SMS } from "@/date/asociatie";
import { SIGLE_PRIMA_PAGINA } from "@/date/sponsori";
import Buton from "@/componente/Buton";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import CifreIlustrate from "@/componente/acasa/CifreIlustrate";
import Erou from "@/componente/acasa/Erou";
import {
  Baloane,
  Banda,
  Bifa,
  Casuta,
  Copac,
  Dealuri,
  Nor,
  Pata,
  SageataDesenata,
  Soare,
} from "@/componente/acasa/Ilustratii";
import IndemnIlustrat from "@/componente/acasa/IndemnIlustrat";
import PozaLipita, { type Inclinare } from "@/componente/acasa/PozaLipita";
import Sarma from "@/componente/acasa/Sarma";
import Testimoniale, { type Testimonial } from "@/componente/acasa/Testimoniale";

/**
 * Dealurile dintre secțiuni se trag peste capătul secțiunii de deasupra.
 *
 * Dealul din spate și cel din mijloc se văd peste fundalul secțiunii de sus,
 * de aceea ea are spațiu jos cât înălțimea desenului, ca nimic din conținut
 * să nu intre sub ele. Dealul din față are culoarea secțiunii de jos, deci
 * trecerea e fără cusătură.
 */
const DEAL_PESTE = "-mt-16 sm:-mt-24 lg:-mt-36";

/**
 * Marginea tăiată de mână a cărților de hârtie.
 *
 * Filtrul definit o singură dată, mai jos în pagină, tremură ușor conturul:
 * o foaie tăiată cu foarfeca nu are margini perfect drepte. Se aplică doar
 * pe fundalul cărții (un strat separat), niciodată pe text — textul rămâne
 * drept și lizibil.
 */
const TAIAT = { filter: "url(#hartie-taiata)" } as const;

/**
 * 1.3 — cinci carduri, fiecare cu titlu, text scurt și un buton funcțional.
 *
 * Fiecare card e o foaie de hârtie colorată, lipită cu bandă, ușor strâmbă —
 * cu câteva grade, nu mai mult: formele rămân stabile și previzibile.
 * Donația e foaia mare, în culoarea de identitate; celelalte patru, în
 * tente spălate, ca butonul de donație să rămână cel mai aprins lucru.
 */
const MODURI_DE_SUSTINERE: ReadonlyArray<{
  pictograma: NumePictograma;
  titlu: string;
  text: string;
  buton: string;
  href: string;
  hartie: string;
  pata: string;
  inclinare: string;
}> = [
  {
    pictograma: "inima",
    titlu: "Donează",
    text: "Orice sumă contează enorm pentru a ne putea continua activitatea.",
    buton: "Donează acum",
    href: RUTE.doneaza,
    hartie: "bg-caramiziu-500",
    pata: "text-miere-300",
    inclinare: "-rotate-1",
  },
  {
    pictograma: "telefon",
    titlu: "Donează lunar prin SMS",
    text: `Trimite ${SMS.text} la ${SMS.numar} și donezi ${SMS.sumaLunara} pe lună, fără formulare.`,
    buton: "Cum funcționează",
    href: `${RUTE.doneaza}#sms`,
    hartie: "bg-miere-100",
    pata: "text-miere-300",
    inclinare: "rotate-1",
  },
  {
    pictograma: "document",
    titlu: "Redirecționează 3,5%",
    text: "Din impozitul pe venit, fără niciun cost pentru tine.",
    buton: "Redirecționează",
    href: RUTE.redirectionare35,
    hartie: "bg-turcoaz-100",
    pata: "text-turcoaz-300",
    inclinare: "-rotate-1",
  },
  {
    pictograma: "cladire",
    titlu: "Sponsorizează",
    text: "Pentru firme: sponsorizare prin contract și direcționare din impozitul pe profit.",
    buton: "Devino partener",
    href: RUTE.directionare20,
    hartie: "bg-hartie",
    pata: "text-caramiziu-200",
    inclinare: "rotate-1",
  },
  {
    pictograma: "familie",
    titlu: "Devino voluntar",
    text: "Alătură-te celor peste 300 de voluntari care ne sunt alături.",
    buton: "Vreau să ajut",
    href: RUTE.voluntar,
    hartie: "bg-caramiziu-100",
    pata: "text-caramiziu-300",
    inclinare: "-rotate-1",
  },
];

/**
 * 1.4 — trei campanii fixe, fără sume, fără bare de progres și fără termene.
 *
 * „Cazuri umanitare” nu are fotografie: caietul cere o imagine fără chipuri
 * recognoscibile, iar în arhiva preluată nu există una verificată. Până
 * vine, locul ei îl ține un desen.
 */
const CAMPANII: ReadonlyArray<{
  titlu: string;
  text: string;
  destinatie: string;
  inclinare: Inclinare;
  poza?: { cale: string; alt: string; legenda: string };
}> = [
  {
    titlu: "Tabere pentru copii și părinți",
    text: "Zile de joacă, liniște și sprijin pentru copiii cu nevoi speciale sau care au trecut prin cancer și familiile lor.",
    destinatie: "tabere",
    inclinare: "stanga",
    poza: {
      cale: "/poze/2024/11/438127627_457431750190502_3491066331294449444_n.jpg",
      alt: "Copii, părinți și voluntari în tricouri albe, în fața pensiunii din tabăra RESPIRO, sub un cer cu nori albi",
      legenda: "Tabăra RESPIRO",
    },
  },
  {
    titlu: "Casa Teona",
    text: "Un loc în care copiii învață prin joacă, iar părinții găsesc consiliere și sprijin.",
    destinatie: "casa-teona",
    inclinare: "dreapta",
    poza: {
      cale: "/poze/2024/11/poza1_enhanced-1.webp",
      alt: "Un copil arată copăcelul din hârtie cu frunze verzi pe care l-a făcut la un atelier de la Casa Teona",
      legenda: "Atelier creativ",
    },
  },
  {
    titlu: "Cazuri umanitare",
    text: "Ajutăm copii și familii în situații grele, acolo unde nevoia e urgentă.",
    destinatie: "cazuri-umanitare",
    inclinare: "stanga",
  },
];

/** 1.7 — cinci carduri statice, fără animații. */
const REALIZARI = [
  {
    titlu: "Prima tabără pentru copii care au trecut prin cancer",
    text: "Zile de bucurie pentru copii și pentru familiile lor.",
  },
  {
    titlu: "Tabăra Susținem Performanța",
    text: "Pentru copii premianți din sistemul de protecție a copilului.",
  },
  {
    titlu: "Două tabere pentru copii cu autism și sindrom Down",
    text: "Tabere dedicate, cu activități adaptate nevoilor lor.",
  },
  {
    titlu: "Peste 80 de copii la Casa Teona",
    text: "Ludoterapie, activități, minipetreceri de ziua lor, joacă și socializare.",
  },
  {
    titlu: "Cazuri umanitare",
    text: "Sprijin medical, ajutor pentru familii în nevoie și donații de laptopuri.",
  },
] as const;

/** Culoarea abțibildului cu numărul, pe rând. */
const ABTIBILDURI = [
  "text-caramiziu-200",
  "text-miere-200",
  "text-turcoaz-200",
  "text-miere-200",
  "text-caramiziu-200",
] as const;

const PUNCTE_CASA = [
  "Joacă și activități adaptate fiecărui copil",
  "Sprijin pentru întreaga familie",
] as const;

function citesteTestimoniale(): Testimonial[] {
  return JSON.parse(
    readFileSync(join(process.cwd(), "continut", "testimoniale.json"), "utf8"),
  );
}

/*
  Prima pagină, ca o carte de povești: un peisaj continuu, de sus în jos.

  Cerul e în erou, dealurile coboară spre cifre, cărțile de hârtie colorată
  stau pe pagina albă, pozele sunt lipite în album, sârma cu rufe trece pe
  la mijloc, iar la final soarele apune în spatele dealurilor. Culorile sunt
  cele trei ale asociației, în tentele lor; nimic nou.

  Liniile scrise de mână de deasupra titlurilor sunt textele de pe prima
  pagină a site-ului vechi, nu formulări noi. Caietul dictează titlurile și
  textele secțiunilor; aceste rânduri stau doar unde el nu spune nimic.
*/
export default function PrimaPagina() {
  const testimoniale = citesteTestimoniale();

  return (
    <>
      {/* Filtrul pentru marginile tăiate de mână: definit o dată, folosit
          de toate cărțile de hârtie din pagină. */}
      <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0">
        <filter id="hartie-taiata" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014"
            numOctaves="2"
            seed="7"
            result="zgomot"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="zgomot"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <Erou />

      {/* 1.2 — bara cu cifre, fără titlu. Dealurile vin peste cer. */}
      <Dealuri
        spate="text-turcoaz-100"
        mijloc="text-miere-100"
        fata="text-hartie"
        className={DEAL_PESTE}
      />
      <section className="bg-hartie pt-4 pb-10 lg:pt-6 lg:pb-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultatele noastre</h2>
          <CifreIlustrate />
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții: cinci foi de hârtie colorată. */}
      <section className="relative bg-hartie pt-16 pb-36 lg:pt-20 lg:pb-52">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Nor className="absolute top-10 right-[-3%] w-44 text-hartie-calda lg:w-64" />
          <Nor className="absolute bottom-40 left-[-5%] w-52 text-hartie-calda lg:w-72" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Caietul, la 1.3: „Titlul secțiunii: «Cum poți să ne susții».
              Fără frază introductivă.” */}
          <h2 className="max-w-2xl text-h2 text-cerneala">Cum poți să ne susții</h2>

          <ul className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {MODURI_DE_SUSTINERE.map((mod, i) => {
              const mare = i === 0;
              return (
                <li
                  key={mod.titlu}
                  className={mare ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}
                >
                  <article
                    className={`relative isolate flex h-full flex-col p-7 sm:p-8 ${mod.inclinare}`}
                  >
                    {/* Foaia: un strat separat, cu marginea tăiată de mână. */}
                    <span
                      aria-hidden="true"
                      style={TAIAT}
                      className={`absolute inset-0 -z-10 rounded-[18px_8px_16px_10px] ${mod.hartie} ${
                        mare
                          ? "shadow-[0_26px_50px_-24px_rgba(247,79,34,0.6)]"
                          : "shadow-[0_18px_36px_-22px_rgba(35,35,35,0.3)]"
                      }`}
                    />
                    <Banda className="-top-3 left-1/2 -translate-x-1/2 -rotate-2" />

                    {mare && (
                      <Soare
                        aria-hidden="true"
                        className="absolute top-6 right-6 size-28 text-miere-300 sm:size-36"
                      />
                    )}

                    {/* Pictograma stă pe o pată de hârtie, nu într-un pătrat. */}
                    <span className="relative flex size-16 items-center justify-center">
                      <Pata
                        varianta={i}
                        className={`absolute inset-0 size-full ${mod.pata} ${i % 2 ? "rotate-12" : "-rotate-6"}`}
                      />
                      <Pictograma
                        nume={mod.pictograma}
                        className={`relative size-8 ${mare ? "text-caramiziu-700" : "text-cerneala"}`}
                      />
                    </span>

                    <h3
                      className={`mt-7 ${mare ? "text-h3 text-hartie" : "text-h4 text-cerneala"}`}
                    >
                      {mod.titlu}
                    </h3>
                    <p
                      className={`mt-3 flex-1 ${mare ? "text-amplu text-hartie/90" : "text-corp text-cerneala-moale"}`}
                    >
                      {mod.text}
                    </p>

                    <div className={mare ? "mt-auto pt-10" : "mt-7"}>
                      {mare ? (
                        // Pe portocaliu, butonul portocaliu ar dispărea:
                        // aici cel mai puternic contrast e albul plin.
                        <Buton
                          href={mod.href}
                          varianta="contur"
                          marime="mare"
                          className="border-hartie bg-hartie text-caramiziu-600 hover:border-hartie hover:text-caramiziu-700"
                        >
                          {mod.buton}
                        </Buton>
                      ) : (
                        <Buton href={mod.href} varianta="contur" marime="mic">
                          {mod.buton}
                          <Pictograma nume="sageata" className="size-4" />
                        </Buton>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 1.4 — Campaniile noastre: trei poze lipite în album. */}
      <Dealuri
        spate="text-caramiziu-100"
        mijloc="text-miere-100"
        fata="text-tenta-cald"
        className={DEAL_PESTE}
      />
      <section className="granulatie relative bg-tenta-cald pt-6 pb-36 lg:pt-10 lg:pb-52">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="scris text-amplu text-caramiziu-600">
                Schimbăm vieți, construim speranță.
              </p>
              <h2 className="mt-2 max-w-2xl text-h2 text-cerneala">Campaniile noastre</h2>
            </div>
            {/* Adnotare scrisă de mână: butonul Susține duce la Donează cu
                destinația deja aleasă — exact ce spune și săgeata. */}
            <p className="scris hidden items-end gap-2 text-amplu text-turcoaz-700 lg:flex">
              <span className="max-w-56 leading-tight">
                donația ajunge exact unde alegi tu
              </span>
              <SageataDesenata className="mb-1 w-16 shrink-0 -rotate-12 text-turcoaz-500" />
            </p>
          </div>

          <ul className="mt-16 grid gap-x-10 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPANII.map((campanie, i) => (
              <li key={campanie.titlu}>
                <article className="flex h-full flex-col">
                  {campanie.poza ? (
                    <PozaLipita
                      cale={campanie.poza.cale}
                      alt={campanie.poza.alt}
                      legenda={campanie.poza.legenda}
                      inclinare={campanie.inclinare}
                      raport="aspect-[4/4.6]"
                      dimensiuni="(min-width: 1024px) 380px, 92vw"
                    />
                  ) : (
                    <PozaLipita
                      inclinare={campanie.inclinare}
                      raport="aspect-[4/4.6]"
                      legenda={`„${ASOCIATIA.motto}”`}
                      continut={<Casuta className="absolute inset-0 size-full" />}
                    />
                  )}

                  <h3 className="mt-10 text-h4 text-cerneala">{campanie.titlu}</h3>
                  <p className="mt-2 flex-1 text-corp text-cerneala-moale">
                    {campanie.text}
                  </p>
                  <Buton
                    href={`${RUTE.doneaza}?destinatie=${campanie.destinatie}`}
                    varianta={i === 0 ? "principal" : "contur"}
                    marime="mic"
                    className="mt-6 self-start"
                  >
                    Susține
                  </Buton>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.5 — Casa Teona, pe dealul turcoaz, cu doi copăcei. */}
      <div className="relative">
        <Dealuri
          spate="text-turcoaz-200"
          mijloc="text-turcoaz-100"
          fata="text-tenta-turcoaz"
          className={DEAL_PESTE}
        />
        <Copac className="absolute bottom-1 left-[9%] z-10 h-14 text-turcoaz-400 sm:h-20 lg:h-24" />
        <Copac className="absolute bottom-0 left-[15%] z-10 h-9 text-turcoaz-500 sm:h-12 lg:h-16" />
        <Copac className="absolute right-[12%] bottom-2 z-10 h-12 text-turcoaz-400 sm:h-16 lg:h-20" />
      </div>
      <section className="bg-tenta-turcoaz pt-10 pb-36 lg:pt-16 lg:pb-52">
        <div className="mx-auto grid max-w-7xl items-center gap-20 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
            <PozaLipita
              cale="/poze/2024/11/poza2_enhanced-1.webp"
              alt="Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde"
              legenda="La tablă, la Casa Teona"
              inclinare="stanga"
              banda="colturi"
              raport="aspect-[4/3.4]"
              dimensiuni="(min-width: 1024px) 460px, 74vw"
              className="absolute top-0 left-0 z-10 w-[70%] lg:w-[72%]"
            />
            {/* Clădirea, mai mică, lipită peste — ca o poză pusă peste alta. */}
            <PozaLipita
              cale="/poze/2024/11/poza3_enhanced.webp"
              alt="Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării"
              legenda={ADRESE.casaTeona.strada}
              inclinare="dreapta-mult"
              raport="aspect-square"
              dimensiuni="(min-width: 1024px) 250px, 40vw"
              className="absolute right-0 bottom-0 z-20 w-[44%] lg:w-[40%]"
            />
          </div>

          <div>
            <p className="scris text-amplu text-turcoaz-700">
              Ne dedicăm îmbunătățirii calității vieții copiilor cu nevoi speciale.
            </p>
            <h2 className="mt-2 text-h2 text-cerneala">Casa Teona</h2>

            <ul className="mt-8 grid gap-5">
              {PUNCTE_CASA.map((punct, i) => (
                <li key={punct} className="flex items-center gap-4">
                  <span className="relative flex size-12 shrink-0 items-center justify-center">
                    <Pata
                      varianta={i + 2}
                      className={`absolute inset-0 size-full text-turcoaz-200 ${i ? "rotate-12" : "-rotate-6"}`}
                    />
                    <Bifa className="relative size-6 text-turcoaz-700" />
                  </span>
                  <span className="text-amplu text-cerneala">{punct}</span>
                </li>
              ))}
            </ul>

            <Buton href={RUTE.casaTeona} className="mt-9">
              Află mai multe
            </Buton>

            {/* Adresa, scrisă de mână, cu săgeata spre poza clădirii. */}
            <p className="scris mt-8 flex items-start gap-3 text-amplu text-turcoaz-700">
              <SageataDesenata intoarsa className="mt-1 w-14 shrink-0 rotate-12 text-turcoaz-500" />
              <span className="leading-tight">
                ne găsești pe {ADRESE.casaTeona.strada}, {ADRESE.casaTeona.oras}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Sârma cu fotografii: fără titlu, fără buton. */}
      <Dealuri
        spate="text-turcoaz-200"
        mijloc="text-turcoaz-100"
        fata="text-hartie"
        className={DEAL_PESTE}
      />
      <Sarma />

      {/* 1.6 — Ne susțin. Sigle pe etichete albe, pe hârtie caldă. */}
      <Dealuri
        spate="text-miere-100"
        mijloc="text-tenta-miere"
        fata="text-hartie-calda"
        className="-mt-10 sm:-mt-14 lg:-mt-20"
      />
      <section className="granulatie relative bg-hartie-calda pt-4 pb-20 lg:pt-6 lg:pb-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-h3 text-cerneala">Ne susțin</h2>
            <Link
              href={RUTE.sponsori}
              className="scris inline-flex items-center gap-2 text-amplu text-caramiziu-600 underline-offset-4 transition hover:underline"
            >
              Vezi toți sponsorii
              <Pictograma nume="sageata" className="size-4" />
            </Link>
          </div>

          {/* Siglele își păstrează culorile; eticheta albă le dă aceeași
              înălțime, cum cere caietul, fără să le deformeze. Siglele sunt
              ale firmelor, deci stau drepte — nu strâmbe ca pozele. */}
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {SIGLE_PRIMA_PAGINA.map((sigla, i) => (
              <li key={sigla.nume}>
                <div
                  className={`flex h-24 items-center justify-center bg-hartie p-4 shadow-[0_10px_24px_-16px_rgba(35,35,35,0.35),0_1px_3px_rgba(35,35,35,0.06)] ${
                    i % 2 === 0
                      ? "rounded-[12px_5px_10px_6px]"
                      : "rounded-[5px_12px_6px_10px]"
                  }`}
                >
                  <Image
                    src={sigla.cale}
                    alt={sigla.nume}
                    width={200}
                    height={80}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.7 — Ce am realizat împreună în ultimul an. Statice, fără animații. */}
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-10 pb-36 lg:pt-14 lg:pb-56">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <p className="scris text-amplu text-caramiziu-600">
              Impactul campaniilor noastre.
            </p>
            <h2 className="mt-2 max-w-3xl text-h2 text-cerneala">
              Ce am realizat împreună în ultimul an
            </h2>
            <Baloane className="absolute -top-10 right-0 hidden h-44 lg:block xl:right-[4%]" />
          </div>

          {/* Trei foi pe primul rând și două, mai late, pe al doilea:
              cinci egale nu încap pe un rând fără să se rupă titlurile. */}
          <ol className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
            {REALIZARI.map((realizare, i) => (
              <li
                key={realizare.titlu}
                className={`${i < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${
                  i === 4 ? "sm:col-span-2 lg:col-span-3" : ""
                }`}
              >
                {/* „Cinci carduri statice, fără animații” (1.7): nimic nu se
                    ridică și nu se mișcă la trecerea cu mouse-ul. */}
                <article
                  className={`relative isolate flex h-full gap-5 p-6 sm:p-7 ${
                    i % 2 === 0 ? "-rotate-1" : "rotate-1"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    style={TAIAT}
                    className="absolute inset-0 -z-10 rounded-[16px_7px_14px_9px] bg-hartie shadow-[0_18px_36px_-22px_rgba(35,35,35,0.3)]"
                  />
                  <Banda className="-top-3 left-1/2 -translate-x-1/2 rotate-2" />

                  {/* Numărul, ca un abțibild rotund lipit în colț. */}
                  <span className="relative flex size-14 shrink-0 items-center justify-center">
                    <Pata
                      varianta={i}
                      className={`absolute inset-0 size-full ${ABTIBILDURI[i]} ${
                        i % 2 ? "rotate-12" : "-rotate-6"
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className="scris relative text-[1.75rem] leading-none font-bold text-cerneala"
                    >
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-h4 text-cerneala">{realizare.titlu}</h3>
                    <p className="mt-1.5 text-corp text-cerneala-moale">
                      {realizare.text}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>

          {/* „Sub carduri: butonul Vezi toate proiectele” (1.7). */}
          <div className="mt-14 text-center">
            <Buton href={RUTE.proiecte} varianta="secundar" marime="mare">
              Vezi toate proiectele
            </Buton>
          </div>
        </div>
      </section>

      {/* 1.8 — nu se randează cât timp asociația nu ne trimite testimonialele. */}
      <Testimoniale testimoniale={testimoniale} />

      <div className="-mt-20 sm:-mt-28 lg:-mt-40">
        <IndemnIlustrat titlu="Dăruiește timp, dăruiește speranță!" />
      </div>
    </>
  );
}
