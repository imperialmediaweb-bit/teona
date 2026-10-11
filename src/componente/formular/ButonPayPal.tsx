"use client";

import { useId, useState } from "react";
import {
  EURO_MAXIM,
  EURO_MINIM,
  SUME_PROPUSE_EURO,
  euroAcceptat,
} from "@/date/plati";
import Pictograma from "../Pictograma";

/**
 * Donația prin PayPal, în euro.
 *
 * **De ce în euro, și nu în lei ca restul site-ului.** PayPal procesează 24
 * de monede, iar leul nu e printre ele. Avem două variante: ori afișăm lei și
 * convertim pe ascuns la un curs ales de noi — adică omul apasă „100 lei” și
 * i se ia altceva de pe card — ori spunem de la început că aici se donează în
 * euro. A doua e singura care nu minte. Cine vrea în lei are Stripe, mai sus
 * pe pagină, unde cardul se debitează exact cu suma scrisă.
 *
 * Nu scriem niciun curs de schimb: ar fi vechi din prima zi, și cursul care
 * contează oricum e cel al băncii donatorului, în ziua plății.
 *
 * Suma scrisă de mână acceptă și virgulă, și punct: în română se scrie
 * „12,50”, dar tastatura numerică de pe telefon dă punct.
 */

type Stare =
  | { fel: "gol" }
  | { fel: "trimite" }
  | { fel: "eroare"; mesaj: string };

/** „12,50” și „12.50” sunt același lucru pentru om; `Number` vede doar al doilea. */
function citesteSuma(brut: string): number {
  return Number(brut.replace(/\s/g, "").replace(",", "."));
}

/**
 * Suma, scrisă cum se scrie în română: virgulă la zecimale, punct la mii.
 *
 * `${12.5} €` ar da „12.5 €" — punct în loc de virgulă și fără al doilea
 * zecimal, adică exact ce nu scrie nimeni pe o chitanță. Zecimalele apar doar
 * când există: „25 €", nu „25,00 €".
 */
const BANI = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const EXACT = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function scrieEuro(suma: number): string {
  return Number.isInteger(suma) ? BANI.format(suma) : EXACT.format(suma);
}

export default function ButonPayPal({
  destinatie = "oriunde",
}: {
  destinatie?: string;
}) {
  const id = useId();
  const [euro, setEuro] = useState<number>(SUME_PROPUSE_EURO[1]);
  const [alta, setAlta] = useState("");
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  const suma = alta.trim() ? citesteSuma(alta) : euro;
  const valida = euroAcceptat(suma);

  async function plateste() {
    if (!valida) {
      setStare({
        fel: "eroare",
        mesaj: `Suma trebuie să fie între ${BANI.format(EURO_MINIM)} și ${BANI.format(EURO_MAXIM)} de euro.`,
      });
      return;
    }

    setStare({ fel: "trimite" });
    try {
      const raspuns = await fetch("/api/donatii/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ euro: suma, destinatie }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        adresa?: string;
        mesaj?: string;
      };
      if (!raspuns.ok || !corp.adresa) {
        setStare({
          fel: "eroare",
          mesaj:
            corp.mesaj ?? "Nu am putut porni plata. Încearcă din nou.",
        });
        return;
      }
      // PayPal preia de aici: suma, confirmarea și chitanța lui sunt la el.
      window.location.href = corp.adresa;
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut porni plata. Verifică-ți conexiunea.",
      });
    }
  }

  return (
    <div className="relative">
      <fieldset>
        <legend className="mb-2 font-titlu text-mic font-bold text-hartie/90">
          Suma, în euro
        </legend>
        <div className="flex flex-wrap gap-2">
          {SUME_PROPUSE_EURO.map((s) => {
            const ales = !alta.trim() && euro === s;
            return (
              <label
                key={s}
                className={`flex min-h-12 cursor-pointer items-center justify-center colt-mic-a border-2 px-5 py-2 font-titlu font-bold transition-colors duration-200 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-hartie ${
                  ales
                    ? "border-hartie bg-hartie text-cerneala"
                    : "border-hartie/30 text-hartie hover:border-hartie/70"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-euro`}
                  value={s}
                  checked={ales}
                  onChange={() => {
                    setEuro(s);
                    setAlta("");
                    setStare({ fel: "gol" });
                  }}
                  className="sr-only"
                />
                {s} €
              </label>
            );
          })}
        </div>
      </fieldset>

      <label
        htmlFor={`${id}-alta`}
        className="mt-4 mb-2 block font-titlu text-mic font-bold text-hartie/90"
      >
        Altă sumă (euro)
      </label>
      <input
        id={`${id}-alta`}
        type="text"
        inputMode="decimal"
        value={alta}
        onChange={(ev) => {
          setAlta(ev.target.value);
          setStare({ fel: "gol" });
        }}
        placeholder={`${BANI.format(EURO_MINIM)}–${BANI.format(EURO_MAXIM)}`}
        aria-invalid={Boolean(alta.trim()) && !valida}
        className="colt-mic-b min-h-12 w-full border-2 border-hartie/30 bg-transparent px-4 py-3 text-corp text-hartie transition-colors duration-200 outline-none placeholder:text-hartie/40 focus:border-hartie sm:max-w-xs"
      />

      {stare.fel === "eroare" && (
        <p
          role="alert"
          className="colt-mic-a mt-4 border-2 border-hartie/40 bg-hartie/10 px-4 py-3 text-mic text-hartie"
        >
          {stare.mesaj}
        </p>
      )}

      <button
        type="button"
        onClick={plateste}
        disabled={stare.fel === "trimite"}
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-hartie px-6 py-3 font-titlu font-bold text-cerneala transition-colors hover:bg-miere-300 disabled:opacity-70"
      >
        {stare.fel === "trimite"
          ? "Se deschide PayPal…"
          : valida
            ? `Donează ${scrieEuro(suma)} € prin PayPal`
            : "Donează prin PayPal"}
        <Pictograma nume="sageata" className="size-5" />
      </button>
    </div>
  );
}
