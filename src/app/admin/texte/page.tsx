import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { cifreSite } from "@/lib/cifre";
import {
  LOCURI,
  completeazaCifrele,
  paginiCuTexte,
  textePanou,
} from "@/lib/texte-pagini";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Textele paginilor fixe.
 *
 * Ultimul lucru care trecea neapărat prin mine. Despre noi, Casa Teona,
 * Donează — textul stătea în cod, deci o virgulă schimbată însemna un mesaj
 * către mine și o publicare.
 *
 * **„Pune textul de la început" nu șterge nimic.** Textul de pornire rămâne
 * scris în cod pentru totdeauna; butonul șterge doar rândul din tabel, iar ce
 * scria înainte se întoarce întreg. De aceea se poate umbla aici fără frică.
 */

const STARI: Record<string, { text: string; bun: boolean }> = {
  schimbat: { text: "Schimbat. Se vede pe site.", bun: true },
  readus: { text: "Gata — textul de la început e înapoi pe site.", bun: true },
  gol: { text: "Textul nu poate rămâne gol.", bun: false },
  necunoscut: { text: "N-a mers. Încearcă din nou.", bun: false },
};

export default function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string; pagina?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Textele paginilor">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string; pagina?: string }>;
}) {
  await connection();
  const { gresit, stare, pagina: paginaCeruta } = await searchParams;
  /*
    Venit de pe cardul unei pagini din „Pagini”: se arată numai textele ei.
    Numele se caută în listă, nu se crede pe cuvânt.
  */
  const doar = paginiCuTexte().find((p) => p === paginaCeruta) ?? null;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Textele paginilor" activ="/admin/texte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat încă. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/texte" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/texte" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/texte"))) {
    return <FaraDrept titlu="Textele paginilor" activ="/admin/texte" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Textele paginilor" activ="/admin/texte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Baza de date nu e pornită. Cere-i dezvoltatorului.
        </p>
      </Cadru>
    );
  }

  const sloturi = await textePanou().catch(() => []);
  const cifre = await cifreSite();
  const mesaj = stare ? STARI[stare] : undefined;
  const schimbate = sloturi.filter((s) => s.schimbat).length;

  return (
    <Cadru
      titlu={doar ?? "Textele paginilor"}
      descriere={
        doar
          ? "Ce scrie pe pagina asta. Titlurile, pozele și butoanele rămân cum sunt."
          : "Ce scrie pe Despre noi, Casa Teona, Donează și celelalte pagini."
      }
      activ="/admin/texte"
      actiuni={
        <Link
          href="/admin/pagini"
          className="font-titlu text-mic font-semibold text-caramiziu-700 hover:underline"
        >
          ← Toate paginile
        </Link>
      }
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
          Poți umbla aici fără frică
        </p>
        <ul className="mt-2 grid gap-1 text-mic text-cerneala-moale">
          <li>
            <strong>„Pune textul de la început” aduce înapoi</strong> exact ce
            scria la lansare. Textul ăla nu se pierde niciodată, orice scrii
            peste el.
          </li>
          <li>
            Un <strong>rând gol</strong> desparte paragrafele. Altceva nu e
            nevoie: felul în care arată textul îl dă site-ul.
          </li>
          <li>
            Se schimbă <strong>ce scrie</strong>, nu cum arată: titlurile de
            secțiuni, fotografiile și butoanele rămân unde sunt.
          </li>
          <li>
            Unde vrei o cifră din cele patru, scrie{" "}
            {LOCURI.map((l, i) => (
              <span key={l}>
                {i > 0 && ", "}
                <code className="rounded bg-hartie-umbra px-1.5">{`{${l}}`}</code>
              </span>
            ))}{" "}
            — se completează singure din{" "}
            <Link
              href="/admin/cifre"
              className="font-semibold text-caramiziu-700 hover:underline"
            >
              Cifrele
            </Link>
            , deci nu se mai învechesc.
          </li>
        </ul>
        <p className="mt-3 text-nota text-cerneala-slab">
          Schimbate până acum: {schimbate} din {sloturi.length}.
        </p>
      </div>

      {(doar ? [doar] : paginiCuTexte()).map((pagina) => (
        <section key={pagina} className="mb-12">
          <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
            {pagina}
          </h2>
          <ul className="mt-4 grid gap-5">
            {sloturi
              .filter((s) => s.pagina === pagina)
              .map((s) => {
                /*
                  Locurile scrise greșit se arată, nu se ascund.

                  `{tabre}` nu se completează cu nimic și ajunge pe pagină așa
                  cum e scris. Un gol care dispare în liniște e felul în care o
                  frază apare pe site fără jumătate din ea.
                */
                const necunoscute = [
                  ...new Set(
                    [...s.continut.matchAll(/\{([a-z]+)\}/g)]
                      .map((m) => m[1])
                      .filter(
                        (n) => !LOCURI.includes(n as (typeof LOCURI)[number]),
                      ),
                  ),
                ];
                const areLocuri = /\{[a-z]+\}/.test(s.continut);

                return (
                  <li key={s.cheie}>
                    <form
                      method="post"
                      action="/api/admin/texte-pagini"
                      className="grid gap-3 colt-a border border-hartie-umbra bg-hartie p-5"
                    >
                      <input type="hidden" name="cheie" value={s.cheie} />
                      {doar && (
                        <input type="hidden" name="pagina" value={doar} />
                      )}

                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-titlu text-amplu font-bold text-cerneala">
                          {s.titlu}
                        </span>
                        {s.schimbat ? (
                          <span className="font-titlu text-nota font-bold tracking-wide text-turcoaz-700 uppercase">
                            Schimbat de voi
                          </span>
                        ) : (
                          <span className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                            Textul de la început
                          </span>
                        )}
                      </div>
                      {s.ajutor && (
                        <p className="text-mic text-cerneala-moale">
                          {s.ajutor}
                        </p>
                      )}

                      <textarea
                        name="continut"
                        rows={Math.min(
                          16,
                          Math.max(3, Math.ceil(s.continut.length / 90)),
                        )}
                        required
                        maxLength={6000}
                        defaultValue={s.continut}
                        className="colt-mic-a w-full resize-y border-2 border-hartie-umbra bg-hartie px-4 py-3 font-mono text-mic transition outline-none focus:border-turcoaz-400"
                      />

                      {necunoscute.length > 0 && (
                        <p className="colt-mic-b border-l-4 border-caramiziu-600 bg-caramiziu-50 px-4 py-2.5 text-mic text-caramiziu-900">
                          <strong className="font-titlu font-bold">
                            Atenție:
                          </strong>{" "}
                          {necunoscute.map((n) => `{${n}}`).join(", ")} nu e
                          dintre cifrele care se completează singure, deci va
                          apărea pe site exact așa cum e scris. Cele care merg
                          sunt {LOCURI.map((l) => `{${l}}`).join(", ")}.
                        </p>
                      )}

                      {areLocuri && necunoscute.length === 0 && (
                        <p className="text-nota text-cerneala-slab">
                          Pe site se va citi:{" "}
                          <em>
                            „
                            {completeazaCifrele(s.continut, cifre)
                              .replace(/\s+/g, " ")
                              .slice(0, 180)}
                            …”
                          </em>
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="colt-mic-a bg-caramiziu-700 px-5 py-2.5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
                        >
                          Salvează
                        </button>
                        {s.schimbat && (
                          <button
                            type="submit"
                            name="fel"
                            value="inapoi"
                            className="colt-mic-b border-2 border-hartie-umbra px-5 py-2.5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
                          >
                            Pune textul de la început
                          </button>
                        )}
                      </div>
                    </form>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </Cadru>
  );
}
