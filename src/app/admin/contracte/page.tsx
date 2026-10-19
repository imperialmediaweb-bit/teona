import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import { scrieSuma } from "@/lib/suma";
import {
  aniiContractelor,
  contracte,
  nereinnoite,
  totaluriContracte,
  STADII_CONTRACT,
  type Contract,
} from "@/lib/contracte";

export const metadata: Metadata = {
  title: "Contracte",
  robots: { index: false, follow: false },
};

/**
 * Registrul contractelor de sponsorizare.
 *
 * **Ce rezolvă.** Contractul se genera din fișa firmei și dispărea după
 * descărcare; numărul se scria de mână. La final de an, contabilul cere
 * lista — număr, dată, firmă, sumă — iar ea se reconstituia din inbox,
 * altfel de fiecare dată.
 *
 * **De ce „semnate, bani neintrați" e scris separat.** Sponsorizarea se scade
 * din impozitul anului în care a fost **plătită**. Un contract semnat în
 * noiembrie și plătit în ianuarie pierde anul fiscal pentru firmă — iar firma
 * se supără pe asociație, nu pe propria contabilitate.
 */

const RATAT: Record<string, string> = {
  suma: "Suma nu e scrisă corect. Scrie-o cu cifre: 1500 sau 1.500,50.",
  data: "Ziua nu e scrisă corect.",
};

const CLASA_CAMP =
  "min-h-11 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-mic text-cerneala";

export default function PaginaContracte({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; an?: string; ratat?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Contracte">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; an?: string; ratat?: string }>;
}) {
  await connection();
  const { gresit, an: anScris, ratat } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Contracte" activ="/admin/contracte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Contracte" activ="/admin/contracte">
        <Intrare gresit={Boolean(gresit)} unde="/admin/contracte" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/contracte"))) {
    return <FaraDrept titlu="Contracte" activ="/admin/contracte" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Contracte" activ="/admin/contracte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Registrul stă în baza de date.
        </p>
      </Cadru>
    );
  }

  const acum = new Date().getFullYear();
  const ani = await aniiContractelor().catch((): number[] => []);
  if (!ani.includes(acum)) ani.unshift(acum);
  const an =
    anScris && /^\d{4}$/.test(anScris) && ani.includes(Number(anScris))
      ? Number(anScris)
      : acum;

  const [lista, totaluri, fara] = await Promise.all([
    contracte(an),
    totaluriContracte(an),
    nereinnoite(an),
  ]);

  return (
    <Cadru
      titlu="Contracte"
      descriere="Registrul sponsorizărilor: număr, dată, firmă, sumă."
      activ="/admin/contracte"
    >
      {ratat && RATAT[ratat] && (
        <p
          role="alert"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {RATAT[ratat]}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {ani.map((a) => (
          <Link
            key={a}
            href={`/admin/contracte?an=${a}`}
            className={`inline-flex min-h-11 items-center rounded-full px-5 font-titlu font-bold transition-colors ${
              a === an
                ? "bg-caramiziu-700 text-hartie"
                : "border-2 border-hartie-umbra text-cerneala-moale hover:border-caramiziu-400"
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Contracte"
          valoare={String(totaluri.cate)}
          nota={`În ${an}`}
        />
        <Cifra
          eticheta="Valoare totală"
          valoare={scrieSuma(totaluri.valoareTotala / 100)}
          nota="Fără cele anulate"
        />
        <Cifra
          eticheta="Încasat"
          valoare={scrieSuma(totaluri.valoareIncasata / 100)}
          nota={`${totaluri.incasate} contracte`}
        />
        <Cifra
          eticheta="Semnate, bani neintrați"
          valoare={scrieSuma(totaluri.valoareDeIncasat / 100)}
          nota={
            totaluri.deIncasat > 0
              ? `${totaluri.deIncasat} de urmărit până la 31 decembrie`
              : "Nimic de urmărit"
          }
        />
      </div>

      {totaluri.deIncasat > 0 && (
        <p className="mt-4 max-w-3xl colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900">
          <strong>Sponsorizarea se scade din impozitul anului în care a fost
          plătită.</strong>{" "}
          Un contract semnat acum și plătit în ianuarie pierde anul fiscal
          pentru firmă — iar firma se supără pe asociație, nu pe propria
          contabilitate. Termenul exact al Declarației 177 îl confirmă
          contabilitatea firmei.
        </p>
      )}

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Registrul pe {an}
          </h2>
          <p className="text-nota text-cerneala-slab">
            Numărul se dă singur, la generarea contractului din fișa firmei.
          </p>
        </div>

        {lista.length === 0 ? (
          <p className="max-w-3xl text-amplu text-cerneala-moale">
            Niciun contract pe {an}. Se scriu singure aici, de fiecare dată
            când se generează un contract din{" "}
            <Link
              href="/admin/firme"
              className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              fișa unei firme
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-3">
            {lista.map((c) => (
              <Rand key={c.id} c={c} an={an} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Au sponsorizat înainte, în {an} nu
          </h2>
          <p className="text-nota text-cerneala-slab">
            Cine a semnat o dată semnează mai ușor a doua oară decât oricine
            altcineva.
          </p>
        </div>

        {fara.length === 0 ? (
          <p className="max-w-3xl text-amplu text-cerneala-moale">
            Niciuna — ori toți sponsorii de până acum au reînnoit, ori încă nu
            există contracte din anii trecuți în registru.
          </p>
        ) : (
          <ul className="grid gap-2">
            {fara.map((f) => (
              <li
                key={`${f.cui ?? f.denumire}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 colt-a border border-hartie-umbra bg-hartie p-4"
              >
                <span className="font-titlu font-bold text-cerneala">
                  {f.firmaId ? (
                    <Link
                      href={`/admin/firme/${f.firmaId}`}
                      className="underline underline-offset-2"
                    >
                      {f.denumire}
                    </Link>
                  ) : (
                    f.denumire
                  )}
                  {f.cui && (
                    <span className="font-normal text-cerneala-slab">
                      {" "}
                      · CUI {f.cui}
                    </span>
                  )}
                </span>
                <span className="text-mic text-cerneala-moale">
                  ultima dată în {f.ultimulAn}
                  {f.valoareBani
                    ? ` · ${scrieSuma(f.valoareBani / 100)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Cadru>
  );
}

function Cifra({
  eticheta,
  valoare,
  nota,
}: {
  eticheta: string;
  valoare: string;
  nota?: string;
}) {
  return (
    <div className="colt-mic-a border border-hartie-umbra bg-hartie p-4">
      <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
        {eticheta}
      </p>
      <p className="mt-1 font-titlu text-h4 font-extrabold text-cerneala">
        {valoare}
      </p>
      {nota && <p className="mt-1 text-nota text-cerneala-moale">{nota}</p>}
    </div>
  );
}

function Rand({ c, an }: { c: Contract; an: number }) {
  const stadiu = STADII_CONTRACT.find((s) => s.id === c.stadiu);
  return (
    <li className="colt-a border border-hartie-umbra bg-hartie p-4 sm:p-5">
      <details>
        <summary className="cursor-pointer list-none">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="font-titlu font-bold text-cerneala">
                {c.scris} · {c.denumire}
              </span>
              <span className="block text-nota text-cerneala-slab">
                {c.dataContract}
                {c.cui && ` · CUI ${c.cui}`}
                {c.valoareBani !== null &&
                  ` · ${scrieSuma(c.valoareBani / 100)}`}
                {stadiu && ` · ${stadiu.eticheta}`}
              </span>
            </span>
            <span className="font-titlu text-nota font-semibold text-caramiziu-700">
              Schimbă
            </span>
          </span>
        </summary>

        {c.observatii && (
          <p className="mt-3 text-mic text-cerneala-moale">{c.observatii}</p>
        )}

        <form
          method="post"
          action="/api/admin/contracte"
          className="mt-4 grid gap-3"
        >
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="an" value={an} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Stadiu
              </span>
              <select
                name="stadiu"
                defaultValue={c.stadiu}
                className={CLASA_CAMP}
              >
                {STADII_CONTRACT.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.eticheta}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Valoare (lei)
              </span>
              <input
                name="valoare"
                inputMode="decimal"
                defaultValue={
                  c.valoareBani === null ? "" : String(c.valoareBani / 100)
                }
                className={CLASA_CAMP}
              />
            </label>
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Data contractului
              </span>
              <input
                type="date"
                name="data"
                defaultValue={c.dataContract}
                className={CLASA_CAMP}
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="font-titlu text-nota font-bold text-cerneala">
              Observații
            </span>
            <input
              name="observatii"
              defaultValue={c.observatii ?? ""}
              maxLength={1000}
              placeholder="„plata promisă în decembrie”, „semnat de director”"
              className={CLASA_CAMP}
            />
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
            >
              Salvează
            </button>
          </div>
        </form>
      </details>
    </li>
  );
}
