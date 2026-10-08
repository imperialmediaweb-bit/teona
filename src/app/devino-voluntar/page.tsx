import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EMAIL, RUTE, TELEFOANE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import Pictograma from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import Galerie from "@/componente/pagina/Galerie";
import Pasi from "@/componente/pagina/Pasi";
import TitluSectiune from "@/componente/pagina/TitluSectiune";
import FormularVoluntar from "@/componente/formular/FormularVoluntar";

export const metadata: Metadata = {
  title: "Devino voluntar",
  description:
    "Alătură-te Culegătorilor de Zâmbete și fii alături de copiii cu nevoi speciale și de familiile lor.",
};

/** 11.6 — șase fotografii cu voluntari. */
const GALERIE = [
  {
    cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
    alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
    legenda: "Tabăra RESPIRO",
  },
  {
    cale: "/poze/2024/11/Screenshot_56-1.png",
    alt: "Un voluntar îi arată unei fetițe tricoul primit în tabără",
  },
  {
    cale: "/poze/2024/11/278495378_647322639843213_2394948498616303816_n-1024x768.jpg",
    alt: "O voluntară ajută o fetiță la un atelier de bucătărie, într-o sală de lemn din tabără",
  },
  {
    cale: "/poze/2024/11/454507252_521713920428951_7631183889837889502_n-1.jpg",
    alt: "Tineri voluntari cu căști portocalii de escaladă și hamuri, în grup, între brazi, în parcul de aventură",
    legenda: "Parcul de aventură",
  },
  {
    cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
    alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Voluntari și copii, în grup, la apus",
  },
] as const;

export default function DevinoVoluntar() {
  return (
    <>
      <AntetPagina
        scris="Culegătorii de Zâmbete"
        titlu="Devino voluntar"
        subtitlu="Implică-te activ, schimbă vieți! Alătură-te Culegătorilor de Zâmbete și fii alături de copiii cu nevoi speciale și de familiile lor, în tabere, la Casa Teona și la alte activități ale asociației."
        accent="miere"
        poza={{
          cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
          alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
          legenda: "Culegătorii de Zâmbete",
        }}
        pozaMica={{
          cale: "/poze/2024/11/348219986_630992459048403_8812479006845932206_n.jpg",
          alt: "Un băiat și o voluntară, cu capetele apropiate, pictează împreună o foaie la masă",
        }}
        butoane={
          <Buton href="#formular" marime="mare">
            Completează formularul
            <Pictograma nume="sageata" className="size-5 rotate-90" />
          </Buton>
        }
      />

      {/* 11.2 și 11.3 */}
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="spirala" className="pluteste-lent absolute top-16 right-[4%] size-9 text-turcoaz-200 lg:size-12" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune scris="Doi pași, atât" titlu="Cum funcționează" culoare="miere" />

          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Pasi
                pasi={[
                  { text: "Completezi formularul. Durează câteva minute.", pictograma: "document" },
                  {
                    text: "Te contactăm și stabilim împreună unde poți fi cel mai de folos.",
                    pictograma: "comunicare",
                  },
                ]}
              />
            </div>

            {/* 11.3 — vârsta minimă, scrisă mare: e singura condiție. */}
            <div className="lg:col-span-4">
              <Aparitie intarziere={0.1} className="h-full">
                <div className="granulatie relative flex h-full min-h-[11rem] flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(255,172,0,0.6)] sm:p-7">
                  <Decor semn="soare" strokeWidth={0.8} className="absolute -top-10 -right-10 size-40 text-miere-100" />
                  <span className="colt-mic-b relative flex size-12 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                    <Pictograma nume="familie" className="size-6" />
                  </span>
                  <p
                    aria-hidden="true"
                    className="relative mt-5 font-titlu text-[3.4rem] leading-none font-extrabold tracking-tight text-miere-500"
                  >
                    18+
                  </p>
                  <h3 className="relative mt-3 text-h4 text-cerneala">Cine poate fi voluntar</h3>
                  <p className="relative mt-2 text-mic text-cerneala-moale">
                    Pentru a deveni voluntar, trebuie să ai minimum 18 ani.
                  </p>
                </div>
              </Aparitie>
            </div>
          </div>
        </div>
      </section>

      {/* 11.4 — formularul */}
      <Val culoare="text-tenta-cald" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-cald pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-16 right-[6%] size-8 text-miere-300 lg:size-11" />
          <Decor semn="unda" className="pluteste-lent absolute bottom-24 left-[3%] size-9 text-caramiziu-200 lg:size-12" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
          <div>
            <TitluSectiune
              scris="Formularul de înscriere"
              titlu="Spune-ne câte ceva despre tine"
              text="Formularul durează câteva minute. Te contactăm după ce îl citim."
            />
            <Fotografie
              cale="/poze/2024/11/438101549_457431740190503_88663047373558950_n.jpg"
              alt="Opt voluntari tineri, pe scenă, cu diplomele primite la finalul taberei"
              legenda="La finalul taberei"
              umbra="miere"
              bloc="miere"
              colt="b"
              raport="aspect-[4/3]"
              dimensiuni="(min-width: 1024px) 460px, 92vw"
              className="mt-12 hidden lg:block"
            />
          </div>
          <FormularVoluntar />
        </div>
      </section>

      {/* 11.6 — Culegătorii de Zâmbete și galeria. Aici vin și iconițele de
          Facebook și Instagram ale grupului — conturi separate de ale
          asociației. Adresele nu sunt nici în caiet, nici pe site-ul actual;
          se adaugă în clipa în care le primim de la asociație. */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <Galerie
        scris="Din tabere și de la Casa Teona"
        titlu="Culegătorii de Zâmbete"
        text="Vezi ce facem împreună cu voluntarii noștri."
        poze={GALERIE}
      />

      {/* 11.6 — alte moduri de a ajuta: trei carduri, ca pe prima pagină. */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="soare" className="pluteste-lent absolute top-12 right-[5%] size-10 text-miere-300 lg:size-14" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune titlu="Nu poți fi voluntar acum? Poți ajuta și altfel." />

          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            {/* Donează — cu fotografia cutiei de donații de la Casa Teona. */}
            <li>
              <Aparitie className="h-full">
                <Link
                  href={RUTE.doneaza}
                  className="group flex h-full flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] transition-all duration-500 ease-cald hover:-translate-y-1.5 hover:shadow-[0_30px_56px_-26px_rgba(247,79,34,0.6)] motion-reduce:hover:translate-y-0"
                >
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src="/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.20.jpeg"
                      alt="Standul de la Casa Teona: cutia de donații cu sigla asociației, un afiș „Eu creez, împreună donăm… pentru copii cu dizabilități” și brățări colorate pe un suport"
                      fill
                      sizes="(min-width: 1024px) 400px, 92vw"
                      className="object-cover"
                    />
                    <span className="colt-mic-b absolute top-4 left-4 flex size-12 items-center justify-center bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]">
                      <Pictograma nume="inima" className="size-6" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <h3 className="text-h4 text-cerneala transition-colors duration-300 group-hover:text-caramiziu-600">
                      Donează
                    </h3>
                    <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                      O dată sau lunar, cu cardul, prin SMS sau prin transfer bancar.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600">
                      Află cum
                      <Pictograma nume="sageata" className="size-4" />
                    </span>
                  </div>
                </Link>
              </Aparitie>
            </li>

            {/* 3,5% — turcoaz, cu procentul scris mare. */}
            <li>
              <Aparitie intarziere={0.06} className="h-full">
                <Link
                  href={RUTE.redirectionare35}
                  className="granulatie group relative flex h-full flex-col overflow-hidden colt-b bg-turcoaz-100 p-6 shadow-[0_28px_56px_-26px_rgba(42,159,163,0.7)] transition-all duration-500 ease-cald hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 sm:p-7"
                >
                  <Decor semn="spirala" strokeWidth={0.8} className="absolute -right-12 -bottom-12 size-48 text-turcoaz-200" />
                  <span className="colt-mic-a relative flex size-12 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                    <Pictograma nume="document" className="size-6" />
                  </span>
                  <p
                    aria-hidden="true"
                    className="relative mt-5 font-titlu text-[3.4rem] leading-none font-extrabold tracking-tight text-turcoaz-600"
                  >
                    3,5%
                  </p>
                  <h3 className="relative mt-4 text-h4 text-turcoaz-900">Redirecționează 3,5%</h3>
                  <p className="relative mt-2 flex-1 text-mic text-turcoaz-900/80">
                    Din impozitul pe venit, fără niciun cost pentru tine.
                  </p>
                  <span className="relative mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-turcoaz-800">
                    Află cum
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </Link>
              </Aparitie>
            </li>

            {/* 20% — miere, pentru firme. */}
            <li>
              <Aparitie intarziere={0.12} className="h-full">
                <Link
                  href={RUTE.directionare20}
                  className="granulatie group relative flex h-full flex-col overflow-hidden colt-a bg-miere-300 p-6 shadow-[0_28px_56px_-26px_rgba(255,172,0,0.85)] transition-all duration-500 ease-cald hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 sm:p-7"
                >
                  <Decor semn="stea" strokeWidth={0.8} className="absolute -top-10 -right-10 size-44 text-miere-200/80" />
                  <span className="colt-mic-b relative flex size-12 items-center justify-center bg-cerneala/10 text-cerneala">
                    <Pictograma nume="cladire" className="size-6" />
                  </span>
                  <p
                    aria-hidden="true"
                    className="relative mt-5 font-titlu text-[3.4rem] leading-none font-extrabold tracking-tight text-hartie"
                  >
                    20%
                  </p>
                  <h3 className="relative mt-4 text-h4 text-miere-900">Direcționează 20%</h3>
                  <p className="relative mt-2 flex-1 text-mic text-miere-900/85">
                    Pentru firme: din impozitul pe profit, prin contract de sponsorizare.
                  </p>
                  <span className="relative mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-miere-900">
                    Află cum
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </Link>
              </Aparitie>
            </li>
          </ul>
        </div>
      </section>

      {/* 11.6 — contact */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="granulatie relative overflow-hidden colt-b bg-turcoaz-100 p-8 text-center shadow-[0_30px_60px_-28px_rgba(42,159,163,0.6)] sm:p-10 lg:p-12">
            <Decor semn="unda" strokeWidth={0.8} className="absolute -right-10 -bottom-10 size-44 text-turcoaz-200" />
            <Decor semn="stea" className="absolute top-6 left-8 size-8 text-turcoaz-300" />
            <h2 className="relative text-h2 text-turcoaz-900">Ai întrebări?</h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-amplu text-turcoaz-900/80">
              Scrie-ne la{" "}
              <a
                href={`mailto:${EMAIL.contact}`}
                className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
              >
                {EMAIL.contact}
              </a>{" "}
              sau sună-ne la{" "}
              {TELEFOANE.map((telefon, i) => (
                <span key={telefon.apel}>
                  {i > 0 && " / "}
                  <a
                    href={`tel:${telefon.apel}`}
                    className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
                  >
                    {telefon.afisat}
                  </a>
                </span>
              ))}
              .
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Buton href={`mailto:${EMAIL.contact}`}>
                <Pictograma nume="plic" className="size-5" />
                Scrie-ne
              </Buton>
              <Buton href={`tel:${TELEFOANE[0].apel}`} varianta="contur">
                <Pictograma nume="telefon" className="size-5" />
                {TELEFOANE[0].afisat}
              </Buton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
