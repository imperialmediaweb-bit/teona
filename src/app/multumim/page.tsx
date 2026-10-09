import type { Metadata } from "next";
import Link from "next/link";
import { ASOCIATIA, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";
import { metadate } from "@/app/seo";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Mulțumim pentru donație",
    descriere:
      "Mulțumim pentru donația ta către Asociația Teona Ariana Suceava.",
    cale: "/multumim",
  }),
  // Pagina n-are ce căuta în rezultatele căutării: se ajunge la ea doar
  // după o plată.
  robots: { index: false, follow: true },
};

/**
 * Pagina de mulțumire (2.2 din caiet).
 *
 * Nu scrie suma și nu confirmă încasarea. Motivul e important: adresa asta o
 * poate deschide oricine, oricând, iar ce vine în ea prin adresă poate fi
 * scris de mână. Confirmarea adevărată vine pe e-mail, de la procesator,
 * după ce plata a fost verificată pe server. O pagină care ar scrie „am
 * primit 100 de lei” pentru că așa zice adresa ar minți la prima apăsare pe
 * Enter în bara browserului.
 */
export default function Multumim() {
  return (
    <section className="relative overflow-hidden bg-hartie-calda pt-16 pb-24 lg:pt-24 lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="stea"
          className="pluteste-lent absolute top-16 left-[6%] size-9 text-miere-200 lg:size-14"
        />
        <Decor
          semn="unda"
          className="pluteste-lent absolute right-[7%] bottom-28 size-9 text-turcoaz-200 lg:size-12"
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="mx-auto flex size-20 items-center justify-center colt-a bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 text-hartie shadow-[0_20px_44px_-18px_rgba(247,79,34,0.9)]">
          <Pictograma nume="inima" className="size-10" />
        </span>

        <p className="scris mt-7 text-amplu text-caramiziu-600">
          {ASOCIATIA.motto}
        </p>
        <h1 className="mt-2 text-h1 text-cerneala">
          Mulțumim pentru donație!
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-amplu text-cerneala-moale">
          Donația ta înseamnă mult pentru noi. Vei primi o confirmare pe
          e-mail din partea platformei de plată — dacă nu ajunge în câteva
          minute, uită-te și în „Spam”.
        </p>

        <div className="granulatie mt-10 colt-b border border-hartie-umbra bg-hartie p-7 text-left shadow-[0_24px_50px_-28px_rgba(35,35,35,0.35)] sm:p-9">
          <h2 className="text-h3 text-cerneala">Ce urmează</h2>
          <ul className="mt-5 grid gap-4 text-cerneala-moale">
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 size-2 shrink-0 rounded-full bg-caramiziu-500"
              />
              <span>
                Confirmarea plății îți vine pe e-mail, de la procesator. Ea e
                și dovada donației.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 size-2 shrink-0 rounded-full bg-miere-400"
              />
              <span>
                Dacă ai ales donația lunară, se reînnoiește singură și o poți
                opri oricând, fără motivare — scrie-ne la{" "}
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="subliniat font-semibold text-caramiziu-700"
                >
                  {EMAIL.contact}
                </a>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 size-2 shrink-0 rounded-full bg-turcoaz-500"
              />
              <span>
                Ai nevoie de o confirmare scrisă din partea asociației? Sună la{" "}
                <a
                  href={`tel:${TELEFON_PRINCIPAL.apel}`}
                  className="subliniat font-semibold text-caramiziu-700"
                >
                  {TELEFON_PRINCIPAL.afisat}
                </a>{" "}
                și ți-o pregătim.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Buton href={RUTE.acasa} marime="mare">
            Înapoi la prima pagină
          </Buton>
          <Link
            href={RUTE.proiecte}
            className="inline-flex min-h-12 items-center rounded-full border border-hartie-umbra bg-hartie px-6 py-3 font-titlu font-bold text-cerneala transition-colors hover:border-caramiziu-300 hover:text-caramiziu-700"
          >
            Vezi ce facem cu banii
          </Link>
        </div>
      </div>
    </section>
  );
}
