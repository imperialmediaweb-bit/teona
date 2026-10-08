"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ADRESE, EMAIL } from "@/date/asociatie";
import { abonareLaAcord, citesteAcord } from "@/lib/cookieuri";
import Pictograma from "../Pictograma";

/**
 * Formularul 230 completat direct pe site, prin formular230.ro (7.10).
 *
 * Asociația are cont acolo, iar site-ul vechi încorpora formularul exact așa:
 * un `<div class="f230ro-formular">` și scriptul lor, care pune în el un
 * iframe cu formularul, cu semnătură, fără nimic de printat. Caietul pune
 * formularul online în „etapa 2, după validare juridică și securizare” —
 * formular230.ro face exact asta ca serviciu, deci îl folosim pe al lor în loc
 * să construim unul. Noi nu atingem datele omului: le completează la ei.
 *
 * E un script de pe alt domeniu, și caietul e categoric la 12.5: „Nimic în
 * afara celor necesare nu se încarcă înainte de acord.” Deci scriptul **nu** se
 * încarcă la deschiderea paginii. Se încarcă doar dacă:
 *
 * - vizitatorul a apăsat „Acceptă toate” în bannerul de cookie-uri, sau
 * - a apăsat butonul de aici, care acceptă exact încărcarea acestui formular.
 *
 * Alegerea de aici se ține separat de acordul general, sub cheia ei, pentru
 * că nu e nici „statistici”, nici „marketing”: e un serviciu pe care omul l-a
 * cerut explicit. Nu bifăm în locul lui categorii pe care nu le-a cerut. Un
 * refuz dat **mai târziu** în banner o anulează: data acordului de aici se
 * compară cu data alegerii din banner.
 *
 * Scriptul lor nu spune niciodată că a eșuat. Aflăm singuri: dacă fișierul nu
 * se descarcă, sau dacă în 15 secunde nu apare niciun iframe în cutie, arătăm
 * un mesaj cinstit. În orice stare rămân vizibile căile alternative — hârtia
 * și Casa Teona — ca nimeni să nu rămână blocat dacă refuză sau dacă serviciul
 * e picat.
 */

const ADRESA_SCRIPT = "https://formular230.ro/share/3a4765710d7";
const CHEIE_ACORD_FORMULAR = "teona:acord-formular230";
const EVENIMENT_ACORD_FORMULAR = "teona:acord-formular230-salvat";
/** Cât așteptăm iframe-ul înainte să spunem că n-a mers. */
const ASTEPTARE_MAXIMA = 15_000;

declare global {
  interface Window {
    /** Ce lasă scriptul de la formular230.ro în pagină; doar ce folosim noi. */
    f230ro?: {
      frame: HTMLIFrameElement | null;
      getForm: (tinta?: Element) => void;
    };
  }
}

/**
 * Formularul are voie să se încarce?
 *
 * Șir, nu boolean, ca `useSyncExternalStore` să-l poată compara, la fel ca
 * `areAcord()` din `cookieuri.ts`.
 */
function formularPermis(): "1" | "0" {
  const acord = citesteAcord();
  if (acord?.statistici && acord.marketing) return "1";

  let propriu: string | null = null;
  try {
    propriu = localStorage.getItem(CHEIE_ACORD_FORMULAR);
  } catch {
    propriu = null;
  }
  if (!propriu) return "0";

  // Un refuz (sau orice altă alegere) dat în banner după acordul de aici îl
  // anulează: omul s-a răzgândit, și ultima alegere e cea care contează.
  return !acord || propriu > acord.laData ? "1" : "0";
}

function abonareLaFormular(reciteste: () => void) {
  const scoateAcord = abonareLaAcord(reciteste);
  window.addEventListener(EVENIMENT_ACORD_FORMULAR, reciteste);
  return () => {
    scoateAcord();
    window.removeEventListener(EVENIMENT_ACORD_FORMULAR, reciteste);
  };
}

function acceptaFormularul() {
  try {
    localStorage.setItem(CHEIE_ACORD_FORMULAR, new Date().toISOString());
  } catch {
    // Fără memorie, formularul se încarcă acum și se reîntreabă data viitoare.
    // Preferabil alternativei: să-l încărcăm fără acord.
  }
  window.dispatchEvent(new Event(EVENIMENT_ACORD_FORMULAR));
}

type Stare = "incarca" | "gata" | "eroare";

export default function Formular230({
  /** Unde duce „descarcă formularul”: secțiunea de documente a paginii. */
  linkDescarcare = "#documente",
}: {
  linkDescarcare?: string;
}) {
  // Pe server nu știm ce a ales omul: HTML-ul nu conține nici blocul de acord,
  // nici cutia formularului, ca să nu clipească pentru cine a ales deja.
  const permis = useSyncExternalStore(
    abonareLaFormular,
    formularPermis,
    () => "necunoscut",
  );

  const [stare, setStare] = useState<Stare>("incarca");
  // Când acordul se schimbă (din banner sau de aici), pornim de la zero: o
  // eroare veche nu are ce căuta peste o încărcare nouă.
  const [permisAnterior, setPermisAnterior] = useState(permis);
  if (permis !== permisAnterior) {
    setPermisAnterior(permis);
    setStare("incarca");
  }
  const [incercare, setIncercare] = useState(0);

  const cutie = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (permis !== "1") return;
    const tinta = cutie.current;
    if (!tinta) return;

    let terminat = false;
    const gata = () => {
      if (terminat) return;
      terminat = true;
      setStare("gata");
    };
    const esuat = () => {
      if (terminat) return;
      terminat = true;
      setStare("eroare");
    };

    // Scriptul nu anunță nimic; singurul semn că a mers e iframe-ul din cutie.
    const observator = new MutationObserver(() => {
      if (tinta.querySelector("iframe")) gata();
    });
    observator.observe(tinta, { childList: true });
    const ceas = window.setTimeout(esuat, ASTEPTARE_MAXIMA);

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${ADRESA_SCRIPT}"]`,
    );
    const scriptEsuat = () => {
      // Un script picat rămâne în pagină ca un `<script>` mort; îl scoatem,
      // ca „Încearcă din nou” să-l poată cere iar, nu să găsească eticheta
      // veche și să aștepte degeaba.
      script?.remove();
      esuat();
    };

    if (window.f230ro) {
      // Scriptul a rulat deja (de pildă la o întoarcere pe pagină): cutia e
      // nouă, deci îi cerem formularul direct, fără al doilea script.
      window.f230ro.getForm(tinta);
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = ADRESA_SCRIPT;
        script.async = true;
        document.body.appendChild(script);
      }
      // Dacă scriptul e deja în pagină dar n-a rulat încă (montare dublă),
      // nu adăugăm altul: când rulează, își găsește singur cutia.
      script.addEventListener("error", scriptEsuat);
    }

    return () => {
      terminat = true;
      observator.disconnect();
      window.clearTimeout(ceas);
      script?.removeEventListener("error", scriptEsuat);

      // Scriptul ține minte iframe-ul și îi scrie la fiecare derulare. Dacă
      // cutia dispare și el nu află, la prima derulare dă eroare în consolă.
      const lor = window.f230ro;
      if (lor?.frame && tinta.contains(lor.frame)) {
        lor.frame.remove();
        lor.frame = null;
      }
    };
  }, [permis, incercare]);

  return (
    <div className="grid gap-5">
      {permis === "0" && (
        <section
          aria-labelledby="formular230-acord"
          className="granulatie relative overflow-hidden colt-a bg-miere-400 p-6 text-cerneala shadow-[0_28px_56px_-26px_rgba(255,172,0,0.9)] sm:p-8"
        >
          <span className="colt-mic-a relative flex size-12 items-center justify-center bg-cerneala/10 text-cerneala">
            <Pictograma nume="document" className="size-6" />
          </span>
          <h3
            id="formular230-acord"
            className="relative mt-5 text-h3 text-miere-900"
          >
            Completează Formularul 230 direct aici
          </h3>
          <p className="relative mt-3 max-w-2xl text-corp text-miere-900/85">
            Formularul vine de la <strong>formular230.ro</strong>, un serviciu
            din afara site-ului nostru. Îl completezi și îl semnezi pe ecran,
            fără să printezi nimic. Ca să-l încărcăm, trebuie să accepți
            cookie-urile pe care le folosește formular230.ro.
          </p>
          <button
            type="button"
            onClick={acceptaFormularul}
            className="relative mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-caramiziu-500 px-7 py-3 font-titlu text-corp font-semibold text-hartie shadow-[0_14px_30px_-12px_rgba(247,79,34,0.9)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:bg-caramiziu-600 motion-reduce:hover:translate-y-0"
          >
            Accept și încarcă formularul
            <Pictograma nume="sageata" className="size-4" />
          </button>
        </section>
      )}

      {permis === "1" && (
        <section
          aria-labelledby="formular230-titlu"
          className="colt-a border border-hartie-umbra bg-hartie p-4 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] sm:p-6"
        >
          <h3 id="formular230-titlu" className="sr-only">
            Formularul 230
          </h3>

          {stare === "incarca" && (
            <p
              role="status"
              className="flex min-h-40 items-center justify-center gap-3 text-mic text-cerneala-moale"
            >
              <span
                aria-hidden="true"
                className="size-5 shrink-0 animate-spin rounded-full border-2 border-caramiziu-200 border-t-caramiziu-500"
              />
              Se încarcă formularul de la formular230.ro…
            </p>
          )}

          {stare === "eroare" && (
            <div role="alert" className="colt-mic-a bg-caramiziu-50 p-5">
              <p className="font-titlu text-amplu font-bold text-cerneala">
                Formularul nu s-a putut încărca
              </p>
              <p className="mt-2 text-mic text-cerneala-moale">
                Nu am primit răspuns de la formular230.ro. Poate fi conexiunea
                ta sau serviciul lor. Poți încerca din nou sau poți folosi una
                dintre căile de mai jos — formularul e același.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStare("incarca");
                  setIncercare((n) => n + 1);
                }}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-cerneala/15 bg-hartie px-5 py-2 font-titlu text-mic font-semibold text-cerneala transition-all duration-200 ease-cald hover:border-caramiziu-500 hover:text-caramiziu-600"
              >
                Încearcă din nou
              </button>
            </div>
          )}

          {/*
            Cutia stă în pagină cât timp avem acord, chiar și în timpul
            încărcării sau după o eroare: scriptul o caută o singură dată, când
            rulează, și dacă n-o găsește atunci deschide formularul ca fereastră
            peste pagină, nu aici.
          */}
          <div
            ref={cutie}
            className={`f230ro-formular [&_iframe]:block [&_iframe]:w-full [&_iframe]:border-0 ${
              stare === "gata" ? "" : "hidden"
            }`}
          />
        </section>
      )}

      {/* Căile alternative — mereu, în orice stare. */}
      <section
        aria-labelledby="formular230-altfel"
        className="colt-b bg-hartie-calda p-6 shadow-[0_18px_38px_-22px_rgba(35,35,35,0.45)] sm:p-7"
      >
        <h3 id="formular230-altfel" className="text-h4 text-cerneala">
          Preferi pe hârtie?
        </h3>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          <li className="flex items-start gap-4">
            <span className="colt-mic-b flex size-11 shrink-0 items-center justify-center bg-caramiziu-100 text-caramiziu-600">
              <Pictograma nume="document" className="size-5" />
            </span>
            <p className="text-mic text-cerneala-moale">
              <a
                href={linkDescarcare}
                className="inline-block min-h-10 font-titlu text-corp font-bold text-caramiziu-600 underline-offset-4 hover:underline"
              >
                Descarcă formularul
              </a>
              <span className="block">
                Îl completezi, îl semnezi și ni-l trimiți la{" "}
                <a
                  href={`mailto:${EMAIL.redirectionare}`}
                  className="font-semibold text-cerneala underline underline-offset-2"
                >
                  {EMAIL.redirectionare}
                </a>
                .
              </span>
            </p>
          </li>
          <li className="flex items-start gap-4">
            <span className="colt-mic-a flex size-11 shrink-0 items-center justify-center bg-turcoaz-100 text-turcoaz-600">
              <Pictograma nume="harta" className="size-5" />
            </span>
            <p className="text-mic text-cerneala-moale">
              <a
                href={ADRESE.casaTeona.harta}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block min-h-10 font-titlu text-corp font-bold text-caramiziu-600 underline-offset-4 hover:underline"
              >
                Vino la Casa Teona
              </a>
              <span className="block">
                {ADRESE.casaTeona.strada}, {ADRESE.casaTeona.oras}.{" "}
                {ADRESE.casaTeona.program}. Îl completăm împreună, pe loc.
              </span>
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
