"use client";

import { useEffect, useRef, useState } from "react";
import EditorText from "@/componente/admin/EditorText";
import { micsoreaza } from "@/componente/admin/MicsoreazaPoza";
import { BLOCURI, type FelSablon } from "@/lib/email/campanie-blocuri";

/**
 * E-mailul de campanie, compus bloc cu bloc.
 *
 * Fundraiserul, noiembrie 2026: „să aleg ce apare în mailuri, acum sunt multe
 * presetate”. Aici fiecare bloc se poate muta (↑ ↓), scoate (✕) sau adăuga:
 * text scris de mână (cu îngroșat, culoare, link), buton cu link ales,
 * poză, sau unul dintre blocurile gata făcute (Donez acum, conturile, SMS…).
 *
 * Ce pleacă la server: `compozitie` (ordinea, ca JSON) și câmpurile fiecărui
 * bloc scris, cu numele după cheia lui (`bt_<k>`, `bb_e_<k>`…). Serverul le
 * verifică pe toate (`citesteCompozitia` din ruta `sablon`).
 */

type Rand =
  | { k: string; tip: "gata"; id: string }
  | { k: string; tip: "text" | "buton" | "poza" };

let urmatorul = 0;
const cheie = () => `b${Date.now().toString(36)}${(urmatorul++).toString(36)}`;

const implicit = (fel: FelSablon): Rand[] =>
  BLOCURI[fel].map((b) => ({ k: cheie(), tip: "gata", id: b.id }));

const NUME_TIP = { text: "Text", buton: "Buton", poza: "Poză" } as const;

const butonMic =
  "min-h-9 min-w-9 rounded-moale border border-hartie-umbra bg-hartie px-2.5 font-titlu text-mic font-bold text-cerneala hover:border-caramiziu-400 disabled:opacity-30";
const camp =
  "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic text-cerneala";

function BlocPoza({ k }: { k: string }) {
  const [stare, setStare] = useState<{ adresa?: string; mesaj?: string; lucreaza?: boolean }>({});
  const id = useRef<HTMLInputElement>(null);
  async function urca(f: File) {
    setStare({ lucreaza: true, mesaj: "Se urcă poza…" });
    try {
      const mica = (await micsoreaza(f)) ?? f;
      const corp = new FormData();
      corp.append("poza", mica);
      const r = await fetch("/api/admin/poza-in-text", { method: "POST", body: corp });
      const d = (await r.json().catch(() => ({}))) as { id?: string; adresa?: string; mesaj?: string };
      if (!r.ok || !d.id) {
        setStare({ mesaj: d.mesaj ?? "Poza n-a putut fi urcată. Încearcă din nou." });
        return;
      }
      if (id.current) {
        id.current.value = d.id;
        id.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setStare({ adresa: d.adresa });
    } catch (e) {
      setStare({ mesaj: `Poza n-a putut fi urcată: ${(e as Error).message}` });
    }
  }
  return (
    <div className="grid gap-2">
      <input ref={id} type="hidden" name={`bp_${k}`} />
      {stare.adresa && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stare.adresa} alt="" className="max-h-48 w-auto rounded-moale object-contain" />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        data-fara-micsorare
        disabled={stare.lucreaza}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void urca(f);
        }}
        className="text-mic"
      />
      <input name={`bp_alt_${k}`} maxLength={200} placeholder="Ce se vede în poză (pentru cine n-o vede)" className={camp} />
      {stare.mesaj && <p className="text-nota font-semibold text-caramiziu-800">{stare.mesaj}</p>}
    </div>
  );
}

function ListaFel({ fel, vizibil }: { fel: FelSablon; vizibil: boolean }) {
  const [randuri, setRanduri] = useState<Rand[]>(() => implicit(fel));
  const ascuns = useRef<HTMLInputElement>(null);
  const eticheta = (id: string) => BLOCURI[fel].find((b) => b.id === id)?.eticheta ?? id;
  const lipsa = BLOCURI[fel].filter((b) => !randuri.some((r) => r.tip === "gata" && r.id === b.id));

  // Ordinea pleacă într-un câmp ascuns; previzualizarea ascultă „input”.
  useEffect(() => {
    const c = ascuns.current;
    if (!c || !vizibil) return;
    c.value = JSON.stringify(
      randuri.map((r) => (r.tip === "gata" ? { tip: "gata", id: r.id } : { tip: r.tip, k: r.k })),
    );
    c.dispatchEvent(new Event("input", { bubbles: true }));
  }, [randuri, vizibil]);

  const muta = (i: number, cu: number) =>
    setRanduri((l) => {
      const n = [...l];
      const [x] = n.splice(i, 1);
      n.splice(i + cu, 0, x);
      return n;
    });
  const scoate = (i: number) => setRanduri((l) => l.filter((_, j) => j !== i));
  const adauga = (r: Rand) => setRanduri((l) => [...l, r]);

  return (
    <div hidden={!vizibil} className="grid gap-3">
      {vizibil && <input ref={ascuns} type="hidden" name="compozitie" />}
      <ol className="grid gap-2">
        {randuri.map((r, i) => (
          <li key={r.k} className="grid gap-2 colt-mic-a border border-hartie-umbra bg-hartie p-3" data-bloc={r.tip === "gata" ? r.id : r.tip}>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-mic font-semibold text-cerneala">
                {r.tip === "gata" ? (
                  eticheta(r.id)
                ) : (
                  <>
                    <span className="mr-1.5 rounded bg-caramiziu-50 px-1.5 py-0.5 font-titlu text-nota font-bold text-caramiziu-800">
                      Scris de tine
                    </span>
                    {NUME_TIP[r.tip]}
                  </>
                )}
              </span>
              <button type="button" aria-label="Mută mai sus" title="Mută mai sus" className={butonMic} disabled={i === 0} onClick={() => muta(i, -1)}>
                ↑
              </button>
              <button type="button" aria-label="Mută mai jos" title="Mută mai jos" className={butonMic} disabled={i === randuri.length - 1} onClick={() => muta(i, 1)}>
                ↓
              </button>
              <button type="button" aria-label="Scoate blocul" title="Scoate blocul" className={`${butonMic} text-caramiziu-800`} onClick={() => scoate(i)}>
                ✕
              </button>
            </div>
            {r.tip === "text" && <EditorText name={`bt_${r.k}`} defaultValue="" simplu minim={0} />}
            {r.tip === "buton" && (
              <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <input name={`bb_e_${r.k}`} maxLength={60} placeholder="Ce scrie pe buton" className={camp} />
                <input name={`bb_a_${r.k}`} placeholder="Unde duce (de ex. teona-ariana.ro/doneaza)" className={camp} />
                <select name={`bb_c_${r.k}`} className={camp} defaultValue="portocaliu">
                  <option value="portocaliu">Portocaliu</option>
                  <option value="turcoaz">Turcoaz</option>
                </select>
              </div>
            )}
            {r.tip === "poza" && <BlocPoza k={r.k} />}
          </li>
        ))}
      </ol>
      {randuri.length === 0 && (
        <p className="text-mic text-cerneala-moale">Nu e niciun bloc. E-mailul are doar titlul, textul tău și subsolul.</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-hartie-umbra pt-3">
        <span className="text-mic font-semibold text-cerneala">Adaugă:</span>
        <button type="button" className={butonMic} onClick={() => adauga({ k: cheie(), tip: "text" })}>
          + Text
        </button>
        <button type="button" className={butonMic} onClick={() => adauga({ k: cheie(), tip: "buton" })}>
          + Buton
        </button>
        <button type="button" className={butonMic} onClick={() => adauga({ k: cheie(), tip: "poza" })}>
          + Poză
        </button>
        {lipsa.length > 0 && (
          <select
            aria-label="Adaugă un bloc gata făcut"
            className={`${camp} w-auto`}
            value=""
            onChange={(e) => {
              if (e.target.value) adauga({ k: cheie(), tip: "gata", id: e.target.value });
            }}
          >
            <option value="">+ Bloc gata făcut…</option>
            {lipsa.map((b) => (
              <option key={b.id} value={b.id}>
                {b.eticheta}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="ml-auto text-nota text-cerneala-moale underline underline-offset-2"
          onClick={() => setRanduri(implicit(fel))}
        >
          Pune la loc ce era la început
        </button>
      </div>
    </div>
  );
}

export default function CompunereEmail({ felInitial }: { felInitial: FelSablon }) {
  const radacina = useRef<HTMLFieldSetElement>(null);
  const [fel, setFel] = useState<FelSablon>(felInitial);
  useEffect(() => {
    const f = radacina.current?.form;
    if (!f) return;
    const la = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t?.name === "fel" && t.checked && (t.value === "persoane" || t.value === "firme")) setFel(t.value);
    };
    f.addEventListener("change", la);
    return () => f.removeEventListener("change", la);
  }, []);
  return (
    <fieldset ref={radacina} className="grid gap-3 colt-mic-a border border-hartie-umbra bg-hartie-calda p-4">
      <legend className="px-1 font-titlu text-mic font-bold text-cerneala">Ce apare în e-mail</legend>
      <p className="text-nota text-cerneala-slab">
        Sub textul tău vin blocurile de mai jos, în ordinea asta. Le muți cu ↑ ↓, le scoți cu ✕ și adaugi
        text, buton sau poză. Subsolul cu datele asociației și dezabonarea apar mereu.
      </p>
      <ListaFel fel="persoane" vizibil={fel === "persoane"} />
      <ListaFel fel="firme" vizibil={fel === "firme"} />
    </fieldset>
  );
}
