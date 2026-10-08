import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ADRESE, ASOCIATIA, RUTE, SMS } from "@/date/asociatie";
import { SIGLE_PRIMA_PAGINA } from "@/date/sponsori";
import Pictograma from "@/componente/Pictograma";
import ButonEditorial from "@/componente/acasa/ButonEditorial";
import CapDeSectiune from "@/componente/acasa/CapDeSectiune";
import CifreEditorial from "@/componente/acasa/CifreEditorial";
import Erou from "@/componente/acasa/Erou";
import IndemnEditorial from "@/componente/acasa/IndemnEditorial";
import MozaicDeFotografii from "@/componente/acasa/MozaicDeFotografii";
import Testimoniale, { type Testimonial } from "@/componente/acasa/Testimoniale";
import { CONTINUT, GRILA, LINIE } from "@/componente/acasa/grila";

/*
  Prima pagină, așezată ca o revistă tipărită.

  Trei lucruri o țin: grila (vezi `grila.ts`), liniile subțiri de cerneală și
  scara. Titlurile de secțiune sunt cele mai mari lucruri de pe ecran,
  fotografiile ies până la marginea lui, cifrele sunt tratate ca elemente
  grafice. Nu există carduri cu umbră, colțuri rotunjite sau semne
  desenate prin colțuri: conținutul e ținut de linii și de spațiu.

  Varianta dinainte fusese respinsă de trei ori ca „seacă” și cu carduri
  „fără design”. Culorile rămân aceleași — clientul le-a cerut așa —, se
  schimbă așezarea și caracterul: densitate prin tipografie și imagine, nu
  prin decorațiuni.
*/

/** 1.3 — cinci rânduri, fiecare cu titlu, text scurt și un buton funcțional. */
const MODURI_DE_SUSTINERE = [
  {
    titlu: "Donează",
    text: "Orice sumă contează enorm pentru a ne putea continua activitatea.",
    buton: "Donează acum",
    href: RUTE.doneaza,
  },
  {
    titlu: "Donează lunar prin SMS",
    text: `Trimite ${SMS.text} la ${SMS.numar} și donezi ${SMS.sumaLunara} pe lună, fără formulare.`,
    buton: "Cum funcționează",
    href: `${RUTE.doneaza}#sms`,
  },
  {
    titlu: "Redirecționează 3,5%",
    text: "Din impozitul pe venit, fără niciun cost pentru tine.",
    buton: "Redirecționează",
    href: RUTE.redirectionare35,
  },
  {
    titlu: "Sponsorizează",
    text: "Pentru firme: sponsorizare prin contract și direcționare din impozitul pe profit.",
    buton: "Devino partener",
    href: RUTE.directionare20,
  },
  {
    titlu: "Devino voluntar",
    text: "Alătură-te celor peste 300 de voluntari care ne sunt alături.",
    buton: "Vreau să ajut",
    href: RUTE.voluntar,
  },
] as const;

/**
 * 1.4 — trei campanii fixe, fără sume, fără bare de progres și fără termene.
 *
 * „Cazuri umanitare” nu are fotografie: caietul cere o imagine fără chipuri
 * recognoscibile, iar în arhiva preluată nu există una verificată.
 */
const CAMPANII = [
  {
    titlu: "Tabere pentru copii și părinți",
    text: "Zile de joacă, liniște și sprijin pentru copiii cu nevoi speciale sau care au trecut prin cancer și familiile lor.",
    destinatie: "tabere",
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
  },
] as const;

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

const PUNCTE_CASA = [
  "Joacă și activități adaptate fiecărui copil",
  "Sprijin pentru întreaga familie",
] as const;

/** Numerotarea din listele numerotate: „01”, „02”… */
const numar = (i: number) => String(i + 1).padStart(2, "0");

/** Eticheta mică, cu majuscule rărite, folosită peste tot ca semn de grilă. */
const ETICHETA =
  "font-titlu text-nota font-bold tracking-[0.2em] text-cerneala-slab uppercase";

function citesteTestimoniale(): Testimonial[] {
  return JSON.parse(
    readFileSync(join(process.cwd(), "continut", "testimoniale.json"), "utf8"),
  );
}

/*
  Liniile scrise de mână de deasupra titlurilor sunt textele de pe prima
  pagină a site-ului vechi, nu formulări noi. Caietul dictează titlurile și
  textele secțiunilor; aceste rânduri stau doar unde el nu spune nimic.
*/
export default function PrimaPagina() {
  const testimoniale = citesteTestimoniale();

  return (
    <>
      <Erou />

      {/* 1.2 — bara cu cifre, fără titlu. */}
      <section className={`${GRILA} bg-hartie`}>
        <div className={`${CONTINUT} pt-12 pb-20 lg:pt-16 lg:pb-28`}>
          <h2 className="sr-only">Rezultatele noastre</h2>
          <CifreEditorial />
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții. Un cuprins, nu cinci cutii: fiecare
          rând are numărul lui, titlul, textul și butonul pe aceeași linie. */}
      <section className={`${GRILA} bg-hartie-calda`}>
        <div className={`${CONTINUT} py-20 lg:py-28`}>
          {/* Caietul, la 1.3: „Titlul secțiunii: «Cum poți să ne susții».
              Fără frază introductivă.” */}
          <CapDeSectiune numar="01" titlu="Cum poți să ne susții" />

          <ol className={`mt-14 border-b ${LINIE} lg:mt-20`}>
            {MODURI_DE_SUSTINERE.map((mod, i) => (
              <li
                key={mod.titlu}
                className={`grid gap-x-8 gap-y-4 border-t ${LINIE} py-8 transition-colors duration-300 hover:bg-hartie lg:grid-cols-12 lg:items-center lg:py-10`}
              >
                <span
                  aria-hidden="true"
                  className="font-titlu text-h3 leading-none font-extrabold text-caramiziu-500 tabular-nums lg:col-span-1"
                >
                  {numar(i)}
                </span>
                <h3 className="text-h3 text-cerneala lg:col-span-4">{mod.titlu}</h3>
                <p className="text-corp text-cerneala-moale lg:col-span-4 lg:text-amplu">
                  {mod.text}
                </p>
                <div className="lg:col-span-3 lg:text-right">
                  {/* Donația e singurul buton plin din listă: ierarhia
                      spune singură ce contează. */}
                  <ButonEditorial
                    href={mod.href}
                    varianta={i === 0 ? "principal" : "contur"}
                    marime="mic"
                  >
                    {mod.buton}
                    <Pictograma nume="sageata" className="size-4" />
                  </ButonEditorial>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 1.4 — Campaniile noastre. Prima campanie ia o pagină dublă: poza
          iese din grilă până la marginea din stânga, textul stă jos, în
          dreapta. Celelalte două împart rândul de dedesubt, inegal. */}
      <section className={`${GRILA} bg-hartie pt-20 lg:pt-28`}>
        <div className={CONTINUT}>
          <CapDeSectiune
            numar="02"
            scris="Schimbăm vieți, construim speranță."
            titlu="Campaniile noastre"
          />
        </div>

        {/* Prima campanie — poza. Rândurile sunt date explicit pe ecran
            lat, ca textul să poată sta pe lângă poză și legendă deodată. */}
        <figure className="col-start-1 col-end-15 mt-14 lg:col-end-9 lg:row-start-2 lg:mt-20">
          <div className="relative aspect-[4/3] overflow-hidden bg-hartie-umbra">
            <Image
              src={CAMPANII[0].poza.cale}
              alt={CAMPANII[0].poza.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
        <p
          className={`col-start-2 col-end-14 border-b ${LINIE} py-3 font-titlu text-mic font-bold text-cerneala lg:col-end-9 lg:row-start-3`}
        >
          <span className="mr-3 text-nota tracking-[0.2em] text-caramiziu-500 uppercase">
            Foto
          </span>
          {CAMPANII[0].poza.legenda}
        </p>

        {/* Prima campanie — textul, aliniat jos, lângă poză */}
        <article className="col-start-2 col-end-14 mt-8 lg:col-start-10 lg:row-start-2 lg:row-span-2 lg:mt-20 lg:self-end lg:pb-14">
          <p className={ETICHETA}>{numar(0)}</p>
          <h3 className="mt-4 text-h2 text-cerneala">{CAMPANII[0].titlu}</h3>
          <p className="mt-5 text-amplu text-cerneala-moale">{CAMPANII[0].text}</p>
          <ButonEditorial
            href={`${RUTE.doneaza}?destinatie=${CAMPANII[0].destinatie}`}
            className="mt-8"
          >
            Susține
            <Pictograma nume="sageata" className="size-5" />
          </ButonEditorial>
        </article>

        {/* A doua campanie: cinci coloane, poza pătrată, textul dedesubt */}
        <article className={`col-start-2 col-end-14 mt-16 border-t ${LINIE} pt-8 lg:col-end-7 lg:row-start-4 lg:mt-24`}>
          <p className={ETICHETA}>{numar(1)}</p>
          <div className="relative mt-6 aspect-square overflow-hidden bg-hartie-umbra">
            <Image
              src={CAMPANII[1].poza.cale}
              alt={CAMPANII[1].poza.alt}
              fill
              sizes="(min-width: 1024px) 32vw, 92vw"
              className="object-cover"
            />
          </div>
          <h3 className="mt-8 text-h3 text-cerneala">{CAMPANII[1].titlu}</h3>
          <p className="mt-3 text-corp text-cerneala-moale lg:text-amplu">
            {CAMPANII[1].text}
          </p>
          <ButonEditorial
            href={`${RUTE.doneaza}?destinatie=${CAMPANII[1].destinatie}`}
            varianta="contur"
            className="mt-7"
          >
            Susține
            <Pictograma nume="sageata" className="size-5" />
          </ButonEditorial>
        </article>

        {/* A treia campanie: fără chipuri recognoscibile. Până vine o
            fotografie potrivită, locul ei îl ține motto-ul, scris mare, pe
            miere spălată — un bloc tipografic, nu o poză de arhivă. */}
        <article className={`col-start-2 col-end-14 mt-16 flex flex-col border-t ${LINIE} pt-8 lg:col-start-8 lg:row-start-4 lg:mt-24`}>
          <p className={ETICHETA}>{numar(2)}</p>
          <div className="mt-6 flex flex-1 flex-col justify-between bg-tenta-miere p-8 lg:min-h-[28rem] lg:p-10">
            <p className="scris text-afis leading-[1.05] text-caramiziu-600">
              „{ASOCIATIA.motto}”
            </p>
            <div className="mt-16 lg:mt-20">
              <h3 className="text-h3 text-cerneala">{CAMPANII[2].titlu}</h3>
              <p className="mt-3 max-w-md text-corp text-cerneala-moale lg:text-amplu">
                {CAMPANII[2].text}
              </p>
              <ButonEditorial
                href={`${RUTE.doneaza}?destinatie=${CAMPANII[2].destinatie}`}
                varianta="contur"
                className="mt-7"
              >
                Susține
                <Pictograma nume="sageata" className="size-5" />
              </ButonEditorial>
            </div>
          </div>
        </article>

        <div className="col-start-2 col-end-14 h-20 lg:row-start-5 lg:h-28" />
      </section>

      {/* 1.5 — Casa Teona. Poza copiilor la tablă, mare, ieșind la marginea
          din stânga; titlul și cele două puncte în coloana din dreapta. */}
      <section className={`${GRILA} bg-hartie-calda`}>
        <div className={`${CONTINUT} border-t ${LINIE} pt-5`}>
          <p className={ETICHETA}>03</p>
        </div>

        <div className="order-2 col-start-2 col-end-14 py-10 lg:order-none lg:col-start-9 lg:row-start-2 lg:py-12">
          <p className="scris text-amplu text-turcoaz-700 lg:text-h4">
            Ne dedicăm îmbunătățirii calității vieții copiilor cu nevoi speciale.
          </p>
          <h2 className="mt-3 text-afis leading-[0.98] tracking-[-0.03em] text-cerneala lg:text-[5.5rem]">
            Casa Teona
          </h2>

          <ol className={`mt-10 border-b ${LINIE}`}>
            {PUNCTE_CASA.map((punct, i) => (
              <li
                key={punct}
                className={`flex items-baseline gap-5 border-t ${LINIE} py-5`}
              >
                <span
                  aria-hidden="true"
                  className="font-titlu text-h4 font-extrabold text-turcoaz-500 tabular-nums"
                >
                  {numar(i)}
                </span>
                <span className="font-titlu text-h4 leading-snug font-bold text-cerneala">
                  {punct}
                </span>
              </li>
            ))}
          </ol>

          <ButonEditorial href={RUTE.casaTeona} className="mt-10">
            Află mai multe
            <Pictograma nume="sageata" className="size-5" />
          </ButonEditorial>

          {/* Clădirea, mică, cu adresa dedesubt — ca o notă de subsol. */}
          <figure className="mt-14 flex items-end gap-5">
            <div className="relative aspect-square w-32 shrink-0 overflow-hidden bg-hartie-umbra sm:w-40">
              <Image
                src="/poze/2024/11/poza3_enhanced.webp"
                alt="Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <figcaption className={`border-b ${LINIE} pb-2 font-titlu text-mic text-cerneala-moale`}>
              <span className="block font-bold text-cerneala">{ADRESE.casaTeona.nume}</span>
              {ADRESE.casaTeona.strada}, {ADRESE.casaTeona.oras}
            </figcaption>
          </figure>
        </div>

        <figure className="order-1 col-start-1 col-end-15 mt-6 lg:order-none lg:col-end-8 lg:row-start-2 lg:mt-12 lg:mb-16 lg:self-stretch">
          <div className="relative aspect-square h-full w-full overflow-hidden bg-hartie-umbra lg:aspect-auto lg:min-h-[40rem]">
            <Image
              src="/poze/2024/11/poza2_enhanced-1.webp"
              alt="Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      </section>

      <MozaicDeFotografii />

      {/* 1.6 — Ne susțin. Siglele într-o grilă cu linii, nu în cutii cu umbră. */}
      <section className={`${GRILA} bg-hartie-calda`}>
        <div className={`${CONTINUT} py-20 lg:py-28`}>
          <CapDeSectiune
            numar="04"
            titlu="Ne susțin"
            dreapta={
              <Link
                href={RUTE.sponsori}
                className="inline-flex items-center gap-2 border-b-2 border-caramiziu-500 pb-1 font-titlu text-corp font-bold text-cerneala transition-colors hover:text-caramiziu-600"
              >
                Vezi toți sponsorii
                <Pictograma nume="sageata" className="size-4" />
              </Link>
            }
          />

          {/* Siglele își păstrează culorile: multe sunt deja pe alb și, trecute
              prin alb-negru, aproape dispăreau. Celulele egale le dau aceeași
              înălțime, așa cum cere caietul, fără să le deformeze. */}
          <ul
            className={`mt-14 grid grid-cols-2 gap-px border ${LINIE} bg-cerneala/15 sm:grid-cols-4 lg:mt-20 lg:grid-cols-7`}
          >
            {SIGLE_PRIMA_PAGINA.map((sigla) => (
              <li
                key={sigla.nume}
                className="flex h-28 items-center justify-center bg-hartie p-5 lg:h-32"
              >
                <Image
                  src={sigla.cale}
                  alt={sigla.nume}
                  width={200}
                  height={80}
                  className="max-h-full w-auto object-contain"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.7 — Ce am realizat împreună în ultimul an. Cinci carduri statice,
          ținute de linii, nu de umbre: trei pe primul rând, două mai late pe
          al doilea, fiecare cu numărul lui scris mare. */}
      <section className={`${GRILA} bg-hartie`}>
        <div className={`${CONTINUT} py-20 lg:py-28`}>
          <CapDeSectiune
            numar="05"
            scris="Impactul campaniilor noastre."
            titlu="Ce am realizat împreună în ultimul an"
          />

          <ol
            className={`mt-14 grid gap-px border ${LINIE} bg-cerneala/15 sm:grid-cols-2 lg:mt-20 lg:grid-cols-6`}
          >
            {REALIZARI.map((realizare, i) => (
              <li
                key={realizare.titlu}
                className={`${i < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${
                  i === 4 ? "sm:col-span-2 lg:col-span-3" : ""
                }`}
              >
                {/* „Cinci carduri statice, fără animații” (1.7): nimic nu se
                    ridică și nimic nu se colorează la trecerea cu mouse-ul. */}
                <article className="flex h-full flex-col bg-hartie p-7 lg:p-9">
                  <span
                    aria-hidden="true"
                    className="font-titlu text-[4.5rem] leading-none font-extrabold tracking-[-0.04em] text-caramiziu-500 tabular-nums lg:text-[5.5rem]"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-8 text-h4 text-cerneala lg:mt-10">{realizare.titlu}</h3>
                  <p className="mt-3 text-corp text-cerneala-moale">{realizare.text}</p>
                </article>
              </li>
            ))}
          </ol>

          {/* „Sub carduri: butonul Vezi toate proiectele” (1.7). */}
          <div className="mt-12">
            <ButonEditorial href={RUTE.proiecte} varianta="contur" marime="mare">
              Vezi toate proiectele
              <Pictograma nume="sageata" className="size-5" />
            </ButonEditorial>
          </div>
        </div>
      </section>

      {/* 1.8 — nu se randează cât timp asociația nu ne trimite testimonialele. */}
      <Testimoniale testimoniale={testimoniale} />

      <IndemnEditorial titlu="Dăruiește timp, dăruiește speranță!" />
    </>
  );
}
