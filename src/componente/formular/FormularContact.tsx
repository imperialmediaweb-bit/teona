"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Decor from "../Decor";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  Optiuni,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

/** 10.4 — alegerile din „Sunt interesat de”, în ordinea din caiet. */
const INTERESE = [
  {
    valoare: "Donații și sponsorizări",
    eticheta: "Donații și sponsorizări",
    pictograma: "inima",
  },
  {
    valoare: "Parteneriat pentru firme",
    eticheta: "Parteneriat pentru firme",
    pictograma: "cladire",
  },
  { valoare: "Voluntariat", eticheta: "Voluntariat", pictograma: "familie" },
  { valoare: "Casa Teona", eticheta: "Casa Teona", pictograma: "joaca" },
  { valoare: "Altceva", eticheta: "Altceva", pictograma: "comunicare" },
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

    if (nume.length < 2)
      gasite.nume = "Scrie-ți numele, ca să știm cui să răspundem.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";
    if (mesaj.length < 5)
      gasite.mesaj = "Scrie-ne câteva cuvinte despre ce ai nevoie.";
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
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
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
      <div
        role="status"
        className="granulatie relative overflow-hidden colt-a bg-turcoaz-100 p-8 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.7)] sm:p-10"
      >
        <Decor
          semn="stea"
          strokeWidth={0.8}
          className="absolute -top-8 -right-8 size-36 text-turcoaz-200"
        />
        <span className="relative flex size-14 items-center justify-center colt-mic-a bg-turcoaz-500 text-hartie shadow-[0_12px_26px_-12px_rgba(42,159,163,0.9)]">
          <svg
            viewBox="0 0 24 24"
            className="size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <p className="relative mt-5 font-titlu text-h4 font-bold text-turcoaz-900">
          Mulțumim! Am primit mesajul tău și îți răspundem în curând.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={trimite}
      noValidate
      className="relative overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_26px_52px_-26px_rgba(247,79,34,0.45)]"
    >
      {/* Capul formularului: un câmp de culoare, ca formularul să nu fie o
          cutie albă pe hârtie albă. */}
      <div className="granulatie relative overflow-hidden bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 px-6 py-5 text-hartie sm:px-8">
        <Decor
          semn="unda"
          strokeWidth={0.9}
          className="absolute -right-6 -bottom-8 size-28 text-hartie/20"
        />
        <p className="relative flex items-center gap-3 font-titlu text-amplu font-bold">
          <span className="flex size-10 items-center justify-center colt-mic-b bg-hartie/20">
            <Pictograma nume="plic" className="size-5" />
          </span>
          Trimite-ne un mesaj
        </p>
      </div>

      <div className="grid gap-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Camp
            id={`${id}-nume`}
            eticheta="Nume"
            obligatoriu
            eroare={erori.nume}
          >
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

          <Camp
            id={`${id}-email`}
            eticheta="Email"
            obligatoriu
            eroare={erori.email}
          >
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

          <Camp
            id={`${id}-telefon`}
            eticheta="Telefon"
            className="sm:col-span-2"
          >
            <input
              id={`${id}-telefon`}
              name="telefon"
              type="tel"
              autoComplete="tel"
              className={claseControl}
            />
          </Camp>
        </div>

        <Optiuni
          name="interes"
          legenda="Sunt interesat de"
          optiuni={INTERESE}
          defaultValue={INTERESE[0].valoare}
          obligatoriu
        />

        <Camp
          id={`${id}-mesaj`}
          eticheta="Mesaj"
          obligatoriu
          eroare={erori.mesaj}
        >
          <textarea
            id={`${id}-mesaj`}
            name="mesaj"
            rows={5}
            aria-invalid={Boolean(erori.mesaj)}
            aria-describedby={erori.mesaj ? `${id}-mesaj-eroare` : undefined}
            className={`${erori.mesaj ? claseControlGresit : claseControl} resize-y`}
          />
        </Camp>

        <Bifa name="acord" obligatoriu eroare={erori.acord}>
          Sunt de acord ca Asociația Teona Ariana să-mi prelucreze datele
          personale pentru a-mi răspunde la acest mesaj.
        </Bifa>

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
          className={`${claseButonTrimite} w-full sm:w-fit`}
        >
          {stare.fel === "trimite" ? "Se trimite…" : "Trimite mesajul"}
          <Pictograma nume="sageata" className="size-4" />
        </button>
      </div>
    </form>
  );
}
