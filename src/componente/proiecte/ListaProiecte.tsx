"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CATEGORII,
  type IdCategorie,
  type ProiectAfisat,
} from "@/date/proiecte-tipuri";
import Aparitie from "../Aparitie";
import Decor from "../Decor";
import Pictograma from "../Pictograma";

/**
 * Grila de proiecte, cu categoriile cerute la capitolul 5.
 *
 * Categoriile apar în ordinea din caiet — 2026, 2025, 2021–2024, Cazuri
 * umanitare — și înlocuiesc filtrele vechi („Sprijin Autism/Down”, „Educație
 * Incluziune”…).
 *
 * Caietul cere ca prima categorie afișată să fie Proiecte 2026. Listele pentru
 * 2026 și 2025 încă nu au venit de la asociație, iar o pagină care se deschide
 * goală arată ca un site stricat exact celui care tocmai a dat clic pe
 * „Proiecte”. De aceea se deschide pe prima categorie care are proiecte, cu
 * ordinea cerută păstrată. În clipa în care intră primul proiect din 2026,
 * pagina se deschide singură acolo, fără nicio modificare de cod.
 *
 * Cardurile sunt făcute ca la „Campaniile noastre” de pe prima pagină: poza cu
 * un card de text tras peste marginea ei de jos. Primul proiect din fiecare
 * categorie ocupă jumătate de rând — o grilă de cutii egale e exact ce a
 * respins clientul.
 */

const UMBRE = [
  "shadow-[0_26px_52px_-22px_rgba(247,79,34,0.55)]",
  "shadow-[0_26px_52px_-22px_rgba(255,172,0,0.55)]",
  "shadow-[0_26px_52px_-22px_rgba(42,159,163,0.5)]",
] as const;

const PASTILE = [
  "bg-caramiziu-500 text-hartie",
  "bg-miere-400 text-cerneala",
  "bg-turcoaz-500 text-hartie",
] as const;

export default function ListaProiecte({
  proiecte,
}: {
  proiecte: ReadonlyArray<ProiectAfisat>;
}) {
  const numar = (id: IdCategorie) =>
    proiecte.filter((p) => p.categorie === id).length;

  const prima = CATEGORII.find((c) => numar(c.id) > 0)?.id ?? CATEGORII[0].id;
  const [aleasa, setAleasa] = useState<IdCategorie>(prima);

  const alese = proiecte.filter((p) => p.categorie === aleasa);

  return (
    <>
      <div
        role="tablist"
        aria-label="Categorii de proiecte"
        className="flex flex-wrap gap-2.5"
      >
        {CATEGORII.map((categorie) => {
          const activa = categorie.id === aleasa;
          const cate = numar(categorie.id);
          return (
            <button
              key={categorie.id}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls="lista-proiecte"
              onClick={() => setAleasa(categorie.id)}
              className={`inline-flex min-h-11 items-center rounded-full px-5 py-2.5 font-titlu text-mic font-bold transition-all duration-300 ease-cald ${
                activa
                  ? "bg-caramiziu-500 text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)]"
                  : "border-2 border-cerneala/15 bg-hartie text-cerneala hover:border-caramiziu-400 hover:text-caramiziu-600"
              }`}
            >
              {categorie.eticheta}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-nota ${
                  activa ? "bg-hartie/20 text-hartie" : "bg-hartie-umbra text-cerneala-moale"
                }`}
              >
                {cate}
              </span>
            </button>
          );
        })}
      </div>

      <div id="lista-proiecte" role="tabpanel" className="mt-12">
        {alese.length === 0 ? (
          <div className="granulatie relative overflow-hidden colt-a bg-miere-100 px-7 py-10 shadow-[0_24px_50px_-26px_rgba(255,172,0,0.7)] sm:px-10">
            <Decor semn="soare" strokeWidth={0.8} className="absolute -top-10 -right-10 size-40 text-miere-300" />
            <Decor semn="stea" className="absolute bottom-6 left-[55%] size-8 text-caramiziu-300" />
            <p className="relative max-w-xl font-titlu text-h4 font-bold text-miere-900">
              Pregătim această secțiune.
            </p>
            <p className="relative mt-2 max-w-xl text-amplu text-miere-900/80">
              Proiectele apar aici de îndată ce strângem fotografiile și
              descrierile lor.
            </p>
          </div>
        ) : (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
            {alese.map((proiect, i) => {
              const mare = i === 0;
              return (
                <li
                  key={proiect.slug}
                  className={mare ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3"}
                >
                  <Aparitie intarziere={Math.min(i, 5) * 0.04} className="h-full">
                    <Link
                      href={`/proiecte/${proiect.slug}`}
                      className="group flex h-full flex-col"
                    >
                      <div
                        className={`relative overflow-hidden ${
                          i % 2 === 0 ? "colt-a" : "colt-b"
                        } bg-hartie-calda transition-transform duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0 ${
                          mare
                            ? "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10]"
                            : "aspect-[4/3] lg:aspect-[4/5]"
                        } ${UMBRE[i % 3]}`}
                      >
                        {proiect.coperta ? (
                          /* Fotografia de copertă e decor: titlul proiectului e
                             chiar dedesubt, în același link, deci un text
                             alternativ ar repeta exact ce tocmai s-a citit. */
                          <Image
                            src={proiect.coperta}
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes={
                              mare
                                ? "(min-width: 1024px) 620px, 92vw"
                                : "(min-width: 1024px) 300px, (min-width: 640px) 46vw, 92vw"
                            }
                            className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                          />
                        ) : (
                          <span className="absolute inset-0 bg-miere-100">
                            <Decor semn="soare" strokeWidth={0.9} className="absolute -right-10 -bottom-10 size-48 text-miere-300" />
                            <Decor semn="stea" className="absolute top-8 left-8 size-10 text-caramiziu-300" />
                          </span>
                        )}
                        <span
                          className={`absolute top-4 left-4 rounded-full px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(35,35,35,0.5)] ${PASTILE[i % 3]}`}
                        >
                          <span className="scris text-corp leading-none">
                            <time dateTime={proiect.data}>{proiect.dataCitita}</time>
                          </span>
                        </span>
                      </div>

                      {/* Cardul de text, tras peste poză; marginile laterale
                          lasă poza vizibilă pe laturi. */}
                      <div
                        className={`relative z-10 -mt-10 mr-4 ml-4 flex flex-1 flex-col ${
                          i % 2 === 0 ? "colt-b" : "colt-a"
                        } border border-hartie-umbra bg-hartie p-5 shadow-[0_24px_48px_-26px_rgba(35,35,35,0.5)] sm:mr-6 sm:ml-6 ${
                          mare ? "lg:mr-10 lg:ml-10 lg:p-7" : ""
                        }`}
                      >
                        <h3
                          className={`flex-1 leading-snug text-cerneala transition-colors duration-300 group-hover:text-caramiziu-600 ${
                            mare ? "text-h3" : "text-h4"
                          }`}
                        >
                          {proiect.titlu}
                        </h3>
                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                          {proiect.poze.length > 0 && (
                            <span>{proiect.poze.length} fotografii</span>
                          )}
                          <span className="inline-flex items-center gap-2 text-caramiziu-600 normal-case tracking-normal">
                            Vezi proiectul
                            <Pictograma nume="sageata" className="size-4" />
                          </span>
                        </p>
                      </div>
                    </Link>
                  </Aparitie>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
