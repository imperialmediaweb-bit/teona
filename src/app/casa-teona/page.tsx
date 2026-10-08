import type { Metadata } from "next";
import { ADRESE, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import Galerie from "@/componente/pagina/Galerie";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = {
  title: "Casa Teona",
  description:
    "Un loc unde copiii cu nevoi speciale învață prin joacă, iar părinții găsesc consiliere și sprijin.",
};

/**
 * 4.2 — descrierea casei, „împărțită în blocuri scurte, cu fotografii între
 * ele: jocuri și ateliere, petreceri, întâlnirile cu părinții”.
 *
 * Textul e cel din caietul de sarcini, neatins.
 */
const BLOCURI: ReadonlyArray<{
  titlu: string;
  pictograma: NumePictograma;
  paragrafe: ReadonlyArray<string>;
  poza: { cale: string; alt: string; legenda: string };
  umbra: "caramiziu" | "miere" | "turcoaz";
  pictogramaClase: string;
}> = [
  {
    titlu: "Jocuri și ateliere",
    pictograma: "senzorial",
    pictogramaClase: "bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]",
    paragrafe: [
      "Zilele la Casa Teona sunt pline de activități. Copiii se joacă prin jocuri senzoriale, care îi ajută să-și descopere simțurile și să se liniștească. Desenează, pictează și lucrează în ateliere creative, unde contează mai mult cât se bucură decât cât de bine le iese. Învață prin joacă, pentru că așa învață cel mai bine, și își fac prieteni cu care se simt în largul lor.",
    ],
    poza: {
      cale: "/poze/2024/11/WhatsApp-Image-2024-11-28-at-09.31.33-1.jpeg",
      alt: "Un băiețel urmărește conturul unei stele proiectate pe podeaua interactivă din sala senzorială",
      legenda: "Sala senzorială",
    },
    umbra: "turcoaz",
  },
  {
    titlu: "Petreceri",
    pictograma: "joaca",
    pictogramaClase: "bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]",
    paragrafe: [
      "Pentru mulți dintre copiii noștri, o petrecere obișnuită nu e ușor de organizat, iar aici găsesc un spațiu al lor, cu baloane, tort și oameni care se bucură împreună cu ei. Pentru un copil, să se simtă sărbătorit contează foarte mult.",
    ],
    poza: {
      cale: "/poze/2024/11/412883312_386434367290241_7393749290576299021_n.jpg",
      alt: "Copii și adulți la o petrecere, într-o sală decorată",
      legenda: "Minipetrecere",
    },
    umbra: "miere",
  },
  {
    titlu: "Întâlnirile cu părinții",
    pictograma: "familie",
    pictogramaClase: "bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]",
    paragrafe: [
      "Părinții sunt la fel de importanți ca și copiii. Mulți dintre ei duc zilnic o încărcătură pe care puțini o văd. De aceea, la Casa Teona au loc întâlniri de terapie de grup pentru părinți, în care pot vorbi deschis despre ce îi preocupă, pot primi consiliere și pot descoperi că alți părinți trec prin aceleași lucruri. Uneori, simplul fapt de a fi ascultat și înțeles face o mare diferență.",
      "Casa Teona înseamnă, în același timp, joacă, încredere, sprijin și apartenență la o comunitate. Este locul în care copiii pot fi copii, iar părinții pot respira. Dacă vrei să ne cunoști mai bine, să ne vizitezi sau să ne sprijini, ne bucurăm să te primim.",
    ],
    poza: {
      cale: "/poze/2024/11/379338367_6701680123253673_2000889653328296894_n.jpg",
      alt: "O femeie și o fată zâmbesc, obraz lângă obraz, într-o grădină cu flori",
      legenda: "Împreună",
    },
    umbra: "caramiziu",
  },
];

/** 4.4 — galeria. Fotografii reale de la casă, cu descrieri scrise de mână. */
const GALERIE = [
  {
    cale: "/poze/2024/11/poza1_enhanced-1.webp",
    alt: "Un copil arată copăcelul din hârtie cu frunze verzi făcut la atelierul creativ",
    legenda: "Atelier creativ",
  },
  {
    cale: "/poze/2024/11/339454935_239875385107246_1378022596723045576_n-1.jpg",
    alt: "Un copil se joacă pe covor cu piese colorate și creioane",
  },
  {
    cale: "/poze/2024/11/144023475_332382214670592_1377571819752151730_n.jpg",
    alt: "Doi copii cu un tort, la o aniversare",
  },
  {
    cale: "/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.13.jpeg",
    alt: "O voluntară și o fetiță, amândouă în tricourile albe ale asociației, în sala cu pictura din junglă de la Casa Teona, lângă standul cu brățări",
    legenda: "Sala cu junglă",
  },
  {
    cale: "/poze/2024/11/347598753_3647630975458046_6343055552353416081_n.jpg",
    alt: "Mâini la un atelier de pictură: o foaie cu o amprentă roșie de palmă, creioane colorate și sticluțe de tempera pe masă",
  },
  {
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară desenează împreună cu un copil, la masă",
  },
  {
    cale: "/poze/2024/11/413874579_386434257290252_5406161119704873877_n.jpg",
    alt: "Copii se joacă cu jucării de pluș pe o canapea, lângă un perete pictat cu cer și nori",
  },
  {
    cale: "/poze/2024/11/poza3_enhanced.webp",
    alt: "Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării",
    legenda: "Strada Zamca 22",
  },
] as const;

export default function CasaTeona() {
  const { casaTeona } = ADRESE;

  return (
    <>
      <AntetPagina
        scris="Aici nu există ritm greșit"
        titlu="Casa Teona"
        subtitlu="Un loc unde copiii cu nevoi speciale învață prin joacă, iar părinții găsesc consiliere și sprijin."
        accent="turcoaz"
        poza={{
          cale: "/poze/2024/11/poza3_enhanced.webp",
          alt: "Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării",
          legenda: "Strada Zamca 22",
        }}
        pozaMica={{
          cale: "/poze/2024/11/poza2_enhanced-1.webp",
          alt: "Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde",
        }}
        butoane={
          <>
            <Buton href={`tel:${TELEFON_PRINCIPAL.apel}`} marime="mare">
              <Pictograma nume="telefon" className="size-5" />
              Sună pentru programare
            </Buton>
            <Buton
              href={`${RUTE.doneaza}?destinatie=casa-teona`}
              varianta="secundar"
              marime="mare"
            >
              Sprijină Casa Teona
            </Buton>
          </>
        }
      />

      {/* 4.2 — fraza de deschidere stă într-un panou care iese peste valul
          antetului, ca banda de cifre de pe prima pagină. */}
      <section className="relative overflow-hidden bg-hartie pb-24 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="soare" className="pluteste-lent absolute top-40 right-[3%] size-9 text-miere-300 lg:size-12" />
          <Decor semn="unda" className="pluteste-lent absolute bottom-40 left-[2%] size-10 text-turcoaz-200 lg:size-14" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative z-20 -mt-6 colt-b border border-hartie-umbra bg-hartie p-7 shadow-[0_34px_70px_-30px_rgba(42,159,163,0.5)] sm:-mt-10 sm:p-9 lg:-mt-16 lg:flex lg:items-center lg:gap-10 lg:p-12">
            <span className="colt-mic-a flex size-16 shrink-0 items-center justify-center bg-turcoaz-100 text-turcoaz-700">
              <Pictograma nume="familie" className="size-8" />
            </span>
            <p className="mt-5 max-w-3xl font-titlu text-h4 leading-snug font-bold text-cerneala lg:mt-0">
              Casa Teona este o familie extinsă pentru copiii cu nevoi speciale
              și pentru părinții lor. Aici nu există ritm greșit: copiii se
              joacă și învață în felul lor, iar noi mergem alături de ei.
            </p>
          </div>

          <div className="mt-20 grid gap-20 lg:mt-28 lg:gap-28">
            {BLOCURI.map((bloc, i) => (
              <Aparitie key={bloc.titlu}>
                <div
                  className={`grid items-center gap-12 lg:grid-cols-12 lg:gap-16 ${
                    i % 2 === 1 ? "lg:[&>figure]:order-2" : ""
                  }`}
                >
                  <Fotografie
                    cale={bloc.poza.cale}
                    alt={bloc.poza.alt}
                    legenda={bloc.poza.legenda}
                    umbra={bloc.umbra}
                    bloc={bloc.umbra}
                    colt={i % 2 === 0 ? "a" : "b"}
                    raport="aspect-[4/3]"
                    dimensiuni="(min-width: 1024px) 560px, 92vw"
                    className="mx-auto w-full max-w-xl lg:col-span-6 lg:max-w-none"
                  />
                  <div className="lg:col-span-6">
                    <span
                      className={`inline-flex size-14 items-center justify-center ${
                        i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                      } ${bloc.pictogramaClase}`}
                    >
                      <Pictograma nume={bloc.pictograma} className="size-7" />
                    </span>
                    <h2 className="mt-6 text-h3 text-cerneala">{bloc.titlu}</h2>
                    <div className="mt-4 grid gap-4 text-cerneala-moale">
                      {bloc.paragrafe.map((paragraf) => (
                        <p key={paragraf.slice(0, 40)}>{paragraf}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </Aparitie>
            ))}
          </div>
        </div>
      </section>

      {/* 4.3 — cum poți veni */}
      <Val culoare="text-tenta-turcoaz" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-turcoaz pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="spirala" className="pluteste-lent absolute top-14 right-[6%] size-9 text-turcoaz-300 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <TitluSectiune
                scris="Te așteptăm"
                titlu="Cum poți veni la Casa Teona"
                culoare="turcoaz"
              />
              <p className="mt-6 text-amplu text-cerneala-moale">
                Accesul este gratuit, pe bază de programare. Programul este de
                luni până vineri, între orele 9:00 și 17:00.
              </p>
              <p className="mt-3 text-amplu text-cerneala-moale">
                Pentru programare, sună-ne la{" "}
                <a
                  href={`tel:${TELEFON_PRINCIPAL.apel}`}
                  className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
                >
                  {TELEFON_PRINCIPAL.afisat}
                </a>{" "}
                sau scrie-ne la{" "}
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
                >
                  {EMAIL.contact}
                </a>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Buton href={`tel:${TELEFON_PRINCIPAL.apel}`}>
                  <Pictograma nume="telefon" className="size-5" />
                  Sună pentru programare
                </Buton>
                <Buton href={`mailto:${EMAIL.contact}`} varianta="contur">
                  <Pictograma nume="plic" className="size-5" />
                  Scrie-ne
                </Buton>
              </div>
            </div>

            {/* Programul, scris mare pe un câmp turcoaz: e lucrul pe care
                un părinte vine să-l afle. */}
            <div className="lg:col-span-5">
              <div className="granulatie relative overflow-hidden colt-a bg-turcoaz-500 p-7 text-hartie shadow-[0_30px_60px_-28px_rgba(42,159,163,0.8)] sm:p-8">
                <Decor semn="soare" strokeWidth={0.8} className="absolute -top-10 -right-10 size-44 text-hartie/15" />
                <span className="colt-mic-b relative flex size-12 items-center justify-center bg-hartie/20">
                  <Pictograma nume="respiro" className="size-6" />
                </span>
                <p className="relative mt-5 font-titlu text-nota font-bold tracking-wider uppercase opacity-85">
                  Program
                </p>
                <p className="relative mt-1 font-titlu text-[2.4rem] leading-none font-extrabold tracking-tight">
                  Luni–vineri
                </p>
                <p className="relative mt-2 font-titlu text-h3 font-extrabold">
                  9:00–17:00
                </p>
                <p className="relative mt-5 inline-flex rounded-full bg-hartie/20 px-4 py-1.5 font-titlu text-mic font-semibold">
                  {casaTeona.acces}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.4 */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <Galerie
        scris="Din zilele noastre"
        titlu="Galerie foto"
        poze={GALERIE}
      />

      {/* 4.5 — unde ne găsiți */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-14 left-[3%] size-8 text-miere-300 lg:size-11" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune titlu="Unde ne găsiți" />

          <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="colt-a border border-hartie-umbra bg-hartie p-7 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] sm:p-9 lg:col-span-7">
              <ul className="grid gap-6 sm:grid-cols-2">
                {[
                  {
                    pictograma: "harta" as NumePictograma,
                    titlu: "Adresă",
                    continut: `${casaTeona.strada}, ${casaTeona.oras} ${casaTeona.cod}`,
                    clase: "bg-caramiziu-500 text-hartie",
                  },
                  {
                    pictograma: "respiro" as NumePictograma,
                    titlu: "Program",
                    continut: `${casaTeona.program} · ${casaTeona.acces}`,
                    clase: "bg-miere-400 text-cerneala",
                  },
                  {
                    pictograma: "telefon" as NumePictograma,
                    titlu: "Telefon",
                    continut: TELEFON_PRINCIPAL.afisat,
                    href: `tel:${TELEFON_PRINCIPAL.apel}`,
                    clase: "bg-turcoaz-500 text-hartie",
                  },
                  {
                    pictograma: "plic" as NumePictograma,
                    titlu: "Email",
                    continut: EMAIL.contact,
                    href: `mailto:${EMAIL.contact}`,
                    clase: "bg-caramiziu-100 text-caramiziu-600",
                  },
                ].map((rand, i) => (
                  <li key={rand.titlu} className="flex items-start gap-4">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center ${
                        i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                      } ${rand.clase}`}
                    >
                      <Pictograma nume={rand.pictograma} className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                        {rand.titlu}
                      </span>
                      {rand.href ? (
                        <a
                          href={rand.href}
                          className="font-titlu text-amplu font-bold break-words text-cerneala transition hover:text-caramiziu-600"
                        >
                          {rand.continut}
                        </a>
                      ) : (
                        <span className="font-titlu text-amplu font-bold text-cerneala">
                          {rand.continut}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locul hărții (4.5): fără hartă încorporată — ar aduce cookie-uri
                terțe înainte de orice acord — ci un card cu adresa scrisă mare
                și butonul care deschide harta în aplicația omului. */}
            <div className="granulatie relative flex flex-col overflow-hidden colt-b bg-turcoaz-100 p-7 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.6)] sm:p-9 lg:col-span-5">
              <Decor semn="unda" strokeWidth={0.8} className="absolute -right-10 -bottom-8 size-44 text-turcoaz-200" />
              <Decor semn="stea" className="absolute top-6 right-8 size-8 text-turcoaz-300" />
              <span className="colt-mic-a relative flex size-14 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                <Pictograma nume="harta" className="size-7" />
              </span>
              <p className="relative mt-6 font-titlu text-h3 font-extrabold text-turcoaz-900">
                {casaTeona.strada}
              </p>
              <p className="relative mt-1 text-amplu text-turcoaz-900/80">
                {casaTeona.oras}, {casaTeona.cod}
              </p>
              <div className="relative mt-auto pt-8">
                <Buton href={casaTeona.harta}>
                  <Pictograma nume="harta" className="size-4" />
                  Deschide în hartă
                </Buton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.6 — rezultate: fraza din caiet, cu cifra ei scrisă mare. */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultate</h2>
          <p
            aria-hidden="true"
            className="font-titlu text-[clamp(4rem,18vw,7rem)] leading-none font-extrabold tracking-tight text-caramiziu-500"
          >
            80+
          </p>
          <p className="scris mt-4 text-h3 text-cerneala">
            Peste 80 de copii ne-au trecut pragul și s-au jucat alături de noi.
          </p>
        </div>
      </section>

      {/* 4.7 */}
      <IndemnFinal peste />
    </>
  );
}
