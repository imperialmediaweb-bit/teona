import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, absoluta, jsonLdFir, metadate } from "@/app/seo";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import { areBazaDeDate } from "@/lib/baza";
import { textPublicat, type Text } from "@/lib/texte";
import { adresaPentruDistribuire, adresaPoza } from "@/lib/poza-urcata";
import Pictograma from "@/componente/Pictograma";
import TextScris from "@/componente/pagina/TextScris";
import Distribuie from "@/componente/pagina/Distribuie";
import IndemnFinal from "@/componente/IndemnFinal";

/**
 * Pagina unei noutăți.
 *
 * Textul vine din baza de date, scris din panou. Nu se randează ca HTML: vezi
 * `TextScris`, care construiește elemente React, ca nimic scris într-un câmp
 * să nu poată rula în pagina altcuiva.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: PageProps<"/noutati/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const text = areBazaDeDate() ? await textPublicat("noutate", slug) : null;
  if (!text)
    return { title: "Noutate", robots: { index: false, follow: false } };

  return metadate({
    titlu: text.titlu,
    descriere:
      text.rezumat || `${text.titlu} — o noutate de la ${ASOCIATIA.denumire}.`,
    cale: `${RUTE.noutati}/${text.slug}`,
    imagine: text.poza
      ? { cale: adresaPentruDistribuire(text.poza.id), alt: text.poza.alt }
      : undefined,
  });
}

export default function PaginaNoutate({
  params,
  searchParams,
}: PageProps<"/noutati/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Continut params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ params }: PageProps<"/noutati/[slug]">) {
  await connection();
  const { slug } = await params;
  const text = areBazaDeDate() ? await textPublicat("noutate", slug) : null;
  if (!text) notFound();

  return <Articol text={text} cale={RUTE.noutati} inapoi="Toate noutățile" />;
}

/** Folosit și de pagina unei campanii: aceeași formă, alt antet. */
export function Articol({
  text,
  cale,
  inapoi,
  sub,
}: {
  text: Text;
  cale: string;
  inapoi: string;
  /** Un rând în plus sub titlu — la campanii, ținta. */
  sub?: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: inapoi, cale },
          { nume: text.titlu, cale: `${cale}/${text.slug}` },
        ])}
      />

      <article className="granulatie bg-hartie-calda pt-6 pb-20 lg:pt-12 lg:pb-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href={cale}
            className="inline-flex min-h-10 items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-700 transition hover:text-caramiziu-800"
          >
            <Pictograma nume="sageata" className="size-4 rotate-180" />
            {inapoi}
          </Link>

          {text.publicatLa && (
            <p className="mt-6 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
              <time dateTime={text.publicatLa.slice(0, 10)}>
                {CAND.format(new Date(text.publicatLa))}
              </time>
            </p>
          )}

          <h1 className="mt-3 text-h1 text-cerneala">{text.titlu}</h1>

          {text.rezumat && (
            <p className="mt-5 text-amplu font-semibold text-cerneala">
              {text.rezumat}
            </p>
          )}

          {sub}

          {text.poza && (
            <figure className="mt-9 overflow-hidden colt-a bg-hartie shadow-[0_30px_64px_-30px_rgba(35,35,35,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adresaPoza(text.poza.id, 1200)}
                srcSet={`${adresaPoza(text.poza.id, 640)} 640w, ${adresaPoza(
                  text.poza.id,
                  1200,
                )} 1200w, ${adresaPoza(text.poza.id, 1800)} 1800w`}
                sizes="(min-width: 1024px) 768px, 94vw"
                alt={text.poza.alt}
                width={text.poza.latime}
                height={text.poza.inaltime}
                className="w-full"
              />
            </figure>
          )}

          <div className="mt-10">
            <TextScris continut={text.continut} />
          </div>

          <div className="mt-12 border-t border-hartie-umbra pt-7">
            <Distribuie
              adresa={absoluta(`${cale}/${text.slug}`)}
              titlu={text.titlu}
            />
          </div>
        </div>
      </article>

      <IndemnFinal peste butoane="doua" titlu="Ajută și tu" />
    </>
  );
}
