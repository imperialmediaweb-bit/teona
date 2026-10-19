import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import {
  areCheiCloudinary,
  dosare,
  miniatura,
  pozeDinDosar,
  type PozaCloud,
} from "@/lib/cloudinary-listare";
import { proiecteAfisate } from "@/date/proiecte";
import { alegeDosar } from "@/date/proiecte-cloud";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import DeCopiat from "@/componente/pagina/DeCopiat";

export const metadata: Metadata = {
  title: "Poze",
  robots: { index: false, follow: false },
};

/**
 * Pozele din Cloudinary, văzute din panou.
 *
 * **Problema pe care o rezolvă.** Asociația urcă pozele în Cloudinary — tabere,
 * Casa Teona, campanii. Ca să ajungă una pe site, cineva trebuia să-mi trimită
 * numele fișierului, iar eu îl scriam în cod. Fiecare poză nouă trecea prin
 * dezvoltator, exact lucrul pe care caietul cere de șapte ori să nu se mai
 * întâmple.
 *
 * Pagina asta arată ce e în cont, pe foldere, cu cea mai nouă prima, și dă
 * identificatorul fiecărei poze gata de copiat. E primul pas: să se vadă.
 * Legarea unei poze de un proiect, direct de aici, vine după — are nevoie de
 * un loc în baza de date unde să țină minte alegerea.
 *
 * **Cheile nu trec niciodată prin browser.** Listarea se face pe server, cu
 * cheia de administrare din Railway. Fișierul care o folosește e marcat
 * `server-only`: dacă cineva îl importă vreodată dintr-o componentă de
 * browser, build-ul cade în loc să trimită cheia la vizitatori.
 */

const MARIME = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });
const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function kb(octeti: number) {
  return octeti > 1_000_000
    ? `${MARIME.format(octeti / 1_000_000)} MB`
    : `${Math.round(octeti / 1000)} KB`;
}

export default function PaginaPoze({
  searchParams,
}: {
  searchParams: Promise<{ dosar?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Poze">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ dosar?: string; gresit?: string }>;
}) {
  await connection();
  const { dosar, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Poze" activ="/admin/poze">
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
      <Cadru titlu="Intră în panou" activ="/admin/poze">
        <Intrare gresit={Boolean(gresit)} unde="/admin/poze" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/poze"))) {
    return <FaraDrept titlu="Poze" activ="/admin/poze" />;
  }

  if (!areCheiCloudinary()) {
    return (
      <Cadru
        titlu="Poze"
        descriere="Pozele din contul Cloudinary al asociației."
        activ="/admin/poze"
      >
        <div className="max-w-2xl colt-a border border-hartie-umbra bg-hartie p-6">
          <p className="text-amplu text-cerneala-moale">
            Pagina are nevoie de cheile Cloudinary ca să poată citi folderele.
            În Railway, la serviciul site, trebuie să existe toate trei:
          </p>
          <ul className="mt-4 grid gap-1.5 text-mic text-cerneala-moale">
            <li>
              <code className="rounded bg-hartie-umbra px-1.5">
                CLOUDINARY_CLOUD_NAME
              </code>
            </li>
            <li>
              <code className="rounded bg-hartie-umbra px-1.5">
                CLOUDINARY_API_KEY
              </code>
            </li>
            <li>
              <code className="rounded bg-hartie-umbra px-1.5">
                CLOUDINARY_API_SECRET
              </code>
            </li>
          </ul>
          <p className="mt-4 text-mic text-cerneala-moale">
            Se iau din Cloudinary, din tabloul de bord, de la „API Keys”. Nu se
            scriu niciodată în cod și nu se trimit pe chat.
          </p>
        </div>
      </Cadru>
    );
  }

  const cale = dosar?.replace(/^\/+|\/+$/g, "") || "";
  const [subdosare, poze] = await Promise.all([
    dosare(cale || undefined),
    cale ? pozeDinDosar(cale) : Promise.resolve<PozaCloud[]>([]),
  ]);

  /** Firimiturile de navigare: Teona / 2026 / tabara-respiro. */
  const bucati = cale ? cale.split("/") : [];

  /*
    Ce folder a ajuns la ce proiect.

    Legătura dintre un folder de poze și o pagină de proiect se face pe dată:
    în numele folderului sunt scrise zilele și luna taberei, aceleași care sunt
    scrise și în proiect. Aici se vede rezultatul negru pe alb, ca să nu
    trebuiască nimeni să ghicească dacă pozele au ajuns unde trebuie. Un folder
    care nu se potrivește cu nimic e marcat ca atare: ori proiectul lipsește
    de pe site, ori data din numele folderului nu e scrisă la fel.
  */
  const numeleDosarelor = subdosare.map((d) => d.nume);
  const legatura = new Map<string, { titlu: string; slug: string }>();
  for (const proiect of proiecteAfisate()) {
    const dosar = alegeDosar(numeleDosarelor, proiect.dataCitita ?? "");
    if (dosar && !legatura.has(dosar)) {
      legatura.set(dosar, { titlu: proiect.titlu, slug: proiect.slug });
    }
  }

  return (
    <Cadru
      titlu="Poze"
      descriere="Ce e în contul Cloudinary al asociației. Cele mai noi, primele."
      activ="/admin/poze"
    >
      <nav
        aria-label="Unde ești"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-mic text-cerneala-moale"
      >
        <Link
          href="/admin/poze"
          className="font-semibold text-caramiziu-700 hover:underline"
        >
          Toate folderele
        </Link>
        {bucati.map((bucata, i) => {
          const pana = bucati.slice(0, i + 1).join("/");
          const ultim = i === bucati.length - 1;
          return (
            <span key={pana} className="flex items-center gap-2">
              <span aria-hidden="true">›</span>
              {ultim ? (
                <span className="font-semibold text-cerneala">{bucata}</span>
              ) : (
                <Link
                  href={`/admin/poze?dosar=${encodeURIComponent(pana)}`}
                  className="font-semibold text-caramiziu-700 hover:underline"
                >
                  {bucata}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {subdosare.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {subdosare.map((d) => {
            const proiect = legatura.get(d.nume);
            return (
              <li key={d.cale}>
                <Link
                  href={`/admin/poze?dosar=${encodeURIComponent(d.cale)}`}
                  className="block h-full colt-mic-a border border-hartie-umbra bg-hartie px-4 py-3 transition-colors hover:border-caramiziu-400"
                >
                  <span className="block font-titlu text-mic font-semibold text-cerneala">
                    {d.nume}
                  </span>
                  {proiect ? (
                    <span className="mt-1 block text-nota text-turcoaz-700">
                      pozele apar la „{proiect.titlu}”
                    </span>
                  ) : (
                    <span className="mt-1 block text-nota text-cerneala-slab">
                      nelegat de niciun proiect
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {cale && poze.length === 0 && (
        <p className="mt-8 text-amplu text-cerneala-moale">
          Folderul n-are poze direct în el. Dacă are subfoldere, sunt mai sus.
        </p>
      )}

      {poze.length > 0 && (
        <>
          <p className="mt-8 text-mic text-cerneala-moale">
            {poze.length} {poze.length === 1 ? "fotografie" : "fotografii"}.
            Identificatorul de sub fiecare e ce îmi trimiți ca s-o pun pe site.
          </p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {poze.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden colt-a border border-hartie-umbra bg-hartie"
              >
                {/*
                  `img`, nu `next/image`: adresele vin de la Cloudinary, se
                  schimbă de la o zi la alta și nu se știu la build. Sunt
                  miniaturi de 400 px într-un panou pe care îl văd două
                  persoane — optimizarea Next n-ar aduce nimic aici.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={miniatura(p.id)}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full bg-cerneala/5 object-cover"
                />
                <div className="p-3">
                  <DeCopiat
                    eticheta="Identificator"
                    valoare={p.id}
                    deCopiat={p.id}
                  />
                  <p className="mt-2 text-nota text-cerneala-slab">
                    {p.latime}×{p.inaltime} · {p.format.toUpperCase()} ·{" "}
                    {kb(p.octeti)} · {CAND.format(new Date(p.urcata))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {!cale && subdosare.length === 0 && (
        <p className="mt-8 text-amplu text-cerneala-moale">
          Contul n-are foldere. Pozele urcate fără folder nu apar aici — pune-le
          într-un folder în Cloudinary, ca să se poată găsi.
        </p>
      )}
    </Cadru>
  );
}
