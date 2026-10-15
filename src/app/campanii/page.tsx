import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import { RUTE } from "@/date/asociatie";
import { areBazaDeDate } from "@/lib/baza";
import { textePublicate } from "@/lib/texte";
import AntetPagina from "@/componente/pagina/AntetPagina";
import ListaScrise from "@/componente/pagina/ListaScrise";
import IndemnFinal from "@/componente/IndemnFinal";

export const metadata: Metadata = metadate({
  titlu: "Campanii",
  descriere:
    "Campaniile Asociației Teona Ariana Suceava: pentru ce strângem fonduri acum și unde ajung banii.",
  cale: RUTE.campanii,
});

/**
 * Campaniile asociației (nu cele de ziua cuiva — alea sunt la `/ziua-ta`).
 *
 * Sunt scrise din panou și stau în baza de date: o campanie pornește când
 * decide asociația, nu când are dezvoltatorul timp să publice.
 */
export default function PaginaCampanii() {
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Campanii", cale: RUTE.campanii }])} />
      <AntetPagina
        scris="Strângem împreună"
        titlu="Campanii"
        subtitlu="Pentru ce strângem fonduri acum, cât s-a propus și unde ajung banii."
        accent="caramiziu"
        poza={{
          cale: "/poze/2024/11/347598753_3647630975458046_6343055552353416081_n.jpg",
          alt: "O voluntară pictează cu pensula palma unei fete, la un atelier; pe masă, foi cu amprente de palme roșii și albastre și sticluțe de tempera",
          legenda: "Împreună",
        }}
        pozaMica={{
          cale: "/poze/2024/11/339454935_239875385107246_1378022596723045576_n-1.jpg",
          alt: "O fetiță îl sărută pe obraz pe un băiețel; stau pe covor, între bețișoare colorate, un puzzle cu forme și cuburi",
        }}
      />

      <section className="relative bg-hartie pt-4 pb-24 lg:pt-10 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Legătura dintre cele două secțiuni. În meniu încape doar una —
              zece intrări rup antetul pe un laptop de 1280 px — așa că fiecare
              trimite la cealaltă, de unde o caută cineva oricum. */}
          <p className="mb-8 text-mic text-cerneala-moale">
            <Link
              href={RUTE.noutati}
              className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-4 hover:text-caramiziu-800"
            >
              Vezi și noutățile asociației →
            </Link>
          </p>

          <Suspense
            fallback={
              <p className="text-center text-amplu text-cerneala-moale">
                Se încarcă…
              </p>
            }
          >
            <Lista />
          </Suspense>
        </div>
      </section>

      <IndemnFinal peste butoane="doua" titlu="Orice sumă schimbă o zi" />
    </>
  );
}

async function Lista() {
  await connection();
  if (!areBazaDeDate()) return null;
  const texte = await textePublicate("campanie");
  return (
    <ListaScrise
      texte={texte}
      cale={RUTE.campanii}
      gol="Nu e nicio campanie deschisă chiar acum. Poți să ne ajuți oricând printr-o donație."
    />
  );
}
