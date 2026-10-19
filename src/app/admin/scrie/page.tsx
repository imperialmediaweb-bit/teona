import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { FELURI, esteFel, felul, toateTextele } from "@/lib/texte";
import { adresaPoza } from "@/lib/poza-urcata";
import { proiecteAfisate } from "@/date/proiecte";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Scrie pe site",
  robots: { index: false, follow: false },
};

/**
 * Lista a ce s-a scris: noutăți și campanii, ciorne și publicate.
 *
 * Caietul cere de peste șapte ori ca asociația să-și poată schimba singură
 * textele. Până aici, orice noutate însemna o modificare de cod — adică treci
 * prin dezvoltator ca să anunți o strângere de fonduri.
 *
 * Ciornele stau sus, nu jos: un text neterminat e singurul lucru din listă
 * care cere ceva de la tine.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function PaginaScrie({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string; gata?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Scrie pe site">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string; gata?: string; gresit?: string }>;
}) {
  await connection();
  const { fel: felCerut, gata, gresit } = await searchParams;
  const fel = esteFel(felCerut) ? felCerut : "noutate";

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Scrie pe site" activ="/admin/scrie">
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
      <Cadru titlu="Intră în panou" activ="/admin/scrie" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/scrie" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/scrie"))) {
    return <FaraDrept titlu="Scrie pe site" activ="/admin/scrie" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Scrie pe site" activ="/admin/scrie">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Textele se țin în baza de date, nu în cod.
        </p>
      </Cadru>
    );
  }

  const texte = await toateTextele(fel);
  const ciorne = texte.filter((t) => !t.publicat);
  const publicate = texte.filter((t) => t.publicat);

  /*
    Taberele scrise în cod, cărora nimeni nu le-a scris încă descrierea.

    Până acum, descrierea unei tabere se schimba numai prin mine: textele
    stau în `proiecte-scrise.ts`. Dar `proiecteleToate()` lasă de mult un
    text din panou să bată versiunea din cod, pe slug — capacitatea era
    acolo, îi lipsea butonul. Omul ar fi trebuit să ghicească singur că
    scriind o „tabără nouă" cu exact același titlu rescrie una veche.

    Lista de jos face legătura: fiecare tabără fără text propriu primește un
    buton care deschide editorul cu titlul scris și cu slugul ei în mână.
    Ce apare în listă e doar ce n-a fost încă rescris — o tabără căreia i s-a
    scris descrierea iese de aici și apare mai sus, între ciorne sau
    publicate.
  */
  const aleLor = new Set(texte.map((t) => t.slug));
  const faraText =
    fel === "proiect"
      ? proiecteAfisate()
          .filter((p) => !aleLor.has(p.slug))
          .filter((p) => !p.descriere?.length)
      : [];
  const acesta = felul(fel);

  return (
    <Cadru
      titlu="Scrie pe site"
      descriere="Noutăți și campanii, scrise de aici. Nimic nu se vede public până nu apeși „Publică”."
      activ="/admin/scrie"
      actiuni={
        <Link
          href={`/admin/scrie/nou?fel=${fel}`}
          className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800"
        >
          {acesta.butonNou}
        </Link>
      }
    >
      {gata && (
        <p
          role="status"
          className="mb-7 colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-turcoaz-900"
        >
          {gata === "publicat" && "Publicat. E pe site."}
          {gata === "salvat" && "Salvat ca ciornă. Nu se vede pe site."}
          {gata === "sters" && "Șters."}
        </p>
      )}

      {/* Felurile, ca două file. */}
      <div className="flex flex-wrap gap-2">
        {FELURI.map((f) => (
          <Link
            key={f.id}
            href={`/admin/scrie?fel=${f.id}`}
            aria-current={f.id === fel ? "page" : undefined}
            className={`colt-mic-a px-4 py-2 font-titlu text-mic font-semibold transition-colors ${
              f.id === fel
                ? "bg-cerneala text-hartie"
                : "border border-hartie-umbra bg-hartie text-cerneala hover:border-caramiziu-400"
            }`}
          >
            {f.plural}
          </Link>
        ))}
      </div>

      {texte.length === 0 ? (
        <div className="mt-8 max-w-2xl colt-a border border-hartie-umbra bg-hartie p-7">
          <p className="text-amplu text-cerneala-moale">
            Nu e scris nimic încă. {acesta.plural} apar pe{" "}
            <code className="rounded bg-hartie-umbra px-1.5">
              {acesta.cale}
            </code>{" "}
            în ordinea publicării.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-10">
          {ciorne.length > 0 && (
            <Sectiune titlu="Ciorne" texte={ciorne} cale={acesta.cale} />
          )}
          {publicate.length > 0 && (
            <Sectiune titlu="Publicate" texte={publicate} cale={acesta.cale} />
          )}
        </div>
      )}

      {faraText.length > 0 && (
        <section className="mt-12">
          <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
            Fără descriere · {faraText.length}
          </h2>
          <p className="mt-2 max-w-2xl text-mic text-cerneala-moale">
            Taberele astea sunt pe site cu titlul și fotografiile lor, dar fără
            text. Apasă pe una și scrie-i descrierea — pagina ei de pe site se
            schimbă, nu se face alta nouă.
          </p>
          <ul className="mt-4 grid gap-2">
            {faraText.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/admin/scrie/nou?fel=proiect&slug=${encodeURIComponent(
                    p.slug,
                  )}&titlu=${encodeURIComponent(p.titlu)}`}
                  className="flex flex-wrap items-center justify-between gap-3 colt-a border border-hartie-umbra bg-hartie px-4 py-3 transition-colors hover:border-caramiziu-400"
                >
                  <span className="min-w-0">
                    <span className="font-titlu font-bold text-cerneala">
                      {p.titlu}
                    </span>
                    {p.dataCitita && (
                      <span className="ml-2 text-mic text-cerneala-slab">
                        {p.dataCitita}
                      </span>
                    )}
                  </span>
                  <span className="font-titlu text-mic font-semibold text-caramiziu-700">
                    Scrie descrierea →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Cadru>
  );
}

function Sectiune({
  titlu,
  texte,
  cale,
}: {
  titlu: string;
  texte: Awaited<ReturnType<typeof toateTextele>>;
  cale: string;
}) {
  return (
    <section>
      <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
        {titlu} · {texte.length}
      </h2>
      <ul className="mt-4 grid gap-3">
        {texte.map((text) => (
          <li key={text.id}>
            <div className="flex flex-wrap items-center gap-4 colt-a border border-hartie-umbra bg-hartie p-3 pr-5">
              {text.poza ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={adresaPoza(text.poza.id, 160)}
                  alt=""
                  className="size-16 shrink-0 colt-mic-a object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-16 shrink-0 colt-mic-a bg-hartie-umbra"
                />
              )}

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/scrie/${text.id}`}
                  className="font-titlu font-bold text-cerneala hover:text-caramiziu-700"
                >
                  {text.titlu}
                </Link>
                <p className="mt-0.5 truncate text-mic text-cerneala-moale">
                  {text.rezumat || "fără rezumat"}
                </p>
              </div>

              <p className="text-nota text-cerneala-slab">
                {text.publicat && text.publicatLa
                  ? `publicat ${CAND.format(new Date(text.publicatLa))}`
                  : `schimbat ${CAND.format(new Date(text.schimbatLa))}`}
              </p>

              {text.publicat && (
                <Link
                  href={`${cale}/${text.slug}`}
                  className="font-titlu text-mic font-semibold text-caramiziu-700 hover:underline"
                >
                  Vezi pe site
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
