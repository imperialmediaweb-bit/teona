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

export const metadata: Metadata = metadate({
  titlu: "Noutăți",
  descriere:
    "Ce se întâmplă la Asociația Teona Ariana Suceava: tabere, Casa Teona, campanii și oamenii din spatele lor.",
  cale: RUTE.noutati,
});

/**
 * Noutățile (12.1 cere „Noutăți/Blog” în meniu).
 *
 * Textele sunt scrise de asociație din panou și stau în baza de date, nu în
 * cod: o noutate nu trebuie să treacă prin dezvoltator. De aceea pagina se
 * randează la cerere — ce s-a publicat acum un minut se vede acum.
 */
export default function PaginaNoutati({
  searchParams,
}: {
  searchParams: Promise<{ eticheta?: string }>;
}) {
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Noutăți", cale: RUTE.noutati }])} />
      <AntetPagina
        scris="De la noi"
        titlu="Noutăți"
        subtitlu="Ce s-a întâmplat în ultima vreme la asociație — tabere, ateliere, campanii și oamenii care le fac posibile."
        accent="turcoaz"
        poza={{
          cale: "/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.17.jpeg",
          alt: "Copii fac brățări din mărgele la o masă, lângă o fată în tricoul asociației, în sala cu pictura din junglă de la Casa Teona",
          legenda: "La Casa Teona",
        }}
        pozaMica={{
          cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
          alt: "O voluntară stă la masă lângă un băiețel care ține creioane colorate deasupra unui desen",
        }}
      />

      <section className="relative bg-hartie pt-4 pb-24 lg:pt-10 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Legătura dintre cele două secțiuni. În meniu încape doar una —
              zece intrări rup antetul pe un laptop de 1280 px — așa că fiecare
              trimite la cealaltă, de unde o caută cineva oricum. */}
          <p className="mb-8 text-mic text-cerneala-moale">
            <Link
              href={RUTE.campanii}
              className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-4 hover:text-caramiziu-800"
            >
              Vezi și campaniile deschise →
            </Link>
          </p>

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

      <IndemnFinal
        peste
        titlu="Lucrurile astea se întâmplă pentru că cineva ajută"
      />
    </>
  );
}

async function Lista({
  searchParams,
}: {
  searchParams: Promise<{ eticheta?: string }>;
}) {
  await connection();
  if (!areBazaDeDate()) return null;
  const { eticheta } = await searchParams;
  const toate = await textePublicate("noutate");
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
            href={RUTE.noutati}
            className="font-titlu text-mic font-semibold text-caramiziu-700 underline underline-offset-4"
          >
            Vezi tot
          </Link>
        </p>
      )}
      <ListaScrise
        texte={texte}
        cale={RUTE.noutati}
        gol={
          cautata
            ? "Nimic publicat cu acest cuvânt cheie."
            : "Încă n-am publicat nimic aici. Până atunci, ne găsești pe Facebook."
        }
      />
    </>
  );
}
