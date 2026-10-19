import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areR2 } from "@/lib/r2";
import { STADII_CERERE, cereri } from "@/lib/crm";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Formulare 230",
  robots: { index: false, follow: false },
};

/**
 * Formularele 230 primite de pe site, și fișierul gol de descărcat.
 *
 * **Aici nu e niciun CNP.** Site-ul nu primește poza formularului: omul o
 * trimite pe WhatsApp sau pe e-mail, direct la asociație. Lista asta are doar
 * cine a completat, cum se ia legătura cu el și pe câți ani a bifat.
 *
 * Rostul ei e timpul: se știe din ziua aceea cine redirecționează, cine a
 * bifat pe doi ani — și deci nu mai trebuie căutat la anul — și pe cine mai
 * trebuie sunat după plic. Hârtia semnată tot trebuie să ajungă la asociație;
 * fără ea, ANAF nu înregistrează nimic.
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
      <Cadru titlu="Intră în panou" activ="/admin/formulare">
        <Intrare gresit={Boolean(gresit)} unde="/admin/formulare" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/formulare"))) {
    return <FaraDrept titlu="Formulare 230" activ="/admin/formulare" />;
  }

  /*
    Lista vine din CRM, nu dintr-un tabel al ei.

    `cereri` are deja categoria „Redirecționare 3,5%", iar formularul de pași
    de pe aceeași pagină scrie tot acolo. Un al doilea tabel ar fi însemnat
    aceiași oameni în două liste, cu două exporturi și două feluri de a-i
    marca rezolvați.
  */
  const formulare = areBazaDeDate()
    ? await cereri("redirectionare", undefined, 500)
    : [];
  const deVerificat = formulare.filter((f) => f.stadiu === "nou").length;

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
          {gata === "urcat" &&
            "Fișierul e sus. Se descarcă de la /formular-230."}
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
            <code className="rounded bg-hartie-umbra px-1">
              R2_ACCESS_KEY_ID
            </code>
            ,{" "}
            <code className="rounded bg-hartie-umbra px-1">
              R2_SECRET_ACCESS_KEY
            </code>{" "}
            și <code className="rounded bg-hartie-umbra px-1">R2_BUCKET</code>.
            Dacă depozitul e creat în jurisdicția Uniunii Europene, mai trebuie
            și <code className="rounded bg-hartie-umbra px-1">R2_ENDPOINT</code>
            , cu adresa lui.
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
          Oamenii trimit poza pe WhatsApp, iar hârtia prin poștă. Aici e doar
          lista: cine a completat, pe câți ani, și cum îl suni. Fără hârtia
          semnată, ANAF nu înregistrează redirecționarea.
        </p>

        {/*
          Adăugarea de mână.

          Nu toată lumea trece prin formularul de pe site: cineva trimite poza
          pe WhatsApp și atât. Până acum, singurul loc în care rămânea era
          conversația aia. Strâns într-un `details` ca să nu stea deschis
          peste listă — se folosește de câteva ori pe zi, nu tot timpul.
        */}
        <details className="mt-5 max-w-3xl colt-a border border-hartie-umbra bg-hartie">
          <summary className="cursor-pointer px-5 py-4 font-titlu text-mic font-bold text-cerneala">
            Adaug eu unul — a trimis pe WhatsApp sau a sunat
          </summary>

          <form
            action="/api/admin/cereri"
            method="post"
            className="grid gap-4 border-t border-hartie-umbra p-5"
          >
            <input type="hidden" name="actiune" value="adauga" />
            <input type="hidden" name="fel" value="redirectionare" />
            <input type="hidden" name="inapoi" value="/admin/formulare" />

            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Numele
              </span>
              <input name="nume" required className={camp} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  Telefon
                </span>
                <input name="telefon" inputMode="tel" className={camp} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  E-mail
                </span>
                <input name="email" type="email" className={camp} />
              </label>
            </div>
            <p className="-mt-2 text-nota text-cerneala-slab">
              Măcar unul din cele două. De pe WhatsApp ai un număr, nu o adresă
              — e în regulă așa.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  Pe câți ani a bifat
                </span>
                <select name="ani" defaultValue="" className={camp}>
                  <option value="">Nu știu</option>
                  <option value="1">Un an</option>
                  <option value="2">Doi ani</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  A venit prin
                </span>
                <select name="deUnde" defaultValue="WhatsApp" className={camp}>
                  <option>WhatsApp</option>
                  <option>E-mail</option>
                  <option>Telefon</option>
                  <option>Hârtie, la Casa Teona</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Observații
              </span>
              <input
                name="observatii"
                maxLength={300}
                placeholder="a zis că trimite hârtia săptămâna viitoare"
                className={camp}
              />
            </label>

            <div>
              <button
                type="submit"
                className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800"
              >
                Adaugă în listă
              </button>
            </div>
          </form>
        </details>

        {formulare.length === 0 ? (
          <p className="mt-6 text-amplu text-cerneala-moale">
            N-a spus nimeni încă.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {formulare.map((f) => {
              const stadiu = STADII_CERERE.find((s) => s.id === f.stadiu);
              const peDoiAni = f.detalii["Pe câți ani"] === "2 ani";
              const peWhatsApp = f.telefon
                ? `https://wa.me/${f.telefon.replace(/\D/g, "").replace(/^0/, "40")}`
                : null;
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
                      {f.detalii.Observații && (
                        <p className="mt-1 text-mic text-cerneala-moale">
                          {f.detalii.Observații}
                        </p>
                      )}
                    </div>
                    <p className="text-nota text-cerneala-slab">
                      {CAND.format(new Date(f.creatLa))}
                      {stadiu && ` · ${stadiu.eticheta}`}
                      {/* Cine a bifat pe doi ani nu mai trebuie căutat la anul. */}
                      {peDoiAni && (
                        <span className="ml-2 rounded-full bg-turcoaz-100 px-2 py-0.5 font-bold text-turcoaz-900">
                          2 ani
                        </span>
                      )}
                      {f.detalii["A venit prin"] && (
                        <span className="ml-2 rounded-full bg-hartie-umbra px-2 py-0.5">
                          {f.detalii["A venit prin"]}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {/* Scrie-i pe WhatsApp, de unde vine oricum poza. */}
                    {peWhatsApp && (
                      <a
                        href={peWhatsApp}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="colt-mic-a border-2 border-cerneala/15 bg-hartie px-4 py-2 font-titlu text-mic font-bold text-cerneala transition-colors hover:border-turcoaz-500"
                      >
                        Scrie-i pe WhatsApp
                      </a>
                    )}

                    <form
                      action="/api/admin/cereri"
                      method="post"
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="id" value={f.id} />
                      <select
                        name="stadiu"
                        defaultValue={f.stadiu}
                        className={camp}
                        aria-label="Stadiul cererii"
                      >
                        {STADII_CERERE.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.eticheta}
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
