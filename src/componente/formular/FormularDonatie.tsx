"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  DESTINATII_DONATIE,
  EMAIL,
  LINKURI_EXTERNE,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import Camp, { claseControl, claseControlGresit } from "./Camp";

const SUME = [20, 50, 100] as const;

type Erori = Partial<Record<"suma" | "email" | "acord", string>>;

/**
 * Formularul de donație cu cardul (2.2).
 *
 * Câmpurile, ordinea, valorile implicite și textele de eroare sunt exact cele
 * din caietul de sarcini. „Lunar” e preselectat, „Oriunde e nevoie” e
 * destinația implicită, iar butonul își scrie suma în el.
 *
 * Plata nu e conectată: caietul lasă deschisă decizia între a rescrie plățile
 * peste Stripe aici sau a trimite mai departe la platforma existentă. Până
 * când asociația alege, formularul nu se preface că încasează. La trimitere
 * spune cinstit asta și arată căile prin care se poate dona **chiar acum**:
 * Galantom, SMS și transfer bancar. Un donator care a ajuns până la butonul
 * de donație nu trebuie lăsat în gol.
 */
export default function FormularDonatie({
  destinatieInitiala = "oriunde",
}: {
  destinatieInitiala?: string;
}) {
  const id = useId();
  const [suma, setSuma] = useState<number | null>(null);
  const [altaSuma, setAltaSuma] = useState("");
  const [lunar, setLunar] = useState(true);
  const [erori, setErori] = useState<Erori>({});
  const [trimis, setTrimis] = useState(false);

  const sumaAleasa = suma ?? (altaSuma ? Number(altaSuma.replace(",", ".")) : null);
  const sumaValida =
    sumaAleasa !== null && Number.isFinite(sumaAleasa) && sumaAleasa > 0;

  const etichetaButon = sumaValida
    ? `Donează ${sumaAleasa} lei${lunar ? " lunar" : ""}`
    : `Donează${lunar ? " lunar" : ""}`;

  function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    const gasite: Erori = {};

    if (suma === null && altaSuma.trim() === "") {
      gasite.suma = "Alege sau scrie suma pe care vrei să o donezi.";
    } else if (!sumaValida) {
      gasite.suma = "Introdu o sumă validă, în lei.";
    }

    const email = String(date.get("email") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";

    if (date.get("acord") !== "da")
      gasite.acord = "Bifează acordul pentru a continua.";

    setErori(gasite);
    if (Object.keys(gasite).length === 0) setTrimis(true);
  }

  if (trimis) {
    return (
      <div
        role="status"
        className="colt-a grid gap-4 bg-hartie p-7 shadow-[0_22px_45px_-24px_rgba(247,79,34,0.5)] sm:p-9"
      >
        <h3 className="text-h4 text-cerneala">
          Plata cu cardul direct pe site se conectează acum
        </h3>
        <p className="text-cerneala-moale">
          Alegem împreună cu asociația procesatorul de plăți, înainte de
          lansare. Nu îți luăm datele cardului până atunci. Dar poți dona chiar
          acum, pe una dintre căile care funcționează:
        </p>

        <ul className="grid gap-3">
          <li>
            <a
              href={LINKURI_EXTERNE.galantom}
              target="_blank"
              rel="noopener noreferrer"
              className="colt-mic-a block bg-caramiziu-500 px-5 py-4 font-titlu font-semibold text-hartie transition hover:bg-caramiziu-600"
            >
              Donează cu cardul pe Galantom
              <span className="mt-1 block text-mic font-normal opacity-90">
                Pagina de strângere de fonduri a asociației. O dată sau lunar.
              </span>
            </a>
          </li>
          <li>
            <a
              href="#sms"
              onClick={() => setTrimis(false)}
              className="colt-mic-b block bg-hartie-calda px-5 py-4 font-titlu font-semibold text-cerneala transition hover:bg-hartie-umbra"
            >
              Donează lunar prin SMS
              <span className="mt-1 block text-mic font-normal text-cerneala-moale">
                Trimiți un mesaj, fără formulare.
              </span>
            </a>
          </li>
          <li>
            <a
              href="#transfer"
              onClick={() => setTrimis(false)}
              className="colt-mic-a block bg-hartie-calda px-5 py-4 font-titlu font-semibold text-cerneala transition hover:bg-hartie-umbra"
            >
              Transfer bancar
              <span className="mt-1 block text-mic font-normal text-cerneala-moale">
                Conturile asociației, cu buton de copiere.
              </span>
            </a>
          </li>
        </ul>

        <p className="text-mic text-cerneala-moale">
          Ai nevoie de ajutor? Scrie-ne la{" "}
          <a
            href={`mailto:${EMAIL.contact}`}
            className="font-semibold underline underline-offset-2"
          >
            {EMAIL.contact}
          </a>{" "}
          sau sună-ne la{" "}
          <a
            href={`tel:${TELEFON_PRINCIPAL.apel}`}
            className="font-semibold underline underline-offset-2"
          >
            {TELEFON_PRINCIPAL.afisat}
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
      className="colt-a grid gap-6 bg-hartie p-6 shadow-[0_22px_45px_-24px_rgba(247,79,34,0.5)] sm:p-8"
    >
      {/* Suma */}
      <fieldset>
        <legend className="mb-3 font-titlu text-mic font-semibold text-cerneala">
          Suma{" "}
          <span className="text-caramiziu-600" aria-hidden="true">
            *
          </span>
        </legend>

        <div className="flex flex-wrap gap-2.5">
          {SUME.map((valoare) => (
            <button
              key={valoare}
              type="button"
              aria-pressed={suma === valoare}
              onClick={() => {
                setSuma(valoare);
                setAltaSuma("");
              }}
              className={`rounded-full px-6 py-3 font-titlu font-semibold transition-all duration-200 ease-cald ${
                suma === valoare
                  ? "bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]"
                  : "border-2 border-cerneala/15 bg-hartie text-cerneala hover:border-caramiziu-400"
              }`}
            >
              {valoare} lei
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label
            htmlFor={`${id}-alta`}
            className="mb-1.5 block font-titlu text-mic font-semibold text-cerneala"
          >
            Altă sumă (lei)
          </label>
          <input
            id={`${id}-alta`}
            name="alta"
            type="text"
            inputMode="decimal"
            value={altaSuma}
            onChange={(ev) => {
              setAltaSuma(ev.target.value);
              setSuma(null);
            }}
            aria-invalid={Boolean(erori.suma)}
            aria-describedby={erori.suma ? `${id}-suma-eroare` : undefined}
            className={`${erori.suma ? claseControlGresit : claseControl} sm:max-w-xs`}
          />
          {erori.suma && (
            <p
              id={`${id}-suma-eroare`}
              className="mt-1.5 font-titlu text-mic font-semibold text-caramiziu-700"
            >
              {erori.suma}
            </p>
          )}
        </div>
      </fieldset>

      {/* Frecvența — „Lunar” preselectat. */}
      <fieldset>
        <legend className="mb-3 font-titlu text-mic font-semibold text-cerneala">
          Frecvența
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {[
            { eticheta: "O dată", valoare: false },
            { eticheta: "Lunar", valoare: true },
          ].map((optiune) => (
            <button
              key={optiune.eticheta}
              type="button"
              aria-pressed={lunar === optiune.valoare}
              onClick={() => setLunar(optiune.valoare)}
              className={`rounded-full px-6 py-3 font-titlu font-semibold transition-all duration-200 ease-cald ${
                lunar === optiune.valoare
                  ? "bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]"
                  : "border-2 border-cerneala/15 bg-hartie text-cerneala hover:border-miere-400"
              }`}
            >
              {optiune.eticheta}
            </button>
          ))}
        </div>
      </fieldset>

      <Camp id={`${id}-destinatie`} eticheta="Destinația donației" obligatoriu>
        <select
          id={`${id}-destinatie`}
          name="destinatie"
          defaultValue={destinatieInitiala}
          className={claseControl}
        >
          {DESTINATII_DONATIE.map((destinatie) => (
            <option key={destinatie.id} value={destinatie.id}>
              {destinatie.eticheta}
            </option>
          ))}
        </select>
      </Camp>

      <div className="grid gap-5 sm:grid-cols-2">
        <Camp id={`${id}-prenume`} eticheta="Prenume">
          <input
            id={`${id}-prenume`}
            name="prenume"
            type="text"
            autoComplete="given-name"
            className={claseControl}
          />
        </Camp>
        <Camp id={`${id}-nume`} eticheta="Nume">
          <input
            id={`${id}-nume`}
            name="nume"
            type="text"
            autoComplete="family-name"
            className={claseControl}
          />
        </Camp>

        <Camp
          id={`${id}-email`}
          eticheta="Email"
          obligatoriu
          nota="Aici primești confirmarea donației."
          eroare={erori.email}
        >
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(erori.email)}
            aria-describedby={
              erori.email ? `${id}-email-eroare` : `${id}-email-nota`
            }
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
      </div>

      <div className="grid gap-3">
        <label className="flex items-start gap-3 text-mic text-cerneala-moale">
          <input
            name="buletin"
            value="da"
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-caramiziu-500"
          />
          <span>
            Vreau să primesc ocazional vești despre activitatea asociației.
          </span>
        </label>

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
              Sunt de acord cu prelucrarea datelor mele, conform{" "}
              <Link
                href={RUTE.confidentialitate}
                className="font-semibold underline underline-offset-2"
              >
                Politicii de confidențialitate
              </Link>
              .{" "}
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
      </div>

      <div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-caramiziu-500 px-8 py-4 font-titlu text-amplu font-semibold text-hartie shadow-[0_14px_30px_-12px_rgba(247,79,34,0.9)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:bg-caramiziu-600 motion-reduce:hover:translate-y-0 sm:w-auto"
        >
          {etichetaButon}
        </button>

        <p className="mt-3 flex items-center gap-2 text-mic text-cerneala-moale">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-turcoaz-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          </svg>
          Plată securizată. Datele cardului nu trec prin site-ul nostru.
        </p>

        {/* Pictogramele cardurilor acceptate, cerute la 2.2. Desenate, nu
            siglele oficiale: acelea se pot folosi doar după ce procesatorul e
            ales și ne dă dreptul să le afișăm. */}
        <ul
          aria-label="Carduri acceptate"
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {["Visa", "Mastercard", "Maestro"].map((card) => (
            <li
              key={card}
              className="rounded-md border border-hartie-umbra bg-hartie px-3 py-1.5 font-titlu text-nota font-bold text-cerneala-moale"
            >
              {card}
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
