"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Caseta în care se vorbește cu consultantul de strângere de fonduri.
 *
 * **De ce o conversație și nu încă un buton de raport.** Raportul de pe
 * pagină răspunde la „cum stăm". Munca începe la întrebarea următoare — „de
 * unde încep cu cei care s-au oprit?", „ce scriu celor patru firme care
 * n-au răspuns?" —, iar alea nu se pot ghici dinainte.
 *
 * **Ce pleacă de aici.** Întrebarea și răspunsurile de până acum. Cifrele le
 * adaugă serverul, agregate; nimic personal nu trece prin caseta asta și
 * nimic nu se salvează: conversația trăiește în fila deschisă.
 */

type Schimb = { rol: "om" | "consultant"; text: string };

/*
  Întrebările de pornire.

  Nu sunt decor: fără ele, caseta e un câmp gol în care nimeni nu știe ce se
  poate întreba, iar jumătate din ce știe consultantul rămâne nefolosit. Cele
  două despre firme sunt acolo pentru că partea de căutat sponsori e cea mai
  nouă și cea pe care nimeni n-ar ghici-o.
*/
const INTREBARI = [
  "De unde încep cu donatorii care s-au oprit?",
  "De unde iau firme de la care să cer sponsorizare?",
  "Ce fac luna asta ca să cresc donațiile lunare?",
  "Pe cine caut pe LinkedIn într-o firmă și ce-i scriu?",
  "Unde se blochează firmele și ce le scriu?",
  "Merită o campanie acum, sau e mai bine să aștept?",
];

export default function Sfatuitor() {
  const [conversatie, setConversatie] = useState<Schimb[]>([]);
  const [intrebare, setIntrebare] = useState("");
  const [scrie, setScrie] = useState(false);
  const [eroare, setEroare] = useState("");
  const jos = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jos.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [conversatie, scrie]);

  async function trimite(text: string) {
    const curat = text.trim();
    if (!curat || scrie) return;
    setEroare("");
    setIntrebare("");
    const cu: Schimb[] = [...conversatie, { rol: "om", text: curat }];
    setConversatie(cu);
    setScrie(true);

    try {
      const r = await fetch("/api/admin/sfatuitor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversatie: cu }),
      });
      if (!r.ok || !r.body) {
        const corp = await r.json().catch(() => null);
        setEroare(
          (corp as { mesaj?: string } | null)?.mesaj ??
            "N-a mers. Mai încearcă o dată.",
        );
        setScrie(false);
        return;
      }
      const cititor = r.body.getReader();
      const litere = new TextDecoder();
      let adunat = "";
      setConversatie([...cu, { rol: "consultant", text: "" }]);
      for (;;) {
        const { done, value } = await cititor.read();
        if (done) break;
        adunat += litere.decode(value, { stream: true });
        setConversatie([...cu, { rol: "consultant", text: adunat }]);
      }
    } catch {
      setEroare("S-a întrerupt legătura. Mai încearcă o dată.");
    } finally {
      setScrie(false);
    }
  }

  return (
    <section className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-7">
      <h2 className="font-titlu text-amplu font-bold text-cerneala">
        Întreabă consultantul
      </h2>
      <p className="mt-1 max-w-3xl text-nota text-cerneala-slab">
        Vede aceleași cifre ca tine, agregate, știe ce unelte are site-ul și
        cum se caută firme de la care se cer bani. Nu are nume, adrese sau
        telefoane — nici nu poate avea, deci nu-ți dă o listă de firme, ci
        îți arată cum se construiește. Conversația nu se salvează nicăieri.
      </p>

      {conversatie.length === 0 ? (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {INTREBARI.map((x) => (
            <li key={x}>
              <button
                type="button"
                onClick={() => trimite(x)}
                className="w-full colt-mic-a border border-hartie-umbra bg-hartie-calda px-4 py-3 text-left text-mic text-cerneala-moale transition-colors hover:border-caramiziu-400 hover:text-cerneala"
              >
                {x}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 grid gap-4">
          {conversatie.map((s, i) => (
            <div
              key={i}
              className={
                s.rol === "om"
                  ? "colt-mic-b bg-cerneala px-4 py-3 text-mic text-hartie sm:ml-16"
                  : "colt-mic-a border border-hartie-umbra bg-hartie-calda px-4 py-3.5 text-mic text-cerneala sm:mr-10"
              }
            >
              {s.rol === "consultant" ? (
                <Scris text={s.text} />
              ) : (
                <p className="whitespace-pre-wrap">{s.text}</p>
              )}
            </div>
          ))}
          {scrie && conversatie.at(-1)?.rol === "om" && (
            <p className="text-mic text-cerneala-slab">Se gândește…</p>
          )}
          <div ref={jos} />
        </div>
      )}

      {eroare && (
        <p
          role="alert"
          className="mt-4 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {eroare}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void trimite(intrebare);
        }}
        className="mt-5 flex flex-wrap items-end gap-3"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Întrebarea ta</span>
          <input
            value={intrebare}
            onChange={(e) => setIntrebare(e.target.value)}
            maxLength={1000}
            placeholder="Scrie o întrebare…"
            className="colt-mic-a min-h-12 w-full border-2 border-hartie-umbra bg-hartie px-4 py-2.5 text-mic text-cerneala"
          />
        </label>
        <button
          type="submit"
          disabled={scrie || intrebare.trim() === ""}
          className="min-h-12 rounded-full bg-caramiziu-700 px-6 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-600 disabled:opacity-50"
        >
          {scrie ? "Se gândește…" : "Întreabă"}
        </button>
        {conversatie.length > 0 && !scrie && (
          <button
            type="button"
            onClick={() => {
              setConversatie([]);
              setEroare("");
            }}
            className="min-h-12 font-titlu text-nota font-bold text-cerneala-moale underline underline-offset-4 hover:text-cerneala"
          >
            Începe altă discuție
          </button>
        )}
      </form>
    </section>
  );
}

/**
 * Textul consultantului, cu titluri și liste.
 *
 * Același scris simplu ca la `/admin/scrie`: `##` e subtitlu, `-` e punct de
 * listă, rând gol e paragraf nou. Fără bibliotecă de Markdown pentru patru
 * reguli, și fără `dangerouslySetInnerHTML` pentru text venit de la un model.
 */
function Scris({ text }: { text: string }) {
  const bucati = text.split(/\n{2,}/).filter((x) => x.trim() !== "");
  return (
    <div className="grid gap-2.5">
      {bucati.map((b, i) => {
        if (b.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="font-titlu text-mic font-bold text-caramiziu-800"
            >
              {b.slice(3).trim()}
            </h3>
          );
        }
        const randuri = b.split("\n");
        if (randuri.every((r) => /^\s*(?:[-*]|\d+\.)\s+/.test(r))) {
          return (
            <ul key={i} className="grid gap-1.5 pl-1">
              {randuri.map((r, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden="true" className="text-caramiziu-600">
                    ·
                  </span>
                  <span>{r.replace(/^\s*(?:[-*]|\d+\.)\s+/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="leading-relaxed whitespace-pre-wrap">
            {b}
          </p>
        );
      })}
    </div>
  );
}
