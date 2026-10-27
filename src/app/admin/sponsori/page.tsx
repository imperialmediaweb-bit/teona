import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areCloudinary } from "@/lib/poza-urcata";
import {
  PE_PRIMA_PAGINA,
  sponsoriPanou,
  type SiglaPanou,
} from "@/lib/sponsori";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Siglele sponsorilor.
 *
 * Întrebarea e a asociației, din octombrie 2026: „La Sponsori o să pot și eu
 * adăuga ulterior sigle? Ei sunt mai mulți decât apar acum pe site."
 *
 * **Ordinea se vede, nu se presupune.** Pe prima pagină intră primele
 * douăsprezece, iar pagina scrie unde se taie — altfel o siglă adăugată azi ar
 * rămâne pe veci a 37-a, adică nevăzută de cine nu deschide pagina de
 * sponsori, și nimeni n-ar înțelege de ce.
 */

const STARI: Record<string, { text: string; bun: boolean }> = {
  facut: { text: "Adăugat. Sigla e pe site.", bun: true },
  schimbat: { text: "Schimbat.", bun: true },
  stare: { text: "Schimbat.", bun: true },
  mutat: { text: "Mutat.", bun: true },
  nume: {
    text: "Scrie numele firmei — fără el, sigla n-are text.",
    bun: false,
  },
  poza: { text: "Alege fișierul siglei.", bun: false },
  imagine: { text: "Fișierul nu e o imagine. Merg PNG, JPG, WebP și SVG.", bun: false },
  mare: { text: "Fișierul e prea mare.", bun: false },
  depozit: {
    text: "Locul pozelor nu e pornit. Cere-i dezvoltatorului.",
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
    <Suspense fallback={<Cadru titlu="Sponsori">Se încarcă…</Cadru>}>
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
      <Cadru titlu="Sponsori" activ="/admin/sponsori">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat încă. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/sponsori" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/sponsori" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/sponsori"))) {
    return <FaraDrept titlu="Sponsori" activ="/admin/sponsori" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Sponsori" activ="/admin/sponsori">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Baza de date nu e pornită. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  const toate = await sponsoriPanou().catch(() => [] as SiglaPanou[]);
  const mesaj = stare ? STARI[stare] : undefined;
  const active = toate.filter((s) => s.activ);
  const poze = areCloudinary();

  return (
    <Cadru
      titlu="Sponsori"
      descriere="Siglele firmelor care vă susțin, de pe prima pagină și de pe pagina de sponsori."
      activ="/admin/sponsori"
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
        <p className="font-titlu font-bold text-cerneala">Ce e bine de știut</p>
        <ul className="mt-2 grid gap-1 text-mic text-cerneala-moale">
          <li>
            <strong>Numele firmei e obligatoriu.</strong> Fără el, cine
            folosește un cititor de ecran aude „siglă de sponsor”, iar sub siglă
            n-am ce scrie.
          </li>
          <li>
            Pe prima pagină intră <strong>primele {PE_PRIMA_PAGINA}</strong>, în
            ordinea de aici. Restul se văd pe pagina de sponsori. Mută cu ↑ și
            ↓.
          </li>
          <li>
            Urc-o <strong>cum o ai</strong>: PNG, JPG, WebP sau SVG. Marginile
            goale se taie singure, mărimea se potrivește singură, iar o siglă
            albă pe fundal transparent se pune singură pe o plăcuță închisă, ca
            să se vadă.
          </li>
          <li>
            Nimic nu se șterge: „Scoate de pe site” o ascunde, iar dacă firma
            revine o pui înapoi cu un apăsat.
          </li>
        </ul>
      </div>

      <section className="mb-12">
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
          Adaugă o siglă
        </h2>

        {!poze ? (
          <p className="mt-4 max-w-2xl colt-mic-a border border-caramiziu-200 bg-caramiziu-50 px-5 py-4 text-mic text-caramiziu-900">
            Locul în care se păstrează pozele nu e pornit, deci nu se poate urca
            nimic acum. Cere-i dezvoltatorului.
          </p>
        ) : (
          <form
            method="post"
            action="/api/admin/sponsori"
            encType="multipart/form-data"
            className="mt-4 grid max-w-3xl gap-3 colt-a border border-hartie-umbra bg-hartie p-5"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="font-titlu text-mic font-bold text-cerneala">
                  Numele firmei
                </span>
                <input
                  name="nume"
                  required
                  maxLength={120}
                  placeholder="EGGER"
                  className={camp}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="font-titlu text-mic font-bold text-cerneala">
                  Site-ul firmei
                </span>
                <input
                  name="adresa"
                  maxLength={200}
                  placeholder="https://"
                  className={camp}
                />
              </label>
            </div>
            <label className="grid gap-1.5">
              <span className="font-titlu text-mic font-bold text-cerneala">
                Sigla
              </span>
              <input
                type="file"
                name="poza"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                required
                className="colt-mic-a border-2 border-hartie-umbra bg-hartie px-3 py-2 text-mic file:mr-3 file:border-0 file:bg-transparent file:font-titlu file:font-bold file:text-caramiziu-700"
              />
            </label>
            <div>
              <button
                type="submit"
                className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
              >
                Adaugă
              </button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
          Pe site · {active.length}
        </h2>
        <ul className="mt-4 grid gap-4">
          {toate.map((s, i) => (
            <li key={s.id}>
              <div
                className={`grid gap-4 colt-a border p-5 sm:grid-cols-[9rem_1fr] ${
                  s.activ
                    ? "border-hartie-umbra bg-hartie"
                    : "border-hartie-umbra bg-hartie-calda opacity-70"
                }`}
              >
                <div className="flex h-20 items-center justify-center colt-mic-a border border-hartie-umbra bg-hartie p-3">
                  <Image
                    src={s.cale}
                    alt={`Sigla ${s.nume}`}
                    width={200}
                    height={80}
                    className="max-h-full w-auto object-contain"
                  />
                </div>

                <div className="grid gap-3">
                  {s.activ && i < PE_PRIMA_PAGINA && (
                    <p className="font-titlu text-nota font-bold tracking-wide text-turcoaz-700 uppercase">
                      Se vede și pe prima pagină
                    </p>
                  )}
                  {!s.activ && (
                    <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                      Scoasă — nu se vede pe site
                    </p>
                  )}

                  <form
                    method="post"
                    action="/api/admin/sponsori"
                    className="grid gap-3"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1.5">
                        <span className="font-titlu text-mic font-bold text-cerneala">
                          Numele firmei
                        </span>
                        <input
                          name="nume"
                          required
                          maxLength={120}
                          defaultValue={s.nume}
                          className={camp}
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="font-titlu text-mic font-bold text-cerneala">
                          Site-ul firmei{" "}
                          <span className="font-normal text-cerneala-slab">
                            — poate rămâne gol
                          </span>
                        </span>
                        <input
                          name="adresa"
                          maxLength={200}
                          placeholder="https://"
                          defaultValue={s.adresa ?? ""}
                          className={camp}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
                      >
                        Salvează
                      </button>
                      <button
                        type="submit"
                        name="fel"
                        value={s.activ ? "opreste" : "porneste"}
                        className="colt-mic-b border-2 border-hartie-umbra px-5 py-2.5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
                      >
                        {s.activ ? "Scoate de pe site" : "Pune înapoi"}
                      </button>
                      <button
                        type="submit"
                        name="fel"
                        value="sus"
                        disabled={i === 0}
                        aria-label={`Mută ${s.nume} mai sus`}
                        className="colt-mic-a border-2 border-hartie-umbra px-4 py-2.5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400 disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="submit"
                        name="fel"
                        value="jos"
                        disabled={i === toate.length - 1}
                        aria-label={`Mută ${s.nume} mai jos`}
                        className="colt-mic-a border-2 border-hartie-umbra px-4 py-2.5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400 disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Cadru>
  );
}
