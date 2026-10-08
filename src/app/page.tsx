import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ASOCIATIA, RUTE, SMS } from "@/date/asociatie";
import { SIGLE_SPONSORI } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Rama from "@/componente/Rama";
import SemnAripa from "@/componente/SemnAripa";
import Erou from "@/componente/acasa/Erou";
import FasieDeFotografii from "@/componente/acasa/FasieDeFotografii";
import Testimoniale, { type Testimonial } from "@/componente/acasa/Testimoniale";

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

function citesteTestimoniale(): Testimonial[] {
  return JSON.parse(
    readFileSync(join(process.cwd(), "continut", "testimoniale.json"), "utf8"),
  );
}

export default function PrimaPagina() {
  const testimoniale = citesteTestimoniale();
  const [campanieMare, ...campaniiMici] = CAMPANII;

  return (
    <>
      <Erou />

      {/* 1.2 — bara cu cifre, fără titlu. Pe bandă închisă, imediat după erou:
          altfel pagina ar fi fost albă de sus până jos. */}
      <section className="granulatie relative overflow-hidden bg-cerneala py-16 lg:py-20">
        <SemnAripa className="-top-16 -right-20 h-72 w-72 lg:-top-24 lg:h-[26rem] lg:w-[26rem]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultatele noastre</h2>
          <Cifre pe="inchis" />
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții.
          Titlul rămâne lipit în stânga cât timp cardurile trec prin dreapta:
          cinci carduri egale, puse într-o grilă, ar fi arătat ca orice șablon. */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20 lg:px-8">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="text-h2 text-cerneala">Cum poți să ne susții</h2>
            <p className="scris mt-5 text-h4 text-miere-500">
              Cinci feluri. Alege-l pe al tău.
            </p>
            <div className="relative mt-8 hidden aspect-[4/5] overflow-hidden rounded-amplu lg:block">
              <Image
                src="/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg"
                alt="Un copil sare în aer pe iarbă, cu părul în vânt"
                fill
                sizes="352px"
                className="object-cover"
              />
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {MODURI_DE_SUSTINERE.map((mod, i) => (
              <li
                key={mod.titlu}
                className={i === 0 ? "sm:col-span-2" : undefined}
              >
                <Aparitie intarziere={i * 0.05} className="h-full">
                  <article
                    className={`group flex h-full flex-col gap-5 rounded-card border border-hartie-umbra bg-hartie p-6 transition-colors duration-300 hover:border-caramiziu-300 ${
                      // Cardul lat se întinde pe un rând abia de la `sm`. Pe
                      // telefon, pictogramă + text + buton pe orizontală ieșeau
                      // din ecran și împingeau toată pagina lateral.
                      i === 0 ? "sm:flex-row sm:items-center sm:p-8" : ""
                    }`}
                  >
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-2xl bg-caramiziu-50 text-caramiziu-600 transition-colors duration-300 group-hover:bg-caramiziu-500 group-hover:text-hartie ${
                        i === 0 ? "size-14" : "size-12"
                      }`}
                    >
                      <Pictograma
                        nume={mod.pictograma}
                        className={i === 0 ? "size-7" : "size-6"}
                      />
                    </span>

                    <div className="flex flex-1 flex-col">
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
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.4 — Campaniile noastre. Prima e mare, celelalte două alături:
          trei carduri egale ar fi repetat ritmul secțiunii de dinainte. */}
      <section className="granulatie bg-hartie-calda py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Campaniile noastre</h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            <Aparitie className="h-full">
              <article className="flex h-full flex-col gap-7 rounded-amplu bg-hartie p-6 shadow-[0_2px_28px_-16px_rgba(35,35,35,0.35)] sm:p-8">
                {campanieMare.poza && (
                  <Rama
                    cale={campanieMare.poza.cale}
                    alt={campanieMare.poza.alt}
                    legenda={campanieMare.poza.legenda}
                    raport="aspect-[5/4]"
                    cuApropiere
                    dimensiuni="(min-width: 1024px) 560px, 92vw"
                  />
                )}
                <div className="mt-2 flex flex-1 flex-col">
                  <h3 className="text-h3 text-cerneala">{campanieMare.titlu}</h3>
                  <p className="mt-3 flex-1 text-cerneala-moale">
                    {campanieMare.text}
                  </p>
                  <Buton
                    href={`${RUTE.doneaza}?destinatie=${campanieMare.destinatie}`}
                    className="mt-7 self-start"
                  >
                    Susține
                  </Buton>
                </div>
              </article>
            </Aparitie>

            <div className="grid gap-6 [&>*]:min-w-0">
              {campaniiMici.map((campanie, i) => (
                <Aparitie key={campanie.titlu} intarziere={0.08 + i * 0.08}>
                  <article className="flex h-full flex-col gap-5 rounded-amplu bg-hartie p-5 shadow-[0_2px_24px_-16px_rgba(35,35,35,0.35)] sm:flex-row sm:items-center sm:p-6">
                    {campanie.poza ? (
                      <Rama
                        cale={campanie.poza.cale}
                        alt={campanie.poza.alt}
                        raport="aspect-[4/3]"
                        cuApropiere
                        dimensiuni="(min-width: 640px) 220px, 92vw"
                        className="w-full shrink-0 sm:w-44"
                      />
                    ) : (
                      // Fără chipuri recognoscibile: până vine o fotografie
                      // potrivită, locul ei îl ține motto-ul, nu o poză de arhivă.
                      <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center rounded-amplu border-[10px] border-hartie bg-caramiziu-500 p-3 shadow-[0_18px_50px_-24px_rgba(35,35,35,0.45)] sm:w-44">
                        <p className="scris text-center text-amplu leading-tight text-hartie">
                          „{ASOCIATIA.motto}”
                        </p>
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="text-h4 text-cerneala">{campanie.titlu}</h3>
                      <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                        {campanie.text}
                      </p>
                      <Buton
                        href={`${RUTE.doneaza}?destinatie=${campanie.destinatie}`}
                        varianta="contur"
                        marime="mic"
                        className="mt-4 self-start"
                      >
                        Susține
                      </Buton>
                    </div>
                  </article>
                </Aparitie>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 1.5 — Casa Teona. Două fotografii decalate: clădirea și ce se întâmplă
          înăuntru. O singură poză n-ar fi spus că e și un loc, și o activitate. */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Aparitie>
            <div className="relative">
              <Rama
                cale="/poze/2024/11/poza2_enhanced-1.webp"
                alt="Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde"
                raport="aspect-[4/5]"
                inclinare={-2}
                legenda="Casa Teona"
                dimensiuni="(min-width: 1024px) 420px, 78vw"
                className="w-[78%]"
              />
              <Rama
                cale="/poze/2024/11/poza3_enhanced.webp"
                alt="Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării"
                raport="aspect-square"
                inclinare={3}
                dimensiuni="(min-width: 1024px) 240px, 46vw"
                className="absolute right-0 bottom-0 w-[46%]"
              />
              <div
                aria-hidden="true"
                className="absolute -top-6 -left-6 -z-10 size-28 rounded-amplu bg-turcoaz-200/70 lg:size-40"
              />
            </div>
          </Aparitie>

          <Aparitie intarziere={0.1}>
            <h2 className="text-h2 text-cerneala">Casa Teona</h2>
            <ul className="mt-8 grid gap-5">
              {[
                "Joacă și activități adaptate fiecărui copil",
                "Sprijin pentru întreaga familie",
              ].map((punct) => (
                <li key={punct} className="flex items-start gap-4">
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-miere-100 text-miere-700">
                    <Pictograma nume="joaca" className="size-4.5" />
                  </span>
                  <span className="text-amplu text-cerneala">{punct}</span>
                </li>
              ))}
            </ul>
            <Buton href={RUTE.casaTeona} className="mt-10">
              Află mai multe
            </Buton>
          </Aparitie>
        </div>
      </section>

      <FasieDeFotografii />

      {/* 1.7 — Ce am realizat împreună în ultimul an. Statice, fără animații. */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-20 lg:px-8">
          <div>
            <h2 className="text-h2 text-cerneala">
              Ce am realizat împreună în ultimul an
            </h2>
            <Buton href={RUTE.proiecte} varianta="secundar" className="mt-8">
              Vezi toate proiectele
            </Buton>
          </div>

          {/* Fișe, nu paragrafe pe o linie: fiecare realizare e un lucru de
              sine stătător și se citește mai ușor separat. Numărul mare din
              colț ține șirul, fără să mai fie nevoie de o linie verticală. */}
          <ol className="grid gap-4 sm:grid-cols-2">
            {REALIZARI.map((realizare, i) => (
              <li
                key={realizare.titlu}
                className={i === 0 ? "sm:col-span-2" : undefined}
              >
                <article className="group relative flex h-full gap-5 overflow-hidden rounded-card border border-hartie-umbra bg-hartie p-6 transition-colors duration-300 hover:border-caramiziu-300">
                  <span
                    aria-hidden="true"
                    className="font-titlu text-h2 leading-none font-extrabold text-hartie-umbra transition-colors duration-300 group-hover:text-caramiziu-200"
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
      <section className="granulatie border-y border-hartie-umbra bg-hartie-calda py-16">
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
                <div className="flex h-24 items-center justify-center rounded-moale border border-hartie-umbra bg-hartie p-4 transition duration-300 hover:border-caramiziu-200">
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
