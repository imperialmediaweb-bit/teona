import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ASOCIATIA, LINKURI_EXTERNE, RUTE } from "@/date/asociatie";
import { etichetaOcaziei } from "@/date/aniversari";
import { campaniePublicata, campanieCuJeton } from "@/lib/campanii";
import { adresaPentruDistribuire, adresaPoza } from "@/lib/poza-urcata";
import { ADRESA_SITE } from "@/app/seo";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";
import Distribuie from "@/componente/pagina/Distribuie";

type Proprietati = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jeton?: string }>;
};

/**
 * Campania cerută: cea publică, sau propria campanie nepublicată, dacă cel
 * care a creat-o vine cu jetonul primit la trimitere.
 */
async function ia(proprietati: Proprietati) {
  const { slug } = await proprietati.params;
  const { jeton } = await proprietati.searchParams;
  const publica = await campaniePublicata(slug);
  if (publica) return { campanie: publica, previzualizare: false };
  if (jeton) {
    const a_mea = await campanieCuJeton(slug, jeton);
    if (a_mea) return { campanie: a_mea, previzualizare: true };
  }
  return null;
}

/**
 * Previzualizarea de pe Facebook și WhatsApp — motivul pentru care modulul
 * ăsta există. Poza omului, decupată la 1200×630, cu lățimea și înălțimea
 * declarate: fără ele, Facebook afișează uneori un dreptunghi gol până își
 * descarcă singur imaginea.
 *
 * Paginile sunt `noindex`: sunt personale și trec repede. Asta nu împiedică
 * în niciun fel distribuirea — Facebook citește `og:`, nu `robots`.
 */
export async function generateMetadata(
  proprietati: Proprietati,
): Promise<Metadata> {
  // Și metadatele se calculează la cerere: titlul și poza de previzualizare
  // vin din baza de date, deci nu pot fi pregătite dinainte.
  await connection();
  const gasita = await ia(proprietati);
  if (!gasita)
    return {
      title: "Campanie negăsită",
      robots: { index: false, follow: false },
    };

  const { campanie } = gasita;
  const descriere =
    campanie.mesaj.replace(/\s+/g, " ").slice(0, 200) +
    (campanie.mesaj.length > 200 ? "…" : "");

  const imagine = campanie.pozaId
    ? {
        url: adresaPentruDistribuire(campanie.pozaId),
        width: 1200,
        height: 630,
        alt: `${campanie.numePublic} — ${campanie.titlu}`,
      }
    : undefined;

  return {
    title: { absolute: `${campanie.titlu} · ${ASOCIATIA.denumire}` },
    description: descriere,
    robots: { index: false, follow: true },
    openGraph: {
      title: campanie.titlu,
      description: descriere,
      url: `${ADRESA_SITE}/ziua-ta/${campanie.slug}`,
      siteName: ASOCIATIA.denumire,
      locale: "ro_RO",
      type: "website",
      ...(imagine ? { images: [imagine] } : {}),
    },
    twitter: {
      card: imagine ? "summary_large_image" : "summary",
      title: campanie.titlu,
      description: descriere,
      ...(imagine ? { images: [imagine.url] } : {}),
    },
  };
}

function scrieData(zi: string): string {
  return new Date(`${zi}T12:00:00Z`).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/*
  Conținutul stă într-un `<Suspense>` pentru că `cacheComponents` cere
  fiecărei rute un înveliș care se poate pregăti dinainte, iar aici totul se
  citește din baza de date la cerere.

  Prețul, măsurat: o campanie care nu există răspunde cu **codul 200** și cu
  pagina de 404 în corp, nu cu codul 404 — învelișul pleacă spre browser
  înainte să se știe dacă există rândul. Conținutul nepublicat nu se scurge
  (fără jeton se vede tot pagina de „Campanie negăsită”), iar `/ziua-ta/` e
  `noindex` și interzis în `robots.txt`, deci niciun motor de căutare nu
  ajunge aici. Am încercat varianta fără `<Suspense>`, cu `connection()`
  prima instrucțiune și în metadate: construirea se oprește.
*/
export default function PaginaCampaniei(proprietati: Proprietati) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Continut {...proprietati} />
    </Suspense>
  );
}

async function Continut(proprietati: Proprietati) {
  await connection();
  const gasita = await ia(proprietati);
  if (!gasita) notFound();
  const { campanie, previzualizare } = gasita;

  const unde = campanie.linkGalantom ?? LINKURI_EXTERNE.galantom;
  const adresaPaginii = `${ADRESA_SITE}/ziua-ta/${campanie.slug}`;

  return (
    <>
      {previzualizare && (
        <div
          role="status"
          className="bg-cerneala px-4 py-3 text-center text-mic text-hartie"
        >
          Așa va arăta pagina ta. Momentan o vezi doar tu —{" "}
          <strong className="font-semibold text-miere-300">
            o verificăm și o publicăm în câteva ore.
          </strong>
        </div>
      )}

      <article className="relative overflow-hidden bg-hartie-calda pt-10 pb-24 lg:pt-16 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-14 left-[4%] size-8 text-miere-200 lg:size-12"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute right-[5%] bottom-24 size-9 text-turcoaz-200 lg:size-12"
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="scris text-center text-amplu text-caramiziu-600">
            {etichetaOcaziei(campanie.ocazie)}
          </p>
          <h1 className="mt-2 text-center text-h1 text-cerneala">
            {campanie.titlu}
          </h1>
          <p className="mt-4 text-center font-titlu text-amplu font-bold text-cerneala-moale">
            O campanie de {campanie.numePublic}
            {campanie.dataEvenimentului && (
              <> · {scrieData(campanie.dataEvenimentului)}</>
            )}
          </p>

          {campanie.pozaId && (
            <div className="relative mt-10 overflow-hidden colt-a border-[6px] border-hartie bg-hartie shadow-[0_34px_70px_-30px_rgba(35,35,35,0.5)]">
              <Image
                src={adresaPoza(campanie.pozaId, 1400)}
                alt={`${campanie.numePublic} — ${campanie.titlu}`}
                width={campanie.pozaLatime ?? 1400}
                height={campanie.pozaInaltime ?? 900}
                sizes="(min-width: 1024px) 896px, 92vw"
                className="h-auto w-full object-cover"
                priority
                unoptimized
              />
            </div>
          )}

          <div className="granulatie relative mt-10 colt-b border border-hartie-umbra bg-hartie p-7 shadow-[0_26px_60px_-30px_rgba(35,35,35,0.35)] sm:p-9">
            {/* Textul omului, pe rândurile lui. Nu interpretăm nimic din el:
                se afișează ca text simplu, deci nu poate aduce marcaj în
                pagină. */}
            <div className="space-y-4 text-amplu whitespace-pre-line text-cerneala-moale">
              {campanie.mesaj}
            </div>

            <div className="mt-9 border-t border-hartie-umbra pt-7">
              <Buton href={unde} marime="mare" className="w-full sm:w-auto">
                <Pictograma nume="inima" className="size-5" />
                Donează pentru campania lui {campanie.numePublic.split(" ")[0]}
              </Buton>
              <p className="mt-3 text-mic text-cerneala-moale">
                Donația se face prin Galantom, platforma folosită de{" "}
                <Link href={RUTE.acasa} className="subliniat font-semibold">
                  {ASOCIATIA.denumire}
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Distribuie adresa={adresaPaginii} titlu={campanie.titlu} />
          </div>
        </div>
      </article>
    </>
  );
}
