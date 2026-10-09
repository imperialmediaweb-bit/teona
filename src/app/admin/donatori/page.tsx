import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { donatori, rezumat, type Filtru } from "@/lib/plati/donatori";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";

export const metadata: Metadata = {
  title: "Donatori",
  robots: { index: false, follow: false },
};

const FILTRE: Array<{ id: Filtru; eticheta: string }> = [
  { id: "toti", eticheta: "Toți" },
  { id: "lunari", eticheta: "Donatori lunari" },
  { id: "cu-acord", eticheta: "Cu acord de buletin" },
  { id: "fara-acord", eticheta: "Fără acord" },
  { id: "neduși", eticheta: "Cu acord, neurcați în listă" },
];

export default function PaginaDonatori({
  searchParams,
}: {
  searchParams: Promise<{ filtru?: string; cauta?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Donatori">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ filtru?: string; cauta?: string; gresit?: string }>;
}) {
  await connection();
  const { filtru: cerut, cauta = "", gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Donatori" activ="/admin/donatori">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Zona asta nu e configurată. Setează variabila{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere, și reîncarcă pagina.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Donatori" activ="/admin/donatori">
        <Intrare gresit={Boolean(gresit)} />
      </Cadru>
    );
  }
  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Donatori" activ="/admin/donatori">
        <p>Baza de date nu e legată la site.</p>
      </Cadru>
    );
  }

  const filtru = (FILTRE.find((f) => f.id === cerut)?.id ?? "toti") as Filtru;
  const [lista, cifre] = await Promise.all([
    donatori(filtru, cauta),
    rezumat(),
  ]);

  return (
    <Cadru titlu="Donatori" activ="/admin/donatori">
      <div className="grid gap-3 sm:grid-cols-4">
        <Cifra
          eticheta="Total strâns"
          valoare={scrieSuma(cifre.totalBani / 100)}
        />
        <Cifra
          eticheta="Luna aceasta"
          valoare={scrieSuma(cifre.lunaAsta / 100)}
        />
        <Cifra eticheta="Donatori" valoare={String(cifre.donatori)} />
        <Cifra eticheta="Donatori lunari" valoare={String(cifre.lunari)} />
      </div>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
        <label className="grow">
          <span className="mb-1 block font-titlu text-mic font-bold">
            Caută
          </span>
          <input
            name="cauta"
            defaultValue={cauta}
            placeholder="nume sau e-mail"
            className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-2.5"
          />
        </label>
        <label>
          <span className="mb-1 block font-titlu text-mic font-bold">
            Filtru
          </span>
          <select
            name="filtru"
            defaultValue={filtru}
            className="rounded-moale border border-hartie-umbra bg-hartie px-4 py-2.5"
          >
            {FILTRE.map((f) => (
              <option key={f.id} value={f.id}>
                {f.eticheta}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-cerneala px-6 py-2.5 font-titlu font-bold text-hartie"
        >
          Arată
        </button>
      </form>

      {lista.length === 0 ? (
        <p className="mt-8 text-cerneala-moale">
          Niciun donator care să se potrivească. Deocamdată nu s-a încasat nimic
          prin site — lista se umple singură, de la prima donație.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-mic">
            <thead>
              <tr className="border-b border-hartie-umbra text-left">
                <Cap>Donator</Cap>
                <Cap>Total</Cap>
                <Cap>Donații</Cap>
                <Cap>Ultima</Cap>
                <Cap>Buletin</Cap>
                <Cap>Șterge datele</Cap>
              </tr>
            </thead>
            <tbody>
              {lista.map((d) => (
                <tr key={d.email} className="border-b border-hartie-umbra/60">
                  <td className="py-3 pr-4 align-top">
                    <span className="block font-titlu font-bold text-cerneala">
                      {d.nume || "(fără nume)"}
                    </span>
                    <span className="block text-cerneala-moale">{d.email}</span>
                    {d.telefon && (
                      <span className="block text-cerneala-slab">
                        {d.telefon}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top font-titlu font-bold">
                    {scrieSuma(d.totalBani / 100)}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {d.donatii}
                    {d.lunare > 0 && (
                      <span className="ml-1 text-caramiziu-700">(lunar)</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top text-cerneala-moale">
                    {d.ultimaLa ? d.ultimaLa.slice(0, 10) : "—"}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {d.acordBuletin
                      ? d.dusLaBuletin
                        ? "în listă"
                        : "acord, neurcat"
                      : "fără acord"}
                  </td>
                  <td className="py-3 align-top">
                    <form action="/api/admin/donatori" method="post">
                      <input type="hidden" name="email" value={d.email} />
                      <input type="hidden" name="fapta" value="uita" />
                      <button
                        type="submit"
                        className="rounded-full border border-hartie-umbra px-3 py-1.5 font-titlu font-bold text-cerneala-moale hover:border-caramiziu-400 hover:text-caramiziu-700"
                      >
                        Uită-l
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 max-w-3xl text-mic text-cerneala-moale">
        <strong>„Uită-l”</strong> șterge numele, e-mailul și telefonul din toate
        donațiile omului, dar păstrează suma, data și destinația: asociația are
        obligația legală să țină evidența contabilă. Omul dispare din listă;
        banii rămân în contabilitate. Operația nu se poate anula.
      </p>
    </Cadru>
  );
}

function Cifra({ eticheta, valoare }: { eticheta: string; valoare: string }) {
  return (
    <div className="rounded-card border border-hartie-umbra bg-hartie p-5">
      <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
        {eticheta}
      </p>
      <p className="mt-1 font-titlu text-h4 font-extrabold text-cerneala">
        {valoare}
      </p>
    </div>
  );
}

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2 pr-4 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
      {children}
    </th>
  );
}
