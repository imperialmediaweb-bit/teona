"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EditorText from "@/componente/admin/EditorText";
import Pictograma from "@/componente/Pictograma";

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

/**
 * „Către cine?”: firmele din listă, bifate (una sau mai multe), și cel mult o
 * firmă nouă scrisă pe loc. Firma nouă se pune în listă, ca „Nou”, și
 * primește e-mailul odată cu celelalte.
 */
function AlegeFirme({
  firme,
  limita,
  alese,
  setAlese,
  nou,
  setNou,
}: {
  firme: FirmaDeAles[];
  limita: number;
  alese: Set<string>;
  setAlese: React.Dispatch<React.SetStateAction<Set<string>>>;
  nou: boolean;
  setNou: (x: boolean) => void;
}) {
  const [cauta, setCauta] = useState("");
  const [stadiu, setStadiu] = useState("");
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
  const total = alese.size + (nou ? 1 : 0);
  const peNume = new Map(firme.map((f) => [f.id, f.denumire]));
  return (
    <fieldset className="grid gap-3 rounded-moale border border-hartie-umbra bg-hartie p-4" data-catre-cine>
      <legend className="px-1 font-titlu text-mic font-bold text-cerneala">Către cine?</legend>

      {/* Ce e ales, la vedere: omul vede pe loc cui pleacă e-mailul. */}
      {total > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Firmele alese">
          {[...alese].map((id) => (
            <li key={id} className="flex items-center gap-1 rounded-full bg-caramiziu-50 py-0.5 pr-1 pl-3 text-mic font-semibold text-caramiziu-900">
              {peNume.get(id) ?? "firmă"}
              <button type="button" onClick={() => comuta(id, false)} aria-label={`Scoate ${peNume.get(id) ?? "firma"}`} className="px-1.5 font-bold">
                ✕
              </button>
            </li>
          ))}
          {nou && <li className="rounded-full bg-turcoaz-50 px-3 py-0.5 text-mic font-semibold text-turcoaz-900">firmă nouă</li>}
        </ul>
      ) : (
        <p className="text-mic text-cerneala-slab">Caută o firmă și bifeaz-o, sau adaugă una nouă. Poți alege mai multe.</p>
      )}
      {total > limita && (
        <p role="alert" className="text-mic font-semibold text-caramiziu-800">
          Cel mult {limita} firme o dată. Scoate {total - limita}.
        </p>
      )}
      {/*
        Ce pleacă la server sunt bifele, nu căsuțele de pe ecran: o firmă
        bifată și ascunsă apoi de căutare tot primește e-mailul.
      */}
      {[...alese].map((id) => (
        <input key={id} type="hidden" name="firme" value={id} />
      ))}

      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-1 basis-56">
          <Pictograma nume="lupa" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cerneala-slab" />
          <input
            type="search"
            value={cauta}
            onChange={(e) => setCauta(e.target.value)}
            placeholder="Caută firma după nume, persoană sau e-mail"
            aria-label="Caută firma"
            className={`${camp} pl-9`}
          />
        </label>
        {stadii.length > 1 && (
          <select value={stadiu} onChange={(e) => setStadiu(e.target.value)} className={`${camp} sm:w-auto`} aria-label="Stadiul">
            <option value="">Orice stadiu</option>
            {stadii.map(([id, et]) => (
              <option key={id} value={id}>
                {et}
              </option>
            ))}
          </select>
        )}
      </div>
      {firme.length > 0 && (
        <>
          <ul className="grid max-h-72 min-w-0 gap-1 overflow-y-auto">
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
            {vizibile.length === 0 && <li className="px-2 text-mic text-cerneala-slab">Nicio firmă cu numele ăsta. Adaug-o mai jos, ca firmă nouă.</li>}
          </ul>
          {vizibile.length > 1 && (
            <p className="flex flex-wrap gap-x-4 text-nota">
              <button type="button" className="font-semibold text-caramiziu-700 underline" onClick={() => vizibile.filter((f) => !f.faraEmailuri).forEach((f) => comuta(f.id, true))}>
                Bifează-le pe toate cele de mai sus
              </button>
              {alese.size > 0 && (
                <button type="button" className="font-semibold text-cerneala-moale underline" onClick={() => setAlese(new Set())}>
                  Scoate toate bifele
                </button>
              )}
            </p>
          )}
        </>
      )}

      {nou ? (
        <div className="grid gap-3 rounded-moale border border-turcoaz-200 bg-turcoaz-50/40 p-3 sm:grid-cols-2" data-firma-noua>
          <p className="flex items-center justify-between font-titlu text-mic font-bold text-cerneala sm:col-span-2">
            Firmă nouă
            <button type="button" onClick={() => setNou(false)} className="text-nota font-semibold text-cerneala-moale underline">
              Renunț
            </button>
          </p>
          <label className="grid gap-1 text-mic">
            Numele firmei
            <input name="nou_denumire" required maxLength={200} className={camp} />
          </label>
          <label className="grid gap-1 text-mic">
            Persoana de contact
            <input name="nou_persoana" maxLength={150} placeholder="Ex.: Maria Popescu" className={camp} />
          </label>
          <label className="grid gap-1 text-mic">
            E-mail
            <input name="nou_email" type="email" required className={camp} />
          </label>
          <label className="grid gap-1 text-mic">
            CUI (dacă îl știi)
            <input name="nou_cui" inputMode="numeric" maxLength={20} className={camp} />
          </label>
          <p className="text-nota text-cerneala-slab sm:col-span-2">Se adaugă în lista de firme, cu stadiul „Nou”; după trimitere trece singură pe „Contactat”.</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNou(true)}
          className="inline-flex items-center gap-1.5 justify-self-start rounded-full border border-turcoaz-600 px-4 py-1.5 text-mic font-semibold text-turcoaz-900 hover:bg-turcoaz-50"
        >
          <Pictograma nume="plus" className="size-4" strokeWidth={2.25} />
          Firmă nouă
        </button>
      )}
    </fieldset>
  );
}

/**
 * Campaniile publicate pe site, de pus în e-mail ca un card cu poză și
 * buton. Cel mult trei: mai multe ar face din scrisoare un buletin.
 */
function AlegeCampanii({ campanii }: { campanii: Array<{ id: string; titlu: string }> }) {
  const [alese, setAlese] = useState<string[]>([]);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-titlu text-mic font-bold text-cerneala">Pune în e-mail o campanie de pe site</legend>
      {campanii.length === 0 ? (
        <p className="text-nota text-cerneala-slab">
          Nicio campanie publicată încă. Se adaugă din{" "}
          <a href="/admin/scrie/nou?fel=campanie" className="font-semibold text-caramiziu-700 underline">
            Campanii
          </a>
          .
        </p>
      ) : (
        <>
          <span className="text-nota text-cerneala-slab">
            Apare sub text, cu poza ei și butonul „Vezi campania”. Cel mult 3.
          </span>
          <ul className="grid gap-1">
            {campanii.map((c) => {
              const bifat = alese.includes(c.id);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-moale px-2 py-1.5 hover:bg-hartie-calda">
                    <input
                      type="checkbox"
                      name="campanii"
                      value={c.id}
                      checked={bifat}
                      disabled={!bifat && alese.length >= 3}
                      onChange={(e) => setAlese((a) => (e.target.checked ? [...a, c.id] : a.filter((x) => x !== c.id)))}
                      className="mt-1 size-4 shrink-0 accent-caramiziu-700"
                    />
                    <span className="min-w-0 text-mic text-cerneala [overflow-wrap:anywhere]">{c.titlu}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
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
  campanii = [],
  aleseLaInceput = [],
}: {
  /** Firmele bifate deja când se deschide pagina (de pe pagina unei firme, de pildă). */
  aleseLaInceput?: string[];
  campanii?: Array<{ id: string; titlu: string }>;
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
  const [alese, setAlese] = useState<Set<string>>(() => new Set(aleseLaInceput));
  const [nou, setNou] = useState(false);
  const destinatari = alese.size + (nou ? 1 : 0);
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
        if (lot && destinatari === 0) {
          e.preventDefault();
          setEroare("Alege cel puțin o firmă, sau adaugă una nouă.");
          return;
        }
        if (lot && destinatari > limita) {
          e.preventDefault();
          setEroare(`Cel mult ${limita} firme o dată.`);
          return;
        }
        setEroare(null);
        setTrimite(true);
      }}
    >
      {firmaId && <input type="hidden" name="firma" value={firmaId} />}
      {firme && <AlegeFirme firme={firme} limita={limita} alese={alese} setAlese={setAlese} nou={nou} setNou={setNou} />}
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
          și al omului. Din bara editorului pui poze în text (Poză) și linkuri (selectezi cuvintele, apoi Link). Jos se pun singure semnătura cu numele tău și datele asociației, și rândul „Dacă nu doriți să mai primiți mesaje de la noi, apăsați aici.”
        </span>
        <EditorText name="continut" defaultValue="" minim={2} />
      </div>
      <AlegeCampanii campanii={campanii} />
      <Atasamente intrare={fisiere} />
      <Previzualizare formular={formular} />
      {lot && destinatari > 1 && (
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
          className="inline-flex items-center gap-2 rounded-full bg-caramiziu-700 px-6 py-2.5 font-titlu text-mic font-bold text-hartie shadow-sm hover:bg-caramiziu-800 disabled:bg-cerneala-slab"
        >
          {!trimite && <Pictograma nume="trimis" className="size-4" />}
          {trimite ? "Se trimite…" : lot && destinatari > 1 ? `Trimite celor ${destinatari} firme` : "Trimite"}
        </button>
      </div>
    </form>
  );
}
