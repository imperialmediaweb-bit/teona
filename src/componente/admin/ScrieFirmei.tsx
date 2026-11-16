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
  /** A cerut să nu mai primească e-mailuri: nu se poate bifa. */
  faraEmailuri?: boolean;
};

const camp =
  "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2.5 text-mic text-cerneala";

function mb(o: number) {
  return o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} KB` : `${(o / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

const MAXIM_FISIERE = 5;
const MAXIM_TOTAL = 10 * 1024 * 1024;
const ACCEPTATE = /\.(pdf|docx?|pptx?|xlsx?|jpe?g|png|webp)$/i;

/**
 * Ce e greșit la atașamente, spus înainte de trimitere. Pe server se verifică
 * oricum; aici omul află pe loc, cu fișierele încă alese — după o eroare de
 * la server, browserul nu mai ține fișierele, iar e-mailul ar pleca fără ele.
 */
export function problemaAtasamente(fisiere: File[]): string | null {
  if (fisiere.length > MAXIM_FISIERE) return `Cel mult ${MAXIM_FISIERE} fișiere. Scoate ${fisiere.length - MAXIM_FISIERE}.`;
  const rau = fisiere.find((f) => !ACCEPTATE.test(f.name));
  if (rau) return `„${rau.name}” nu e PDF, Word, PowerPoint, Excel sau poză.`;
  const total = fisiere.reduce((t, f) => t + f.size, 0);
  if (total > MAXIM_TOTAL) return `Fișierele au împreună ${mb(total)}; merg cel mult 10 MB. Scoate ceva sau pune un link.`;
  return null;
}

function Atasamente({ intrare }: { intrare: React.RefObject<HTMLInputElement | null> }) {
  const [lista, setLista] = useState<File[]>([]);
  const [lucreaza, setLucreaza] = useState(false);
  const puse = (fisiere: File[]) => {
    const c = intrare.current;
    if (!c) return;
    const dt = new DataTransfer();
    fisiere.forEach((f) => dt.items.add(f));
    c.files = dt.files;
    setLista(fisiere);
  };
  /*
    Alegerea a doua se adaugă la prima: cine pune întâi contractul și apoi
    prezentarea nu trebuie să piardă contractul. Pozele mari se micșorează
    aici (câmpul are `data-fara-micsorare`, ca MicsoreazaPoza să nu înlocuiască
    lista cu numai ultima alegere).
  */
  const alese = async (noi: File[]) => {
    setLucreaza(true);
    const { micsoreaza } = await import("@/componente/admin/MicsoreazaPoza");
    const mici = await Promise.all(noi.map(async (f) => (await micsoreaza(f).catch(() => null)) ?? f));
    setLucreaza(false);
    puse([...lista, ...mici]);
  };
  const total = lista.reduce((t, f) => t + f.size, 0);
  const problema = problemaAtasamente(lista);
  return (
    <div className="grid gap-2">
      <span className="font-titlu text-mic font-bold text-cerneala">Atașamente</span>
      <label className="flex cursor-pointer items-center gap-3 rounded-moale border-2 border-dashed border-hartie-umbra bg-hartie px-4 py-3 text-mic text-cerneala-moale focus-within:border-caramiziu-700 focus-within:ring-2 focus-within:ring-caramiziu-400 hover:border-caramiziu-400">
        <span className="text-xl">📎</span>
        <span>
          {lucreaza
            ? "Se pregătesc pozele…"
            : "Alege fișiere: prezentarea, contractul, poze (PDF, Word, PowerPoint, Excel, JPG, PNG). Cel mult 5, împreună sub 10 MB. Poți alege de mai multe ori."}
        </span>
        <input
          ref={intrare}
          type="file"
          name="fisier"
          multiple
          data-fara-micsorare
          className="sr-only"
          onChange={(e) => {
            const noi = Array.from(e.target.files ?? []);
            // Câmpul ține acum numai alegerea nouă; lista întreagă se pune înapoi în `alese`.
            if (noi.length) void alese(noi);
            else puse(lista);
          }}
        />
      </label>
      {lista.length > 0 && (
        <ul className="grid gap-1.5">
          {lista.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-moale bg-hartie-calda px-3 py-1.5 text-mic">
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-nota text-cerneala-slab">{mb(f.size)}</span>
              <button type="button" onClick={() => puse(lista.filter((_, j) => j !== i))} aria-label={`Scoate ${f.name}`} className="px-2 font-bold text-caramiziu-700">
                ✕
              </button>
            </li>
          ))}
          <li className="text-nota text-cerneala-slab">Împreună: {mb(total)}</li>
        </ul>
      )}
      {problema && (
        <p role="alert" className="text-mic font-semibold text-caramiziu-800">
          {problema}
        </p>
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
        <button type="button" className="text-mic font-semibold text-caramiziu-700 underline" onClick={() => vizibile.filter((f) => !f.faraEmailuri).forEach((f) => comuta(f.id, true))}>
          Bifează-le pe toate de mai jos
        </button>
        <button type="button" className="text-mic font-semibold text-cerneala-moale underline" onClick={() => setAlese(new Set())}>
          Niciuna
        </button>
      </div>
      <p className={`text-mic font-semibold ${alese.size > limita ? "text-caramiziu-800" : "text-cerneala"}`}>
        {alese.size} bifate{alese.size > limita ? ` — cel mult ${limita} o dată` : ""}
      </p>
      {/*
        Ce pleacă la server sunt bifele, nu căsuțele de pe ecran: o firmă
        bifată și ascunsă apoi de căutare tot primește e-mailul.
      */}
      {[...alese].map((id) => (
        <input key={id} type="hidden" name="firme" value={id} />
      ))}
      <ul className="grid max-h-80 min-w-0 gap-1 overflow-y-auto">
        {vizibile.map((f) => (
          <li key={f.id}>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-moale px-2 py-1.5 hover:bg-hartie-calda">
              <input
                type="checkbox"
                value={f.id}
                checked={alese.has(f.id)}
                disabled={f.faraEmailuri}
                onChange={(e) => comuta(f.id, e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-caramiziu-700"
              />
              <span className="min-w-0 text-mic break-words [overflow-wrap:anywhere]">
                <span className="font-semibold text-cerneala">{f.denumire}</span>
                <span className="text-cerneala-slab"> · {f.persoana} · {f.email} · {f.eticheta}</span>
                {f.faraEmailuri && <span className="ml-1 font-semibold text-caramiziu-800">· nu vrea e-mailuri</span>}
              </span>
            </label>
          </li>
        ))}
        {vizibile.length === 0 && <li className="px-2 text-mic text-cerneala-slab">Nicio firmă.</li>}
      </ul>
    </fieldset>
  );
}

/**
 * „Vezi cum arată” și „Trimite-mi o probă”: același e-mail pe care îl
 * primește firma, compus pe server cu aceeași funcție ca trimiterea.
 * Atașamentele nu pleacă aici: se văd în listă, iar proba e despre text.
 */
function Previzualizare({ formular }: { formular: React.RefObject<HTMLFormElement | null> }) {
  const [vedere, setVedere] = useState<{ html: string; deLa: string; subiect: string; pentru: string | null } | null>(null);
  const [stare, setStare] = useState<{ ton: "bun" | "rau"; text: string } | null>(null);
  const [lucreaza, setLucreaza] = useState<"vezi" | "proba" | null>(null);
  const cere = async (fac: "vezi" | "proba") => {
    const f = formular.current;
    if (!f) return;
    const date = new FormData(f);
    date.delete("fisier");
    date.set("fac", fac);
    setLucreaza(fac);
    setStare(null);
    try {
      const r = await fetch("/api/admin/firme/previzualizare", { method: "POST", body: date, credentials: "same-origin" });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) {
        setStare({ ton: "rau", text: j?.mesaj ?? (r.status === 403 ? "Sesiunea a expirat. Intră din nou (ce ai scris rămâne aici)." : "N-a mers. Încearcă din nou.") });
      } else if (fac === "vezi") {
        setVedere(j);
      } else {
        setStare({ ton: "bun", text: `Proba a plecat la ${j.trimisLa}. Uită-te în căsuță (și în Spam).` });
      }
    } catch {
      setStare({ ton: "rau", text: "Nu s-a putut ajunge la server. Verifică internetul." });
    }
    setLucreaza(null);
  };
  return (
    <div className="grid gap-3" data-previzualizare>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void cere("vezi")} disabled={lucreaza !== null} className="rounded-full border border-cerneala-slab bg-hartie px-4 py-2 text-mic font-semibold text-cerneala hover:border-caramiziu-700 disabled:opacity-60">
          {lucreaza === "vezi" ? "Se pregătește…" : vedere ? "Reîmprospătează previzualizarea" : "Vezi cum arată"}
        </button>
        <button type="button" onClick={() => void cere("proba")} disabled={lucreaza !== null} className="rounded-full border border-cerneala-slab bg-hartie px-4 py-2 text-mic font-semibold text-cerneala hover:border-caramiziu-700 disabled:opacity-60">
          {lucreaza === "proba" ? "Se trimite proba…" : "Trimite-mi o probă"}
        </button>
      </div>
      {stare && (
        <p role={stare.ton === "rau" ? "alert" : "status"} className={`text-mic font-semibold ${stare.ton === "rau" ? "text-caramiziu-800" : "text-turcoaz-900"}`}>
          {stare.text}
        </p>
      )}
      {vedere && (
        <div className="overflow-hidden rounded-moale border border-hartie-umbra bg-hartie">
          <div className="grid gap-0.5 border-b border-hartie-umbra bg-hartie-calda px-4 py-2.5 text-mic [overflow-wrap:anywhere]">
            <p>
              <span className="text-cerneala-slab">De la: </span>
              <span className="font-semibold text-cerneala">{vedere.deLa}</span>
            </p>
            <p>
              <span className="text-cerneala-slab">Subiect: </span>
              <span className="font-semibold text-cerneala">{vedere.subiect}</span>
            </p>
            <p className="text-nota text-cerneala-slab">
              {vedere.pentru ? `Așa îl vede ${vedere.pentru}.` : "Cu un nume de exemplu; alege o firmă ca să-l vezi cu numele ei."} Butoanele din previzualizare nu duc nicăieri.
            </p>
          </div>
          <iframe title="Cum arată e-mailul" srcDoc={vedere.html} sandbox="" className="h-[520px] w-full bg-white" />
        </div>
      )}
    </div>
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
  const [eroare, setEroare] = useState<string | null>(null);
  const fisiere = useRef<HTMLInputElement>(null);
  const formular = useRef<HTMLFormElement>(null);
  const lot = Boolean(firme);
  // Înapoi din browser aduce pagina din memorie, cu butonul încă „Se trimite…”.
  useEffect(() => {
    const la = () => setTrimite(false);
    window.addEventListener("pageshow", la);
    return () => window.removeEventListener("pageshow", la);
  }, []);
  return (
    <form
      ref={formular}
      action="/api/admin/firme/mesaje"
      method="post"
      encType="multipart/form-data"
      className="grid gap-4"
      onSubmit={(e) => {
        // Editorul oprește trimiterea când textul e gol: butonul nu se blochează.
        if (e.defaultPrevented) return;
        const p = problemaAtasamente(Array.from(fisiere.current?.files ?? []));
        if (p) {
          e.preventDefault();
          setEroare(p);
          return;
        }
        if (lot && !e.currentTarget.querySelector('input[name="firme"]')) {
          e.preventDefault();
          setEroare("Bifează cel puțin o firmă.");
          return;
        }
        setEroare(null);
        setTrimite(true);
      }}
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
        {/*
          Subiectul de răspuns stă ca sugestie, nu scris în câmp: altfel
          ciorna (TineCiorna completează numai câmpuri goale) nu mai putea
          pune înapoi subiectul scris de om după o eroare.
        */}
        <input name="subiect" placeholder={subiect || undefined} required={!subiect} maxLength={200} className={camp} />
        {subiect && <input type="hidden" name="subiect_implicit" value={subiect} />}
      </label>
      <div className="grid gap-1.5">
        <span className="font-titlu text-mic font-bold text-cerneala">Textul</span>
        <span className="text-nota text-cerneala-slab">
          Scrie <code className="rounded bg-hartie-umbra px-1">{"{firma}"}</code> sau{" "}
          <code className="rounded bg-hartie-umbra px-1">{"{persoana}"}</code> și se pun singure numele firmei
          și al omului. Jos se pun singure: rândul „Dacă nu doriți să mai primiți mesaje de la noi, răspundeți cu «NU»…” și semnătura cu numele tău și datele asociației.
        </span>
        <EditorText name="continut" defaultValue="" minim={2} />
      </div>
      <Atasamente intrare={fisiere} />
      <Previzualizare formular={formular} />
      {lot && (
        <label className="flex items-start gap-2.5 text-mic text-cerneala">
          <input type="checkbox" name="confirm" value="da" required className="mt-0.5 size-4 shrink-0 accent-caramiziu-700" />
          Am citit e-mailul. Fiecare firmă bifată îl primește separat, cu numele ei.
        </label>
      )}
      {eroare && (
        <p role="alert" className="text-mic font-semibold text-caramiziu-800">
          {eroare}
        </p>
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
