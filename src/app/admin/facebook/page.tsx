import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import { toateTextele, felul, type Text } from "@/lib/texte";
import {
  adresaPostarii,
  arePagina,
  cifrelePaginii,
  type Pagina,
} from "@/lib/reclame/pagina-fb";

export const metadata: Metadata = {
  title: "Facebook",
  robots: { index: false, follow: false },
};

/**
 * Pagina de Facebook: cifrele ei și trimiterea unei noutăți pe ea.
 *
 * **De ce nu e un buton „Conectează cu Facebook".** Ca să publice în numele
 * unei pagini, un site are nevoie de o aplicație Meta aprobată, cu
 * verificare de business — săptămâni de așteptare pentru ceva ce o asociație
 * face de câteva ori pe lună. Calea scurtă e un jeton de utilizator de
 * sistem, generat o dată, care nu expiră. Pașii sunt mai jos, scriși ca
 * pentru cineva care intră prima oară în Business Manager.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const RATAT: Record<string, string> = {
  "fara-pagina":
    "Nu e legată nicio pagină. Faceți pașii de mai jos și trimiteți-ne jetonul — îl punem noi.",
  nepublicat:
    "Textul e încă ciornă. Publică-l întâi pe site — altfel linkul din postare duce la o pagină care nu există.",
  deja: "Textul ăsta a plecat deja pe pagină. N-a mai fost trimis a doua oară.",
  "prea-lung":
    "Mesajul e prea lung pentru o postare. Scurtează-l sub 2.000 de semne.",
  "n-a-mers": "Facebook a refuzat postarea.",
};

export default function PaginaFacebook({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string; motiv?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Facebook">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string; motiv?: string }>;
}) {
  await connection();
  const { gresit, ratat, motiv } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Facebook" activ="/admin/facebook">
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
      <Cadru titlu="Intră în panou" activ="/admin/facebook" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/facebook" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/facebook"))) {
    return <FaraDrept titlu="Facebook" activ="/admin/facebook" />;
  }

  const [fisa, texte] = await Promise.all([
    arePagina() ? cifrelePaginii().catch(() => null) : Promise.resolve(null),
    areBazaDeDate()
      ? toateTextele().catch((): Text[] => [])
      : Promise.resolve([] as Text[]),
  ]);

  const publicate = texte
    .filter((t) => t.publicat && (t.fel === "noutate" || t.fel === "campanie"))
    .slice(0, 20);

  return (
    <Cadru
      titlu="Facebook"
      descriere="Cifrele paginii și trimiterea unei noutăți pe ea."
      activ="/admin/facebook"
    >
      {ratat && RATAT[ratat] && (
        <p
          role="alert"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {RATAT[ratat]}
          {motiv && ` — ${motiv}`}
        </p>
      )}

      {fisa ? <Cifrele p={fisa} /> : <CumSeLeaga />}

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Trimite pe pagină
          </h2>
          <p className="text-nota text-cerneala-slab">
            Noutățile și campaniile publicate pe site. Pleacă la apăsare, o
            singură dată.
          </p>
        </div>

        {publicate.length === 0 ? (
          <p className="max-w-2xl text-amplu text-cerneala-moale">
            Nu e nimic publicat încă. Scrie o noutate la „Scrie pe site” și
            publică-o; de-acolo ajunge aici.
          </p>
        ) : (
          <ul className="grid gap-3">
            {publicate.map((t) => (
              <li
                key={t.id}
                className="colt-a border border-hartie-umbra bg-hartie p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-titlu font-bold text-cerneala">
                      {t.titlu}
                    </p>
                    <p className="mt-0.5 text-nota text-cerneala-slab">
                      {felul(t.fel).eticheta} ·{" "}
                      {felul(t.fel).cale}/{t.slug}
                    </p>
                  </div>

                  {t.facebookId ? (
                    <a
                      href={adresaPostarii(t.facebookId)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-titlu text-mic font-semibold text-caramiziu-700 underline underline-offset-2"
                    >
                      Pe Facebook de pe{" "}
                      {t.facebookLa ? CAND.format(new Date(t.facebookLa)) : "—"}
                    </a>
                  ) : fisa ? (
                    <form method="post" action="/api/admin/facebook">
                      <input type="hidden" name="id" value={t.id} />
                      <details className="text-right">
                        <summary className="cursor-pointer font-titlu text-mic font-semibold text-caramiziu-700">
                          Trimite pe Facebook
                        </summary>
                        <div className="mt-3 grid gap-2 text-left">
                          <label className="grid gap-1">
                            <span className="font-titlu text-nota font-bold text-cerneala">
                              Ce scrie în postare
                            </span>
                            <textarea
                              name="mesaj"
                              rows={4}
                              maxLength={2000}
                              defaultValue={[t.titlu, t.rezumat]
                                .filter(Boolean)
                                .join("\n\n")}
                              className="w-full min-w-72 colt-mic-a border border-hartie-umbra bg-hartie p-3 text-mic text-cerneala"
                            />
                            <span className="text-nota text-cerneala-slab">
                              Linkul spre pagina de pe site se adaugă singur,
                              cu etichetă, ca donațiile venite de aici să se
                              vadă separat.
                            </span>
                          </label>
                          <div>
                            <button
                              type="submit"
                              className="inline-flex min-h-11 items-center justify-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
                            >
                              Publică pe pagină
                            </button>
                          </div>
                        </div>
                      </details>
                    </form>
                  ) : (
                    <span className="text-nota text-cerneala-slab">
                      Leagă pagina ca să poți trimite
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Cadru>
  );
}

function Cifra({
  eticheta,
  valoare,
  nota,
}: {
  eticheta: string;
  valoare: string;
  nota?: string;
}) {
  return (
    <div className="colt-mic-a border border-hartie-umbra bg-hartie p-4">
      <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
        {eticheta}
      </p>
      <p className="mt-1 font-titlu text-h4 font-extrabold text-cerneala">
        {valoare}
      </p>
      {nota && <p className="mt-1 text-nota text-cerneala-moale">{nota}</p>}
    </div>
  );
}

function Cifrele({ p }: { p: Pagina }) {
  return (
    <>
      <p className="mb-4 text-amplu text-cerneala-moale">
        Legată de pagina{" "}
        <strong className="text-cerneala">{p.nume}</strong>
        {p.adresa && (
          <>
            {" "}
            (
            <a
              href={p.adresa}
              target="_blank"
              rel="noreferrer"
              className="text-caramiziu-700 underline underline-offset-2"
            >
              deschide-o
            </a>
            )
          </>
        )}
        .{" "}
        {!p.poatePublica &&
          "Jetonul poate citi, dar nu poate publica — îi lipsește dreptul de a scrie pe pagină."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Urmăritori"
          valoare={p.urmaritori === null ? "—" : String(p.urmaritori)}
          nota={p.aprecieri === null ? undefined : `${p.aprecieri} aprecieri`}
        />
        <Cifra
          eticheta="Au văzut pagina"
          valoare={p.vazutaDe === null ? "—" : String(p.vazutaDe)}
          nota={`Oameni deosebiți, ultimele ${p.zile} de zile`}
        />
        <Cifra
          eticheta="Au reacționat"
          valoare={p.reactii === null ? "—" : String(p.reactii)}
          nota="Apăsări, comentarii, distribuiri"
        />
        <Cifra
          eticheta="Donațiile din Facebook"
          valoare="la Analiză"
          nota="„De unde vin donatorii”, rândurile Facebook"
        />
      </div>
      <p className="mt-4 max-w-3xl text-nota text-cerneala-slab">
        Cifrele astea le numără Facebook și spun cât s-a văzut, nu cât s-a
        strâns. Ce a adus pagina în bani se vede la{" "}
        <strong className="text-cerneala-moale">Analiză</strong>, pe rândul
        „Facebook, neplătit" — două măsurători diferite, nu una.
      </p>
    </>
  );
}

/**
 * Pagina nelegată.
 *
 * Aici stăteau cei cinci pași din Business Manager (utilizator de sistem,
 * jeton, variabile în Railway). Asociația: „scoate, zi că dacă asociația va
 * dori, vom conecta pagina de Facebook la site în viitor”. Pașii sunt în
 * CLAUDE.md, la „Pagina de Facebook”.
 */
function CumSeLeaga() {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <h2 className="font-titlu text-amplu font-bold text-cerneala">
        Pagina de Facebook nu e legată încă de site
      </h2>
      <p className="mt-2 max-w-3xl text-amplu text-cerneala-moale">
        Dacă asociația va dori, vom conecta pagina de Facebook la site în
        viitor. Atunci se vor vedea aici cifrele paginii și se vor putea
        trimite noutățile pe ea dintr-un buton.
      </p>
    </div>
  );
}
