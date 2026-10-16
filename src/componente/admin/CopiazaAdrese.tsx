"use client";

import { useState } from "react";

/**
 * Adresele redacțiilor, de copiat dintr-o apăsare.
 *
 * **De ce copiere și nu trimitere din panou.** Un comunicat trimis de
 * serverul nostru către opt redacții deodată arată, pentru filtrele lor, ca
 * un mesaj în masă de la o adresă necunoscută — și ajunge în spam exact la
 * cei pe care vrei să-i prinzi. Trimis din Gmail-ul asociației, de la un om
 * cu nume, pleacă de la o adresă pe care ziaristul a mai văzut-o.
 *
 * Adresele intră la **Bcc**, nu la „Către": un comunicat în care fiecare
 * redacție vede că a mai primit alte șapte e tratat ca atare.
 */
export default function CopiazaAdrese({ adrese }: { adrese: string[] }) {
  const [stare, setStare] = useState<"gol" | "copiat" | "eroare">("gol");
  const sir = adrese.join(", ");

  async function copiaza() {
    try {
      await navigator.clipboard.writeText(sir);
      setStare("copiat");
      setTimeout(() => setStare("gol"), 2500);
    } catch {
      setStare("eroare");
    }
  }

  if (adrese.length === 0) {
    return (
      <p className="text-mic text-cerneala-moale">
        Nicio adresă completată încă.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={copiaza}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
      >
        {stare === "copiat"
          ? "Copiat"
          : `Copiază cele ${adrese.length} adrese`}
      </button>
      {stare === "eroare" && (
        <p role="alert" className="mt-2 text-nota text-caramiziu-800">
          Browserul n-a lăsat copierea. Selectează-le de mai jos, cu mâna.
        </p>
      )}
      <p className="mt-3 break-all colt-mic-a bg-hartie-umbra/60 px-3 py-2 font-mono text-nota text-cerneala-moale select-all">
        {sir}
      </p>
    </div>
  );
}
