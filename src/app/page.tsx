import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LINKURI_EXTERNE, RUTE, SMS } from "@/date/asociatie";
import { SIGLE_SPONSORI } from "@/date/sponsori";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Erou from "@/componente/acasa/Erou";
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
    pictograma: "maini",
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
 * recognoscibile, iar în arhiva preluată nu există una verificată. Cardul e
 * construit să arate bine și fără poză, nu să aștepte una.
 */
const CAMPANII: ReadonlyArray<{
  titlu: string;
  text: string;
  destinatie: string;
  poza?: { cale: string; alt: string };
}> = [
  {
    titlu: "Tabere pentru copii și părinți",
    text: "Zile de joacă, liniște și sprijin pentru copiii cu nevoi speciale sau care au trecut prin cancer și familiile lor.",
    destinatie: "tabere",
    poza: {
      cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
      alt: "Copii și adulți în tabără, la munte, ținând litere care formează cuvântul „Mulțumim”",
    },
  },
  {
    titlu: "Casa Teona",
    text: "Un loc în care copiii învață prin joacă, iar părinții găsesc consiliere și sprijin.",
    destinatie: "casa-teona",
    poza: {
      cale: "/poze/2024/11/poza1_enhanced-1.webp",
      alt: "Un copil arată copăcelul din hârtie cu frunze verzi pe care l-a făcut la un atelier de la Casa Teona",
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

  return (
    <>
      <Erou />

      {/* 1.2 — bara cu cifre, fără titlu. Pe telefon, câte două pe rând. */}
      <section className="border-b border-hartie-umbra bg-hartie py-14 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultatele noastre</h2>
          <Cifre />
        </div>
      </section>

      {/* 1.3 — Cum poți să ne susții */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-xl text-h2 text-cerneala">Cum poți să ne susții</h2>

          {/* Cinci carduri într-o grilă de trei lasă un gol pe al doilea rând.
              Flex cu lățime fixă le centrează pe ultimele două. */}
          <ul className="mt-12 flex flex-wrap justify-center gap-5">
            {MODURI_DE_SUSTINERE.map((mod, i) => (
              <li
                key={mod.titlu}
                className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
              >
                <Aparitie intarziere={i * 0.06} className="h-full">
                  <article className="group flex h-full flex-col rounded-card border border-hartie-umbra bg-hartie p-7 transition-colors duration-300 hover:border-caramiziu-300">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-caramiziu-50 text-caramiziu-600 transition-colors duration-300 group-hover:bg-caramiziu-500 group-hover:text-hartie">
                      <Pictograma nume={mod.pictograma} className="size-6" />
                    </span>
                    <h3 className="mt-5 text-h4 text-cerneala">{mod.titlu}</h3>
                    <p className="mt-2.5 flex-1 text-mic text-cerneala-moale">
                      {mod.text}
                    </p>
                    <Buton
                      href={mod.href}
                      varianta="contur"
                      marime="mic"
                      className="mt-6 self-start"
                    >
                      {mod.buton}
                      <Pictograma nume="sageata" className="size-4" />
                    </Buton>
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.4 — Campaniile noastre */}
      <section className="bg-hartie-calda py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Campaniile noastre</h2>

          <ul className="mt-12 grid gap-6 lg:grid-cols-3">
            {CAMPANII.map((campanie, i) => (
              <li key={campanie.titlu}>
                <Aparitie intarziere={i * 0.08} className="h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-card bg-hartie shadow-[0_2px_20px_-12px_rgba(35,35,35,0.3)]">
                    {campanie.poza ? (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={campanie.poza.cale}
                          alt={campanie.poza.alt}
                          fill
                          sizes="(min-width: 1024px) 420px, 100vw"
                          className="object-cover transition-transform duration-700 ease-cald hover:scale-105"
                        />
                      </div>
                    ) : (
                      // Fără chipuri recognoscibile: până vine o fotografie
                      // potrivită, cardul poartă motto-ul, nu o poză de arhivă.
                      <div className="flex aspect-[16/10] items-center justify-center bg-caramiziu-500 px-6">
                        <p className="scris text-center text-h3 text-hartie">
                          „Nimic fără Dumnezeu”
                        </p>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-7">
                      <h3 className="text-h4 text-cerneala">{campanie.titlu}</h3>
                      <p className="mt-2.5 flex-1 text-mic text-cerneala-moale">
                        {campanie.text}
                      </p>
                      <Buton
                        href={`${RUTE.doneaza}?destinatie=${campanie.destinatie}`}
                        marime="mic"
                        className="mt-6 self-start"
                      >
                        Susține
                      </Buton>
                    </div>
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.5 — Casa Teona */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Aparitie>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-amplu">
                <Image
                  src="/poze/2025/04/11zon_resized.webp"
                  alt="Un copil arată curcubeul pe care l-a făcut din bețișoare colorate, în sala de joacă de la Casa Teona"
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover"
                />
              </div>
              {/* Pată de culoare decalată: rupe grila, fără să fie decor gratuit. */}
              <div
                aria-hidden="true"
                className="absolute -bottom-5 -left-5 -z-10 size-32 rounded-amplu bg-miere-300/60 lg:size-44"
              />
            </div>
          </Aparitie>

          <Aparitie intarziere={0.1}>
            <h2 className="text-h2 text-cerneala">Casa Teona</h2>
            <ul className="mt-7 grid gap-4">
              {[
                "Joacă și activități adaptate fiecărui copil",
                "Sprijin pentru întreaga familie",
              ].map((punct) => (
                <li key={punct} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-miere-100 text-miere-700">
                    <Pictograma nume="joaca" className="size-4" />
                  </span>
                  <span className="text-amplu text-cerneala">{punct}</span>
                </li>
              ))}
            </ul>
            <Buton href={RUTE.casaTeona} className="mt-9">
              Află mai multe
            </Buton>
          </Aparitie>
        </div>
      </section>

      {/* 1.6 — Ne susțin */}
      <section className="border-y border-hartie-umbra bg-hartie py-16">
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
              prin alb-negru, aproape dispăreau. Chenarul le dă aceeași înălțime,
              așa cum cere caietul, fără să le deformeze. */}
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {SIGLE_SPONSORI.map((sigla) => (
              <li key={sigla.nume}>
                <div className="flex h-24 items-center justify-center rounded-moale border border-hartie-umbra bg-hartie-calda p-4 transition duration-300 hover:border-caramiziu-200 hover:bg-hartie">
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
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-h2 text-cerneala">
            Ce am realizat împreună în ultimul an
          </h2>

          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REALIZARI.map((realizare, i) => (
              <li
                key={realizare.titlu}
                className="flex flex-col rounded-card border border-hartie-umbra p-7"
              >
                <span
                  aria-hidden="true"
                  className="font-titlu text-h2 leading-none font-bold text-hartie-umbra"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-h4 text-cerneala">{realizare.titlu}</h3>
                <p className="mt-2.5 text-mic text-cerneala-moale">
                  {realizare.text}
                </p>
              </li>
            ))}
          </ol>

          <Buton href={RUTE.proiecte} varianta="secundar" className="mt-12">
            Vezi toate proiectele
          </Buton>
        </div>
      </section>

      {/* 1.8 — nu se randează cât timp asociația nu ne trimite testimonialele. */}
      <Testimoniale testimoniale={testimoniale} />

      {/* Ultimul îndemn: aceleași trei butoane ca la finalul celorlalte pagini. */}
      <section className="bg-cerneala py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="scris text-h3 text-miere-300">„Nimic fără Dumnezeu”</p>
          <h2 className="mt-4 text-h2 text-hartie">Alege cum vrei să ajuți</h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează
            </Buton>
            <Buton href={RUTE.voluntar} varianta="secundar" marime="mare">
              Devino voluntar
            </Buton>
            <Buton href={RUTE.directionare20} varianta="contur" marime="mare">
              Devino partener
            </Buton>
          </div>
          <p className="mt-8 text-mic text-hartie/55">
            Sau donează-ți ziua de naștere pe{" "}
            <a
              href={LINKURI_EXTERNE.galantom}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-hartie underline underline-offset-4"
            >
              Galantom
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
