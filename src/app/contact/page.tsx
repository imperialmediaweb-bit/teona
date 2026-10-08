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
import Buton from "@/componente/Buton";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Retele from "@/componente/Retele";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import FormularContact from "@/componente/formular/FormularContact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Scrie-ne pentru orice întrebare sau dorință de implicare. Telefon, email, adresele asociației și formular de contact.",
};

export default function Contact() {
  const { casaTeona, sediuSocial } = ADRESE;

  return (
    <>
      <AntetPagina
        titlu="Contact"
        subtitlu="Scrie-ne pentru orice întrebare sau dorință de implicare. Împreună putem aduce speranță și schimbare în viețile copiilor care au nevoie de noi."
        poza={{
          cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
          alt: "Voluntari și copii, în grup, la apus",
          legenda: "Echipa noastră",
        }}
      />

      {/* 10.2 — date de contact. Fără persoane de contact: caietul cere
          explicit ca lista de persoane de pe pagina veche să fie scoasă. */}
      <section className="bg-hartie pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Date de contact</h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              ...TELEFOANE.map((telefon) => ({
                pictograma: "telefon" as NumePictograma,
                eticheta: "Telefon",
                valoare: telefon.afisat,
                href: `tel:${telefon.apel}`,
              })),
              {
                pictograma: "plic" as NumePictograma,
                eticheta: "Email",
                valoare: EMAIL.contact,
                href: `mailto:${EMAIL.contact}`,
              },
            ].map((rand, i) => (
              <li key={rand.valoare}>
                <a
                  href={rand.href}
                  className={`flex h-full items-center gap-4 ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } bg-hartie-calda p-6 shadow-[0_16px_34px_-20px_rgba(247,79,34,0.45)] transition-all duration-300 ease-cald hover:-translate-y-1 motion-reduce:hover:translate-y-0`}
                >
                  <span className="colt-mic-a flex size-12 shrink-0 items-center justify-center bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]">
                    <Pictograma nume={rand.pictograma} className="size-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                      {rand.eticheta}
                    </span>
                    <span className="block font-titlu text-amplu font-bold break-words text-cerneala">
                      {rand.valoare}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10.3 — adresele, separat. Numai Casa Teona are hartă. */}
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="colt-a bg-hartie p-7 shadow-[0_18px_38px_-22px_rgba(35,35,35,0.5)]">
            <h2 className="text-h4 text-cerneala">{casaTeona.nume}</h2>
            <p className="mt-3 text-cerneala-moale">
              {casaTeona.strada}, {casaTeona.oras} {casaTeona.cod}
            </p>
            <p className="mt-1.5 text-cerneala-moale">
              {casaTeona.program} · {casaTeona.acces}
            </p>
            <Buton href={casaTeona.harta} varianta="contur" marime="mic" className="mt-6">
              <Pictograma nume="harta" className="size-4" />
              Deschide în hartă
            </Buton>
          </div>

          <div className="colt-b bg-hartie p-7 shadow-[0_18px_38px_-22px_rgba(35,35,35,0.5)]">
            <h2 className="text-h4 text-cerneala">{sediuSocial.nume}</h2>
            <p className="mt-3 text-cerneala-moale">
              {sediuSocial.strada}, {sediuSocial.oras}
            </p>
          </div>
        </div>
      </section>

      {/* 10.4 — formularul */}
      <Val culoare="text-tenta-cald" />
      <section className="granulatie bg-tenta-cald pb-20 lg:pb-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-16 lg:px-8">
          <div>
            <h2 className="text-h2 text-cerneala">Scrie-ne</h2>
            <p className="mt-4 text-cerneala-moale">
              Completează formularul și îți răspundem cât putem de repede. Dacă
              preferi, ne poți scrie direct la{" "}
              <a
                href={`mailto:${EMAIL.contact}`}
                className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
              >
                {EMAIL.contact}
              </a>
              .
            </p>
          </div>

          <FormularContact />
        </div>
      </section>

      {/* 10.5 — rețele sociale */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h3 text-cerneala">Ne găsești pe</h2>
          <p className="mt-3 text-cerneala-moale">
            Conturile oficiale ale asociației.
          </p>
          <Retele
            retele={RETELE_ASOCIATIE}
            context={ASOCIATIA.denumire}
            className="mt-6 text-cerneala-moale"
          />
          {/*
            Caietul cere aici și conturile de Facebook și Instagram ale
            grupului „Culegătorii de Zâmbete”, cu mențiune clară că sunt
            separate de ale asociației. Adresele lor nu există nici în caiet,
            nici pe site-ul actual — se adaugă de îndată ce le primim.
          */}
        </div>
      </section>

      {/* 10.6 — date oficiale */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <h2 className="text-h2 text-cerneala">Date oficiale</h2>
            <ul className="mt-7 grid gap-4">
              <li>
                <span className="block font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                  Denumire
                </span>
                <span className="font-titlu text-amplu font-bold text-cerneala">
                  {ASOCIATIA.denumireLegala}
                </span>
              </li>
              <li>
                <span className="block font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                  CIF
                </span>
                <span className="font-titlu text-amplu font-bold text-cerneala select-all">
                  {ASOCIATIA.cif}
                </span>
              </li>
            </ul>

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
              (10.6). */}
          <figure className="colt-a overflow-hidden bg-hartie p-4 shadow-[0_22px_45px_-24px_rgba(35,35,35,0.5)]">
            <Image
              src="/poze/2024/11/Certificat-de-inregistrare-ATA_page-0001.jpg"
              alt="Certificatul de înregistrare al Asociației Teona Ariana Suceava, emis de Ministerul Justiției"
              width={900}
              height={1273}
              sizes="(min-width: 1024px) 520px, 92vw"
              className="h-auto w-full"
            />
          </figure>
        </div>
      </section>
    </>
  );
}
