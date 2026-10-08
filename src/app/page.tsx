import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ASOCIATIA, RUTE, SMS } from "@/date/asociatie";
import { SIGLE_SPONSORI } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Decor from "@/componente/Decor";
import Fotografie, { type Umbra } from "@/componente/Fotografie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import Erou from "@/componente/acasa/Erou";
import FasieDeFotografii from "@/componente/acasa/FasieDeFotografii";
import Testimoniale, { type Testimonial } from "@/componente/acasa/Testimoniale";

/**
 * Accentul fiecărui card.
 *
 * Trei culori care se rotesc, nu una pe toate: ochiul le ia ca pe lucruri
 * diferite, nu ca pe copii ale aceluiași. Culoarea tare stă pe pictogramă și
 * pe contur; fundalul rămâne spălat, ca butonul de donație să fie în
 * continuare cel mai aprins lucru din pagină.
 */
const ACCENTE = [
  {
    chip: "bg-caramiziu-100 text-caramiziu-600",
    plin: "group-hover:bg-caramiziu-500",
    umbra: "shadow-[0_18px_38px_-18px_rgba(247,79,34,0.5)]",
    numar: "text-caramiziu-300",
    fotografie: "caramiziu" as Umbra,
  },
  {
    chip: "bg-miere-100 text-miere-700",
    plin: "group-hover:bg-miere-400",
    umbra: "shadow-[0_18px_38px_-18px_rgba(255,172,0,0.5)]",
    numar: "text-miere-300",
    fotografie: "miere" as Umbra,
  },
  {
    chip: "bg-turcoaz-100 text-turcoaz-700",
    plin: "group-hover:bg-turcoaz-500",
    umbra: "shadow-[0_18px_38px_-18px_rgba(42,159,163,0.45)]",
    numar: "text-turcoaz-300",
    fotografie: "turcoaz" as Umbra,
  },
] as const;

/** 1.3 — cinci carduri, fiecare cu titlu, text scurt și un buton funcțional. */
const MODURI_DE_SUSTINERE: ReadonlyArray<{
  pictograma: NumePictograma;
  titlu: string;
  text: string;
  buton: string;
  href: string;
}> = [
  {
    pictograma: "inima",
    titlu: "Donează",
    text: "Orice sumă contează enorm pentru a ne putea continua activitatea.",
    buton: "Donează acum",
    href: RUTE.doneaza,
  },
  {
    pictograma: "telefon",
    titlu: "Donează lunar prin SMS",
    text: `Trimite ${SMS.text} la ${SMS.numar} și donezi ${SMS.sumaLunara} pe lună, fără formulare.`,
    buton: "Cum funcționează",
    href: `${RUTE.doneaza}#sms`,
  },
  {
    pictograma: "document",
    titlu: "Redirecționează 3,5%",
    text: "Din impozitul pe venit, fără niciun cost pentru tine.",
    buton: "Redirecționează",
    href: RUTE.redirectionare35,
  },
  {
    pictograma: "cladire",
    titlu: "Sponsorizează",
    text: "Pentru firme: sponsorizare prin contract și direcționare din impozitul pe profit.",
    buton: "Devino partener",
    href: RUTE.directionare20,
  },
  {
    pictograma: "familie",
    titlu: "Devino voluntar",
    text: "Alătură-te celor peste 300 de voluntari care ne sunt alături.",
    buton: "Vreau să ajut",
    href: RUTE.voluntar,
  },
];

/**
 * 1.4 — trei campanii fixe, fără sume, fără bare de progres și fără termene.
 *
 * „Cazuri umanitare” nu are fotografie: caietul cere o imagine fără chipuri
 * recognoscibile, iar în arhiva preluată nu există una verificată.
 */
const CAMPANII: ReadonlyArray<{
  titlu: string;
  text: string;
  destinatie: string;
  poza?: { cale: string; alt: string; legenda: string };
}> = [
  {
    titlu: "Tabere pentru copii și părinți",
    text: "Zile de joacă, liniște și sprijin pentru copiii cu nevoi speciale sau care au trecut prin cancer și familiile lor.",
    destinatie: "tabere",
    poza: {
      cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
      alt: "Copii și adulți în tabără, la munte, ținând litere care formează cuvântul „Mulțumim”",
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

const PUNCTE_CASA: ReadonlyArray<{ text: string; pictograma: NumePictograma }> = [
  { text: "Joacă și activități adaptate fiecărui copil", pictograma: "joaca" },
  { text: "Sprijin pentru întreaga familie", pictograma: "familie" },
];

function citesteTestimoniale(): Testimonial[] {
  return JSON.parse(
    readFileSync(join(process.cwd(), "continut", "testimoniale.json"), "utf8"),
  );
}

export default function PrimaPagina() {
  const testimoniale = citesteTestimoniale();

  return (
    <>
      <Erou />

      {/* 1.2 — bara cu cifre, fără titlu. Pe hârtie caldă, nu pe o bandă
          întunecată cu contoare: aia e bara de statistici a oricărui șablon. */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-16 lg:pb-20">
        {/* Semne desenate, ca pe marginea unui caiet. Decor, nu conținut. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-8 left-[6%] size-7 text-miere-300 lg:size-9" />
          <Decor semn="spirala" className="pluteste-lent absolute right-[8%] bottom-10 size-8 text-turcoaz-300 lg:size-11" />
          <Decor semn="unda" className="pluteste-lent absolute top-1/3 right-[4%] size-9 text-caramiziu-200 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultatele noastre</h2>
          <Cifre />
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții */}
      <Val culoare="text-hartie" />
      <section className="relative overflow-hidden bg-hartie pb-20 lg:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="inima" className="pluteste-lent absolute top-24 right-[5%] size-8 text-caramiziu-200 lg:size-11" />
          <Decor semn="soare" className="pluteste-lent absolute bottom-16 left-[3%] size-9 text-miere-200 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Caietul, la 1.3: „Titlul secțiunii: «Cum poți să ne susții».
              Fără frază introductivă.” */}
          <h2 className="max-w-2xl text-h2 text-cerneala">Cum poți să ne susții</h2>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODURI_DE_SUSTINERE.map((mod, i) => {
              const accent = ACCENTE[i % 3];
              return (
                <li key={mod.titlu} className={i === 0 ? "lg:col-span-2" : ""}>
                  <Aparitie intarziere={i * 0.05} className="h-full">
                    <article className="group relative h-full">
                      <div
                        className={`relative flex h-full flex-col gap-5 ${i % 2 === 0 ? "colt-a" : "colt-b"} bg-hartie p-6 transition-all duration-400 ease-cald group-hover:-translate-y-2 motion-reduce:group-hover:translate-y-0 ${accent.umbra} ${
                          i === 0 ? "sm:p-8 lg:flex-row lg:items-center lg:gap-7" : ""
                        }`}
                      >
                        <span
                          className={`flex shrink-0 items-center justify-center ${i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"} transition-all duration-400 ease-cald group-hover:-rotate-6 group-hover:scale-110 group-hover:text-hartie motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 ${accent.chip} ${accent.plin} ${
                            i === 0 ? "size-16" : "size-14"
                          }`}
                        >
                          <Pictograma
                            nume={mod.pictograma}
                            className={i === 0 ? "size-8" : "size-7"}
                          />
                        </span>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <h3
                            className={`text-cerneala ${i === 0 ? "text-h3" : "text-h4"}`}
                          >
                            {mod.titlu}
                          </h3>
                          <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                            {mod.text}
                          </p>
                          {i !== 0 && (
                            <Buton
                              href={mod.href}
                              varianta="contur"
                              marime="mic"
                              className="mt-5 self-start"
                            >
                              {mod.buton}
                              <Pictograma nume="sageata" className="size-4" />
                            </Buton>
                          )}
                        </div>

                        {i === 0 && (
                          <Buton href={mod.href} className="shrink-0 self-start">
                            {mod.buton}
                          </Buton>
                        )}
                      </div>
                    </article>
                  </Aparitie>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 1.4 — Campaniile noastre. Fotografii în arcade, nu carduri cu poză sus. */}
      <Val culoare="text-tenta-cald" />
      <section className="granulatie relative overflow-hidden bg-tenta-cald pb-20 lg:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-16 right-[7%] size-8 text-caramiziu-300 lg:size-11" />
          <Decor semn="unda" className="pluteste-lent absolute bottom-24 left-[4%] size-10 text-miere-300 lg:size-14" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-h2 text-cerneala">Campaniile noastre</h2>

          <ul className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPANII.map((campanie, i) => (
              <li key={campanie.titlu}>
                <Aparitie intarziere={i * 0.07} className="h-full">
                  <article className="group flex h-full flex-col">
                    {campanie.poza ? (
                      <Fotografie
                        cale={campanie.poza.cale}
                        alt={campanie.poza.alt}
                        legenda={campanie.poza.legenda}
                        umbra={ACCENTE[i % 3].fotografie}
                        colt={i % 2 === 0 ? "a" : "b"}
                        raport="aspect-[4/5]"
                        dimensiuni="(min-width: 1024px) 380px, 92vw"
                      />
                    ) : (
                      // Fără chipuri recognoscibile: până vine o fotografie
                      // potrivită, locul ei îl ține motto-ul, nu o poză de arhivă.
                      <div className="relative aspect-[4/5] overflow-hidden colt-b bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 shadow-[0_22px_45px_-20px_rgba(247,79,34,0.6)] transition-transform duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0">
                        <span
                          aria-hidden="true"
                          className="absolute -top-16 -right-16 size-56 rounded-full border-2 border-hartie/25"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-20 -left-12 size-48 rounded-full border-2 border-hartie/20"
                        />
                        <div className="relative flex size-full items-center justify-center px-8">
                          <p className="scris text-center text-h3 leading-tight text-hartie">
                            „{ASOCIATIA.motto}”
                          </p>
                        </div>
                      </div>
                    )}

                    <h3 className="mt-9 text-h4 text-cerneala">{campanie.titlu}</h3>
                    <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                      {campanie.text}
                    </p>
                    <Buton
                      href={`${RUTE.doneaza}?destinatie=${campanie.destinatie}`}
                      varianta={i === 0 ? "principal" : "contur"}
                      marime="mic"
                      className="mt-5 self-start"
                    >
                      Susține
                    </Buton>
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.5 — Casa Teona */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Aparitie>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <Fotografie
                cale="/poze/2024/11/poza2_enhanced-1.webp"
                alt="Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde"
                legenda="Casa Teona"
                umbra="turcoaz"
                colt="a"
                raport="aspect-[4/5]"
                dimensiuni="(min-width: 1024px) 420px, 88vw"
                className="w-[80%]"
              />
              {/* Clădirea, mai mică, suprapusă — ca o poză pusă peste alta. */}
              <div className="absolute right-0 bottom-6 w-[44%]">
                <div className="relative aspect-square overflow-hidden colt-b border-[6px] border-hartie bg-hartie shadow-[0_20px_40px_-18px_rgba(255,172,0,0.7)]">
                  <Image
                    src="/poze/2024/11/poza3_enhanced.webp"
                    alt="Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării"
                    fill
                    sizes="(min-width: 1024px) 240px, 44vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </Aparitie>

          <Aparitie intarziere={0.1}>
            <h2 className="text-h2 text-cerneala">Casa Teona</h2>

            <ul className="mt-8 grid gap-4">
              {PUNCTE_CASA.map((punct) => (
                <li
                  key={punct.text}
                  className="colt-a flex items-center gap-4 bg-turcoaz-50 p-4 shadow-[0_12px_28px_-20px_rgba(42,159,163,0.9)]"
                >
                  <span className="colt-mic-a flex size-11 shrink-0 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                    <Pictograma nume={punct.pictograma} className="size-5" />
                  </span>
                  <span className="text-amplu text-cerneala">{punct.text}</span>
                </li>
              ))}
            </ul>

            <Buton href={RUTE.casaTeona} className="mt-9">
              Află mai multe
            </Buton>
          </Aparitie>
        </div>
      </section>

      <FasieDeFotografii />

      {/* 1.7 — Ce am realizat împreună în ultimul an. Statice, fără animații. */}
      <section className="granulatie relative overflow-hidden bg-tenta-miere py-20 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="spirala" className="pluteste-lent absolute top-14 left-[5%] size-9 text-miere-400/70 lg:size-12" />
          <Decor semn="stea" className="pluteste-lent absolute right-[6%] bottom-16 size-7 text-caramiziu-300 lg:size-10" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl text-h2 text-cerneala">
              Ce am realizat împreună în ultimul an
            </h2>
            <Buton href={RUTE.proiecte} varianta="secundar">
              Vezi toate proiectele
            </Buton>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REALIZARI.map((realizare, i) => (
              <li
                key={realizare.titlu}
                className={i === 0 ? "sm:col-span-2" : undefined}
              >
                {/* „Cinci carduri statice, fără animații” (1.7). De aceea nu se
                    ridică la trecerea cu mouse-ul, ca restul cardurilor. */}
                <article className={`flex h-full gap-5 ${i % 2 === 0 ? "colt-a" : "colt-b"} bg-hartie p-6 shadow-[0_16px_34px_-20px_rgba(35,35,35,0.4)]`}>
                  <span
                    aria-hidden="true"
                    className={`font-titlu text-h2 leading-none font-extrabold ${ACCENTE[i % 3].numar}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-h4 text-cerneala">{realizare.titlu}</h3>
                    <p className="mt-1.5 text-mic text-cerneala-moale">
                      {realizare.text}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 1.6 — Ne susțin */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-h3 text-cerneala">Ne susțin</h2>
            <Link
              href={RUTE.sponsori}
              className="font-titlu text-mic font-semibold text-caramiziu-600 underline-offset-4 transition hover:underline"
            >
              Vezi toți sponsorii
            </Link>
          </div>

          {/* Siglele își păstrează culorile: multe sunt deja pe alb și, trecute
              prin alb-negru, aproape dispăreau. Chenarul le dă aceeași
              înălțime, așa cum cere caietul, fără să le deformeze. */}
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {SIGLE_SPONSORI.map((sigla) => (
              <li key={sigla.nume}>
                <div className="colt-mic-a flex h-24 items-center justify-center bg-hartie p-4 shadow-[0_10px_26px_-18px_rgba(35,35,35,0.45)] transition-all duration-300 ease-cald hover:-translate-y-1 hover:shadow-[0_16px_32px_-16px_rgba(247,79,34,0.4)] motion-reduce:hover:translate-y-0">
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

      {/* 1.8 — nu se randează cât timp asociația nu ne trimite testimonialele. */}
      <Testimoniale testimoniale={testimoniale} />

      <IndemnFinal />
    </>
  );
}
