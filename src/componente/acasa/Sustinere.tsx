import Image from "next/image";
import { RUTE, SMS } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";

/**
 * 1.3 — „Cum poți să ne susții”. Titlurile, textele și butoanele sunt cele
 * din caiet, cuvânt cu cuvânt. Tot ce e în plus e vizual.
 *
 * Varianta de dinainte avea cinci cutii cu o pictogramă și două rânduri de
 * text, pe crem. Clientul a numit-o „sec”, și avea dreptate: era singura
 * secțiune de pe prima pagină fără nicio fotografie, deși asociația are peste
 * două sute. Acum trei dintre carduri au poze reale, iar celelalte două sunt
 * câmpuri de culoare cu cifra care contează scrisă mare — „SUSTIN la 8835”,
 * „3,5%”. Niciun card nu seamănă cu vecinul lui.
 *
 * Donația rămâne cardul mare, pe toată înălțimea coloanei din stânga, în
 * culoarea de identitate: ierarhia spune singură ce contează cel mai mult.
 */

const POZE = {
  // Tabăra din iunie 2024. Alt scris după ce m-am uitat la poză.
  doneaza: {
    cale: "/poze/2024/11/449496204_497189886214688_2290669171247077659_n-768x1024.jpg",
    alt: "O voluntară și patru copii se țin de mână în cerc, pe iarbă, lângă o plasă de volei; un copil stă ghemuit în mijloc",
  },
  sponsorizeaza: {
    cale: "/poze/2024/11/459590851_545309534736056_5697611419655887236_n.jpg",
    alt: "Copii în tricouri albe țin litere colorate care formează „Mulțumim Egger”, între două bannere ale asociației, în fața pensiunii din tabără",
  },
  voluntar: {
    cale: "/poze/2024/11/378800851_1359191008288942_5731801500992248019_n-1024x768.jpg",
    alt: "Grup de voluntari tineri, câțiva cu căști portocalii de escaladă, fac un selfie sub un brad, în parcul de aventură",
  },
} as const;

/** Butonul alb, pentru fundalurile colorate: acolo portocaliul ar dispărea. */
const BUTON_ALB =
  "border-hartie bg-hartie text-caramiziu-600 hover:border-hartie hover:text-caramiziu-700";

/** Cardurile mici se ridică puțin la trecerea cu mouse-ul; forma nu se schimbă. */
const RIDICARE =
  "transition-all duration-500 ease-cald hover:-translate-y-1.5 motion-reduce:hover:translate-y-0";

export default function Sustinere() {
  return (
    <section className="relative overflow-hidden bg-hartie pt-14 pb-24 lg:pt-20 lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="spirala"
          className="pluteste-lent absolute top-12 right-[4%] size-10 text-turcoaz-200 lg:size-14"
        />
        <Decor
          semn="stea"
          className="pluteste-lent absolute bottom-24 left-[2%] size-9 text-miere-300 lg:size-12"
        />
        <Decor
          semn="unda"
          className="pluteste-lent absolute top-1/2 left-[46%] hidden size-12 text-caramiziu-200 lg:block"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Caietul, la 1.3: „Titlul secțiunii: «Cum poți să ne susții».
            Fără frază introductivă.” */}
        <h2 className="max-w-2xl text-h2 text-cerneala">
          Cum poți să ne susții
        </h2>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* Cardul 1 · Donează — mare, portocaliu, cu fotografie. */}
          <li className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <Aparitie className="h-full">
              <article className="granulatie relative flex h-full flex-col overflow-hidden colt-a bg-gradient-to-b from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 text-hartie shadow-[0_36px_70px_-28px_rgba(247,79,34,0.85)]">
                <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-auto lg:min-h-[19rem] lg:flex-1">
                  <Image
                    src={POZE.doneaza.cale}
                    alt={POZE.doneaza.alt}
                    fill
                    sizes="(min-width: 1024px) 420px, 92vw"
                    className="object-cover"
                  />
                  {/* Poza se stinge în portocaliu, nu se termină cu o linie:
                      cardul e o singură bucată, nu o poză cu o etichetă sub ea. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-caramiziu-500 to-transparent"
                  />
                </div>

                <div className="relative p-7 pt-2 sm:p-9 sm:pt-3">
                  <span
                    aria-hidden="true"
                    className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-hartie/20"
                  />
                  <span className="colt-mic-b relative flex size-14 items-center justify-center bg-hartie/20 text-hartie">
                    <Pictograma nume="inima" className="size-7" />
                  </span>
                  <h3 className="relative mt-5 text-[2rem] leading-tight text-hartie sm:text-[2.25rem]">
                    Donează
                  </h3>
                  <p className="relative mt-3 max-w-sm text-amplu text-hartie/90">
                    Orice sumă contează enorm pentru a ne putea continua
                    activitatea.
                  </p>
                  <div className="relative mt-8">
                    <Buton
                      href={RUTE.doneaza}
                      varianta="contur"
                      marime="mare"
                      className={BUTON_ALB}
                    >
                      Donează acum
                    </Buton>
                  </div>
                </div>
              </article>
            </Aparitie>
          </li>

          {/* Cardul 2 · SMS — câmp de miere, cu codul scris cât cardul. */}
          <li>
            <Aparitie intarziere={0.05} className="h-full">
              <article
                className={`granulatie relative flex h-full flex-col overflow-hidden colt-b bg-miere-400 p-6 text-cerneala shadow-[0_28px_56px_-26px_rgba(255,172,0,0.9)] sm:p-7 ${RIDICARE}`}
              >
                <Decor
                  semn="stea"
                  strokeWidth={0.8}
                  className="absolute -top-10 -right-10 size-44 text-miere-200/80"
                />
                <span className="colt-mic-a relative flex size-12 items-center justify-center bg-cerneala/10 text-cerneala">
                  <Pictograma nume="telefon" className="size-6" />
                </span>
                {/* Codul, mare: e lucrul pe care omul trebuie să-l țină minte. */}
                <p
                  aria-hidden="true"
                  className="relative mt-5 font-titlu text-[3rem] leading-none font-extrabold tracking-tight text-hartie"
                >
                  {SMS.text}
                  <span className="mt-1 block text-[1.35rem] text-miere-900/80">
                    la {SMS.numar}
                  </span>
                </p>
                <h3 className="relative mt-4 text-h4 text-miere-900">
                  Donează lunar prin SMS
                </h3>
                <p className="relative mt-2 flex-1 text-mic text-miere-900/85">
                  Trimite {SMS.text} la {SMS.numar} și donezi {SMS.sumaLunara}{" "}
                  pe lună, fără formulare.
                </p>
                <Buton
                  href={`${RUTE.doneaza}#sms`}
                  varianta="contur"
                  marime="mic"
                  className="relative mt-6 self-start border-miere-900/15"
                >
                  Cum funcționează
                  <Pictograma nume="sageata" className="size-4" />
                </Buton>
              </article>
            </Aparitie>
          </li>

          {/* Cardul 3 · 3,5% — turcoaz liniștit, cu procentul scris mare. */}
          <li>
            <Aparitie intarziere={0.1} className="h-full">
              <article
                className={`granulatie relative flex h-full flex-col overflow-hidden colt-a bg-turcoaz-100 p-6 text-cerneala shadow-[0_28px_56px_-26px_rgba(42,159,163,0.7)] sm:p-7 ${RIDICARE}`}
              >
                <Decor
                  semn="spirala"
                  strokeWidth={0.8}
                  className="absolute -right-12 -bottom-12 size-48 text-turcoaz-200"
                />
                <span className="colt-mic-b relative flex size-12 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                  <Pictograma nume="document" className="size-6" />
                </span>
                <p
                  aria-hidden="true"
                  className="relative mt-5 font-titlu text-[3.4rem] leading-none font-extrabold tracking-tight text-turcoaz-600"
                >
                  3,5%
                </p>
                <h3 className="relative mt-4 text-h4 text-turcoaz-900">
                  Redirecționează 3,5%
                </h3>
                <p className="relative mt-2 flex-1 text-mic text-turcoaz-900/80">
                  Din impozitul pe venit, fără niciun cost pentru tine.
                </p>
                <Buton
                  href={RUTE.redirectionare35}
                  varianta="contur"
                  marime="mic"
                  className="relative mt-6 self-start border-turcoaz-900/15"
                >
                  Redirecționează
                  <Pictograma nume="sageata" className="size-4" />
                </Buton>
              </article>
            </Aparitie>
          </li>

          {/* Cardul 4 · Sponsorizează — cu copiii care mulțumesc unui sponsor. */}
          <li>
            <Aparitie intarziere={0.15} className="h-full">
              <article
                className={`flex h-full flex-col overflow-hidden colt-b border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] hover:shadow-[0_30px_56px_-26px_rgba(255,172,0,0.7)] ${RIDICARE}`}
              >
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={POZE.sponsorizeaza.cale}
                    alt={POZE.sponsorizeaza.alt}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
                    className="object-cover"
                  />
                  <span className="colt-mic-a absolute top-4 left-4 flex size-12 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                    <Pictograma nume="cladire" className="size-6" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="text-h4 text-cerneala">Sponsorizează</h3>
                  <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                    Pentru firme: sponsorizare prin contract și direcționare din
                    impozitul pe profit.
                  </p>
                  <Buton
                    href={RUTE.directionare20}
                    varianta="contur"
                    marime="mic"
                    className="mt-6 self-start"
                  >
                    Devino partener
                    <Pictograma nume="sageata" className="size-4" />
                  </Buton>
                </div>
              </article>
            </Aparitie>
          </li>

          {/* Cardul 5 · Devino voluntar — cu voluntarii, nu cu o pictogramă. */}
          <li>
            <Aparitie intarziere={0.2} className="h-full">
              <article
                className={`flex h-full flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] hover:shadow-[0_30px_56px_-26px_rgba(247,79,34,0.6)] ${RIDICARE}`}
              >
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={POZE.voluntar.cale}
                    alt={POZE.voluntar.alt}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
                    className="object-cover"
                  />
                  <span className="colt-mic-b absolute top-4 left-4 flex size-12 items-center justify-center bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]">
                    <Pictograma nume="familie" className="size-6" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="text-h4 text-cerneala">Devino voluntar</h3>
                  <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                    Alătură-te celor peste 300 de voluntari care ne sunt
                    alături.
                  </p>
                  <Buton
                    href={RUTE.voluntar}
                    varianta="contur"
                    marime="mic"
                    className="mt-6 self-start"
                  >
                    Vreau să ajut
                    <Pictograma nume="sageata" className="size-4" />
                  </Buton>
                </div>
              </article>
            </Aparitie>
          </li>
        </ul>
      </div>
    </section>
  );
}
