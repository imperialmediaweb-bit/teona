"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  Optiuni,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

/**
 * Numărul pe care se primesc pozele.
 *
 * E numărul public al asociației, cel de pe toate paginile. Un număr personal
 * al cuiva din echipă n-are ce căuta aici fără acordul lui scris: odată pus pe
 * site, nu se mai poate lua înapoi.
 */
const WHATSAPP = `https://wa.me/${TELEFON_PRINCIPAL.apel.replace(/\D/g, "")}`;

/**
 * Formularul 230 pe hârtie: descarcă, completează, fotografiază, trimite.
 *
 * **Site-ul nu primește poza.** Formularul de aici notează doar că ai
 * completat: numele, cum te sunăm, pe câți ani ai bifat. Poza o trimiți pe
 * WhatsApp, direct la asociație.
 *
 * De ce așa: oamenii trimit poza pe WhatsApp oricum. O a doua copie, urcată pe
 * site, n-ar scoate-o pe prima din telefon — ar însemna încă un loc în care
 * stă același CNP. Aici rămân doar date de contact, ca la orice formular.
 *
 * **Nimic din toate astea nu ține loc de hârtie**, și scrie de două ori: o
 * dată în pași, o dată după trimitere. Originalul semnat tot trebuie să ajungă
 * la asociație, altfel ANAF nu înregistrează redirecționarea.
 */

type Erori = Partial<Record<"nume" | "email" | "acord", string>>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; mesaj: string }
  | { fel: "eroare"; mesaj: string };

export default function TrimiteFormular230({
  descarcabil = true,
}: {
  /**
   * Fals cât timp Formularul 230 nu e urcat. Caietul (7.5): fără fișier,
   * butonul de descărcare rămâne inactiv — nu duce la o pagină care spune
   * că lipsește.
   */
  descarcabil?: boolean;
} = {}) {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);

    const gasite: Erori = {};
    const nume = String(date.get("nume") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();

    if (nume.length < 2) gasite.nume = "Scrie-ți numele.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";
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
        <div className="mt-5 grid gap-3">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex w-fit items-center gap-2 colt-mic-a bg-turcoaz-700 px-5 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-turcoaz-800"
          >
            Trimite poza pe WhatsApp
          </a>
          <p className="text-mic text-turcoaz-900/80">
            Sau pe e-mail, la{" "}
            <a href={`mailto:${EMAIL.contact}`} className="underline">
              {EMAIL.contact}
            </a>
            . Și trimite hârtia semnată la{" "}
            <strong>Casa Teona, Strada Zamca 22, Suceava</strong>, ori adu-o
            personal — fără ea, ANAF nu poate înregistra redirecționarea.
          </p>
        </div>
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
          "Fă-i o fotografie și trimite-ne-o pe WhatsApp, ca să verificăm că e completat bine.",
          "Trimite și hârtia semnată, în original — fără ea, ANAF nu poate înregistra redirecționarea.",
          "Spune-ne aici că ai completat, ca să știm să te așteptăm.",
        ].map((pas, i) => (
          <li key={pas} className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-caramiziu-700 font-titlu text-mic font-bold text-hartie">
              {i + 1}
            </span>
            <span>{pas}</span>
          </li>
        ))}
      </ol>

      {descarcabil ? (
        <a
          href="/formular-230"
          className="mt-6 inline-flex items-center gap-2 colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
        >
          <Pictograma nume="document" aria-hidden="true" className="size-5" />
          Descarcă formularul
        </a>
      ) : (
        <p className="mt-6 inline-flex items-center gap-2 colt-mic-a bg-hartie-umbra px-6 py-3 font-titlu font-bold text-cerneala-slab">
          <Pictograma nume="document" aria-hidden="true" className="size-5" />
          Formularul va fi disponibil aici în curând
        </p>
      )}

      <form
        onSubmit={trimite}
        noValidate
        className="mt-8 grid gap-5 border-t border-hartie-umbra pt-7"
      >
        <p className="font-titlu font-bold text-cerneala">
          Spune-ne că ai completat
        </p>
        <p className="-mt-3 text-mic text-cerneala-moale">
          Nu-ți cerem CNP-ul și nu încărca formularul aici. Poza ne-o trimiți pe{" "}
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-caramiziu-700 underline underline-offset-2"
          >
            WhatsApp
          </a>{" "}
          sau pe{" "}
          <a
            href={`mailto:${EMAIL.contact}`}
            className="font-semibold text-caramiziu-700 underline underline-offset-2"
          >
            {EMAIL.contact}
          </a>
          .
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

        {/*
          Pe câți ani a bifat.

          Formularul 230 are opțiunea de distribuire pe doi ani. Cine o
          bifează nu mai trebuie căutat la anul — iar asta schimbă complet
          lista de sunat în primăvara următoare.

          **Implicit sunt doi ani**, la cererea asociației (precizările din
          16 octombrie 2026). Un an rămâne la o apăsare distanță: cine a
          bifat altfel pe hârtie trebuie să poată spune asta, iar cifra din
          panou trebuie să fie cea de pe formularul semnat, nu cea comodă
          pentru noi.
        */}
        <Optiuni
          name="ani"
          legenda="Pe câți ani ai bifat pe formular"
          optiuni={[
            { valoare: "1", eticheta: "Un an", pictograma: "document" },
            { valoare: "2", eticheta: "Doi ani", pictograma: "infinit" },
          ]}
          defaultValue="2"
        />

        <Bifa name="acord" obligatoriu eroare={erori.acord}>
          Sunt de acord ca Asociația Teona Ariana să-mi păstreze numele și
          datele de contact ca să poată urmări redirecționarea. Știu că trebuie
          să trimit și hârtia semnată, în original.
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
            {stare.fel === "trimite"
              ? "Se trimite…"
              : "Am completat formularul"}
          </button>
        </div>
      </form>
    </div>
  );
}
