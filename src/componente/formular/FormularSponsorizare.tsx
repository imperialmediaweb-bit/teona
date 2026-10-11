"use client";

import { useId, useState } from "react";
import { CONTACT_FIRME, EMAIL } from "@/date/asociatie";
import { CAI_SPONSORIZARE } from "@/date/formulare";
import Decor from "../Decor";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  Optiuni,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

/**
 * Cererea unei firme care vrea să sponsorizeze (8).
 *
 * Până acum pagina explica cele două căi și dădea telefoanele a două
 * persoane. Un contabil care citește pagina la 11 noaptea nu sună pe nimeni
 * — iar a doua zi a uitat. Formularul cere strictul necesar ca asociația să
 * poată pregăti contractul: denumirea, CUI-ul și cine semnează.
 *
 * Suma e opțională intenționat. Firma n-o știe până nu vorbește cu
 * contabilitatea, iar un câmp obligatoriu pe care nu-l poți completa e un
 * motiv să închizi fila.
 *
 * Validarea e scrisă de mână, ca peste tot pe site: mesajele implicite ale
 * browserului apar în limba sistemului, deci cineva cu Windows în engleză ar
 * primi „Please fill out this field” pe un site în română.
 */

type Erori = Partial<
  Record<"firma" | "cui" | "persoana" | "email" | "acord", string>
>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit" }
  | { fel: "eroare"; mesaj: string };

/** Cu sau fără „RO”, cu sau fără spațiu — aceeași regulă ca pe server. */
const CUI = /^(ro)?\s?\d{2,10}$/i;

const FUNDRAISING = CONTACT_FIRME[0];

export default function FormularSponsorizare() {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  function verifica(date: FormData): Erori {
    const gasite: Erori = {};
    const firma = String(date.get("firma") ?? "").trim();
    const cui = String(date.get("cui") ?? "").trim();
    const persoana = String(date.get("persoana") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();

    if (firma.length < 2) gasite.firma = "Scrieți denumirea firmei.";
    if (!CUI.test(cui))
      gasite.cui = "Scrieți CUI-ul: doar cifrele, sau cu „RO” în față.";
    if (persoana.length < 2)
      gasite.persoana = "Scrieți numele persoanei de contact.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introduceți o adresă de e-mail validă.";
    if (date.get("acord") !== "da")
      gasite.acord = "Bifați acordul pentru a continua.";

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
      const raspuns = await fetch("/api/formulare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fel: "sponsorizare",
          firma: date.get("firma"),
          cui: date.get("cui"),
          persoana: date.get("persoana"),
          email: date.get("email"),
          telefon: date.get("telefon"),
          cale: date.get("cale"),
          suma: date.get("suma"),
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
          mesaj: corp.mesaj ?? "Nu am putut trimite cererea. Încercați din nou.",
        });
        return;
      }
      setStare({ fel: "reusit" });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite cererea. Verificați conexiunea.",
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
          <Pictograma nume="plic" className="size-7" />
        </span>
        <p className="relative mt-5 font-titlu text-h4 font-bold text-turcoaz-900">
          Mulțumim! V-am trimis pașii pe e-mail.
        </p>
        <p className="relative mt-3 text-corp text-turcoaz-900/80">
          Vă scrie {FUNDRAISING.nume} cu contractul de sponsorizare completat
          cu datele noastre. Dacă e ceva urgent, sunați la{" "}
          <a
            href={`tel:${FUNDRAISING.telefon.apel}`}
            className="font-titlu font-bold underline underline-offset-4"
          >
            {FUNDRAISING.telefon.afisat}
          </a>
          .
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
      <div className="granulatie relative overflow-hidden bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 px-6 py-5 text-hartie sm:px-8">
        <Decor
          semn="unda"
          strokeWidth={0.9}
          className="absolute -right-6 -bottom-8 size-28 text-hartie/20"
        />
        <p className="relative flex items-center gap-3 font-titlu text-amplu font-bold">
          <span className="flex size-10 items-center justify-center colt-mic-b bg-hartie/20">
            <Pictograma nume="cladire" className="size-5" />
          </span>
          Vreau să sponsorizez
        </p>
        <p className="relative mt-2 text-mic opacity-90">
          Completați atât — vă trimitem pașii pe e-mail și vă pregătim
          contractul.
        </p>
      </div>

      <div className="grid gap-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Camp
            id={`${id}-firma`}
            eticheta="Denumirea firmei"
            obligatoriu
            eroare={erori.firma}
          >
            <input
              id={`${id}-firma`}
              name="firma"
              type="text"
              autoComplete="organization"
              aria-invalid={Boolean(erori.firma)}
              aria-describedby={erori.firma ? `${id}-firma-eroare` : undefined}
              className={erori.firma ? claseControlGresit : claseControl}
            />
          </Camp>

          <Camp id={`${id}-cui`} eticheta="CUI" obligatoriu eroare={erori.cui}>
            <input
              id={`${id}-cui`}
              name="cui"
              type="text"
              inputMode="numeric"
              placeholder="RO12345678"
              aria-invalid={Boolean(erori.cui)}
              aria-describedby={erori.cui ? `${id}-cui-eroare` : undefined}
              className={erori.cui ? claseControlGresit : claseControl}
            />
          </Camp>

          <Camp
            id={`${id}-persoana`}
            eticheta="Persoană de contact"
            obligatoriu
            eroare={erori.persoana}
          >
            <input
              id={`${id}-persoana`}
              name="persoana"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(erori.persoana)}
              aria-describedby={
                erori.persoana ? `${id}-persoana-eroare` : undefined
              }
              className={erori.persoana ? claseControlGresit : claseControl}
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

          <Camp id={`${id}-suma`} eticheta="Suma estimată">
            <input
              id={`${id}-suma`}
              name="suma"
              type="text"
              inputMode="numeric"
              placeholder="Dacă o știți deja"
              className={claseControl}
            />
          </Camp>
        </div>

        <Optiuni
          name="cale"
          legenda="Cum vreți să direcționați"
          optiuni={CAI_SPONSORIZARE}
          defaultValue={CAI_SPONSORIZARE[0].valoare}
          obligatoriu
          coloane={3}
          nota="Dacă nu sunteți siguri, alegeți „Nu știu încă” — stabilim împreună cu contabilitatea dumneavoastră."
        />

        <Camp id={`${id}-mesaj`} eticheta="Mesaj">
          <textarea
            id={`${id}-mesaj`}
            name="mesaj"
            rows={4}
            className={`${claseControl} resize-y`}
          />
        </Camp>

        <Bifa name="acord" obligatoriu eroare={erori.acord}>
          Sunt de acord ca Asociația Teona Ariana să prelucreze aceste date
          pentru a pregăti sponsorizarea și a ne contacta.
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
              href={`tel:${FUNDRAISING.telefon.apel}`}
              className="font-semibold underline underline-offset-2"
            >
              {FUNDRAISING.telefon.afisat}
            </a>
            .
          </p>
        )}

        <button
          type="submit"
          disabled={stare.fel === "trimite"}
          className={`${claseButonTrimite} w-full sm:w-fit`}
        >
          {stare.fel === "trimite" ? "Se trimite…" : "Trimite cererea"}
          <Pictograma nume="sageata" className="size-4" />
        </button>
      </div>
    </form>
  );
}
