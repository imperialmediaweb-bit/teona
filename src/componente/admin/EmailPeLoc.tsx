"use client";

import { useEffect, useRef, useState } from "react";
import EditorText from "@/componente/admin/EditorText";
import { micsoreaza } from "@/componente/admin/MicsoreazaPoza";
import { BLOCURI, type FelSablon } from "@/lib/email/campanie-blocuri";
import type { BucatiEditor } from "@/lib/email/campanie-sabloane";

/**
 * E-mailul de campanie, scris direct pe el.
 *
 * Fundraiserul, noiembrie 2026: „să aleg ce apare în mailuri, acum sunt multe
 * presetate”. Prima variantă era o listă de bife lângă o previzualizare; a
 * doua, o listă de blocuri. Amândouă cereau să te uiți în două locuri. Aici
 * e un singur loc: e-mailul, cum pleacă. Dai clic pe titlu și scrii; treci
 * cu mouse-ul peste un bloc și apar ↑ ↓ 🗑; între blocuri e un „+”.
 *
 * Ce pleacă la server e la fel ca înainte (`compozitie`, `bt_<k>`,
 * `bb_e_<k>`…, plus `titlu`, `text`, `poza_fisier`, `poza_alt`), deci ruta
 * `sablon` le verifică pe toate, ca până acum. Desenul blocurilor gata
 * făcute vine de pe server (`bucatiPentruEditor`): același HTML ca în e-mail.
 */

type Rand =
  | { k: string; tip: "gata"; id: string }
  | { k: string; tip: "text" | "buton" | "poza" };

let urmatorul = 0;
const cheie = () => `b${Date.now().toString(36)}${(urmatorul++).toString(36)}`;
const implicit = (fel: FelSablon): Rand[] =>
  BLOCURI[fel].map((b) => ({ k: cheie(), tip: "gata", id: b.id }));

const PORTOCALIU = "#b82b09";
const TURCOAZ = "#1e454a";
const FONT = "Arial,Helvetica,sans-serif";

const unealta =
  "grid size-8 place-items-center rounded-full bg-cerneala text-[15px] font-bold text-hartie shadow hover:bg-caramiziu-700 disabled:opacity-30";

/** Câmp de text care crește odată cu ce scrii, ca să semene cu pagina. */
function creste(e: HTMLTextAreaElement | null) {
  if (!e) return;
  e.style.height = "auto";
  e.style.height = `${e.scrollHeight}px`;
}

function PozaPrincipala({ implicita }: { implicita: { adresa: string; alt: string } }) {
  const [adresa, setAdresa] = useState<string | null>(null);
  const fisier = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const c = fisier.current;
    if (!c) return;
    let url: string | null = null;
    // MicsoreazaPoza înlocuiește fișierul și trimite din nou „change”.
    const la = () => {
      if (url) URL.revokeObjectURL(url);
      const f = c.files?.[0];
      url = f ? URL.createObjectURL(f) : null;
      setAdresa(url);
    };
    c.addEventListener("change", la);
    return () => {
      c.removeEventListener("change", la);
      if (url) URL.revokeObjectURL(url);
    };
  }, []);
  return (
    <div>
      <label className="group/poza relative block cursor-pointer" title="Schimbă poza">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={adresa ?? implicita.adresa} alt="" className="block h-auto w-full" />
        <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-cerneala/85 px-4 py-2 font-titlu text-mic font-bold text-hartie shadow group-hover/poza:bg-caramiziu-700">
          📷 {adresa ? "Schimbă poza" : "Pune poza ta"}
        </span>
        <input
          ref={fisier}
          id="poza_fisier"
          name="poza_fisier"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
        />
      </label>
      <input
        id="poza_alt"
        name="poza_alt"
        maxLength={200}
        placeholder="Ce se vede în poză (pentru cine n-o vede) — dacă lași gol, se ia titlul"
        className="block w-full border-b border-dashed border-hartie-umbra bg-hartie-calda/60 px-8 py-2 text-nota text-cerneala-moale outline-none focus:bg-caramiziu-50"
      />
    </div>
  );
}

function BlocButon({ k }: { k: string }) {
  const [culoare, setCuloare] = useState<"portocaliu" | "turcoaz">("portocaliu");
  return (
    <div className="grid justify-items-center gap-2 px-8 pt-3 pb-4">
      <span
        className="inline-block rounded-full px-2"
        style={{ backgroundColor: culoare === "turcoaz" ? TURCOAZ : PORTOCALIU }}
      >
        <input
          name={`bb_e_${k}`}
          maxLength={60}
          placeholder="Scrie ce apare pe buton"
          aria-label="Ce scrie pe buton"
          className="w-64 max-w-full bg-transparent px-6 py-4 text-center text-[17px] font-bold text-white outline-none placeholder:text-white/70"
          style={{ fontFamily: FONT }}
        />
      </span>
      <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2">
        <input
          name={`bb_a_${k}`}
          placeholder="Unde duce: teona-ariana.ro/doneaza"
          aria-label="Unde duce butonul"
          className="min-w-0 flex-1 rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 text-nota text-cerneala"
        />
        <input type="hidden" name={`bb_c_${k}`} value={culoare} />
        {(["portocaliu", "turcoaz"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Culoare ${c}`}
            title={c === "turcoaz" ? "Turcoaz" : "Portocaliu"}
            onClick={() => setCuloare(c)}
            className={`size-7 rounded-full border-2 ${culoare === c ? "border-cerneala" : "border-transparent"}`}
            style={{ backgroundColor: c === "turcoaz" ? TURCOAZ : PORTOCALIU }}
          />
        ))}
      </div>
    </div>
  );
}

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
    <div className="grid gap-2 px-8 pt-2 pb-4">
      <input ref={id} type="hidden" name={`bp_${k}`} />
      <label className="block cursor-pointer">
        {stare.adresa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stare.adresa} alt="" className="block h-auto w-full rounded-[14px]" />
        ) : (
          <span className="grid h-40 place-items-center rounded-[14px] border-2 border-dashed border-hartie-umbra bg-hartie-calda text-mic font-semibold text-cerneala-moale hover:border-caramiziu-400">
            {stare.lucreaza ? "Se urcă poza…" : "📷 Alege poza"}
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          data-fara-micsorare
          disabled={stare.lucreaza}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void urca(f);
          }}
        />
      </label>
      <input
        name={`bp_alt_${k}`}
        maxLength={200}
        placeholder="Ce se vede în poză (pentru cine n-o vede)"
        className="rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 text-nota text-cerneala"
      />
      {stare.mesaj && !stare.lucreaza && (
        <p className="text-nota font-semibold text-caramiziu-800">{stare.mesaj}</p>
      )}
    </div>
  );
}

function Plus({
  deschis,
  deschide,
  inchide,
  alege,
  lipsa,
}: {
  deschis: boolean;
  deschide: () => void;
  inchide: () => void;
  alege: (r: Rand) => void;
  lipsa: { id: string; eticheta: string }[];
}) {
  const cutie = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!deschis) return;
    const afara = (e: MouseEvent) => {
      if (!cutie.current?.contains(e.target as Node)) inchide();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && inchide();
    document.addEventListener("mousedown", afara);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", afara);
      document.removeEventListener("keydown", esc);
    };
  }, [deschis, inchide]);
  const optiune =
    "block w-full rounded-moale px-3 py-2 text-left text-mic text-cerneala hover:bg-caramiziu-50";
  return (
    <div ref={cutie} className="group/plus relative h-5" data-plus>
      <div className="absolute inset-x-8 top-1/2 h-px bg-caramiziu-400 opacity-0 transition-opacity group-hover/plus:opacity-100" />
      <button
        type="button"
        aria-label="Adaugă aici"
        title="Adaugă aici"
        onClick={deschis ? inchide : deschide}
        className={`absolute top-1/2 left-1/2 z-10 grid size-7 -translate-1/2 place-items-center rounded-full bg-caramiziu-700 text-lg leading-none font-bold text-white shadow transition-opacity hover:bg-caramiziu-800 ${deschis ? "opacity-100" : "opacity-40 group-hover/plus:opacity-100 focus:opacity-100"}`}
      >
        +
      </button>
      {deschis && (
        <div
          role="menu"
          className="absolute top-full left-1/2 z-30 mt-1 w-72 -translate-x-1/2 rounded-moale border border-hartie-umbra bg-hartie p-1.5 shadow-xl"
        >
          <p className="px-3 pt-1 pb-1 text-nota font-bold text-cerneala-slab uppercase">Scrii tu</p>
          <button type="button" role="menuitem" className={optiune} onClick={() => alege({ k: cheie(), tip: "text" })}>
            ✍️ Text
          </button>
          <button type="button" role="menuitem" className={optiune} onClick={() => alege({ k: cheie(), tip: "buton" })}>
            🔘 Buton cu link
          </button>
          <button type="button" role="menuitem" className={optiune} onClick={() => alege({ k: cheie(), tip: "poza" })}>
            📷 Poză
          </button>
          {lipsa.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-nota font-bold text-cerneala-slab uppercase">Gata făcute</p>
              <div className="max-h-56 overflow-y-auto">
                {lipsa.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    role="menuitem"
                    className={optiune}
                    onClick={() => alege({ k: cheie(), tip: "gata", id: b.id })}
                  >
                    {b.eticheta}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type Seteaza = (f: (l: Rand[]) => Rand[]) => void;

/**
 * Bifa unui bloc gata făcut: debifat iese din e-mail, bifat intră la locul
 * lui din fabrică (după vecinul lui din fabrică).
 */
function comuta(fel: FelSablon, id: string, pune: boolean): (l: Rand[]) => Rand[] {
  return (l) => {
    if (!pune) return l.filter((r) => !(r.tip === "gata" && r.id === id));
    if (l.some((r) => r.tip === "gata" && r.id === id)) return l;
    const ordine = BLOCURI[fel].map((b) => b.id);
    const al = ordine.indexOf(id);
    // Lângă cel mai apropiat vecin din fabrică, nu după ultimul găsit.
    let unde = 0;
    let celMaiAproape = -1;
    l.forEach((r, i) => {
      const x = r.tip === "gata" ? ordine.indexOf(r.id) : -1;
      if (x < al && x > celMaiAproape) {
        celMaiAproape = x;
        unde = i + 1;
      }
    });
    return [...l.slice(0, unde), { k: cheie(), tip: "gata", id }, ...l.slice(unde)];
  };
}

function Bife({ fel, randuri, setRanduri }: { fel: FelSablon; randuri: Rand[]; setRanduri: Seteaza }) {
  return (
    <fieldset className="mx-auto mb-5 max-w-[600px] rounded-moale border border-hartie-umbra bg-hartie p-4">
      <legend className="px-1 font-titlu text-mic font-bold text-cerneala">Ce apare în e-mail</legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {BLOCURI[fel].map((b) => (
          <label key={b.id} className="flex cursor-pointer items-start gap-2 text-mic text-cerneala">
            <input
              type="checkbox"
              data-bifa={b.id}
              checked={randuri.some((r) => r.tip === "gata" && r.id === b.id)}
              onChange={(e) => setRanduri(comuta(fel, b.id, e.target.checked))}
              className="mt-0.5 size-4 shrink-0 accent-caramiziu-700"
            />
            {b.eticheta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Blocuri({
  fel,
  vizibil,
  desen,
  randuri,
  setRanduri,
}: {
  fel: FelSablon;
  vizibil: boolean;
  desen: BucatiEditor;
  randuri: Rand[];
  setRanduri: Seteaza;
}) {
  const [meniu, setMeniu] = useState<number | null>(null);
  const ascuns = useRef<HTMLInputElement>(null);
  const lipsa = BLOCURI[fel].filter((b) => !randuri.some((r) => r.tip === "gata" && r.id === b.id));

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
  const pune = (unde: number, r: Rand) => {
    setRanduri((l) => [...l.slice(0, unde), r, ...l.slice(unde)]);
    setMeniu(null);
  };
  const grupul = (r: Rand | undefined) =>
    r?.tip === "gata" ? desen.bucati[r.id]?.grup : undefined;

  const plus = (unde: number) => (
    <Plus
      deschis={meniu === unde}
      deschide={() => setMeniu(unde)}
      inchide={() => setMeniu(null)}
      alege={(r) => pune(unde, r)}
      lipsa={lipsa}
    />
  );

  return (
    <div hidden={!vizibil}>
      {vizibil && <input ref={ascuns} type="hidden" name="compozitie" />}
      {plus(0)}
      {randuri.map((r, i) => {
        const g = grupul(r);
        const cuTitlu = g && grupul(randuri[i - 1]) !== g;
        return (
          <div key={r.k}>
            <div
              data-bloc={r.tip === "gata" ? r.id : r.tip}
              className="group/bloc relative outline-2 -outline-offset-2 outline-transparent hover:outline-caramiziu-400 focus-within:outline-caramiziu-400"
            >
              <div className="absolute top-2 right-2 z-20 hidden gap-1.5 group-hover/bloc:flex group-focus-within/bloc:flex [@media(hover:none)]:flex">
                <button type="button" aria-label="Mută mai sus" title="Mută mai sus" className={unealta} disabled={i === 0} onClick={() => muta(i, -1)}>
                  ↑
                </button>
                <button type="button" aria-label="Mută mai jos" title="Mută mai jos" className={unealta} disabled={i === randuri.length - 1} onClick={() => muta(i, 1)}>
                  ↓
                </button>
                <button type="button" aria-label="Scoate blocul" title="Scoate blocul" className={`${unealta} bg-caramiziu-700`} onClick={() => scoate(i)}>
                  🗑
                </button>
              </div>
              {r.tip === "gata" && (
                <div className="pointer-events-none select-none">
                  {cuTitlu && g && <div dangerouslySetInnerHTML={{ __html: desen.titluri[g] }} />}
                  <div dangerouslySetInnerHTML={{ __html: desen.bucati[r.id]?.html ?? "" }} />
                </div>
              )}
              {r.tip === "text" && (
                <div className="px-6 py-3">
                  <EditorText name={`bt_${r.k}`} defaultValue="" simplu minim={0} />
                </div>
              )}
              {r.tip === "buton" && <BlocButon k={r.k} />}
              {r.tip === "poza" && <BlocPoza k={r.k} />}
            </div>
            {plus(i + 1)}
          </div>
        );
      })}
      {randuri.length === 0 && (
        <p className="px-8 pb-4 text-center text-mic text-cerneala-slab">
          Apasă pe „+” ca să adaugi un text, un buton sau o poză.
        </p>
      )}
      <div className="px-8 pb-2 text-right">
        <button
          type="button"
          className="text-nota text-cerneala-slab underline underline-offset-2 hover:text-caramiziu-700"
          onClick={() => setRanduri(() => implicit(fel))}
        >
          Pune la loc blocurile de la început
        </button>
      </div>
    </div>
  );
}

export default function EmailPeLoc({
  felInitial,
  desen,
}: {
  felInitial: FelSablon;
  desen: Record<FelSablon, BucatiEditor>;
}) {
  const radacina = useRef<HTMLDivElement>(null);
  const [fel, setFel] = useState<FelSablon>(felInitial);
  useEffect(() => {
    const f = radacina.current?.closest("form");
    if (!f) return;
    const la = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t?.name === "fel" && t.checked && (t.value === "persoane" || t.value === "firme")) setFel(t.value);
    };
    f.addEventListener("change", la);
    return () => f.removeEventListener("change", la);
  }, []);
  const antet = desen[fel].antet;
  const [persoane, setPersoane] = useState<Rand[]>(() => implicit("persoane"));
  const [firme, setFirme] = useState<Rand[]>(() => implicit("firme"));
  const randuri = { persoane, firme };
  const seteaza: Record<FelSablon, Seteaza> = { persoane: setPersoane, firme: setFirme };

  return (
    <div ref={radacina} data-email className="-mx-4 bg-[#f9f5f2] px-2 py-6 sm:mx-0 sm:rounded-moale sm:px-4">
      <Bife fel={fel} randuri={randuri[fel]} setRanduri={seteaza[fel]} />
      <p className="mx-auto mb-3 max-w-[600px] text-center text-nota text-cerneala-moale">
        Bifezi ce vrei mai sus. Dedesubt e e-mailul cum pleacă: dă clic pe titlu sau pe text și scrie. Treci peste un bloc ca să-l
        muți (↑ ↓) sau să-l scoți (🗑). Apasă „+” ca să adaugi ceva între blocuri.
      </p>
      <div
        className="mx-auto max-w-[600px] overflow-hidden rounded-[18px] bg-white shadow-[0_2px_10px_rgba(35,35,35,0.06)]"
        style={{ fontFamily: FONT }}
      >
        <div className="px-8 pt-6 pb-5 text-center" style={{ backgroundColor: PORTOCALIU }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={antet.sigla} alt="" width={52} height={52} className="mx-auto mb-2.5 block" />
          <p className="m-0 text-[13px] font-bold tracking-[0.12em] text-white uppercase">{antet.denumire}</p>
          <p className="mt-1.5 font-serif text-sm text-white/85 italic">„{antet.motto}”</p>
        </div>

        <PozaPrincipala implicita={desen[fel].poza} />

        <div className="px-8 pt-7">
          <textarea
            id="titlu"
            name="titlu"
            rows={1}
            maxLength={160}
            placeholder="Scrie titlul aici"
            aria-label="Titlul"
            ref={creste}
            onInput={(e) => creste(e.currentTarget)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            className="block w-full resize-none overflow-hidden rounded bg-transparent text-[28px] leading-[1.25] font-bold text-[#232323] outline-none placeholder:text-[#232323]/35 hover:bg-hartie-calda focus:bg-caramiziu-50/60"
          />
          <textarea
            id="text"
            name="text"
            rows={4}
            placeholder={"Dragi prieteni,\n\nScrie textul aici. Un rând gol face paragraf nou."}
            aria-label="Textul"
            ref={creste}
            onInput={(e) => creste(e.currentTarget)}
            className="mt-4 block min-h-28 w-full resize-none overflow-hidden rounded bg-transparent text-[17px] leading-[1.65] text-[#232323] outline-none placeholder:text-[#232323]/35 hover:bg-hartie-calda focus:bg-caramiziu-50/60"
          />
        </div>

        <div className="pt-2">
          <Blocuri fel="persoane" vizibil={fel === "persoane"} desen={desen.persoane} randuri={persoane} setRanduri={setPersoane} />
          <Blocuri fel="firme" vizibil={fel === "firme"} desen={desen.firme} randuri={firme} setRanduri={setFirme} />
        </div>

        <div className="bg-[#232323] px-8 py-5 text-center text-nota text-white/70">
          Aici vin singure datele asociației, rețelele și linkul de dezabonare.
        </div>
      </div>
    </div>
  );
}
