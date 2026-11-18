"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";

/**
 * Câmpul de fișier al panoului: o zonă în care se apasă sau se trage
 * fișierul, în română. Câmpul obișnuit al browserului scrie „Choose File / No
 * file chosen” în limba sistemului și nu se poate traduce.
 *
 * `<input>` stă deasupra zonei, transparent: clicul și tragerea merg ca la
 * orice câmp de fișier, `required` se verifică la fel, iar `MicsoreazaPoza`
 * îl găsește ca pe oricare altul.
 */
export default function CampFisier({
  name,
  accept,
  required,
  multiple,
  indemn = "Alege fișierul sau trage-l aici",
  nota,
  disabled,
}: {
  name: string;
  accept?: string;
  required?: boolean;
  multiple?: boolean;
  indemn?: string;
  nota?: string;
  disabled?: boolean;
}) {
  const [ales, setAles] = useState<string[]>([]);
  return (
    <div
      data-camp-fisier
      className={`group/fisier relative ${disabled ? "pointer-events-none opacity-50" : ""} flex min-w-0 items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3.5 transition-colors duration-150 focus-within:border-caramiziu-500 hover:border-caramiziu-400 hover:bg-caramiziu-50/40 ${
        ales.length ? "border-emerald-300 bg-emerald-50/50" : "border-hartie-umbra bg-hartie"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-150 group-hover/fisier:-translate-y-0.5 ${
          ales.length ? "bg-emerald-100 text-emerald-700" : "bg-caramiziu-50 text-caramiziu-700"
        }`}
      >
        <FileUp className="size-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-titlu text-[14px] font-bold text-cerneala">
          {ales.length === 0 ? indemn : ales.length === 1 ? ales[0] : `${ales.length} fișiere alese`}
        </span>
        {(nota || ales.length > 0) && (
          <span className="block truncate text-[12.5px] text-cerneala-slab">
            {ales.length > 0 ? "Apasă din nou ca să alegi altul." : nota}
          </span>
        )}
      </span>
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        multiple={multiple}
        disabled={disabled}
        aria-label={indemn}
        onChange={(e) => setAles(Array.from(e.currentTarget.files ?? []).map((f) => f.name))}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
      />
    </div>
  );
}
