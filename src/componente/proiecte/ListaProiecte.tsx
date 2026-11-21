"use client";

import { useState } from "react";
import {
  CATEGORII,
  type IdCategorie,
  type ProiectAfisat,
} from "@/date/proiecte-tipuri";
import Decor from "../Decor";
import GrilaProiecte from "./GrilaProiecte";

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
                  ? "bg-caramiziu-700 text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)]"
                  : "border-2 border-cerneala/15 bg-hartie text-cerneala hover:border-caramiziu-400 hover:text-caramiziu-700"
              }`}
            >
              {categorie.eticheta}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-nota ${
                  activa
                    ? "bg-cerneala/15 text-hartie"
                    : "bg-hartie-umbra text-cerneala-moale"
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
            <Decor
              semn="soare"
              strokeWidth={0.8}
              className="absolute -top-10 -right-10 size-40 text-miere-300"
            />
            <Decor
              semn="stea"
              className="absolute bottom-6 left-[55%] size-8 text-caramiziu-300"
            />
            <p className="relative max-w-xl font-titlu text-h4 font-bold text-miere-900">
              Pregătim această secțiune.
            </p>
            <p className="relative mt-2 max-w-xl text-amplu text-miere-900">
              Proiectele apar aici de îndată ce strângem fotografiile și
              descrierile lor.
            </p>
          </div>
        ) : (
          <GrilaProiecte proiecte={alese} />
        )}
      </div>
    </>
  );
}
