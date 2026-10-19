"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EMAIL, RETELE_ASOCIATIE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import Decor from "../Decor";
import Pictograma from "../Pictograma";
import { PictogramaRetea } from "../Retele";
import Camp, {
  Bifa,
  Optiuni,
  claseButonInapoi,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

type Erori = Partial<Record<"nume" | "email" | "nastere" | "acord", string>>;

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "reusit"; prenume: string }
  | { fel: "eroare"; mesaj: string };

/** Cei trei pași, în ordinea câmpurilor din caiet (11.4). */
const PASI = [
  { titlu: "Despre tine", text: "Cum te cheamă și cum te găsim." },
  { titlu: "Experiența ta", text: "Ce ai făcut până acum și cât timp ai." },
  { titlu: "Motivația ta", text: "De ce vrei să fii alături de copii." },
] as const;

/** Câmpurile din fiecare pas, ca eroarea să ducă la pasul potrivit. */
const CAMPURI_PE_PAS: ReadonlyArray<ReadonlyArray<keyof Erori>> = [
  ["nume", "email", "nastere"],
  [],
  ["acord"],
];

const AFLAT = [
  "Facebook sau Instagram",
  "De la un prieten sau din familie",
  "De la școală sau facultate",
  "Din presă",
  "Altfel",
] as const;

/**
 * Vârsta împlinită la data de azi, calculată din data nașterii.
 *
 * Nu împărțim diferența de milisecunde la durata unui an: anii bisecți și
 * schimbările de oră fac rezultatul să greșească cu o zi exact în jurul zilei
 * de naștere — adică exact unde contează. Comparăm luna și ziua.
 */
function varsta(nastere: Date, azi: Date): number {
  let ani = azi.getFullYear() - nastere.getFullYear();
  const inainteDeZi =
    azi.getMonth() < nastere.getMonth() ||
    (azi.getMonth() === nastere.getMonth() &&
      azi.getDate() < nastere.getDate());
  if (inainteDeZi) ani -= 1;
  return ani;
}

const LUNILE = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/** Câte zile are luna aleasă. Fără an, februarie primește 29 — nu tăiem o zi. */
function cateZile(luna: string, an: string): number {
  if (!luna) return 31;
  if (!an)
    return luna === "2" ? 29 : [4, 6, 9, 11].includes(Number(luna)) ? 30 : 31;
  return new Date(Number(an), Number(luna), 0).getDate();
}

/**
 * Formularul de voluntariat (11.4), în trei pași.
 *
 * Câmpurile cerute de caiet sunt toate aici, în ordinea de acolo: nume și
 * prenume, email, telefon, data nașterii, voluntariat înainte, cât timp,
 * de ce, acord, Trimite. Pașii doar le grupează; nu schimbă nici ordinea,
 * nici obligativitatea. Câmpurile în plus (localitate, experiență cu copiii,
 * limbi, permis, cum a aflat) sunt toate opționale și nu întreabă niciodată
 * **unde** sau **ce** vrea să facă omul: caietul e explicit la 11.4 —
 * „voluntarii nu aleg ce fac”.
 *
 * Toți cei trei pași stau în același `<form>`, cu cei inactivi ascunși prin
 * `hidden`: `FormData` îi citește pe toți la trimitere, iar o valoare scrisă
 * la pasul 1 nu se pierde când omul merge la pasul 3 și înapoi.
 *
 * Verificarea vârstei se face în browser, înainte de trimitere, așa cum cere
 * caietul: „Dacă data nașterii arată sub [vârsta minimă], formularul nu se trimite și
 * apare mesajul de mai jos.” Mesajul e cel scris de asociație, cuvânt cu
 * cuvânt — e un refuz care trebuie să sune a bun venit, nu a eroare. Se
 * verifică la ieșirea din primul pas, ca omul să nu completeze degeaba
 * restul, și încă o dată la trimitere.
 */
export default function FormularVoluntar() {
  const id = useId();
  const formular = useRef<HTMLFormElement>(null);
  const titluriPasi = useRef<Array<HTMLHeadingElement | null>>([]);
  const [pas, setPas] = useState(0);
  /*
    Data nașterii se alege din trei liste, nu dintr-un calendar.

    `<input type="date">` părea alegerea firească și a fost greșită. Calendarul
    e al browserului: își ia limba și ordinea din setările lui (10/24/2026 pe
    un browser pe engleză), se deschide pe anul curent și, ca să ajungi la
    1990, derulezi treizeci și ceva de ani unul câte unul. Pentru o zi de
    naștere — singura dată din formular care e **sigur** în trecut, cu zeci de
    ani în urmă — e cel mai prost câmp cu putință. `min` și `max` n-au salvat
    nimic: lista tot de la anul curent pornea.

    Trei liste nu pot fi greșit citite, nu depind de limba browserului și pun
    anul la a doua apăsare. Anii merg descrescător, cu cei recenți primii.

    Formularul trimite mai departe tot `nastere`, în forma `2006-10-24`, dintr-un
    câmp ascuns: ce se întâmplă mai departe — verificarea de 16 ani, salvarea —
    rămâne neschimbat.
  */
  const [zi, setZi] = useState("");
  const [luna, setLuna] = useState("");
  const [an, setAn] = useState("");
  /*
    Anii se fac în `useEffect`: `new Date()` în timpul randării e o valoare
    care se schimbă de la o secundă la alta, iar Next refuză să pregenereze
    pagina cu ea.
  */
  const [ani, setAni] = useState<number[]>([]);

  useEffect(() => {
    const acum = new Date().getFullYear();
    setAni(Array.from({ length: 111 }, (_, i) => acum - i));
  }, []);

  const nastere =
    an && luna && zi
      ? `${an}-${luna.padStart(2, "0")}-${zi.padStart(2, "0")}`
      : "";
  const [erori, setErori] = useState<Erori>({});
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  function verifica(date: FormData): Erori {
    const gasite: Erori = {};
    const nume = String(date.get("nume") ?? "").trim();
    const email = String(date.get("email") ?? "").trim();
    const nastere = String(date.get("nastere") ?? "");

    if (nume.length < 3) gasite.nume = "Scrie-ți numele și prenumele.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      gasite.email = "Introdu o adresă de e-mail validă.";

    if (!nastere) {
      gasite.nastere = "Completează data nașterii.";
    } else {
      const data = new Date(`${nastere}T00:00:00`);
      if (Number.isNaN(data.getTime())) {
        gasite.nastere = "Completează o dată validă.";
      } else if (varsta(data, new Date()) < 16) {
        gasite.nastere =
          "Ne bucurăm că vrei să te implici! Deocamdată putem primi voluntari doar de la 16 ani.";
      }
    }

    if (date.get("acord") !== "da")
      gasite.acord = "Bifează acordul pentru a continua.";

    return gasite;
  }

  /** Doar erorile câmpurilor dintr-un pas. */
  function eroriPas(toate: Erori, index: number): Erori {
    const alese: Erori = {};
    for (const camp of CAMPURI_PE_PAS[index]) {
      if (toate[camp]) alese[camp] = toate[camp];
    }
    return alese;
  }

  function mergiLa(index: number) {
    setPas(index);
    // Focalizarea trece pe titlul pasului: cititorul de ecran anunță unde
    // a ajuns, iar tastatura continuă de acolo, nu de la începutul paginii.
    requestAnimationFrame(() => titluriPasi.current[index]?.focus());
  }

  function continua() {
    if (!formular.current) return;
    const gasite = eroriPas(verifica(new FormData(formular.current)), pas);
    setErori(gasite);
    if (Object.keys(gasite).length > 0) return;
    mergiLa(pas + 1);
  }

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    const gasite = verifica(date);
    setErori(gasite);
    if (Object.keys(gasite).length > 0) {
      const primul = CAMPURI_PE_PAS.findIndex((campuri) =>
        campuri.some((camp) => gasite[camp]),
      );
      if (primul >= 0 && primul !== pas) mergiLa(primul);
      return;
    }

    const nume = String(date.get("nume") ?? "").trim();
    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fel: "voluntariat",
          nume,
          email: String(date.get("email") ?? "").trim(),
          telefon: date.get("telefon"),
          nastere: date.get("nastere"),
          localitate: date.get("localitate"),
          experienta: date.get("experienta"),
          disponibilitate: date.get("disponibilitate"),
          experientaCopii: date.get("experienta-copii"),
          limbi: date.get("limbi"),
          permis: date.get("permis"),
          motiv: date.get("motiv"),
          aflat: date.get("aflat"),
          acord: true,
        }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        mesaj?: string;
      };
      if (!raspuns.ok) {
        setStare({
          fel: "eroare",
          mesaj:
            corp.mesaj ?? "Nu am putut trimite formularul. Încearcă din nou.",
        });
        return;
      }
      setStare({ fel: "reusit", prenume: nume.split(" ")[0] });
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
        id="formular"
        className="relative scroll-mt-32 overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_30px_60px_-28px_rgba(42,159,163,0.6)]"
      >
        <div className="granulatie relative overflow-hidden bg-gradient-to-br from-turcoaz-600 to-turcoaz-800 px-7 pt-10 pb-12 text-hartie sm:px-10">
          <Decor
            semn="stea"
            strokeWidth={0.8}
            className="absolute -top-10 -right-8 size-40 text-hartie/20"
          />
          <Decor
            semn="soare"
            className="pluteste-lent absolute bottom-6 right-[12%] size-10 text-hartie/40"
          />
          <span className="relative flex size-16 items-center justify-center colt-mic-b bg-hartie text-turcoaz-600 shadow-[0_16px_32px_-14px_rgba(35,35,35,0.4)]">
            <svg
              viewBox="0 0 24 24"
              className="size-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="scris relative mt-6 text-amplu text-hartie/85">
            Culegătorii de Zâmbete
          </p>
          <h3 className="relative mt-2 text-h2 text-hartie">
            Mulțumim, {stare.prenume}!
          </h3>
          <p className="relative mt-3 max-w-md text-amplu text-hartie/90">
            Am primit formularul tău. Te contactăm în curând.
          </p>
        </div>
        <div className="p-7 sm:p-10">
          <p className="text-cerneala-moale">
            Până atunci, ne găsești pe Facebook și Instagram.
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {RETELE_ASOCIATIE.filter((r) => r.nume !== "TikTok").map(
              (retea) => (
                <li key={retea.nume}>
                  <a
                    href={retea.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-cerneala/15 px-5 py-2 font-titlu text-mic font-semibold text-cerneala transition hover:border-caramiziu-500 hover:text-caramiziu-700"
                  >
                    <PictogramaRetea nume={retea.nume} className="size-5" />
                    {retea.nume}
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formular}
      onSubmit={trimite}
      noValidate
      id="formular"
      className="relative scroll-mt-32 overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.5)]"
    >
      {/* Firul pașilor: unde ești și cât mai e. */}
      <ol className="granulatie relative grid grid-cols-3 gap-2 overflow-hidden bg-gradient-to-br from-caramiziu-700 to-caramiziu-900 px-4 py-5 text-hartie sm:px-7">
        <Decor
          semn="unda"
          strokeWidth={0.9}
          className="absolute -right-8 -bottom-10 size-36 text-hartie/15"
        />
        {PASI.map((p, i) => {
          const facut = i < pas;
          const activ = i === pas;
          return (
            <li
              key={p.titlu}
              aria-current={activ ? "step" : undefined}
              className={`relative flex items-center gap-2.5 transition-opacity duration-300 ${
                activ || facut ? "opacity-100" : "opacity-60"
              }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full font-titlu text-mic font-extrabold transition-colors duration-300 ${
                  activ
                    ? "bg-hartie text-caramiziu-700 shadow-[0_8px_18px_-8px_rgba(35,35,35,0.5)]"
                    : facut
                      ? "bg-miere-400 text-cerneala"
                      : "border-2 border-hartie/60 text-hartie"
                }`}
              >
                {facut ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden min-w-0 font-titlu text-mic leading-tight font-bold sm:block">
                {p.titlu}
                <span className="sr-only">
                  {facut ? " (completat)" : activ ? " (pasul curent)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="p-6 sm:p-8">
        {PASI.map((p, i) => (
          <div key={p.titlu} hidden={i !== pas} className="grid gap-5">
            <div>
              <p className="font-titlu text-nota font-bold tracking-wider text-caramiziu-700 uppercase">
                Pasul {i + 1} din {PASI.length}
              </p>
              <h3
                ref={(el) => {
                  titluriPasi.current[i] = el;
                }}
                tabIndex={-1}
                className="mt-1 text-h3 text-cerneala outline-none"
              >
                {p.titlu}
              </h3>
              <p className="mt-1 text-cerneala-moale">{p.text}</p>
            </div>

            {i === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Camp
                  id={`${id}-nume`}
                  eticheta="Nume și prenume"
                  obligatoriu
                  eroare={erori.nume}
                  className="sm:col-span-2"
                >
                  <input
                    id={`${id}-nume`}
                    name="nume"
                    type="text"
                    autoComplete="name"
                    aria-invalid={Boolean(erori.nume)}
                    aria-describedby={
                      erori.nume ? `${id}-nume-eroare` : undefined
                    }
                    className={erori.nume ? claseControlGresit : claseControl}
                  />
                </Camp>

                <Camp
                  id={`${id}-email`}
                  eticheta="Email"
                  obligatoriu
                  eroare={erori.email}
                >
                  <input
                    id={`${id}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(erori.email)}
                    aria-describedby={
                      erori.email ? `${id}-email-eroare` : undefined
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

                <Camp
                  id={`${id}-nastere-zi`}
                  eticheta="Data nașterii"
                  obligatoriu
                  nota="Folosim data nașterii pentru a verifica vârsta minimă."
                  eroare={erori.nastere}
                >
                  <input type="hidden" name="nastere" value={nastere} />
                  {/*
                    Grilă cu lățimi fixe, nu `flex`.

                    Cu `flex-1` pe lună, lista se strivea la două degete și
                    „septembrie" nu se mai vedea: alături are două liste cu
                    lățime proprie, iar spațiul rămas dintr-o coloană de
                    formular nu-i ajungea. Aici ziua și anul primesc exact cât
                    le trebuie, luna ia tot restul.

                    Pe telefon se așază una sub alta. Pe 390 px, coloana are
                    290: după ziua și anul rămâneau 90 pentru lună, adică
                    „septen". Trei liste pline, una sub alta, se citesc întregi
                    și se apasă la fel de repede.
                  */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[5rem_1fr_6.5rem]">
                    <select
                      id={`${id}-nastere-zi`}
                      aria-label="Ziua nașterii"
                      value={zi}
                      onChange={(e) => setZi(e.target.value)}
                      aria-invalid={Boolean(erori.nastere)}
                      aria-describedby={
                        erori.nastere
                          ? `${id}-nastere-eroare`
                          : `${id}-nastere-nota`
                      }
                      className={`${
                        erori.nastere ? claseControlGresit : claseControl
                      } min-w-0 px-2`}
                    >
                      <option value="">Ziua</option>
                      {Array.from(
                        { length: cateZile(luna, an) },
                        (_, i) => i + 1,
                      ).map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Luna nașterii"
                      value={luna}
                      onChange={(e) => setLuna(e.target.value)}
                      className={`${
                        erori.nastere ? claseControlGresit : claseControl
                      } min-w-0 px-2`}
                    >
                      <option value="">Luna</option>
                      {LUNILE.map((nume, i) => (
                        <option key={nume} value={i + 1}>
                          {nume}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Anul nașterii"
                      value={an}
                      onChange={(e) => setAn(e.target.value)}
                      className={`${
                        erori.nastere ? claseControlGresit : claseControl
                      } min-w-0 px-2`}
                    >
                      <option value="">Anul</option>
                      {ani.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </Camp>

                <Camp id={`${id}-localitate`} eticheta="Localitatea">
                  <input
                    id={`${id}-localitate`}
                    name="localitate"
                    type="text"
                    autoComplete="address-level2"
                    className={claseControl}
                  />
                </Camp>
              </div>
            )}

            {i === 1 && (
              <div className="grid gap-6">
                <Optiuni
                  name="experienta"
                  legenda="Ai mai făcut voluntariat înainte?"
                  obligatoriu
                  defaultValue="Nu"
                  optiuni={[
                    {
                      valoare: "Da",
                      eticheta: "Da",
                      descriere: "Am mai fost voluntar.",
                    },
                    {
                      valoare: "Nu",
                      eticheta: "Nu",
                      descriere: "Ar fi prima dată.",
                    },
                  ]}
                />

                <Optiuni
                  name="disponibilitate"
                  legenda="Cât timp poți dedica?"
                  obligatoriu
                  defaultValue="Ocazional"
                  coloane={3}
                  optiuni={[
                    { valoare: "Zilnic", eticheta: "Zilnic" },
                    { valoare: "Săptămânal", eticheta: "Săptămânal" },
                    { valoare: "Ocazional", eticheta: "Ocazional" },
                  ]}
                />

                <Optiuni
                  name="experienta-copii"
                  legenda="Ai lucrat sau ai stat cu copii până acum?"
                  nota="În familie, la școală, într-o tabără — orice contează."
                  optiuni={[
                    { valoare: "Da", eticheta: "Da" },
                    { valoare: "Nu", eticheta: "Nu încă" },
                  ]}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Camp
                    id={`${id}-limbi`}
                    eticheta="Limbi străine"
                    nota="Unii copii și părinți vorbesc altă limbă."
                  >
                    <input
                      id={`${id}-limbi`}
                      name="limbi"
                      type="text"
                      className={claseControl}
                    />
                  </Camp>

                  <Optiuni
                    name="permis"
                    legenda="Ai permis de conducere?"
                    optiuni={[
                      { valoare: "Da", eticheta: "Da" },
                      { valoare: "Nu", eticheta: "Nu" },
                    ]}
                  />
                </div>
              </div>
            )}

            {i === 2 && (
              <div className="grid gap-5">
                <Camp
                  id={`${id}-motiv`}
                  eticheta="De ce vrei să devii voluntar?"
                >
                  <textarea
                    id={`${id}-motiv`}
                    name="motiv"
                    rows={5}
                    className={`${claseControl} resize-y`}
                  />
                </Camp>

                <Camp id={`${id}-aflat`} eticheta="Cum ai aflat de asociație?">
                  <select
                    id={`${id}-aflat`}
                    name="aflat"
                    defaultValue=""
                    className={claseControl}
                  >
                    <option value="">Alege, dacă vrei</option>
                    {AFLAT.map((varianta) => (
                      <option key={varianta} value={varianta}>
                        {varianta}
                      </option>
                    ))}
                  </select>
                </Camp>

                <Bifa name="acord" obligatoriu eroare={erori.acord}>
                  Sunt de acord ca Asociația Teona Ariana să-mi prelucreze
                  datele personale pentru a mă contacta în legătură cu
                  activitatea de voluntariat.
                </Bifa>
              </div>
            )}
          </div>
        ))}

        {stare.fel === "eroare" && (
          <p
            role="alert"
            className="mt-5 colt-mic-a border-2 border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900"
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
              href={`tel:${TELEFON_PRINCIPAL.apel}`}
              className="font-semibold underline underline-offset-2"
            >
              {TELEFON_PRINCIPAL.afisat}
            </a>
            .
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-hartie-umbra pt-6">
          {pas > 0 ? (
            <button
              type="button"
              onClick={() => mergiLa(pas - 1)}
              className={claseButonInapoi}
            >
              <Pictograma nume="sageata" className="size-4 rotate-180" />
              Înapoi
            </button>
          ) : (
            <span className="text-nota text-cerneala-slab">
              Durează câteva minute.
            </span>
          )}

          {pas < PASI.length - 1 ? (
            <button
              type="button"
              onClick={continua}
              className={claseButonTrimite}
            >
              Continuă
              <Pictograma nume="sageata" className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={stare.fel === "trimite"}
              className={claseButonTrimite}
            >
              {stare.fel === "trimite" ? "Se trimite…" : "Trimite"}
              <Pictograma nume="sageata" className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
