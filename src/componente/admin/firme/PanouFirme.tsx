"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Pictograma from "@/componente/Pictograma";

/**
 * Panoul „Firme / Sponsori”: patru coloane, o firmă = un card. Firma stă
 * singură în coloana potrivită (vezi `coloanaFirmei`); aici numai se arată.
 * Căutarea filtrează cardurile pe loc. Pe telefon coloanele devin file: una
 * vizibilă odată, cu numărul lângă nume.
 *
 * Fără drag-and-drop, dinadins: stadiul se schimbă singur din e-mailuri și
 * contracte, iar o firmă mutată de mână ar sta în coloana greșită până la
 * următorul mesaj.
 */

export type CardFirma = {
  id: string;
  denumire: string;
  persoana: string;
  initiale: string;
  fond: string;
  coloana: "contactat" | "asteapta" | "raspuns" | "semnat" | "renuntat";
  nou: boolean;
  /** „Ei: Mulțumim, revenim… · ieri”, compus pe server (data la ora României). */
  linie: { cine: "Ei" | "Noi"; text: string; cand: string } | null;
  /** „3 trimise · 3 deschise”; gol fără e-mailuri trimise. */
  jos: string;
  /** Pe „Așteaptă răspuns”, peste 7 zile de la ultimul e-mail: „de 9 zile fără răspuns”. */
  intarziere: string | null;
  faraEmailuri: boolean;
  /** Numele, persoana, e-mailul și CUI-ul, fără diacritice, pentru căutare. */
  cheie: string;
};

type Coloana = { id: CardFirma["coloana"]; eticheta: string };

const fd = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

const ACCENT: Record<string, string> = {
  contactat: "bg-cerneala-slab",
  asteapta: "bg-sky-500",
  raspuns: "bg-miere-500",
  semnat: "bg-turcoaz-600",
};

export default function PanouFirme({
  carduri,
  coloane,
  cautaLaInceput = "",
  filaLaInceput = "contactat",
}: {
  carduri: CardFirma[];
  coloane: readonly Coloana[];
  cautaLaInceput?: string;
  filaLaInceput?: CardFirma["coloana"];
}) {
  const [cauta, setCauta] = useState(cautaLaInceput);
  const [fila, setFila] = useState<CardFirma["coloana"]>(filaLaInceput);
  const vizibile = useMemo(() => {
    const q = fd(cauta.trim()).replace(/^ro\s*/, "");
    return q ? carduri.filter((c) => c.cheie.includes(q)) : carduri;
  }, [carduri, cauta]);
  const pe = (id: string) => vizibile.filter((c) => c.coloana === id);
  const renuntate = pe("renuntat");

  return (
    <div data-panou-firme className="grid gap-4">
      <label className="relative block max-w-md">
        <Pictograma nume="lupa" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cerneala-slab" />
        <input
          type="search"
          value={cauta}
          onChange={(e) => setCauta(e.target.value)}
          placeholder="Caută după nume, persoană, e-mail sau CUI"
          aria-label="Caută firma"
          className="w-full rounded-moale border border-hartie-umbra bg-hartie py-2.5 pr-3 pl-9 text-mic"
        />
      </label>

      {/* Pe telefon: file, una vizibilă odată. */}
      <div role="tablist" aria-label="Coloanele" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden">
        {coloane.map((c) => {
          const aici = fila === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={aici}
              data-fila-telefon={c.id}
              onClick={() => setFila(c.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-titlu text-mic font-bold whitespace-nowrap ${
                aici ? "bg-cerneala text-hartie" : "border border-hartie-umbra bg-hartie text-cerneala-moale"
              }`}
            >
              {c.eticheta}
              <span className={`rounded-full px-1.5 text-nota ${aici ? "bg-hartie/20" : "bg-hartie-umbra/70 text-cerneala-slab"}`}>
                {pe(c.id).length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {coloane.map((c) => {
          const lista = pe(c.id);
          return (
            <section
              key={c.id}
              data-coloana={c.id}
              data-n={lista.length}
              aria-label={c.eticheta}
              className={`min-w-0 flex-col rounded-card bg-hartie-umbra/40 p-2 ${fila === c.id ? "flex" : "hidden"} lg:flex`}
            >
              <h2 className="flex items-center gap-2 px-2 pt-1 pb-2 font-titlu text-mic font-bold text-cerneala">
                <span aria-hidden="true" className={`size-2 rounded-full ${ACCENT[c.id]}`} />
                {c.eticheta}
                <span className="ml-auto rounded-full bg-hartie px-2 py-0.5 text-nota font-bold text-cerneala-moale">{lista.length}</span>
              </h2>
              <ul className="grid grid-cols-1 gap-2">
                {lista.map((f) => (
                  <Card key={f.id} f={f} />
                ))}
                {lista.length === 0 && (
                  <li className="rounded-moale border border-dashed border-hartie-umbra px-3 py-6 text-center text-nota text-cerneala-slab">
                    {cauta ? "Nicio firmă găsită." : "Nicio firmă aici."}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {renuntate.length > 0 && (
        <details data-renuntat className="rounded-card border border-hartie-umbra bg-hartie p-3">
          <summary className="cursor-pointer font-titlu text-mic font-bold text-cerneala-moale">Au renunțat ({renuntate.length})</summary>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {renuntate.map((f) => (
              <Card key={f.id} f={f} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Card({ f }: { f: CardFirma }) {
  return (
    <li
      data-card={f.id}
      data-discutie
      className="group relative min-w-0 rounded-moale border border-hartie-umbra bg-hartie p-3 shadow-sm transition hover:border-caramiziu-400 hover:shadow-md focus-within:border-caramiziu-400"
    >
      {/* Tot cardul e un link; „Scrie” stă deasupra lui, nu înăuntru (un link în link nu e voie). */}
      <Link href={`/admin/firme/${f.id}/mesaje#jos`} className="absolute inset-0 z-0 rounded-moale" aria-label={`Deschide discuția cu ${f.denumire}`} />
      <div className="pointer-events-none relative flex items-start gap-2.5">
        <span aria-hidden="true" className={`relative grid size-9 shrink-0 place-items-center rounded-full font-titlu text-nota font-bold ${f.fond}`}>
          {f.initiale}
          {f.nou && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-hartie bg-caramiziu-600" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={`truncate font-titlu text-mic text-cerneala ${f.nou ? "font-extrabold" : "font-bold"}`}>{f.denumire}</span>
            {f.nou && (
              <span data-nou className="shrink-0 rounded-full bg-caramiziu-600 px-1.5 text-nota leading-5 font-bold text-hartie">
                nou
              </span>
            )}
          </span>
          <span className="block truncate text-nota text-cerneala-moale">{f.persoana}</span>
        </span>
      </div>
      {f.linie ? (
        <p className="pointer-events-none relative mt-2 flex min-w-0 gap-1 text-nota text-cerneala-moale">
          <span className="min-w-0 truncate">
            <span className={`font-semibold ${f.linie.cine === "Ei" ? "text-caramiziu-800" : "text-cerneala"}`}>{f.linie.cine}:</span>{" "}
            {f.linie.text}
          </span>
          <span className="shrink-0 text-cerneala-slab">· {f.linie.cand}</span>
        </p>
      ) : (
        <p className="pointer-events-none relative mt-2 text-nota text-cerneala-slab">Niciun e-mail încă.</p>
      )}
      {f.intarziere && (
        <p data-intarziere className="pointer-events-none relative mt-1.5 inline-flex items-center gap-1 rounded-full bg-caramiziu-50 px-2 py-0.5 text-nota font-semibold text-caramiziu-900">
          <Pictograma nume="ceas" className="size-3.5" />
          {f.intarziere}
        </p>
      )}
      <div className="pointer-events-none relative mt-2 flex min-h-6 items-center gap-2">
        <span className="text-nota text-cerneala-slab">
          {f.faraEmailuri ? "nu vrea e-mailuri" : f.jos}
        </span>
        {!f.faraEmailuri && (
          <Link
            href={`/admin/firme/scrie?firma=${f.id}`}
            data-scrie
            className="pointer-events-auto z-10 ml-auto inline-flex items-center gap-1 rounded-full bg-caramiziu-700 px-2.5 py-1 font-titlu text-nota font-bold text-hartie opacity-0 transition group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Pictograma nume="plic" className="size-3.5" />
            Scrie
          </Link>
        )}
      </div>
    </li>
  );
}
