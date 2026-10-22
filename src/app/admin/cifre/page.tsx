import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { cifrePanou, type Cifra } from "@/lib/cifre";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Cele patru cifre de pe site.
 *
 * Caietul le cere la pagina 1, printre regulile valabile pe tot site-ul:
 * „Cifrele sunt aceleași peste tot […] Asociația le poate modifica singură."
 * Până acum, a 34-a tabără însemna un mesaj către mine.
 *
 * **Patru rânduri, nici mai multe, nici mai puține.** Banda de pe prima pagină
 * e desenată pentru patru: pe telefon se așază două pe două. A cincea ar rupe
 * rândul. De aceea se schimbă ce scrie în ele, nu câte sunt.
 */

const STARI: Record<string, { text: string; bun: boolean }> = {
  schimbat: { text: "Schimbate. Se văd pe site.", bun: true },
  cifra: { text: "O cifră lipsește sau nu e un număr întreg.", bun: false },
  eticheta: { text: "Fiecare cifră are nevoie de o etichetă.", bun: false },
  necunoscut: { text: "N-a mers. Încearcă din nou.", bun: false },
};

const camp =
  "colt-mic-a w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-turcoaz-400";

export default function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Cifrele">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  await connection();
  const { gresit, stare } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Cifrele" activ="/admin/cifre">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat încă. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/cifre" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/cifre" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/cifre"))) {
    return <FaraDrept titlu="Cifrele" activ="/admin/cifre" />;
  }

  const cifre = await cifrePanou().catch(() => [] as Cifra[]);
  const mesaj = stare ? STARI[stare] : undefined;

  return (
    <Cadru
      titlu="Cifrele"
      descriere="Cele patru cifre de pe prima pagină, de pe Despre noi și de la 3,5%."
      activ="/admin/cifre"
    >
      {mesaj && (
        <p
          id="stare"
          tabIndex={-1}
          role="alert"
          className={`scroll-mt-24 mb-6 colt-mic-a px-4 py-3 text-mic font-semibold ${
            mesaj.bun
              ? "bg-turcoaz-50 text-cerneala"
              : "bg-caramiziu-50 text-caramiziu-900"
          }`}
        >
          {mesaj.text}
        </p>
      )}

      <div className="mb-8 max-w-3xl colt-mic-a border-t-4 border-miere-400 bg-hartie-calda p-5">
        <p className="font-titlu font-bold text-cerneala">
          Se schimbă aici și se schimbă peste tot
        </p>
        <ul className="mt-2 grid gap-1 text-mic text-cerneala-moale">
          <li>
            Prima pagină, Despre noi, pagina de 3,5%, e-mailurile de campanie
            și ce răspunde asistentul vizitatorilor.
          </li>
          <li>
            <strong>Sufixul</strong> e semnul de după cifră: „+” la „1.500+”,
            gol la „33”.
          </li>
          <li>
            <strong>Eticheta</strong> e ce scrie dedesubt. O poți schimba: dacă
            „participanți” nu mai e cuvântul potrivit, scrie altul.
          </li>
          <li>
            Cifra se scrie numai cu cifre: <strong>1500</strong>, nu „1.500”.
            Punctul de mii îl pune site-ul.
          </li>
        </ul>
      </div>

      {!areBazaDeDate() ? (
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Baza de date nu e pornită, deci cifrele nu se pot schimba acum. Pe
          site se văd cele de dinainte.
        </p>
      ) : (
        <form
          method="post"
          action="/api/admin/cifre"
          className="grid max-w-3xl gap-5"
        >
          {cifre.map((c, i) => (
            <fieldset
              key={i}
              className="grid gap-4 colt-a border border-hartie-umbra bg-hartie p-5 sm:grid-cols-[7rem_5rem_1fr]"
            >
              <legend className="px-2 font-titlu text-mic font-bold text-cerneala">
                Cifra {i + 1} — acum: {c.valoare.toLocaleString("ro-RO")}
                {c.sufix} {c.eticheta}
              </legend>

              <label className="grid gap-1.5">
                <span className="font-titlu text-mic font-bold text-cerneala">
                  Cifra
                </span>
                <input
                  name={`valoare-${i}`}
                  inputMode="numeric"
                  required
                  defaultValue={c.valoare}
                  className={camp}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="font-titlu text-mic font-bold text-cerneala">
                  Sufix
                </span>
                <input
                  name={`sufix-${i}`}
                  maxLength={3}
                  placeholder="+"
                  defaultValue={c.sufix}
                  className={camp}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="font-titlu text-mic font-bold text-cerneala">
                  Eticheta
                </span>
                <input
                  name={`eticheta-${i}`}
                  required
                  maxLength={60}
                  defaultValue={c.eticheta}
                  className={camp}
                />
              </label>
            </fieldset>
          ))}

          <div>
            <button
              type="submit"
              className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
            >
              Salvează
            </button>
            <p className="mt-2 text-nota text-cerneala-slab">
              Se văd pe site imediat după salvare.
            </p>
          </div>
        </form>
      )}
    </Cadru>
  );
}
