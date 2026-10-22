import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  areParolaConfigurata,
  arePermisiune,
  cineEsteConectat,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  EXPLICATIA_ROLULUI,
  MINIM_PAROLA,
  NUMELE_ROLULUI,
  PAGINI,
  ROLURI,
  listaUtilizatorilor,
  poateVedea,
  type Rol,
  type Utilizator,
} from "@/lib/utilizatori";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Utilizatori",
  robots: { index: false, follow: false },
};

/**
 * Conturile oamenilor din asociație.
 *
 * **De ce există pagina.** Panoul a mers cu o singură parolă, în
 * `PAROLA_ADMIN`, cât timp îl deschideau două persoane care făceau același
 * lucru. Un om de strângere de fonduri schimbă socoteala: nu se poate opri
 * unul singur fără să schimbi parola tuturor, nu se vede cine a sunat pe
 * cine, și nu se poate da mai puțin decât tot — cine vine să ajute cu firmele
 * primește și Formularele 230, cu coduri numerice personale în ele.
 *
 * **Parola nu se arată niciodată aici.** Nici cea pusă acum, nici una
 * generată de noi. Ce se scrie într-o pagină se vede peste umăr, iar ce trece
 * prin adresă ajunge în istoric și în jurnalele serverului. Administratorul
 * scrie parola, deci o știe; o spune omului cum vrea el, iar omul o schimbă
 * din „Parola mea". După asta n-o mai știe nimeni altcineva.
 *
 * **Conturile nu se șterg, se opresc.** Jurnalul discuțiilor poartă numele
 * celui care a scris rândul, iar „l-a sunat cineva care nu mai există" e mai
 * rău decât numele unui om plecat.
 */

const STARI: Record<string, { text: string; bun?: boolean }> = {
  facut: { text: "Contul a fost făcut.", bun: true },
  invitat: {
    text: "Contul e făcut și invitația a plecat. Omul își pune singur parola.",
    bun: true,
  },
  "fara-email": {
    text: "Contul e făcut, dar e-mailul cu invitația n-a plecat. Încearcă „Trimite din nou”, sau scrie-i tu o parolă.",
  },
  "fara-cheie": {
    text: "Contul e făcut, dar linkul nu s-a putut semna. Lipsește SECRET_SESIUNE. Scrie-i o parolă de mână până se pune.",
  },
  exista: { text: "Există deja un cont cu adresa asta." },
  email: { text: "Scrie o adresă de e-mail." },
  nume: { text: "Scrie numele omului." },
  rol: { text: "Alege un rol." },
  scurta: {
    text: `Parola are nevoie de cel puțin ${MINIM_PAROLA} semne.`,
  },
  parola: { text: "Parola a fost schimbată.", bun: true },
  "rol-schimbat": { text: "Rolul a fost schimbat.", bun: true },
  oprit: { text: "Contul a fost oprit. Omul nu mai poate intra.", bun: true },
  pornit: { text: "Contul a fost repornit.", bun: true },
  "nu-pe-mine": {
    text: "Pe contul cu care ești înăuntru nu poți face asta. Cere-i altui administrator, sau intră cu parola asociației.",
  },
  necunoscut: { text: "N-am putut face schimbarea." },
};

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const CLASA_CAMP =
  "min-h-11 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-cerneala";

export default function PaginaUtilizatori({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; stare?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Utilizatori">Se încarcă…</Cadru>}>
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
      <Cadru titlu="Utilizatori" activ="/admin/utilizatori">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/utilizatori" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/utilizatori" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/utilizatori"))) {
    return <FaraDrept titlu="Utilizatori" activ="/admin/utilizatori" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Utilizatori" activ="/admin/utilizatori">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Conturile stau în baza de date.
        </p>
      </Cadru>
    );
  }

  const [oameni, cine] = await Promise.all([
    listaUtilizatorilor().catch(() => [] as Utilizator[]),
    cineEsteConectat(),
  ]);
  const euId = cine?.fel === "cont" ? cine.utilizator.id : null;
  const mesaj = stare ? STARI[stare] : undefined;

  return (
    <Cadru
      titlu="Utilizatori"
      descriere="Cine poate intra în panou și cât vede fiecare."
      activ="/admin/utilizatori"
    >
      {mesaj && (
        <p
          id="stare"
          role="alert"
          tabIndex={-1}
          className={`mb-6 scroll-mt-24 colt-mic-a px-4 py-3 text-mic font-semibold ${
            mesaj.bun
              ? "bg-turcoaz-50 text-cerneala"
              : "bg-caramiziu-50 text-caramiziu-900"
          }`}
        >
          {mesaj.text}
        </p>
      )}

      {cine?.fel === "cheie" && (
        <p className="mb-6 colt-mic-a bg-hartie-umbra px-4 py-3 text-mic text-cerneala-moale">
          Ești înăuntru cu <strong>parola asociației</strong>, nu cu un cont. Ea
          deschide tot și nu lasă urmă în jurnal — e bună ca să faci primul cont
          și ca să intri când s-a încurcat ceva, nu pentru munca de zi.
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Conturile
          </h2>
          <p className="text-nota text-cerneala-slab">
            {oameni.length === 0
              ? "Niciunul încă. Primul se face mai jos."
              : `${oameni.length} în listă.`}
          </p>
        </div>

        {oameni.length > 0 && (
          <ul className="grid gap-3">
            {oameni.map((om) => (
              <Rand key={om.id} om={om} eu={om.id === euId} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Fă un cont
          </h2>
          <p className="mt-1 text-nota text-cerneala-slab">
            Cel mai bine: trimiți invitația și omul își pune singur parola. Așa
            n-o știe nimeni altcineva, nici tu — iar parola nu mai trece prin
            WhatsApp, unde rămâne scrisă.
          </p>
        </div>

        <form
          method="post"
          action="/api/admin/utilizatori"
          className="grid max-w-2xl gap-3 colt-a border border-hartie-umbra bg-hartie p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-titlu text-nota font-bold text-cerneala">
                Numele
              </span>
              <input
                name="nume"
                maxLength={120}
                required
                autoComplete="off"
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
                maxLength={200}
                required
                autoComplete="off"
                className={CLASA_CAMP}
              />
            </label>
          </div>

          <fieldset className="grid gap-2">
            <legend className="font-titlu text-nota font-bold text-cerneala">
              Rolul
            </legend>
            {ROLURI.map((rol) => (
              <label key={rol} className="flex items-start gap-2.5 text-mic">
                <input
                  type="radio"
                  name="rol"
                  value={rol}
                  defaultChecked={rol === "fundraising"}
                  className="mt-1"
                />
                <span>
                  <strong className="font-titlu">{NUMELE_ROLULUI[rol]}</strong>
                  <span className="block text-nota text-cerneala-slab">
                    {EXPLICATIA_ROLULUI[rol]}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {/*
            Parola nu mai e obligatorie.

            Calea bună e invitația: contul se naște fără parolă și omul și-o
            pune singur. Câmpul rămâne pentru cazul în care e-mailul nu pleacă
            — o adresă greșită, Resend căzut — fiindcă atunci un cont care nu
            se poate deschide nu ajută pe nimeni.
          */}
          <label className="grid max-w-sm gap-1">
            <span className="font-titlu text-nota font-bold text-cerneala">
              Parola de început{" "}
              <span className="font-normal text-cerneala-slab">
                — numai dacă nu trimiți invitație
              </span>
            </span>
            <input
              name="parola"
              type="password"
              minLength={MINIM_PAROLA}
              autoComplete="new-password"
              className={CLASA_CAMP}
            />
            <span className="text-nota text-cerneala-slab">
              Cel puțin {MINIM_PAROLA} semne. Lasă gol dacă trimiți invitația.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              name="fel"
              value="invita"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
            >
              Trimite invitația
            </button>
            <button
              type="submit"
              name="fel"
              value="adauga"
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-hartie-umbra px-5 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
            >
              Fac eu parola
            </button>
          </div>
          <p className="text-nota text-cerneala-slab">
            Invitația ține <strong>șapte zile</strong> și merge o singură dată.
          </p>
        </form>
      </section>

      <CeVedeFiecare />
    </Cadru>
  );
}

/** Un cont, cu ce se poate face cu el. */
function Rand({ om, eu }: { om: Utilizator; eu: boolean }) {
  return (
    <li
      className={`colt-a border p-4 sm:p-5 ${
        om.activ
          ? "border-hartie-umbra bg-hartie"
          : "border-hartie-umbra bg-hartie-calda"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-titlu text-amplu font-bold text-cerneala">
          {om.nume}
        </p>
        <p className="text-mic text-cerneala-moale">{om.email}</p>
        {eu && (
          <span className="colt-mic-a bg-turcoaz-50 px-2 py-0.5 font-titlu text-nota font-bold text-cerneala">
            tu
          </span>
        )}
        {!om.activ && (
          <span className="colt-mic-a bg-caramiziu-50 px-2 py-0.5 font-titlu text-nota font-bold text-caramiziu-900">
            oprit
          </span>
        )}
      </div>

      <p className="mt-1 text-nota text-cerneala-slab">
        {NUMELE_ROLULUI[om.rol]} · făcut {CAND.format(om.creatLa)} ·{" "}
        {om.intratLa
          ? `a intrat ultima dată ${CAND.format(om.intratLa)}`
          : "n-a intrat încă niciodată"}
        {om.areParola ? "" : " · n-are parolă pusă"}
        {om.invitatLa ? " · are o invitație în aer" : ""}
      </p>

      {/*
        Retrimiterea apare numai la cine n-a apucat să-și pună parola.

        La cineva care intră de luni de zile, butonul ăsta n-ar face decât rău:
        o invitație nouă nu-i șterge parola, dar un administrator grăbit ar
        crede că i-a resetat-o. Cine chiar trebuie resetat are câmpul de
        „Parolă nouă" chiar dedesubt.
      */}
      {!om.areParola && om.activ && (
        <form
          method="post"
          action="/api/admin/utilizatori"
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="fel" value="reinvita" />
          <input type="hidden" name="id" value={om.id} />
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-turcoaz-600 px-4 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-turcoaz-700"
          >
            {om.invitatLa ? "Trimite din nou" : "Trimite invitația"}
          </button>
          <span className="text-nota text-cerneala-slab">
            {om.invitatLa
              ? "Linkul de dinainte se stinge pe loc."
              : "Își pune singur parola, din e-mail."}
          </span>
        </form>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <form
          method="post"
          action="/api/admin/utilizatori"
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="fel" value="parola" />
          <input type="hidden" name="id" value={om.id} />
          <label className="grid flex-1 gap-1">
            <span className="font-titlu text-nota font-bold text-cerneala">
              Parolă nouă
            </span>
            <input
              name="parola"
              type="password"
              minLength={MINIM_PAROLA}
              required
              autoComplete="new-password"
              className={CLASA_CAMP}
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border border-hartie-umbra px-4 font-titlu text-mic font-bold text-cerneala transition-colors hover:bg-hartie-umbra"
          >
            Schimbă
          </button>
        </form>

        <div className="flex flex-wrap items-end gap-2">
          {/*
            Rolul și oprirea lipsesc de pe contul cu care ești înăuntru.

            Nu din grija de a nu te încuia — `PAROLA_ADMIN` te scoate oricum —
            ci pentru că butoanele stau pe același rând la toți, iar al tău e
            primul pe care îl nimerești. Greșeala costă un telefon.
          */}
          {!eu && (
            <>
              <form
                method="post"
                action="/api/admin/utilizatori"
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="fel" value="rol" />
                <input type="hidden" name="id" value={om.id} />
                <label className="grid gap-1">
                  <span className="font-titlu text-nota font-bold text-cerneala">
                    Rolul
                  </span>
                  <select
                    name="rol"
                    defaultValue={om.rol}
                    className={CLASA_CAMP}
                  >
                    {ROLURI.map((rol) => (
                      <option key={rol} value={rol}>
                        {NUMELE_ROLULUI[rol]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-full border border-hartie-umbra px-4 font-titlu text-mic font-bold text-cerneala transition-colors hover:bg-hartie-umbra"
                >
                  Schimbă
                </button>
              </form>

              <form method="post" action="/api/admin/utilizatori">
                <input
                  type="hidden"
                  name="fel"
                  value={om.activ ? "opreste" : "porneste"}
                />
                <input type="hidden" name="id" value={om.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-full border border-caramiziu-200 px-4 font-titlu text-mic font-bold text-caramiziu-900 transition-colors hover:bg-caramiziu-50"
                >
                  {om.activ ? "Oprește" : "Repornește"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Tabelul cu ce vede fiecare rol.
 *
 * Se scrie din aceeași listă din care se hotărăște accesul (`PAGINI`), nu de
 * mână: un tabel scris separat ar fi rămas în urmă la prima pagină nouă, și
 * ar fi spus despre panou ceva care nu mai e adevărat — exact felul în care
 * cineva dă un rol crezând că dă mai puțin decât dă.
 */
function CeVedeFiecare() {
  return (
    <section className="mt-10">
      <div className="mb-4 border-b border-hartie-umbra pb-2">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
          Ce vede fiecare rol
        </h2>
      </div>
      <div className="overflow-x-auto colt-a border border-hartie-umbra bg-hartie">
        <table className="w-full text-mic">
          <thead>
            <tr className="border-b border-hartie-umbra text-left">
              <th className="px-4 py-2.5 font-titlu text-nota font-bold text-cerneala">
                Pagina
              </th>
              {ROLURI.map((rol) => (
                <th
                  key={rol}
                  className="px-4 py-2.5 font-titlu text-nota font-bold text-cerneala"
                >
                  {NUMELE_ROLULUI[rol]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAGINI.map((p) => (
              <tr key={p.cale} className="border-b border-hartie-umbra/60">
                <td className="px-4 py-2 text-cerneala-moale">
                  <code>{p.cale}</code>
                </td>
                {ROLURI.map((rol: Rol) => (
                  <td key={rol} className="px-4 py-2">
                    {poateVedea(rol, p.cale) ? (
                      <span className="font-bold text-cerneala">da</span>
                    ) : (
                      <span className="text-cerneala-slab">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
