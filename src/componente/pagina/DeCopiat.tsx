"use client";

import { useState } from "react";

/**
 * Un IBAN (sau alt dat oficial) cu buton „Copiază” — cerut la 2.3, 7.8 și 8.7.
 *
 * Caietul e explicit: „fiecare IBAN este text care se poate selecta (nu
 * imagine)”. Deci textul rămâne text, cu `select-all` ca un clic să-l prindă
 * întreg, iar butonul e un plus, nu singura cale.
 *
 * Dacă `navigator.clipboard` nu există sau e refuzat (se întâmplă pe http sau
 * cu permisiuni blocate), butonul spune cinstit că n-a putut și textul rămâne
 * selectabil cu mâna. Nu afișăm „Copiat!” pentru ceva ce nu s-a copiat.
 */
export default function DeCopiat({
  eticheta,
  valoare,
  /** Ce se copiază, dacă diferă de ce se afișează (IBAN fără spații). */
  deCopiat,
}: {
  eticheta: string;
  valoare: string;
  deCopiat?: string;
}) {
  const [stare, setStare] = useState<"gol" | "copiat" | "eroare">("gol");

  async function copiaza() {
    try {
      await navigator.clipboard.writeText(deCopiat ?? valoare);
      setStare("copiat");
      setTimeout(() => setStare("gol"), 2500);
    } catch {
      setStare("eroare");
    }
  }

  return (
    <div className="colt-mic-a flex flex-col gap-3 bg-hartie p-4 shadow-[0_12px_28px_-20px_rgba(35,35,35,0.5)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <span className="block font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
          {eticheta}
        </span>
        <span className="block font-titlu text-amplu font-bold break-words text-cerneala select-all">
          {valoare}
        </span>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={copiaza}
          className="inline-flex items-center gap-2 rounded-full border-2 border-cerneala/15 bg-hartie px-4 py-2 font-titlu text-mic font-semibold text-cerneala transition-all duration-200 ease-cald hover:border-caramiziu-500 hover:text-caramiziu-600"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="11" height="11" rx="2.5" />
            <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15" />
          </svg>
          {stare === "copiat" ? "Copiat" : "Copiază"}
        </button>
        <span role="status" className="sr-only">
          {stare === "copiat" ? `${eticheta} a fost copiat.` : ""}
        </span>
        {stare === "eroare" && (
          <p className="mt-1.5 max-w-[14rem] text-nota text-caramiziu-700">
            Nu am putut copia automat. Selectează textul și copiază-l cu mâna.
          </p>
        )}
      </div>
    </div>
  );
}
