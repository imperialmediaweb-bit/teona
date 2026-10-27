"use client";

import { useState } from "react";

/**
 * Formularul comunicatului: redacțiile bifate, textul, atașamentele.
 *
 * Bifate toate la deschidere — de obicei comunicatul pleacă la toată lista;
 * „Niciuna” e pentru când vrei să-l trimiți la două-trei redacții anume.
 */
export default function TrimiteComunicat({
  contacte,
  poate,
}: {
  contacte: ReadonlyArray<{
    id: string;
    publicatie: string;
    email: string;
    persoana: string | null;
  }>;
  /** Fals când trimiterea de e-mailuri nu e configurată. */
  poate: boolean;
}) {
  const [alese, setAlese] = useState<Set<string>>(
    () => new Set(contacte.map((c) => c.id)),
  );
  const toate = alese.size === contacte.length;

  const comuta = (id: string) =>
    setAlese((v) => {
      const n = new Set(v);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const camp =
    "w-full rounded-lg border border-hartie-umbra bg-hartie px-3.5 py-2.5 text-mic text-cerneala focus:border-caramiziu-600";

  return (
    <form
      action="/api/admin/presa/trimite"
      method="post"
      encType="multipart/form-data"
      className="mt-4 grid gap-5"
    >
      <fieldset className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="font-titlu text-mic font-bold text-cerneala">
            Către ({alese.size} din {contacte.length})
          </legend>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAlese(new Set(contacte.map((c) => c.id)))}
              disabled={toate}
              className="rounded-full border border-hartie-umbra px-3 py-1 font-titlu text-nota font-semibold text-cerneala hover:border-caramiziu-400 disabled:opacity-50"
            >
              Toate
            </button>
            <button
              type="button"
              onClick={() => setAlese(new Set())}
              disabled={alese.size === 0}
              className="rounded-full border border-hartie-umbra px-3 py-1 font-titlu text-nota font-semibold text-cerneala hover:border-caramiziu-400 disabled:opacity-50"
            >
              Niciuna
            </button>
          </div>
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {contacte.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-hartie-umbra px-3 py-2 has-checked:border-caramiziu-400 has-checked:bg-caramiziu-50">
                <input
                  type="checkbox"
                  name="contact"
                  value={c.id}
                  checked={alese.has(c.id)}
                  onChange={() => comuta(c.id)}
                  className="mt-0.5 size-4 shrink-0 accent-caramiziu-700"
                />
                <span className="min-w-0">
                  <span className="block font-titlu text-mic font-bold text-cerneala">
                    {c.publicatie}
                  </span>
                  <span className="block truncate text-nota text-cerneala-slab">
                    {c.persoana ? `${c.persoana} · ` : ""}
                    {c.email}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="grid gap-1.5">
        <span className="font-titlu text-mic font-bold text-cerneala">
          Subiectul
        </span>
        <input
          name="subiect"
          required
          maxLength={200}
          placeholder="Comunicat de presă: …"
          className={camp}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="font-titlu text-mic font-bold text-cerneala">
          Comunicatul
        </span>
        <span className="text-nota text-cerneala-slab">
          Un rând gol desparte paragrafele. Datele de contact ale asociației se
          pun singure la sfârșit.
        </span>
        <textarea
          name="text"
          required
          minLength={40}
          rows={12}
          className={camp}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="font-titlu text-mic font-bold text-cerneala">
          Atașamente
        </span>
        <span className="text-nota text-cerneala-slab">
          Poze sau PDF, cel mult 3 fișiere și 10 MB împreună. Pentru pozele cu
          copii trebuie acordul părinților.
        </span>
        <input
          type="file"
          name="fisier"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          className="text-mic"
        />
      </label>

      <div className="grid gap-3 border-t border-hartie-umbra pt-4">
        <label className="flex items-start gap-2.5 text-mic text-cerneala">
          <input
            type="checkbox"
            name="confirm"
            value="da"
            required
            className="mt-0.5 size-4 shrink-0 accent-caramiziu-700"
          />
          Am citit comunicatul. Fiecare redacție bifată îl primește separat, de
          la adresa asociației, iar răspunsurile vin la{" "}
          contact@teona-ariana.ro.
        </label>
        <div>
          <button
            type="submit"
            disabled={!poate || alese.size === 0}
            className="rounded-full bg-caramiziu-700 px-6 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800 disabled:cursor-not-allowed disabled:bg-cerneala-slab"
          >
            Trimite comunicatul la {alese.size}{" "}
            {alese.size === 1 ? "redacție" : "redacții"}
          </button>
        </div>
      </div>
    </form>
  );
}
