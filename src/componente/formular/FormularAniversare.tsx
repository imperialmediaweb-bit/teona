"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { LIMITE, OCAZII, POZA_MAXIM } from "@/date/aniversari";
import { RUTE } from "@/date/asociatie";
import Pictograma from "@/componente/Pictograma";
import Camp, {
  Eroare,
  claseButonTrimite,
  claseControl,
  claseControlGresit,
} from "./Camp";

/**
 * Formularul prin care cineva își face pagina de campanie.
 *
 * Două lucruri sunt scrise aici cu intenție, nu din grabă:
 *
 * 1. `method="post"` și `action` pe elementul `<form>`. Fără JavaScript, un
 *    formular fără ele se trimite prin GET, iar numele și e-mailul ajung în
 *    bara de adrese, în istoricul browserului și în jurnalele serverului.
 *    Pentru un formular care cere e-mail și o poză, asta nu e acceptabil.
 *
 * 2. Nimic nu promite că se publică imediat. Textul spune de la început că
 *    pagina e verificată de asociație înainte să apară — altfel omul o
 *    distribuie pe Facebook și dă de 404.
 */

type Erori = Partial<
  Record<
    | "ocazie"
    | "titlu"
    | "mesaj"
    | "nume"
    | "email"
    | "poza"
    | "link"
    | "acord"
    | "general",
    string
  >
>;

type Trimisa = { slug: string; jeton: string };

const MARIME_MAXIMA_TEXT = "6 MB";

export default function FormularAniversare() {
  const [erori, setErori] = useState<Erori>({});
  const [seTrimite, setSeTrimite] = useState(false);
  const [trimisa, setTrimisa] = useState<Trimisa | null>(null);
  const [numePoza, setNumePoza] = useState<string | null>(null);
  const [lungimeMesaj, setLungimeMesaj] = useState(0);
  const formular = useRef<HTMLFormElement>(null);

  async function trimite(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const date = new FormData(ev.currentTarget);
    const gasite: Erori = {};

    const sir = (nume: string) => String(date.get(nume) ?? "").trim();

    if (!sir("ocazie")) gasite.ocazie = "Alege ocazia campaniei.";
    if (!sir("titlu")) gasite.titlu = "Scrie un titlu pentru pagina ta.";
    if (!sir("mesaj"))
      gasite.mesaj = "Scrie câteva rânduri despre campania ta.";
    if (!sir("nume_public")) gasite.nume = "Scrie numele care apare pe pagină.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(sir("email")))
      gasite.email = "Introdu o adresă de e-mail validă.";

    const link = sir("link_galantom");
    if (link && !/^https:\/\/([a-z0-9-]+\.)*galantom\.ro\//i.test(link))
      gasite.link = "Linkul trebuie să fie o adresă de pe galantom.ro.";

    const poza = date.get("poza");
    if (poza instanceof File && poza.size > POZA_MAXIM)
      gasite.poza = `Poza e prea mare. Alege una de cel mult ${MARIME_MAXIMA_TEXT}.`;

    if (date.get("acord") !== "da")
      gasite.acord = "Bifează acordul pentru a continua.";

    setErori(gasite);
    if (Object.keys(gasite).length > 0) {
      formular.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
      return;
    }

    setSeTrimite(true);
    try {
      const raspuns = await fetch("/api/campanii", {
        method: "POST",
        body: date,
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        slug?: string;
        jeton?: string;
        mesaj?: string;
      };
      if (!raspuns.ok || !corp.slug) {
        setErori({
          general:
            corp.mesaj ??
            "Nu am putut trimite campania. Încearcă din nou peste câteva minute.",
        });
        return;
      }
      setTrimisa({ slug: corp.slug, jeton: corp.jeton ?? "" });
    } catch {
      setErori({
        general:
          "Nu am putut trimite campania. Verifică legătura la internet și încearcă din nou.",
      });
    } finally {
      setSeTrimite(false);
    }
  }

  if (trimisa) {
    return (
      <div
        role="status"
        className="granulatie colt-a border border-turcoaz-100 bg-turcoaz-50 p-7 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.7)] sm:p-9"
      >
        <span className="colt-mic-a flex size-12 items-center justify-center bg-turcoaz-500 text-hartie">
          <Pictograma nume="inima" className="size-6" />
        </span>
        <h3 className="mt-5 text-h3 text-cerneala">Am primit campania ta</h3>
        <p className="mt-3 text-amplu text-cerneala-moale">
          O verificăm și o publicăm, de obicei în aceeași zi lucrătoare. Îți
          scriem pe e-mail când e gata, cu linkul de distribuit.
        </p>
        <p className="mt-4 text-cerneala-moale">
          Până atunci îți poți vedea pagina, așa cum va arăta, la adresa asta —
          păstreaz-o, e doar a ta:
        </p>
        <p className="mt-2 break-all font-titlu font-bold text-turcoaz-700">
          {`/ziua-ta/${trimisa.slug}?jeton=${trimisa.jeton}`}
        </p>
        <Link
          href={`/ziua-ta/${trimisa.slug}?jeton=${trimisa.jeton}`}
          className={`${claseButonTrimite} mt-7 inline-flex w-auto`}
        >
          Vezi pagina ta
          <Pictograma nume="sageata" className="size-5" />
        </Link>
      </div>
    );
  }

  const clasa = (gresit?: string) =>
    `${claseControl} ${gresit ? claseControlGresit : ""}`;

  return (
    <form
      ref={formular}
      onSubmit={trimite}
      action="/api/campanii"
      method="post"
      encType="multipart/form-data"
      noValidate
      className="granulatie colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_26px_60px_-30px_rgba(35,35,35,0.4)] sm:p-8"
    >
      {/* Capcana pentru roboți: ascunsă și de ochi, și de cititoarele de ecran. */}
      <p className="hidden" aria-hidden="true">
        <label htmlFor="site_web">Nu completa acest câmp</label>
        <input
          id="site_web"
          name="site_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </p>

      <fieldset className="border-0 p-0">
        <legend className="mb-3 font-titlu text-mic font-bold text-cerneala">
          Ce sărbătorești? <span className="text-caramiziu-600">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {OCAZII.map((ocazie, i) => (
            <label
              key={ocazie.id}
              className="flex min-h-12 cursor-pointer items-center gap-3 colt-mic-a border border-hartie-umbra bg-hartie-calda px-4 py-3 font-titlu font-semibold text-cerneala transition-colors hover:border-caramiziu-300 hover:bg-tenta-cald has-checked:border-caramiziu-400 has-checked:bg-tenta-cald"
            >
              <input
                type="radio"
                name="ocazie"
                value={ocazie.id}
                defaultChecked={i === 0}
                className="size-5 accent-caramiziu-500"
              />
              {ocazie.eticheta}
            </label>
          ))}
        </div>
        <Eroare text={erori.ocazie} />
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Camp
          id="an-titlu"
          eticheta="Titlul paginii"
          obligatoriu
          nota="Apare mare, sus. De exemplu: „Împlinesc 30 de ani și îmi doresc o tabără pentru copii”."
          eroare={erori.titlu}
        >
          <input
            id="an-titlu"
            name="titlu"
            type="text"
            maxLength={LIMITE.titlu}
            aria-invalid={erori.titlu ? "true" : undefined}
            className={clasa(erori.titlu)}
          />
        </Camp>

        <Camp
          id="an-nume"
          eticheta="Numele care apare pe pagină"
          obligatoriu
          nota="Poate fi doar prenumele, dacă așa preferi."
          eroare={erori.nume}
        >
          <input
            id="an-nume"
            name="nume_public"
            type="text"
            maxLength={LIMITE.numePublic}
            autoComplete="name"
            aria-invalid={erori.nume ? "true" : undefined}
            className={clasa(erori.nume)}
          />
        </Camp>
      </div>

      <Camp
        id="an-mesaj"
        eticheta="Mesajul tău"
        obligatoriu
        nota="De ce ai ales asociația și ce le spui prietenilor tăi. Scrie cu cuvintele tale."
        eroare={erori.mesaj}
        className="mt-5"
      >
        <textarea
          id="an-mesaj"
          name="mesaj"
          rows={6}
          maxLength={LIMITE.mesaj}
          onChange={(ev) => setLungimeMesaj(ev.currentTarget.value.length)}
          aria-invalid={erori.mesaj ? "true" : undefined}
          className={clasa(erori.mesaj)}
        />
        <p className="mt-1.5 text-right text-nota text-cerneala-slab">
          {lungimeMesaj} / {LIMITE.mesaj}
        </p>
      </Camp>

      <Camp
        id="an-poza"
        eticheta="O poză"
        nota={`Apare pe pagină și, mai ales, în previzualizarea de pe Facebook și WhatsApp când distribui linkul. JPG, PNG sau WebP, cel mult ${MARIME_MAXIMA_TEXT}.`}
        eroare={erori.poza}
        className="mt-5"
      >
        <input
          id="an-poza"
          name="poza"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(ev) =>
            setNumePoza(ev.currentTarget.files?.[0]?.name ?? null)
          }
          aria-invalid={erori.poza ? "true" : undefined}
          className="block w-full cursor-pointer font-titlu text-mic text-cerneala-moale file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-tenta-cald file:px-5 file:py-3 file:font-titlu file:text-mic file:font-bold file:text-caramiziu-700 hover:file:bg-caramiziu-100"
        />
        {numePoza && (
          <p className="mt-2 text-mic text-cerneala-moale">
            Ai ales: {numePoza}
          </p>
        )}
      </Camp>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Camp
          id="an-data"
          eticheta="Data evenimentului"
          nota="Opțional. Apare pe pagină, ca prietenii tăi să știe până când."
        >
          <input
            id="an-data"
            name="data_evenimentului"
            type="date"
            className={claseControl}
          />
        </Camp>

        <Camp
          id="an-email"
          eticheta="E-mailul tău"
          obligatoriu
          nota="Aici îți scriem când pagina e gata. Nu apare pe pagină."
          eroare={erori.email}
        >
          <input
            id="an-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={erori.email ? "true" : undefined}
            className={clasa(erori.email)}
          />
        </Camp>
      </div>

      <Camp
        id="an-link"
        eticheta="Linkul paginii tale de pe Galantom"
        nota="Opțional, dar recomandat. Dacă ți-ai făcut o pagină pe Galantom, pune linkul aici: butonul „Donează” va duce acolo, iar donațiile se adună pe numele tău. Fără el, butonul duce la proiectul asociației."
        eroare={erori.link}
        className="mt-5"
      >
        <input
          id="an-link"
          name="link_galantom"
          type="url"
          inputMode="url"
          placeholder="https://dar.galantom.ro/..."
          maxLength={LIMITE.link}
          aria-invalid={erori.link ? "true" : undefined}
          className={clasa(erori.link)}
        />
      </Camp>

      <div className="mt-7 border-t border-hartie-umbra pt-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="acord"
            value="da"
            aria-invalid={erori.acord ? "true" : undefined}
            className="mt-1 size-5 shrink-0 accent-caramiziu-500"
          />
          <span className="text-mic text-cerneala-moale">
            Sunt de acord ca textul, poza și numele pe care le trimit să fie
            publicate pe site-ul asociației, după verificare, și ca e-mailul meu
            să fie folosit doar pentru a mă anunța despre campania asta. Pot
            cere oricând ștergerea paginii, scriind la{" "}
            <a
              href="mailto:contact@teona-ariana.ro"
              className="subliniat font-semibold text-caramiziu-700"
            >
              contact@teona-ariana.ro
            </a>
            . Am citit{" "}
            <Link
              href={RUTE.confidentialitate}
              className="subliniat font-semibold text-caramiziu-700"
            >
              politica de confidențialitate
            </Link>
            .
          </span>
        </label>
        <Eroare text={erori.acord} />
      </div>

      {erori.general && (
        <p
          role="alert"
          className="mt-6 colt-mic-a border border-caramiziu-200 bg-caramiziu-50 p-4 font-titlu font-semibold text-caramiziu-800"
        >
          {erori.general}
        </p>
      )}

      <button
        type="submit"
        disabled={seTrimite}
        className={`${claseButonTrimite} mt-7`}
      >
        {seTrimite ? "Se trimite…" : "Trimite campania spre verificare"}
      </button>

      <p className="mt-4 text-center text-mic text-cerneala-moale">
        Pagina nu apare imediat: o citește întâi cineva din asociație. De obicei
        durează câteva ore.
      </p>
    </form>
  );
}
