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
 * Cele trei culori ale asociației, pe rând, pe fiecare card: linia subțire
 * de sus, și la hover marginea și lumina. Atât — cardul rămâne alb, ca
 * sigla să fie singurul lucru colorat de pe el.
 *
 * Prima variantă avea carduri pe hârtie colorată, apoi bilete strâmbe cu
 * scoci pe tencuială; asociația le-a găsit îngrămădite. Avea dreptate:
 * 55 de sigle, fiecare cu culorile ei, au nevoie de liniște în jur, nu de
 * încă un strat de culoare și de unghiuri. Umbrele de hover sunt scrise cu
 * valorile culorilor, fiindcă Tailwind nu colorează o umbră cu o variabilă
 * de temă din clasa arbitrară.
 */
const ACCENTE = [
  {
    linie: "border-t-caramiziu-400",
    margine: "group-hover:border-caramiziu-300",
    lumina: "group-hover:shadow-[0_24px_48px_-20px_rgba(247,79,34,0.35)]",
  },
  {
    linie: "border-t-miere-400",
    margine: "group-hover:border-miere-300",
    lumina: "group-hover:shadow-[0_24px_48px_-20px_rgba(255,172,0,0.35)]",
  },
  {
    linie: "border-t-turcoaz-400",
    margine: "group-hover:border-turcoaz-300",
    lumina: "group-hover:shadow-[0_24px_48px_-20px_rgba(42,159,163,0.35)]",
  },
] as const;

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
      <section className="relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-10 right-[5%] size-10 text-miere-300 lg:size-14"
          />
          <Decor
            semn="spirala"
            className="pluteste-lent absolute bottom-24 left-[3%] size-9 text-turcoaz-200 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Mulțumim"
            titlu="Ne-au fost alături"
            text={`${firme(sigle.length)} au sprijinit taberele, Casa Teona și cazurile umanitare. Lista crește pe măsură ce ni se alătură alte companii.`}
          />

          {/*
            O galerie, nu un perete: carduri albe, drepte, cu aer între ele.
            Patru pe rând pe laptop, cinci pe ecran lat; pe telefon două.
            Întârzierea apariției merge pe coloană, deci rândul apare ca o
            undă de la stânga la dreapta.
          */}
          <ul className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8 xl:grid-cols-5">
            {sigle.map((sigla, i) => {
              const a = ACCENTE[i % 3];
              const card = (
                <div
                  className={`flex h-full flex-col items-center justify-center gap-5 rounded-2xl border border-cerneala/8 border-t-[3px] ${a.linie} bg-hartie px-5 py-7 shadow-[0_1px_2px_rgba(35,35,35,0.04),0_10px_30px_-18px_rgba(35,35,35,0.25)] transition-all duration-500 ease-cald group-hover:-translate-y-1.5 ${a.margine} ${a.lumina} motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 sm:px-6 sm:py-8 lg:py-9`}
                >
                  <div className="flex h-20 w-full items-center justify-center lg:h-24">
                    <Image
                      src={sigla.cale}
                      alt={`Sigla ${sigla.nume}`}
                      width={320}
                      height={160}
                      sizes="(min-width: 1280px) 220px, (min-width: 1024px) 260px, (min-width: 640px) 30vw, 45vw"
                      className="max-h-20 w-auto object-contain transition-transform duration-500 ease-cald group-hover:scale-[1.07] motion-reduce:group-hover:scale-100 lg:max-h-24"
                    />
                  </div>
                  <span className="text-center font-titlu text-mic leading-snug font-bold text-cerneala-moale transition-colors duration-500 group-hover:text-cerneala">
                    {sigla.nume}
                  </span>
                </div>
              );
              return (
                <li key={sigla.nume} className="group">
                  <Aparitie intarziere={(i % 5) * 0.03} className="h-full">
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
                        className="block h-full rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-turcoaz-300"
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
