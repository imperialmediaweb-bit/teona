"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, X } from "lucide-react";

/**
 * Sertarul din dreapta (pe telefon, tot ecranul): formularul acțiunii
 * principale a paginii — „Donație de mână”, „Adaugă firmă” — se deschide
 * peste listă, nu într-o secțiune pliată la capătul paginii.
 * Conținutul (formularul) vine de pe server; aici e doar deschiderea.
 */
export function Sertar({
  eticheta,
  titlu,
  deschisLaInceput = false,
  buton = "principal",
  children,
}: {
  eticheta: string;
  titlu: string;
  deschisLaInceput?: boolean;
  buton?: "principal" | "contur";
  children: React.ReactNode;
}) {
  const [deschis, setDeschis] = useState(deschisLaInceput);
  const id = useId();
  // Portalul se pune numai în browser, după prima desenare (pe server nu există `document`).
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  useEffect(() => {
    if (!deschis) return;
    const tasta = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeschis(false);
    };
    window.addEventListener("keydown", tasta);
    const sus = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tasta);
      document.body.style.overflow = sus;
    };
  }, [deschis]);

  return (
    <>
      <button
        type="button"
        onClick={() => setDeschis(true)}
        aria-haspopup="dialog"
        aria-controls={id}
        data-deschide-sertar
        className={
          buton === "principal"
            ? "inline-flex h-10 items-center gap-2 rounded-full bg-caramiziu-700 px-5 font-titlu text-[14px] font-bold whitespace-nowrap text-hartie shadow-sm transition-colors duration-150 hover:bg-caramiziu-800"
            : "inline-flex h-10 items-center gap-2 rounded-full border border-cerneala/15 bg-hartie px-5 font-titlu text-[14px] font-bold whitespace-nowrap text-cerneala transition-colors duration-150 hover:border-caramiziu-500"
        }
      >
        {buton === "principal" && <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />}
        {eticheta}
      </button>
      {/*
        Sertarul se desenează mereu (ascuns când e închis), nu numai la
        deschidere: formularul din el e randat pe server, iar `TineCiorna`
        trebuie să-l găsească în pagină ca să-i pună înapoi ce a scris omul.
      */}
      {inBrowser &&
        createPortal(
          <div className={deschis ? "" : "hidden"}>
            <div className="fixed inset-0 z-[55] bg-cerneala/40 motion-safe:animate-[panou-intra_150ms_ease-out]" onClick={() => setDeschis(false)} aria-hidden="true" />
            <div
              id={id}
              role="dialog"
              aria-modal="true"
              aria-label={titlu}
              data-sertar
              className="fixed inset-y-0 right-0 z-[56] flex w-full flex-col bg-[#f6f5f3] shadow-2xl sm:w-[480px] motion-safe:animate-[panou-intra_200ms_ease-out]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-hartie-umbra bg-hartie px-5 py-4">
                <h2 className="font-titlu text-[17px] font-bold text-cerneala">{titlu}</h2>
                <button type="button" onClick={() => setDeschis(false)} aria-label="Închide" className="grid size-9 place-items-center rounded-full text-cerneala-moale hover:bg-hartie-calda">
                  <X className="size-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Căutarea care filtrează pe loc rândurile deja desenate: ascunde ce nu
 * conține textul scris (fără diacritice), în elementul `tinta`, printre
 * cele cu `data-cauta`. Fără buton „Caută” și fără încă o cerere la server.
 */
export function CautaPeLoc({ tinta, placeholder = "Caută…" }: { tinta: string; placeholder?: string }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const fd = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    const cuv = fd(q.trim());
    const loc = document.getElementById(tinta);
    if (!loc) return;
    let vizibile = 0;
    for (const el of loc.querySelectorAll<HTMLElement>("[data-cauta]")) {
      const da = !cuv || fd(el.dataset.cauta ?? el.innerText).includes(cuv);
      el.hidden = !da;
      if (da) vizibile++;
    }
    const gol = loc.querySelector<HTMLElement>("[data-cauta-gol]");
    if (gol) gol.hidden = vizibile > 0;
  }, [q, tinta]);
  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cerneala-slab" aria-hidden="true" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-full border border-hartie-umbra bg-hartie pr-3 pl-9 text-[14px] text-cerneala placeholder:text-cerneala-slab focus:border-caramiziu-400 focus:outline-none"
      />
    </label>
  );
}
