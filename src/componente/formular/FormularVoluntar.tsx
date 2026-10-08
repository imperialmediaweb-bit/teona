"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Camp, { claseControl, claseControlGresit } from "./Camp";

type Erori = Partial<
  Record<"nume" | "email" | "nastere" | "acord", string>
>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; prenume: string }
  | { fel: "eroare"; mesaj: string };

/**
 * Vârsta împlinită la data de azi, calculată din data nașterii.
 *
 * Nu împărțim diferența de milisecunde la durata unui an: anii bisecți și
 * schimbările de oră fac rezultatul să greșească cu o zi exact în jurul zilei
 * de naștere — adică exact unde contează. Comparăm luna și ziua.
 */
function varsta(nastere: Date, azi: Date): number {
  let ani = azi.getFullYear() - nastere.getFullYear();
  const inainteDeZi =
    azi.getMonth() < nastere.getMonth() ||
    (azi.getMonth() === nastere.getMonth() && azi.getDate() < nastere.getDate());
  if (inainteDeZi) ani -= 1;
  return ani;
}

/**
 * Formularul de voluntariat (11.4).
 *
 * Verificarea vârstei se face în browser, înainte de trimitere, așa cum cere
 * caietul: „Dacă data nașterii arată sub 18 ani, formularul nu se trimite și
 * apare mesajul de mai jos.” Mesajul e cel scris de asociație, cuvânt cu
 * cuvânt — e un refuz care trebuie să sune a bun venit, nu a eroare.
 */
export default function FormularVoluntar() {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    const gasite: Erori = {};

    const nume = String(date.get("nume") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();
    const nastere = String(date.get("nastere") ?? "");

    if (nume.length < 3)
      gasite.nume = "Scrie-ți numele și prenumele.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";

    if (!nastere) {
      gasite.nastere = "Completează data nașterii.";
    } else {
      const data = new Date(`${nastere}T00:00:00`);
      if (Number.isNaN(data.getTime())) {
        gasite.nastere = "Completează o dată validă.";
      } else if (varsta(data, new Date()) < 18) {
        gasite.nastere =
          "Ne bucurăm că vrei să te implici! Deocamdată putem primi voluntari doar de la 18 ani.";
      }
    }

    if (date.get("acord") !== "da")
      gasite.acord = "Bifează acordul pentru a continua.";

    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fel: "voluntariat",
          nume,
          email,
          telefon: date.get("telefon"),
          nastere,
          experienta: date.get("experienta"),
          disponibilitate: date.get("disponibilitate"),
          motiv: date.get("motiv"),
          acord: true,
        }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as { mesaj?: string };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut trimite formularul. Încearcă din nou.",
        });
        return;
      }
      setStare({ fel: "reusit", prenume: nume.split(" ")[0] });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite formularul. Verifică-ți conexiunea.",
      });
    }
  }

  if (stare.fel === "reusit") {
    return (
      <p
        role="status"
        className="colt-a bg-turcoaz-50 px-7 py-6 font-titlu text-amplu font-semibold text-turcoaz-800 shadow-[0_18px_40px_-24px_rgba(42,159,163,0.6)]"
      >
        Mulțumim, {stare.prenume}! Am primit formularul tău. Te contactăm în
        curând.
      </p>
    );
  }

  return (
    <form
      onSubmit={trimite}
      noValidate
      id="formular"
      className="colt-a grid scroll-mt-32 gap-5 bg-hartie p-6 shadow-[0_20px_42px_-24px_rgba(35,35,35,0.5)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Camp
          id={`${id}-nume`}
          eticheta="Nume și prenume"
          obligatoriu
          eroare={erori.nume}
          className="sm:col-span-2"
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

        <Camp
          id={`${id}-nastere`}
          eticheta="Data nașterii"
          obligatoriu
          nota="Folosim data nașterii pentru a verifica vârsta minimă."
          eroare={erori.nastere}
        >
          <input
            id={`${id}-nastere`}
            name="nastere"
            type="date"
            autoComplete="bday"
            aria-invalid={Boolean(erori.nastere)}
            aria-describedby={
              erori.nastere ? `${id}-nastere-eroare` : `${id}-nastere-nota`
            }
            className={erori.nastere ? claseControlGresit : claseControl}
          />
        </Camp>

        <Camp id={`${id}-experienta`} eticheta="Ai mai făcut voluntariat înainte?" obligatoriu>
          <select
            id={`${id}-experienta`}
            name="experienta"
            defaultValue="Nu"
            className={claseControl}
          >
            <option value="Da">Da</option>
            <option value="Nu">Nu</option>
          </select>
        </Camp>

        <Camp
          id={`${id}-disponibilitate`}
          eticheta="Cât timp poți dedica?"
          obligatoriu
          className="sm:col-span-2"
        >
          <select
            id={`${id}-disponibilitate`}
            name="disponibilitate"
            defaultValue="Ocazional"
            className={claseControl}
          >
            <option value="Zilnic">Zilnic</option>
            <option value="Săptămânal">Săptămânal</option>
            <option value="Ocazional">Ocazional</option>
          </select>
        </Camp>
      </div>

      <Camp id={`${id}-motiv`} eticheta="De ce vrei să devii voluntar?">
        <textarea
          id={`${id}-motiv`}
          name="motiv"
          rows={4}
          className={`${claseControl} resize-y`}
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
            personale pentru a mă contacta în legătură cu activitatea de
            voluntariat.{" "}
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
        {stare.fel === "trimite" ? "Se trimite…" : "Trimite"}
      </button>
    </form>
  );
}
