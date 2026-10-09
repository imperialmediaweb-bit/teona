"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { RUTE } from "@/date/asociatie";
import {
  EVENIMENT_REDESCHIDE,
  EVENIMENT_SALVAT,
  abonareLaAcord,
  areAcord,
  citesteAcord,
  scrieAcord,
} from "@/lib/cookieuri";

/**
 * Bannerul de cookie-uri (12.5).
 *
 * Nimic în afara cookie-urilor necesare nu se încarcă înainte de acord: site-ul
 * nu încarcă încă niciun script de statistici sau marketing, iar când o va face,
 * va citi acordul de aici înainte.
 */
export default function BannerCookieuri() {
  // Pe server nu știm dacă există acord. „necunoscut” ține bannerul în afara
  // HTML-ului, ca să nu clipească pentru cine a ales deja.
  const acord = useSyncExternalStore(
    abonareLaAcord,
    areAcord,
    () => "necunoscut",
  );

  // Deschiderea din subsol, pentru schimbarea alegerii.
  const [redeschis, setRedeschis] = useState(false);
  const [aratSetari, setAratSetari] = useState(false);
  const [statistici, setStatistici] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const redeschide = () => {
      const salvat = citesteAcord();
      setStatistici(salvat?.statistici ?? false);
      setMarketing(salvat?.marketing ?? false);
      setAratSetari(true);
      setRedeschis(true);
    };
    window.addEventListener(EVENIMENT_REDESCHIDE, redeschide);
    return () => window.removeEventListener(EVENIMENT_REDESCHIDE, redeschide);
  }, []);

  const vizibil = redeschis || acord === "0";
  if (!vizibil) return null;

  function salveaza(alegere: { statistici: boolean; marketing: boolean }) {
    scrieAcord(alegere);
    setRedeschis(false);
    setAratSetari(false);
    window.dispatchEvent(new Event(EVENIMENT_SALVAT));
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookieuri-titlu"
      className="fixed inset-x-0 bottom-0 z-[60] p-2.5 sm:p-5"
    >
      <div className="mx-auto max-h-[80dvh] max-w-3xl overflow-y-auto rounded-card border border-hartie-umbra bg-hartie p-5 shadow-[0_24px_60px_-20px_rgba(35,35,35,0.4)] sm:p-7">
        <h2 id="cookieuri-titlu" className="text-h4 text-cerneala">
          Cookie-uri
        </h2>
        <p className="mt-2 text-mic text-cerneala-moale">
          Folosim cookie-uri pentru ca site-ul să funcționeze corect și pentru a
          înțelege cum este folosit. Poți alege ce accepți.{" "}
          <Link
            href={RUTE.cookieuri}
            className="font-semibold text-caramiziu-600 underline underline-offset-2"
          >
            Politica de cookie-uri
          </Link>
        </p>

        {aratSetari && (
          <ul className="mt-5 grid gap-3 border-y border-hartie-umbra py-5">
            <li className="flex items-start justify-between gap-4">
              <div>
                <p className="font-titlu font-semibold text-cerneala">
                  Cookie-uri necesare
                </p>
                <p className="text-mic text-cerneala-moale">
                  Fac site-ul să funcționeze. Nu pot fi dezactivate.
                </p>
              </div>
              <span className="mt-1 shrink-0 rounded-full bg-hartie-calda px-3 py-1 text-nota font-semibold text-cerneala-moale">
                Mereu active
              </span>
            </li>
            <li className="flex items-start justify-between gap-4">
              <label htmlFor="cookie-statistici" className="cursor-pointer">
                <p className="font-titlu font-semibold text-cerneala">
                  Statistici
                </p>
                <p className="text-mic text-cerneala-moale">
                  Ne arată câți oameni ne vizitează și ce pagini citesc.
                </p>
              </label>
              <input
                id="cookie-statistici"
                type="checkbox"
                checked={statistici}
                onChange={(e) => setStatistici(e.target.checked)}
                className="mt-1.5 size-5 shrink-0 accent-caramiziu-500"
              />
            </li>
            <li className="flex items-start justify-between gap-4">
              <label htmlFor="cookie-marketing" className="cursor-pointer">
                <p className="font-titlu font-semibold text-cerneala">
                  Marketing
                </p>
                <p className="text-mic text-cerneala-moale">
                  Ne ajută să ajungem la oameni care ar vrea să susțină copiii.
                </p>
              </label>
              <input
                id="cookie-marketing"
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1.5 size-5 shrink-0 accent-caramiziu-500"
              />
            </li>
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => salveaza({ statistici: true, marketing: true })}
            className="rounded-full bg-caramiziu-500 px-6 py-2.5 font-titlu text-mic font-semibold text-hartie transition hover:bg-caramiziu-600"
          >
            Acceptă toate
          </button>
          <button
            type="button"
            onClick={() => salveaza({ statistici: false, marketing: false })}
            className="rounded-full border-2 border-cerneala/15 px-6 py-2.5 font-titlu text-mic font-semibold text-cerneala transition hover:border-cerneala/35"
          >
            Refuz
          </button>
          {aratSetari ? (
            <button
              type="button"
              onClick={() => salveaza({ statistici, marketing })}
              className="rounded-full px-5 py-2.5 font-titlu text-mic font-semibold text-caramiziu-600 underline-offset-4 transition hover:underline"
            >
              Salvează alegerea
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAratSetari(true)}
              className="rounded-full px-5 py-2.5 font-titlu text-mic font-semibold text-caramiziu-600 underline-offset-4 transition hover:underline"
            >
              Setări
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
