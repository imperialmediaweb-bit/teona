"use client";

import { Suspense, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ASOCIATIA, EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Pictograma from "../Pictograma";
import Camp, {
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";
import CampCui, { type Firma } from "./CampCui";

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
    | "denumire"
    | "cui"
    | "reprezentant"
    | "email"
    | "valoare"
    | "semnatura"
    | "acord",
    string
  >
>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; mesaj: string }
  | { fel: "eroare"; mesaj: string };

/**
 * `useSearchParams` cere o graniță `Suspense` ca pagina să rămână
 * pregenerată. O ținem aici, nu în pagină: cine folosește formularul n-are de
 * ce să știe asta.
 */
export default function FormularContractOnline() {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="colt-a min-h-[40rem] border border-hartie-umbra bg-hartie"
        />
      }
    >
      <Formular />
    </Suspense>
  );
}

function Formular() {
  const id = useId();
  /*
    CUI-ul și suma vin din calculatorul de pe pagina pentru firme: butonul lui
    duce aici cu amândouă în adresă. Firma nu le mai scrie a doua oară, iar
    căutarea la ANAF pornește singură, din CUI-ul primit.
  */
  const parametri = useSearchParams();
  const [cui, setCui] = useState(() => parametri.get("cui")?.trim() ?? "");
  const [valoareInitiala] = useState(
    () => parametri.get("valoare")?.trim() ?? "",
  );
  const [denumire, setDenumire] = useState("");
  const [sediu, setSediu] = useState("");
  const [regCom, setRegCom] = useState("");
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });
  const formular = useRef<HTMLFormElement>(null);
  const [descarc, setDescarc] = useState<"pdf" | "word" | null>(null);
  const [descarcat, setDescarcat] = useState(false);

  /**
   * Descarcă contractul completat cu datele din formular.
   *
   * Nu semnează și nu trimite nimic: firma primește documentul ei, îl
   * semnează cum vrea — cu certificatul calificat sau tipărit, cu pixul — și
   * ni-l trimite pe e-mail. Serverul nu păstrează nimic: o descărcare nu e un
   * angajament.
   */
  async function descarca(fel: "pdf" | "word") {
    const el = formular.current;
    if (!el) return;
    const date = new FormData(el);
    date.set("fel", fel);

    const gasite: Erori = {};
    if (String(date.get("denumire") ?? "").trim().length < 3)
      gasite.denumire = "Scrieți denumirea firmei.";
    if (String(date.get("cui") ?? "").replace(/\D/g, "").length < 2)
      gasite.cui = "Scrieți CUI-ul firmei.";
    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;

    setDescarc(fel);
    setStare({ fel: "gol" });
    try {
      const raspuns = await fetch("/api/contract/descarca", {
        method: "POST",
        body: date,
      });
      if (!raspuns.ok) {
        const corp = (await raspuns.json().catch(() => ({}))) as {
          mesaj?: string;
        };
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut scrie contractul.",
        });
        return;
      }
      /*
        Numele fișierului vine din antetul răspunsului, nu din browser:
        altfel descărcarea s-ar numi „descarca" și firma ar avea în Descărcări
        zece fișiere la fel.
      */
      const antet = raspuns.headers.get("content-disposition") ?? "";
      const nume =
        /filename="([^"]+)"/.exec(antet)?.[1] ??
        (fel === "word" ? "Contract.docx" : "Contract.pdf");
      const bucata = await raspuns.blob();
      const adresa = URL.createObjectURL(bucata);
      const legatura = document.createElement("a");
      legatura.href = adresa;
      legatura.download = nume;
      document.body.append(legatura);
      legatura.click();
      legatura.remove();
      URL.revokeObjectURL(adresa);
      setDescarcat(true);
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut descărca contractul. Verificați conexiunea.",
      });
    } finally {
      setDescarc(null);
    }
  }

  /** Ce vine de la ANAF după CUI: denumirea, sediul, nr. de la registru. */
  function dinAnaf(firma: Firma) {
    setDenumire(firma.denumire);
    if (firma.adresa) setSediu(firma.adresa);
    if (firma.nrRegCom) setRegCom(firma.nrRegCom);
  }

  return (
    <form
      ref={formular}
      /* Nimic nu se trimite de aici: formularul doar scrie documentul. */
      onSubmit={(ev) => ev.preventDefault()}
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
              className={erori.reprezentant ? claseControlGresit : claseControl}
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
            defaultValue={valoareInitiala}
            maxLength={20}
            placeholder="de exemplu 5.000"
            aria-invalid={Boolean(erori.valoare)}
            className={erori.valoare ? claseControlGresit : claseControl}
          />
        </Camp>
      </div>

      {/*
        Calea întâi: documentul completat, de descărcat.

        Firma îl semnează cum vrea — cu certificatul calificat, care are prin
        lege puterea semnăturii olografe, sau tipărit, cu pixul — și ni-l
        trimite pe e-mail. Nu se salvează nimic la noi: o descărcare nu e un
        angajament.

        Semnatul pe ecran rămâne dedesubt, închis. Legea 214/2024 (art. 4) dă
        semnăturii electronice simple efectele celei olografe doar în anumite
        cazuri — cel care se potrivește aici e recunoașterea de către partea
        împotriva căreia e folosită, inclusiv tacit, prin plata sumei. E bună
        pentru sume mici și firme fără certificat; nu e calea pe care o pun
        prima.
      */}
      <h2 className="mt-9 text-h4 text-cerneala">Ia contractul completat</h2>
      <p className="mt-3 max-w-2xl text-mic text-cerneala-moale">
        Îl descărcați cu datele firmei scrise în el, îl semnați — cu
        certificatul calificat al firmei (cel cu care intrați în SPV la ANAF)
        sau tipărit, cu pixul — și ni-l trimiteți la{" "}
        <a
          href={`mailto:${EMAIL.contact}`}
          className="font-titlu font-semibold text-caramiziu-700 underline-offset-4 hover:underline"
        >
          {EMAIL.contact}
        </a>
        . Îl contrasemnăm și vă trimitem exemplarul semnat de amândoi.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => descarca("word")}
          disabled={descarc !== null}
          className={claseButonTrimite}
        >
          {descarc === "word" ? "Se pregătește…" : "Descarcă în Word"}
        </button>
        <button
          type="button"
          onClick={() => descarca("pdf")}
          disabled={descarc !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-cerneala/15 bg-hartie px-7 py-3 font-titlu font-semibold text-cerneala transition-colors hover:border-caramiziu-500 hover:text-caramiziu-700 disabled:opacity-60"
        >
          {descarc === "pdf" ? "Se pregătește…" : "Descarcă în PDF"}
        </button>
      </div>
      <p className="mt-3 text-nota text-cerneala-slab">
        Word, dacă mai aveți de completat ceva sau îl semnați cu certificatul.
        PDF, dacă îl tipăriți și îl semnați cu pixul.
      </p>

      {/*
        Ce are de făcut omul după ce apasă butonul.

        Pașii stau pe pagină de la început, nu apar abia după descărcare: cine
        citește înainte să descarce vrea să știe în ce se bagă. După
        descărcare, deasupra lor apare și butonul care deschide e-mailul cu
        adresa și subiectul deja scrise — altfel omul închide fila și își
        amintește săptămâna viitoare.
      */}
      {descarcat && (
        <div
          role="status"
          className="mt-6 colt-mic-b border-2 border-turcoaz-300 bg-turcoaz-50 p-5"
        >
          <p className="font-titlu font-bold text-turcoaz-900">
            Gata, contractul e la dumneavoastră.
          </p>
          <p className="mt-2 text-mic text-turcoaz-900/85">
            Semnați-l și trimiteți-ni-l înapoi. Butonul de mai jos deschide
            e-mailul cu adresa și subiectul deja scrise — rămâne doar să atașați
            documentul semnat.
          </p>
          <a
            href={`mailto:${EMAIL.contact}?subject=${encodeURIComponent(
              `Contract de sponsorizare semnat${denumire ? ` — ${denumire}` : ""}`,
            )}&body=${encodeURIComponent(
              `Bună ziua,\n\nAtașez contractul de sponsorizare semnat${
                denumire ? ` pentru ${denumire}` : ""
              }${cui ? `, CUI ${cui}` : ""}.\n\nCu stimă,\n`,
            )}`}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-turcoaz-600 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-turcoaz-700"
          >
            <Pictograma nume="plic" aria-hidden="true" className="size-5" />
            Trimite-l pe e-mail
          </a>
        </div>
      )}

      <ol className="mt-6 grid gap-3">
        {[
          "Deschideți documentul și verificați datele firmei. Orice e greșit se poate schimba direct în el.",
          "Semnați-l: cu certificatul calificat al firmei, în Adobe Reader sau în aplicația furnizorului, ori tipărit, cu pixul.",
          `Trimiteți-l la ${EMAIL.contact}. Îl contrasemnăm și vă trimitem înapoi, pe aceeași adresă, exemplarul semnat de amândoi.`,
        ].map((pas, i) => (
          <li key={pas} className="flex items-start gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-caramiziu-700 font-titlu text-nota font-bold text-hartie">
              {i + 1}
            </span>
            <span className="text-mic text-cerneala-moale">{pas}</span>
          </li>
        ))}
      </ol>

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
