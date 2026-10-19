import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { LISTE } from "@/lib/export-csv";
import { campaniileDeRaportat } from "@/lib/rapoarte/date";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import Pictograma from "@/componente/Pictograma";

export const metadata: Metadata = {
  title: "Rapoarte",
  robots: { index: false, follow: false },
};

/**
 * Rapoartele de descărcat.
 *
 * **De ce o pagină separată și nu un buton pe tabloul de bord.** Cifrele de pe
 * tablou răspund la „cum stăm azi”. Un raport răspunde la „ce s-a întâmplat în
 * perioada care s-a încheiat” și pleacă mai departe — la consiliul director,
 * la o firmă care întreabă ce s-a făcut cu banii, în raportul de activitate.
 * Sunt două treburi diferite, cu două ritmuri diferite.
 *
 * **Alegerea perioadei e un meniu, nu un câmp liber.** O lună scrisă de mână
 * („oct 2026”, „10.2026”) ar fi fost un formular în care se greșește, cu un
 * mesaj de eroare după. Un meniu cu ultimele două zeci și patru de luni nu
 * poate fi greșit, iar luna trecută — cea cerută cel mai des — e deja aleasă.
 */

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

const PRIMUL_AN = 2021;

/** Ultimele luni, de la cea mai recentă încheiată înapoi. */
function lunile(cate: number): Array<{ id: string; eticheta: string }> {
  const azi = new Date();
  const lista: Array<{ id: string; eticheta: string }> = [];
  for (let i = 0; i < cate; i++) {
    const d = new Date(
      Date.UTC(azi.getUTCFullYear(), azi.getUTCMonth() - i, 1),
    );
    const an = d.getUTCFullYear();
    const nr = d.getUTCMonth();
    lista.push({
      id: `${an}-${String(nr + 1).padStart(2, "0")}`,
      eticheta: `${LUNI[nr]} ${an}`,
    });
  }
  return lista;
}

function anii(): number[] {
  const acum = new Date().getUTCFullYear();
  const lista: number[] = [];
  for (let an = acum; an >= PRIMUL_AN; an--) lista.push(an);
  return lista;
}

export default function PaginaRapoarte({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Rapoarte">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const CLASA_SELECT =
  "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2.5 font-titlu text-mic text-cerneala";

function Buton({ copii }: { copii: string }) {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 rounded-full bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800"
    >
      <Pictograma nume="document" aria-hidden="true" className="size-4" />
      {copii}
    </button>
  );
}

function Fisa({
  titlu,
  cand,
  pentruCine,
  intern,
  children,
}: {
  titlu: string;
  /** Când se scoate, în practică. */
  cand: string;
  pentruCine: string;
  /** Conține nume de donatori? */
  intern: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <h2 className="font-titlu text-amplu font-bold text-cerneala">{titlu}</h2>
      <p className="mt-1 text-mic text-cerneala-moale">{pentruCine}</p>
      <p className="mt-1 text-nota text-cerneala-slab">{cand}</p>
      <div className="mt-5">{children}</div>
      {/*
        Eticheta care spune dacă documentul poate pleca din asociație.

        Raportul lunar are nume de donatori în el; cel anual și cel pe campanie
        n-au niciunul, dinadins, ca să poată fi atașate la un e-mail fără ca
        cineva să se uite de două ori. Scris pe pagină, nu doar în PDF: decizia
        „îl trimit sau nu” se ia aici, înainte de descărcare.
      */}
      <p
        className={`mt-5 inline-flex items-center gap-2 colt-mic-a px-3 py-1.5 text-nota font-semibold ${
          intern
            ? "bg-caramiziu-50 text-caramiziu-900"
            : "bg-turcoaz-50 text-turcoaz-900"
        }`}
      >
        {intern
          ? "Document intern — are nume de donatori"
          : "Se poate trimite — fără date personale"}
      </p>
    </section>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  await connection();
  const { gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Rapoarte" activ="/admin/rapoarte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Rapoarte" activ="/admin/rapoarte">
        <Intrare gresit={Boolean(gresit)} unde="/admin/rapoarte" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/rapoarte"))) {
    return <FaraDrept titlu="Rapoarte" activ="/admin/rapoarte" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Rapoarte" activ="/admin/rapoarte">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Fără baza de date nu există cifre din care să se scrie un raport.
        </p>
      </Cadru>
    );
  }

  const campanii = await campaniileDeRaportat().catch(() => []);
  const luni = lunile(24);
  /* Luna trecută, nu cea în curs: raportul se scoate pe o lună încheiată. */
  const lunaImplicita = luni[1]?.id ?? luni[0]?.id;

  return (
    <Cadru
      titlu="Rapoarte"
      descriere="Cifrele unei perioade încheiate, scoase ca PDF."
      activ="/admin/rapoarte"
    >
      <p className="mb-6 max-w-3xl text-amplu text-cerneala-moale">
        Toate cuprind numai donațiile încasate. Un transfer anunțat de donator,
        dar negăsit încă în extrasul de cont, nu intră în niciun total — apare
        separat, ca lucru de verificat. Sumele în euro se arată neconvertite.
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        <Fisa
          titlu="Raport lunar"
          pentruCine="Pentru ședința lunară și pentru consiliul director."
          cand="Se scoate la început de lună, pe luna încheiată."
          intern
        >
          <form action="/api/admin/raport" method="get" className="grid gap-3">
            <input type="hidden" name="fel" value="lunar" />
            <label
              htmlFor="raport-luna"
              className="font-titlu text-mic font-bold text-cerneala"
            >
              Luna
            </label>
            <select
              id="raport-luna"
              name="luna"
              defaultValue={lunaImplicita}
              className={CLASA_SELECT}
            >
              {luni.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.eticheta}
                </option>
              ))}
            </select>
            <div className="mt-1">
              <Buton copii="Descarcă PDF" />
            </div>
          </form>
        </Fisa>

        <Fisa
          titlu="Raport anual"
          pentruCine="Pentru raportul de activitate și pentru finanțatori."
          cand="Se scoate o dată pe an, dar se poate oricând."
          intern={false}
        >
          <form action="/api/admin/raport" method="get" className="grid gap-3">
            <input type="hidden" name="fel" value="anual" />
            <label
              htmlFor="raport-an"
              className="font-titlu text-mic font-bold text-cerneala"
            >
              Anul
            </label>
            <select id="raport-an" name="an" className={CLASA_SELECT}>
              {anii().map((an) => (
                <option key={an} value={an}>
                  {an}
                </option>
              ))}
            </select>
            <div className="mt-1">
              <Buton copii="Descarcă PDF" />
            </div>
          </form>
        </Fisa>

        <Fisa
          titlu="Raport pe campanie"
          pentruCine="Pentru cine a susținut campania și vrea să știe ce a ieșit."
          cand="Se scoate la încheierea unei campanii."
          intern={false}
        >
          {campanii.length === 0 ? (
            <p className="text-mic text-cerneala-moale">
              Nicio campanie publicată încă. Campaniile se scriu din „Scrie pe
              site”.
            </p>
          ) : (
            <form
              action="/api/admin/raport"
              method="get"
              className="grid gap-3"
            >
              <input type="hidden" name="fel" value="campanie" />
              <label
                htmlFor="raport-campanie"
                className="font-titlu text-mic font-bold text-cerneala"
              >
                Campania
              </label>
              <select
                id="raport-campanie"
                name="campanie"
                className={CLASA_SELECT}
              >
                {campanii.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.titlu}
                  </option>
                ))}
              </select>
              <div className="mt-1">
                <Buton copii="Descarcă PDF" />
              </div>
            </form>
          )}
        </Fisa>
      </div>

      {/*
        Listele brute, pentru cine vrea să calculeze singur.

        Un raport e o poveste gata spusă; exportul e materia primă. Amândouă
        sunt necesare: contabila vrea coloane, consiliul vrea trei pagini.
      */}
      <section className="mt-8 colt-a border border-hartie-umbra bg-hartie-calda p-5 sm:p-6">
        <h2 className="font-titlu text-amplu font-bold text-cerneala">
          Listele întregi, pentru Excel
        </h2>
        <p className="mt-1 max-w-3xl text-mic text-cerneala-moale">
          Rând cu rând, cu toate coloanele, de deschis în Excel sau Google
          Sheets. Fișierele astea au nume, adrese de e-mail și sume: sunt date
          personale și rămân în asociație.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {LISTE.map((l) => (
            <li key={l.id}>
              <a
                href={`/api/admin/export?ce=${l.id}`}
                className="inline-flex items-center gap-2 colt-mic-a border border-hartie-umbra bg-hartie px-4 py-2 font-titlu text-mic font-semibold text-cerneala transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
              >
                <Pictograma
                  nume="document"
                  aria-hidden="true"
                  className="size-4"
                />
                {l.eticheta}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Cadru>
  );
}
