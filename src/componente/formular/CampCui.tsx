"use client";

import { useEffect, useRef, useState } from "react";
import { cuiValid, curataCui } from "@/lib/cui";
import Camp, { claseControl, claseControlGresit } from "./Camp";
import Pictograma from "../Pictograma";

/**
 * Câmpul de CUI care caută firma singur.
 *
 * **De ce se caută automat și nu la apăsarea unui buton.** Un buton „caută”
 * lângă un câmp e încă un lucru de observat și de apăsat. Aici, în clipa în
 * care cifrele formează un CUI valid, firma apare sub câmp. Dacă nu e cea
 * bună, omul scrie mai departe și căutarea se reia.
 *
 * **Nu se întreabă ANAF la fiecare tastă.** Două filtre, unul după altul:
 * cifra de control a CUI-ului se verifică aici, în browser, deci un număr
 * incomplet nu pleacă nicăieri; iar peste asta e o pauză de trei sferturi de
 * secundă de la ultima tastă.
 *
 * **Căutarea nu blochează nimic.** Dacă ANAF nu răspunde, sau firma nu e
 * acolo, câmpurile rămân libere și se pot completa de mână. Căutarea e un
 * ajutor, nu o poartă: o firmă înființată luna trecută n-are bilanț, și
 * trebuie totuși să poată trimite formularul.
 */

export type Bilant = {
  an: number;
  cifraDeAfaceri: number | null;
  profitBrut: number | null;
  profitNet: number | null;
  impozitEstimat: number | null;
};

export type Firma = {
  cui: number;
  denumire: string;
  adresa: string;
  nrRegCom: string;
  activa: boolean;
  bilant: Bilant | null;
};

type Stare =
  | { fel: "gol" }
  | { fel: "caut" }
  | { fel: "gasita"; firma: Firma }
  | { fel: "negasita"; mesaj: string };

export default function CampCui({
  id,
  eticheta = "CUI",
  obligatoriu = false,
  nota = "Scrie CUI-ul și completăm noi restul, din datele publice ale ANAF.",
  eroare,
  valoare,
  onValoare,
  onFirma,
  name = "cui",
}: {
  id: string;
  eticheta?: string;
  obligatoriu?: boolean;
  nota?: string;
  eroare?: string;
  valoare: string;
  onValoare: (text: string) => void;
  /** Chemată o dată, când firma a fost găsită. */
  onFirma: (firma: Firma) => void;
  name?: string;
}) {
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  // `onFirma` se schimbă la fiecare randare a părintelui. Ținut într-o
  // referință, ca efectul de mai jos să depindă doar de CUI — altfel
  // căutarea s-ar relua la fiecare tastă apăsată în orice alt câmp.
  const anunta = useRef(onFirma);
  anunta.current = onFirma;

  useEffect(() => {
    const cui = curataCui(valoare);
    if (cui === null || !cuiValid(cui)) {
      setStare({ fel: "gol" });
      return;
    }

    const opreste = new AbortController();
    const asteapta = setTimeout(async () => {
      setStare({ fel: "caut" });
      try {
        const r = await fetch(`/api/firma?cui=${cui}`, {
          signal: opreste.signal,
        });
        const date = await r.json();
        if (!r.ok) {
          setStare({
            fel: "negasita",
            /*
              Orice ar răspunde serverul, omul trebuie să afle că poate merge
              mai departe. Fără „completează de mână", un mesaj de genul
              „serviciul ANAF nu răspunde" pare un zid.
            */
            mesaj:
              typeof date?.mesaj === "string"
                ? `${date.mesaj} Poți completa datele de mână.`
                : "N-am putut verifica CUI-ul acum. Completează de mână.",
          });
          return;
        }
        setStare({ fel: "gasita", firma: date as Firma });
        anunta.current(date as Firma);
      } catch (defect) {
        if ((defect as Error)?.name === "AbortError") return;
        setStare({
          fel: "negasita",
          mesaj: "N-am putut verifica CUI-ul acum. Completează de mână.",
        });
      }
    }, 750);

    return () => {
      clearTimeout(asteapta);
      opreste.abort();
    };
  }, [valoare]);

  const idStare = `${id}-stare`;

  return (
    <div>
      <Camp
        id={id}
        eticheta={eticheta}
        obligatoriu={obligatoriu}
        nota={nota}
        eroare={eroare}
      >
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="RO12345678"
          value={valoare}
          onChange={(ev) => onValoare(ev.target.value)}
          aria-invalid={Boolean(eroare)}
          aria-describedby={eroare ? `${id}-eroare` : `${id}-nota ${idStare}`}
          className={eroare ? claseControlGresit : claseControl}
        />
      </Camp>

      {/* Rezultatul căutării. `polite`: nu întrerupe pe cineva care încă scrie. */}
      <p id={idStare} aria-live="polite" className="mt-2 min-h-5 text-mic">
        {stare.fel === "caut" && (
          <span className="text-cerneala-slab">Caut firma la ANAF…</span>
        )}
        {stare.fel === "negasita" && (
          <span className="text-cerneala-moale">{stare.mesaj}</span>
        )}
        {stare.fel === "gasita" && (
          <span className="flex items-start gap-1.5 text-turcoaz-700">
            <Pictograma
              nume="document"
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              <strong className="font-titlu font-bold">
                {stare.firma.denumire}
              </strong>
              {stare.firma.adresa && ` · ${stare.firma.adresa}`}
              {!stare.firma.activa && (
                <span className="block text-caramiziu-800">
                  ANAF o are ca inactivă sau radiată. Verifică CUI-ul.
                </span>
              )}
            </span>
          </span>
        )}
      </p>
    </div>
  );
}
