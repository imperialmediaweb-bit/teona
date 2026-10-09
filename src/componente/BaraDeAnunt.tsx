"use client";

import { useSyncExternalStore } from "react";
import { SMS } from "@/date/asociatie";

const CHEIE = "teona:bara-anunt-inchisa";
const SCHIMBARE = "teona:bara-anunt-schimbata";

function aboneaza(reciteste: () => void) {
  window.addEventListener(SCHIMBARE, reciteste);
  return () => window.removeEventListener(SCHIMBARE, reciteste);
}

function citeste(): "inchisa" | "vizibila" {
  try {
    return sessionStorage.getItem(CHEIE) === "1" ? "inchisa" : "vizibila";
  } catch {
    // Navigare privată sau date de sit blocate: arătăm bara.
    return "vizibila";
  }
}

/**
 * Bara de anunț de deasupra meniului (12.2 din caietul de sarcini).
 *
 * „Vizitatorul o poate închide și nu mai reapare în aceeași vizită” — de aceea
 * `sessionStorage`, nu `localStorage`: la următoarea vizită apare din nou.
 *
 * La randarea pe server starea e „necunoscut”, deci bara nu intră în HTML. Așa
 * cine a închis-o n-o mai vede clipind la fiecare pagină. Prețul e că bara nu
 * apare fără JavaScript — acceptabil pentru un anunț, nu pentru conținut.
 */
export default function BaraDeAnunt() {
  const stare = useSyncExternalStore(
    aboneaza,
    citeste,
    () => "necunoscut" as const,
  );

  if (stare !== "vizibila") return null;

  function inchide() {
    try {
      sessionStorage.setItem(CHEIE, "1");
    } catch {
      // Dacă nu putem ține minte, bara reapare la navigare. Acceptabil.
    }
    window.dispatchEvent(new Event(SCHIMBARE));
  }

  return (
    <div className="doar-site relative bg-cerneala text-hartie">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5 pr-12 text-center sm:pr-4">
        <p className="text-mic">
          Trimite{" "}
          <strong className="font-semibold text-miere-300">
            {SMS.text} la {SMS.numar}
          </strong>{" "}
          <span className="text-hartie/70">
            · {SMS.sumaLunara} lunar, direct din telefon
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={inchide}
        aria-label="Închide anunțul"
        className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full text-hartie/60 transition hover:bg-hartie/10 hover:text-hartie"
      >
        <svg
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </div>
  );
}
