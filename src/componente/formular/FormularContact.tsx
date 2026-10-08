"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Camp, { claseControl, claseControlGresit } from "./Camp";

/** 10.4 — alegerile din „Sunt interesat de”, în ordinea din caiet. */
const INTERESE = [
  "Donații și sponsorizări",
  "Parteneriat pentru firme",
  "Voluntariat",
  "Casa Teona",
  "Altceva",
] as const;

type Erori = Partial<Record<"nume" | "email" | "mesaj" | "acord", string>>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit" }
  | { fel: "eroare"; mesaj: string };

/**
 * Formularul de contact (10.4).
 *
 * Validarea e scrisă de mână, nu lăsată browserului: mesajele implicite ale
 * browserului apar în limba sistemului, deci un vizitator cu Windows în
 * engleză ar fi primit „Please fill out this field” pe un site în română. Așa
 * mesajul e al nostru, în română, și stă lângă câmpul greșit.
 */
export default function FormularContact() {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  function verifica(date: FormData): Erori {
    const gasite: Erori = {};
    const nume = String(date.get("nume") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();
    const mesaj = String(date.get("mesaj") ?? "").trim();

    if (nume.length < 2) gasite.nume = "Scrie-ți numele, ca să știm cui să răspundem.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";
    if (mesaj.length < 5) gasite.mesaj = "Scrie-ne câteva cuvinte despre ce ai nevoie.";
    if (date.get("acord") !== "da")
      gasite.acord = "Bifează acordul pentru a continua.";

    return gasite;
  }

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    const gasite = verifica(date);
    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fel: "contact",
          nume: date.get("nume"),
          email: date.get("email"),
          telefon: date.get("telefon"),
          interes: date.get("interes"),
          mesaj: date.get("mesaj"),
          acord: date.get("acord") === "da",
        }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as { mesaj?: string };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut trimite mesajul. Încearcă din nou.",
        });
        return;
      }
      setStare({ fel: "reusit" });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite mesajul. Verifică-ți conexiunea.",
      });
    }
  }

  if (stare.fel === "reusit") {
    return (
      <p
        role="status"
        className="colt-a bg-turcoaz-50 px-7 py-6 font-titlu text-amplu font-semibold text-turcoaz-800 shadow-[0_18px_40px_-24px_rgba(42,159,163,0.6)]"
      >
        Mulțumim! Am primit mesajul tău și îți răspundem în curând.
      </p>
    );
  }

  return (
    <form
      onSubmit={trimite}
      noValidate
      className="colt-a grid gap-5 bg-hartie p-6 shadow-[0_20px_42px_-24px_rgba(35,35,35,0.5)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Camp id={`${id}-nume`} eticheta="Nume" obligatoriu eroare={erori.nume}>
          <input
            id={`${id}-nume`}
            name="nume"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(erori.nume)}
            aria-describedby={erori.nume ? `${id}-nume-eroare` : undefined}
            className={erori.nume ? claseControlGresit : claseControl}
          />
        </Camp>

        <Camp id={`${id}-email`} eticheta="Email" obligatoriu eroare={erori.email}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(erori.email)}
            aria-describedby={erori.email ? `${id}-email-eroare` : undefined}
            className={erori.email ? claseControlGresit : claseControl}
          />
        </Camp>

        <Camp id={`${id}-telefon`} eticheta="Telefon">
          <input
            id={`${id}-telefon`}
            name="telefon"
            type="tel"
            autoComplete="tel"
            className={claseControl}
          />
        </Camp>

        <Camp id={`${id}-interes`} eticheta="Sunt interesat de" obligatoriu>
          <select
            id={`${id}-interes`}
            name="interes"
            defaultValue={INTERESE[0]}
            className={claseControl}
          >
            {INTERESE.map((interes) => (
              <option key={interes} value={interes}>
                {interes}
              </option>
            ))}
          </select>
        </Camp>
      </div>

      <Camp id={`${id}-mesaj`} eticheta="Mesaj" obligatoriu eroare={erori.mesaj}>
        <textarea
          id={`${id}-mesaj`}
          name="mesaj"
          rows={5}
          aria-invalid={Boolean(erori.mesaj)}
          aria-describedby={erori.mesaj ? `${id}-mesaj-eroare` : undefined}
          className={`${erori.mesaj ? claseControlGresit : claseControl} resize-y`}
        />
      </Camp>

      <div>
        <label className="flex items-start gap-3 text-mic text-cerneala-moale">
          <input
            name="acord"
            value="da"
            type="checkbox"
            aria-invalid={Boolean(erori.acord)}
            className="mt-1 size-4 shrink-0 accent-caramiziu-500"
          />
          <span>
            Sunt de acord ca Asociația Teona Ariana să-mi prelucreze datele
            personale pentru a-mi răspunde la acest mesaj.{" "}
            <span className="text-caramiziu-600" aria-hidden="true">
              *
            </span>
          </span>
        </label>
        {erori.acord && (
          <p className="mt-1.5 font-titlu text-mic font-semibold text-caramiziu-700">
            {erori.acord}
          </p>
        )}
      </div>

      {stare.fel === "eroare" && (
        <p
          role="alert"
          className="colt-mic-a border-2 border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900"
        >
          {stare.mesaj}{" "}
          <a
            href={`mailto:${EMAIL.contact}`}
            className="font-semibold underline underline-offset-2"
          >
            {EMAIL.contact}
          </a>{" "}
          sau{" "}
          <a
            href={`tel:${TELEFON_PRINCIPAL.apel}`}
            className="font-semibold underline underline-offset-2"
          >
            {TELEFON_PRINCIPAL.afisat}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={stare.fel === "trimite"}
        className="inline-flex w-fit items-center justify-center rounded-full bg-caramiziu-500 px-8 py-3.5 font-titlu font-semibold text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:bg-caramiziu-600 disabled:opacity-60 motion-reduce:hover:translate-y-0"
      >
        {stare.fel === "trimite" ? "Se trimite…" : "Trimite mesajul"}
      </button>
    </form>
  );
}
