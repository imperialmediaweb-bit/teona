import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  areRadar,
  piste,
  scanari,
  zileDeLaUltimaScanare,
  type Pista,
} from "@/lib/radar";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Radar de finanțări",
  robots: { index: false, follow: false },
};

/**
 * Pistele găsite de radar pe internet, săptămână de săptămână.
 *
 * **Fiecare rând e o pistă, nu o certitudine**, și pagina o scrie pe ea. Un
 * model care citește pagini greșește: confundă un termen cu altul, ia anul
 * trecut pentru anul ăsta. De aceea termenul se arată cum a fost citit, cu
 * linkul lângă, iar nimic de aici nu intră în calendar până nu deschide un om
 * pagina sursă. Un termen greșit e mai rău decât unul lipsă: după el se face
 * muncă.
 *
 * **Pagina spune și dacă radarul e viu.** Un radar care a murit în tăcere e
 * mai rău decât niciunul: liniștea arată la fel ca „n-a apărut nimic nou".
 * De aceea ultimele scanări se văd aici, cu erorile lor, și scrie răspicat
 * când ultima e veche.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const CAND_LUNG = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** După câte zile o scanare e veche. O săptămână plus trei zile de răgaz. */
const PREA_VECHI_ZILE = 10;

function mesajul(stare: string | undefined): { text: string; bun?: boolean } | null {
  if (!stare) return null;
  const [fel, ...restul] = stare.split(":");
  if (fel === "gata") {
    const [gasite, noi, aruncate] = restul;
    const aruncat =
      Number(aruncate) > 0
        ? ` ${aruncate} au fost aruncate: adresa lor nu apărea în niciun rezultat de căutare.`
        : "";
    return {
      text: `Scanare gata. ${gasite} piste, din care ${noi} noi.${aruncat}`,
      bun: true,
    };
  }
  if (fel === "eroare") return { text: `Scanarea n-a mers: ${restul.join(":")}` };
  if (fel === "urmarit") return { text: "Pista a trecut la urmărite.", bun: true };
  if (fel === "respins") return { text: "Pista a fost respinsă.", bun: true };
  return { text: "N-am putut face schimbarea." };
}

export default function PaginaRadar({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Radar de finanțări">Se încarcă…</Cadru>}>
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
      <Cadru titlu="Radar de finanțări" activ="/admin/radar">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/radar" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/radar" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/radar"))) {
    return <FaraDrept titlu="Radar de finanțări" activ="/admin/radar" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Radar de finanțări" activ="/admin/radar">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Pistele stau în baza de date.
        </p>
      </Cadru>
    );
  }

  const [noi, urmarite, ultimele, zile] = await Promise.all([
    piste("nou").catch(() => [] as Pista[]),
    piste("urmarit").catch(() => [] as Pista[]),
    scanari(5).catch(() => []),
    zileDeLaUltimaScanare().catch(() => null),
  ]);

  const mesaj = mesajul(stare);
  const veche = zile !== null && zile > PREA_VECHI_ZILE;

  return (
    <Cadru
      titlu="Radar de finanțări"
      descriere="Ce a găsit căutarea automată pe internet. Piste de verificat, nu certitudini."
      activ="/admin/radar"
      actiuni={
        areRadar() ? (
          <form method="post" action="/api/admin/radar">
            <input type="hidden" name="fel" value="scanează" />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full bg-caramiziu-700 px-5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-600"
            >
              Scanează acum
            </button>
          </form>
        ) : null
      }
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

      {!areRadar() && (
        <p className="mb-6 max-w-3xl colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic text-caramiziu-900">
          Radarul n-are cheie de model. Pune{" "}
          <code className="rounded bg-hartie px-1.5">ANTHROPIC_API_KEY</code> în
          Railway și poate căuta.
        </p>
      )}

      {veche && (
        <p className="mb-6 max-w-3xl colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
          Ultima scanare a fost acum {zile} de zile. Dacă ar trebui să ruleze
          săptămânal, orarul nu mai merge — vezi mai jos cum se pune.
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Piste noi
          </h2>
          <p className="text-nota text-cerneala-slab">
            {noi.length === 0
              ? "Nimic nou. Nu e o veste rea — majoritatea săptămânilor n-au niciun apel nou potrivit."
              : `${noi.length} de citit.`}
          </p>
        </div>
        {noi.length > 0 && (
          <ul className="grid gap-3">
            {noi.map((p) => (
              <Rand key={p.id} p={p} nou />
            ))}
          </ul>
        )}
      </section>

      {urmarite.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 border-b border-hartie-umbra pb-2">
            <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
              Urmărite
            </h2>
          </div>
          <ul className="grid gap-3">
            {urmarite.map((p) => (
              <Rand key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Ultimele scanări
          </h2>
          <p className="mt-1 text-nota text-cerneala-slab">
            Un radar care a murit în tăcere e mai rău decât niciunul: liniștea
            arată la fel ca „n-a apărut nimic nou”.
          </p>
        </div>
        {ultimele.length === 0 ? (
          <p className="text-mic text-cerneala-moale">
            N-a rulat încă nicio scanare.
          </p>
        ) : (
          <ul className="grid gap-1.5 text-mic">
            {ultimele.map((s, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 text-cerneala-moale">
                <span className="font-titlu">{CAND_LUNG.format(s.cand)}</span>
                <span>
                  {s.gasite} piste, {s.noi} noi
                </span>
                {s.eroare && (
                  <span className="font-semibold text-caramiziu-700">
                    {s.eroare}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Orarul />
    </Cadru>
  );
}

function Rand({ p, nou }: { p: Pista; nou?: boolean }) {
  return (
    <li className="colt-a border border-hartie-umbra bg-hartie p-4 sm:p-5">
      <a
        href={p.url}
        target="_blank"
        rel="noreferrer noopener"
        className="font-titlu text-amplu font-bold text-cerneala underline decoration-caramiziu-300 decoration-2 underline-offset-2 hover:decoration-caramiziu-600"
      >
        {p.titlu}
      </a>

      <p className="mt-1 text-nota text-cerneala-slab">
        {[
          p.finantator,
          p.termen ? `termen: ${p.termen}` : "termenul nu scrie pe pagină",
          p.suma,
          `găsit ${CAND.format(p.gasitLa)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <p className="mt-2 max-w-3xl text-mic text-cerneala-moale">{p.rezumat}</p>

      {/*
        Termenul se verifică la sursă, nu se crede pe cuvânt.

        Rândul ăsta nu e o formalitate: cifrele și datele de mai sus au fost
        citite de un model de pe o pagină, iar un model care citește pagini
        confundă uneori anul sau termenul unei alte linii de finanțare din
        aceeași pagină.
      */}
      {nou && (
        <div className="mt-4 flex flex-wrap gap-2">
          <form method="post" action="/api/admin/radar">
            <input type="hidden" name="fel" value="urmarit" />
            <input type="hidden" name="id" value={p.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full border border-hartie-umbra px-4 font-titlu text-mic font-bold text-cerneala transition-colors hover:bg-hartie-umbra"
            >
              Merită urmărit
            </button>
          </form>
          <form method="post" action="/api/admin/radar">
            <input type="hidden" name="fel" value="respins" />
            <input type="hidden" name="id" value={p.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full border border-hartie-umbra px-4 font-titlu text-mic font-bold text-cerneala-slab transition-colors hover:bg-hartie-umbra"
            >
              Nu ne privește
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

/**
 * Cum se pune orarul săptămânal. Scris pe pagină, ca pașii de la Facebook.
 *
 * Nu într-un fișier README pe care nu-l deschide nimeni: omul care se întreabă
 * „de ce n-a mai scanat nimic?" e pe pagina asta, nu în depozitul de cod.
 */
function Orarul() {
  const are = Boolean(process.env.RADAR_SECRET);
  return (
    <section className="mt-10">
      <div className="mb-4 border-b border-hartie-umbra pb-2">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
          Cum rulează săptămânal
        </h2>
      </div>
      <div className="max-w-3xl colt-a border border-hartie-umbra bg-hartie p-5 text-mic text-cerneala-moale">
        <p>
          Butonul „Scanează acum” e pentru când vrei să vezi pe loc ce e nou.
          Pentru săptămânal e nevoie de un ceas din afara aplicației: un server
          web nu se încheie niciodată, deci nu i se poate pune un orar, iar un
          cronometru pus în cod ar porni de două ori dacă rulează două copii ale
          site-ului și n-ar porni deloc cât timp containerul doarme.
        </p>
        <ol className="mt-3 grid list-decimal gap-2 pl-5">
          <li>
            În Railway, pune{" "}
            <code className="rounded bg-hartie-umbra px-1.5">RADAR_SECRET</code>{" "}
            — un șir lung, inventat.{" "}
            {are ? (
              <strong className="text-cerneala">E pus.</strong>
            ) : (
              <strong className="text-caramiziu-700">Încă nu e pus.</strong>
            )}
          </li>
          <li>
            Fă un al doilea serviciu, mic, care rulează o singură comandă și
            iese:
            <code className="mt-1 block overflow-x-auto rounded bg-hartie-umbra px-2 py-1.5">
              curl -fsS -X POST https://&lt;site&gt;/api/radar -H
              &quot;x-radar: $RADAR_SECRET&quot;
            </code>
          </li>
          <li>
            Pune-i orarul{" "}
            <code className="rounded bg-hartie-umbra px-1.5">0 6 * * 1</code> —
            luni la 6:00. <strong className="text-cerneala">În UTC</strong>,
            nu ora României: cron-ul de pe Railway e în UTC, deci vara asta
            înseamnă 9:00 la noi, iarna 8:00.
          </li>
        </ol>
        <p className="mt-3">
          Dacă o scanare mai e în curs când vine ora următoare, Railway o sare —
          nu le pune una peste alta. Iar dacă scanarea dă eroare, adresa
          răspunde cu cod de eroare, deci se vede în jurnalul serviciului, nu
          numai aici.
        </p>
      </div>
    </section>
  );
}
