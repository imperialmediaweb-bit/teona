import { ASOCIATIA, LINKURI_EXTERNE, RUTE, SMS } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import { Nor, Soare, Zmeu } from "./Ilustratii";
import PozaLipita from "./PozaLipita";

/**
 * Fotografiile din secțiunea principală.
 *
 * Textul alternativ e scris după ce m-am uitat la fiecare poză — descrie ce se
 * vede, nu ce ne-am dori să se vadă. Prima poartă exact textul cerut de caiet
 * la 1.1.
 *
 * Două poze de pe site-ul vechi au fost scoase de aici fiindcă fișierele erau
 * deformate: WordPress le întinsese pe lățime, de la 4:3 la 2048×1211, și
 * fețele ieșeau late. Pentru parcul de aventură există originalul nedeformat
 * (`449517170…_n.jpg`, 2048×1536), deci el e folosit.
 */
const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/448953804_497190052881338_6639192819081512267_n-1.webp",
    alt: "Copii și voluntari ai Asociației Teona Ariana, într-o tabără",
    legenda: "Tabăra RESPIRO",
  },
  {
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
    alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură din tabără",
    legenda: "Parcul de aventură",
  },
  {
    cale: "/poze/2024/11/462119250_122094741458569469_941841061673534153_n.jpg",
    alt: "Copii, părinți și voluntari în tricouri albe, pe iarbă, în fața pensiunii din tabăra RESPIRO; câțiva copii fac cu mâna",
    legenda: "Familii în tabără",
  },
] as const;

/**
 * Secțiunea principală (1.1), ca prima pagină dintr-un album.
 *
 * Varianta de dinainte schimba poza singură, la șapte secunde. Aici cele trei
 * fotografii stau toate pe pagină odată, lipite una peste alta, ușor
 * strâmbe, ca într-un album de familie — și nu se mai schimbă nimic sub ochi.
 * Pentru un copil cu autism, o poză care se înlocuiește singură e o
 * surpriză nedorită; trei poze care stau pe loc sunt trei lucruri de privit.
 *
 * Deasupra lor, cerul: un soare în colț, doi nori tăiați din hârtie și un
 * zmeu lângă titlu. Dedesubt, dealurile coboară spre bara cu cifre. Fără
 * JavaScript: toată secțiunea e randată pe server.
 */
export default function Erou() {
  return (
    <section className="granulatie relative isolate overflow-hidden bg-hartie-calda">
      {/* Cerul: soare, nori, zmeu. Totul static, totul decor. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Soare className="absolute -top-10 -right-10 size-40 text-miere-200 sm:-top-14 sm:-right-14 sm:size-56 lg:-top-16 lg:right-[6%] lg:size-64" />
        <Nor className="absolute top-10 left-[-4%] w-40 text-hartie sm:w-56 lg:top-16 lg:left-[2%]" />
        <Nor className="absolute top-44 right-[34%] hidden w-36 text-hartie lg:block" />
        <Nor className="absolute bottom-[26%] left-[40%] hidden w-48 text-hartie/80 lg:block" />
        <Zmeu className="absolute top-[7%] left-[36%] hidden h-40 lg:block xl:left-[38%] xl:h-48" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-8 pb-28 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-10 lg:px-8 lg:pt-20 lg:pb-44">
        {/* Textul e primul în pagină (titlul rămâne primul lucru citit),
            dar pe telefon se vede sub poze: clientul a cerut poza sus. */}
        <div className="order-2 lg:order-1">
          <p className="scris text-amplu text-caramiziu-600">„{ASOCIATIA.motto}”</p>

          <h1 className="mt-3 text-h1 text-cerneala lg:text-[3.25rem] xl:text-[4rem]">
            Împreună,
            <br />
            <span className="relative inline-block text-caramiziu-500">
              aducem bucurie
              {/* Tușa de sub cuvinte: o trăsătură de pensulă, nu o linie. */}
              <svg
                viewBox="0 0 300 18"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-1 left-0 -z-10 h-3.5 w-full text-miere-300 sm:-bottom-2 sm:h-5"
              >
                <path
                  d="M4 12C60 5 140 2 210 5c34 1.5 60 5 86 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-amplu text-cerneala-moale">
            Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere,
            terapie prin joacă și consiliere. Alătură-te celor care schimbă vieți.
          </p>

          {/* Cele trei elemente din 1.1, în ordinea cerută. Blocul SMS e
              informație, nu buton — de aceea nu e nici link, nici <button>.
              Sub ele nu mai urmează niciun text: „zona rămâne curată”. */}
          <div className="mt-9 flex flex-wrap items-stretch gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează acum
            </Buton>

            <p className="flex flex-col justify-center rounded-[18px_8px_16px_10px] border-2 border-miere-300 bg-miere-50 px-6 py-2 leading-tight">
              <span className="font-titlu font-bold text-cerneala">
                Trimite {SMS.text} la {SMS.numar}
              </span>
              <span className="text-nota text-cerneala-moale">
                {SMS.sumaLunara} lunar, direct din telefon
              </span>
            </p>

            <Buton
              href={LINKURI_EXTERNE.galantomZiuaTa}
              varianta="contur"
              className="gap-3 text-left leading-tight"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6 shrink-0 text-caramiziu-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10.5h16v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-8zM3.5 7.5h17v3h-17v-3zM12 7.5v12M12 7.5S10.5 3 8.2 3a2.1 2.1 0 0 0 0 4.5H12zM12 7.5S13.5 3 15.8 3a2.1 2.1 0 0 1 0 4.5H12z" />
              </svg>
              <span>
                <span className="block">Donează-ți ziua de naștere</span>
                <span className="block text-nota font-normal text-cerneala-moale">
                  Strânge fonduri de ziua ta
                </span>
              </span>
            </Buton>
          </div>
        </div>

        {/* Albumul: trei poze lipite — una mare sus, două mai mici la colțurile
            de jos, fiecare acoperind doar un colț al celei mari, ca legenda ei
            scrisă de mână să rămână la vedere. Pozele sunt 16:9 sau 4:3; la 4:3
            niciuna nu pierde mai mult de o șesime. */}
        <div className="order-1 lg:order-2">
          {/* Pe telefon albumul e mai înalt și pozele mici stau sub cea mare,
              nu peste ea: la 390 px nu e loc să se suprapună fără să acopere
              legenda scrisă de mână. */}
          <div className="relative mx-auto aspect-[10/11] max-w-xl sm:aspect-[10/9] lg:max-w-none">
            <PozaLipita
              cale={FOTOGRAFII[0].cale}
              alt={FOTOGRAFII[0].alt}
              legenda={FOTOGRAFII[0].legenda}
              inclinare="stanga"
              prioritara
              banda="colturi"
              dimensiuni="(min-width: 1280px) 540px, (min-width: 1024px) 46vw, 76vw"
              className="absolute top-0 left-[14%] z-10 w-[72%]"
            />
            <PozaLipita
              cale={FOTOGRAFII[1].cale}
              alt={FOTOGRAFII[1].alt}
              legenda={FOTOGRAFII[1].legenda}
              inclinare="dreapta-mult"
              banda="sus"
              dimensiuni="(min-width: 1280px) 280px, (min-width: 1024px) 24vw, 40vw"
              className="absolute bottom-[2%] left-0 z-20 w-[44%] sm:w-[38%]"
            />
            <PozaLipita
              cale={FOTOGRAFII[2].cale}
              alt={FOTOGRAFII[2].alt}
              legenda={FOTOGRAFII[2].legenda}
              inclinare="stanga-mult"
              banda="sus"
              dimensiuni="(min-width: 1280px) 280px, (min-width: 1024px) 24vw, 40vw"
              className="absolute right-0 bottom-0 z-30 w-[44%] sm:w-[38%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
