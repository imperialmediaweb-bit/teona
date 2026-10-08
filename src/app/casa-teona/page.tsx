import type { Metadata } from "next";
import { ADRESE, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import Galerie from "@/componente/pagina/Galerie";

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
}> = [
  {
    titlu: "Jocuri și ateliere",
    pictograma: "senzorial",
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
    paragrafe: [
      "Părinții sunt la fel de importanți ca și copiii. Mulți dintre ei duc zilnic o încărcătură pe care puțini o văd. De aceea, la Casa Teona au loc întâlniri de terapie de grup pentru părinți, în care pot vorbi deschis despre ce îi preocupă, pot primi consiliere și pot descoperi că alți părinți trec prin aceleași lucruri. Uneori, simplul fapt de a fi ascultat și înțeles face o mare diferență.",
      "Casa Teona înseamnă, în același timp, joacă, încredere, sprijin și apartenență la o comunitate. Este locul în care copiii pot fi copii, iar părinții pot respira. Dacă vrei să ne cunoști mai bine, să ne vizitezi sau să ne sprijini, ne bucurăm să te primim.",
    ],
    poza: {
      cale: "/poze/2024/11/poza2_enhanced-1.webp",
      alt: "Trei copii desenează pe o tablă albă pe care scrie „Casa Teona” cu verde",
      legenda: "Atelier",
    },
    umbra: "caramiziu",
  },
];

/** 4.4 — galeria. Fotografii reale de la casă, cu descrieri scrise de mână. */
const GALERIE = [
  {
    cale: "/poze/2024/11/poza1_enhanced-1.webp",
    alt: "Un copil arată copăcelul din hârtie cu frunze verzi făcut la atelierul creativ",
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
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară desenează împreună cu un copil, la masă",
  },
  {
    cale: "/poze/2024/11/poza3_enhanced.webp",
    alt: "Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării",
  },
] as const;

export default function CasaTeona() {
  const { casaTeona } = ADRESE;

  return (
    <>
      <AntetPagina
        titlu="Casa Teona"
        subtitlu="Un loc unde copiii cu nevoi speciale învață prin joacă, iar părinții găsesc consiliere și sprijin."
        poza={{
          cale: "/poze/2024/11/poza3_enhanced.webp",
          alt: "Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării",
          legenda: "Strada Zamca 22",
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

      {/* 4.2 */}
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="max-w-3xl text-amplu text-cerneala">
            Casa Teona este o familie extinsă pentru copiii cu nevoi speciale și
            pentru părinții lor. Aici nu există ritm greșit: copiii se joacă și
            învață în felul lor, iar noi mergem alături de ei.
          </p>

          <div className="mt-16 grid gap-20">
            {BLOCURI.map((bloc, i) => (
              <Aparitie key={bloc.titlu}>
                <div
                  className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                    i % 2 === 1 ? "lg:[&>figure]:order-2" : ""
                  }`}
                >
                  <Fotografie
                    cale={bloc.poza.cale}
                    alt={bloc.poza.alt}
                    legenda={bloc.poza.legenda}
                    umbra={bloc.umbra}
                    colt={i % 2 === 0 ? "a" : "b"}
                    raport="aspect-[4/3]"
                    dimensiuni="(min-width: 1024px) 560px, 92vw"
                  />
                  <div>
                    <span
                      className={`mb-5 inline-flex size-14 items-center justify-center ${
                        i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                      } bg-turcoaz-100 text-turcoaz-700`}
                    >
                      <Pictograma nume={bloc.pictograma} className="size-7" />
                    </span>
                    <h2 className="text-h3 text-cerneala">{bloc.titlu}</h2>
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

      {/* 4.3 */}
      <Val culoare="text-tenta-turcoaz" />
      <section className="granulatie relative overflow-hidden bg-tenta-turcoaz pb-20 lg:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-14 right-[6%] size-9 text-miere-300 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Cum poți veni la Casa Teona</h2>
          <p className="mt-5 text-amplu text-cerneala-moale">
            Accesul este gratuit, pe bază de programare. Programul este de luni
            până vineri, între orele 9:00 și 17:00.
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
        </div>
      </section>

      {/* 4.4 */}
      <Val culoare="text-hartie" />
      <Galerie titlu="Galerie foto" poze={GALERIE} />

      {/* 4.5 */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Unde ne găsiți</h2>

          <div className="colt-a mt-10 grid gap-6 bg-hartie p-8 shadow-[0_20px_42px_-24px_rgba(35,35,35,0.5)] sm:p-10">
            <ul className="grid gap-5">
              {[
                {
                  pictograma: "harta" as NumePictograma,
                  titlu: "Adresă",
                  continut: `${casaTeona.strada}, ${casaTeona.oras} ${casaTeona.cod}`,
                },
                {
                  pictograma: "respiro" as NumePictograma,
                  titlu: "Program",
                  continut: `${casaTeona.program} · ${casaTeona.acces}`,
                },
                {
                  pictograma: "telefon" as NumePictograma,
                  titlu: "Telefon",
                  continut: TELEFON_PRINCIPAL.afisat,
                  href: `tel:${TELEFON_PRINCIPAL.apel}`,
                },
                {
                  pictograma: "plic" as NumePictograma,
                  titlu: "Email",
                  continut: EMAIL.contact,
                  href: `mailto:${EMAIL.contact}`,
                },
              ].map((rand) => (
                <li key={rand.titlu} className="flex items-start gap-4">
                  <span className="colt-mic-a flex size-11 shrink-0 items-center justify-center bg-caramiziu-100 text-caramiziu-600">
                    <Pictograma nume={rand.pictograma} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                      {rand.titlu}
                    </span>
                    {rand.href ? (
                      <a
                        href={rand.href}
                        className="font-titlu text-amplu font-bold text-cerneala transition hover:text-caramiziu-600"
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

            <Buton href={casaTeona.harta} varianta="contur" className="w-fit">
              <Pictograma nume="harta" className="size-4" />
              Deschide în hartă
            </Buton>
          </div>
        </div>
      </section>

      {/* 4.6 */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="sr-only">Rezultate</h2>
          <p className="scris text-h3 text-caramiziu-600">
            Peste 80 de copii ne-au trecut pragul și s-au jucat alături de noi.
          </p>
        </div>
      </section>

      {/* 4.7 */}
      <IndemnFinal />
    </>
  );
}
