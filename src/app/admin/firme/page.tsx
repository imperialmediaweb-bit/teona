import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  STADII_FIRMA,
  type StadiuFirma,
  esteStadiuFirma,
  firme,
  interactiuni,
} from "@/lib/crm";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import Jurnal from "@/componente/admin/Jurnal";

export const metadata: Metadata = {
  title: "Firme",
  robots: { index: false, follow: false },
};

type Cautare = {
  stadiu?: string;
  cauta?: string;
  gresit?: string;
  deschis?: string;
};

export default function PaginaFirme({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Firme">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const DATA = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function cand(iso: string): string {
  return iso ? DATA.format(new Date(iso)) : "—";
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  await connection();
  const { stadiu, cauta = "", gresit, deschis } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Firme" activ="/admin/firme">
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
      <Cadru titlu="Firme" activ="/admin/firme">
        <Intrare gresit={Boolean(gresit)} unde="/admin/firme" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Firme" activ="/admin/firme">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const ales: StadiuFirma | undefined = esteStadiuFirma(stadiu)
    ? stadiu
    : undefined;
  const lista = await firme(ales, cauta);

  // Jurnalul se încarcă doar pentru firma deschisă: altfel fiecare pagină ar
  // face câte o interogare pentru fiecare rând din tabel.
  const jurnal = deschis ? await interactiuni({ firmaId: deschis }) : [];

  return (
    <Cadru titlu="Firme" activ="/admin/firme">
      <div className="flex flex-wrap items-center gap-2">
        <Filtru href="/admin/firme" activ={!ales} cauta={cauta}>
          Toate
        </Filtru>
        {STADII_FIRMA.map((s) => (
          <Filtru
            key={s.id}
            href={`/admin/firme?stadiu=${s.id}`}
            activ={ales === s.id}
            cauta={cauta}
          >
            {s.eticheta}
          </Filtru>
        ))}
      </div>

      <form method="get" className="mt-5 flex max-w-md gap-2">
        {ales && <input type="hidden" name="stadiu" value={ales} />}
        <input
          name="cauta"
          defaultValue={cauta}
          placeholder="Caută după denumire, CUI, persoană sau e-mail"
          className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-2.5 font-titlu text-mic"
        />
        <button
          type="submit"
          className="rounded-full bg-cerneala px-5 py-2.5 font-titlu text-mic font-bold text-hartie"
        >
          Caută
        </button>
      </form>

      {lista.length === 0 ? (
        <p className="mt-10 text-amplu text-cerneala-moale">
          {cauta || ales
            ? "Nicio firmă care să se potrivească."
            : "Nicio firmă încă. Apar aici când cineva completează formularul de pe pagina „Direcționează 20%”."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {lista.map((f) => {
            const eDeschis = deschis === f.id;
            return (
              <li
                key={f.id}
                id={f.id}
                className="scroll-mt-24 rounded-card border border-hartie-umbra bg-hartie p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-titlu text-amplu font-bold text-cerneala">
                      {f.denumire}
                    </p>
                    <p className="mt-0.5 text-nota text-cerneala-slab">
                      CUI {f.cui} · {f.cale} · a scris {cand(f.creatLa)}
                    </p>
                  </div>
                  <Eticheta stadiu={f.stadiu} />
                </div>

                <div className="mt-4 grid gap-x-8 gap-y-1.5 text-mic sm:grid-cols-2">
                  <p className="text-cerneala-moale">
                    <span className="text-cerneala-slab">Contact: </span>
                    {f.persoana}
                  </p>
                  <p>
                    <a
                      href={`mailto:${f.email}`}
                      className="break-all text-caramiziu-700 underline underline-offset-2"
                    >
                      {f.email}
                    </a>
                  </p>
                  {f.telefon && (
                    <p>
                      <a
                        href={`tel:${f.telefon.replace(/\s/g, "")}`}
                        className="font-titlu font-bold text-caramiziu-700 underline underline-offset-2"
                      >
                        {f.telefon}
                      </a>
                    </p>
                  )}
                  {f.sumaEstimata && (
                    <p className="text-cerneala-moale">
                      <span className="text-cerneala-slab">Estimat: </span>
                      {f.sumaEstimata}
                    </p>
                  )}
                  {f.sumaBani !== null && (
                    <p className="font-titlu font-bold text-turcoaz-800">
                      Încasat: {scrieSuma(f.sumaBani / 100)}
                    </p>
                  )}
                </div>

                {f.mesaj && (
                  <p className="mt-3 rounded-moale bg-hartie-calda p-3 text-mic text-cerneala-moale">
                    {f.mesaj}
                  </p>
                )}

                <form
                  action="/api/admin/firme"
                  method="post"
                  className="mt-4 flex flex-wrap items-center gap-2 border-t border-hartie-umbra pt-4"
                >
                  <input type="hidden" name="id" value={f.id} />
                  <label className="text-nota text-cerneala-slab">
                    Mută în
                    <select
                      name="stadiu"
                      defaultValue={f.stadiu}
                      className="ml-2 rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 font-titlu text-mic"
                    >
                      {STADII_FIRMA.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.eticheta}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    name="suma"
                    inputMode="decimal"
                    placeholder="Suma încasată (lei)"
                    className="w-44 rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 text-mic"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-cerneala px-4 py-1.5 font-titlu text-mic font-bold text-hartie"
                  >
                    Salvează
                  </button>
                </form>

                <Jurnal
                  firmaId={f.id}
                  deschis={eDeschis}
                  intrari={eDeschis ? jurnal : []}
                  inapoiLa={`/admin/firme${ales ? `?stadiu=${ales}` : ""}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Cadru>
  );
}

function Filtru({
  href,
  activ,
  cauta,
  children,
}: {
  href: string;
  activ: boolean;
  cauta: string;
  children: React.ReactNode;
}) {
  const adresa = cauta
    ? `${href}${href.includes("?") ? "&" : "?"}cauta=${encodeURIComponent(cauta)}`
    : href;
  return (
    <a
      href={adresa}
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

function Eticheta({ stadiu }: { stadiu: StadiuFirma }) {
  const s = STADII_FIRMA.find((x) => x.id === stadiu);
  const clase = {
    miere: "bg-miere-100 text-cerneala",
    turcoaz: "bg-turcoaz-100 text-turcoaz-900",
    caramiziu: "bg-caramiziu-100 text-caramiziu-800",
    cerneala: "bg-hartie-umbra text-cerneala-moale",
  }[s?.culoare ?? "miere"];
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 font-titlu text-nota font-bold ${clase}`}
    >
      {s?.eticheta ?? stadiu}
    </span>
  );
}
