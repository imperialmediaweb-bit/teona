import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { metadate } from "@/app/seo";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import { areBazaDeDate } from "@/lib/baza";
import { textSimplu } from "@/lib/text-bogat";
import { textPublicat } from "@/lib/texte";
import { adresaPentruDistribuire } from "@/lib/poza-urcata";
import { scrieSuma } from "@/lib/suma";
import { Articol } from "@/app/noutati/[slug]/page";
import { pozeDinDosarScris } from "@/date/proiecte-cloud";

/**
 * Pagina unei campanii a asociației.
 *
 * Aceeași formă ca o noutate — de aceea refolosește `Articol` — plus două
 * lucruri: ținta, dacă s-a anunțat una, și un buton de donație care duce la
 * formular cu campania deja aleasă, ca banii să poată fi numărați separat.
 */

export async function generateMetadata({
  params,
}: PageProps<"/campanii/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const text = areBazaDeDate() ? await textPublicat("campanie", slug) : null;
  if (!text)
    return { title: "Campanie", robots: { index: false, follow: false } };

  const meta = metadate({
    titlu: text.titlu,
    descriere:
      text.rezumat ||
      textSimplu(text.continut)[0] ||
      `${text.titlu} — campanie a ${ASOCIATIA.denumire}.`,
    cale: `${RUTE.campanii}/${text.slug}`,
    imagine: text.poza
      ? { cale: adresaPentruDistribuire(text.poza.id), alt: text.poza.alt }
      : undefined,
  });
  return text.etichete.length ? { ...meta, keywords: text.etichete } : meta;
}
export default function PaginaCampanie({
  params,
  searchParams,
}: PageProps<"/campanii/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Continut params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ params }: PageProps<"/campanii/[slug]">) {
  await connection();
  const { slug } = await params;
  const text = areBazaDeDate() ? await textPublicat("campanie", slug) : null;
  if (!text) notFound();
  const poze = text.dosarCloud ? await pozeDinDosarScris(text.dosarCloud) : [];

  return (
    <Articol
      poze={poze}
      text={text}
      cale={RUTE.campanii}
      inapoi="Toate campaniile"
      sub={
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href={`${RUTE.doneaza}?campanie=${encodeURIComponent(text.slug)}`}
            className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie shadow-[0_14px_30px_-14px_rgba(247,79,34,0.9)] transition-colors hover:bg-caramiziu-800"
          >
            Donează pentru campania asta
          </Link>
          {text.tintaBani !== null && (
            <p className="font-titlu text-corp font-bold text-cerneala">
              Ținta: {scrieSuma(text.tintaBani / 100)}
            </p>
          )}
        </div>
      }
    />
  );
}
