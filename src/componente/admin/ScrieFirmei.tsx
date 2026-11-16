"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EditorText from "@/componente/admin/EditorText";

/**
 * Scrisoarea către o firmă (sau către mai multe, fiecare cu a ei), cu
 * atașamente. Pleacă la `/api/admin/firme/mesaje`.
 */

export type FirmaDeAles = {
  id: string;
  denumire: string;
  persoana: string;
  email: string;
  stadiu: string;
  eticheta: string;
};

const camp =
  "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2.5 text-mic text-cerneala";

function mb(o: number) {
  return o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} KB` : `${(o / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

function Atasamente() {
  const intrare = useRef<HTMLInputElement>(null);
  const [lista, setLista] = useState<File[]>([]);
  useEffect(() => {
    const c = intrare.current;
    if (!c) return;
    const la = () => setLista(Array.from(c.files ?? []));
    c.addEventListener("change", la);
    return () => c.removeEventListener("change", la);
  }, []);
  const scoate = (i: number) => {
    const c = intrare.current;
    if (!c) return;
    const dt = new DataTransfer();
    Array.from(c.files ?? []).forEach((f, j) => j !== i && dt.items.add(f));
    c.files = dt.files;
    setLista(Array.from(dt.files));
  };
  const total = lista.reduce((t, f) => t + f.size, 0);
  return (
    <div className="grid gap-2">
      <span className="font-titlu text-mic font-bold text-cerneala">Atașamente</span>
      <label className="flex cursor-pointer items-center gap-3 rounded-moale border-2 border-dashed border-hartie-umbra bg-hartie px-4 py-3 text-mic text-cerneala-moale hover:border-caramiziu-400">
        <span className="text-xl">📎</span>
        <span>
          Alege fișiere: prezentarea, contractul, poze (PDF, Word, PowerPoint, Excel, JPG, PNG).
          Cel mult 5, împreună sub 10 MB.
        </span>
        <input ref={intrare} type="file" name="fisier" multiple className="sr-only" />
      </label>
      {lista.length > 0 && (
        <ul className="grid gap-1.5">
          {lista.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-moale bg-hartie-calda px-3 py-1.5 text-mic">
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-nota text-cerneala-slab">{mb(f.size)}</span>
              <button type="button" onClick={() => scoate(i)} aria-label={`Scoate ${f.name}`} className="px-2 font-bold text-caramiziu-700">
                ✕
              </button>
            </li>
          ))}
          <li className={`text-nota ${total > 10 * 1024 * 1024 ? "font-bold text-caramiziu-800" : "text-cerneala-slab"}`}>
            Împreună: {mb(total)}
            {total > 10 * 1024 * 1024 && " — prea mult, scoate ceva sau pune un link"}
          </li>
        </ul>
      )}
    </div>
  );
}

function AlegeFirme({ firme, limita }: { firme: FirmaDeAles[]; limita: number }) {
  const [cauta, setCauta] = useState("");
  const [stadiu, setStadiu] = useState("");
  const [alese, setAlese] = useState<Set<string>>(new Set());
  const stadii = useMemo(() => [...new Map(firme.map((f) => [f.stadiu, f.eticheta])).entries()], [firme]);
  const fd = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const vizibile = firme.filter(
    (f) =>
      (!stadiu || f.stadiu === stadiu) &&
      (!cauta || fd(`${f.denumire} ${f.persoana} ${f.email}`).includes(fd(cauta))),
  );
  const comuta = (id: string, da: boolean) =>
    setAlese((s) => {
      const n = new Set(s);
      if (da) n.add(id);
      else n.delete(id);
      return n;
    });
  return (
    <fieldset className="grid gap-3 rounded-moale border border-hartie-umbra bg-hartie p-4">
      <legend className="px-1 font-titlu text-mic font-bold text-cerneala">Către ce firme</legend>
      <div className="flex flex-wrap gap-2">
        <input value={cauta} onChange={(e) => setCauta(e.target.value)} placeholder="Caută firma" className={`${camp} max-w-xs`} />
        <select value={stadiu} onChange={(e) => setStadiu(e.target.value)} className={`${camp} w-auto`} aria-label="Stadiul">
          <option value="">Toate stadiile</option>
          {stadii.map(([id, et]) => (
            <option key={id} value={id}>
              {et}
            </option>
          ))}
        </select>
        <button type="button" className="text-mic font-semibold text-caramiziu-700 underline" onClick={() => vizibile.forEach((f) => comuta(f.id, true))}>
          Bifează-le pe toate de mai jos
        </button>
        <button type="button" className="text-mic font-semibold text-cerneala-moale underline" onClick={() => setAlese(new Set())}>
          Niciuna
        </button>
      </div>
      <p className={`text-mic font-semibold ${alese.size > limita ? "text-caramiziu-800" : "text-cerneala"}`}>
        {alese.size} bifate{alese.size > limita ? ` — cel mult ${limita} o dată` : ""}
      </p>
      <ul className="grid max-h-80 gap-1 overflow-y-auto">
        {vizibile.map((f) => (
          <li key={f.id}>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-moale px-2 py-1.5 hover:bg-hartie-calda">
              <input
                type="checkbox"
                name="firme"
                value={f.id}
                checked={alese.has(f.id)}
                onChange={(e) => comuta(f.id, e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-caramiziu-700"
              />
              <span className="min-w-0 text-mic">
                <span className="font-semibold text-cerneala">{f.denumire}</span>
                <span className="text-cerneala-slab"> · {f.persoana} · {f.email} · {f.eticheta}</span>
              </span>
            </label>
          </li>
        ))}
        {vizibile.length === 0 && <li className="px-2 text-mic text-cerneala-slab">Nicio firmă.</li>}
      </ul>
    </fieldset>
  );
}

export default function ScrieFirmei({
  firmaId,
  catre,
  subiect = "",
  firme,
  limita = 30,
}: {
  firmaId?: string;
  catre?: string;
  subiect?: string;
  firme?: FirmaDeAles[];
  limita?: number;
}) {
  const [trimite, setTrimite] = useState(false);
  const lot = Boolean(firme);
  return (
    <form
      action="/api/admin/firme/mesaje"
      method="post"
      encType="multipart/form-data"
      className="grid gap-4"
      onSubmit={() => setTrimite(true)}
    >
      {firmaId && <input type="hidden" name="firma" value={firmaId} />}
      {firme && <AlegeFirme firme={firme} limita={limita} />}
      {!lot && (
        <label className="grid gap-1.5">
          <span className="font-titlu text-mic font-bold text-cerneala">Către</span>
          <input name="catre" type="text" inputMode="email" defaultValue={catre} required className={camp} />
          <span className="text-nota text-cerneala-slab">
            Mai mulți oameni din aceeași firmă? Pune adresele despărțite prin virgulă. Primesc același e-mail.
          </span>
        </label>
      )}
      <label className="grid gap-1.5">
        <span className="font-titlu text-mic font-bold text-cerneala">Subiect</span>
        <input name="subiect" defaultValue={subiect} required maxLength={200} className={camp} />
      </label>
      <div className="grid gap-1.5">
        <span className="font-titlu text-mic font-bold text-cerneala">Textul</span>
        <span className="text-nota text-cerneala-slab">
          Scrie <code className="rounded bg-hartie-umbra px-1">{"{firma}"}</code> sau{" "}
          <code className="rounded bg-hartie-umbra px-1">{"{persoana}"}</code> și se pun singure numele firmei
          și al omului. Semnătura cu numele tău și datele asociației se pune singură.
        </span>
        <EditorText name="continut" defaultValue="" minim={2} />
      </div>
      <Atasamente />
      {lot && (
        <label className="flex items-start gap-2.5 text-mic text-cerneala">
          <input type="checkbox" name="confirm" value="da" required className="mt-0.5 size-4 shrink-0 accent-caramiziu-700" />
          Am citit e-mailul. Fiecare firmă bifată îl primește separat, cu numele ei.
        </label>
      )}
      <div>
        <button
          type="submit"
          disabled={trimite}
          className="rounded-full bg-caramiziu-700 px-6 py-2.5 font-titlu text-mic font-bold text-hartie hover:bg-caramiziu-800 disabled:bg-cerneala-slab"
        >
          {trimite ? "Se trimite…" : lot ? "Trimite fiecărei firme" : "Trimite"}
        </button>
      </div>
    </form>
  );
}
