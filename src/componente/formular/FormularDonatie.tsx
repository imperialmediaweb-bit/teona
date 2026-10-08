"use client";

import { Suspense, useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DESTINATII_DONATIE,
  EMAIL,
  LINKURI_EXTERNE,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import Decor from "../Decor";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  Eroare,
  Optiuni,
  claseControl,
  claseControlGresit,
} from "./Camp";

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
/**
 * Destinația aleasă deja, din adresa paginii.
 *
 * Butoanele „Susține” de la campaniile de pe prima pagină și „Sprijină Casa
 * Teona” trimit la `/doneaza?destinatie=tabere`, `?destinatie=casa-teona` și
 * așa mai departe — caietul cere la 1.4 ca donatorul să ajungă cu destinația
 * deja aleasă. Până acum parametrul era trimis, dar nimeni nu-l citea: omul
 * apăsa „Susține” la Casa Teona și nimerea pe „Oriunde e nevoie”.
 *
 * Valoarea din adresă nu e de încredere — o poate scrie oricine în bara
 * browserului — deci se acceptă doar dacă e una dintre destinațiile existente.
 *
 * Numele începe cu „use” pentru că înăuntru cheamă un hook React, iar regula
 * lui React e că numai componentele și hook-urile pot face asta.
 */
function useDestinatiaDinAdresa(implicita: string): string {
  const cautat = useSearchParams().get("destinatie");
  const exista = DESTINATII_DONATIE.some((d) => d.id === cautat);
  return exista && cautat ? cautat : implicita;
}

/**
 * `useSearchParams` cere o graniță `Suspense` ca pagina să poată rămâne
 * pregenerată. O ținem aici, nu în pagină: așa componenta se poate pune
 * oriunde, fără ca cel care o folosește să trebuiască să știe asta.
 */
export default function FormularDonatie(proprietati: {
  destinatieInitiala?: string;
}) {
  return (
    <Suspense fallback={<ScheletFormular />}>
      <Formular {...proprietati} />
    </Suspense>
  );
}

/** Umbra formularului, cât se așteaptă adresa. Aceeași formă, ca să nu sară. */
function ScheletFormular() {
  return (
    <div
      aria-hidden="true"
      className="colt-a min-h-[32rem] bg-hartie shadow-[0_22px_45px_-24px_rgba(247,79,34,0.5)]"
    />
  );
}

function Formular({
  destinatieInitiala = "oriunde",
}: {
  destinatieInitiala?: string;
}) {
  const destinatia = useDestinatiaDinAdresa(destinatieInitiala);
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
        className="relative overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_26px_52px_-26px_rgba(247,79,34,0.5)]"
      >
        <div className="granulatie relative overflow-hidden bg-miere-300 px-7 py-6 sm:px-9">
          <Decor semn="stea" strokeWidth={0.8} className="absolute -top-8 -right-8 size-32 text-miere-100" />
          <h3 className="relative text-h4 text-miere-900">
            Plata cu cardul direct pe site se conectează acum
          </h3>
        </div>
        <div className="grid gap-5 p-7 sm:p-9">
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
                className="flex items-center gap-4 colt-mic-a bg-caramiziu-500 px-5 py-4 font-titlu font-semibold text-hartie shadow-[0_14px_30px_-14px_rgba(247,79,34,0.9)] transition hover:bg-caramiziu-600"
              >
                <span className="flex size-11 shrink-0 items-center justify-center colt-mic-b bg-hartie/20">
                  <Pictograma nume="inima" className="size-5" />
                </span>
                <span>
                  Donează cu cardul pe Galantom
                  <span className="mt-0.5 block text-mic font-normal opacity-90">
                    Pagina de strângere de fonduri a asociației. O dată sau lunar.
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href="#sms"
                onClick={() => setTrimis(false)}
                className="flex items-center gap-4 colt-mic-b bg-miere-100 px-5 py-4 font-titlu font-semibold text-cerneala transition hover:bg-miere-200"
              >
                <span className="flex size-11 shrink-0 items-center justify-center colt-mic-a bg-miere-400 text-cerneala">
                  <Pictograma nume="telefon" className="size-5" />
                </span>
                <span>
                  Donează lunar prin SMS
                  <span className="mt-0.5 block text-mic font-normal text-cerneala-moale">
                    Trimiți un mesaj, fără formulare.
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href="#transfer"
                onClick={() => setTrimis(false)}
                className="flex items-center gap-4 colt-mic-a bg-turcoaz-50 px-5 py-4 font-titlu font-semibold text-cerneala transition hover:bg-turcoaz-100"
              >
                <span className="flex size-11 shrink-0 items-center justify-center colt-mic-b bg-turcoaz-500 text-hartie">
                  <Pictograma nume="cladire" className="size-5" />
                </span>
                <span>
                  Transfer bancar
                  <span className="mt-0.5 block text-mic font-normal text-cerneala-moale">
                    Conturile asociației, cu buton de copiere.
                  </span>
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
      </div>
    );
  }

  return (
    <form
      onSubmit={trimite}
      noValidate
      className="relative overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.55)]"
    >
      <div className="granulatie relative overflow-hidden bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 px-6 py-5 text-hartie sm:px-8">
        <Decor semn="inima" strokeWidth={0.9} className="absolute -right-6 -bottom-10 size-32 text-hartie/20" />
        <p className="relative flex items-center gap-3 font-titlu text-amplu font-bold">
          <span className="flex size-10 items-center justify-center colt-mic-b bg-hartie/20">
            <Pictograma nume="inima" className="size-5" />
          </span>
          Donează cu cardul
        </p>
      </div>

      <div className="grid gap-6 p-6 sm:p-8">
        {/* Suma */}
        <fieldset>
          <legend className="mb-3 font-titlu text-mic font-bold text-cerneala">
            Suma{" "}
            <span className="text-caramiziu-600" aria-hidden="true">
              *
            </span>
          </legend>

          <div className="grid grid-cols-3 gap-2.5">
            {SUME.map((valoare, i) => (
              <button
                key={valoare}
                type="button"
                aria-pressed={suma === valoare}
                onClick={() => {
                  setSuma(valoare);
                  setAltaSuma("");
                }}
                className={`flex min-h-16 flex-col items-center justify-center ${
                  i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                } px-3 py-2 font-titlu font-extrabold transition-all duration-200 ease-cald ${
                  suma === valoare
                    ? "bg-caramiziu-500 text-hartie shadow-[0_12px_26px_-12px_rgba(247,79,34,0.9)]"
                    : "border-2 border-hartie-umbra bg-hartie text-cerneala hover:border-caramiziu-400"
                }`}
              >
                <span className="text-h4 leading-none">{valoare}</span>
                <span
                  className={`mt-1 text-nota font-semibold ${
                    suma === valoare ? "text-hartie/85" : "text-cerneala-slab"
                  }`}
                >
                  lei
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3">
            <label
              htmlFor={`${id}-alta`}
              className="mb-2 block font-titlu text-mic font-bold text-cerneala"
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
            <Eroare id={`${id}-suma-eroare`} text={erori.suma} />
          </div>
        </fieldset>

        {/* Frecvența — „Lunar” preselectat. Un comutator cu două poziții. */}
        <fieldset>
          <legend className="mb-3 font-titlu text-mic font-bold text-cerneala">
            Frecvența
          </legend>
          <div className="inline-grid grid-cols-2 gap-1 rounded-full border-2 border-hartie-umbra bg-hartie-calda p-1">
            {[
              { eticheta: "O dată", valoare: false },
              { eticheta: "Lunar", valoare: true },
            ].map((optiune) => (
              <button
                key={optiune.eticheta}
                type="button"
                aria-pressed={lunar === optiune.valoare}
                onClick={() => setLunar(optiune.valoare)}
                className={`min-h-11 rounded-full px-6 py-2 font-titlu font-bold transition-all duration-300 ease-cald ${
                  lunar === optiune.valoare
                    ? "bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]"
                    : "text-cerneala-moale hover:text-cerneala"
                }`}
              >
                {optiune.eticheta}
              </button>
            ))}
          </div>
        </fieldset>

        <Optiuni
          name="destinatie"
          legenda="Destinația donației"
          obligatoriu
          defaultValue={destinatia}
          optiuni={DESTINATII_DONATIE.map((destinatie) => ({
            valoare: destinatie.id,
            eticheta: destinatie.eticheta,
          }))}
        />

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
          <Bifa name="buletin">
            Vreau să primesc ocazional vești despre activitatea asociației.
          </Bifa>

          <Bifa name="acord" obligatoriu eroare={erori.acord}>
            Sunt de acord cu prelucrarea datelor mele, conform{" "}
            <Link
              href={RUTE.confidentialitate}
              className="font-semibold text-cerneala underline underline-offset-2"
            >
              Politicii de confidențialitate
            </Link>
            .
          </Bifa>
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-caramiziu-500 px-8 py-4 font-titlu text-amplu font-bold text-hartie shadow-[0_16px_32px_-12px_rgba(247,79,34,0.9)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:bg-caramiziu-600 motion-reduce:hover:translate-y-0"
          >
            <Pictograma nume="inima" className="size-5" />
            {etichetaButon}
          </button>

          <p className="mt-4 flex items-center gap-2 text-mic text-cerneala-moale">
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
                className="rounded-md border border-hartie-umbra bg-hartie-calda px-3 py-1.5 font-titlu text-nota font-bold text-cerneala-moale"
              >
                {card}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </form>
  );
}
