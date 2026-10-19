import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import CopiazaAdrese from "@/componente/admin/CopiazaAdrese";
import {
  contactePresa,
  FELURI_PRESA,
  type ContactPresa,
} from "@/lib/presa";
import { ASOCIATIA, CONTACT_FIRME, JURIDIC } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";

export const metadata: Metadata = {
  title: "Presă",
  robots: { index: false, follow: false },
};

/**
 * Lista de presă și comunicatul.
 *
 * **De ce aici și nu într-un fișier pe calculatorul cuiva.** Lista de presă a
 * unui ONG mic trăiește, de obicei, într-un Excel pe laptopul omului care a
 * făcut-o. Când omul acela pleacă, pleacă și lista — iar comunicatul următor
 * se scrie de la zero, cu adrese căutate pe Google.
 *
 * **Adresele generale sunt doar începutul.** `redactie@…` e o cutie în care
 * intră o sută de comunicate pe zi. Ce publică e ziaristul cu care ai vorbit
 * la telefon, deci fiecare rând are loc pentru un nume și o notiță: „a scris
 * despre tabăra din iunie", „preferă să primească poze separat".
 *
 * **Comunicatul nu pleacă de aici**, dinadins — vezi `CopiazaAdrese`.
 */

const RATAT: Record<string, string> = {
  "fara-nume": "Scrie numele publicației.",
};

export default function PaginaPresa({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Presă">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string }>;
}) {
  await connection();
  const { gresit, ratat } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Presă" activ="/admin/presa">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Presă" activ="/admin/presa">
        <Intrare gresit={Boolean(gresit)} unde="/admin/presa" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/presa"))) {
    return <FaraDrept titlu="Presă" activ="/admin/presa" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Presă" activ="/admin/presa">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Lista de presă stă în baza de date.
        </p>
      </Cadru>
    );
  }

  const contacte = await contactePresa();
  const active = contacte.filter((c) => c.activ);
  const adrese = active.map((c) => c.email).filter((e): e is string => !!e);
  const fara = active.filter((c) => !c.email);

  return (
    <Cadru
      titlu="Presă"
      descriere="Cui se trimite un comunicat, și cu ce text."
      activ="/admin/presa"
    >
      {ratat && RATAT[ratat] && (
        <p
          role="alert"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {RATAT[ratat]}
        </p>
      )}

      <section className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
        <h2 className="font-titlu text-amplu font-bold text-cerneala">
          Trimite comunicatul
        </h2>
        <p className="mt-2 max-w-3xl text-mic text-cerneala-moale">
          Copiezi adresele, le pui la <strong>Bcc</strong> în Gmail-ul
          asociației și trimiți de acolo. Nu de pe server: un mesaj plecat
          dintr-un program necunoscut, către opt redacții deodată, ajunge în
          spam exact la cei pe care vrei să-i prinzi.
        </p>
        <div className="mt-4">
          <CopiazaAdrese adrese={adrese} />
        </div>
        {fara.length > 0 && (
          <p className="mt-3 text-nota text-cerneala-slab">
            {fara.length === 1
              ? "O publicație n-are adresă completată"
              : `${fara.length} publicații n-au adresă completată`}
            : {fara.map((c) => c.publicatie).join(", ")}. Se află cu un telefon
            și se scrie mai jos.
          </p>
        )}
      </section>

      <Sablon />

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Redacțiile
          </h2>
          <p className="text-nota text-cerneala-slab">
            {contacte.length} în listă. Adaugă ziaristul cu care ai vorbit —
            el publică, nu adresa generală.
          </p>
        </div>

        <ul className="grid gap-3">
          {contacte.map((c) => (
            <Rand key={c.id} c={c} />
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <div className="mb-4 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Adaugă o redacție sau un ziarist
          </h2>
        </div>
        <form
          method="post"
          action="/api/admin/presa"
          className="grid max-w-2xl gap-3 colt-a border border-hartie-umbra bg-hartie p-5"
        >
          <input type="hidden" name="ce" value="adauga" />
          <Campuri />
          <div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
            >
              Adaugă
            </button>
          </div>
        </form>
      </section>
    </Cadru>
  );
}

const CLASA_CAMP =
  "min-h-11 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-cerneala";

function Campuri({ c }: { c?: ContactPresa }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold text-cerneala">
            Publicația
          </span>
          <input
            name="publicatie"
            defaultValue={c?.publicatie ?? ""}
            maxLength={120}
            required
            className={CLASA_CAMP}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold text-cerneala">
            Felul
          </span>
          <select
            name="fel"
            defaultValue={c?.fel ?? "online"}
            className={CLASA_CAMP}
          >
            {FELURI_PRESA.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nume}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold text-cerneala">
            Ziaristul
          </span>
          <input
            name="persoana"
            defaultValue={c?.persoana ?? ""}
            maxLength={120}
            placeholder="numele omului, dacă îl știi"
            className={CLASA_CAMP}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold text-cerneala">
            E-mail
          </span>
          <input
            name="email"
            type="email"
            defaultValue={c?.email ?? ""}
            maxLength={200}
            className={CLASA_CAMP}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold text-cerneala">
            Telefon
          </span>
          <input
            name="telefon"
            defaultValue={c?.telefon ?? ""}
            maxLength={40}
            className={CLASA_CAMP}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold text-cerneala">
            Site
          </span>
          <input
            name="site"
            defaultValue={c?.site ?? ""}
            maxLength={200}
            className={CLASA_CAMP}
          />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="font-titlu text-nota font-bold text-cerneala">
          Notițe
        </span>
        <textarea
          name="notite"
          defaultValue={c?.notite ?? ""}
          rows={2}
          maxLength={1000}
          placeholder="„a scris despre tabăra din iunie”, „cere pozele separat”"
          className="colt-mic-a border border-hartie-umbra bg-hartie p-3 text-mic text-cerneala"
        />
      </label>
    </>
  );
}

function Rand({ c }: { c: ContactPresa }) {
  return (
    <li className="colt-a border border-hartie-umbra bg-hartie p-4 sm:p-5">
      <details>
        <summary className="cursor-pointer list-none">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="font-titlu font-bold text-cerneala">
                {c.publicatie}
              </span>
              {c.persoana && (
                <span className="text-cerneala-moale"> · {c.persoana}</span>
              )}
              <span className="block text-nota text-cerneala-slab">
                {c.email ?? "fără adresă"}
                {c.telefon && ` · ${c.telefon}`}
                {!c.activ && " · scos din listă"}
              </span>
            </span>
            <span className="font-titlu text-nota font-semibold text-caramiziu-700">
              Schimbă
            </span>
          </span>
        </summary>

        {c.notite && (
          <p className="mt-3 text-mic text-cerneala-moale">{c.notite}</p>
        )}

        <form
          method="post"
          action="/api/admin/presa"
          className="mt-4 grid gap-3"
        >
          <input type="hidden" name="ce" value="schimba" />
          <input type="hidden" name="id" value={c.id} />
          <Campuri c={c} />
          <label className="flex items-center gap-2 text-mic text-cerneala-moale">
            <input
              type="checkbox"
              name="activ"
              value="da"
              defaultChecked={c.activ}
              className="size-4"
            />
            În listă (se trimite comunicatul)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
            >
              Salvează
            </button>
            <button
              type="submit"
              name="ce"
              value="sterge"
              formNoValidate
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-hartie-umbra px-5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
            >
              Șterge
            </button>
          </div>
        </form>
      </details>
    </li>
  );
}

/**
 * Șablonul de comunicat.
 *
 * Nu e un text frumos de citit, e **forma pe care o așteaptă o redacție**:
 * titlu scurt, primul paragraf care spune tot (dacă taie restul, rămâne
 * știrea), citat cu nume și funcție, datele asociației la final și un om cu
 * telefon pentru întrebări. Fără astea, comunicatul se rescrie în redacție
 * sau se aruncă.
 */
function Sablon() {
  const om = CONTACT_FIRME[0];
  const text = `TITLU: o propoziție, ce s-a întâmplat (nu „Asociația Teona Ariana anunță”)

Suceava, [ziua] — [Primul paragraf: ce, cine, când, unde, pentru cine. Dacă redacția taie tot restul, aici trebuie să rămână știrea întreagă.]

[Al doilea paragraf: cifra sau amănuntul care face știrea — câți copii, a câta ediție, cât a costat, cine a ajutat.]

„[Un citat de două propoziții, spus de un om, nu de o instituție.]”, a declarat ${JURIDIC.reprezentant}, ${JURIDIC.calitate}.

[Al treilea paragraf: contextul — ce face asociația, de când, pentru cine.]

Despre ${ASOCIATIA.denumire}: [două-trei rânduri, aceleași de fiecare dată.] Mai multe pe ${ADRESA_SITE.replace(/^https?:\/\//, "")}.

Contact pentru presă: ${om.nume}, ${om.telefon.afisat}, ${om.email}

[Fotografii: pune 2–3 poze mari într-un link WeTransfer sau Drive, cu drept de publicare și cu acordul părinților pentru copiii care apar.]`;

  return (
    <section className="mt-6 colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <h2 className="font-titlu text-amplu font-bold text-cerneala">
        Cum arată un comunicat pe care îl publică
      </h2>
      <p className="mt-2 max-w-3xl text-mic text-cerneala-moale">
        Forma contează mai mult decât stilul: titlu scurt, primul paragraf care
        spune tot, un citat cu nume, datele asociației și un om cu telefon.
        Copiază-l și completează parantezele.
      </p>
      <pre className="mt-4 overflow-x-auto colt-mic-a bg-hartie-umbra/50 p-4 font-mono text-nota leading-relaxed whitespace-pre-wrap text-cerneala-moale">
        {text}
      </pre>
      <p className="mt-3 text-nota text-cerneala-slab">
        <strong className="text-cerneala-moale">
          Acordul părinților pentru poze
        </strong>{" "}
        nu e o formalitate: o fotografie cu un copil, trimisă presei fără
        acord, e singura greșeală din tot comunicatul care nu se poate repara.
      </p>
    </section>
  );
}
