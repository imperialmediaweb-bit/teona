import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areR2 } from "@/lib/r2";
import { DOCUMENTE } from "@/lib/documente";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Documentele de descărcat, înlocuite de asociație.
 *
 * Caietul o cere în două locuri: la 2.4, pentru contractul de sponsorizare și
 * Declarația 177 („Asociația poate înlocui singură cele două fișiere când se
 * actualizează modelele"), și la 7.5, pentru cele trei documente de la pagina
 * de 3,5%.
 *
 * **Lista e fixă.** Fiecare rând de aici e legat de un buton anume, de pe o
 * pagină anume. Un document urcat fără un buton care să ducă la el ar sta în
 * depozit nevăzut, iar cine l-a urcat ar crede că l-a publicat.
 */

const STARI: Record<string, { text: string; bun: boolean }> = {
  urcat: { text: "Urcat. Butonul de pe site duce la fișierul nou.", bun: true },
  fisier: { text: "Alege un fișier PDF.", bun: false },
  mare: { text: "Fișierul e prea mare (peste 10 MB).", bun: false },
  pdf: { text: "Fișierul nu e un PDF.", bun: false },
  depozit: {
    text: "Depozitul de fișiere nu e pornit. Cere-i dezvoltatorului.",
    bun: false,
  },
  necunoscut: { text: "N-a mers. Încearcă din nou.", bun: false },
};

export default function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Documente">Se încarcă…</Cadru>}>
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
      <Cadru titlu="Documente" activ="/admin/documente">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat încă. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/documente" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/documente" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/documente"))) {
    return <FaraDrept titlu="Documente" activ="/admin/documente" />;
  }

  const mesaj = stare ? STARI[stare] : undefined;
  const depozit = areR2();

  return (
    <Cadru
      titlu="Documente"
      descriere="Fișierele pe care le descarcă oamenii și firmele de pe site."
      activ="/admin/documente"
    >
      {mesaj && (
        <p
          role="alert"
          className={`mb-6 colt-mic-a px-4 py-3 text-mic font-semibold ${
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
          Cum se înlocuiește un model
        </p>
        <ul className="mt-2 grid gap-1 text-mic text-cerneala-moale">
          <li>
            Alegi fișierul PDF și apeși „Urcă”. Butonul de pe site duce de
            atunci la el, pe <strong>aceeași adresă</strong> — deci un link pus
            într-un e-mail acum trei luni duce la modelul de acum.
          </li>
          <li>
            Numai PDF, cel mult 10 MB. Fișierul vechi e înlocuit, nu păstrat:
            două modele de contract în circulație înseamnă două contracte
            diferite semnate.
          </li>
          <li>
            Verifică documentul înainte: nu-l citește nimeni după tine, și
            pleacă direct la firme.
          </li>
        </ul>
      </div>

      {!depozit && (
        <p className="mb-8 max-w-3xl colt-mic-a border border-caramiziu-200 bg-caramiziu-50 px-5 py-4 text-mic text-caramiziu-900">
          Depozitul de fișiere nu e pornit, deci nu se poate urca nimic acum.
          Documentele care au deja un fișier pe site se descarcă în continuare.
        </p>
      )}

      <ul className="grid max-w-3xl gap-5">
        {DOCUMENTE.map((d) => (
          <li
            key={d.slug}
            className="grid gap-4 colt-a border border-hartie-umbra bg-hartie p-5"
          >
            <div>
              <h2 className="font-titlu text-amplu font-bold text-cerneala">
                {d.titlu}
              </h2>
              <p className="mt-1 text-mic text-cerneala-moale">{d.descriere}</p>
              <p className="mt-2 text-nota text-cerneala-slab">
                Butonul e pe{" "}
                <Link
                  href={d.unde}
                  className="font-semibold text-caramiziu-700 hover:underline"
                >
                  {d.unde}
                </Link>{" "}
                · adresa fișierului:{" "}
                <Link
                  href={`/documente/${d.slug}`}
                  className="font-semibold text-caramiziu-700 hover:underline"
                >
                  /documente/{d.slug}
                </Link>
              </p>
            </div>

            <form
              method="post"
              action="/api/admin/documente"
              encType="multipart/form-data"
              className="flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="slug" value={d.slug} />
              <input
                type="file"
                name="fisier"
                accept="application/pdf,.pdf"
                required
                disabled={!depozit}
                className="colt-mic-a border-2 border-hartie-umbra bg-hartie px-3 py-2 text-mic file:mr-3 file:border-0 file:bg-transparent file:font-titlu file:font-bold file:text-caramiziu-700 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!depozit}
                className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800 disabled:opacity-50"
              >
                Urcă
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Cadru>
  );
}
