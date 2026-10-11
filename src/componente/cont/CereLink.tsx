"use client";

import { useId, useState } from "react";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Pictograma from "../Pictograma";

/**
 * Formularul prin care donatorul cere linkul de intrare.
 *
 * Nu există parolă și nu există înregistrare: contul *este* istoricul
 * donațiilor, iar cheia lui e adresa cu care a plătit.
 *
 * Mesajul de după trimitere e identic fie că adresa are donații, fie că nu.
 * Altfel formularul ar deveni un instrument prin care oricine poate afla
 * dacă o anumită persoană a donat la o asociație de copii cu dizabilități.
 * Serverul face la fel — aici doar nu stricăm ce face el.
 */

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "trimis"; mesaj: string }
  | { fel: "eroare"; mesaj: string };

export default function CereLink() {
  const id = useId();
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    const adresa = String(date.get("email") ?? "").trim();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adresa)) {
      setStare({ fel: "eroare", mesaj: "Introdu o adresă de e-mail validă." });
      return;
    }

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/cont/intrare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adresa, site_web: date.get("site_web") }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut trimite linkul. Încearcă din nou.",
        });
        return;
      }
      setStare({
        fel: "trimis",
        mesaj: corp.mesaj ?? "Dacă adresa are donații la noi, ți-am trimis un link.",
      });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite linkul. Verifică-ți conexiunea.",
      });
    }
  }

  if (stare.fel === "trimis") {
    return (
      <div
        role="status"
        className="granulatie colt-a bg-turcoaz-100 p-8 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.7)]"
      >
        <span className="flex size-14 items-center justify-center colt-mic-a bg-turcoaz-500 text-hartie">
          <Pictograma nume="plic" className="size-7" />
        </span>
        <p className="mt-5 font-titlu text-h4 font-bold text-turcoaz-900">
          {stare.mesaj}
        </p>
        <p className="mt-3 text-corp text-turcoaz-900/80">
          Linkul merge o singură dată și expiră în 20 de minute.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={trimite}
      noValidate
      className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-8"
    >
      <label
        htmlFor={`${id}-email`}
        className="mb-2 block font-titlu text-mic font-bold text-cerneala"
      >
        Adresa de e-mail cu care ai donat
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        required
        className="colt-mic-a min-h-12 w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp transition-colors outline-none focus:border-caramiziu-400 sm:max-w-md"
      />

      {/* Capcana pentru roboți: un om nu vede câmpul, deci nu-l completează. */}
      <input
        type="text"
        name="site_web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />

      {stare.fel === "eroare" && (
        <p
          role="alert"
          className="colt-mic-a mt-4 border-2 border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900"
        >
          {stare.mesaj}{" "}
          <a
            href={`mailto:${EMAIL.contact}`}
            className="font-semibold break-all underline underline-offset-2"
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
        className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-700 disabled:opacity-70"
      >
        {stare.fel === "trimite" ? "Se trimite…" : "Trimite-mi linkul"}
        <Pictograma nume="sageata" className="size-4" />
      </button>

      <p className="mt-4 max-w-md text-nota text-cerneala-slab">
        Nu-ți trebuie parolă și n-ai de făcut niciun cont. Îți trimitem un link
        pe adresa cu care ai donat.
      </p>
    </form>
  );
}
