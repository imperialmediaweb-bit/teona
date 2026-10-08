import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import { proiecteAfisate } from "@/date/proiecte";
import Buton from "@/componente/Buton";
import Val from "@/componente/Val";
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
        titlu="Proiecte"
        subtitlu="Taberele RESPIRO, activitățile de la Casa Teona și sprijinul pentru familiile aflate în nevoie — pe ani și pe categorii."
        poza={{
          cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
          alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură",
          legenda: "Tabăra RESPIRO",
        }}
      />

      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Proiectele noastre, pe categorii</h2>
          <ListaProiecte proiecte={proiecte} />
        </div>
      </section>

      {/* Butoanele de la final rămân neschimbate (capitolul 5). */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-h3 text-cerneala">
            Fiecare proiect a început cu cineva care a spus „da”
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
