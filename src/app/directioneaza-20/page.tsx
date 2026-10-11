import type { Metadata } from "next";
import { JsonLd, jsonLdFir, jsonLdIntrebari, metadate } from "@/app/seo";
import Link from "next/link";
import {
  ASOCIATIA,
  CONTACT_FIRME,
  CONTURI,
  EMAIL,
  RUTE,
} from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import CalculatorSponsorizare from "@/componente/pagina/CalculatorSponsorizare";
import FormularSponsorizare from "@/componente/formular/FormularSponsorizare";
import AntetPagina from "@/componente/pagina/AntetPagina";
import DeCopiat from "@/componente/pagina/DeCopiat";
import DocumentDeDescarcat from "@/componente/pagina/DocumentDeDescarcat";
import Intrebari, { type Intrebare } from "@/componente/pagina/Intrebari";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = metadate({
  titlu: "Direcționează 20%",
  descriere:
    "Firma ta poate sponsoriza Asociația Teona Ariana Suceava din impozitul pe profit, prin contract de sponsorizare sau Declarația 177. Calculator și documente.",
  cale: "/directioneaza-20",
});

/**
 * 8.2 — cele două căi, fiecare cu patru pași.
 *
 * Termenele sunt lăsate goale intenționat: caietul de sarcini scrie, pentru
 * amândouă, „Termen: [de confirmat]”. Un termen fiscal greșit pe site-ul unei
 * asociații înseamnă o firmă care pierde dreptul de direcționare — așa că aici
 * nu se ghicește. Se completează când asociația confirmă datele.
 */
const CAI: ReadonlyArray<{
  titlu: string;
  text: string;
  pictograma: NumePictograma;
  pasi: ReadonlyArray<string>;
  card: string;
  pictogramaClase: string;
  numar: string;
}> = [
  {
    titlu: "Declarația 177",
    text: "Direcționarea bugetului de sponsorizare nealocat din anii anteriori.",
    pictograma: "document",
    card: "granulatie bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.85)]",
    pictogramaClase: "bg-hartie/20 text-hartie",
    numar: "bg-hartie text-caramiziu-600",
    pasi: [
      "Calculezi suma disponibilă.",
      "Semnezi contractul de sponsorizare.",
      "Depui Declarația 177 la ANAF.",
      "ANAF virează suma către asociație.",
    ],
  },
  {
    titlu: "Sponsorizare din impozitul pe profit",
    text: "Pentru anul în curs, prin contract de sponsorizare.",
    pictograma: "cladire",
    card: "granulatie bg-turcoaz-100 text-cerneala shadow-[0_30px_60px_-28px_rgba(42,159,163,0.6)]",
    pictogramaClase:
      "bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]",
    numar: "bg-turcoaz-500 text-hartie",
    pasi: [
      "Calculezi suma.",
      "Completezi contractul de sponsorizare.",
      "Îl semnezi.",
      "Virezi banii în contul asociației.",
    ],
  },
];

/** Câmpurile cardurilor cu persoanele de contact (8.7), fără fotografii. */
const CAMPURI_CONTACT = [
  "bg-caramiziu-100 text-caramiziu-600",
  "bg-miere-200 text-miere-800",
] as const;

function initiale(nume: string) {
  return nume
    .split(" ")
    .map((cuvant) => cuvant[0])
    .join("");
}

/**
 * Întrebările frecvente, în afara componentei: aceeași listă ajunge și pe
 * pagină, și în datele structurate (`FAQPage`), deci nu pot diverge.
 */
const INTREBARI: ReadonlyArray<Intrebare> = [
  {
    intrebare: "Ce este Declarația 177?",
    raspuns: (
      <p>
        Este declarația prin care o firmă cere ANAF să redirecționeze către o
        asociație sumele de sponsorizare la care avea dreptul în anii anteriori,
        dar pe care nu le-a folosit. Banii nu ies în plus din firmă: sunt sume
        care altfel rămân la stat.
      </p>
    ),
  },
  {
    intrebare: "Cum funcționează?",
    raspuns: (
      <p>
        Firma calculează suma de sponsorizare rămasă nealocată, semnează un
        contract de sponsorizare cu asociația și depune Declarația 177 la ANAF.
        ANAF virează apoi suma direct în contul asociației.
      </p>
    ),
  },
  {
    intrebare: "Ce condiții trebuie îndeplinite?",
    raspuns: (
      <>
        <p>
          Firma trebuie să fie plătitoare de impozit pe profit sau pe veniturile
          microîntreprinderilor, să aibă un contract de sponsorizare încheiat cu
          asociația și să nu aibă obligații fiscale restante.
        </p>
        <p>
          Suma care poate fi direcționată și termenele se stabilesc împreună cu
          contabilitatea firmei, pentru anul fiscal în curs.
        </p>
      </>
    ),
  },
  {
    intrebare: "Cum se depune?",
    raspuns: (
      <p>
        Declarația se depune electronic, prin Spațiul Privat Virtual sau prin
        portalul ANAF, de către firmă. Noi îți trimitem contractul semnat și
        datele asociației de care ai nevoie pentru completare.
      </p>
    ),
  },
];

export default function Directioneaza20() {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Direcționează 20%", cale: RUTE.directionare20 },
        ])}
      />
      <AntetPagina
        scris="Pentru firme"
        titlu="Direcționează până la 20% din impozitul pe profit"
        subtitlu="Firma ta poate susține copiii noștri, fără costuri suplimentare față de impozitul pe care îl plătește oricum."
        accent="turcoaz"
        poza={{
          cale: "/poze/2024/11/459590851_545309534736056_5697611419655887236_n.jpg",
          alt: "Copii în tricouri albe țin litere colorate care formează „Mulțumim Egger”, între două bannere ale asociației, în fața pensiunii din tabără",
          legenda: "Mulțumim",
        }}
        pozaMica={{
          cale: "/poze/2024/11/201900074_446697883239024_8848375334977008378_n-1-1.jpg",
          alt: "Copii și voluntari ridică foi cu litere care formează „Mulțumim Destine”, în fața pensiunii cu flori la ferestre",
        }}
        butoane={
          <>
            <Buton href="#documente" marime="mare">
              Descarcă contractul
              <Pictograma nume="sageata" className="size-5 rotate-90" />
            </Buton>
            <Buton
              href={`mailto:${EMAIL.contact}`}
              varianta="contur"
              marime="mare"
            >
              <Pictograma nume="plic" className="size-5" />
              Scrie-ne
            </Buton>
          </>
        }
      />

      {/* 8.2 */}
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-16 right-[4%] size-9 text-miere-300 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Alege calea potrivită firmei tale"
            titlu="Două căi"
            culoare="turcoaz"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {CAI.map((cale, i) => (
              <Aparitie
                key={cale.titlu}
                intarziere={i * 0.06}
                className="h-full"
              >
                <section
                  className={`relative flex h-full flex-col overflow-hidden ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } p-7 sm:p-9 ${cale.card}`}
                >
                  <Decor
                    semn={i === 0 ? "unda" : "spirala"}
                    strokeWidth={0.8}
                    className={`absolute -right-12 -bottom-12 size-52 ${
                      i === 0 ? "text-hartie/15" : "text-turcoaz-200"
                    }`}
                  />
                  <span
                    className={`relative flex size-14 items-center justify-center ${
                      i % 2 === 0 ? "colt-mic-b" : "colt-mic-a"
                    } ${cale.pictogramaClase}`}
                  >
                    <Pictograma nume={cale.pictograma} className="size-7" />
                  </span>
                  <h3
                    className={`relative mt-6 text-h3 ${i === 0 ? "text-hartie" : "text-turcoaz-900"}`}
                  >
                    {cale.titlu}
                  </h3>
                  <p
                    className={`relative mt-2 text-amplu ${i === 0 ? "text-hartie/90" : "text-turcoaz-900/80"}`}
                  >
                    {cale.text}
                  </p>

                  <ol className="relative mt-8 grid gap-3">
                    {cale.pasi.map((pas, j) => (
                      <li
                        key={pas}
                        className={`flex items-center gap-4 ${
                          j % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                        } px-4 py-3 ${i === 0 ? "bg-hartie/15" : "bg-hartie"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full font-titlu text-mic font-extrabold ${cale.numar}`}
                        >
                          {j + 1}
                        </span>
                        <span
                          className={`font-titlu text-corp font-bold ${i === 0 ? "text-hartie" : "text-cerneala"}`}
                        >
                          {pas}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* Termenul vine de la asociație — vezi comentariul de la CAI. */}
                  <p
                    className={`relative mt-6 text-nota ${i === 0 ? "text-hartie/80" : "text-turcoaz-900/70"}`}
                  >
                    Termenul de depunere îl confirmăm împreună cu contabilitatea
                    firmei tale, pentru anul fiscal în curs.
                  </p>
                </section>
              </Aparitie>
            ))}
          </div>
        </div>
      </section>

      {/* 8.3 */}
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
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <TitluSectiune
                scris="Modelele asociației"
                titlu="Documente de descărcat"
              />
              <p className="mt-6 text-amplu text-cerneala-moale">
                Vrei un contract personalizat? Scrie-ne la{" "}
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
                >
                  {EMAIL.contact}
                </a>{" "}
                și ne ocupăm împreună de toate documentele.
              </p>
              <Buton href={`mailto:${EMAIL.contact}`} className="mt-7">
                <Pictograma nume="plic" className="size-5" />
                Scrie-ne
              </Buton>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
              <li>
                <Aparitie className="h-full">
                  <DocumentDeDescarcat
                    titlu="Contract de sponsorizare"
                    descriere="Modelul de contract, gata de completat de firma ta."
                    format="Word"
                    colt="a"
                  />
                </Aparitie>
              </li>
              <li>
                <Aparitie intarziere={0.06} className="h-full">
                  <DocumentDeDescarcat
                    titlu="Declarația 177"
                    descriere="Modelul declarației, completat cu datele asociației."
                    format="PDF"
                    colt="b"
                  />
                </Aparitie>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 8.4 — calculatorul fiscal. */}
      <Val culoare="text-tenta-turcoaz" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-turcoaz pt-6 pb-24 lg:pt-10 lg:pb-28">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Înainte de contract"
            titlu="Cât poate direcționa firma ta"
            text="Scrie cele două cifre din bilanț și vezi pe loc suma maximă."
            culoare="turcoaz"
          />
          <div className="mt-10">
            <CalculatorSponsorizare />
          </div>

          {/*
            Cererea stă imediat sub calculator, nu într-o secțiune a ei.
            Firma care tocmai a văzut suma e exact firma care vrea să scrie —
            dacă o trimitem mai departe, prin încă trei secțiuni, până la
            telefoanele de la 8.7, se pierde pe drum.
          */}
          <div id="cerere" className="mt-16 scroll-mt-32">
            <TitluSectiune
              scris="Un singur pas"
              titlu="Trimiteți-ne datele firmei"
              text="Vă răspundem cu contractul de sponsorizare completat cu datele noastre. Suma și termenul le stabilim împreună cu contabilitatea dumneavoastră."
              culoare="turcoaz"
            />
            <div className="mt-10 lg:max-w-4xl">
              <FormularSponsorizare />
            </div>
          </div>
        </div>
      </section>

      {/* 8.5 */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <JsonLd date={jsonLdIntrebari(INTREBARI)} />
      <Intrebari
        scris="Pe scurt"
        titlu="Întrebări frecvente despre Declarația 177"
        poza={{
          cale: "/poze/2024/11/454844538_521713703762306_4995698762778889688_n-1.jpg",
          alt: "Copii, părinți și voluntari în tricouri albe, așezați pe iarbă între două bannere ale asociației, în fața pensiunii din tabără",
          legenda: "Tabăra RESPIRO",
        }}
        intrebari={INTREBARI}
      />

      {/* 8.6 */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-12 right-[5%] size-10 text-miere-300 lg:size-14"
          />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <Fotografie
            cale="/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp"
            alt="Copii și adulți în tricouri EGGER țin litere care formează „Mulțumim Egger”, în fața unui hambar de lemn negru cu o lună aurie și textul „Love you to the moon and back”"
            legenda="Mulțumim"
            umbra="caramiziu"
            bloc="caramiziu"
            colt="a"
            raport="aspect-[4/3]"
            dimensiuni="(min-width: 1024px) 480px, 92vw"
            className="mx-auto w-full max-w-xl lg:col-span-5 lg:max-w-none"
          />
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
                părinții respiră și află că nu sunt singuri. Am organizat 33 de
                tabere și am avut alături peste 1.500 de participanți.
              </p>
              <p>
                Bucuria nu ține doar câteva zile pe an. La Casa Teona, copiii
                vin pe tot parcursul anului la jocuri și ateliere, iar părinții
                găsesc consiliere și întâlniri de grup.
              </p>
              <p>
                Fiecare sumă direcționată ajută la acest lucru: tabere,
                activități și un loc sigur pentru copii și familiile lor.
              </p>
            </div>

            <Buton href={RUTE.sponsori} varianta="contur" className="mt-8">
              Vezi cine ne mai susține
              <Pictograma nume="sageata" className="size-4" />
            </Buton>
          </div>
        </div>
      </section>

      {/* 8.7 */}
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
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Vorbim direct"
            titlu="Contact și date de cont"
          />

          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {CONTACT_FIRME.map((persoana, i) => (
              <li key={persoana.email}>
                <Aparitie intarziere={i * 0.06} className="h-full">
                  <div
                    className={`flex h-full gap-5 ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)]`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-16 shrink-0 items-center justify-center ${
                        i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                      } font-titlu text-h4 font-extrabold ${CAMPURI_CONTACT[i % 2]}`}
                    >
                      {initiale(persoana.nume)}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-titlu text-amplu font-bold text-cerneala">
                        {persoana.nume}
                      </span>
                      <span className="mt-1 inline-flex rounded-full bg-caramiziu-100 px-3 py-0.5 font-titlu text-nota font-bold text-caramiziu-700">
                        {persoana.rol}
                      </span>
                      <a
                        href={`mailto:${persoana.email}`}
                        className="mt-4 flex min-h-10 items-center gap-2 text-mic break-all text-cerneala-moale transition hover:text-caramiziu-600"
                      >
                        <Pictograma nume="plic" className="size-4 shrink-0" />
                        {persoana.email}
                      </a>
                      <a
                        href={`tel:${persoana.telefon.apel}`}
                        className="flex min-h-10 items-center gap-2 font-titlu text-corp font-bold text-cerneala transition hover:text-caramiziu-600"
                      >
                        <Pictograma
                          nume="telefon"
                          className="size-4 shrink-0"
                        />
                        {persoana.telefon.afisat}
                      </a>
                    </div>
                  </div>
                </Aparitie>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-3">
            <DeCopiat eticheta="Titular" valoare={ASOCIATIA.denumireLegala} />
            <DeCopiat
              eticheta="CIF"
              valoare={ASOCIATIA.cif}
              culoare="miere"
              colt="b"
            />
            {CONTURI.map((cont, i) => (
              <DeCopiat
                key={cont.iban}
                eticheta={`IBAN ${cont.banca} (${cont.moneda})`}
                valoare={cont.iban}
                deCopiat={cont.iban.replace(/\s/g, "")}
                culoare={i % 2 === 0 ? "turcoaz" : "caramiziu"}
                colt={i % 2 === 0 ? "a" : "b"}
              />
            ))}
          </div>

          <p className="mt-8 text-mic text-cerneala-moale">
            Ești persoană fizică? Atunci te interesează{" "}
            <Link
              href={RUTE.redirectionare35}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              Redirecționează 3,5%
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
