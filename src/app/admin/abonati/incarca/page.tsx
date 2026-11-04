import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBuletin } from "@/lib/buletin";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Încarcă abonați",
  robots: { index: false, follow: false },
};

/**
 * Încărcarea de mână a adreselor în lista de buletin.
 *
 * Adresele pleacă direct în MailerLite, în lista aleasă — acolo stă lista,
 * de acolo pleacă campaniile. Pe site rămâne doar urma: cine a încărcat, când
 * și de unde e acordul. Ruta e `/api/admin/abonati`.
 */

type Cautare = {
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

export default function PaginaIncarca({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="Încarcă abonați">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const cauta = await searchParams;
  const activ = "/admin/abonati/incarca";

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Încarcă abonați" activ={activ}>
        <p className="text-amplu text-cerneala-moale">Panoul nu e configurat.</p>
      </Cadru>
    );
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ={activ} faraMeniu>
        <Intrare gresit={Boolean(cauta.gresit)} unde={activ} />
      </Cadru>
    );
  }
  if (!(await arePermisiune(activ))) return <FaraDrept titlu="Încarcă abonați" activ={activ} />;

  return (
    <Cadru titlu="Încarcă abonați" activ={activ}>
      <p className="max-w-2xl text-amplu text-cerneala-moale">
        Pune adresele, câte una pe rând. Merge și cu virgulă între ele, și se poate lipi o
        coloană copiată din Excel. Pleacă direct în MailerLite, în lista aleasă, iar
        campaniile pleacă de acolo.
      </p>

      {!areBuletin() && (
        <p role="alert" className="mt-4 font-semibold text-caramiziu-700">
          MailerLite nu e legat (MAILERLITE_API_KEY), deci adresele n-ar avea unde să ajungă.
        </p>
      )}

      {cauta.adaugati !== undefined && (
        <div
          id="rezultat"
          role="status"
          className="mt-6 grid gap-1 colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-4 py-3 text-mic text-turcoaz-900"
        >
          <p className="font-semibold">
            {cauta.adaugati === "1" ? "O adresă încărcată" : `${cauta.adaugati} adrese încărcate`} la{" "}
            {cauta.lista === "firme" ? "firme" : "persoane fizice"}.
          </p>
          {cauta.deja && <p>{cauta.deja} erau deja abonate. Nu le-am urcat a doua oară.</p>}
          {cauta.dezabonati && (
            <p>Nu le-am pus înapoi, fiindcă s-au dezabonat sau n-au confirmat: {cauta.dezabonati}</p>
          )}
          {cauta.gresite && <p>Nu sunt adrese de e-mail: {cauta.gresite}</p>}
          {cauta.ratate && <p>MailerLite n-a răspuns pentru: {cauta.ratate}. Încearcă din nou cu ele.</p>}
          <p>
            <Link href="/admin/abonati" className="font-semibold underline underline-offset-2">
              Vezi câți abonați sunt acum
            </Link>
          </p>
        </div>
      )}

      <form action="/api/admin/abonati" method="post" className="mt-6 grid max-w-2xl gap-5 colt-a border border-hartie-umbra bg-hartie p-5">
        <fieldset className="grid gap-2">
          <legend className="mb-1 font-titlu text-mic font-bold text-cerneala">În ce listă</legend>
          <label className="flex items-start gap-2.5 rounded-lg border border-hartie-umbra px-3 py-2.5 has-checked:border-caramiziu-400 has-checked:bg-caramiziu-50">
            <input type="radio" name="lista" value="persoane" required defaultChecked className="mt-1" />
            <span>
              <strong className="font-titlu">Persoane fizice</strong>
              <span className="block text-nota text-cerneala-slab">Primesc campaniile pentru oameni.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 rounded-lg border border-hartie-umbra px-3 py-2.5 has-checked:border-caramiziu-400 has-checked:bg-caramiziu-50">
            <input type="radio" name="lista" value="firme" required className="mt-1" />
            <span>
              <strong className="font-titlu">Firme (persoane juridice)</strong>
              <span className="block text-nota text-cerneala-slab">Primesc campaniile pentru firme.</span>
            </span>
          </label>
          <span className="text-nota text-cerneala-slab">
            Dacă ai și persoane, și firme, încarcă-le în două rânduri: întâi unele, apoi celelalte.
          </span>
        </fieldset>

        <label className="grid gap-1">
          <span className="font-titlu text-mic font-bold">Adresele, câte una pe rând</span>
          <textarea
            name="adrese"
            required
            rows={8}
            placeholder={"maria@exemplu.ro\nion@exemplu.ro\nana@exemplu.ro"}
            className={`${CAMP} font-mono`}
          />
          <span className="text-nota text-cerneala-slab">
            Cel mult 200 o dată. Cele deja abonate nu se urcă a doua oară, iar cele repetate în
            listă se iau o singură dată.
          </span>
        </label>

        <label className="grid gap-1">
          <span className="font-titlu text-mic font-bold">De unde aveți acordul lor</span>
          <input
            name="acord_nota"
            required
            maxLength={300}
            placeholder="lista semnată la tabăra din iulie 2026"
            className={CAMP}
          />
          <span className="text-nota text-cerneala-slab">
            Se păstrează lângă fiecare adresă, cu numele tău.
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
            Încarcă în MailerLite
          </button>
        </div>
      </form>

      <p className="mt-4 max-w-2xl text-nota text-cerneala-slab">
        Cine s-a dezabonat vreodată nu se pune înapoi, nici dacă e pe o listă veche.
      </p>
    </Cadru>
  );
}
