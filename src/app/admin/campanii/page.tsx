import type { Metadata } from "next";
import Image from "next/image";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { campaniiDeVerificat } from "@/lib/campanii";
import { adresaPoza } from "@/lib/poza-urcata";
import { etichetaOcaziei } from "@/date/aniversari";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verificare campanii",
  robots: { index: false, follow: false },
};

/**
 * Lista campaniilor de verificat.
 *
 * Nicio campanie nu ajunge pe site fără ca cineva să se uite peste ea. Pagina
 * asta e locul unde se uită: textul întreg, poza întreagă, e-mailul celui
 * care a trimis-o, și două butoane.
 */
/*
  Tot ce e aici — cookie-ul de autentificare și lista din baza de date — se
  citește la cerere. Cu `cacheComponents`, partea dinamică trebuie să stea
  într-un `<Suspense>`, altfel construirea se oprește: Next încearcă să
  pregătească pagina dinainte și dă peste date pe care nu le poate ști.
*/
export default function Verificare({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Verificare campanii">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  await connection();
  const { gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Verificare campanii">
        <p className="text-amplu text-cerneala-moale">
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
      <Cadru titlu="Verificare campanii">
        <form action="/api/admin/intrare" method="post" className="max-w-sm">
          <label
            htmlFor="parola"
            className="mb-2 block font-titlu text-mic font-bold text-cerneala"
          >
            Parola
          </label>
          <input
            id="parola"
            name="parola"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
          />
          {gresit && (
            <p
              role="alert"
              className="mt-3 font-titlu font-semibold text-caramiziu-700"
            >
              Parolă greșită.
            </p>
          )}
          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie"
          >
            Intră
          </button>
        </form>
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Verificare campanii">
        <p className="text-amplu text-cerneala-moale">
          Baza de date nu e legată la site (lipsește `DATABASE_URL`).
        </p>
      </Cadru>
    );
  }

  const campanii = await campaniiDeVerificat();

  return (
    <Cadru titlu={`Campanii de verificat (${campanii.length})`}>
      {campanii.length === 0 && (
        <p className="text-amplu text-cerneala-moale">
          Nimic de verificat acum.
        </p>
      )}

      <div className="grid gap-8">
        {campanii.map((c) => (
          <article
            key={c.id}
            className="colt-a border border-hartie-umbra bg-hartie p-6 shadow-[0_20px_44px_-26px_rgba(35,35,35,0.3)]"
          >
            <p className="scris text-amplu text-caramiziu-600">
              {etichetaOcaziei(c.ocazie)}
            </p>
            <h2 className="mt-1 text-h3 text-cerneala">{c.titlu}</h2>
            <p className="mt-1 font-titlu font-bold text-cerneala-moale">
              {c.numePublic} · {c.email}
              {c.dataEvenimentului && <> · {c.dataEvenimentului}</>}
            </p>

            {c.pozaId && (
              <Image
                src={adresaPoza(c.pozaId, 900)}
                alt=""
                width={c.pozaLatime ?? 900}
                height={c.pozaInaltime ?? 600}
                sizes="(min-width: 768px) 700px, 92vw"
                unoptimized
                className="mt-5 h-auto w-full max-w-2xl rounded-moale"
              />
            )}

            <p className="mt-5 max-w-3xl whitespace-pre-line text-cerneala-moale">
              {c.mesaj}
            </p>

            {c.linkGalantom && (
              <p className="mt-4 break-all text-mic text-cerneala-moale">
                Donațiile merg la: {c.linkGalantom}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-hartie-umbra pt-5">
              <form action="/api/admin/campanii" method="post">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="hotarare" value="publicata" />
                <button
                  type="submit"
                  className="rounded-full bg-turcoaz-600 px-6 py-3 font-titlu font-bold text-hartie"
                >
                  Publică
                </button>
              </form>
              <form action="/api/admin/campanii" method="post">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="hotarare" value="respinsa" />
                <button
                  type="submit"
                  className="rounded-full border border-hartie-umbra px-6 py-3 font-titlu font-bold text-cerneala"
                >
                  Respinge
                </button>
              </form>
              <p className="self-center text-mic text-cerneala-slab">
                /ziua-ta/{c.slug}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Cadru>
  );
}

function Cadru({
  titlu,
  children,
}: {
  titlu: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-h2 text-cerneala">{titlu}</h1>
      <div className="mt-8">{children}</div>
    </main>
  );
}
