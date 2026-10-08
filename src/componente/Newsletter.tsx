"use client";

import { useId, useState } from "react";
import { EMAIL } from "@/date/asociatie";

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit" }
  | { fel: "eroare"; mesaj: string };

/**
 * Formularul de newsletter (12.4). Apare pe toate paginile, deasupra subsolului.
 *
 * Asociația nu are încă o platformă de newsletter — se alege împreună înainte de
 * lansare. Până atunci `/api/newsletter` răspunde cinstit că abonarea nu e
 * activă, iar formularul spune asta. Nu afișăm „Mulțumim!” pentru o abonare care
 * nu s-a întâmplat.
 */
export default function Newsletter() {
  const id = useId();
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    setStare({ fel: "trimite" });

    try {
      const raspuns = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: date.get("email"),
          nume: date.get("nume"),
          acord: date.get("acord") === "da",
        }),
      });
      const corp = await raspuns.json().catch(() => ({}));
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj:
            corp.mesaj ??
            "Nu am putut înregistra abonarea. Încearcă din nou mai târziu.",
        });
        return;
      }
      setStare({ fel: "reusit" });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite cererea. Verifică-ți conexiunea.",
      });
    }
  }

  return (
    <section
      aria-labelledby={`${id}-titlu`}
      className="border-t border-hartie-umbra bg-hartie-calda"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <h2 id={`${id}-titlu`} className="text-h2 text-cerneala">
            Rămâi aproape de noi
          </h2>
          <p className="mt-3 max-w-md text-cerneala-moale">
            Primești ocazional vești despre activitatea noastră.
          </p>
        </div>

        {stare.fel === "reusit" ? (
          <p
            role="status"
            className="rounded-card border border-miere-300 bg-miere-50 px-6 py-5 font-titlu font-semibold text-miere-900"
          >
            Mulțumim! Verifică-ți emailul pentru a confirma abonarea.
          </p>
        ) : (
          <form onSubmit={trimite} noValidate className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${id}-email`}
                  className="mb-1.5 block font-titlu text-mic font-semibold"
                >
                  Email <span className="text-caramiziu-600">*</span>
                </label>
                <input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-caramiziu-500"
                />
              </div>
              <div>
                <label
                  htmlFor={`${id}-nume`}
                  className="mb-1.5 block font-titlu text-mic font-semibold"
                >
                  Nume{" "}
                  <span className="font-normal text-cerneala-slab">(opțional)</span>
                </label>
                <input
                  id={`${id}-nume`}
                  name="nume"
                  type="text"
                  autoComplete="name"
                  className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-caramiziu-500"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-mic text-cerneala-moale">
              <input
                name="acord"
                value="da"
                type="checkbox"
                required
                className="mt-1 size-4 shrink-0 accent-caramiziu-500"
              />
              <span>
                Sunt de acord să primesc mesaje de la Asociația Teona Ariana. Mă pot
                dezabona oricând. <span className="text-caramiziu-600">*</span>
              </span>
            </label>

            {stare.fel === "eroare" && (
              <p
                role="alert"
                className="rounded-moale border border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900"
              >
                {stare.mesaj}{" "}
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="font-semibold underline underline-offset-2"
                >
                  {EMAIL.contact}
                </a>
              </p>
            )}

            <button
              type="submit"
              disabled={stare.fel === "trimite"}
              className="inline-flex w-fit items-center justify-center rounded-full bg-caramiziu-500 px-7 py-3 font-titlu font-semibold text-hartie shadow-[0_2px_0_0_var(--color-caramiziu-700)] transition hover:bg-caramiziu-600 disabled:opacity-60"
            >
              {stare.fel === "trimite" ? "Se trimite…" : "Abonează-mă"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
