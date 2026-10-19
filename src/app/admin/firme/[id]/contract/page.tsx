import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { firma as iaFirma } from "@/lib/crm";
import { cautaFirma, cuiValid, curataCui } from "@/lib/anaf";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Contract de sponsorizare",
  robots: { index: false, follow: false },
};

/**
 * Contractul de sponsorizare al unei firme, gata de trimis.
 *
 * **Ce rezolvă.** O firmă trimitea formularul, cineva îi răspundea, apoi
 * deschidea un document Word și completa de mână șapte câmpuri pe care firma
 * tocmai le scrisese în formular. Între „vreau să sponsorizez” și contractul
 * în inbox treceau zile.
 *
 * **Ce se completează singur.** Denumirea, persoana și contactul vin din fișa
 * firmei. Sediul și numărul de la registrul comerțului vin de la ANAF, după
 * CUI — datele publice, exact cum sunt înregistrate, nu cum le-a scris cineva
 * în grabă într-un formular. Totul rămâne editabil: ANAF poate fi în urmă cu
 * o mutare de sediu, iar contractul se semnează cu ce e adevărat azi.
 *
 * **Ce rămâne gol rămâne gol.** Un câmp necompletat apare în PDF ca puncte de
 * suspensie, de completat cu pixul — exact ca pe formularul lor tipărit.
 */

const camp =
  "w-full colt-mic-a border border-hartie-umbra bg-hartie px-4 py-2.5 text-cerneala";

function astazi(): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function PaginaContract({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense
      fallback={<Cadru titlu="Contract de sponsorizare">Se încarcă…</Cadru>}
    >
      <Continut params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gresit?: string }>;
}) {
  await connection();
  const { id } = await params;
  const { gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Contract de sponsorizare" activ="/admin/firme">
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
      <Cadru titlu="Intră în panou" activ="/admin/firme">
        <Intrare gresit={Boolean(gresit)} unde="/admin/firme" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/firme"))) {
    return <FaraDrept titlu="Contract de sponsorizare" activ="/admin/firme" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Contract de sponsorizare" activ="/admin/firme">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const firma = await iaFirma(id);
  if (!firma) notFound();

  /*
    Datele publice ale firmei, după CUI.

    Dacă ANAF nu răspunde, formularul se completează de mână: un contract nu
    trebuie să aștepte după un serviciu din afară.
  */
  const cui = curataCui(firma.cui);
  const laAnaf =
    cui !== null && cuiValid(cui)
      ? await cautaFirma(cui).catch(() => null)
      : null;

  /** „JUD. SUCEAVA, MUN. SUCEAVA, STR. …” → sediul fără județ, și județul. */
  const adresa = laAnaf?.adresa ?? "";
  const potrivireJudet = adresa.match(/JUD\.\s*([A-ZĂÂÎȘȚ ]+?)\s*,\s*(.*)$/i);
  const judet = potrivireJudet
    ? potrivireJudet[1].trim().replace(/\b\p{Lu}\p{Ll}*/gu, (w) => w)
    : "";
  const sediu = potrivireJudet ? potrivireJudet[2].trim() : adresa;

  return (
    <Cadru
      titlu="Contract de sponsorizare"
      descriere={`Pentru ${firma.denumire}. Verifică datele, apoi descarcă PDF-ul.`}
      activ="/admin/firme"
      actiuni={
        <Link
          href="/admin/firme"
          className="font-titlu text-mic font-semibold text-caramiziu-700 hover:underline"
        >
          ← Înapoi la firme
        </Link>
      }
    >
      {laAnaf ? (
        <p className="mb-7 max-w-3xl colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-mic text-turcoaz-900">
          Sediul și numărul de la registrul comerțului sunt completate din
          datele publice ale ANAF, pentru <strong>{laAnaf.denumire}</strong>.
          Schimbă-le dacă firma s-a mutat între timp.
          {!laAnaf.activa && (
            <strong className="mt-1 block text-caramiziu-800">
              Atenție: ANAF o are ca inactivă sau radiată.
            </strong>
          )}
        </p>
      ) : (
        <p className="mb-7 max-w-3xl colt-mic-a border border-hartie-umbra bg-hartie px-5 py-4 text-mic text-cerneala-moale">
          N-am putut lua datele de la ANAF pentru CUI-ul{" "}
          <strong>{firma.cui}</strong>. Completează sediul și numărul de la
          registrul comerțului de mână — ce rămâne gol apare în contract ca
          puncte, de completat cu pixul.
        </p>
      )}

      <form
        action="/api/admin/contract"
        method="post"
        className="grid max-w-3xl gap-6"
      >
        <input type="hidden" name="id" value={firma.id} />

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Număr contract
            </span>
            <input name="numar" className={camp} placeholder="12" />
          </label>
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Data contractului
            </span>
            <input name="data" defaultValue={astazi()} className={camp} />
          </label>
        </div>

        <fieldset className="grid gap-5 colt-a border border-hartie-umbra bg-hartie p-5">
          <legend className="px-2 font-titlu text-mic font-bold text-cerneala">
            Sponsorul
          </legend>

          <label className="grid gap-1.5">
            <span className="text-mic font-semibold text-cerneala">
              Denumirea
            </span>
            <input
              name="denumire"
              defaultValue={laAnaf?.denumire || firma.denumire}
              className={camp}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Sediul
              </span>
              <input name="sediu" defaultValue={sediu} className={camp} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Județul
              </span>
              <input name="judet" defaultValue={judet} className={camp} />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                CUI / CIF
              </span>
              <input name="cui" defaultValue={firma.cui} className={camp} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Nr. Reg. Com.
              </span>
              <input
                name="regCom"
                defaultValue={laAnaf?.nrRegCom ?? ""}
                className={camp}
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Reprezentant legal
              </span>
              <input
                name="reprezentant"
                defaultValue={firma.persoana}
                className={camp}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                În calitate de
              </span>
              <input
                name="calitate"
                defaultValue="Administrator"
                className={camp}
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Telefon
              </span>
              <input
                name="telefon"
                defaultValue={firma.telefon ?? ""}
                className={camp}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                E-mail
              </span>
              <input name="email" defaultValue={firma.email} className={camp} />
            </label>
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Valoarea contractului, în lei
            </span>
            <input
              name="valoare"
              inputMode="decimal"
              defaultValue={
                firma.sumaBani
                  ? String(firma.sumaBani / 100)
                  : (firma.sumaEstimata ?? "")
              }
              className={camp}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Data semnării
            </span>
            <input
              name="dataSemnarii"
              defaultValue={astazi()}
              className={camp}
            />
          </label>
        </div>

        <label className="flex items-start gap-3 text-mic text-cerneala-moale">
          <input
            type="checkbox"
            name="muta"
            value="da"
            defaultChecked={firma.stadiu === "cerere"}
            className="mt-0.5 size-5"
          />
          <span>
            Mută firma la „Contract trimis” și notează în istoric că s-a generat
            contractul.
          </span>
        </label>

        <div>
          {/*
            Două butoane, două contracte. Numele câmpului pleacă odată cu
            apăsarea, deci nu e nevoie de un selector separat pe care cineva
            l-ar putea lăsa pe valoarea greșită fără să observe.
          */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="contract"
              value="direct"
              className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800"
            >
              Descarcă contractul (PDF)
            </button>
            <button
              type="submit"
              name="contract"
              value="declaratia177"
              className="colt-mic-b border-2 border-caramiziu-300 px-6 py-3 font-titlu font-bold text-caramiziu-800 transition-colors hover:border-caramiziu-500"
            >
              Contract pentru Declarația 177 (PDF)
            </button>
          </div>
          <p className="mt-2 text-nota text-cerneala-slab">
            Se deschide în fila asta ca fișier. Textul clauzelor e cel din
            contractul asociației, neschimbat.
          </p>
          <p className="mt-2 text-nota text-cerneala-slab">
            <strong className="font-titlu font-bold text-cerneala">
              Care din două:
            </strong>{" "}
            la cel dintâi, firma virează banii și scade suma din impozitul pe
            profit. La cel pentru Declarația 177, suma o virează ANAF din
            impozitul firmei (Ordinul ANAF 1679/2022) — calea
            microîntreprinderilor pe impozit pe venit, cărora calculatorul de
            pe site le spune că n-au de unde scădea o sponsorizare. Diferă
            Art. 4 și o obligație în plus a sponsorului; restul clauzelor sunt
            identice.
          </p>
        </div>
      </form>
    </Cadru>
  );
}
