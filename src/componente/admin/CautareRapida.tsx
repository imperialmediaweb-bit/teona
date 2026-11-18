"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import { GRUPURI_CAUTARE, type FelGasit } from "@/lib/cautare-grupuri";

/**
 * Căutarea rapidă (Ctrl K / Cmd K / „/”, sau clic pe câmpul din meniu).
 *
 * Paginile și acțiunile se caută aici, în browser, din lista primită de la
 * server (numai cele pe care rolul le vede). Firmele, donatorii, cererile,
 * voluntarii, contractele, articolele și presa vin de la `/api/admin/cauta`,
 * cât scrii, la 150 ms după ultima literă. Enter pe nimic duce la pagina
 * cu toate rezultatele (`/admin/cauta`).
 *
 * Ultimele cinci lucruri deschise de aici stau în `localStorage` — numai pe
 * calculatorul omului, ca scurtătură; dacă stocarea e blocată, fereastra
 * merge la fel, fără ele.
 */

export type IntrareRapida = { eticheta: string; href: string; detaliu?: string; pictograma: NumePictograma };

type Rand = { cheie: string; grup: string; titlu: string; detaliu?: string; unde: string; pictograma: NumePictograma };
type Gasit = { fel: FelGasit; titlu: string; detaliu: string; unde: string };

const PICTOGRAMA: Record<FelGasit, NumePictograma> = {
  firma: "cladire",
  donator: "inima",
  cerere: "plic",
  voluntar: "familie",
  contract: "document",
  text: "document",
  presa: "comunicare",
};
const CHEIE_RECENTE = "teona-cautare-recente";
const fd = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();

function citesteRecente(): Rand[] {
  try {
    const x = JSON.parse(localStorage.getItem(CHEIE_RECENTE) ?? "[]");
    return Array.isArray(x) ? x.slice(0, 5) : [];
  } catch {
    return [];
  }
}
function tineMinte(r: Rand) {
  try {
    const alte = citesteRecente().filter((x) => x.unde !== r.unde);
    localStorage.setItem(CHEIE_RECENTE, JSON.stringify([{ ...r, grup: "Recente" }, ...alte].slice(0, 5)));
  } catch {}
}

/** Deschide căutarea rapidă de oriunde (câmpul din meniu, bara de jos de pe telefon). */
export function deschideCautarea() {
  window.dispatchEvent(new Event("teona:cauta"));
}

/**
 * Câmpul din meniu: numai un buton care deschide fereastra. Fereastra e una
 * singură pe tot panoul (în `admin/layout.tsx`), nu una pe fiecare pagină:
 * cu câte una pe pagină, la trecerea de la o pagină la alta erau o clipă
 * două, amândouă ascultând de Ctrl K.
 */
export function ButonCautare() {
  // Pe server și la prima desenare scrie „Ctrl K”; pe Mac, apoi „⌘K”.
  const eMac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
  return (
    <>
      <button
        type="button"
        onClick={deschideCautarea}
        data-cautare-rapida
        title="Caută (Ctrl K)"
        className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 text-left text-[13px] text-white/55 transition-colors hover:border-white/25 hover:text-white/80 group-data-[restrans=true]/bara:justify-center group-data-[restrans=true]/bara:px-0"
      >
        <Pictograma nume="lupa" className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate group-data-[restrans=true]/bara:hidden">Caută…</span>
        <kbd className="hidden rounded border border-white/15 px-1.5 font-sans text-[11px] text-white/45 lg:inline group-data-[restrans=true]/bara:!hidden">{eMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
    </>
  );
}

export default function CautareRapida({ pagini, actiuni }: { pagini: IntrareRapida[]; actiuni: IntrareRapida[] }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [q, setQ] = useState("");
  // Rezultatele țin minte pentru ce text au venit: cele vechi nu se arată sub un text nou.
  const [raspuns, setRaspuns] = useState<{ pentru: string; rezultate: Gasit[] }>({ pentru: "", rezultate: [] });
  const [ales, setAles] = useState(0);
  const [recente, setRecente] = useState<Rand[]>([]);
  const intrare = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const deschide = useCallback(() => {
    setRecente(citesteRecente());
    setDeschis(true);
  }, []);
  const inchide = useCallback(() => {
    setDeschis(false);
    setQ("");
    setAles(0);
  }, []);

  // Scurtăturile: Ctrl K / Cmd K oriunde; „/” numai când nu scrii deja într-un câmp.
  useEffect(() => {
    const tasta = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (deschis) inchide();
        else deschide();
        return;
      }
      if (e.key === "Escape" && deschis) {
        e.preventDefault();
        inchide();
        return;
      }
      const t = e.target as HTMLElement | null;
      const scrie = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === "/" && !scrie && !deschis) {
        e.preventDefault();
        deschide();
      }
    };
    // Bara de jos de pe telefon și butoanele din pagini o deschid cu un eveniment.
    const dinAfara = () => deschide();
    window.addEventListener("keydown", tasta);
    window.addEventListener("teona:cauta", dinAfara);
    return () => {
      window.removeEventListener("keydown", tasta);
      window.removeEventListener("teona:cauta", dinAfara);
    };
  }, [deschis, deschide, inchide]);

  useEffect(() => {
    if (deschis) requestAnimationFrame(() => intrare.current?.focus());
  }, [deschis]);

  // Rezultatele din baza de date, la 150 ms după ultima literă; cererea veche se anulează.
  const deCautat = deschis && fd(q).length >= 2 ? q.trim() : "";
  const gasite = useMemo(() => (deCautat && raspuns.pentru === deCautat ? raspuns.rezultate : []), [deCautat, raspuns]);
  const lucreaza = Boolean(deCautat) && raspuns.pentru !== deCautat;
  useEffect(() => {
    if (!deCautat) return;
    const opreste = new AbortController();
    const t = setTimeout(async () => {
      let rezultate: Gasit[] = [];
      try {
        const r = await fetch(`/api/admin/cauta?q=${encodeURIComponent(deCautat)}`, { signal: opreste.signal, credentials: "same-origin" });
        const j = r.ok ? await r.json() : { rezultate: [] };
        rezultate = Array.isArray(j.rezultate) ? j.rezultate : [];
      } catch {
        if (opreste.signal.aborted) return;
        /* fără rețea: rămân paginile și acțiunile */
      }
      setRaspuns({ pentru: deCautat, rezultate });
    }, 150);
    return () => {
      clearTimeout(t);
      opreste.abort();
    };
  }, [deCautat]);

  const randuri = useMemo<Rand[]>(() => {
    const cuv = fd(q);
    if (!cuv) {
      return [
        ...recente.map((r, i) => ({ ...r, cheie: `r${i}`, grup: "Recente" })),
        ...actiuni.map((a) => ({ cheie: `a${a.href}`, grup: "Acțiuni", titlu: a.eticheta, detaliu: a.detaliu, unde: a.href, pictograma: a.pictograma })),
      ];
    }
    const potrivite = (x: IntrareRapida) => fd(`${x.eticheta} ${x.detaliu ?? ""}`).includes(cuv);
    return [
      ...pagini.filter(potrivite).slice(0, 6).map((p) => ({ cheie: `p${p.href}`, grup: "Pagini", titlu: p.eticheta, detaliu: p.detaliu, unde: p.href, pictograma: p.pictograma })),
      ...actiuni.filter(potrivite).map((a) => ({ cheie: `a${a.href}`, grup: "Acțiuni", titlu: a.eticheta, detaliu: a.detaliu, unde: a.href, pictograma: a.pictograma })),
      ...GRUPURI_CAUTARE.flatMap((g) =>
        gasite
          .filter((x) => x.fel === g.id)
          .map((x, i) => ({ cheie: `${g.id}${i}${x.unde}`, grup: g.eticheta, titlu: x.titlu, detaliu: x.detaliu, unde: x.unde, pictograma: PICTOGRAMA[x.fel] })),
      ),
    ];
  }, [q, pagini, actiuni, gasite, recente]);

  useEffect(() => {
    lista.current?.querySelector(`[data-index="${ales}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ales]);

  const du = (r: Rand) => {
    tineMinte(r);
    inchide();
    router.push(r.unde);
  };
  const laTasta = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      inchide();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setAles((a) => Math.min(a + 1, Math.max(randuri.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAles((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = randuri[ales];
      if (r) du(r);
      else if (q.trim()) {
        inchide();
        router.push(`/admin/cauta?q=${encodeURIComponent(q.trim())}`);
      }
    }
  };

  let grupAnterior = "";
  return (
    <>

      {/*
        Fereastra stă direct în `body`, nu în bara din stânga: bara are un
        `transform` (pentru sertarul de pe telefon), iar un element `fixed`
        dintr-un părinte transformat e lipit de părinte, nu de ecran — pe
        telefon, unde bara e ascunsă, fereastra nu se vedea deloc.
      */}
      {deschis && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-cerneala/40 px-3 pt-[10vh] backdrop-blur-[2px] motion-safe:animate-[panou-intra_150ms_ease-out]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) inchide();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Caută în panou"
            data-fereastra-cautare
            className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-hartie text-cerneala shadow-2xl ring-1 ring-cerneala/10"
          >
            <div className="flex items-center gap-2 border-b border-hartie-umbra px-4">
              <Pictograma nume="lupa" className="size-5 shrink-0 text-cerneala-slab" />
              <input
                ref={intrare}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setAles(0);
                }}
                onKeyDown={laTasta}
                role="combobox"
                aria-expanded="true"
                aria-controls="rezultate-cautare"
                aria-activedescendant={randuri[ales] ? `rc-${ales}` : undefined}
                placeholder="Caută o firmă, un donator, o pagină…"
                className="min-w-0 flex-1 bg-transparent py-4 text-amplu outline-none placeholder:text-cerneala-slab"
              />
              {lucreaza && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-hartie-umbra border-t-caramiziu-600" aria-label="Caută" />}
              <kbd className="rounded border border-hartie-umbra px-1.5 text-[11px] text-cerneala-slab">Esc</kbd>
            </div>
            <ul ref={lista} id="rezultate-cautare" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
              {randuri.map((r, i) => {
                const titluGrup = r.grup !== grupAnterior ? r.grup : null;
                grupAnterior = r.grup;
                return (
                  <li key={r.cheie} role="presentation">
                    {titluGrup && (
                      <p className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-cerneala-slab uppercase">{titluGrup}</p>
                    )}
                    <button
                      type="button"
                      id={`rc-${i}`}
                      role="option"
                      aria-selected={i === ales}
                      data-index={i}
                      data-rezultat={r.grup}
                      onMouseMove={() => setAles(i)}
                      onClick={() => du(r)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === ales ? "bg-caramiziu-50 text-cerneala" : "text-cerneala-moale"}`}
                    >
                      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${i === ales ? "bg-caramiziu-100 text-caramiziu-800" : "bg-hartie-calda text-cerneala-slab"}`}>
                        <Pictograma nume={r.pictograma} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-mic font-semibold text-cerneala">{r.titlu}</span>
                        {r.detaliu && <span className="block truncate text-nota text-cerneala-slab">{r.detaliu}</span>}
                      </span>
                      {i === ales && <span className="text-nota text-cerneala-slab">↵</span>}
                    </button>
                  </li>
                );
              })}
              {fd(q).length >= 2 && !lucreaza && randuri.length === 0 && (
                <li className="px-3 py-8 text-center text-mic text-cerneala-slab">
                  Nimic pentru „{q.trim()}”. Încearcă alt cuvânt, un e-mail sau un CUI.
                </li>
              )}
            </ul>
            <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-hartie-umbra bg-hartie-calda/60 px-4 py-2 text-nota text-cerneala-slab">
              <span>↑ ↓ alegi</span>
              <span>↵ deschizi</span>
              <span>Esc închizi</span>
              {q.trim().length >= 2 && (
                <button
                  type="button"
                  className="ml-auto font-semibold text-caramiziu-700 underline underline-offset-2"
                  onClick={() => {
                    inchide();
                    router.push(`/admin/cauta?q=${encodeURIComponent(q.trim())}`);
                  }}
                >
                  Toate rezultatele
                </button>
              )}
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
