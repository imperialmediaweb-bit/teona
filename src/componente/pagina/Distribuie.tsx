"use client";

import { useState } from "react";
import Pictograma from "../Pictograma";
import { PictogramaRetea } from "../Retele";

/**
 * Butoanele de distribuire ale unei campanii.
 *
 * Nu folosesc widgeturile oficiale ale rețelelor: alea încarcă script
 * străin, pun cookie-uri de urmărire și ar cere acordul vizitatorului. Un
 * link simplu către adresa de partajare face același lucru, fără nimic din
 * toate astea.
 */
export default function Distribuie({
  adresa,
  titlu,
}: {
  adresa: string;
  titlu: string;
}) {
  const [copiat, setCopiat] = useState(false);

  async function copiaza() {
    try {
      await navigator.clipboard.writeText(adresa);
      setCopiat(true);
      setTimeout(() => setCopiat(false), 2500);
    } catch {
      // Clipboard refuzat (sit nesigur, permisiune oprită): lăsăm adresa la
      // vedere, ca omul s-o poată selecta cu mâna.
      setCopiat(false);
    }
  }

  const retele = [
    {
      nume: "Facebook",
      adresa: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adresa)}`,
    },
    {
      nume: "WhatsApp",
      adresa: `https://wa.me/?text=${encodeURIComponent(`${titlu} ${adresa}`)}`,
    },
  ];

  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-6 text-center shadow-[0_20px_44px_-26px_rgba(35,35,35,0.35)] sm:p-7">
      <h2 className="text-h3 text-cerneala">Distribuie campania</h2>
      <p className="mx-auto mt-2 max-w-xl text-cerneala-moale">
        Fiecare om care vede pagina e un copil mai aproape de o tabără.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {retele.map((retea) => (
          <a
            key={retea.nume}
            href={retea.adresa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-hartie-umbra bg-hartie-calda px-5 py-3 font-titlu font-bold text-cerneala transition-colors hover:border-caramiziu-300 hover:bg-tenta-cald hover:text-caramiziu-700"
          >
            {retea.nume === "Facebook" ? (
              <PictogramaRetea nume="Facebook" className="size-5" />
            ) : (
              <Pictograma nume="comunicare" className="size-5" />
            )}
            {retea.nume}
            <span className="sr-only">(se deschide într-o filă nouă)</span>
          </a>
        ))}

        <button
          type="button"
          onClick={copiaza}
          className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-hartie-umbra bg-hartie-calda px-5 py-3 font-titlu font-bold text-cerneala transition-colors hover:border-caramiziu-300 hover:bg-tenta-cald hover:text-caramiziu-700"
        >
          <Pictograma nume="document" className="size-5" />
          {copiat ? "Link copiat" : "Copiază linkul"}
        </button>
      </div>

      <p className="mt-5 break-all text-mic text-cerneala-slab select-all">
        {adresa}
      </p>
      <span aria-live="polite" className="sr-only">
        {copiat ? "Linkul campaniei a fost copiat." : ""}
      </span>
    </div>
  );
}
