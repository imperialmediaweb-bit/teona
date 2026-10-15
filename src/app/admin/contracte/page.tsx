import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { contracte } from "@/lib/contracte";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";

export const metadata: Metadata = {
  title: "Contracte semnate",
  robots: { index: false, follow: false },
};

type Cautare = { gata?: string; eroare?: string; gresit?: string };

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Contractele pe care firmele le-au semnat singure, pe site.
 *
 * Fiecare rând cere o faptă: cineva deschide PDF-ul, îl contrasemnează (pe
 * hârtie sau cu certificatul asociației) și îl trimite înapoi firmei. Butonul
 * de aici nu semnează nimic — spune doar că s-a făcut, ca lista să rămână o
 * listă de lucruri de făcut.
 */
export default function PaginaContracte({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Contracte semnate">Se încarcă…</Cadru>}>
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
  const { gata, eroare, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Contracte semnate" activ="/admin/contracte">
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
      <Cadru titlu="Contracte semnate" activ="/admin/contracte">
        <Intrare gresit={Boolean(gresit)} unde="/admin/contracte" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Contracte semnate" activ="/admin/contracte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const lista = await contracte(100);
  const deSemnat = lista.filter((c) => c.stare === "semnat_de_sponsor");

  return (
    <Cadru
      titlu="Contracte semnate"
      descriere={
        deSemnat.length === 0
          ? "Niciun contract nu așteaptă contrasemnătura."
          : deSemnat.length === 1
            ? "Un contract așteaptă contrasemnătura asociației."
            : `${deSemnat.length} contracte așteaptă contrasemnătura asociației.`
      }
      activ="/admin/contracte"
    >
      {gata && (
        <p
          role="status"
          className="mb-6 rounded-card border border-turcoaz-200 bg-turcoaz-50 p-4 text-mic text-turcoaz-900"
        >
          {gata === "contrasemnat"
            ? "Contractul e trecut ca semnat de amândoi."
            : "Contractul e trecut ca anulat."}
        </p>
      )}
      {eroare && (
        <p
          role="alert"
          className="mb-6 rounded-card border border-caramiziu-200 bg-caramiziu-50 p-4 text-mic text-caramiziu-900"
        >
          {eroare}
        </p>
      )}

      {lista.length === 0 ? (
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Nicio firmă n-a semnat încă un contract pe site. Când o face, apare
          aici, cu PDF-ul ei.
        </p>
      ) : (
        <ul className="grid gap-5">
          {lista.map((c) => (
            <li
              key={c.id}
              className={`rounded-card border p-5 ${
                c.stare === "semnat_de_sponsor"
                  ? "border-caramiziu-200 bg-caramiziu-50"
                  : "border-hartie-umbra bg-hartie"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-titlu text-amplu font-bold text-cerneala">
                  {c.denumire}
                </h2>
                <span className="font-titlu font-bold text-cerneala">
                  {c.valoare} lei
                </span>
              </div>

              <p className="mt-1 text-mic text-cerneala-moale">
                CUI {c.cui} · semnat de {c.reprezentant} ·{" "}
                {CAND.format(new Date(c.creatLa))}
              </p>
              <p className="mt-1 text-mic break-all text-cerneala-moale">
                {c.email}
                {c.telefon && <> · {c.telefon}</>}
              </p>
              <p className="mt-1 text-nota break-all text-cerneala-slab">
                Amprentă {c.amprenta.slice(0, 24)}…
                {c.ip && <> · de la {c.ip}</>}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hartie-umbra pt-4">
                <a
                  href={`/admin/contracte/${c.id}/pdf`}
                  className="rounded-full bg-cerneala px-5 py-2.5 font-titlu text-mic font-bold text-hartie"
                >
                  Descarcă PDF-ul
                </a>

                {c.stare === "semnat_de_sponsor" ? (
                  <>
                    <form action="/api/admin/contracte" method="post">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        type="hidden"
                        name="hotarare"
                        value="contrasemnat"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-turcoaz-600 px-5 py-2.5 font-titlu text-mic font-bold text-hartie"
                      >
                        L-am contrasemnat
                      </button>
                    </form>
                    <form action="/api/admin/contracte" method="post">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="hotarare" value="anulat" />
                      <button
                        type="submit"
                        className="rounded-full border border-hartie-umbra px-5 py-2.5 font-titlu text-mic font-bold text-cerneala"
                      >
                        Anulează
                      </button>
                    </form>
                  </>
                ) : (
                  <span className="font-titlu text-mic font-semibold text-cerneala-moale">
                    {c.stare === "contrasemnat"
                      ? "Semnat de amândoi"
                      : "Anulat"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Cadru>
  );
}
