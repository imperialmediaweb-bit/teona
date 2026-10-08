import type { Metadata } from "next";
import Image from "next/image";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import TitluSectiune from "@/componente/pagina/TitluSectiune";
import {
  PARTENERI_FARA_SIGLA,
  PARTENERI_INSTITUTIONALI,
} from "@/date/sponsori";

export const metadata: Metadata = {
  title: "Cine suntem",
  description:
    "Aducem bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor.",
};

/**
 * 3.2 — Povestea noastră, în trei blocuri, fiecare cu fotografia lui:
 * prima tabără, Casa Teona, tabăra de anul acesta. Textul e cel din caietul
 * de sarcini, cuvânt cu cuvânt; nu e rescris și nu i se adaugă cifre.
 */
const POVESTE: ReadonlyArray<{
  titlu: string;
  paragrafe: ReadonlyArray<string>;
  poza: { cale: string; alt: string; legenda: string };
  umbra: "caramiziu" | "miere" | "turcoaz";
  numar: string;
}> = [
  {
    titlu: "Cum am pornit",
    numar: "text-caramiziu-100",
    paragrafe: [
      "Asociația Teona Ariana Suceava a luat ființă în ianuarie 2021. Am pornit la drum cu o idee simplă: copiii cu nevoi speciale și familiile lor merită să aibă, din când în când, un loc în care să se simtă bine exact așa cum sunt. Nu aveam planuri mari, ci dorința de a face ceva concret, împreună cu oameni care gândesc la fel, indiferent de confesiune sau de opinii, pentru că bucuria nu ține de nicio etichetă.",
      "Așa au apărut taberele RESPIRO. Ne-am dorit să fie o pauză pentru copii și pentru părinții lor, și de la o tabără la alta au venit tot mai multe familii, tot mai mulți voluntari și tot mai multe prietenii. Acolo copiii se joacă, încearcă lucruri noi și se împrietenesc, iar părinții au timp să respire și să vorbească cu alți părinți. Din primele tabere am învățat ce contează cu adevărat: ritmul fiecărui copil, atenția și răbdarea.",
      "Pe drum, ne-am dorit să ajungem și la alți copii. Am început să sprijinim copii din sistemul de protecție a copilului, cu rezultate școlare deosebite, ca un „bravo” concret pentru munca lor, și să oferim burse și sprijin educațional, pentru ca fiecare copil să-și poată urma visul.",
    ],
    poza: {
      cale: "/poze/2024/11/278495378_647322639843213_2394948498616303816_n-1024x768.jpg",
      alt: "O voluntară ajută o fetiță la un atelier de bucătărie, într-o sală de lemn din tabără",
      legenda: "Tabăra RESPIRO",
    },
    umbra: "caramiziu",
  },
  {
    titlu: "Casa Teona",
    numar: "text-turcoaz-100",
    paragrafe: [
      "Apoi ne-am dorit ca bucuria să nu fie doar o vacanță. Casa Teona a devenit locul în care copiii vin pe tot parcursul anului: terapii de grup, ateliere creative, meloterapie, stimulare senzorială, activități de socializare și consiliere pentru părinți. Toate sunt gratuite, iar terapia prin joacă este adaptată fiecărui copil.",
    ],
    poza: {
      cale: "/poze/2024/11/WhatsApp-Image-2024-11-28-at-09.31.33-1.jpeg",
      alt: "Un băiețel se joacă pe podeaua interactivă de la Casa Teona, urmărind conturul unei stele proiectate pe jos",
      legenda: "Sala senzorială",
    },
    umbra: "turcoaz",
  },
  {
    titlu: "Anul acesta",
    numar: "text-miere-100",
    paragrafe: [
      "Anul acesta am organizat prima tabără RESPIRO pentru copii care au trecut prin cancer și pentru familiile lor, un pas pe care ni l-am dorit de mult și care ne-a arătat cât de mult mai putem face.",
      "Motto-ul nostru, „Nimic fără Dumnezeu”, ne amintește că tot ce am realizat s-a născut din încredere, din bunătate și din faptul că am fost împreună.",
      "Povestea noastră continuă. Dacă vrei să faci parte din ea, te așteptăm.",
    ],
    poza: {
      cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
      alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
      legenda: "Prima zi de tabără",
    },
    umbra: "miere",
  },
];

/** 3.3 — trei carduri cu pictogramă, sub poveste. */
const MISIUNE: ReadonlyArray<{
  titlu: string;
  pictograma: NumePictograma;
  text?: string;
  valori?: ReadonlyArray<{ nume: string; text: string }>;
}> = [
  {
    titlu: "Misiune",
    pictograma: "inima",
    text: "Aducem bucurie și sprijin copiilor cu nevoi speciale, copiilor care au trecut prin cancer și celor din medii defavorizate, prin tabere, joacă și consiliere pentru întreaga familie.",
  },
  {
    titlu: "Viziune",
    pictograma: "infinit",
    text: "O comunitate în care fiecare copil, indiferent de dificultățile sale sau de condițiile în care s-a născut, are șansa să se joace, să învețe și să viseze liber, iar fiecare părinte știe că nu e singur.",
  },
  {
    titlu: "Valori",
    pictograma: "maini",
    valori: [
      { nume: "Incluziune", text: "fiecare copil e primit exact așa cum este." },
      { nume: "Empatie", text: "ascultăm înainte să ajutăm." },
      {
        nume: "Implicare",
        text: "lucrăm împreună cu voluntari, parteneri și companii.",
      },
      {
        nume: "Transparență",
        text: "spunem deschis ce facem și cum folosim fiecare donație.",
      },
    ],
  },
];

/**
 * 3.4 — Echipa, în ordinea cerută de caiet: conducerea, apoi echipa
 * operațională.
 *
 * Numele și rolurile sunt cele din caietul de sarcini, nu cele din exportul
 * WordPress (unde rolurile erau goale). Frazele scurte vin din `echipa.json`.
 *
 * Două lipsuri, lăsate vizibile în loc să fie umplute cu text inventat:
 * Mihaela Sfichi nu are nici fotografie, nici descriere (nu există nici pe
 * site-ul actual), iar conducerea nu are fotografii în arhiva preluată.
 * Cardul fără poză afișează inițialele pe un câmp de culoare, nu o siluetă
 * de stoc.
 */
const ECHIPA: ReadonlyArray<{
  nume: string;
  rol: string;
  descriere?: string;
  poza?: string;
}> = [
  {
    nume: "Cristea Costiuc",
    rol: "Președinte",
    descriere:
      "Lider dedicat, ghidează cu pasiune misiunea asociației pentru a sprijini copiii cu dizabilități și familiile lor.",
  },
  {
    nume: "Iuliana Costiuc",
    rol: "Vicepreședinte",
    descriere:
      "Cu empatie și dedicare, sprijină echipa în realizarea obiectivelor asociației și în oferirea unui sprijin real.",
  },
  {
    nume: "Ștefan Roșu",
    rol: "Vicepreședinte",
    descriere:
      "Implicat activ în proiectele asociației, contribuie la organizarea și succesul inițiativelor pentru comunitate.",
  },
  {
    nume: "Mihaela Sfichi",
    rol: "Manager fundraising",
  },
  {
    nume: "Eudochia Pîțu",
    rol: "Coordonator voluntari",
    descriere:
      "Profesionist dedicat în domeniul asistenței sociale, cu experiență în coordonarea voluntarilor și organizarea taberelor.",
    poza: "/poze/2023/12/Screenshot_27__1_-removebg-preview__1_-removebg-preview.png",
  },
  {
    nume: "Daniel Strîmbu",
    rol: "Comunicare",
    descriere:
      "Capta atenția publicului și transmite mesajele esențiale ale asociației, într-un mod atractiv și eficient.",
    poza: "/poze/2023/12/Strimbu-Daniel-1.jpeg",
  },
];

/** Câmpurile de culoare ale cardurilor fără fotografie, pe rând. */
const CAMPURI_ECHIPA = [
  "bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 text-hartie",
  "bg-miere-300 text-miere-900",
  "bg-turcoaz-100 text-turcoaz-700",
  "bg-caramiziu-100 text-caramiziu-600",
] as const;

/** 3.6 — fotografii cu voluntari. Descrieri scrise după ce m-am uitat la ele. */
const VOLUNTARI = [
  {
    cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
    alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
  },
  {
    cale: "/poze/2024/11/454507252_521713920428951_7631183889837889502_n-1.jpg",
    alt: "Tineri voluntari cu căști portocalii de escaladă și hamuri, în grup, între brazi, în parcul de aventură",
  },
  {
    cale: "/poze/2024/11/348219986_630992459048403_8812479006845932206_n.jpg",
    alt: "Un băiat și o voluntară, cu capetele apropiate, pictează împreună o foaie la masă, cu o paletă de acuarele alături",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Voluntari și copii, în grup, la apus",
  },
] as const;

/** Linia colorată de sus a fiecărei cutii cu parteneri, în cele trei culori. */
const LINII = ["border-t-caramiziu-400", "border-t-miere-400", "border-t-turcoaz-400"] as const;

/** Inițialele, pentru cardurile fără fotografie. */
function initiale(nume: string) {
  return nume
    .split(" ")
    .map((cuvant) => cuvant[0])
    .join("");
}

export default function DespreNoi() {
  return (
    <>
      <AntetPagina
        scris="Împreună, din ianuarie 2021"
        titlu="Cine suntem"
        subtitlu="Aducem bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor."
        poza={{
          cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
          alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură",
          legenda: "Tabăra RESPIRO",
        }}
        pozaMica={{
          cale: "/poze/2024/11/348219986_630992459048403_8812479006845932206_n.jpg",
          alt: "Un băiat și o voluntară, cu capetele apropiate, pictează împreună o foaie la masă",
        }}
        urmeaza="text-hartie"
      />

      {/* 3.2 — Povestea noastră */}
      <section className="relative overflow-hidden bg-hartie pt-10 pb-24 lg:pt-16 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="spirala" className="pluteste-lent absolute top-20 right-[4%] size-10 text-turcoaz-200 lg:size-14" />
          <Decor semn="stea" className="pluteste-lent absolute top-[55%] left-[2%] size-9 text-miere-300 lg:size-12" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="De la prima tabără până la Casa Teona"
            titlu="Povestea noastră"
          />

          <div className="mt-16 grid gap-20 lg:gap-28">
            {POVESTE.map((bloc, i) => (
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
                  <div className="relative lg:col-span-6">
                    {/* Numărul de ordine, mare și palid, în spatele titlului:
                        cele trei blocuri se citesc ca trei capitole. */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -top-10 -left-2 font-titlu text-[7rem] leading-none font-extrabold tracking-tight select-none ${bloc.numar}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="relative text-h3 text-cerneala">{bloc.titlu}</h3>
                    <div className="relative mt-5 grid gap-4 text-cerneala-moale">
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

      {/* 3.3 — Misiune, viziune, valori */}
      <Val culoare="text-tenta-turcoaz" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-turcoaz pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="spirala" className="pluteste-lent absolute top-16 left-[4%] size-9 text-turcoaz-300 lg:size-12" />
          <Decor semn="inima" className="pluteste-lent absolute right-[6%] bottom-20 size-8 text-caramiziu-200 lg:size-11" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Misiune, viziune, valori</h2>
          <ul className="grid gap-5 lg:grid-cols-3">
            {/* Misiunea, pe culoarea de identitate: e cardul care contează. */}
            <li>
              <Aparitie className="h-full">
                <article className="granulatie relative flex h-full flex-col overflow-hidden colt-a bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-7 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.8)] sm:p-8">
                  <span
                    aria-hidden="true"
                    className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-hartie/20"
                  />
                  <span className="colt-mic-b relative flex size-14 items-center justify-center bg-hartie/20 text-hartie">
                    <Pictograma nume={MISIUNE[0].pictograma} className="size-7" />
                  </span>
                  <h3 className="relative mt-6 text-h3 text-hartie">{MISIUNE[0].titlu}</h3>
                  <p className="relative mt-3 text-corp text-hartie/90">{MISIUNE[0].text}</p>
                </article>
              </Aparitie>
            </li>

            {/* Viziunea, pe hârtie, cu bucla neurodiversității mare în colț. */}
            <li>
              <Aparitie intarziere={0.06} className="h-full">
                <article className="relative flex h-full flex-col overflow-hidden colt-b border border-hartie-umbra bg-hartie p-7 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.5)] sm:p-8">
                  <Pictograma
                    nume="infinit"
                    strokeWidth={0.7}
                    className="absolute -top-10 -right-12 size-52 text-turcoaz-100"
                  />
                  <span className="colt-mic-a relative flex size-14 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                    <Pictograma nume={MISIUNE[1].pictograma} className="size-7" />
                  </span>
                  <h3 className="relative mt-6 text-h3 text-cerneala">{MISIUNE[1].titlu}</h3>
                  <p className="relative mt-3 text-corp text-cerneala-moale">{MISIUNE[1].text}</p>
                </article>
              </Aparitie>
            </li>

            {/* Valorile, pe miere, cu câte o steluță în dreptul fiecăreia. */}
            <li>
              <Aparitie intarziere={0.12} className="h-full">
                <article className="granulatie relative flex h-full flex-col overflow-hidden colt-a bg-miere-300 p-7 shadow-[0_30px_60px_-28px_rgba(255,172,0,0.85)] sm:p-8">
                  <Decor
                    semn="stea"
                    strokeWidth={0.8}
                    className="absolute -top-10 -right-10 size-44 text-miere-200/80"
                  />
                  <span className="colt-mic-b relative flex size-14 items-center justify-center bg-cerneala/10 text-cerneala">
                    <Pictograma nume={MISIUNE[2].pictograma} className="size-7" />
                  </span>
                  <h3 className="relative mt-6 text-h3 text-miere-900">{MISIUNE[2].titlu}</h3>
                  <ul className="relative mt-4 grid gap-3">
                    {MISIUNE[2].valori?.map((valoare) => (
                      <li key={valoare.nume} className="flex items-start gap-3">
                        <Decor semn="stea" className="mt-1 size-5 shrink-0 text-miere-800" />
                        <span className="text-corp text-miere-900/85">
                          <span className="font-titlu font-bold text-miere-900">
                            {valoare.nume}:
                          </span>{" "}
                          {valoare.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Aparitie>
            </li>
          </ul>
        </div>
      </section>

      {/* 3.4 — Echipa */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="soare" className="pluteste-lent absolute top-14 right-[5%] size-9 text-miere-300 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune scris="Oamenii din spatele asociației" titlu="Echipa" />

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ECHIPA.map((membru, i) => (
              <li key={membru.nume}>
                <Aparitie intarziere={i * 0.04} className="h-full">
                  <article
                    className={`flex h-full flex-col overflow-hidden ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)]`}
                  >
                    {membru.poza ? (
                      <div className="relative bg-hartie-calda pt-7">
                        <Decor
                          semn={i % 2 === 0 ? "unda" : "spirala"}
                          strokeWidth={0.9}
                          className="absolute -top-6 -right-6 size-28 text-caramiziu-100"
                        />
                        <div className="relative mx-auto size-32 overflow-hidden rounded-full border-[5px] border-hartie bg-hartie shadow-[0_16px_32px_-16px_rgba(35,35,35,0.5)]">
                          <Image
                            src={membru.poza}
                            alt={`${membru.nume}, ${membru.rol.toLowerCase()} la ${ASOCIATIA.denumire}`}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`granulatie relative flex h-36 items-center justify-center overflow-hidden ${CAMPURI_ECHIPA[i % CAMPURI_ECHIPA.length]}`}
                      >
                        <Decor
                          semn={i % 2 === 0 ? "stea" : "soare"}
                          strokeWidth={0.8}
                          className="absolute -top-8 -right-8 size-36 opacity-25"
                        />
                        <span
                          aria-hidden="true"
                          className="relative font-titlu text-[3.5rem] leading-none font-extrabold tracking-tight"
                        >
                          {initiale(membru.nume)}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <h3 className="text-h4 text-cerneala">{membru.nume}</h3>
                      <p className="mt-2 inline-flex w-fit rounded-full bg-caramiziu-100 px-3 py-1 font-titlu text-nota font-bold text-caramiziu-700">
                        {membru.rol}
                      </p>
                      {membru.descriere && (
                        <p className="mt-4 text-mic text-cerneala-moale">
                          {membru.descriere}
                        </p>
                      )}
                    </div>
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.5 — aceleași cifre ca pe prima pagină, din aceeași sursă, în
          același panou cu colțuri decupate. */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune scris="Până acum, împreună" titlu="Rezultate" centrat />
          <div className="relative mt-10 colt-a border border-hartie-umbra bg-hartie px-5 py-10 shadow-[0_34px_70px_-30px_rgba(247,79,34,0.45)] lg:px-12 lg:py-12">
            <Decor semn="unda" className="absolute top-4 right-6 size-8 text-miere-300 lg:size-10" />
            <Decor semn="stea" className="absolute bottom-4 left-6 size-6 text-caramiziu-200 lg:size-8" />
            <Cifre />
          </div>
        </div>
      </section>

      {/* 3.6 — Culegătorii de Zâmbete */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
          <div>
            <TitluSectiune
              scris="Voluntarii noștri"
              titlu="Culegătorii de Zâmbete"
              culoare="miere"
            />
            <div className="mt-5 grid gap-4 text-cerneala-moale">
              <p>
                Voluntarii sunt o parte esențială a activităților noastre. În
                tabere și la Casa Teona se joacă cu copiii, îi însoțesc pe
                parcursul zilei, ajută la organizare și îi sprijină pe părinți.
                Datorită lor, fiecare copil primește atenția de care are nevoie,
                iar activitățile se desfășoară în siguranță și cu bucurie.
              </p>
              <p>
                Dacă vrei să faci parte din echipă, te așteptăm. Alătură-te
                Culegătorilor de Zâmbete.
              </p>
            </div>

            {/*
              Caietul cere aici și iconițele de Facebook și Instagram ale
              grupului „Culegătorii de Zâmbete” — conturi separate de ale
              asociației. Adresele lor nu sunt nici în caiet, nici pe site-ul
              actual, iar o adresă ghicită duce vizitatorul la un cont străin.
              Se adaugă în clipa în care le primim.
            */}
            <Buton href={RUTE.voluntar} marime="mare" className="mt-9">
              Devino voluntar
            </Buton>
          </div>

          {/* Patru poze pe două coloane decalate, pe un bloc de miere: un
              album așezat pe masă, nu o grilă de patru pătrate. */}
          <div className="relative mx-auto w-full max-w-xl pt-4 pr-4 lg:max-w-none">
            <span
              aria-hidden="true"
              className="absolute top-0 right-0 bottom-10 left-10 colt-b bg-miere-200"
            />
            <div className="relative grid grid-cols-2 gap-4">
              {[0, 1].map((coloana) => (
                <div
                  key={coloana}
                  className={`grid gap-4 ${coloana === 1 ? "pt-10" : ""}`}
                >
                  {VOLUNTARI.filter((_, i) => i % 2 === coloana).map((poza, j) => (
                    <figure
                      key={poza.cale}
                      className={`group relative overflow-hidden ${
                        (coloana + j) % 2 === 0 ? "colt-a" : "colt-b"
                      } ${j === coloana ? "aspect-[4/5]" : "aspect-square"} bg-hartie-calda shadow-[0_22px_44px_-22px_rgba(255,172,0,0.6)]`}
                    >
                      <Image
                        src={poza.cale}
                        alt={poza.alt}
                        fill
                        sizes="(min-width: 1024px) 300px, 46vw"
                        className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                      />
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3.7 — Parteneri instituționali */}
      <Val culoare="text-tenta-miere" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-miere pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="soare" className="pluteste-lent absolute top-10 right-[5%] size-10 text-miere-300 lg:size-14" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            titlu="Parteneri instituționali"
            text="Colaborăm cu instituții care ne sunt alături în munca pentru copii și familiile lor."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Instituțiile cu siglă: sigla, la aceeași înălțime cu celelalte. */}
            {PARTENERI_INSTITUTIONALI.map((partener) => (
              <li key={partener.nume}>
                <div
                  className={`flex h-full items-center gap-4 colt-mic-a border-t-4 bg-hartie px-5 py-4 shadow-[0_14px_30px_-18px_rgba(35,35,35,0.5)] ${LINII[0]}`}
                >
                  <Image
                    src={partener.cale}
                    alt={`Sigla ${partener.nume}`}
                    width={120}
                    height={120}
                    className="size-14 shrink-0 object-contain"
                  />
                  <span className="font-titlu text-corp font-bold text-cerneala">
                    {partener.nume}
                  </span>
                </div>
              </li>
            ))}

            {/*
              Restul instituțiilor nu au siglă în arhiva preluată, iar o adresă
              ghicită ar duce vizitatorul în altă parte. Apar cu numele, scris
              corect, până primim siglele și adresele de la asociație.
            */}
            {PARTENERI_FARA_SIGLA.map((partener, i) => (
              <li key={partener}>
                <div
                  className={`flex h-full items-center gap-4 ${
                    i % 2 === 0 ? "colt-mic-b" : "colt-mic-a"
                  } border-t-4 bg-hartie px-5 py-4 shadow-[0_14px_30px_-18px_rgba(35,35,35,0.5)] ${LINII[(i + 1) % 3]}`}
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-miere-100 text-miere-700">
                    <Pictograma nume="cladire" className="size-6" />
                  </span>
                  <span className="font-titlu text-corp font-bold text-cerneala">
                    {partener}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.8 — Transparență */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div
            id="transparenta"
            className="grid scroll-mt-32 overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.5)] lg:grid-cols-[2fr_3fr]"
          >
            {/* Anul raportului, scris cât cardul: e lucrul de reținut. */}
            <div className="granulatie relative flex min-h-[12rem] flex-col justify-between overflow-hidden bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 p-7 text-hartie">
              <span
                aria-hidden="true"
                className="absolute -right-10 -bottom-14 size-44 rounded-full border-2 border-hartie/20"
              />
              <span className="colt-mic-b relative flex size-12 items-center justify-center bg-hartie/20">
                <Pictograma nume="document" className="size-6" />
              </span>
              <p
                aria-hidden="true"
                className="relative mt-6 font-titlu text-[4rem] leading-none font-extrabold tracking-tight"
              >
                2025
              </p>
            </div>
            <div className="p-7 sm:p-9">
              <h2 className="text-h3 text-cerneala">Transparență</h2>
              <p className="mt-3 text-amplu text-cerneala-moale">
                Spunem deschis ce facem și cum folosim fiecare donație.
              </p>
              <Buton href={RUTE.raport2025} className="mt-7">
                Raport de activitate 2025
                <Pictograma nume="sageata" className="size-4" />
              </Buton>
            </div>
          </div>
        </div>
      </section>

      {/* 3.9 */}
      <IndemnFinal peste />
    </>
  );
}
