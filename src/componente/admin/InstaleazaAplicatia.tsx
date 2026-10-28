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

  return (
    <div className={luminos ? "" : "px-3 pb-2"}>
      <button
        type="button"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            setPrompt(null);
          } else setPasi((v) => !v);
        }}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-titlu text-mic font-semibold transition-colors ${
          luminos
            ? "border border-hartie-umbra bg-hartie text-cerneala hover:border-caramiziu-400"
            : "bg-hartie/10 text-hartie hover:bg-hartie/20"
        }`}
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
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-nota ${
            luminos ? "bg-hartie text-cerneala-moale" : "bg-hartie/10 text-hartie/80"
          }`}
        >
          În Safari, apasă butonul de partajare (pătratul cu săgeată), apoi
          „Adaugă pe ecranul principal”.
        </p>
      )}
    </div>
  );
}
