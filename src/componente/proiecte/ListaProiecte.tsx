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
 */
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
              className={`rounded-full px-5 py-2.5 font-titlu text-mic font-semibold transition-all duration-300 ease-cald ${
                activa
                  ? "bg-caramiziu-500 text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)]"
                  : "border-2 border-cerneala/15 bg-hartie text-cerneala hover:border-caramiziu-400 hover:text-caramiziu-600"
              }`}
            >
              {categorie.eticheta}
              <span
                className={`ml-2 text-nota ${activa ? "text-hartie/75" : "text-cerneala-slab"}`}
              >
                {cate}
              </span>
            </button>
          );
        })}
      </div>

      <div id="lista-proiecte" role="tabpanel" className="mt-12">
        {alese.length === 0 ? (
          <p className="colt-a bg-hartie-calda px-7 py-8 text-amplu text-cerneala-moale shadow-[0_18px_38px_-24px_rgba(35,35,35,0.5)]">
            Pregătim această secțiune. Proiectele apar aici de îndată ce
            strângem fotografiile și descrierile lor.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {alese.map((proiect, i) => (
              <li key={proiect.slug}>
                <Aparitie intarziere={Math.min(i, 5) * 0.04} className="h-full">
                  <Link
                    href={`/proiecte/${proiect.slug}`}
                    className="group flex h-full flex-col"
                  >
                    <div
                      className={`relative aspect-[4/3] overflow-hidden ${
                        i % 2 === 0 ? "colt-a" : "colt-b"
                      } bg-hartie-calda shadow-[0_20px_42px_-22px_rgba(247,79,34,0.5)] transition-transform duration-500 ease-cald group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0`}
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
                          sizes="(min-width: 1024px) 380px, 92vw"
                          className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center bg-gradient-to-br from-caramiziu-400 to-caramiziu-600" />
                      )}
                    </div>

                    <p className="mt-7 font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                      <time dateTime={proiect.data}>{proiect.dataCitita}</time>
                      {proiect.poze.length > 0 && (
                        <> · {proiect.poze.length} fotografii</>
                      )}
                    </p>
                    <h3 className="mt-1.5 flex-1 text-h4 leading-snug text-cerneala transition-colors duration-300 group-hover:text-caramiziu-600">
                      {proiect.titlu}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600">
                      Vezi proiectul
                      <Pictograma nume="sageata" className="size-4" />
                    </span>
                  </Link>
                </Aparitie>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
