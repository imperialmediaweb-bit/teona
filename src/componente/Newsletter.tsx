"use client";

import { useId, useState } from "react";
import { EMAIL } from "@/date/asociatie";
import Decor from "./Decor";

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
      className="granulatie relative overflow-hidden bg-tenta-turcoaz"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Decor
          semn="stea"
          className="pluteste-lent absolute top-10 right-[8%] size-7 text-turcoaz-300 lg:size-10"
        />
        <Decor
          semn="unda"
          className="pluteste-lent absolute bottom-10 left-[4%] size-9 text-turcoaz-300 lg:size-12"
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <span className="colt-mic-a mb-5 inline-flex size-12 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_12px_26px_-12px_rgba(42,159,163,0.9)]">
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7z" />
              <path d="M4 7l8 5.5L20 7" />
            </svg>
          </span>
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
            className="colt-a bg-hartie px-7 py-6 font-titlu font-semibold text-turcoaz-800 shadow-[0_18px_40px_-24px_rgba(42,159,163,0.6)]"
          >
            Mulțumim! Verifică-ți emailul pentru a confirma abonarea.
          </p>
        ) : (
          <form
            onSubmit={trimite}
            noValidate
            className="colt-a grid gap-4 bg-hartie p-6 shadow-[0_18px_40px_-24px_rgba(42,159,163,0.6)] sm:p-8"
          >
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
                  className="colt-mic-a w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-turcoaz-400"
                />
              </div>
              <div>
                <label
                  htmlFor={`${id}-nume`}
                  className="mb-1.5 block font-titlu text-mic font-semibold"
                >
                  Nume{" "}
                  <span className="font-normal text-cerneala-slab">
                    (opțional)
                  </span>
                </label>
                <input
                  id={`${id}-nume`}
                  name="nume"
                  type="text"
                  autoComplete="name"
                  className="colt-mic-a w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-turcoaz-400"
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
                Sunt de acord să primesc mesaje de la Asociația Teona Ariana. Mă
                pot dezabona oricând.{" "}
                <span className="text-caramiziu-600">*</span>
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
              className="inline-flex w-fit items-center justify-center rounded-full bg-caramiziu-500 px-8 py-3.5 font-titlu font-semibold text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:bg-caramiziu-600 disabled:opacity-60 motion-reduce:hover:translate-y-0"
            >
              {stare.fel === "trimite" ? "Se trimite…" : "Abonează-mă"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
