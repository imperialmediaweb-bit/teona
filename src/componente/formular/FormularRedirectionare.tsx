"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { PREFERINTE_REDIRECTIONARE } from "@/date/formulare";
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
 * „Trimite-mi pașii” pentru Formularul 230 (7).
 *
 * Pagina explică tot ce trebuie, dar cineva care o citește de pe telefon, în
 * autobuz, n-are cum să completeze nimic atunci. Formularul ăsta îi trimite
 * explicația pe e-mail, unde o găsește când se așază cu actele în față.
 *
 * Nu înlocuiește completarea online — linkul către ea e chiar în e-mail. Nu
 * cere CNP și nicio altă dată fiscală: aici se cere doar unde să trimitem
 * pașii. Datele de pe formularul propriu-zis le primește Formular230.ro,
 * care face asta ca serviciu, sau asociația, pe hârtie semnată.
 */

type Erori = Partial<Record<"nume" | "email" | "acord", string>>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit" }
  | { fel: "eroare"; mesaj: string };

export default function FormularRedirectionare() {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  function verifica(date: FormData): Erori {
    const gasite: Erori = {};
    const nume = String(date.get("nume") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();

    if (nume.length < 2) gasite.nume = "Scrie-ți numele, ca să știm cui scriem.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";
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
      const raspuns = await fetch("/api/formulare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fel: "redirectionare",
          nume: date.get("nume"),
          email: date.get("email"),
          telefon: date.get("telefon"),
          preferinta: date.get("preferinta"),
          acord: date.get("acord") === "da",
        }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj:
            corp.mesaj ?? "Nu am putut trimite e-mailul. Încearcă din nou.",
        });
        return;
      }
      setStare({ fel: "reusit" });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite e-mailul. Verifică-ți conexiunea.",
      });
    }
  }

  if (stare.fel === "reusit") {
    return (
      <div
        role="status"
        className="granulatie relative overflow-hidden colt-b bg-turcoaz-100 p-8 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.7)] sm:p-10"
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
          Gata! Ți-am trimis pașii pe e-mail.
        </p>
        <p className="relative mt-3 text-corp text-turcoaz-900/80">
          Dacă nu-l găsești în câteva minute, uită-te și în „Spam”. Orice
          întrebare, scrie-ne la{" "}
          <a
            href={`mailto:${EMAIL.redirectionare}`}
            className="font-titlu font-bold break-all underline underline-offset-4"
          >
            {EMAIL.redirectionare}
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
      className="relative overflow-hidden colt-b border border-hartie-umbra bg-hartie shadow-[0_26px_52px_-26px_rgba(42,159,163,0.45)]"
    >
      <div className="granulatie relative overflow-hidden bg-gradient-to-br from-turcoaz-400 to-turcoaz-600 px-6 py-5 text-hartie sm:px-8">
        <Decor
          semn="unda"
          strokeWidth={0.9}
          className="absolute -right-6 -bottom-8 size-28 text-hartie/20"
        />
        <p className="relative flex items-center gap-3 font-titlu text-amplu font-bold">
          <span className="flex size-10 items-center justify-center colt-mic-a bg-hartie/20">
            <Pictograma nume="plic" className="size-5" />
          </span>
          Trimite-mi pașii pe e-mail
        </p>
        <p className="relative mt-2 text-mic opacity-90">
          Ca să-i ai la îndemână când te așezi cu actele în față.
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
          name="preferinta"
          legenda="Cum vrei să completezi"
          optiuni={PREFERINTE_REDIRECTIONARE}
          defaultValue={PREFERINTE_REDIRECTIONARE[0].valoare}
          obligatoriu
        />

        <Bifa name="acord" obligatoriu eroare={erori.acord}>
          Sunt de acord ca Asociația Teona Ariana să-mi folosească numele și
          adresa de e-mail ca să-mi trimită pașii pentru Formularul 230.
        </Bifa>

        {stare.fel === "eroare" && (
          <p
            role="alert"
            className="colt-mic-a border-2 border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900"
          >
            {stare.mesaj}{" "}
            <a
              href={`mailto:${EMAIL.redirectionare}`}
              className="font-semibold break-all underline underline-offset-2"
            >
              {EMAIL.redirectionare}
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
          {stare.fel === "trimite" ? "Se trimite…" : "Trimite-mi pașii"}
          <Pictograma nume="sageata" className="size-4" />
        </button>
      </div>
    </form>
  );
}
