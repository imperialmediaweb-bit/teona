import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { aparitiiPanou } from "@/lib/aparitii";
import { PUBLICATII } from "@/date/aparitii-presa";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import BazaCazuta from "@/componente/admin/BazaCazuta";
import { Butoane, CAMP, DeStiut, Eticheta, Mesaj, STARI_COMUNE } from "@/componente/admin/ListaPanou";

export const metadata: Metadata = { title: "Apariții în presă", robots: { index: false, follow: false } };

const CALE = "/admin/aparitii";
const STARI: Record<string, { text: string; bun: boolean }> = {
  ...STARI_COMUNE,
  publicatie: { text: "Scrie unde a apărut (ziarul, televiziunea, site-ul).", bun: false },
  titlu: { text: "Scrie titlul articolului sau al emisiunii.", bun: false },
  data: { text: "Scrie data, de exemplu „15 septembrie 2026”.", bun: false },
  an: { text: "În dată trebuie să fie și anul, de exemplu „15 septembrie 2026”.", bun: false },
  adresa: { text: "Linkul trebuie să înceapă cu https://. Copiază-l din bara browserului.", bun: false },
};
const NUME_CUNOSCUTE = Object.values(PUBLICATII).map((p) => p.nume);

type Cautare = Promise<{ gresit?: string; stare?: string }>;

export default function Pagina({ searchParams }: { searchParams: Cautare }) {
  return (
    <Suspense fallback={<Cadru titlu="Apariții în presă">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

function Campuri({ a }: { a?: { publicatie: string; data: string; titlu: string; adresa?: string } }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <Eticheta text="Unde a apărut" />
          <input name="publicatie" required maxLength={80} list="publicatii" defaultValue={a?.publicatie ?? ""} placeholder="Monitorul de Suceava" className={CAMP} />
        </label>
        <label className="grid gap-1.5">
          <Eticheta text="Data" nota="cu anul" />
          <input name="data" required maxLength={40} defaultValue={a?.data ?? ""} placeholder="15 septembrie 2026" className={CAMP} />
        </label>
      </div>
      <label className="grid gap-1.5">
        <Eticheta text="Titlul" />
        <input name="titlu" required maxLength={300} defaultValue={a?.titlu ?? ""} className={CAMP} />
      </label>
      <label className="grid gap-1.5">
        <Eticheta text="Linkul" nota="poate lipsi; fără link, cardul n-are buton" />
        <input name="adresa" type="url" maxLength={500} defaultValue={a?.adresa ?? ""} placeholder="https://" className={CAMP} />
      </label>
    </>
  );
}

async function Continut({ searchParams }: { searchParams: Cautare }) {
  await connection();
  const { gresit, stare } = await searchParams;
  if (!areParolaConfigurata()) {
    return <Cadru titlu="Apariții în presă" activ={CALE}><p>Panoul nu e configurat încă.</p></Cadru>;
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ={CALE} faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde={CALE} />
      </Cadru>
    );
  }
  if (!(await arePermisiune(CALE))) return <FaraDrept titlu="Apariții în presă" activ={CALE} />;
  if (!areBazaDeDate()) {
    return <Cadru titlu="Apariții în presă" activ={CALE}><p>Baza de date nu e pornită. Cere-i dezvoltatorului.</p></Cadru>;
  }
  const toate = await aparitiiPanou().catch(() => null);
  if (toate === null) {
    return <Cadru titlu="Apariții în presă" activ={CALE}><BazaCazuta ce="aparițiile" /></Cadru>;
  }

  return (
    <Cadru titlu="Apariții în presă" descriere="Lista de pe pagina „Suntem în presă”: articole, emisiuni, filmări." activ={CALE}>
      <Mesaj mesaj={stare ? STARI[stare] : undefined} />
      <datalist id="publicatii">
        {NUME_CUNOSCUTE.map((n) => <option key={n} value={n} />)}
      </datalist>
      <DeStiut>
        <li>O apariție nouă intră <strong>prima</strong> în listă. Ordinea de aici e ordinea de pe site; mută cu ↑ și ↓.</li>
        <li>La „Unde a apărut”, alege din listă ziarele știute: așa apare și sigla lor. Altfel se scrie numele.</li>
        <li>Un link de filmare de pe Facebook se arată în pagină, cu playerul.</li>
        <li>Nimic nu se șterge: „Scoate de pe site” o ascunde.</li>
      </DeStiut>

      <section className="mb-12">
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">Adaugă o apariție</h2>
        <form method="post" action="/api/admin/aparitii" className="mt-4 grid max-w-3xl gap-3 colt-a border border-hartie-umbra bg-hartie p-5">
          <Campuri />
          <div><button type="submit" className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800">Adaugă</button></div>
        </form>
      </section>

      <section>
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">Pe site · {toate.filter((a) => a.activ).length}</h2>
        <ul className="mt-4 grid gap-4">
          {toate.map((a, i) => (
            <li key={a.id}>
              <form method="post" action="/api/admin/aparitii" className={`grid max-w-3xl gap-3 colt-a border p-5 ${a.activ ? "border-hartie-umbra bg-hartie" : "border-hartie-umbra bg-hartie-calda opacity-70"}`}>
                <input type="hidden" name="id" value={a.id} />
                {!a.activ && <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">Scoasă — nu se vede pe site</p>}
                <Campuri a={a} />
                <Butoane activ={a.activ} primul={i === 0} ultimul={i === toate.length - 1} cine={a.titlu.slice(0, 40)} />
              </form>
            </li>
          ))}
        </ul>
      </section>
    </Cadru>
  );
}
