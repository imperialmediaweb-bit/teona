import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { NUMELE_SURSEI, type SursaAbonare, abonati, areBuletin } from "@/lib/buletin";
import { grupuri } from "@/lib/email/mailerlite";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Abonați la buletin",
  robots: { index: false, follow: false },
};

/**
 * Cine s-a abonat la buletin, de unde și când.
 *
 * Lista adevărată, cu cei de dinainte de 4 noiembrie 2026 și cu dezabonările
 * făcute din e-mail, e în MailerLite; de aici se vede numărul ei. Rândurile de
 * dedesubt sunt abonările făcute de pe site de atunci încoace.
 */

type Cautare = {
  sursa?: string;
  gresit?: string;
  adaugati?: string;
  lista?: string;
  deja?: string;
  gresite?: string;
  ratate?: string;
  dezabonati?: string;
};

const CAMP =
  "w-full rounded-lg border border-hartie-umbra bg-hartie px-3.5 py-2.5 text-mic text-cerneala focus:border-caramiziu-600";

export default function PaginaAbonati({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="Abonați la buletin">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const cauta = await searchParams;
  const { sursa, gresit } = cauta;
  const activ = "/admin/abonati";

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Abonați la buletin" activ={activ}>
        <p className="text-amplu text-cerneala-moale">Panoul nu e configurat.</p>
      </Cadru>
    );
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ={activ} faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde={activ} />
      </Cadru>
    );
  }
  if (!(await arePermisiune(activ))) return <FaraDrept titlu="Abonați la buletin" activ={activ} />;
  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Abonați la buletin" activ={activ}>
        <p className="text-amplu text-cerneala-moale">Lipsește baza de date.</p>
      </Cadru>
    );
  }

  const [toti, deLaMailerLite] = await Promise.all([
    abonati(),
    grupuri().catch(() => []),
  ]);
  const sursaAleasa = sursa && sursa in NUMELE_SURSEI ? (sursa as SursaAbonare) : null;
  const lista = sursaAleasa ? toti.filter((a) => a.sursa === sursaAleasa) : toti;
  const activi = toti.filter((a) => !a.dezabonatLa);
  const inceputLuna = new Date();
  inceputLuna.setDate(1);
  inceputLuna.setHours(0, 0, 0, 0);
  const lunaAsta = activi.filter((a) => new Date(a.creatLa) >= inceputLuna).length;
  const peSursa = (Object.keys(NUMELE_SURSEI) as SursaAbonare[]).map((s) => ({
    s,
    cati: activi.filter((a) => a.sursa === s).length,
  }));

  return (
    <Cadru titlu="Abonați la buletin" activ={activ}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Cifra eticheta="Abonați de pe site, activi" valoare={activi.length} />
        <Cifra eticheta="Luna asta" valoare={lunaAsta} />
        {deLaMailerLite.length > 0 ? (
          <div className="colt-a border border-hartie-umbra bg-hartie p-4">
            <p className="text-nota text-cerneala-slab">În MailerLite, toată lista</p>
            {deLaMailerLite.map((g) => (
              <p key={g.id} className="font-titlu text-mic font-bold text-cerneala">
                {g.nume}: {g.activi.toLocaleString("ro-RO")}
              </p>
            ))}
          </div>
        ) : (
          <div className="colt-a border border-hartie-umbra bg-hartie p-4 text-nota text-cerneala-slab">
            {areBuletin() ? "MailerLite n-a răspuns acum." : "MailerLite nu e legat (MAILERLITE_API_KEY)."}
          </div>
        )}
      </div>

      <p className="mt-4 max-w-3xl text-mic text-cerneala-moale">
        La fiecare abonare nouă primiți un e-mail la contact@teona-ariana.ro și,
        dacă v-ați pornit notificările, o notificare pe telefon. Aici sunt
        abonările făcute de pe site din 4 noiembrie 2026 încoace; cei de
        dinainte și dezabonările din e-mail sunt în MailerLite.
      </p>

      <section id="adauga" className="mt-8 colt-a border border-hartie-umbra bg-hartie p-5">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">Adaugă adrese în listă</h2>
        <p className="mt-1 max-w-2xl text-mic text-cerneala-moale">
          Una sau mai multe, despărțite prin virgulă sau fiecare pe rândul ei. Toate intră
          în lista aleasă mai jos; firmele le pui separat, cu „Firme”. Numai oameni care
          ți-au dat acordul să primească buletinul.
        </p>

        {cauta.adaugati !== undefined && (
          <div role="status" className="mt-4 grid gap-1 colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-4 py-3 text-mic text-turcoaz-900">
            <p className="font-semibold">
              {cauta.adaugati === "1" ? "O adresă adăugată" : `${cauta.adaugati} adrese adăugate`} în lista de{" "}
              {cauta.lista === "firme" ? "firme" : "persoane fizice"}.
            </p>
            {cauta.deja && <p>{cauta.deja} erau deja abonate; nu s-a schimbat nimic la ele.</p>}
            {cauta.dezabonati && (
              <p>
                Nu le-am pus înapoi, fiindcă s-au dezabonat sau n-au confirmat: {cauta.dezabonati}
              </p>
            )}
            {cauta.gresite && <p>Nu sunt adrese de e-mail: {cauta.gresite}</p>}
            {cauta.ratate && <p>MailerLite n-a răspuns pentru: {cauta.ratate}. Încearcă din nou cu ele.</p>}
          </div>
        )}

        <form action="/api/admin/abonati" method="post" className="mt-4 grid gap-4">
          <label className="grid gap-1">
            <span className="font-titlu text-nota font-bold">Adresele</span>
            <textarea
              name="adrese"
              required
              rows={4}
              placeholder={"maria@exemplu.ro, ion@exemplu.ro\nana@exemplu.ro"}
              className={CAMP}
            />
          </label>
          <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
            <legend className="mb-1 font-titlu text-nota font-bold">În ce listă</legend>
            <label className="flex items-center gap-2 text-mic">
              <input type="radio" name="lista" value="persoane" required defaultChecked />
              Persoane fizice
            </label>
            <label className="flex items-center gap-2 text-mic">
              <input type="radio" name="lista" value="firme" required />
              Firme
            </label>
          </fieldset>
          <label className="grid gap-1">
            <span className="font-titlu text-nota font-bold">De unde aveți acordul lor</span>
            <input
              name="acord_nota"
              required
              maxLength={300}
              placeholder="lista semnată la tabăra din iulie 2026"
              className={CAMP}
            />
            <span className="text-nota text-cerneala-slab">
              Se păstrează lângă fiecare adresă, cu numele tău. Dacă cineva întreabă de ce a
              primit buletinul, răspunsul e aici.
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-mic">
            <input type="checkbox" name="acord" value="da" required className="mt-1" />
            <span>Am acordul fiecăruia să primească buletinul asociației.</span>
          </label>
          <label className="flex items-start gap-2.5 text-mic">
            <input type="checkbox" name="bun_venit" value="da" className="mt-1" />
            <span>Trimite-le și e-mailul de bun venit</span>
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full bg-caramiziu-700 px-5 font-titlu font-bold text-hartie hover:bg-caramiziu-600"
            >
              Adaugă în listă
            </button>
          </div>
        </form>
      </section>

      <nav aria-label="Sursa" className="mt-8 flex flex-wrap gap-2">
        <Filtru href={activ} activ={!sursaAleasa}>
          Toate ({activi.length})
        </Filtru>
        {peSursa.map(({ s, cati }) => (
          <Filtru key={s} href={`${activ}?sursa=${s}`} activ={sursaAleasa === s}>
            {NUMELE_SURSEI[s]} ({cati})
          </Filtru>
        ))}
      </nav>

      {lista.length === 0 ? (
        <p className="mt-6 text-amplu text-cerneala-moale">Încă nicio abonare aici.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {lista.map((a) => (
            <li
              key={a.email}
              className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 colt-a border border-hartie-umbra p-4 ${
                a.dezabonatLa ? "bg-hartie-calda text-cerneala-slab" : "bg-hartie"
              }`}
            >
              <span className="font-titlu font-bold text-cerneala">{a.nume || a.email}</span>
              {a.nume && (
                <a href={`mailto:${a.email}`} className="text-mic text-caramiziu-700 underline underline-offset-2">
                  {a.email}
                </a>
              )}
              <span className="text-nota text-cerneala-moale">
                {NUMELE_SURSEI[a.sursa]} · {a.lista === "firme" ? "firme" : "persoane"} ·{" "}
                {new Date(a.creatLa).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                {a.dezabonatLa && " · s-a dezabonat"}
              </span>
              {a.sursa === "panou" && (
                <span className="basis-full text-nota text-cerneala-slab">
                  Adăugat de {a.adaugatDe ?? "parola asociației"}
                  {a.acordNota ? ` · acordul: ${a.acordNota}` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Cadru>
  );
}

function Cifra({ eticheta, valoare }: { eticheta: string; valoare: number }) {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-4">
      <p className="text-nota text-cerneala-slab">{eticheta}</p>
      <p className="font-titlu text-h3 font-extrabold text-cerneala">{valoare.toLocaleString("ro-RO")}</p>
    </div>
  );
}

function Filtru({ href, activ, children }: { href: string; activ: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={activ ? "page" : undefined}
      className={`rounded-full px-4 py-2 font-titlu text-mic font-bold ${
        activ ? "bg-cerneala text-hartie" : "border border-hartie-umbra bg-hartie text-cerneala"
      }`}
    >
      {children}
    </a>
  );
}
