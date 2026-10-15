import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areR2 } from "@/lib/r2";
import {
  STADII_230,
  formulare230,
  legaturaFormular,
} from "@/lib/formulare230";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";

export const metadata: Metadata = {
  title: "Formulare 230",
  robots: { index: false, follow: false },
};

/**
 * Formularele 230 primite de pe site, și fișierul gol de descărcat.
 *
 * **Fotografia nu ține loc de hârtie.** Scrie pe pagină, nu în comentarii:
 * originalul semnat tot trebuie să ajungă la asociație, iar ANAF îl poate
 * cere. Lista asta e pentru timp — cine a trimis, pe cine mai trebuie sunat
 * după plic — nu pentru dosar.
 *
 * **Fișierele nu au adresă permanentă.** Fiecare „Vezi formularul" cere o
 * legătură semnată, valabilă zece minute. Pe un 230 scrie CNP-ul omului; o
 * adresă care merge la nesfârșit ar fi ajuns într-un istoric de browser, pe
 * un WhatsApp, într-un e-mail.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const camp =
  "colt-mic-a border border-hartie-umbra bg-hartie px-3 py-2 text-mic text-cerneala";

export default function PaginaFormulare({
  searchParams,
}: {
  searchParams: Promise<{ gata?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Formulare 230">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gata?: string; gresit?: string }>;
}) {
  await connection();
  const { gata, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Formulare 230" activ="/admin/formulare">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Formulare 230" activ="/admin/formulare">
        <Intrare gresit={Boolean(gresit)} unde="/admin/formulare" />
      </Cadru>
    );
  }

  const formulare = areBazaDeDate() ? await formulare230() : [];
  const deVerificat = formulare.filter((f) => f.stare === "primit").length;

  return (
    <Cadru
      titlu="Formulare 230"
      descriere="Ce au trimis oamenii de pe site, și fișierul pe care îl descarcă."
      activ="/admin/formulare"
    >
      {gata && (
        <p
          role="status"
          className="mb-7 colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-turcoaz-900"
        >
          {gata === "urcat" && "Fișierul e sus. Se descarcă de la /formular-230."}
          {gata === "mutat" && "Mutat."}
          {gata === "sters" && "Șters, cu fișier cu tot."}
          {gata === "nesters" &&
            "N-am putut șterge fișierul din depozit, deci n-am șters nici rândul. Mai încearcă."}
        </p>
      )}

      {/* Fișierul gol, pe care îl descarcă oamenii. */}
      <section className="max-w-3xl colt-a border border-hartie-umbra bg-hartie p-6">
        <h2 className="font-titlu text-h4 text-cerneala">
          Fișierul de descărcat
        </h2>
        <p className="mt-2 text-mic text-cerneala-moale">
          PDF-ul Formularului 230, cu datele asociației deja completate. Se
          descarcă de la{" "}
          <code className="rounded bg-hartie-umbra px-1.5">
            teona-ariana.ro/formular-230
          </code>{" "}
          — adresa rămâne aceeași când înlocuiești fișierul, deci o poți pune
          într-o postare fără grijă.
        </p>

        {areR2() ? (
          <form
            action="/api/admin/formulare"
            method="post"
            encType="multipart/form-data"
            className="mt-5 flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="actiune" value="urca-gol" />
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Alege PDF-ul
              </span>
              <input
                type="file"
                name="fisier"
                accept="application/pdf"
                required
                className="text-mic"
              />
            </label>
            <button
              type="submit"
              className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800"
            >
              Urcă fișierul
            </button>
            <a
              href="/formular-230"
              target="_blank"
              rel="noreferrer"
              className="font-titlu text-mic font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Vezi ce e acum acolo
            </a>
          </form>
        ) : (
          <p className="mt-4 colt-mic-a bg-hartie-calda px-4 py-3 text-mic text-cerneala-moale">
            Depozitul de fișiere nu e configurat. În Railway trebuie puse{" "}
            <code className="rounded bg-hartie-umbra px-1">R2_ACCOUNT_ID</code>,{" "}
            <code className="rounded bg-hartie-umbra px-1">R2_ACCESS_KEY_ID</code>,{" "}
            <code className="rounded bg-hartie-umbra px-1">
              R2_SECRET_ACCESS_KEY
            </code>{" "}
            și <code className="rounded bg-hartie-umbra px-1">R2_BUCKET</code>.
          </p>
        )}
      </section>

      {/* Ce au trimis oamenii. */}
      <section className="mt-10">
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
          Primite · {formulare.length}
          {deVerificat > 0 && ` · ${deVerificat} de verificat`}
        </h2>

        <p className="mt-3 max-w-3xl text-mic text-cerneala-moale">
          Fotografia nu ține loc de hârtie: originalul semnat tot trebuie să
          ajungă la asociație, iar ANAF îl poate cere. Lista e ca să știi din
          timp cine redirecționează și pe cine mai trebuie sunat după plic.
        </p>

        {formulare.length === 0 ? (
          <p className="mt-6 text-amplu text-cerneala-moale">
            N-a trimis nimeni încă.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {formulare.map((f) => {
              const stadiu = STADII_230.find((s) => s.id === f.stare);
              const legatura = legaturaFormular(f);
              return (
                <li
                  key={f.id}
                  className="colt-a border border-hartie-umbra bg-hartie p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0">
                      <p className="font-titlu font-bold text-cerneala">
                        {f.nume}
                      </p>
                      <p className="mt-0.5 text-mic text-cerneala-moale">
                        <a
                          href={`mailto:${f.email}`}
                          className="text-caramiziu-700 underline underline-offset-2"
                        >
                          {f.email}
                        </a>
                        {f.telefon && (
                          <>
                            {" · "}
                            <a
                              href={`tel:${f.telefon.replace(/\s/g, "")}`}
                              className="text-caramiziu-700 underline underline-offset-2"
                            >
                              {f.telefon}
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-nota text-cerneala-slab">
                      {CAND.format(new Date(f.creatLa))}
                      {stadiu && ` · ${stadiu.eticheta}`}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {legatura ? (
                      <a
                        href={legatura}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="colt-mic-a border-2 border-cerneala/15 bg-hartie px-4 py-2 font-titlu text-mic font-bold text-cerneala transition-colors hover:border-caramiziu-500"
                      >
                        Vezi formularul
                      </a>
                    ) : (
                      <span className="text-mic text-cerneala-slab">
                        Fără fișier.
                      </span>
                    )}

                    <form
                      action="/api/admin/formulare"
                      method="post"
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="id" value={f.id} />
                      <select
                        name="stare"
                        defaultValue={f.stare}
                        className={camp}
                        aria-label="Stadiul formularului"
                      >
                        {STADII_230.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.eticheta}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="font-titlu text-mic font-semibold text-caramiziu-700 underline underline-offset-2"
                      >
                        Mută
                      </button>
                    </form>

                    <form action="/api/admin/formulare" method="post">
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="actiune" value="sterge" />
                      <button
                        type="submit"
                        className="ml-auto font-titlu text-mic font-semibold text-caramiziu-800 underline underline-offset-2"
                        title="Șterge rândul și fotografia din depozit"
                      >
                        Șterge definitiv
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Cadru>
  );
}
