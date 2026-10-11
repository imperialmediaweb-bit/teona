"use client";

import { useId, useState } from "react";

/**
 * Asistentul care scrie o primă ciornă, în panoul de admin.
 *
 * Stă deasupra formularului și îi completează două câmpuri: titlul și textul.
 * Nu trimite nimic și nu apasă niciun buton — scrie în căsuțe, exact ca și
 * cum ar fi scris omul, care apoi citește și schimbă ce vrea.
 *
 * Completarea se face prin DOM, nu prin stare React, fiindcă formularul de
 * sub el e un `<form action="…">` randat pe server, fără stare. Setarea
 * valorii se face cu setter-ul nativ, altfel React n-ar afla de schimbare în
 * cazurile în care câmpurile ar deveni controlate.
 *
 * Avertismentul despre cifre nu e decor. Modelul primește instrucțiunea să
 * lase `[…]` unde i-ar trebui o cifră pe care n-o are, dar instrucțiunea nu
 * e o garanție — omul rămâne cel care verifică.
 */

const FELURI = [
  { id: "buletin", eticheta: "Buletin informativ" },
  { id: "campanie", eticheta: "Campanie de strângere de fonduri" },
  { id: "multumire", eticheta: "Mulțumire după un eveniment" },
  { id: "anunt", eticheta: "Anunț scurt" },
] as const;

type Stare =
  | { fel: "gol" }
  | { fel: "scrie" }
  | { fel: "gata" }
  | { fel: "eroare"; mesaj: string };

/** Scrie în câmp așa încât și React să vadă schimbarea, nu doar DOM-ul. */
function completeaza(nume: string, valoare: string) {
  const camp = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[name="${nume}"]`,
  );
  if (!camp) return;
  const proto =
    camp instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(camp, valoare);
  camp.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function Asistent() {
  const id = useId();
  const [fel, setFel] = useState<string>(FELURI[0].id);
  const [despre, setDespre] = useState("");
  const [stare, setStare] = useState<Stare>({ fel: "gol" });

  async function scrie() {
    if (despre.trim().length < 10) {
      setStare({
        fel: "eroare",
        mesaj:
          "Scrie în câteva rânduri despre ce e vorba — altfel asistentul inventează, iar asta nu vrem.",
      });
      return;
    }

    setStare({ fel: "scrie" });
    try {
      const raspuns = await fetch("/api/admin/asistent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fel, despre }),
      });
      const corp = (await raspuns.json().catch(() => ({}))) as {
        titlu?: string;
        text?: string;
        mesaj?: string;
      };
      if (!raspuns.ok || !corp.titlu || !corp.text) {
        setStare({
          fel: "eroare",
          mesaj: corp.mesaj ?? "Nu am putut scrie ciorna. Încearcă din nou.",
        });
        return;
      }
      completeaza("titlu", corp.titlu);
      completeaza("text", corp.text);
      if (!(document.querySelector('[name="subiect"]') as HTMLInputElement)
        ?.value) {
        completeaza("subiect", corp.titlu);
      }
      setStare({ fel: "gata" });
    } catch {
      setStare({
        fel: "eroare",
        mesaj: "Nu am putut scrie ciorna. Verifică-ți conexiunea.",
      });
    }
  }

  const camp =
    "w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-2.5 font-titlu";

  return (
    <section className="mb-8 max-w-3xl rounded-card border border-turcoaz-200 bg-turcoaz-50 p-6 sm:p-8">
      <h2 className="font-titlu text-h4 font-bold text-turcoaz-900">
        Vrei o primă ciornă?
      </h2>
      <p className="mt-2 text-mic text-turcoaz-900/80">
        Spune despre ce e vorba, iar asistentul completează titlul și textul de
        mai jos. Le poți schimba pe toate — nimic nu pleacă nicăieri de aici.
      </p>

      <div className="mt-5 grid gap-4">
        <label>
          <span className="mb-1 block font-titlu text-mic font-bold text-turcoaz-900">
            Ce fel de text
          </span>
          <select
            value={fel}
            onChange={(ev) => setFel(ev.target.value)}
            className={camp}
          >
            {FELURI.map((f) => (
              <option key={f.id} value={f.id}>
                {f.eticheta}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block font-titlu text-mic font-bold text-turcoaz-900">
            Despre ce e vorba
          </span>
          <textarea
            id={`${id}-despre`}
            value={despre}
            onChange={(ev) => {
              setDespre(ev.target.value);
              if (stare.fel === "eroare") setStare({ fel: "gol" });
            }}
            rows={5}
            placeholder="Tabăra RESPIRO din septembrie, la Vatra Dornei. Au fost 24 de copii cu sindrom Down și părinții lor. Au făcut drumeție, atelier de olărit și o seară cu foc de tabără. Vrem să mulțumim celor care au donat."
            className={`${camp} resize-y`}
          />
          <span className="mt-1 block text-nota text-turcoaz-900/70">
            Cu cât sunt mai multe detalii reale aici, cu atât are mai puțin de
            ghicit. Cifrele pe care nu i le dai le lasă în alb, între paranteze
            drepte.
          </span>
        </label>

        {stare.fel === "eroare" && (
          <p
            role="alert"
            className="rounded-moale border border-caramiziu-200 bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900"
          >
            {stare.mesaj}
          </p>
        )}

        {stare.fel === "gata" && (
          <p
            role="status"
            className="rounded-moale border border-turcoaz-300 bg-hartie px-4 py-3 text-mic text-turcoaz-900"
          >
            <strong className="font-titlu font-bold">Gata, e mai jos.</strong>{" "}
            Citește-o toată înainte s-o trimiți. Verifică fiecare cifră și
            fiecare dată — și caută parantezele drepte, acolo unde n-a avut ce
            să pună.
          </p>
        )}

        <div>
          <button
            type="button"
            onClick={scrie}
            disabled={stare.fel === "scrie"}
            className="rounded-full bg-turcoaz-600 px-6 py-3 font-titlu font-bold text-hartie disabled:opacity-70"
          >
            {stare.fel === "scrie" ? "Scrie…" : "Scrie ciorna"}
          </button>
        </div>
      </div>
    </section>
  );
}
