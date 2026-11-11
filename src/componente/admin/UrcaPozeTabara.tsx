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
  const [nume] = useState(numeImplicit);
  const [an] = useState(anImplicit);
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
    /*
      Folderul nu se mai cere: se numește după titlu, în anul primei zile.
      „Numele folderului” și „Anul” erau două câmpuri despre un lucru pe care
      omul nu-l vede niciodată (asociația, 11 noiembrie 2026: „mai simplu”).
    */
    const formular = radacina.current?.closest("form");
    const titlu = formular?.querySelector<HTMLInputElement>("[name=titlu]")?.value.trim() ?? "";
    const primaZi = formular?.querySelector<HTMLInputElement>("[name=dataInceput]")?.value ?? "";
    const numeFolder = (nume.trim() || titlu).toLocaleUpperCase("ro-RO");
    const anFolder = /^\d{4}/.test(primaZi) ? primaZi.slice(0, 4) : an;
    if (!cale && !numeFolder) {
      setStare("Scrie întâi titlul, sus. Pozele se pun într-un folder cu numele lui.");
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
        corp.append("nume", numeFolder);
        corp.append("an", anFolder);
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
        : `Gata: ${urcate} ${urcate === 1 ? "poză urcată" : "poze urcate"}.` +
            (id ? ` Se văd pe pagina ${ce} după „Publică”.` : " Apasă „Publică” jos, ca să apară pe site."),
    );
  }

  const camp =
    "w-full colt-a border border-hartie-umbra bg-white px-3 py-2 text-cerneala focus:border-cerneala focus:outline-none";

  return (
    <div ref={radacina} className="grid gap-3 border-t border-hartie-umbra pt-5">
      <span className="font-titlu text-mic font-bold text-cerneala">Pozele {ce}, pentru galerie</span>
      <span className="text-mic text-cerneala-moale">
        {cale
          ? "Poți adăuga și altele: se pun lângă cele urcate deja."
          : `Alege pozele (oricâte deodată) și apasă „Urcă pozele”. Apar pe pagina ${ce}, sub text.`}
      </span>


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
