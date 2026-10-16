"use client";

import { useEffect, useId, useState } from "react";
import { DESTINATII_DONATIE, EMAIL } from "@/date/asociatie";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

/**
 * „Am făcut transferul” — bifa donatorului.
 *
 * Transferul bancar nu trece prin site, deci site-ul nu poate ști că s-a
 * întâmplat: banii apar în extrasul asociației, pe care îl citește un om.
 * Până acum donatorul rămânea fără nicio urmă că a dat, iar donația lui
 * apărea în evidență doar dacă cineva o bătea de mână din extras.
 *
 * Formularul ăsta nu încasează nimic și nu confirmă nimic. El spune
 * asociației ce să caute în extras: numele de pe transfer, suma și ziua.
 * Până când cineva confirmă că a găsit banii, anunțul **nu intră în niciun
 * total** — scrie și aici, ca nimeni să nu creadă că a dat prin site.
 *
 * Stă într-un `<details>` închis: cardul cu IBAN-uri rămâne scurt pentru cei
 * mai mulți, care vin să copieze un cont, nu să completeze un formular.
 */

type Erori = Partial<
  Record<"nume" | "suma" | "data" | "email" | "confirm", string>
>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; mesaj: string }
  | { fel: "eroare"; mesaj: string };

export default function AnuntTransfer() {
  const id = useId();
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  /*
    Ziua de azi se află după ce pagina ajunge în browser, nu la pregenerare.

    `/doneaza` se pregătește o dată, la publicare, și se servește de atunci
    tuturor. O dată citită acolo ar fi ziua publicării, nu ziua celui care
    completează — iar Next oprește construirea exact pentru asta.

    Se calculează din ceasul local, nu din `toISOString()`: acela dă ziua în
    UTC, deci în România, între miezul nopții și ora 3, ar propune ieri.
  */
  const [azi, setAzi] = useState("");
  const [data, setData] = useState("");

  useEffect(() => {
    const acum = new Date();
    const zi = [
      acum.getFullYear(),
      String(acum.getMonth() + 1).padStart(2, "0"),
      String(acum.getDate()).padStart(2, "0"),
    ].join("-");
    setAzi(zi);
    setData((scris) => scris || zi);
  }, []);

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);

    const gasite: Erori = {};
    const nume = String(date.get("nume") ?? "").trim();
    const suma = String(date.get("suma") ?? "").trim();
    const data = String(date.get("data") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();

    if (nume.length < 2) gasite.nume = "Scrie numele de pe transfer.";
    if (suma === "") gasite.suma = "Scrie suma transferului.";
    if (data === "") gasite.data = "Alege ziua transferului.";
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Adresa de e-mail nu e scrisă corect.";
    if (date.get("confirm") !== "da")
      gasite.confirm = "Bifează că ai făcut transferul.";

    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/donatii/transfer", {
        method: "POST",
        body: date,
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut nota transferul.",
        });
        return;
      }
      setStare({ fel: "reusit", mesaj: corp.mesaj ?? "Am notat transferul." });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut nota transferul. Verifică-ți conexiunea.",
      });
    }
  }

  if (stare.fel === "reusit") {
    return (
      <div
        role="status"
        className="relative mt-6 colt-mic-a border-2 border-turcoaz-300 bg-hartie p-5"
      >
        <p className="flex items-start gap-3 text-turcoaz-900">
          <Pictograma
            nume="inima"
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          <span>{stare.mesaj}</span>
        </p>
      </div>
    );
  }

  return (
    <details className="relative mt-6 colt-mic-a border-2 border-turcoaz-300 bg-hartie/70 open:bg-hartie">
      <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-5 py-3 font-titlu font-bold text-turcoaz-900">
        Am făcut transferul — anunță-ne
      </summary>

      <div className="border-t-2 border-turcoaz-200 p-5">
        <p className="text-mic text-turcoaz-900/80">
          Nu e nevoie, dar ne ajută: știm ce sumă să căutăm în extrasul de cont
          și pe cine să trecem în evidență. Nu se plătește nimic de aici și nu
          se cere niciun card.
        </p>

        <form onSubmit={trimite} noValidate className="mt-5 grid gap-4">
          {/* Capcana pentru roboți: ascunsă și de ochi, și de cititoarele de ecran. */}
          <p className="hidden" aria-hidden="true">
            <label htmlFor={`${id}-site`}>Nu completa acest câmp</label>
            <input
              id={`${id}-site`}
              name="site_web"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </p>

          <Camp
            id={`${id}-nume`}
            eticheta="Numele de pe transfer"
            obligatoriu
            eroare={erori.nume}
            nota="Cum apare în banca ta — așa îl găsim în extras."
          >
            <input
              id={`${id}-nume`}
              name="nume"
              type="text"
              autoComplete="name"
              maxLength={120}
              aria-invalid={Boolean(erori.nume)}
              aria-describedby={
                erori.nume ? `${id}-nume-eroare` : `${id}-nume-nota`
              }
              className={erori.nume ? claseControlGresit : claseControl}
            />
          </Camp>

          <div className="grid gap-4 sm:grid-cols-2">
            <Camp
              id={`${id}-suma`}
              eticheta="Suma (lei)"
              obligatoriu
              eroare={erori.suma}
            >
              <input
                id={`${id}-suma`}
                name="suma"
                type="text"
                inputMode="decimal"
                maxLength={20}
                aria-invalid={Boolean(erori.suma)}
                aria-describedby={erori.suma ? `${id}-suma-eroare` : undefined}
                className={erori.suma ? claseControlGresit : claseControl}
              />
            </Camp>

            <Camp
              id={`${id}-data`}
              eticheta="Când l-ai făcut"
              obligatoriu
              eroare={erori.data}
            >
              <input
                id={`${id}-data`}
                name="data"
                type="date"
                max={azi || undefined}
                value={data}
                onChange={(ev) => setData(ev.target.value)}
                aria-invalid={Boolean(erori.data)}
                aria-describedby={erori.data ? `${id}-data-eroare` : undefined}
                className={erori.data ? claseControlGresit : claseControl}
              />
            </Camp>
          </div>

          <Camp id={`${id}-destinatie`} eticheta="Pentru ce">
            <select
              id={`${id}-destinatie`}
              name="destinatie"
              defaultValue="oriunde"
              className={claseControl}
            >
              {DESTINATII_DONATIE.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.eticheta}
                </option>
              ))}
            </select>
          </Camp>

          <div className="grid gap-4 sm:grid-cols-2">
            <Camp
              id={`${id}-email`}
              eticheta="E-mail"
              eroare={erori.email}
              nota="Doar dacă vrei o confirmare scrisă de la noi."
            >
              <input
                id={`${id}-email`}
                name="email"
                type="email"
                autoComplete="email"
                maxLength={160}
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
                maxLength={40}
                className={claseControl}
              />
            </Camp>
          </div>

          <Camp
            id={`${id}-observatii`}
            eticheta="Ce ai scris la detaliile plății"
            nota="Dacă ai trecut altceva decât numele tău, scrie-l aici."
          >
            <input
              id={`${id}-observatii`}
              name="observatii"
              type="text"
              maxLength={200}
              aria-describedby={`${id}-observatii-nota`}
              className={claseControl}
            />
          </Camp>

          <Bifa name="confirm" obligatoriu eroare={erori.confirm}>
            Am făcut transferul în contul asociației.
          </Bifa>

          <p className="text-nota text-cerneala-slab">
            Anunțul nu e o plată și nu intră în totalurile asociației până când
            transferul e găsit în extrasul de cont. Datele rămân la asociație;
            întrebări, la {EMAIL.contact}.
          </p>

          {stare.fel === "eroare" && (
            <p
              role="alert"
              className="colt-mic-a border-2 border-caramiziu-300 bg-caramiziu-50 p-4 font-titlu font-semibold text-caramiziu-800"
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
              {stare.fel === "trimite" ? "Se trimite…" : "Am făcut transferul"}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
