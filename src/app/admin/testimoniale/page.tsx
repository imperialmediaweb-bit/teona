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
  CUVINTE_MAX,
  CUVINTE_MIN,
  cateCuvinte,
  testimonialeToate,
  type Testimonial,
} from "@/lib/testimoniale";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Testimonialele de pe prima pagină.
 *
 * Caietul (1.8) cere ca asociația să le poată adăuga și scoate oricând. Până
 * acum stăteau într-un fișier la care ajungeam numai eu: un părinte care
 * scria ceva frumos după o tabără aștepta până apucam să public.
 *
 * **Regulile se scriu lângă câmp, nu se impun din cod.** Citat de 20–35 de
 * cuvinte, prenumele și rolul, fără nume de familie. Un server nu poate
 * deosebi „Nela Mihaela" de „Ana Maria", și n-ar trebui: cine scrie e un om
 * din asociație, nu un străin de pe internet. Pagina numără cuvintele și
 * spune regula; hotărârea rămâne a lui.
 */

const STARI: Record<string, { text: string; bun: boolean }> = {
  facut: { text: "Adăugat. E pe prima pagină.", bun: true },
  schimbat: { text: "Schimbat.", bun: true },
  stare: { text: "Schimbat.", bun: true },
  citat: { text: "Citatul e prea scurt.", bun: false },
  semnatura: { text: "Scrie semnătura: prenumele și rolul.", bun: false },
  lung: {
    text: "Textul întreg e prea lung. Peste atât, mai bine o noutate.",
    bun: false,
  },
  necunoscut: { text: "N-a mers. Încearcă din nou.", bun: false },
};

const camp =
  "colt-mic-a w-full border-2 border-hartie-umbra bg-hartie px-4 py-3 text-corp transition outline-none focus:border-turcoaz-400";

export default function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Testimoniale">Se încarcă…</Cadru>}>
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
      <Cadru titlu="Testimoniale" activ="/admin/testimoniale">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat încă. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/testimoniale" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/testimoniale" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/testimoniale"))) {
    return <FaraDrept titlu="Testimoniale" activ="/admin/testimoniale" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Testimoniale" activ="/admin/testimoniale">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Baza de date nu e pornită. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  const toate = await testimonialeToate().catch(() => [] as Testimonial[]);
  const mesaj = stare ? STARI[stare] : undefined;
  const active = toate.filter((t) => t.activ);

  return (
    <Cadru
      titlu="Testimoniale"
      descriere="Ce spun familiile și voluntarii, pe prima pagină."
      activ="/admin/testimoniale"
    >
      {mesaj && (
        <p
          id="stare"
          tabIndex={-1}
          role="alert"
          className={`scroll-mt-24 mb-6 colt-mic-a px-4 py-3 text-mic font-semibold ${
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
          Cum arată un testimonial bun
        </p>
        <ul className="mt-2 grid gap-1 text-mic text-cerneala-moale">
          <li>
            Între <strong>{CUVINTE_MIN}</strong> și{" "}
            <strong>{CUVINTE_MAX}</strong> de cuvinte. Mai lung nu se citește.
          </li>
          <li>
            Semnătura: <strong>prenumele și rolul</strong> — „Maria, mama unui
            băiat din tabără”, „Andrei, voluntar”.
          </li>
          <li>
            Fără nume de familie și fără fotografii. Oamenii care vorbesc
            despre copiii lor n-au cerut să fie recunoscuți de tot internetul.
          </li>
          <li>
            Dacă e o recenzie publică de pe Facebook, scrie asta la „De unde”:
            cine citește trebuie să știe că n-am cules-o noi.
          </li>
          <li>
            A scris mai mult? Pune fraza cea mai bună la „Citatul” și
            scrisoarea întreagă la <strong>„Textul întreg”</strong>. Pe prima
            pagină se vede citatul, cu un buton „Citește tot” sub el.
          </li>
        </ul>
      </div>

      <section>
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
          Pe site · {active.length}
        </h2>
        <ul className="mt-4 grid gap-4">
          {toate.map((t) => (
            <li key={t.id}>
              <form
                method="post"
                action="/api/admin/testimoniale"
                className={`grid gap-3 colt-a border p-5 ${
                  t.activ
                    ? "border-hartie-umbra bg-hartie"
                    : "border-hartie-umbra bg-hartie-calda opacity-70"
                }`}
              >
                <input type="hidden" name="id" value={t.id} />
                {!t.activ && (
                  <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                    Oprit — nu se vede pe site
                  </p>
                )}

                <label className="grid gap-1.5">
                  <span className="font-titlu text-mic font-bold text-cerneala">
                    Citatul{" "}
                    <span className="font-normal text-cerneala-slab">
                      — {cateCuvinte(t.citat)} de cuvinte
                    </span>
                  </span>
                  <textarea
                    name="citat"
                    rows={3}
                    required
                    maxLength={1200}
                    defaultValue={t.citat}
                    className={camp}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="font-titlu text-mic font-bold text-cerneala">
                    Textul întreg{" "}
                    <span className="font-normal text-cerneala-slab">
                      — gol, dacă n-a scris mai mult decât citatul
                    </span>
                  </span>
                  <textarea
                    name="text_lung"
                    rows={5}
                    maxLength={6000}
                    defaultValue={t.textLung ?? ""}
                    className={camp}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="font-titlu text-mic font-bold text-cerneala">
                      Semnătura
                    </span>
                    <input
                      name="semnatura"
                      required
                      maxLength={120}
                      defaultValue={t.semnatura}
                      className={camp}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="font-titlu text-mic font-bold text-cerneala">
                      De unde{" "}
                      <span className="font-normal text-cerneala-slab">
                        — gol, dacă vi l-a spus direct
                      </span>
                    </span>
                    <input
                      name="sursa"
                      maxLength={80}
                      defaultValue={t.sursa ?? ""}
                      className={camp}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
                  >
                    Salvează
                  </button>
                  <button
                    type="submit"
                    name="fel"
                    value={t.activ ? "opreste" : "porneste"}
                    className="colt-mic-b border-2 border-hartie-umbra px-5 py-2.5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
                  >
                    {t.activ ? "Scoate de pe site" : "Pune înapoi"}
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
          Adaugă unul
        </h2>
        <form
          method="post"
          action="/api/admin/testimoniale"
          className="mt-4 grid max-w-3xl gap-3 colt-a border border-hartie-umbra bg-hartie p-5"
        >
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Citatul
            </span>
            <textarea
              name="citat"
              rows={3}
              required
              maxLength={1200}
              placeholder="Ce a spus omul, cu cuvintele lui."
              className={camp}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Textul întreg{" "}
              <span className="font-normal text-cerneala-slab">
                — numai dacă a scris mai mult
              </span>
            </span>
            <textarea
              name="text_lung"
              rows={5}
              maxLength={6000}
              placeholder="Scrisoarea întreagă. Rând gol = paragraf nou."
              className={camp}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="font-titlu text-mic font-bold text-cerneala">
                Semnătura
              </span>
              <input
                name="semnatura"
                required
                maxLength={120}
                placeholder="Maria, mama unui băiat din tabără"
                className={camp}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="font-titlu text-mic font-bold text-cerneala">
                De unde
              </span>
              <input
                name="sursa"
                maxLength={80}
                placeholder="Facebook"
                className={camp}
              />
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
            >
              Adaugă
            </button>
          </div>
        </form>
      </section>
    </Cadru>
  );
}
