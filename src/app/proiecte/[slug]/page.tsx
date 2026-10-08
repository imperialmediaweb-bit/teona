import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RUTE } from "@/date/asociatie";
import { proiectDupaSlug, proiecteAfisate } from "@/date/proiecte";
import { CATEGORII } from "@/date/proiecte-tipuri";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Pictograma from "@/componente/Pictograma";
import Val from "@/componente/Val";

export function generateStaticParams() {
  return proiecteAfisate().map((proiect) => ({ slug: proiect.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/proiecte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const proiect = proiectDupaSlug(slug);
  if (!proiect) return { title: "Proiect" };
  return { title: proiect.titlu };
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
  const proiect = proiectDupaSlug(slug);
  if (!proiect) notFound();

  const categorie = CATEGORII.find((c) => c.id === proiect.categorie);
  const [prima, ...restul] = proiect.poze;

  return (
    <>
      <section className="granulatie bg-tenta-cald pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            href={RUTE.proiecte}
            className="inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600 transition hover:text-caramiziu-700"
          >
            <Pictograma nume="sageata" className="size-4 rotate-180" />
            Toate proiectele
          </Link>

          <p className="mt-7 font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
            <time dateTime={proiect.data}>{proiect.dataCitita}</time>
            {categorie && <> · {categorie.eticheta}</>}
          </p>
          <h1 className="mt-2 text-h1 text-cerneala">{proiect.titlu}</h1>
        </div>
      </section>

      <Val culoare="text-hartie" />

      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {prima && (
            <figure className="colt-a relative aspect-[16/10] overflow-hidden bg-hartie-calda shadow-[0_28px_55px_-24px_rgba(247,79,34,0.5)]">
              <Image
                src={prima}
                alt={`Fotografie din proiectul „${proiect.titlu}”`}
                fill
                priority
                sizes="(min-width: 1024px) 960px, 94vw"
                className="object-cover"
              />
            </figure>
          )}

          {/* Locul descrierii. Vizibil, nu ascuns: cine deschide pagina vede
              că textul e în pregătire, nu că site-ul e gol. */}
          <p className="colt-b mt-12 bg-hartie-calda px-7 py-6 text-cerneala-moale shadow-[0_18px_38px_-24px_rgba(35,35,35,0.5)]">
            Descrierea acestui proiect se scrie împreună cu asociația. Până
            atunci, îl poți vedea în fotografii.
          </p>

          {restul.length > 0 && (
            <>
              <h2 className="mt-16 text-h2 text-cerneala">Galerie</h2>
              <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
                {restul.map((poza, i) => (
                  <li key={poza}>
                    <Aparitie intarziere={Math.min(i, 5) * 0.04}>
                      <figure
                        className={`group relative aspect-square overflow-hidden ${
                          i % 2 === 0 ? "colt-a" : "colt-b"
                        } bg-hartie-calda shadow-[0_20px_42px_-22px_rgba(35,35,35,0.45)]`}
                      >
                        <Image
                          src={poza}
                          alt={`Fotografie din proiectul „${proiect.titlu}”`}
                          fill
                          sizes="(min-width: 1024px) 320px, 46vw"
                          className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                        />
                      </figure>
                    </Aparitie>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-h3 text-cerneala">
            Astfel de zile se întâmplă pentru că cineva ajută
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează
            </Buton>
            <Buton href={RUTE.voluntar} varianta="secundar" marime="mare">
              Devino voluntar
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
