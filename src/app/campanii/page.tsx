import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import { RUTE } from "@/date/asociatie";
import { areBazaDeDate } from "@/lib/baza";
import { textePublicate } from "@/lib/texte";
import { slugEticheta } from "@/lib/etichete";
import AntetPagina from "@/componente/pagina/AntetPagina";
import ListaScrise from "@/componente/pagina/ListaScrise";
import IndemnFinal from "@/componente/IndemnFinal";
import GrilaProiecte from "@/componente/proiecte/GrilaProiecte";
import { proiecteleToate } from "@/date/proiecte";
import { listaCuPozeDinCloud } from "@/date/proiecte-cloud";
import { arePublicate } from "@/lib/texte-vizibile";

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
export default function PaginaCampanii({
  searchParams,
}: {
  searchParams: Promise<{ eticheta?: string }>;
}) {
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
          <Suspense
            fallback={
              <p className="text-center text-amplu text-cerneala-moale">
                Se încarcă…
              </p>
            }
          >
            <Lista searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      <IndemnFinal peste butoane="doua" titlu="Orice sumă schimbă o zi" />
    </>
  );
}

async function Lista({
  searchParams,
}: {
  searchParams: Promise<{ eticheta?: string }>;
}) {
  await connection();
  const { eticheta } = await searchParams;
  const [toate, proiecte, cuNoutati] = await Promise.all([
    areBazaDeDate()
      ? textePublicate("campanie").catch(() => [])
      : Promise.resolve([]),
    proiecteleToate(),
    arePublicate("noutate"),
  ]);
  // Aceleași campanii ca fila „Campanii” de pe /proiecte: o singură sursă.
  const campanii = await listaCuPozeDinCloud(
    proiecte.filter((p) => p.categorie === "campanii"),
  );
  const cautata = eticheta ? slugEticheta(eticheta) : "";
  const texte = cautata
    ? toate.filter((t) => t.etichete.some((e) => slugEticheta(e) === cautata))
    : toate;
  const numele = cautata
    ? (toate
        .flatMap((t) => t.etichete)
        .find((e) => slugEticheta(e) === cautata) ?? cautata)
    : "";
  return (
    <>
      {cautata && (
        <p className="mb-8 flex flex-wrap items-center gap-3 text-amplu text-cerneala">
          <span>
            Cu cuvântul cheie{" "}
            <strong className="font-titlu font-bold">#{numele}</strong>
          </span>
          <Link
            href={RUTE.campanii}
            className="font-titlu text-mic font-semibold text-caramiziu-700 underline underline-offset-4"
          >
            Vezi tot
          </Link>
        </p>
      )}
      {(cautata || texte.length > 0) && (
        <ListaScrise
          texte={texte}
          cale={RUTE.campanii}
          gol="Nimic publicat cu acest cuvânt cheie."
        />
      )}
      {!cautata && campanii.length > 0 && (
        <div className={texte.length > 0 ? "mt-20" : ""}>
          {texte.length > 0 && (
            <h2 className="mb-10 text-h3 text-cerneala">
              Campaniile pe care le facem an de an
            </h2>
          )}
          <GrilaProiecte proiecte={campanii} />
        </div>
      )}
      {!cautata && texte.length === 0 && campanii.length === 0 && (
        <p className="text-amplu text-cerneala-moale">
          Nu e nicio campanie deschisă chiar acum. Poți să ne ajuți oricând
          printr-o donație.
        </p>
      )}
      {/* În meniu încape doar una dintre cele două secțiuni; legătura spre
          noutăți apare numai după primul articol publicat. */}
      {cuNoutati && (
        <p className="mt-14 text-mic text-cerneala-moale">
          <Link
            href={RUTE.noutati}
            className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-4 hover:text-caramiziu-800"
          >
            Vezi și noutățile asociației →
          </Link>
        </p>
      )}
    </>
  );
}
