import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  FELURI_CERERE,
  STADII_CERERE,
  type FelCerere,
  type StadiuCerere,
  cereri,
  esteFelCerere,
  esteStadiuCerere,
} from "@/lib/crm";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";

export const metadata: Metadata = {
  title: "Cereri",
  robots: { index: false, follow: false },
};

type Cautare = { fel?: string; stadiu?: string; gresit?: string };

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function PaginaCereri({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Cereri">Se încarcă…</Cadru>}>
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
  const { fel, stadiu, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Cereri" activ="/admin/cereri">
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
      <Cadru titlu="Cereri" activ="/admin/cereri">
        <Intrare gresit={Boolean(gresit)} unde="/admin/cereri" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Cereri" activ="/admin/cereri">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const felAles: FelCerere | undefined = esteFelCerere(fel) ? fel : undefined;
  const stadiuAles: StadiuCerere | undefined = esteStadiuCerere(stadiu)
    ? stadiu
    : undefined;
  const lista = await cereri(felAles, stadiuAles);

  return (
    <Cadru titlu="Cereri" activ="/admin/cereri">
      <div className="flex flex-wrap items-center gap-2">
        <Filtru href="/admin/cereri" activ={!felAles && !stadiuAles}>
          Toate
        </Filtru>
        {FELURI_CERERE.map((f) => (
          <Filtru
            key={f.id}
            href={`/admin/cereri?fel=${f.id}`}
            activ={felAles === f.id && !stadiuAles}
          >
            {f.eticheta}
          </Filtru>
        ))}
        <span aria-hidden="true" className="mx-1 text-hartie-umbra">
          |
        </span>
        {STADII_CERERE.map((s) => (
          <Filtru
            key={s.id}
            href={`/admin/cereri?stadiu=${s.id}${felAles ? `&fel=${felAles}` : ""}`}
            activ={stadiuAles === s.id}
          >
            {s.eticheta}
          </Filtru>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-10 text-amplu text-cerneala-moale">
          Nicio cerere aici. Apar singure când cineva cere pașii pentru 3,5%,
          se înscrie ca voluntar sau scrie prin formularul de contact.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {lista.map((c) => (
            <li
              key={c.id}
              className="rounded-card border border-hartie-umbra bg-hartie p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-titlu text-amplu font-bold text-cerneala">
                    {c.nume}
                  </p>
                  <p className="mt-0.5 text-nota text-cerneala-slab">
                    {FELURI_CERERE.find((f) => f.id === c.fel)?.eticheta ??
                      c.fel}{" "}
                    · {CAND.format(new Date(c.creatLa))}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-titlu text-nota font-bold ${
                    c.stadiu === "rezolvat"
                      ? "bg-turcoaz-100 text-turcoaz-900"
                      : c.stadiu === "in_lucru"
                        ? "bg-miere-100 text-cerneala"
                        : "bg-caramiziu-100 text-caramiziu-800"
                  }`}
                >
                  {STADII_CERERE.find((s) => s.id === c.stadiu)?.eticheta}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-mic">
                <a
                  href={`mailto:${c.email}`}
                  className="break-all text-caramiziu-700 underline underline-offset-2"
                >
                  {c.email}
                </a>
                {c.telefon && (
                  <a
                    href={`tel:${c.telefon.replace(/\s/g, "")}`}
                    className="font-titlu font-bold text-caramiziu-700 underline underline-offset-2"
                  >
                    {c.telefon}
                  </a>
                )}
              </div>

              {Object.keys(c.detalii).length > 0 && (
                <dl className="mt-3 grid gap-x-6 gap-y-1 rounded-moale bg-hartie-calda p-3 text-mic sm:grid-cols-[auto_1fr]">
                  {Object.entries(c.detalii).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-cerneala-slab">{k}</dt>
                      <dd className="whitespace-pre-wrap text-cerneala-moale">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <form
                action="/api/admin/cereri"
                method="post"
                className="mt-4 flex flex-wrap items-center gap-2 border-t border-hartie-umbra pt-4"
              >
                <input type="hidden" name="id" value={c.id} />
                {felAles && <input type="hidden" name="fel" value={felAles} />}
                <select
                  name="stadiu"
                  defaultValue={c.stadiu}
                  className="rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 font-titlu text-mic"
                >
                  {STADII_CERERE.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.eticheta}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-cerneala px-4 py-1.5 font-titlu text-mic font-bold text-hartie"
                >
                  Salvează
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Cadru>
  );
}

function Filtru({
  href,
  activ,
  children,
}: {
  href: string;
  activ: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={activ ? "page" : undefined}
      className={`rounded-full px-4 py-1.5 font-titlu text-mic font-bold transition-colors ${
        activ
          ? "bg-cerneala text-hartie"
          : "border border-hartie-umbra bg-hartie text-cerneala-moale hover:text-cerneala"
      }`}
    >
      {children}
    </a>
  );
}
