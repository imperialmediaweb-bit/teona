"use client";

import { useEffect, useState } from "react";

type Prompt = Event & { prompt: () => Promise<void> };

/**
 * „Instalează aplicația”, jos în bara panoului.
 *
 * Pe Chrome și Edge (calculator și Android) browserul oferă instalarea, iar
 * butonul o pornește. Pe iPhone nu există așa ceva: instalarea se face din
 * Safari, „Partajează → Adaugă pe ecranul principal”, deci butonul arată
 * pașii. Deja instalată, aplicația nu mai arată nimic.
 *
 * Tot aici se înregistrează lucrătorul, cu raza `/admin/`.
 */
export default function InstaleazaAplicatia({
  luminos = false,
}: {
  /** Pe fundal deschis (pagina de intrare), nu în bara închisă la culoare. */
  luminos?: boolean;
}) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [ios, setIos] = useState(false);
  const [instalata, setInstalata] = useState(true);
  const [pasi, setPasi] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/admin/sw.js", { scope: "/admin/" })
        .catch(() => undefined);
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalata(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const cand = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
    };
    window.addEventListener("beforeinstallprompt", cand);
    window.addEventListener("appinstalled", () => setInstalata(true));
    return () => window.removeEventListener("beforeinstallprompt", cand);
  }, []);

  if (instalata || (!prompt && !ios)) return null;

  const apasa = async () => {
    if (prompt) {
      await prompt.prompt();
      setPrompt(null);
    } else setPasi((v) => !v);
  };

  /*
    Pe pagina de intrare: un card, nu un rând cenușiu care se pierde sub
    formular. Iconița e chiar cea care va sta pe ecranul telefonului, ca omul
    să recunoască aplicația după instalare.
  */
  if (luminos) {
    return (
      <div className="rounded-2xl border border-hartie-umbra bg-hartie p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/panou/icon-maskable-512.png"
            alt=""
            width={72}
            height={72}
            className="size-18 shrink-0 rounded-2xl"
          />
          <div className="min-w-0">
            <p className="font-titlu text-h4 font-extrabold text-cerneala">
              Panoul, ca aplicație
            </p>
            <p className="mt-1 text-corp text-cerneala-moale">
              Pune panoul pe ecranul telefonului sau al calculatorului, cu
              sigla asociației. Îl deschizi dintr-o atingere, ca pe orice
              aplicație.
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2.5 text-corp text-cerneala">
          {[
            "Rămâi logat 30 de zile pe dispozitivul tău.",
            "Intri cu un cod de 4–6 cifre, pe care îl pui la „Parola mea”.",
            "Paginile cu date personale cer din nou codul după 12 ore.",
            "Nimic din panou nu rămâne salvat în telefon.",
            "După 5 coduri greșite se cere din nou parola.",
          ].map((r) => (
            <li key={r} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 size-2 shrink-0 rounded-full bg-caramiziu-600"
              />
              {r}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={apasa}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-cerneala px-6 py-3.5 font-titlu text-amplu font-bold text-hartie transition-colors hover:bg-cerneala/85"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 17v2.5h15V17" />
          </svg>
          Instalează aplicația
        </button>
        {pasi && (
          <p className="mt-3 rounded-lg bg-hartie-calda px-4 py-3 text-corp text-cerneala-moale">
            În Safari, apasă butonul de partajare (pătratul cu săgeată), apoi
            „Adaugă pe ecranul principal”.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 pb-2">
      <button
        type="button"
        onClick={apasa}
        className="flex w-full items-center gap-2.5 rounded-lg bg-hartie/10 px-3 py-2 font-titlu text-mic font-semibold text-hartie transition-colors hover:bg-hartie/20"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 17v2.5h15V17" />
        </svg>
        Instalează aplicația
      </button>
      {pasi && (
        <p className="mt-2 rounded-lg bg-hartie/10 px-3 py-2 text-nota text-hartie/80">
          În Safari, apasă butonul de partajare (pătratul cu săgeată), apoi
          „Adaugă pe ecranul principal”.
        </p>
      )}
    </div>
  );
}
