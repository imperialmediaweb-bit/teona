import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RETELE_ASOCIATIE,
  RUTE,
  TELEFOANE,
} from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import { PictogramaRetea } from "@/componente/Retele";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import DeCopiat from "@/componente/pagina/DeCopiat";
import TitluSectiune from "@/componente/pagina/TitluSectiune";
import FormularContact from "@/componente/formular/FormularContact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Scrie-ne pentru orice întrebare sau dorință de implicare. Telefon, email, adresele asociației și formular de contact.",
};

/** Cele trei căi de contact (10.2), fiecare pe câmpul ei de culoare. */
const CAI_DE_CONTACT: ReadonlyArray<{
  pictograma: NumePictograma;
  eticheta: string;
  valoare: string;
  href: string;
  clase: string;
  pictogramaClase: string;
}> = [
  {
    pictograma: "telefon",
    eticheta: "Telefon",
    valoare: TELEFOANE[0].afisat,
    href: `tel:${TELEFOANE[0].apel}`,
    clase: "granulatie bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 text-hartie shadow-[0_28px_56px_-26px_rgba(247,79,34,0.85)]",
    pictogramaClase: "bg-hartie/20 text-hartie",
  },
  {
    pictograma: "telefon",
    eticheta: "Telefon",
    valoare: TELEFOANE[1].afisat,
    href: `tel:${TELEFOANE[1].apel}`,
    clase: "granulatie bg-miere-300 text-miere-900 shadow-[0_28px_56px_-26px_rgba(255,172,0,0.85)]",
    pictogramaClase: "bg-cerneala/10 text-cerneala",
  },
  {
    pictograma: "plic",
    eticheta: "Email",
    valoare: EMAIL.contact,
    href: `mailto:${EMAIL.contact}`,
    clase: "granulatie bg-turcoaz-100 text-turcoaz-900 shadow-[0_28px_56px_-26px_rgba(42,159,163,0.6)]",
    pictogramaClase: "bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]",
  },
];

/**
 * Numele de cont, citit din adresa rețelei: „@teonaariana_sv”. Pe Facebook
 * adresa paginii e scrisă fără diacritice („asociatia.teona.ariana”) și nu se
 * poate schimba de aici, așa că acolo apare doar că e pagina oficială.
 */
function cont(nume: string, url: string) {
  if (nume === "Facebook") return "Pagina oficială a asociației";
  const ultim = url.replace(/\/$/, "").split("/").pop() ?? "";
  return ultim.startsWith("@") ? ultim : `@${ultim}`;
}

export default function Contact() {
  const { casaTeona, sediuSocial } = ADRESE;

  return (
    <>
      <AntetPagina
        scris="Scrie-ne sau sună-ne"
        titlu="Contact"
        subtitlu="Scrie-ne pentru orice întrebare sau dorință de implicare. Împreună putem aduce speranță și schimbare în viețile copiilor care au nevoie de noi."
        accent="turcoaz"
        poza={{
          cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
          alt: "Voluntari și copii, în grup, la apus",
          legenda: "Echipa noastră",
        }}
        pozaMica={{
          cale: "/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.13.jpeg",
          alt: "O voluntară și o fetiță, amândouă în tricourile albe ale asociației, în sala cu pictura din junglă de la Casa Teona",
        }}
      />

      {/* 10.2 — date de contact. Fără persoane de contact: caietul cere
          explicit ca lista de persoane de pe pagina veche să fie scoasă. */}
      {/* Fără `overflow-hidden`: cardurile de dedesubt sunt trase în sus
          intenționat, ca să iasă peste valul antetului. Cu el, secțiunea
          le reteza exact partea ieșită — primul rând de text apărea tăiat
          pe jumătate. */}
      <section className="relative bg-hartie pb-24 lg:pb-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Date de contact</h2>
          {/* Cele trei carduri ies peste valul antetului, ca banda de cifre
              de pe prima pagină. */}
          <ul className="relative z-20 -mt-6 grid gap-5 sm:-mt-10 sm:grid-cols-3 lg:-mt-16">
            {CAI_DE_CONTACT.map((rand, i) => (
              <li key={rand.valoare}>
                <a
                  href={rand.href}
                  className={`relative flex h-full flex-col overflow-hidden ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } p-6 transition-all duration-500 ease-cald hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 sm:p-7 ${rand.clase}`}
                >
                  <Decor
                    semn={i === 0 ? "unda" : i === 1 ? "stea" : "spirala"}
                    strokeWidth={0.8}
                    className="absolute -right-10 -bottom-10 size-40 opacity-25"
                  />
                  <span
                    className={`relative flex size-12 shrink-0 items-center justify-center ${
                      i % 2 === 0 ? "colt-mic-b" : "colt-mic-a"
                    } ${rand.pictogramaClase}`}
                  >
                    <Pictograma nume={rand.pictograma} className="size-6" />
                  </span>
                  <span className="relative mt-6 block font-titlu text-nota font-bold tracking-wider uppercase opacity-80">
                    {rand.eticheta}
                  </span>
                  <span className="relative mt-1 block font-titlu text-[1.5rem] leading-tight font-extrabold tracking-tight break-all sm:text-[1.35rem] lg:text-[1.65rem]">
                    {rand.valoare}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* 10.3 — adresele, separat. Numai Casa Teona are hartă. */}
          <h2 className="sr-only">Adrese</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-12 lg:gap-6">
            <Aparitie className="lg:col-span-7">
              <article className="flex h-full flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] sm:flex-row">
                <div className="relative aspect-[16/9] w-full sm:aspect-auto sm:w-[42%] sm:min-h-[16rem]">
                  <Image
                    src="/poze/2024/11/poza3_enhanced.webp"
                    alt="Clădirea Casa Teona din Suceava, cu firma „Casa TEONA” deasupra intrării"
                    fill
                    sizes="(min-width: 1024px) 320px, 92vw"
                    className="object-cover"
                  />
                  <span className="colt-mic-b absolute top-4 left-4 bg-caramiziu-500 px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
                    <span className="scris text-corp leading-none text-hartie">{casaTeona.nume}</span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="text-h4 text-cerneala">{casaTeona.nume}</h3>
                  <p className="mt-3 font-titlu text-amplu font-bold text-cerneala">
                    {casaTeona.strada}, {casaTeona.oras} {casaTeona.cod}
                  </p>
                  <p className="mt-2 text-mic text-cerneala-moale">
                    {casaTeona.program} · {casaTeona.acces}
                  </p>
                  <div className="mt-auto pt-6">
                    <Buton href={casaTeona.harta} varianta="contur">
                      <Pictograma nume="harta" className="size-4" />
                      Deschide în hartă
                    </Buton>
                  </div>
                </div>
              </article>
            </Aparitie>

            <Aparitie intarziere={0.08} className="lg:col-span-5">
              <article className="granulatie relative flex h-full flex-col overflow-hidden colt-b bg-hartie-calda p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.4)] sm:p-7">
                <Decor semn="soare" strokeWidth={0.8} className="absolute -top-10 -right-10 size-40 text-miere-200" />
                <span className="colt-mic-a relative flex size-12 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                  <Pictograma nume="cladire" className="size-6" />
                </span>
                <h3 className="relative mt-5 text-h4 text-cerneala">{sediuSocial.nume}</h3>
                <p className="relative mt-3 font-titlu text-amplu font-bold text-cerneala">
                  {sediuSocial.strada}, {sediuSocial.oras}
                </p>
                <p className="relative mt-2 text-mic text-cerneala-moale">
                  Adresa de corespondență a asociației.
                </p>
              </article>
            </Aparitie>
          </div>
        </div>
      </section>

      {/* 10.4 — formularul */}
      <Val culoare="text-tenta-cald" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-cald pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-16 right-[6%] size-8 text-miere-300 lg:size-11" />
          <Decor semn="unda" className="pluteste-lent absolute bottom-24 left-[3%] size-9 text-caramiziu-200 lg:size-12" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
          <div>
            <TitluSectiune
              scris="Îți răspundem cât putem de repede"
              titlu="Scrie-ne"
              text={
                <>
                  Completează formularul și îți răspundem cât putem de repede.
                  Dacă preferi, ne poți scrie direct la{" "}
                  <a
                    href={`mailto:${EMAIL.contact}`}
                    className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
                  >
                    {EMAIL.contact}
                  </a>
                  .
                </>
              }
            />
            <div className="relative mt-12 hidden lg:block">
              <span
                aria-hidden="true"
                className="absolute -top-4 -left-4 h-[70%] w-[60%] colt-b bg-caramiziu-100"
              />
              <div className="colt-a relative aspect-[4/3] overflow-hidden bg-hartie-calda shadow-[0_26px_52px_-24px_rgba(247,79,34,0.5)]">
                <Image
                  src="/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg"
                  alt="O voluntară desenează împreună cu un copil, la masă"
                  fill
                  sizes="(min-width: 1024px) 460px, 0px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <FormularContact />
        </div>
      </section>

      {/* 10.5 — rețele sociale */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Conturile oficiale ale asociației"
            titlu="Ne găsești pe"
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {RETELE_ASOCIATIE.map((retea, i) => (
              <li key={retea.nume}>
                <a
                  href={retea.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${retea.nume}, ${ASOCIATIA.denumire} (se deschide într-o filă nouă)`}
                  className={`flex h-full items-center gap-4 ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } border border-hartie-umbra bg-hartie p-5 shadow-[0_18px_38px_-22px_rgba(35,35,35,0.45)] transition-all duration-500 ease-cald hover:-translate-y-1 hover:shadow-[0_24px_46px_-22px_rgba(247,79,34,0.45)] motion-reduce:hover:translate-y-0`}
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cerneala text-hartie">
                    <PictogramaRetea nume={retea.nume} className="size-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-titlu text-amplu font-bold text-cerneala">
                      {retea.nume}
                    </span>
                    <span className="block truncate text-mic text-cerneala-moale">
                      {cont(retea.nume, retea.url)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {/*
            Caietul cere aici și conturile de Facebook și Instagram ale
            grupului „Culegătorii de Zâmbete”, cu mențiune clară că sunt
            separate de ale asociației. Adresele lor nu există nici în caiet,
            nici pe site-ul actual — se adaugă de îndată ce le primim.
          */}
        </div>
      </section>

      {/* 10.6 — date oficiale */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="spirala" className="pluteste-lent absolute top-14 left-[3%] size-9 text-turcoaz-200 lg:size-12" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <TitluSectiune titlu="Date oficiale" />
            <div className="mt-8 grid gap-3">
              <DeCopiat eticheta="Denumire" valoare={ASOCIATIA.denumireLegala} />
              <DeCopiat eticheta="CIF" valoare={ASOCIATIA.cif} culoare="miere" colt="b" />
            </div>

            <p className="mt-7 text-cerneala-moale">
              Cum folosim fiecare donație găsești la{" "}
              <Link
                href={`${RUTE.despre}#transparenta`}
                className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
              >
                secțiunea Transparență
              </Link>{" "}
              de pe pagina Despre noi.
            </p>
          </div>

          {/* Certificatul se afișează ca imagine, fără buton de descărcare
              (10.6). Pe un bloc de miere, ca o hârtie pusă pe masă. */}
          <figure className="relative mx-auto w-full max-w-md pt-4 pr-4 lg:max-w-none">
            <span
              aria-hidden="true"
              className="absolute top-0 right-0 bottom-8 left-8 colt-b bg-miere-200"
            />
            <div className="colt-a relative overflow-hidden bg-hartie p-3 shadow-[0_26px_52px_-24px_rgba(255,172,0,0.6)] sm:p-4">
              <Image
                src="/poze/2024/11/Certificat-de-inregistrare-ATA_page-0001.jpg"
                alt="Certificatul de înregistrare al Asociației Teona Ariana Suceava, emis de Ministerul Justiției"
                width={900}
                height={1273}
                sizes="(min-width: 1024px) 520px, 92vw"
                className="h-auto w-full"
              />
            </div>
          </figure>
        </div>
      </section>
    </>
  );
}
