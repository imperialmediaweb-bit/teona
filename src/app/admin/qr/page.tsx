import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import { caNume, caSvg, linkEtichetat, LOCURI } from "@/lib/qr";

export const metadata: Metadata = {
  title: "Cod QR",
  robots: { index: false, follow: false },
};

/**
 * Coduri QR de tipărit, cu etichetă.
 *
 * **De ce stă în panou și nu se face dintr-un site oarecare.** Codurile făcute
 * pe site-urile gratuite duc, aproape toate, la o adresă intermediară a lor:
 * dacă site-ul acela se închide sau începe să ceară bani, afișele tipărite
 * rămân cu un cod care nu mai duce nicăieri. Al doilea motiv e eticheta — un
 * cod fără ea aduce oameni care în panou apar la fel cu cei care au scris
 * adresa de mână, deci afișul nu se poate judeca niciodată.
 */
export default function PaginaQr({
  searchParams,
}: {
  searchParams: Promise<{
    cale?: string;
    loc?: string;
    suma?: string;
    gresit?: string;
  }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Cod QR">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{
    cale?: string;
    loc?: string;
    suma?: string;
    gresit?: string;
  }>;
}) {
  await connection();
  const { cale, loc, suma, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Cod QR" activ="/admin/qr">
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
      <Cadru titlu="Cod QR" activ="/admin/qr">
        <Intrare gresit={Boolean(gresit)} unde="/admin/qr" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/qr"))) {
    return <FaraDrept titlu="Cod QR" activ="/admin/qr" />;
  }

  const aleasa =
    LOCURI.find((l) => l.cale === cale)?.cale ?? LOCURI[0].cale;
  const unde = (loc ?? "").slice(0, 60);
  const sumaNumar = Number(suma);
  const sumaBuna =
    Number.isFinite(sumaNumar) && sumaNumar > 0 && sumaNumar <= 100_000
      ? Math.round(sumaNumar)
      : null;

  const link = linkEtichetat({ cale: aleasa, loc: unde, suma: sumaBuna });
  const svg = await caSvg(link);
  const descarca = new URLSearchParams({ cale: aleasa });
  if (unde) descarca.set("loc", unde);
  if (sumaBuna) descarca.set("suma", String(sumaBuna));

  return (
    <Cadru
      titlu="Cod QR"
      descriere="Pentru afișe, fluturași, cutii de donații — cu etichetă, ca să se vadă în panou ce au adus."
      activ="/admin/qr"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
          <h2 className="font-titlu text-amplu font-bold text-cerneala">
            Fă codul
          </h2>

          <form method="get" className="mt-4 grid gap-4">
            <label className="grid gap-1.5">
              <span className="font-titlu text-mic font-bold text-cerneala">
                Unde duce
              </span>
              <select
                name="cale"
                defaultValue={aleasa}
                className="min-h-12 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-cerneala"
              >
                {LOCURI.map((l) => (
                  <option key={l.cale} value={l.cale}>
                    {l.nume}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="font-titlu text-mic font-bold text-cerneala">
                Unde stă codul
              </span>
              <input
                name="loc"
                defaultValue={unde}
                maxLength={60}
                placeholder="afiș biserică, cutie Casa Teona, fluturaș concert"
                className="min-h-12 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-cerneala"
              />
              <span className="text-nota text-cerneala-slab">
                Numele ăsta ajunge în eticheta linkului
                {caNume(unde) && (
                  <>
                    {" "}
                    (
                    <code className="rounded bg-hartie-umbra px-1">
                      {caNume(unde)}
                    </code>
                    )
                  </>
                )}
                . Fiecare loc cu numele lui — altfel nu se poate spune care
                afiș a adus oamenii.
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="font-titlu text-mic font-bold text-cerneala">
                Sumă preselectată (opțional)
              </span>
              <input
                name="suma"
                type="number"
                min={1}
                max={100000}
                defaultValue={sumaBuna ?? ""}
                placeholder="50"
                className="min-h-12 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-cerneala sm:max-w-40"
              />
              <span className="text-nota text-cerneala-slab">
                Formularul se deschide cu suma asta aleasă. Omul o poate
                schimba oricând — e o propunere, nu o cerere.
              </span>
            </label>

            <div>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
              >
                Fă codul
              </button>
            </div>
          </form>

          <h3 className="mt-8 font-titlu text-mic font-bold text-cerneala">
            Linkul din spatele codului
          </h3>
          <p className="mt-2 break-all colt-mic-a bg-hartie-umbra/60 px-3 py-2 font-mono text-nota text-cerneala-moale">
            {link}
          </p>
          <p className="mt-2 max-w-2xl text-nota text-cerneala-slab">
            Merge și scris de mână, dacă e nevoie de el într-un mesaj. Donația
            făcută după scanare intră în panou pe rândul{" "}
            <strong className="text-cerneala-moale">Cod QR tipărit</strong>, la{" "}
            „De unde vin donatorii".
          </p>
        </section>

        <aside className="colt-a border border-hartie-umbra bg-hartie p-5">
          <h2 className="font-titlu text-amplu font-bold text-cerneala">
            Codul
          </h2>
          <div
            className="mt-3 colt-mic-a border border-hartie-umbra bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
            // SVG-ul e făcut aici, din biblioteca de coduri QR: nu intră
            // nimic scris de un om în el, doar linkul de mai sus.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="mt-4 grid gap-2">
            <a
              href={`/api/admin/qr?${descarca.toString()}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
            >
              Descarcă PNG
            </a>
            <a
              href={`/api/admin/qr?${descarca.toString()}&fel=svg`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-caramiziu-300 bg-hartie px-5 font-titlu font-bold text-caramiziu-800 transition-colors hover:border-caramiziu-500"
            >
              Descarcă SVG
            </a>
          </div>
          <p className="mt-3 text-nota text-cerneala-slab">
            PNG pentru Word și tipar obișnuit. SVG pentru bannere și afișe
            mari: nu se pixelează oricât îl mărești.
          </p>
          <p className="mt-3 text-nota text-cerneala-slab">
            <strong className="text-cerneala-moale">Înainte de tipar:</strong>{" "}
            scanează-l de pe ecran, cu telefonul. Un cod tipărit greșit se
            descoperă altfel abia după o mie de fluturași.
          </p>
        </aside>
      </div>
    </Cadru>
  );
}
