import type { ReactNode } from "react";

/**
 * Bucățile comune ale listelor din panou (echipa, aparițiile în presă):
 * mesajul de după salvare, chenarul „ce e bine de știut” și rândul de
 * butoane Salvează / Scoate / ↑ / ↓. Scrise o dată, ca cele două pagini
 * să arate și să se poarte la fel.
 */
export const CAMP =
  "colt-mic-a w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-turcoaz-400";

export function Mesaj({ mesaj }: { mesaj?: { text: string; bun: boolean } }) {
  if (!mesaj) return null;
  return (
    <p
      id="stare"
      tabIndex={-1}
      role="alert"
      className={`scroll-mt-24 mb-6 colt-mic-a px-4 py-3 text-mic font-semibold ${
        mesaj.bun ? "bg-turcoaz-50 text-cerneala" : "bg-caramiziu-50 text-caramiziu-900"
      }`}
    >
      {mesaj.text}
    </p>
  );
}

export function DeStiut({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl colt-mic-a border-t-4 border-miere-400 bg-hartie-calda p-5">
      <p className="font-titlu font-bold text-cerneala">Ce e bine de știut</p>
      <ul className="mt-2 grid gap-1 text-mic text-cerneala-moale">{children}</ul>
    </div>
  );
}

export function Eticheta({ text, nota }: { text: string; nota?: string }) {
  return (
    <span className="font-titlu text-mic font-bold text-cerneala">
      {text}
      {nota && <span className="font-normal text-cerneala-slab"> — {nota}</span>}
    </span>
  );
}

export function Butoane({
  activ,
  primul,
  ultimul,
  cine,
}: {
  activ: boolean;
  primul: boolean;
  ultimul: boolean;
  cine: string;
}) {
  const mic =
    "colt-mic-a border-2 border-hartie-umbra px-4 py-2.5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400 disabled:opacity-40";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
      >
        Salvează
      </button>
      <button type="submit" name="fel" value={activ ? "opreste" : "porneste"} className={`${mic} px-5`}>
        {activ ? "Scoate de pe site" : "Pune înapoi"}
      </button>
      <button type="submit" name="fel" value="sus" disabled={primul} aria-label={`Mută ${cine} mai sus`} className={mic}>
        ↑
      </button>
      <button type="submit" name="fel" value="jos" disabled={ultimul} aria-label={`Mută ${cine} mai jos`} className={mic}>
        ↓
      </button>
    </div>
  );
}

export const STARI_COMUNE: Record<string, { text: string; bun: boolean }> = {
  facut: { text: "Adăugat. Se vede pe site.", bun: true },
  schimbat: { text: "Salvat. Se vede pe site.", bun: true },
  stare: { text: "Schimbat.", bun: true },
  mutat: { text: "Mutat.", bun: true },
  lung: { text: "Un câmp e prea lung. Scurtează-l și salvează din nou.", bun: false },
  necunoscut: { text: "N-a mers. Încearcă din nou.", bun: false },
};
