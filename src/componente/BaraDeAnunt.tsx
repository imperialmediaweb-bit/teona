"use client";

import { useSyncExternalStore } from "react";
import { SMS } from "@/date/asociatie";

const CHEIE = "teona:bara-anunt-inchisa";
const SCHIMBARE = "teona:bara-anunt-schimbata";

function aboneaza(reciteste: () => void) {
  window.addEventListener(SCHIMBARE, reciteste);
  return () => window.removeEventListener(SCHIMBARE, reciteste);
}

/**
 * Ce crede serverul. Mereu „vizibilă”, ca bara să intre în HTML și să-și
 * țină locul; cine a închis-o o are deja ascunsă de scriptul din `<head>`.
 */
const SNAPSHOT_SERVER = () => "vizibila" as const;

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
 * **De ce intră în HTML, deși serverul nu știe dacă a fost închisă.**
 * Înainte, starea pe server era „necunoscut” și bara nu se scria deloc:
 * apărea abia după ce pornea JavaScriptul și împingea toată pagina în jos cu
 * 45 de pixeli (70 pe telefon). Pentru toată lumea, la fiecare pagină — ca să
 * nu clipească pentru cei care o închiseseră. Schimb prost: saltul îl simte
 * oricine apasă un buton în secunda aceea, iar Google îl numără la CLS.
 *
 * Acum bara se scrie pe server, iar cei care au închis-o n-o văd totuși: în
 * `<head>` e un script de două rânduri care citește `sessionStorage` **înainte
 * de prima desenare** și pune o clasă pe `<html>`; CSS-ul o ascunde pe baza
 * ei. Fără clipire și fără salt, în ambele cazuri. Când React pornește,
 * `useSyncExternalStore` ajunge la aceeași concluzie și scoate bara din DOM —
 * dar ea era deja invizibilă, deci nimic nu se mișcă.
 *
 * Fără JavaScript bara rămâne vizibilă și nu se poate închide. Dinainte nici
 * nu apărea, deci nu se pierde nimic.
 */
export default function BaraDeAnunt() {
  const stare = useSyncExternalStore(aboneaza, citeste, SNAPSHOT_SERVER);

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
    <div data-bara-anunt className="doar-site relative bg-cerneala text-hartie">
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
