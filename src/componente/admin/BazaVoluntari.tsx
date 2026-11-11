"use client";

import Adresa from "./Adresa";
import { useState } from "react";

/**
 * Lista de voluntari cu bife, și apelul „avem nevoie de oameni pe data X".
 *
 * Bifele aleg cui pleacă apelul. Sunt bifați din start toți cei din lista
 * filtrată: filtrul de sus *e* alegerea („cine are permis, din Suceava"), iar
 * „Niciunul" e pentru când vrei să întrebi doi-trei oameni anume.
 */

export type VoluntarInLista = {
  id: string;
  nume: string;
  email: string;
  telefon: string | null;
  localitate: string;
  disponibilitate: string;
  permis: boolean;
  copii: boolean;
  limbi: string;
  varsta: number | null;
  contact: "Telefon" | "WhatsApp" | "E-mail" | null;
  stadiu: string;
  creatLa: string;
  linkTel: string | null;
  linkWhatsApp: string | null;
  raspunsuri: Array<{ titlu: string; cand: string; raspuns: "pot" | "nu-pot" | null }>;
};

const CAMP =
  "w-full rounded-lg border border-hartie-umbra bg-hartie px-3.5 py-2.5 text-mic text-cerneala focus:border-caramiziu-600";
const BUTON_MIC =
  "inline-flex min-h-9 items-center rounded-full border px-3 font-titlu text-nota font-bold transition-colors";

function Actiune({
  href,
  eticheta,
  preferat,
}: {
  href: string | null;
  eticheta: string;
  preferat: boolean;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`${BUTON_MIC} ${
        preferat
          ? "border-caramiziu-700 bg-caramiziu-700 text-hartie hover:bg-caramiziu-600"
          : "border-hartie-umbra text-cerneala hover:border-caramiziu-400"
      }`}
    >
      {eticheta.includes("@") ? <Adresa>{eticheta}</Adresa> : eticheta}
      {preferat && <span className="sr-only"> (cum preferă)</span>}
    </a>
  );
}

export default function BazaVoluntari({
  voluntari,
  areEmail,
}: {
  voluntari: VoluntarInLista[];
  areEmail: boolean;
}) {
  const [alesi, setAlesi] = useState<Set<string>>(() => new Set(voluntari.map((v) => v.id)));

  function comuta(id: string) {
    setAlesi((x) => {
      const nou = new Set(x);
      if (nou.has(id)) nou.delete(id);
      else nou.add(id);
      return nou;
    });
  }

  return (
    <form action="/api/admin/voluntari/apel" method="post" className="grid gap-6">
      <details className="colt-a border border-hartie-umbra bg-hartie p-5" open={false}>
        <summary className="cursor-pointer font-titlu text-amplu font-bold text-cerneala">
          Cere ajutor: „Avem nevoie de voluntari pe data…”
        </summary>
        <p className="mt-2 max-w-2xl text-mic text-cerneala-moale">
          Pleacă la voluntarii bifați mai jos ({alesi.size}). Fiecare primește
          e-mailul lui, cu „Da, pot veni” și „Nu pot”. Răspunsurile apar la
          „Apelurile trimise” și la fiecare om. Pentru cei care preferă
          WhatsApp, după trimitere ai lângă fiecare un link cu textul gata
          scris.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="font-titlu text-nota font-bold">Pentru ce</span>
            <input name="titlu" required maxLength={120} placeholder="Tabăra de autism" className={CAMP} />
          </label>
          <label className="grid gap-1">
            <span className="font-titlu text-nota font-bold">Când</span>
            <input name="cand" required maxLength={120} placeholder="sâmbătă, 15 noiembrie, 10:00–14:00" className={CAMP} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="font-titlu text-nota font-bold">
              Unde <span className="font-normal text-cerneala-slab">— dacă nu e Casa Teona, scrie adresa</span>
            </span>
            <input name="unde" maxLength={160} placeholder="Casa Teona, Strada Zamca 22" className={CAMP} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="font-titlu text-nota font-bold">Ce vor face</span>
            <textarea
              name="mesaj"
              required
              rows={4}
              maxLength={4000}
              placeholder="Avem nevoie de patru oameni care să stea cu copiii la ateliere."
              className={CAMP}
            />
          </label>
        </div>
        <label className="mt-3 flex items-start gap-2.5 text-mic">
          <input type="checkbox" name="pe_email" value="da" defaultChecked={areEmail} disabled={!areEmail} className="mt-1" />
          <span>
            Trimite-le și pe e-mail
            {!areEmail && " (trimiterea de e-mailuri nu e configurată)"}
          </span>
        </label>
        <button
          type="submit"
          disabled={alesi.size === 0}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie hover:bg-caramiziu-600 disabled:opacity-50"
        >
          Trimite apelul la {alesi.size} {alesi.size === 1 ? "voluntar" : "voluntari"}
        </button>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-titlu text-mic font-bold text-cerneala">
          {voluntari.length} {voluntari.length === 1 ? "voluntar" : "voluntari"} · bifați {alesi.size}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAlesi(new Set(voluntari.map((v) => v.id)))}
            className={`${BUTON_MIC} border-hartie-umbra text-cerneala hover:border-caramiziu-400`}
          >
            Toți
          </button>
          <button
            type="button"
            onClick={() => setAlesi(new Set())}
            className={`${BUTON_MIC} border-hartie-umbra text-cerneala hover:border-caramiziu-400`}
          >
            Niciunul
          </button>
        </div>
      </div>

      <ul className="grid gap-3">
        {voluntari.map((v) => (
          <li key={v.id} className="colt-a border border-hartie-umbra bg-hartie p-4 sm:p-5">
            <div className="flex flex-wrap items-start gap-3">
              <input
                type="checkbox"
                name="voluntar"
                value={v.id}
                checked={alesi.has(v.id)}
                onChange={() => comuta(v.id)}
                aria-label={`Întreabă-l pe ${v.nume}`}
                className="mt-1.5 size-4"
              />
              <div className="min-w-0 flex-1">
                <p className="font-titlu text-amplu font-bold text-cerneala">
                  {v.nume}
                  {v.varsta !== null && (
                    <span className="ml-2 font-normal text-mic text-cerneala-slab">
                      {v.varsta} ani{v.varsta < 18 ? " · minor" : ""}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-mic text-cerneala-moale">
                  {[
                    v.localitate,
                    v.disponibilitate,
                    v.permis ? "are permis" : "",
                    v.copii ? "experiență cu copii" : "",
                    v.limbi ? `limbi: ${v.limbi}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Actiune href={v.linkTel} eticheta={`Sună ${v.telefon ?? ""}`} preferat={v.contact === "Telefon"} />
                  <Actiune href={v.linkWhatsApp} eticheta="WhatsApp" preferat={v.contact === "WhatsApp"} />
                  <Actiune href={v.email ? `mailto:${v.email}` : null} eticheta={v.email} preferat={v.contact === "E-mail"} />
                  {v.contact && (
                    <span className="text-nota text-cerneala-slab">preferă {v.contact}</span>
                  )}
                </div>
                {v.raspunsuri.length > 0 && (
                  <ul className="mt-3 grid gap-1 text-nota">
                    {v.raspunsuri.map((r, i) => (
                      <li key={i} className="text-cerneala-moale">
                        <span
                          className={`mr-2 rounded-full px-2 py-0.5 font-titlu font-bold ${
                            r.raspuns === "pot"
                              ? "bg-turcoaz-50 text-turcoaz-900"
                              : r.raspuns === "nu-pot"
                                ? "bg-hartie-umbra text-cerneala"
                                : "bg-miere-50 text-cerneala"
                          }`}
                        >
                          {r.raspuns === "pot" ? "poate" : r.raspuns === "nu-pot" ? "nu poate" : "n-a răspuns"}
                        </span>
                        {r.titlu} · {r.cand}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </form>
  );
}
