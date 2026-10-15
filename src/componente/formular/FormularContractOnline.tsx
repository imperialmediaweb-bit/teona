"use client";

import { useId, useState } from "react";
import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Pictograma from "../Pictograma";
import Camp, {
  Bifa,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";
import CampCui, { type Firma } from "./CampCui";
import SemnaturaPeEcran from "./SemnaturaPeEcran";

/**
 * Contractul de sponsorizare, completat și semnat pe site.
 *
 * Până acum, o firmă care voia să sponsorizeze trimitea o cerere, aștepta
 * un e-mail, tipărea, semna, scana. Aici face totul într-o pagină: scrie
 * CUI-ul — restul vine din datele publice ale ANAF — completează ce semnează,
 * semnează cu degetul și primește pe loc PDF-ul pe e-mail.
 *
 * **Ce e semnătura asta, scris la vedere.** E o semnătură electronică simplă.
 * Prin lege, doar cea calificată (cu certificat) are puterea semnăturii cu
 * pixul. Pagina spune asta înainte de casetă, nu într-o notă de subsol: o
 * firmă care crede că a semnat altceva decât a semnat e o problemă mai mare
 * decât una care alege să tipărească.
 *
 * Cine vrea semnătură calificată descarcă modelul în Word sau PDF de pe
 * aceeași pagină, îl semnează cu certificatul firmei și ni-l trimite pe
 * e-mail. Linkul e aici, lângă buton, nu ascuns.
 */

type Erori = Partial<
  Record<
    "denumire" | "cui" | "reprezentant" | "email" | "valoare" | "semnatura" | "acord",
    string
  >
>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; mesaj: string }
  | { fel: "eroare"; mesaj: string };

export default function FormularContractOnline() {
  const id = useId();
  const [cui, setCui] = useState("");
  const [denumire, setDenumire] = useState("");
  const [sediu, setSediu] = useState("");
  const [regCom, setRegCom] = useState("");
  const [areSemnatura, setAreSemnatura] = useState(false);
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  /** Ce vine de la ANAF după CUI: denumirea, sediul, nr. de la registru. */
  function dinAnaf(firma: Firma) {
    setDenumire(firma.denumire);
    if (firma.adresa) setSediu(firma.adresa);
    if (firma.nrRegCom) setRegCom(firma.nrRegCom);
  }

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);

    const gasite: Erori = {};
    const ia = (nume: string) => String(date.get(nume) ?? "").trim();

    if (ia("denumire").length < 3) gasite.denumire = "Scrieți denumirea firmei.";
    if (ia("cui").replace(/\D/g, "").length < 2)
      gasite.cui = "Scrieți CUI-ul firmei.";
    if (ia("reprezentant").length < 3)
      gasite.reprezentant = "Scrieți numele celui care semnează.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ia("email")))
      gasite.email = "Introduceți o adresă de e-mail validă.";
    if (ia("valoare") === "") gasite.valoare = "Scrieți valoarea contractului.";
    if (!ia("semnatura")) gasite.semnatura = "Semnați în casetă.";
    if (date.get("acord") !== "da")
      gasite.acord = "Bifați, altfel contractul nu poate pleca.";

    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/contract", { method: "POST", body: date });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut trimite contractul.",
        });
        return;
      }
      setStare({ fel: "reusit", mesaj: corp.mesaj ?? "Contractul e semnat." });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut trimite contractul. Verificați conexiunea.",
      });
    }
  }

  if (stare.fel === "reusit") {
    return (
      <div
        role="status"
        className="colt-a border-2 border-turcoaz-300 bg-turcoaz-50 p-7 sm:p-9"
      >
        <span className="colt-mic-b flex size-14 items-center justify-center bg-turcoaz-600 text-hartie">
          <Pictograma nume="document" className="size-7" />
        </span>
        <h2 className="mt-5 text-h3 text-turcoaz-900">Gata, e semnat</h2>
        <p className="mt-3 max-w-2xl text-amplu text-turcoaz-900/85">
          {stare.mesaj}
        </p>
        <p className="mt-4 text-mic text-turcoaz-900/80">
          Dacă nu ajunge nimic în câteva minute, uitați-vă și în „Spam”, apoi
          sunați-ne la {TELEFON_PRINCIPAL.afisat}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={trimite}
      noValidate
      className="colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] sm:p-8"
    >
      {/* Capcana pentru roboți: ascunsă și de ochi, și de cititoarele de ecran. */}
      <p className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-site`}>Nu completați acest câmp</label>
        <input
          id={`${id}-site`}
          name="site_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </p>

      <h2 className="text-h4 text-cerneala">Datele firmei</h2>

      <div className="mt-5 grid gap-5">
        <CampCui
          id={`${id}-cui`}
          name="cui"
          obligatoriu
          nota="Scrieți CUI-ul și completăm denumirea, sediul și nr. de la registrul comerțului din datele publice ale ANAF."
          eroare={erori.cui}
          valoare={cui}
          onValoare={setCui}
          onFirma={dinAnaf}
        />

        <Camp
          id={`${id}-denumire`}
          eticheta="Denumirea firmei"
          obligatoriu
          eroare={erori.denumire}
        >
          <input
            id={`${id}-denumire`}
            name="denumire"
            type="text"
            maxLength={200}
            value={denumire}
            onChange={(ev) => setDenumire(ev.target.value)}
            aria-invalid={Boolean(erori.denumire)}
            className={erori.denumire ? claseControlGresit : claseControl}
          />
        </Camp>

        <div className="grid gap-5 sm:grid-cols-2">
          <Camp id={`${id}-sediu`} eticheta="Sediul">
            <input
              id={`${id}-sediu`}
              name="sediu"
              type="text"
              maxLength={200}
              value={sediu}
              onChange={(ev) => setSediu(ev.target.value)}
              className={claseControl}
            />
          </Camp>

          <Camp id={`${id}-judet`} eticheta="Județul">
            <input
              id={`${id}-judet`}
              name="judet"
              type="text"
              maxLength={80}
              className={claseControl}
            />
          </Camp>
        </div>

        <Camp
          id={`${id}-regcom`}
          eticheta="Nr. de la registrul comerțului"
          nota="Dacă firma nu e la registrul comerțului (ONG, PFA), lăsați gol."
        >
          <input
            id={`${id}-regcom`}
            name="regCom"
            type="text"
            maxLength={80}
            value={regCom}
            onChange={(ev) => setRegCom(ev.target.value)}
            aria-describedby={`${id}-regcom-nota`}
            className={claseControl}
          />
        </Camp>
      </div>

      <h2 className="mt-9 text-h4 text-cerneala">Cine semnează</h2>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Camp
            id={`${id}-reprezentant`}
            eticheta="Nume și prenume"
            obligatoriu
            eroare={erori.reprezentant}
          >
            <input
              id={`${id}-reprezentant`}
              name="reprezentant"
              type="text"
              autoComplete="name"
              maxLength={120}
              aria-invalid={Boolean(erori.reprezentant)}
              className={
                erori.reprezentant ? claseControlGresit : claseControl
              }
            />
          </Camp>

          <Camp
            id={`${id}-calitate`}
            eticheta="În calitate de"
            nota="Administrator, director, împuternicit…"
          >
            <input
              id={`${id}-calitate`}
              name="calitate"
              type="text"
              maxLength={80}
              aria-describedby={`${id}-calitate-nota`}
              className={claseControl}
            />
          </Camp>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Camp
            id={`${id}-email`}
            eticheta="E-mail"
            obligatoriu
            nota="Aici trimitem contractul semnat."
            eroare={erori.email}
          >
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={160}
              aria-invalid={Boolean(erori.email)}
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
          id={`${id}-valoare`}
          eticheta="Valoarea contractului (lei)"
          obligatoriu
          nota="Suma pe care o sponsorizați. Dacă încă nu e stabilită, întrebați întâi contabilitatea — contractul se semnează cu o sumă în el."
          eroare={erori.valoare}
        >
          <input
            id={`${id}-valoare`}
            name="valoare"
            type="text"
            inputMode="decimal"
            maxLength={20}
            placeholder="de exemplu 5.000"
            aria-invalid={Boolean(erori.valoare)}
            className={erori.valoare ? claseControlGresit : claseControl}
          />
        </Camp>
      </div>

      <h2 className="mt-9 text-h4 text-cerneala">Semnătura</h2>

      {/*
        Ce e semnătura asta, înaintea casetei, nu după ea.
      */}
      <p className="mt-3 max-w-2xl text-mic text-cerneala-moale">
        Semnătura desenată aici e o <strong>semnătură electronică simplă</strong>.
        Contractul e valabil prin acordul părților, iar{" "}
        {ASOCIATIA.denumire} îl contrasemnează și vi-l trimite înapoi. Dacă
        firma dumneavoastră vrea o semnătură electronică calificată — cea cu
        certificat, folosită la ANAF — descărcați modelul de mai sus, semnați-l
        cu certificatul firmei și trimiteți-l la {EMAIL.contact}.
      </p>

      <div className="mt-5">
        <SemnaturaPeEcran
          name="semnatura"
          eroare={erori.semnatura}
          onSemnat={setAreSemnatura}
        />
      </div>

      <div className="mt-6">
        <Bifa name="acord" obligatoriu eroare={erori.acord}>
          Am citit contractul, semnez în numele firmei de mai sus și sunt de
          acord ca {ASOCIATIA.denumire} să prelucreze datele acestea pentru
          încheierea lui.
        </Bifa>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={stare.fel === "trimite"}
          className={claseButonTrimite}
        >
          {stare.fel === "trimite"
            ? "Se semnează…"
            : "Semnează și trimite contractul"}
        </button>
        {!areSemnatura && (
          <span className="text-mic text-cerneala-slab">
            Mai întâi semnați în casetă.
          </span>
        )}
      </div>

      {stare.fel === "eroare" && (
        <p
          role="alert"
          className="mt-5 colt-mic-a border-2 border-caramiziu-300 bg-caramiziu-50 p-4 font-titlu font-semibold text-caramiziu-800"
        >
          {stare.mesaj}
        </p>
      )}
    </form>
  );
}
