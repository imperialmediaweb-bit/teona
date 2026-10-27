import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import { RUTE } from "@/date/asociatie";
import { proiecteleToate } from "@/date/proiecte";
import { listaCuPozeDinCloud } from "@/date/proiecte-cloud";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import AntetPagina from "@/componente/pagina/AntetPagina";
import ListaProiecte from "@/componente/proiecte/ListaProiecte";

export const metadata: Metadata = metadate({
  titlu: "Proiecte",
  descriere:
    "Proiectele Asociației Teona Ariana Suceava, pe ani și categorii: tabere RESPIRO pentru copii cu autism și sindrom Down, Casa Teona și cazuri umanitare.",
  cale: "/proiecte",
});

export default function Proiecte() {
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Proiecte", cale: RUTE.proiecte }])} />
      {/*
        Asociația a cerut pe 27 octombrie 2026 ca aici, în prim-plan, să fie
        Respiro. Împreună — tabăra pe care o pune în față peste tot. Pozele
        vin din Cloudinary (`/cloud/<id>`), din folderul taberei, urcate de
        noi din Drive-ul lor; nu există pe disc.
      */}
      <AntetPagina
        scris="Tabere, ateliere, cazuri umanitare"
        titlu="Proiecte"
        subtitlu="Taberele RESPIRO, activitățile de la Casa Teona și sprijinul pentru familiile aflate în nevoie — pe ani și pe categorii."
        accent="miere"
        poza={{
          cale: "/cloud/475B0336_mai3jm",
          alt: "Copiii, părinții și echipa taberei Respiro. Împreună, în grup, în fața frescei de la Mănăstirea Voroneț",
          legenda: "Respiro. Împreună",
        }}
        pozaMica={{
          cale: "/cloud/475B0650_qykfno",
          alt: "Un bărbat aplecat îi strânge mâna unei fetițe cu șapcă albă, în sala taberei Respiro. Împreună",
        }}
      />

      <section className="relative overflow-hidden bg-hartie pt-4 pb-24 lg:pt-8 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-24 right-[4%] size-9 text-miere-300 lg:size-12"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-32 left-[2%] size-10 text-turcoaz-200 lg:size-14"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Proiectele noastre, pe categorii</h2>
          {/*
            Lista se citește la cerere, nu la construire.

            De când asociația poate adăuga tabere din panou, o listă generată
            o dată, la publicare, e o listă veche: tabăra adăugată marți n-ar
            fi apărut până la următoarea publicare de cod. Verificat — exact
            asta se întâmpla.
          */}
          <Suspense fallback={<Asteapta />}>
            <Lista />
          </Suspense>
        </div>
      </section>

      {/* Butoanele de la final rămân neschimbate (capitolul 5). */}
      <IndemnFinal
        peste
        butoane="doua"
        titlu="Fiecare proiect a început cu cineva care a spus „da”"
      />
    </>
  );
}

/** Locul listei cât se citește: ține înălțimea, ca pagina să nu sară. */
function Asteapta() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[60vh] animate-pulse colt-a bg-hartie-calda"
    />
  );
}

async function Lista() {
  await connection();
  // Taberele noi n-au poze pe disc: fotografiile lor stau în Cloudinary, în
  // folderul cu aceeași dată. Fără asta, cardul lor din listă ar fi gol.
  const proiecte = await listaCuPozeDinCloud(await proiecteleToate());
  return <ListaProiecte proiecte={proiecte} />;
}
