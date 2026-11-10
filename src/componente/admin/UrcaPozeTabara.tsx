"use client";

import { useRef, useState } from "react";
import { micsoreaza } from "./MicsoreazaPoza";

/**
 * Urcarea pozelor unei tabere, din ciornă, fără cont în Cloudinary.
 *
 * Stă în formularul ciornei, dar câmpul de fișiere n-are `name`: pozele nu
 * pleacă odată cu textul, ci una câte una, la `/api/admin/poze-tabara`. Câmpul
 * poartă `data-fara-micsorare`, ca `MicsoreazaPoza` să nu lucreze în paralel
 * cu noi; micșorarea se face aici, chiar înainte de fiecare trimitere.
 *
 * După prima poză urcată, folderul se pune și în alegerea „Folderul cu
 * pozele” de mai sus — altfel o salvare a ciornei ar scrie peste legătură cu
 * valoarea veche din listă.
 */
export default function UrcaPozeTabara({
  id,
  dosarAles,
  numeImplicit,
  anImplicit,
  fel = "proiect",
}: {
  id: string | null;
  dosarAles: string | null;
  numeImplicit: string;
  anImplicit: string;
  fel?: string;
}) {
  const ce = fel === "proiect" ? "taberei" : fel === "campanie" ? "campaniei" : "noutății";
  const radacina = useRef<HTMLDivElement>(null);
  const fisiere = useRef<HTMLInputElement>(null);
  const [cale, setCale] = useState(dosarAles);
  const [nume, setNume] = useState(numeImplicit);
  const [an, setAn] = useState(anImplicit);
  const [lucreaza, setLucreaza] = useState(false);
  const [stare, setStare] = useState<string | null>(null);
  const [greseli, setGreseli] = useState<string[]>([]);

  function puneInFormular(c: string) {
    const camp = radacina.current
      ?.closest("form")
      ?.querySelector<HTMLSelectElement | HTMLInputElement>("[name=dosarCloud]");
    if (!camp) return;
    if (camp instanceof HTMLSelectElement && ![...camp.options].some((o) => o.value === c)) {
      camp.add(new Option(c, c));
    }
    camp.value = c;
  }

  async function urca() {
    const lista = Array.from(fisiere.current?.files ?? []);
    if (lista.length === 0) {
      setStare("Alege întâi pozele.");
      return;
    }
    if (!cale && !nume.trim()) {
      setStare("Scrie numele folderului.");
      return;
    }
    setLucreaza(true);
    setGreseli([]);
    const gresite: string[] = [];
    let urcate = 0;
    let unde = cale;

    for (let i = 0; i < lista.length; i++) {
      const f = lista[i];
      setStare(`Se urcă poza ${i + 1} din ${lista.length}…`);
      let deTrimis: File = f;
      try {
        deTrimis = (await micsoreaza(f)) ?? f;
      } catch (e) {
        gresite.push(`${f.name}: ${(e as Error).message}`);
        continue;
      }
      const corp = new FormData();
      if (id) corp.append("id", id);
      if (unde) corp.append("cale", unde);
      else {
        corp.append("nume", nume);
        corp.append("an", an);
      }
      corp.append("poza", deTrimis, f.name);
      try {
        const r = await fetch("/api/admin/poze-tabara", { method: "POST", body: corp });
        if (r.status === 403) {
          gresite.push("Sesiunea a expirat. Intră din nou în panou într-o filă nouă, apoi urcă pozele rămase.");
          break;
        }
        const date = (await r.json().catch(() => ({}))) as { cale?: string; mesaj?: string };
        if (!r.ok || !date.cale) {
          gresite.push(date.mesaj ?? `${f.name}: n-a mers (${r.status}).`);
          continue;
        }
        if (!unde) {
          unde = date.cale;
          setCale(date.cale);
        }
        puneInFormular(date.cale);
        urcate++;
      } catch {
        gresite.push(`${f.name}: nu s-a putut trimite (internetul?).`);
      }
    }

    setLucreaza(false);
    setGreseli(gresite);
    if (fisiere.current && gresite.length === 0) fisiere.current.value = "";
    setStare(
      urcate === 0
        ? "Nicio poză n-a fost urcată."
        : `Gata: ${urcate} ${urcate === 1 ? "poză urcată" : "poze urcate"} în ${unde}.` +
            (id ? ` Apar pe pagina ${ce} în câteva minute (după publicare).` : " Salvează ciorna ca să rămână legate de text."),
    );
  }

  const camp =
    "w-full colt-a border border-hartie-umbra bg-white px-3 py-2 text-cerneala focus:border-cerneala focus:outline-none";

  return (
    <div ref={radacina} className="grid gap-3 border-t border-hartie-umbra pt-5">
      <span className="font-titlu text-mic font-bold text-cerneala">Pozele {ce}, pentru galerie</span>
      <span className="text-mic text-cerneala-moale">
        {cale
          ? `Pozele se adaugă în folderul ${cale}.`
          : `Se face un folder nou și pozele intră în el. Poți alege mai multe deodată. Apar pe pagina ${ce}, sub text.`}
      </span>

      {!cale && (
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
          <label className="grid gap-1.5">
            <span className="text-mic text-cerneala">Numele folderului</span>
            <input
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              placeholder="TABĂRĂ AUTISM 8-12 IUNIE 2026"
              className={camp}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-mic text-cerneala">Anul</span>
            <input
              value={an}
              onChange={(e) => setAn(e.target.value)}
              inputMode="numeric"
              maxLength={4}
              className={camp}
            />
          </label>
        </div>
      )}

      <input
        ref={fisiere}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        data-fara-micsorare
        className="min-w-0 text-mic"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={urca}
          disabled={lucreaza}
          className="colt-a bg-cerneala px-4 py-2 font-titlu text-mic font-semibold text-hartie disabled:opacity-60"
        >
          {lucreaza ? "Se urcă…" : "Urcă pozele"}
        </button>
        {cale && !lucreaza && (
          <button
            type="button"
            onClick={() => setCale(null)}
            className="text-mic text-cerneala-moale underline underline-offset-4"
          >
            Fac alt folder
          </button>
        )}
      </div>

      {stare && (
        <p role="status" className="text-mic text-cerneala">
          {stare}
        </p>
      )}
      {greseli.length > 0 && (
        <ul data-greseli-poze className="grid gap-1 text-mic text-caramiziu-800">
          {greseli.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
