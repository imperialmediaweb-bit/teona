import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  METODE_MANUALE,
  donatii,
  numeleMetodei,
} from "@/lib/plati/donatori";
import { DESTINATII_DONATIE } from "@/date/asociatie";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";

export const metadata: Metadata = {
  title: "Donații",
  robots: { index: false, follow: false },
};

type Cautare = { gata?: string; eroare?: string; gresit?: string };

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function PaginaDonatii({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Donații">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  await connection();
  const { gata, eroare, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Donații" activ="/admin/donatii">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5">PAROLA_ADMIN</code>{" "}
          în Railway.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Donații" activ="/admin/donatii">
        <Intrare gresit={Boolean(gresit)} unde="/admin/donatii" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Donații" activ="/admin/donatii">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const lista = await donatii(100);
  const camp =
    "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic";
  const azi = new Date().toISOString().slice(0, 10);

  return (
    <Cadru titlu="Donații" activ="/admin/donatii">
      {gata && (
        <p
          role="status"
          className="mb-6 rounded-card border border-turcoaz-200 bg-turcoaz-50 p-4 text-mic text-turcoaz-900"
        >
          <strong className="font-titlu font-bold">Donația e trecută.</strong>{" "}
          Apare în listă și în tabloul de bord.
        </p>
      )}
      {eroare && (
        <p
          role="alert"
          className="mb-6 rounded-card border border-caramiziu-200 bg-caramiziu-50 p-4 text-mic text-caramiziu-900"
        >
          {eroare}
        </p>
      )}

      <details className="rounded-card border border-hartie-umbra bg-hartie p-5">
        <summary className="cursor-pointer font-titlu text-amplu font-bold text-cerneala">
          Trece o donație de mână
        </summary>
        <p className="mt-2 max-w-2xl text-mic text-cerneala-moale">
          Pentru banii care nu trec prin site: transfer bancar, numerar, SMS,
          Galantom. Intră în aceleași totaluri și în aceleași grafice ca
          donațiile cu cardul.
        </p>

        <form
          action="/api/admin/donatii"
          method="post"
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Pe ce cale
            </span>
            <select name="metoda" className={camp}>
              {METODE_MANUALE.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.eticheta}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Suma (lei)
            </span>
            <input name="suma" inputMode="decimal" required className={camp} />
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Data
            </span>
            <input
              name="data"
              type="date"
              required
              defaultValue={azi}
              max={azi}
              className={camp}
            />
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Pentru ce
            </span>
            <select name="destinatie" className={camp}>
              {DESTINATII_DONATIE.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.eticheta}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block font-titlu text-mic font-bold">
              Referința
            </span>
            <input
              name="referinta"
              required
              maxLength={120}
              placeholder="Nr. extrasului, al chitanței, data transferului"
              className={camp}
            />
            <span className="mt-1 block text-nota text-cerneala-slab">
              Orice o identifică fără dubiu. Două donații nu pot avea aceeași
              referință pe aceeași cale — așa nu se trece aceeași sumă de două
              ori dintr-un extras citit în două reprize.
            </span>
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Numele donatorului{" "}
              <span className="font-normal text-cerneala-slab">(opțional)</span>
            </span>
            <input name="nume" maxLength={120} className={camp} />
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              E-mail{" "}
              <span className="font-normal text-cerneala-slab">(opțional)</span>
            </span>
            <input name="email" type="email" className={camp} />
            <span className="mt-1 block text-nota text-cerneala-slab">
              Cu e-mail, donația se leagă de donatorul din listă. Fără, rămâne
              în totaluri, dar nu are un om în spate.
            </span>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block font-titlu text-mic font-bold">
              Observații{" "}
              <span className="font-normal text-cerneala-slab">(opțional)</span>
            </span>
            <input name="observatii" maxLength={1000} className={camp} />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-caramiziu-600 px-6 py-2.5 font-titlu font-bold text-hartie"
            >
              Trece donația
            </button>
          </div>
        </form>
      </details>

      <h2 className="mt-10 font-titlu text-amplu font-bold text-cerneala">
        Ultimele donații
      </h2>

      {lista.length === 0 ? (
        <p className="mt-4 text-amplu text-cerneala-moale">
          Nicio donație încasată încă.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-mic">
            <thead>
              <tr className="border-b border-hartie-umbra">
                <Cap>Data</Cap>
                <Cap>Sumă</Cap>
                <Cap>Donator</Cap>
                <Cap>Pentru</Cap>
                <Cap>Cale</Cap>
                <Cap>Referință</Cap>
              </tr>
            </thead>
            <tbody>
              {lista.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-hartie-umbra/60 last:border-0"
                >
                  <td className="py-2.5 pr-4 whitespace-nowrap text-cerneala-moale">
                    {d.platitaLa ? CAND.format(new Date(d.platitaLa)) : "—"}
                  </td>
                  <td className="py-2.5 pr-4 font-titlu font-bold whitespace-nowrap text-cerneala">
                    {scrieSuma(d.sumaBani / 100)}
                    {d.frecventa === "lunar" && (
                      <span className="ml-1.5 rounded-full bg-turcoaz-100 px-2 py-0.5 text-nota font-bold text-turcoaz-900">
                        lunar
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-cerneala-moale">
                    {d.nume ?? (
                      <span className="text-cerneala-slab">—</span>
                    )}
                    {d.email && (
                      <span className="block text-nota break-all text-cerneala-slab">
                        {d.email}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-cerneala-moale">
                    {DESTINATII_DONATIE.find((x) => x.id === d.destinatie)
                      ?.eticheta ?? d.destinatie}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-cerneala-moale">
                    {numeleMetodei(d.procesator)}
                  </td>
                  <td className="py-2.5 text-nota break-all text-cerneala-slab">
                    {d.referinta}
                    {d.observatii && (
                      <span className="block text-cerneala-moale">
                        {d.observatii}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Cadru>
  );
}

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2 pr-4 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
      {children}
    </th>
  );
}
