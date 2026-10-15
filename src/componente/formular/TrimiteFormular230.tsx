"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

/**
 * Formularul 230 pe hârtie: descarcă, completează, fotografiază, trimite.
 *
 * **Fotografia nu ține loc de hârtie, și scrie asta de două ori** — o dată
 * înainte de a trimite, o dată după. Originalul semnat tot trebuie să ajungă
 * la asociație; ANAF îl poate cere. Cine crede că a terminat când a apăsat
 * trimite, n-a terminat, iar redirecționarea lui s-ar pierde.
 *
 * **De ce merită totuși.** Asociația vede din ziua aceea cine redirecționează,
 * poate pregăti situația centralizatoare și știe pe cine să sune după plic.
 * Fără asta, află abia când deschide plicurile, în mai.
 *
 * Fișierul pleacă într-un depozit privat, nu pe o rețea publică de imagini: pe
 * un 230 scrie nume, adresă, CNP și o semnătură.
 */

type Erori = Partial<Record<"nume" | "email" | "fisier" | "acord", string>>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; mesaj: string }
  | { fel: "eroare"; mesaj: string };

export default function TrimiteFormular230() {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);

    const gasite: Erori = {};
    const nume = String(date.get("nume") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();
    const fisier = date.get("fisier");

    if (nume.length < 2) gasite.nume = "Scrie-ți numele.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";
    if (!(fisier instanceof File) || fisier.size === 0)
      gasite.fisier = "Alege fotografia sau PDF-ul formularului completat.";
    if (date.get("acord") !== "da")
      gasite.acord = "Bifează acordul pentru a putea trimite.";

    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/formulare-230", {
        method: "POST",
        body: date,
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut trimite formularul.",
        });
        return;
      }
      setStare({
        fel: "reusit",
        mesaj: corp.mesaj ?? "Am primit formularul.",
      });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite formularul. Verifică-ți conexiunea.",
      });
    }
  }

  if (stare.fel === "reusit") {
    return (
      <div
        role="status"
        className="colt-a border border-turcoaz-200 bg-turcoaz-50 p-7"
      >
        <p className="flex items-start gap-3 text-amplu text-turcoaz-900">
          <Pictograma
            nume="inima"
            aria-hidden="true"
            className="mt-1 size-6 shrink-0"
          />
          <span>{stare.mesaj}</span>
        </p>
        <p className="mt-4 text-mic text-turcoaz-900/80">
          Trimite hârtia la <strong>Casa Teona, Strada Zamca 22, Suceava</strong>,
          sau adu-o personal. Dacă ai întrebări: {TELEFON_PRINCIPAL.afisat} ·{" "}
          {EMAIL.contact}
        </p>
      </div>
    );
  }

  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-6 sm:p-8">
      <h3 className="text-h4 text-cerneala">Completezi pe hârtie</h3>

      <ol className="mt-5 grid gap-3 text-corp text-cerneala-moale">
        {[
          "Descarcă formularul — datele asociației sunt deja completate.",
          "Completează-ți datele tale și semnează-l.",
          "Fă-i o fotografie clară și trimite-ne-o aici.",
          "Trimite și hârtia semnată, în original — fără ea, ANAF nu poate înregistra redirecționarea.",
        ].map((pas, i) => (
          <li key={pas} className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-caramiziu-700 font-titlu text-mic font-bold text-hartie">
              {i + 1}
            </span>
            <span>{pas}</span>
          </li>
        ))}
      </ol>

      <a
        href="/formular-230"
        className="mt-6 inline-flex items-center gap-2 colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
      >
        <Pictograma nume="document" aria-hidden="true" className="size-5" />
        Descarcă formularul
      </a>

      <form
        onSubmit={trimite}
        noValidate
        className="mt-8 grid gap-5 border-t border-hartie-umbra pt-7"
      >
        <p className="font-titlu font-bold text-cerneala">
          Trimite-ne fotografia formularului completat
        </p>

        {/* Capcana pentru roboți: un om nu vede câmpul ăsta. */}
        <input
          type="text"
          name="site_web"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-px"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Camp
            id={`${id}-nume`}
            eticheta="Numele tău"
            obligatoriu
            eroare={erori.nume}
          >
            <input
              id={`${id}-nume`}
              name="nume"
              autoComplete="name"
              className={erori.nume ? claseControlGresit : claseControl}
            />
          </Camp>

          <Camp
            id={`${id}-email`}
            eticheta="E-mail"
            obligatoriu
            eroare={erori.email}
          >
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              className={erori.email ? claseControlGresit : claseControl}
            />
          </Camp>
        </div>

        <Camp id={`${id}-telefon`} eticheta="Telefon" nota="Opțional.">
          <input
            id={`${id}-telefon`}
            name="telefon"
            type="tel"
            autoComplete="tel"
            className={claseControl}
          />
        </Camp>

        <Camp
          id={`${id}-fisier`}
          eticheta="Fotografia sau PDF-ul formularului"
          obligatoriu
          nota="JPG, PNG, WebP sau PDF, până la 8 MB."
          eroare={erori.fisier}
        >
          <input
            id={`${id}-fisier`}
            name="fisier"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="w-full text-corp text-cerneala-moale"
          />
        </Camp>

        <Bifa name="acord" obligatoriu eroare={erori.acord}>
          Sunt de acord ca Asociația Teona Ariana să păstreze formularul meu
          completat ca să poată depune redirecționarea. Știu că pe el apare
          CNP-ul meu și că trebuie să trimit și hârtia semnată, în original.
        </Bifa>

        {stare.fel === "eroare" && (
          <p
            role="alert"
            className="colt-mic-a border border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
          >
            {stare.mesaj}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={stare.fel === "trimite"}
            className={claseButonTrimite}
          >
            {stare.fel === "trimite" ? "Se trimite…" : "Trimite formularul"}
          </button>
        </div>
      </form>
    </div>
  );
}
