import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ASOCIATIA, RUTE, SMS } from "@/date/asociatie";
import { SIGLE_SPONSORI } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Arcada from "@/componente/Arcada";
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
    chip: "bg-caramiziu-50 text-caramiziu-600",
    plin: "group-hover:bg-caramiziu-500",
    contur: "border-caramiziu-300",
    numar: "text-caramiziu-200",
  },
  {
    chip: "bg-miere-50 text-miere-700",
    plin: "group-hover:bg-miere-400",
    contur: "border-miere-300",
    numar: "text-miere-200",
  },
  {
    chip: "bg-turcoaz-50 text-turcoaz-700",
    plin: "group-hover:bg-turcoaz-500",
    contur: "border-turcoaz-300",
    numar: "text-turcoaz-200",
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
      <section className="granulatie bg-hartie-calda pt-6 pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultatele noastre</h2>
          <Cifre />
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="scris text-amplu text-turcoaz-600">
              Cinci feluri. Alege-l pe al tău.
            </p>
            <h2 className="mt-1 text-h2 text-cerneala">Cum poți să ne susții</h2>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODURI_DE_SUSTINERE.map((mod, i) => {
              const accent = ACCENTE[i % 3];
              return (
                <li key={mod.titlu} className={i === 0 ? "lg:col-span-2" : ""}>
                  <Aparitie intarziere={i * 0.05} className="h-full">
                    <article className="group relative h-full">
                      {/* Conturul decalat: adâncime trasă cu linia, nu ceața
                          cenușie de sub cardurile oricărei teme. */}
                      <div
                        aria-hidden="true"
                        className={`absolute inset-0 translate-x-2 translate-y-2 rounded-card border-2 transition-transform duration-300 ease-cald group-hover:translate-x-3 group-hover:translate-y-3 motion-reduce:group-hover:translate-x-2 motion-reduce:group-hover:translate-y-2 ${accent.contur}`}
                      />
                      <div
                        className={`relative flex h-full flex-col gap-5 rounded-card border-2 border-cerneala/10 bg-hartie p-6 transition-transform duration-300 ease-cald group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0 ${
                          i === 0 ? "sm:p-8 lg:flex-row lg:items-center lg:gap-7" : ""
                        }`}
                      >
                        <span
                          className={`flex shrink-0 items-center justify-center rounded-t-full rounded-b-2xl transition-all duration-300 ease-cald group-hover:text-hartie ${accent.chip} ${accent.plin} ${
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
      <section className="granulatie bg-tenta-cald pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="scris text-amplu text-caramiziu-600">
              Unde ajunge donația ta
            </p>
            <h2 className="mt-1 text-h2 text-cerneala">Campaniile noastre</h2>
          </div>

          <ul className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPANII.map((campanie, i) => (
              <li key={campanie.titlu}>
                <Aparitie intarziere={i * 0.07} className="h-full">
                  <article className="group flex h-full flex-col">
                    {campanie.poza ? (
                      <Arcada
                        cale={campanie.poza.cale}
                        alt={campanie.poza.alt}
                        legenda={campanie.poza.legenda}
                        contur={ACCENTE[i % 3].contur}
                        raport="aspect-[4/5]"
                        cuApropiere
                        dimensiuni="(min-width: 1024px) 380px, 92vw"
                      />
                    ) : (
                      // Fără chipuri recognoscibile: până vine o fotografie
                      // potrivită, locul ei îl ține motto-ul, nu o poză de arhivă.
                      <div className="relative aspect-[4/5]">
                        <div
                          aria-hidden="true"
                          className={`absolute inset-0 translate-x-3 translate-y-3 rounded-t-full rounded-b-amplu border-2 ${ACCENTE[i % 3].contur}`}
                        />
                        <div className="relative flex size-full items-center justify-center rounded-t-full rounded-b-amplu bg-caramiziu-500 px-8">
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
              <Arcada
                cale="/poze/2024/11/poza2_enhanced-1.webp"
                alt="Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde"
                legenda="Casa Teona"
                contur="border-turcoaz-300"
                raport="aspect-[4/5]"
                dimensiuni="(min-width: 1024px) 420px, 88vw"
                className="w-[80%]"
              />
              {/* Clădirea, mai mică, suprapusă — ca o poză pusă peste alta. */}
              <div className="absolute right-0 bottom-6 w-[44%]">
                <div className="relative aspect-square">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-2 translate-y-2 rounded-t-full rounded-b-amplu border-2 border-miere-300"
                  />
                  <div className="relative size-full overflow-hidden rounded-t-full rounded-b-amplu border-4 border-hartie bg-hartie">
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
            </div>
          </Aparitie>

          <Aparitie intarziere={0.1}>
            <p className="scris text-amplu text-turcoaz-600">
              Deschisă tot anul, nu doar vara
            </p>
            <h2 className="mt-1 text-h2 text-cerneala">Casa Teona</h2>

            <ul className="mt-8 grid gap-4">
              {PUNCTE_CASA.map((punct) => (
                <li
                  key={punct.text}
                  className="flex items-center gap-4 rounded-card border-2 border-turcoaz-100 bg-turcoaz-50/60 p-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-t-full rounded-b-2xl bg-turcoaz-500 text-hartie">
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
      <section className="granulatie bg-tenta-miere py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="scris text-amplu text-miere-700">Anul care a trecut</p>
              <h2 className="mt-1 text-h2 text-cerneala">
                Ce am realizat împreună
              </h2>
            </div>
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
                <article className="flex h-full gap-5 rounded-card border-2 border-cerneala/10 bg-hartie p-6">
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
                <div className="flex h-24 items-center justify-center rounded-card border-2 border-hartie-umbra bg-hartie-calda p-4 transition-colors duration-300 hover:border-caramiziu-200 hover:bg-hartie">
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
