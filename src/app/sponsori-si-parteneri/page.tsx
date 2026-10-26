import type { Metadata } from "next";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import Image from "next/image";
import Link from "next/link";
import { ASOCIATIA, EMAIL, RUTE } from "@/date/asociatie";
import { sigleSponsori } from "@/lib/sponsori";
import { textelePaginilor } from "@/lib/texte-pagini";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import Pictograma from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = metadate({
  titlu: "Sponsori și parteneri",
  descriere:
    "Firmele care sprijină taberele RESPIRO, Casa Teona și cazurile umanitare ale Asociației Teona Ariana Suceava, și cum poate firma ta să li se alăture.",
  cale: "/sponsori-si-parteneri",
});

/**
 * 6.2 — testimonialele sponsorilor.
 *
 * Caietul dă unul singur, al EGGER Group, și spune: „Dacă sunt doar unul sau
 * două, se afișează simplu, fără carusel.” Deci e un card, nu un carusel cu un
 * singur element și săgeți care nu duc nicăieri.
 *
 * Lângă citat stă fotografia copiilor care țin literele „Mulțumim Egger”:
 * e, cuvânt cu cuvânt, răspunsul copiilor la vorbele sponsorului.
 */
const TESTIMONIALE_SPONSORI = [
  {
    citat:
      "Suntem recunoscători pentru oportunitatea de a putea aduce bucurie acestor copii minunați. Ne-au învățat că adevărata frumusețe a lumii se simte dincolo de cuvinte.",
    firma: "EGGER Group",
    sigla: "/poze/2024/11/05LG_EG_egger_cmyk-Small.jpg",
    poza: {
      cale: "/poze/2024/11/459590851_545309534736056_5697611419655887236_n.jpg",
      alt: "Copii în tricouri albe țin litere colorate care formează „Mulțumim Egger”, între două bannere ale asociației, în fața pensiunii din tabără",
      legenda: "Mulțumim, EGGER",
    },
  },
] as const;

/**
 * Cele trei culori ale asociației, pe rând, pe fiecare card de siglă.
 *
 * Peretele de sigle e un perete de mulțumire, nu un tabel: fiecare firmă
 * stă pe un afiș prins pe o pânză caldă — pânza în tenta culorii, linia
 * groasă de sus, pioneza din colț și lumina de la hover, toate din aceeași
 * culoare. Sigla stă pe o placă albă, ca siglele cu fundalul lor alb sau
 * închis să nu-și arate marginile pe pânza colorată.
 *
 * Umbrele de hover sunt scrise cu valorile culorilor (`caramiziu-500`,
 * `miere-400`, `turcoaz-500`), fiindcă Tailwind nu știe să coloreze o
 * umbră cu o variabilă de temă din clasa arbitrară.
 */
const TENTE = [
  {
    panza: "bg-tenta-cald",
    pioneza: "bg-caramiziu-400",
    lumina: "group-hover:shadow-[0_30px_50px_-18px_rgba(247,79,34,0.5)]",
  },
  {
    panza: "bg-tenta-miere",
    pioneza: "bg-miere-400",
    lumina: "group-hover:shadow-[0_30px_50px_-18px_rgba(255,172,0,0.5)]",
  },
  {
    panza: "bg-tenta-turcoaz",
    pioneza: "bg-turcoaz-400",
    lumina: "group-hover:shadow-[0_30px_50px_-18px_rgba(42,159,163,0.5)]",
  },
] as const;

/**
 * Înclinarea fiecărui bilet, ca lipite de mână: nu două la fel una lângă
 * alta, nici pe rând, nici pe coloană (opt valori, patru coloane). La hover
 * biletul se îndreaptă și iese în față — ca atunci când îl iei de pe perete
 * să-l citești.
 */
const INCLINARI = [
  "-rotate-2",
  "rotate-1",
  "-rotate-1",
  "rotate-2",
  "-rotate-3",
  "rotate-[1.5deg]",
  "-rotate-[1.5deg]",
  "rotate-3",
] as const;

/**
 * O bucată de scoci: galben-pai, pe jumătate străvezie, cu dungile fine
 * ale benzii și capetele rupte (masca). Nu e o poză, e un `span`: zero
 * octeți de descărcat, și se lipește pe orice culoare de bilet.
 */
function Scoci({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-6 w-20 bg-miere-100/75 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_2px,transparent_2px_5px)] shadow-[0_1px_2px_rgba(35,35,35,0.18)] [mask-image:linear-gradient(90deg,transparent_0,black_7%,black_93%,transparent_100%)] sm:h-7 sm:w-24 ${className}`}
    />
  );
}

/**
 * Cum e prins biletul de perete, pe rând: o bucată de scoci sus, două
 * bucăți în colțuri opuse, sau o pioneză. Trei feluri, ca pe un perete
 * adevărat — pe care nimeni nu lipește toate biletele la fel.
 */
function Prindere({ fel, pioneza }: { fel: number; pioneza: string }) {
  if (fel === 0) {
    return <Scoci className="-top-3 left-1/2 -translate-x-1/2 -rotate-[4deg]" />;
  }
  if (fel === 1) {
    return (
      <>
        <Scoci className="-top-2.5 -left-6 -rotate-45" />
        <Scoci className="-right-6 -bottom-2.5 -rotate-45" />
      </>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full ${pioneza} shadow-[0_3px_5px_-1px_rgba(35,35,35,0.45),inset_0_-2px_3px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)]`}
    />
  );
}

/** „54 de firme”, „19 firme”, „o firmă” — numărul vine din listă, nu e scris. */
function firme(n: number): string {
  if (n === 1) return "o firmă";
  return n >= 20 ? `${n} de firme` : `${n} firme`;
}

export default async function SponsoriSiParteneri() {
  const sigle = await sigleSponsori();
  const texte = await textelePaginilor();
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Sponsori și parteneri", cale: RUTE.sponsori },
        ])}
      />
      <AntetPagina
        scris="Împreună cu cei care cred în noi"
        titlu="Sponsori și parteneri"
        subtitlu={texte["sponsori.antet"]}
        accent="miere"
        poza={{
          cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
          alt: "Copii și adulți în tricouri EGGER țin litere care formează „Mulțumim Egger”, în fața unui hambar de lemn negru cu o lună aurie și textul „Love you to the moon and back”",
          legenda: "Mulțumim",
        }}
        pozaMica={{
          cale: "/poze/2024/11/201900074_446697883239024_8848375334977008378_n-1-1.jpg",
          alt: "Copii și voluntari ridică foi cu litere care formează „Mulțumim Destine”, în fața pensiunii cu flori la ferestre",
        }}
      />

      {/* 6.2 */}
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-16 right-[4%] size-9 text-miere-300 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Ce spun cei care ne susțin"
            titlu="Cuvintele lor"
          />

          <ul className="mt-12 grid gap-10">
            {TESTIMONIALE_SPONSORI.map((testimonial, i) => (
              <li key={testimonial.firma}>
                <Aparitie>
                  <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                    <figure className="relative lg:col-span-7">
                      <div className="granulatie relative overflow-hidden colt-a bg-miere-300 p-8 shadow-[0_30px_60px_-28px_rgba(255,172,0,0.85)] sm:p-10 lg:p-12">
                        <Decor
                          semn="inima"
                          strokeWidth={0.8}
                          className="absolute -right-12 -bottom-12 size-52 text-miere-200/80"
                        />
                        {/* Ghilimelele desenate, nu un semn de citat în text. */}
                        <span
                          aria-hidden="true"
                          className="scris absolute top-1 left-7 text-[6rem] leading-none text-miere-700/70"
                        >
                          „
                        </span>
                        <blockquote className="relative pt-8">
                          <p className="font-titlu text-h4 leading-snug font-bold text-miere-900 sm:text-h3">
                            {testimonial.citat}
                          </p>
                        </blockquote>
                        <figcaption className="relative mt-8 flex items-center gap-4">
                          <span className="flex h-14 items-center colt-mic-a bg-hartie px-4 shadow-[0_12px_26px_-14px_rgba(35,35,35,0.5)]">
                            <Image
                              src={testimonial.sigla}
                              alt=""
                              aria-hidden="true"
                              width={160}
                              height={80}
                              className="h-9 w-auto object-contain"
                            />
                          </span>
                          <span className="font-titlu text-amplu font-bold text-miere-900">
                            {testimonial.firma}
                          </span>
                        </figcaption>
                      </div>
                    </figure>

                    <Fotografie
                      cale={testimonial.poza.cale}
                      alt={testimonial.poza.alt}
                      legenda={testimonial.poza.legenda}
                      umbra="caramiziu"
                      bloc="caramiziu"
                      colt={i % 2 === 0 ? "b" : "a"}
                      raport="aspect-[4/3]"
                      dimensiuni="(min-width: 1024px) 480px, 92vw"
                      className="mx-auto w-full max-w-xl lg:col-span-5 lg:max-w-none"
                    />
                  </div>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6.3 — Ne-au fost alături */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-umbra pt-6 pb-24 lg:pt-10 lg:pb-32">
        {/*
          Peretele: tencuială caldă (`hartie-umbra`, cu granulația de peste
          tot), luminată dinspre mijloc și mai întunecată spre margini, ca un
          perete adevărat sub o lampă; dedesubt, trei pete slabe de culoare.
          Gradient radial, nu `blur`: un blur de 500 px pe trei elemente
          costă la derulare pe telefon, un gradient nu.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.55),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(120,34,15,0.07)_100%)]" />
          <div className="absolute -top-40 -left-40 size-[34rem] rounded-full bg-[radial-gradient(closest-side,var(--color-miere-200),transparent)] opacity-50" />
          <div className="absolute top-1/4 -right-48 size-[38rem] rounded-full bg-[radial-gradient(closest-side,var(--color-turcoaz-200),transparent)] opacity-40" />
          <div className="absolute -bottom-48 left-1/4 size-[40rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramiziu-200),transparent)] opacity-40" />
          {/*
            Filigranul: cuvântul peretelui, scris de mână, cât secțiunea.
            Fără semn de exclamare — așa scrie asociația.
          */}
          <span className="scris absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 text-[clamp(7rem,24vw,22rem)] leading-none whitespace-nowrap text-miere-300/40 select-none">
            Mulțumim
          </span>
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-10 right-[5%] size-12 text-miere-300 lg:size-16"
          />
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-1/3 left-[4%] size-8 text-caramiziu-300 lg:size-10"
          />
          <Decor
            semn="inima"
            className="pluteste-lent absolute top-2/3 right-[3%] size-9 text-caramiziu-300 lg:size-12"
          />
          <Decor
            semn="spirala"
            className="pluteste-lent absolute bottom-24 left-[3%] size-10 text-turcoaz-300 lg:size-14"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-10 right-[12%] size-10 text-turcoaz-300 lg:size-14"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Peretele mulțumirii"
            titlu="Ne-au fost alături"
            text={`${firme(sigle.length)} au sprijinit taberele, Casa Teona și cazurile umanitare. Lista crește pe măsură ce ni se alătură alte companii.`}
          />

          {/*
            Patru pe rând, nu cinci: cardul e mai mare, sigla are loc să se
            vadă. Pe telefon două pe rând, cu sigla pe toată lățimea plăcii.

            Întârzierea apariției merge pe coloană (i % 4), deci un rând
            întreg apare ca o undă de la stânga la dreapta, nu toate deodată.
          */}
          <ul className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-7">
            {/*
              Primul card e al asociației: mulțumirea, în culoarea ei, cu
              aceeași formă și mărime ca ale firmelor. E ancora peretelui —
              fără el, ar fi o grilă de sigle; cu el, e un perete de
              mulțumire.
            */}
            <li className="group relative">
              <Aparitie className="h-full">
                <div className="granulatie relative flex h-full min-h-[13rem] -rotate-2 flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-br from-caramiziu-500 via-caramiziu-600 to-caramiziu-800 p-5 text-center text-hartie shadow-[3px_10px_24px_-8px_rgba(120,34,15,0.55)] transition-transform duration-500 ease-cald group-hover:z-10 group-hover:scale-[1.04] group-hover:rotate-0 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:-rotate-2 sm:p-6 lg:p-7">
                  <Scoci className="-top-2.5 -left-6 -rotate-45" />
                  <Scoci className="-right-6 -bottom-2.5 -rotate-45" />
                  <Decor
                    semn="inima"
                    aria-hidden="true"
                    className="absolute -top-4 -right-4 size-24 text-hartie/15 transition-transform duration-700 ease-cald group-hover:scale-125 group-hover:rotate-12"
                  />
                  {/*
                    Mărimea cuvântului urmează lățimea cardului, treaptă cu
                    treaptă: două coloane pe telefon (card de ~155 px la 360),
                    trei de la 640 (~185 px), patru de la 1024 (~220 px) și
                    tot patru, late, de la 1280 (~280 px). La 3,25 rem peste
                    tot, „Mulțumim” ieșea din card și `overflow-hidden` îl
                    tăia — se vedea „Mulțumin”. Măsurat, nu ghicit: proba
                    din scratchpad numără cuvintele mai late decât cardul.
                  */}
                  <span className="scris relative text-[2rem] leading-none text-miere-200 sm:text-[2.5rem] lg:text-[2.9rem] xl:text-[3.5rem]">
                    Mulțumim
                  </span>
                  <span className="relative font-titlu text-mic leading-tight font-bold text-hartie/90">
                    fiecărei firme de aici
                  </span>
                </div>
              </Aparitie>
            </li>
            {sigle.map((sigla, i) => {
              const t = TENTE[i % 3];
              const card = (
                <div
                  className={`relative flex h-full flex-col items-center justify-center gap-4 rounded-md ${t.panza} ${
                    INCLINARI[i % INCLINARI.length]
                  } p-5 pt-7 shadow-[3px_10px_22px_-10px_rgba(35,35,35,0.5)] transition-all duration-500 ease-cald group-hover:z-10 group-hover:scale-[1.05] group-hover:rotate-0 ${t.lumina} motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:p-6 sm:pt-8 lg:p-7 lg:pt-8`}
                >
                  {/*
                    Felul prinderii se decalează cu rândul (patru pe rând):
                    altfel, cu același rest la 3 ca și culoarea, pioneza ar
                    cădea mereu pe biletele turcoaz.
                  */}
                  <Prindere
                    fel={(i + Math.floor(i / 4)) % 3}
                    pioneza={t.pioneza}
                  />
                  {/*
                    Sigla, ca o poză lipită pe bilet: placă albă, ușor
                    ridicată. Siglele cu fundalul lor alb sau închis nu-și
                    arată marginile pe hârtia colorată.
                  */}
                  <div className="flex h-24 w-full items-center justify-center rounded-lg bg-hartie px-4 py-3 shadow-[0_2px_6px_-2px_rgba(35,35,35,0.3),inset_0_0_0_1px_rgba(35,35,35,0.05)] lg:h-28">
                    <Image
                      src={sigla.cale}
                      alt={`Sigla ${sigla.nume}`}
                      width={320}
                      height={160}
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 30vw, 45vw"
                      className="max-h-[4.5rem] w-auto object-contain transition-transform duration-500 ease-cald group-hover:scale-110 motion-reduce:group-hover:scale-100 lg:max-h-[5.5rem]"
                    />
                  </div>
                  <span className="text-center font-titlu text-mic leading-snug font-bold text-cerneala">
                    {sigla.nume}
                  </span>
                </div>
              );
              return (
                <li key={sigla.nume} className="group relative">
                  <Aparitie intarziere={(i % 4) * 0.04} className="h-full">
                    {/*
                      Când asociația a scris adresa firmei în panou, cardul
                      e link — așa cere caietul; fără adresă e doar card, nu
                      un link care nu duce nicăieri.
                    */}
                    {sigla.adresa ? (
                      <a
                        href={sigla.adresa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full rounded-[inherit] outline-none focus-visible:ring-4 focus-visible:ring-turcoaz-300"
                        aria-label={`${sigla.nume} — site-ul firmei, se deschide în altă filă`}
                      >
                        {card}
                      </a>
                    ) : (
                      card
                    )}
                  </Aparitie>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/*
        Cele trei căi pe care o firmă ne poate fi alături.

        Pagina avea 172 de cuvinte: sigle, trei testimoniale și un buton
        „Pentru firme”. Un director care ajunge aici de pe Google vedea pe cine
        susținem, nu cum se face. Cele trei căi există deja, fiecare pe pagina
        ei; secțiunea asta le spune pe scurt și trimite acolo, în loc să
        repete calculul și documentele.

        Nimic despre ce „primește” firma în schimb, în afară de ce se vede pe
        pagina asta: o listă de sigle. Beneficii pe care nu le-a promis nimeni
        n-au ce căuta într-un text pe care îl citește un contabil.
      */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="unda"
            strokeWidth={0.7}
            className="pluteste-lent absolute bottom-16 left-[4%] size-10 text-turcoaz-200 lg:size-14"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Pentru firme"
            titlu="Cum poate firma ta să ne fie alături"
            text="Trei căi, toate prin bancă și toate cu documente. Primele două nu scot bani din firmă: mută spre copii o parte din impozitul pe care îl plătește oricum."
          />

          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            <li>
              <Aparitie className="h-full">
                <Link
                  href={RUTE.directionare20}
                  className="group flex h-full flex-col colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.4)] transition-all duration-500 ease-cald hover:-translate-y-1.5 hover:shadow-[0_30px_56px_-26px_rgba(247,79,34,0.55)] motion-reduce:hover:translate-y-0 sm:p-7"
                >
                  <span className="colt-mic-b flex size-12 items-center justify-center bg-caramiziu-700 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]">
                    <Pictograma nume="document" className="size-6" />
                  </span>
                  <h3 className="mt-5 text-h4 text-cerneala transition-colors duration-300 group-hover:text-caramiziu-700">
                    Contract de sponsorizare
                  </h3>
                  <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                    Până la 20% din impozitul pe profit poate merge la asociație
                    în loc să meargă la stat. Firma semnează un contract, face
                    plata și scade suma din impozit.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-700">
                    Calculator și pași
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </Link>
              </Aparitie>
            </li>
            <li>
              <Aparitie intarziere={0.06} className="h-full">
                <Link
                  href={RUTE.directionare20}
                  className="group flex h-full flex-col colt-b border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.4)] transition-all duration-500 ease-cald hover:-translate-y-1.5 hover:shadow-[0_30px_56px_-26px_rgba(42,159,163,0.5)] motion-reduce:hover:translate-y-0 sm:p-7"
                >
                  <span className="colt-mic-a flex size-12 items-center justify-center bg-turcoaz-600 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                    <Pictograma nume="plic" className="size-6" />
                  </span>
                  <h3 className="mt-5 text-h4 text-cerneala transition-colors duration-300 group-hover:text-turcoaz-700">
                    Declarația 177
                  </h3>
                  <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                    Pentru sponsorizarea deja plătită, firma cere
                    redirecționarea sumei prin Declarația 177. Termenul îl
                    confirmăm împreună cu contabilitatea.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-turcoaz-700">
                    Cum se depune
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </Link>
              </Aparitie>
            </li>
            <li>
              <Aparitie intarziere={0.12} className="h-full">
                <Link
                  href={RUTE.doneaza}
                  className="group flex h-full flex-col colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.4)] transition-all duration-500 ease-cald hover:-translate-y-1.5 hover:shadow-[0_30px_56px_-26px_rgba(255,172,0,0.55)] motion-reduce:hover:translate-y-0 sm:p-7"
                >
                  <span className="colt-mic-b flex size-12 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                    <Pictograma nume="card" className="size-6" />
                  </span>
                  <h3 className="mt-5 text-h4 text-cerneala transition-colors duration-300 group-hover:text-miere-700">
                    Donație din partea firmei
                  </h3>
                  <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                    Transfer bancar în conturile asociației, o dată sau lunar,
                    cu destinația aleasă: tabere, Casa Teona sau cazuri
                    umanitare.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-miere-700">
                    Conturile și destinațiile
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </Link>
              </Aparitie>
            </li>
          </ul>

          <p className="mt-10 text-center text-mic text-cerneala-moale">
            Firmele care ne-au fost alături apar în lista de mai sus. Pentru
            orice întrebare, scrie-ne la{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-titlu font-semibold text-caramiziu-700 underline-offset-4 hover:underline"
            >
              {EMAIL.contact}
            </a>
            .
          </p>
        </div>
      </section>

      {/* 6.4 — „Vrei să te alături lor?”, cu butonul Donează. Pe aceeași
          fâșie de identitate cu care se închid celelalte pagini. */}
      <Val culoare="text-caramiziu-700" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-gradient-to-br from-caramiziu-700 via-caramiziu-800 to-caramiziu-900 pb-20 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <span className="absolute -top-40 -right-24 size-[34rem] rounded-full border-2 border-hartie/15" />
          <span className="absolute -bottom-52 -left-20 size-[30rem] rounded-full border-2 border-hartie/15" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="scris text-h3 text-hartie/85">„{ASOCIATIA.motto}”</p>
          <h2 className="mt-3 text-h2 text-hartie">Vrei să te alături lor?</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Buton
              href={RUTE.doneaza}
              varianta="contur"
              marime="mare"
              className="border-hartie bg-hartie text-caramiziu-700 hover:border-hartie hover:text-caramiziu-700"
            >
              Donează
            </Buton>
            <Buton
              href={RUTE.directionare20}
              varianta="contur"
              marime="mare"
              className="border-hartie/50 bg-transparent text-hartie hover:border-hartie hover:bg-hartie/10 hover:text-hartie"
            >
              Pentru firme
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
