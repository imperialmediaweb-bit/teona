import type { Metadata } from "next";
import { proiecteAfisate } from "@/date/proiecte";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import AntetPagina from "@/componente/pagina/AntetPagina";
import ListaProiecte from "@/componente/proiecte/ListaProiecte";

export const metadata: Metadata = {
  title: "Proiecte",
  description:
    "Taberele RESPIRO, activitățile de la Casa Teona și cazurile umanitare ale Asociației Teona Ariana Suceava.",
};

export default function Proiecte() {
  const proiecte = proiecteAfisate();

  return (
    <>
      <AntetPagina
        scris="Tabere, ateliere, cazuri umanitare"
        titlu="Proiecte"
        subtitlu="Taberele RESPIRO, activitățile de la Casa Teona și sprijinul pentru familiile aflate în nevoie — pe ani și pe categorii."
        accent="miere"
        poza={{
          cale: "/poze/2024/11/454844538_521713703762306_4995698762778889688_n-1.jpg",
          alt: "Copii, părinți și voluntari în tricouri albe, așezați pe iarbă între două bannere ale asociației, în fața pensiunii din tabără",
          legenda: "Tabăra RESPIRO",
        }}
        pozaMica={{
          cale: "/poze/2024/11/347598753_3647630975458046_6343055552353416081_n.jpg",
          alt: "Mâini la un atelier de pictură: o foaie cu o amprentă roșie de palmă, creioane colorate și sticluțe de tempera pe masă",
        }}
      />

      <section className="relative overflow-hidden bg-hartie pt-4 pb-24 lg:pt-8 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="stea" className="pluteste-lent absolute top-24 right-[4%] size-9 text-miere-300 lg:size-12" />
          <Decor semn="unda" className="pluteste-lent absolute bottom-32 left-[2%] size-10 text-turcoaz-200 lg:size-14" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Proiectele noastre, pe categorii</h2>
          <ListaProiecte proiecte={proiecte} />
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
