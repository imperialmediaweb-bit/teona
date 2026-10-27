import type { Metadata } from "next";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import Image from "next/image";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import { cifreSite } from "@/lib/cifre";
import { textelePaginilor } from "@/lib/texte-pagini";

/**
 * Rând gol = paragraf nou, ca în panou.
 *
 * Nu se folosește `TextScris` aici: blocul are clasele lui, din așezarea
 * paginii, iar componenta aia își aduce ale ei. Se desparte doar textul.
 */
function paragrafe(text: string): string[] {
  return (text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
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

export const metadata: Metadata = metadate({
  titlu: "Despre noi",
  descriere:
    "Povestea Asociației Teona Ariana Suceava, din 2021: taberele RESPIRO, Casa Teona, echipa, voluntarii Culegătorii de Zâmbete și partenerii instituționali.",
  cale: "/despre-noi",
});

/**
 * 3.2 — Povestea noastră, în trei blocuri, fiecare cu fotografia lui:
 * prima tabără, Casa Teona, tabăra de anul acesta. Textul e cel din caietul
 * de sarcini, cuvânt cu cuvânt; nu e rescris și nu i se adaugă cifre.
 */
const POVESTE: ReadonlyArray<{
  titlu: string;
  /** Slotul din panou de unde vin paragrafele. Textul de pornire e acolo. */
  cheie: string;
  poza: { cale: string; alt: string; legenda: string };
  umbra: "caramiziu" | "miere" | "turcoaz";
  numar: string;
}> = [
  {
    titlu: "Cum am pornit",
    numar: "text-caramiziu-100",
    cheie: "despre.poveste.1",
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
    cheie: "despre.poveste.2",
    poza: {
      cale: "/poze/2024/11/WhatsApp-Image-2024-11-28-at-09.31.33-1.jpeg",
      alt: "Un băiețel se joacă pe podeaua interactivă de la Casa Teona, urmărind conturul unei stele proiectate pe jos",
      legenda: "Jocuri interactive",
    },
    umbra: "turcoaz",
  },
  {
    titlu: "Respiro Împreună",
    numar: "text-miere-100",
    cheie: "despre.poveste.3",
    poza: {
      /*
        Poza e din tabăra Respiro Împreună, cum a cerut asociația în
        octombrie 2026: cea de dinainte era de la altă tabără. Vine din
        Cloudinary (folderul „TABĂRĂ ONCOLOGIE 2026”), nu din depozit — e
        singura fotografie urcată acolo până acum, deci nu e de ales.
      */
      cale: "/cloud/475B1184_qymxzq",
      alt: "Șapte copii, în grup, lângă un autocar, pe o pajiște de munte, la tabăra Respiro Împreună",
      legenda: "Respiro Împreună",
    },
    umbra: "miere",
  },
];

/** 3.3 — trei carduri cu pictogramă, sub poveste. */
const MISIUNE: ReadonlyArray<{
  titlu: string;
  pictograma: NumePictograma;
  /** Slotul din panou, pentru cardurile cu un singur text. */
  cheie?: string;
  valori?: ReadonlyArray<{ nume: string; text: string }>;
}> = [
  {
    titlu: "Misiune",
    pictograma: "inima",
    cheie: "despre.misiune",
  },
  {
    titlu: "Viziune",
    pictograma: "infinit",
    cheie: "despre.viziune",
  },
  {
    titlu: "Valori",
    pictograma: "maini",
    valori: [
      {
        nume: "Incluziune",
        text: "fiecare copil e primit exact așa cum este.",
      },
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
 *
 * **Paula Tolontan a fost scoasă** la cererea asociației (precizările din
 * 16 octombrie 2026). Fusese adăugată aici fiindcă apărea pe site-ul vechi,
 * cu descriere și fotografie, iar caietul n-o pomenea — dar cine e în echipă
 * hotărăște asociația, nu arhiva WordPress. Fotografia ei rămâne în
 * `public/poze/2023/12/`, nefolosită, ca toate celelalte fișiere moștenite.
 *
 * **Rolurile lui Daniel și al Eudochiei** sunt cele trimise de asociație în
 * aceleași precizări, nu cele deduse din exportul WordPress (unde toate
 * rolurile erau goale).
 */
const ECHIPA: ReadonlyArray<{
  nume: string;
  rol?: string;
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
    descriere:
      "Cu idei noi și multă energie, construiește parteneriate cu firme și cu oamenii din comunitate, pentru ca tot mai mulți copii să se bucure de sprijinul asociației.",
  },
  {
    nume: "Eudochia Pîțu",
    rol: "Asistent social, coordonator voluntari",
    descriere:
      "Profesionist dedicat în domeniul asistenței sociale, cu experiență în coordonarea voluntarilor și organizarea taberelor.",
    poza: "/poze/2023/12/Screenshot_27__1_-removebg-preview__1_-removebg-preview.png",
  },
  {
    nume: "Daniel Strîmbu",
    rol: "Asistent social, terapeut",
    descriere:
      "Îmbină asistența socială cu terapia, pentru ca fiecare copil să primească ajutorul de care are nevoie.",
    poza: "/poze/2023/12/Strimbu-Daniel-1.jpeg",
  },
];

/** Câmpurile de culoare ale cardurilor fără fotografie, pe rând. */
const CAMPURI_ECHIPA = [
  "bg-gradient-to-br from-caramiziu-700 to-caramiziu-900 text-hartie",
  "bg-miere-300 text-miere-900",
  "bg-turcoaz-100 text-turcoaz-700",
  "bg-caramiziu-100 text-caramiziu-700",
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
    alt: "Opt voluntari tineri, în veste albe cu sigla asociației, în grup, la apus",
  },
] as const;

/** Linia colorată de sus a fiecărei cutii cu parteneri, în cele trei culori. */
const LINII = [
  "border-t-caramiziu-400",
  "border-t-miere-400",
  "border-t-turcoaz-400",
] as const;

/** Inițialele, pentru cardurile fără fotografie. */
function initiale(nume: string) {
  return nume
    .split(" ")
    .map((cuvant) => cuvant[0])
    .join("");
}

export default async function DespreNoi() {
  const cifre = await cifreSite();
  const texte = await textelePaginilor();
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Despre noi", cale: RUTE.despre }])} />
      <AntetPagina
        scris="Împreună, din ianuarie 2021"
        titlu="Cine suntem"
        subtitlu={texte["despre.antet"]}
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="spirala"
            className="pluteste-lent absolute top-20 right-[4%] size-10 text-turcoaz-200 lg:size-14"
          />
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-[55%] left-[2%] size-9 text-miere-300 lg:size-12"
          />
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
                    <h3 className="relative text-h3 text-cerneala">
                      {bloc.titlu}
                    </h3>
                    <div className="relative mt-5 grid gap-4 text-cerneala-moale">
                      {paragrafe(texte[bloc.cheie]).map((paragraf) => (
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="spirala"
            className="pluteste-lent absolute top-16 left-[4%] size-9 text-turcoaz-300 lg:size-12"
          />
          <Decor
            semn="inima"
            className="pluteste-lent absolute right-[6%] bottom-20 size-8 text-caramiziu-200 lg:size-11"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Misiune, viziune, valori</h2>
          <ul className="grid gap-5 lg:grid-cols-3">
            {/* Misiunea, pe culoarea de identitate: e cardul care contează. */}
            <li>
              <Aparitie className="h-full">
                <article className="granulatie relative flex h-full flex-col overflow-hidden colt-a bg-gradient-to-br from-caramiziu-700 via-caramiziu-800 to-caramiziu-900 p-7 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.8)] sm:p-8">
                  <span
                    aria-hidden="true"
                    className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-hartie/20"
                  />
                  <span className="colt-mic-b relative flex size-14 items-center justify-center bg-hartie/20 text-hartie">
                    <Pictograma
                      nume={MISIUNE[0].pictograma}
                      className="size-7"
                    />
                  </span>
                  <h3 className="relative mt-6 text-h3 text-hartie">
                    {MISIUNE[0].titlu}
                  </h3>
                  <p className="relative mt-3 text-corp text-hartie/90">
                    {texte[MISIUNE[0].cheie!]}
                  </p>
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
                  <span className="colt-mic-a relative flex size-14 items-center justify-center bg-turcoaz-600 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                    <Pictograma
                      nume={MISIUNE[1].pictograma}
                      className="size-7"
                    />
                  </span>
                  <h3 className="relative mt-6 text-h3 text-cerneala">
                    {MISIUNE[1].titlu}
                  </h3>
                  <p className="relative mt-3 text-corp text-cerneala-moale">
                    {texte[MISIUNE[1].cheie!]}
                  </p>
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
                    <Pictograma
                      nume={MISIUNE[2].pictograma}
                      className="size-7"
                    />
                  </span>
                  <h3 className="relative mt-6 text-h3 text-miere-900">
                    {MISIUNE[2].titlu}
                  </h3>
                  <ul className="relative mt-4 grid gap-3">
                    {MISIUNE[2].valori?.map((valoare) => (
                      <li key={valoare.nume} className="flex items-start gap-3">
                        <Decor
                          semn="stea"
                          className="mt-1 size-5 shrink-0 text-miere-800"
                        />
                        <span className="text-corp text-miere-900">
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-14 right-[5%] size-9 text-miere-300 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Oamenii din spatele asociației"
            titlu="Echipa"
          />

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ECHIPA.map((membru, i) => (
              <li key={membru.nume}>
                <Aparitie intarziere={i * 0.04} className="h-full">
                  <article
                    className={`flex h-full flex-col overflow-hidden ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)]`}
                  >
                    {/*
                      Un singur fel de cap de card, cu sau fără fotografie.

                      Înainte erau două: cine avea poză primea un câmp palid
                      cu un cerc mic în mijloc, cine n-avea primea o bandă
                      colorată cu inițiale mari. Puse una lângă alta, cele
                      șase cartonașe nu se mai citeau ca un set — păreau
                      făcute de doi oameni diferiți, iar cele cu fotografie
                      ieșeau mai sărace decât cele fără.

                      Acum banda e aceeași la toate: aceeași înălțime,
                      aceeași culoare din scara asociației, același semn
                      decorativ în colț. În mijloc stă ori fotografia, într-un
                      cerc, ori inițialele, la aceeași mărime.

                      **Cercul, nu fotografia lățită peste toată banda.**
                      Fotografiile moștenite de pe site-ul vechi au 176 px
                      lățime; întinse pe toată banda ar fi fost o pată
                      neclară. Într-un cerc de 112 px se văd curat, iar când
                      asociația trimite fotografii mari nu se schimbă nimic
                      aici: aceeași casetă, pixeli mai mulți.
                    */}
                    <div
                      className={`granulatie relative flex h-36 items-center justify-center overflow-hidden ${CAMPURI_ECHIPA[i % CAMPURI_ECHIPA.length]}`}
                    >
                      <Decor
                        semn={i % 2 === 0 ? "stea" : "soare"}
                        strokeWidth={0.8}
                        className="absolute -top-8 -right-8 size-36 opacity-25"
                      />
                      {membru.poza ? (
                        <div className="relative size-28 overflow-hidden rounded-full border-4 border-hartie/80 bg-hartie shadow-[0_14px_28px_-14px_rgba(35,35,35,0.55)]">
                          <Image
                            src={membru.poza}
                            alt={
                              membru.rol
                                ? `${membru.nume}, ${membru.rol.toLowerCase()} la ${ASOCIATIA.denumire}`
                                : `${membru.nume}, din echipa ${ASOCIATIA.denumire}`
                            }
                            fill
                            sizes="112px"
                            quality={86}
                            className="object-cover object-top"
                          />
                        </div>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="relative font-titlu text-[3.5rem] leading-none font-extrabold tracking-tight"
                        >
                          {initiale(membru.nume)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <h3 className="text-h4 text-cerneala">{membru.nume}</h3>
                      {/*
                        Eticheta cu rolul apare doar dacă e scris. Goală, ar
                        fi lăsat o pastilă portocalie de un deget, fără nimic
                        în ea — semnul că un câmp n-a fost completat.
                      */}
                      {membru.rol && (
                        <p className="mt-2 inline-flex w-fit rounded-full bg-caramiziu-100 px-3 py-1 font-titlu text-nota font-bold text-caramiziu-700">
                          {membru.rol}
                        </p>
                      )}
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
          <TitluSectiune
            scris="Până acum, împreună"
            titlu="Rezultate"
            centrat
          />
          <div className="relative mt-10 colt-a border border-hartie-umbra bg-hartie px-5 py-10 shadow-[0_34px_70px_-30px_rgba(247,79,34,0.45)] lg:px-12 lg:py-12">
            <Decor
              semn="unda"
              className="absolute top-4 right-6 size-8 text-miere-300 lg:size-10"
            />
            <Decor
              semn="stea"
              className="absolute bottom-4 left-6 size-6 text-caramiziu-200 lg:size-8"
            />
            <Cifre cifre={cifre} />
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
              <p>{texte["despre.voluntari"]}</p>
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
                  {VOLUNTARI.filter((_, i) => i % 2 === coloana).map(
                    (poza, j) => (
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
                          quality={86}
                          className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                        />
                      </figure>
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3.7 — Parteneri instituționali */}
      <Val culoare="text-tenta-miere" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-miere pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-10 right-[5%] size-10 text-miere-300 lg:size-14"
          />
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

      {/* 3.9 */}
      <IndemnFinal peste />
    </>
  );
}
