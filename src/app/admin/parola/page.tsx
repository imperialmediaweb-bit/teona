import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  areParolaConfigurata,
  arePermisiune,
  cineEsteConectat,
  esteAutentificat,
} from "@/lib/admin";
import { MINIM_PAROLA, NUMELE_ROLULUI } from "@/lib/utilizatori";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Parola mea",
  robots: { index: false, follow: false },
};

/**
 * Omul își schimbă parola lui.
 *
 * Pagina există ca să nu rămână pe veci parola scrisă de administrator la
 * facerea contului — știută de doi oameni și trimisă, de obicei, pe WhatsApp.
 * După ce omul o schimbă aici, n-o mai știe nimeni altcineva.
 *
 * Se cere parola de acum, deși omul e deja conectat: un laptop lăsat deschis
 * sau un cookie furat ar fi altfel de ajuns ca să iei contul definitiv, nu
 * doar să te uiți prin el până expiră sesiunea.
 */

const STARI: Record<string, { text: string; bun?: boolean }> = {
  schimbata: {
    text: "Parola a fost schimbată. Rămâi înăuntru; la următoarea intrare o folosești pe cea nouă.",
    bun: true,
  },
  veche: { text: "Parola de acum nu se potrivește." },
  scurta: { text: `Parola nouă are nevoie de cel puțin ${MINIM_PAROLA} semne.` },
  diferite: { text: "Cele două parole noi nu sunt la fel." },
  aceeasi: { text: "Parola nouă e aceeași cu cea de acum." },
  "fara-cont": {
    text: "Ești înăuntru cu parola asociației, nu cu un cont. Ea nu se schimbă de aici — cere-i dezvoltatorului.",
  },
  necunoscut: { text: "N-am putut schimba parola." },
};

const CLASA_CAMP =
  "min-h-11 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-cerneala";

export default function PaginaParola({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Parola mea">Se încarcă…</Cadru>}>
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
      <Cadru titlu="Parola mea" activ="/admin/parola">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/parola" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/parola" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/parola"))) {
    return <FaraDrept titlu="Parola mea" activ="/admin/parola" />;
  }

  const cine = await cineEsteConectat();
  const mesaj = stare ? STARI[stare] : undefined;

  return (
    <Cadru titlu="Parola mea" activ="/admin/parola">
      {mesaj && (
        <p
          id="stare"
          tabIndex={-1}
          role="alert"
          className={`scroll-mt-24 mb-6 max-w-2xl colt-mic-a px-4 py-3 text-mic font-semibold ${
            mesaj.bun
              ? "bg-turcoaz-50 text-cerneala"
              : "bg-caramiziu-50 text-caramiziu-900"
          }`}
        >
          {mesaj.text}
        </p>
      )}

      {cine?.fel === "cheie" ? (
        <div className="max-w-2xl">
          <p className="text-amplu text-cerneala-moale">
            Ești înăuntru cu <strong>parola asociației</strong>, nu cu un cont
            al tău.
          </p>
          <p className="mt-3 text-cerneala-moale">
            Ea se schimbă în Railway, în variabila{" "}
            <code className="rounded bg-hartie-umbra px-1.5">PAROLA_ADMIN</code>
            , și schimbarea îi dă afară pe toți cei care sunt înăuntru cu ea.
            Dacă vrei un cont al tău, cu nume care să apară în jurnal, cere-i
            unui administrator să ți-l facă.
          </p>
        </div>
      ) : (
        <>
          <p className="max-w-2xl text-cerneala-moale">
            Contul tău:{" "}
            <strong>{cine?.fel === "cont" ? cine.utilizator.email : ""}</strong>
            {cine ? ` · ${NUMELE_ROLULUI[cine.rol]}` : ""}
          </p>

          <form
            method="post"
            action="/api/admin/parola"
            className="mt-5 grid max-w-sm gap-3 colt-a border border-hartie-umbra bg-hartie p-5"
          >
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Parola de acum
              </span>
              <input
                name="veche"
                type="password"
                required
                autoComplete="current-password"
                className={CLASA_CAMP}
              />
            </label>
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Parola nouă
              </span>
              <input
                name="noua"
                type="password"
                minLength={MINIM_PAROLA}
                required
                autoComplete="new-password"
                className={CLASA_CAMP}
              />
            </label>
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Parola nouă, încă o dată
              </span>
              <input
                name="iar"
                type="password"
                minLength={MINIM_PAROLA}
                required
                autoComplete="new-password"
                className={CLASA_CAMP}
              />
              <span className="text-nota text-cerneala-slab">
                Cel puțin {MINIM_PAROLA} semne.
              </span>
            </label>
            <div>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
              >
                Schimbă parola
              </button>
            </div>
          </form>
        </>
      )}
    </Cadru>
  );
}
