"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { abonareLaAcord, areAcord } from "@/lib/cookieuri";

/**
 * Caseta de întrebări de pe site.
 *
 * **La ce folosește.** Un om care intră pe site are de obicei o singură
 * întrebare — „cum donez lunar?", „ce e Casa Teona?", „firma mea poate
 * sponsoriza?" — iar răspunsul e pe o pagină pe care n-o găsește din meniu.
 * Caseta îi dă răspunsul în două fraze și adresa paginii.
 *
 * **Ce nu face.** Nu înscrie pe nimeni, nu confirmă nimic, nu cere date
 * personale și n-are acces la baza de date: nu știe cine a donat, cât s-a
 * strâns, cine e pe vreo listă. Pentru tot ce cere o hotărâre a asociației,
 * trimite la telefon sau la formularul potrivit.
 *
 * **Unde stă.** Jos, în stânga pe telefon — în dreapta e deja butonul plutitor
 * „Donează", iar două butoane rotunde unul peste altul înseamnă că unul dintre
 * ele se apasă din greșeală. Pe ecran lat, în dreapta, unde se așteaptă.
 *
 * **Nu apare peste bannerul de cookie-uri**, din aceleași motive ca butonul de
 * donație: cât timp omul n-a ales, nimic nu i se așază peste alegere.
 */

const INTREBARI_GATA = [
  "Cum pot dona lunar?",
  "Ce este Casa Teona?",
  "Firma mea poate sponsoriza?",
  "Cum devin voluntar?",
];

type Mesaj = { rol: "om" | "asistent"; text: string };

export default function Intreaba() {
  const cale = usePathname();
  const acord = useSyncExternalStore(
    abonareLaAcord,
    areAcord,
    () => "1" as const,
  );

  const [deschis, setDeschis] = useState(false);
  const [mesaje, setMesaje] = useState<Mesaj[]>([]);
  const [scris, setScris] = useState("");
  const [seScrie, setSeScrie] = useState(false);
  const jos = useRef<HTMLDivElement>(null);
  const camp = useRef<HTMLInputElement>(null);

  // Lista se duce la ultimul mesaj pe măsură ce răspunsul se scrie.
  useEffect(() => {
    jos.current?.scrollIntoView({ block: "end" });
  }, [mesaje, seScrie]);

  useEffect(() => {
    if (deschis) camp.current?.focus();
  }, [deschis]);

  useEffect(() => {
    if (!deschis) return;
    const peEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeschis(false);
    };
    document.addEventListener("keydown", peEscape);
    return () => document.removeEventListener("keydown", peEscape);
  }, [deschis]);

  async function trimite(intrebare: string) {
    const curat = intrebare.trim();
    if (!curat || seScrie) return;

    const pana = [...mesaje, { rol: "om" as const, text: curat }];
    setMesaje(pana);
    setScris("");
    setSeScrie(true);

    try {
      const r = await fetch("/api/intreaba", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mesaje: pana }),
      });

      if (!r.ok || !r.body) {
        setMesaje([
          ...pana,
          {
            rol: "asistent",
            text:
              r.status === 429
                ? "Am răspuns la multe întrebări în ultima oră. Sună la 0754 510 167 sau scrie la contact@teona-ariana.ro."
                : "Nu pot răspunde acum. Sună la 0754 510 167 sau scrie la contact@teona-ariana.ro.",
          },
        ]);
        return;
      }

      /*
        Răspunsul se citește pe bucăți și se arată pe măsură ce vine. La o
        întrebare mai grea, modelul se gândește câteva secunde; o casetă care
        stă goală atâta timp pare stricată, iar omul închide fila.
      */
      const citeste = r.body.getReader();
      const decodor = new TextDecoder();
      let adunat = "";
      setMesaje([...pana, { rol: "asistent", text: "" }]);

      for (;;) {
        const { done, value } = await citeste.read();
        if (done) break;
        adunat += decodor.decode(value, { stream: true });
        setMesaje([...pana, { rol: "asistent", text: adunat }]);
      }
    } catch {
      setMesaje([
        ...pana,
        {
          rol: "asistent",
          text: "A căzut legătura. Mai încearcă o dată sau sună la 0754 510 167.",
        },
      ]);
    } finally {
      setSeScrie(false);
    }
  }

  if (acord === "0") return null;
  if (cale.startsWith("/admin")) return null;

  return (
    <div className="doar-site pointer-events-none fixed inset-0 z-40 flex items-end justify-start p-4 sm:justify-end">
      {deschis && (
        <div className="pointer-events-auto mb-16 flex h-[min(32rem,70vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_26px_60px_-24px_rgba(35,35,35,0.55)] sm:mb-16">
          <div className="flex items-start justify-between gap-3 bg-cerneala px-4 py-3">
            <div>
              <p className="font-titlu text-mic font-bold text-hartie">
                Întreabă-ne
              </p>
              <p className="text-nota text-hartie/60">
                Răspunde un asistent, nu un om. Pentru lucruri urgente: 0754 510
                167.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeschis(false)}
              aria-label="Închide caseta de întrebări"
              className="-mr-1 shrink-0 rounded-full p-1 text-hartie/70 transition-colors hover:bg-hartie/10 hover:text-hartie"
            >
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div
            role="log"
            aria-live="polite"
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {mesaje.length === 0 ? (
              <>
                <p className="text-mic text-cerneala-moale">
                  Scrie o întrebare despre asociație — cum se donează, ce se
                  întâmplă la Casa Teona, cum sponsorizează o firmă.
                </p>
                <ul className="mt-3 grid gap-2">
                  {INTREBARI_GATA.map((i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => trimite(i)}
                        className="w-full colt-mic-a border border-hartie-umbra bg-hartie-calda px-3 py-2 text-left text-mic text-cerneala transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
                      >
                        {i}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <ul className="grid gap-3">
                {mesaje.map((m, i) => (
                  <li
                    key={i}
                    className={
                      m.rol === "om"
                        ? "ml-6 colt-mic-a bg-caramiziu-700 px-3 py-2 text-mic text-hartie"
                        : "mr-4 text-mic leading-relaxed whitespace-pre-wrap text-cerneala"
                    }
                  >
                    {m.text || (seScrie ? "…" : "")}
                  </li>
                ))}
              </ul>
            )}
            <div ref={jos} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              trimite(scris);
            }}
            className="flex items-center gap-2 border-t border-hartie-umbra p-3"
          >
            <label htmlFor="intrebarea-mea" className="sr-only">
              Întrebarea ta
            </label>
            <input
              id="intrebarea-mea"
              ref={camp}
              value={scris}
              onChange={(e) => setScris(e.target.value)}
              maxLength={600}
              placeholder="Scrie întrebarea…"
              className="min-w-0 flex-1 rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic text-cerneala"
            />
            <button
              type="submit"
              disabled={seScrie || scris.trim() === ""}
              className="shrink-0 rounded-full bg-caramiziu-700 px-4 py-2 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800 disabled:bg-cerneala-slab"
            >
              {seScrie ? "…" : "Trimite"}
            </button>
          </form>
        </div>
      )}

      {!deschis && (
        <button
          type="button"
          onClick={() => setDeschis(true)}
          aria-expanded={false}
          className="pointer-events-auto flex min-h-12 items-center gap-2 rounded-full bg-cerneala px-5 py-3 font-titlu text-mic font-bold text-hartie shadow-[0_10px_26px_-8px_rgba(35,35,35,0.55)] transition active:translate-y-px"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              d="M21 12a8 8 0 1 1-3.1-6.3M12 8v4m0 3.5h.01"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Întreabă-ne
        </button>
      )}
    </div>
  );
}
