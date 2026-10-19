import type { Metadata } from "next";
import { JsonLd, jsonLdFir, jsonLdGalerie, metadate } from "@/app/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RUTE } from "@/date/asociatie";
import {
  pozeleProiectului,
  proiectDupaSlugPeste,
  proiecteAfisate,
} from "@/date/proiecte";
import { cuPozeDinCloud } from "@/date/proiecte-cloud";
import { CATEGORII } from "@/date/proiecte-tipuri";
import { adresaPublica } from "@/lib/cloud";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import Galerie from "@/componente/pagina/Galerie";

export function generateStaticParams() {
  return proiecteAfisate().map((proiect) => ({ slug: proiect.slug }));
}

/** Textul alternativ al unei fotografii din proiect: numerotat, ca niciunul să nu fie identic cu vecinul. */
function altFotografie(titlu: string, index: number, total: number) {
  return `${titlu} — fotografia ${index} din ${total}`;
}

export async function generateMetadata({
  params,
}: PageProps<"/proiecte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const gasit = await proiectDupaSlugPeste(slug);
  /*
    Un slug inexistent se oprește aici, nu în corpul paginii.

    Înainte, `notFound()` era chemat mai jos, în pagină, iar
    `/proiecte/ceva-ce-nu-exista` răspundea cu **codul 200** și pagina „Pagina
    nu a fost găsită” în corp — verificat pe producție. Cauza e randarea
    parțială: antetul răspunsului pleacă spre browser înainte ca pagina să
    ajungă la `notFound()`, iar codul nu se mai poate schimba.

    Pentru Google asta e un „soft 404”: o adresă inexistentă care se declară
    validă. Le indexează ca pagini adevărate și pune apoi la îndoială și
    restul site-ului.

    `generateMetadata` rulează înaintea antetului — e nevoie de titlu ca să se
    poată scrie `<head>` — deci de aici 404-ul chiar ajunge în răspuns.
  */
  if (!gasit) notFound();
  const proiect = await cuPozeDinCloud(gasit);

  // Fără dată: `data` e data postării în WordPress, care nu e mereu data
  // taberei (câteva proiecte au fost publicate abia în noiembrie 2024).
  // Într-un rezumat de căutare ar trece drept data evenimentului.
  const total = pozeleProiectului(proiect).length;
  const fotografii =
    total === 0 ? "" : total === 1 ? " O fotografie." : ` ${total} fotografii.`;
  return metadate({
    titlu: proiect.titlu,
    descriere: `${proiect.titlu} — proiect al Asociației Teona Ariana Suceava.${fotografii}`,
    cale: `/proiecte/${proiect.slug}`,
    // Fotografia proiectului spune mai mult decât imaginea generală a site-ului.
    imagine: proiect.coperta
      ? {
          // O poză din Cloudinary are nevoie de adresa ei completă: Facebook
          // n-o caută pe domeniul nostru.
          cale: adresaPublica(proiect.coperta),
          alt: altFotografie(proiect.titlu, 1, total),
        }
      : undefined,
  });
}

/**
 * Pagina unui proiect (capitolul 5).
 *
 * Caietul cere titlu, dată, categorie, două-trei fraze de descriere și o
 * galerie. Descrierile nu sunt încă scrise: textele vechi sunt postări de
 * Facebook importate, cu nume de familii, localități și diagnostice de copii,
 * iar caietul interzice publicarea lor. Se scriu din listele pe care le
 * pregătește asociația. Până atunci pagina arată ce avem verificat — titlu,
 * dată, categorie și fotografiile proiectului — și spune deschis ce lipsește,
 * în loc să umple locul cu text inventat.
 */
export default async function PaginaProiect({
  params,
}: PageProps<"/proiecte/[slug]">) {
  const { slug } = await params;
  const gasit = await proiectDupaSlugPeste(slug);
  if (!gasit) notFound();

  // Taberele scrise de asociație n-au poze în cod: și le iau din folderul
  // Cloudinary cu aceeași dată. Vezi `proiecte-cloud.ts`.
  const proiect = await cuPozeDinCloud(gasit);

  const categorie = CATEGORII.find((c) => c.id === proiect.categorie);
  const toatePozele = pozeleProiectului(proiect);
  const [prima, ...restul] = toatePozele;
  const total = toatePozele.length;

  return (
    <>
      <JsonLd
        date={[
          jsonLdFir([
            { nume: "Proiecte", cale: RUTE.proiecte },
            { nume: proiect.titlu, cale: `/proiecte/${proiect.slug}` },
          ]),
          /*
            Galeria, declarată pentru Google Imagini. Aici e tot conținutul
            paginii: descrierile proiectelor nu sunt scrise încă, dar pozele
            sunt reale și sunt ce caută oamenii. Un proiect fără poze nu
            declară o galerie goală.
          */
          ...(total > 0
            ? [
                jsonLdGalerie({
                  titlu: proiect.titlu,
                  cale: `/proiecte/${proiect.slug}`,
                  poze: toatePozele.map((cale, i) => ({
                    cale: adresaPublica(cale),
                    alt: altFotografie(proiect.titlu, i + 1, total),
                  })),
                }),
              ]
            : []),
        ]}
      />
      <section className="granulatie relative isolate overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-12 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span className="pata absolute -top-32 right-[-8%] size-[26rem] rounded-full bg-miere-100/70 blur-3xl" />
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-10 right-[6%] hidden size-10 text-miere-700 lg:block"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-16 left-[3%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href={RUTE.proiecte}
            className="inline-flex min-h-10 items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-700 transition hover:text-caramiziu-700"
          >
            <Pictograma nume="sageata" className="size-4 rotate-180" />
            Toate proiectele
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {/* Fără dată cunoscută, pastila lipsește: mai bine nimic decât
                o dată pusă ca să fie ceva acolo. */}
            {proiect.dataCitita && (
              <span className="colt-mic-a bg-caramiziu-700 px-4 py-1.5 text-hartie shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
                <span className="scris text-corp leading-none">
                  <time dateTime={proiect.data}>{proiect.dataCitita}</time>
                </span>
              </span>
            )}
            {categorie && (
              <span className="rounded-full border-2 border-miere-300 bg-miere-50 px-4 py-1 font-titlu text-mic font-bold text-miere-800">
                {categorie.eticheta}
              </span>
            )}
            {toatePozele.length > 0 && (
              <span className="font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                {toatePozele.length} fotografii
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-4xl text-h1 text-cerneala">
            {proiect.titlu}
          </h1>
        </div>
      </section>

      {/*
        Descrierea, acolo unde există.

        Proiectele venite din exportul WordPress n-au una: textele de acolo
        erau postări de Facebook, cu nume de familii și diagnostice de copii,
        iar caietul interzice publicarea lor. Cele scrise de asociație o au, și
        atunci pagina începe cu ce s-a întâmplat, nu cu o galerie fără context.
      */}
      {proiect.descriere && proiect.descriere.length > 0 && (
        <>
          <Val culoare="text-hartie-calda" className={VAL_PESTE} />
          <section className="relative bg-hartie-calda pt-6 pb-16 lg:pt-10 lg:pb-20">
            <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-5 text-amplu text-cerneala-moale">
                {proiect.descriere.map((paragraf) => (
                  <p key={paragraf.slice(0, 40)}>{paragraf}</p>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <Val culoare="text-hartie" className={VAL_PESTE} />

      <section className="relative bg-hartie pb-24 lg:pb-32">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {prima && (
            <figure className="relative z-20 -mt-6 sm:-mt-10 lg:-mt-16">
              <span
                aria-hidden="true"
                className="absolute -top-4 -left-3 h-[60%] w-[40%] colt-b bg-miere-200 sm:-top-5 sm:-left-5"
              />
              <div className="colt-a relative aspect-[4/3] overflow-hidden bg-hartie-calda shadow-[0_34px_70px_-30px_rgba(247,79,34,0.55)] sm:aspect-[16/10]">
                <Image
                  src={prima}
                  alt={altFotografie(proiect.titlu, 1, total)}
                  fill
                  priority
                  sizes="(min-width: 1024px) 1100px, 94vw"
                  quality={86}
                  className="object-cover"
                />
              </div>
            </figure>
          )}

          {/*
            Nicio notă pentru proiectele fără descriere.

            Aici stătea o casetă galbenă: „Descrierea acestui proiect se scrie
            împreună cu asociația". Era scrisă pentru noi, nu pentru omul care
            deschide pagina. Un donator n-are treabă cu felul în care ne
            organizăm textele; tot ce afla de acolo era că site-ul e
            neterminat. Fotografiile sunt conținutul — pagina le arată și
            tace.

            Ce rămâne de rezolvat e dincolo de pagina asta: un proiect fără
            text ȘI fără nicio fotografie n-are ce căuta public. Alea se
            completează sau se scot din listă.
          */}
        </div>
      </section>

      {restul.length > 0 && (
        <Galerie
          scris="În fotografii"
          titlu="Galerie"
          poze={restul.map((poza, i) => ({
            cale: poza,
            alt: altFotografie(proiect.titlu, i + 2, total),
          }))}
          primaMare={false}
        />
      )}

      <IndemnFinal
        peste
        butoane="doua"
        titlu="Astfel de zile se întâmplă pentru că cineva ajută"
      />
    </>
  );
}
