import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  METODE_MANUALE,
  donatii,
  numeleMetodei,
  transferuriAnuntate,
} from "@/lib/plati/donatori";
import { DESTINATII_DONATIE } from "@/date/asociatie";
import { scrieSuma } from "@/lib/suma";
import { platiEsuate } from "@/lib/plati/esuate";
import Cadru from "@/componente/admin/Cadru";
import Descarca from "@/componente/admin/Descarca";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Donații",
  robots: { index: false, follow: false },
};

type Cautare = {
  gata?: string;
  respins?: string;
  eroare?: string;
  gresit?: string;
};

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

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { gata, respins, eroare, gresit } = await searchParams;

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
      <Cadru titlu="Intră în panou" activ="/admin/donatii" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/donatii" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/donatii"))) {
    return <FaraDrept titlu="Donații" activ="/admin/donatii" />;
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
  const anuntate = await transferuriAnuntate();
  const esuate = await platiEsuate().catch(() => []);
  const camp =
    "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic";
  const azi = new Date().toISOString().slice(0, 10);

  return (
    <Cadru
      titlu="Donații"
      activ="/admin/donatii"
      actiuni={<Descarca ce="donatii" />}
    >
      {gata && (
        <p
          role="status"
          className="mb-6 rounded-card border border-turcoaz-200 bg-turcoaz-50 p-4 text-mic text-turcoaz-900"
        >
          <strong className="font-titlu font-bold">Donația e trecută.</strong>{" "}
          Apare în listă și în tabloul de bord.
        </p>
      )}
      {respins && (
        <p
          role="status"
          className="mb-6 rounded-card border border-hartie-umbra bg-hartie-calda p-4 text-mic text-cerneala-moale"
        >
          <strong className="font-titlu font-bold">Transferul e scos.</strong>{" "}
          Nu intră în totaluri. Dacă banii apar mai târziu în extras, trece
          donația de mână.
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

      {/*
        Transferurile anunțate de donatori, primul lucru de pe pagină.

        Sunt singura listă de aici care cere o faptă: cineva se uită în extras
        și apasă. Până atunci nu se numără nicăieri — nici în totaluri, nici
        în tabelul de mai jos — pentru că anunțul vine dintr-un formular
        public, iar un total în care intră ce scrie oricine nu e un total.
      */}
      {/*
        Donațiile lunare care n-au trecut — oamenii de sunat.

        Stau deasupra transferurilor dinadins: un transfer anunțat așteaptă o
        verificare și nu se pierde dacă se face mâine. Un card căzut se pierde
        de tot — Stripe mai încearcă de câteva ori, apoi oprește abonamentul,
        iar donatorul nici nu știe.
      */}
      {esuate.length > 0 && (
        <section className="mb-8 rounded-card border-2 border-caramiziu-300 bg-caramiziu-50 p-5">
          <h2 className="font-titlu text-amplu font-bold text-caramiziu-900">
            Donații lunare care n-au trecut ({esuate.length})
          </h2>
          <p className="mt-1 max-w-2xl text-mic text-caramiziu-900/80">
            Oamenii ăștia vor să doneze și nu pot — de obicei fiindcă le-a
            expirat cardul. Fiecare a primit un mesaj cu linkul de schimbat
            cardul; jumătate nu-l deschid. Un telefon în săptămâna asta
            recuperează donația. Rândul dispare singur când plata trece.
          </p>

          <ul className="mt-5 grid gap-3">
            {esuate.map((e) => (
              <li
                key={e.id}
                className="rounded-moale border border-caramiziu-200 bg-hartie p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-titlu font-bold text-cerneala">
                    {[e.prenume, e.email].filter(Boolean).join(" · ") ||
                      "fără nume"}
                  </p>
                  <p className="font-titlu font-bold whitespace-nowrap text-caramiziu-800">
                    {scrieSuma(e.sumaBani / 100, e.moneda)} pe lună
                  </p>
                </div>
                <p className="mt-1 text-nota text-cerneala-moale">
                  {CAND.format(new Date(e.creatLa))}
                  {e.incercari > 1 && ` · ${e.incercari} încercări`}
                  {e.motiv && ` · ${e.motiv}`}
                </p>
                {e.email && (
                  <p className="mt-2 text-mic">
                    <a
                      href={`mailto:${e.email}`}
                      className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-2"
                    >
                      Scrie-i
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {anuntate.length > 0 && (
        <section className="mb-8 rounded-card border-2 border-turcoaz-300 bg-turcoaz-50 p-5">
          <h2 className="font-titlu text-amplu font-bold text-turcoaz-900">
            Transferuri anunțate de donatori ({anuntate.length})
          </h2>
          <p className="mt-1 max-w-2xl text-mic text-turcoaz-900/80">
            Oamenii ăștia spun că au făcut transferul. Caută suma în extrasul de
            cont: dacă e acolo, apasă „Am găsit-o în extras” și donația intră în
            totaluri, cu data de mai jos. Dacă nu, scoate-o.
          </p>

          <ul className="mt-5 grid gap-4">
            {anuntate.map((t) => (
              <li
                key={t.id}
                className="rounded-card border border-turcoaz-200 bg-hartie p-4"
              >
                <p className="font-titlu text-amplu font-bold text-cerneala">
                  {scrieSuma(t.sumaBani / 100)}
                  <span className="ml-2 font-normal text-cerneala-moale">
                    {t.nume}
                  </span>
                </p>
                <p className="mt-1 text-mic text-cerneala-moale">
                  Transfer făcut pe {CAND.format(new Date(t.cand))} · pentru{" "}
                  {DESTINATII_DONATIE.find((x) => x.id === t.destinatie)
                    ?.eticheta ?? t.destinatie}{" "}
                  · anunțat pe {CAND.format(new Date(t.anuntatLa))}
                </p>
                {(t.email || t.telefon) && (
                  <p className="mt-1 text-mic break-all text-cerneala-moale">
                    {[t.email, t.telefon].filter(Boolean).join(" · ")}
                  </p>
                )}
                {t.observatii && (
                  <p className="mt-1 text-mic text-cerneala-moale">
                    La detaliile plății: {t.observatii}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action="/api/admin/donatii/confirma" method="post">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="hotarare" value="confirma" />
                    <button
                      type="submit"
                      className="rounded-full bg-turcoaz-600 px-5 py-2.5 font-titlu font-bold text-hartie"
                    >
                      Am găsit-o în extras
                    </button>
                  </form>
                  <form action="/api/admin/donatii/confirma" method="post">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="hotarare" value="respinge" />
                    <button
                      type="submit"
                      className="rounded-full border border-hartie-umbra px-5 py-2.5 font-titlu font-bold text-cerneala"
                    >
                      N-am găsit-o
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
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
                    {d.nume ?? <span className="text-cerneala-slab">—</span>}
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
