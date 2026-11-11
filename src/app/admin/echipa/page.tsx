import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areCloudinary } from "@/lib/poza-urcata";
import { echipaPanou } from "@/lib/echipa";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import BazaCazuta from "@/componente/admin/BazaCazuta";
import { Butoane, CAMP, DeStiut, Eticheta, Mesaj, STARI_COMUNE } from "@/componente/admin/ListaPanou";

export const metadata: Metadata = { title: "Echipa", robots: { index: false, follow: false } };

const CALE = "/admin/echipa";
const STARI: Record<string, { text: string; bun: boolean }> = {
  ...STARI_COMUNE,
  nume: { text: "Scrie numele omului.", bun: false },
  imagine: { text: "Fișierul nu e o fotografie. Merg JPG, PNG și WebP.", bun: false },
  mare: { text: "Fotografia e prea mare.", bun: false },
  depozit: { text: "Locul pozelor nu e pornit. Cere-i dezvoltatorului.", bun: false },
  urcare: { text: "Fotografia n-a urcat acum. Încearcă din nou peste un minut.", bun: false },
};

type Cautare = Promise<{ gresit?: string; stare?: string }>;

export default function Pagina({ searchParams }: { searchParams: Cautare }) {
  return (
    <Suspense fallback={<Cadru titlu="Echipa">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

function initiale(nume: string) {
  return nume.split(" ").map((c) => c[0]).join("");
}

async function Continut({ searchParams }: { searchParams: Cautare }) {
  await connection();
  const { gresit, stare } = await searchParams;
  if (!areParolaConfigurata()) {
    return <Cadru titlu="Echipa" activ={CALE}><p>Panoul nu e configurat încă.</p></Cadru>;
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ={CALE} faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde={CALE} />
      </Cadru>
    );
  }
  if (!(await arePermisiune(CALE))) return <FaraDrept titlu="Echipa" activ={CALE} />;
  if (!areBazaDeDate()) {
    return <Cadru titlu="Echipa" activ={CALE}><p>Baza de date nu e pornită. Cere-i dezvoltatorului.</p></Cadru>;
  }
  const toti = await echipaPanou().catch(() => null);
  if (toti === null) {
    return <Cadru titlu="Echipa" activ={CALE}><BazaCazuta ce="echipa" /></Cadru>;
  }
  const poze = areCloudinary();
  const fisier =
    "colt-mic-a border-2 border-hartie-umbra bg-hartie px-3 py-2 text-mic min-w-0 file:mr-3 file:border-0 file:bg-transparent file:font-titlu file:font-bold file:text-caramiziu-700";

  return (
    <Cadru titlu="Echipa" descriere="Oamenii de pe pagina „Despre noi”, cu poză, rol și o frază." activ={CALE}>
      <Mesaj mesaj={stare ? STARI[stare] : undefined} />
      <DeStiut>
        <li>Ordinea de aici e ordinea de pe site. Mută cu ↑ și ↓.</li>
        <li>Fără poză, cardul arată inițialele. Poza se micșorează singură; una de la telefon e bună.</li>
        <li>Nimic nu se șterge: „Scoate de pe site” ascunde omul, „Pune înapoi” îl aduce.</li>
      </DeStiut>

      <section className="mb-12">
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">Adaugă un om</h2>
        <form method="post" action="/api/admin/echipa" encType="multipart/form-data" className="mt-4 grid max-w-3xl gap-3 colt-a border border-hartie-umbra bg-hartie p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5"><Eticheta text="Numele" /><input name="nume" required maxLength={80} className={CAMP} /></label>
            <label className="grid gap-1.5"><Eticheta text="Rolul" nota="poate rămâne gol" /><input name="rol" maxLength={80} placeholder="Manager fundraising" className={CAMP} /></label>
          </div>
          <label className="grid gap-1.5"><Eticheta text="O frază despre el" nota="poate rămâne goală" /><textarea name="descriere" maxLength={400} rows={3} className={CAMP} /></label>
          {poze && <label className="grid gap-1.5"><Eticheta text="Poza" nota="poate lipsi" /><input type="file" name="poza" accept="image/jpeg,image/png,image/webp" className={fisier} /></label>}
          <div><button type="submit" className="colt-mic-a bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-800">Adaugă</button></div>
        </form>
      </section>

      <section>
        <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">Pe site · {toti.filter((m) => m.activ).length}</h2>
        <ul className="mt-4 grid gap-4">
          {toti.map((m, i) => (
            <li key={m.id}>
              <form method="post" action="/api/admin/echipa" encType="multipart/form-data" className={`grid gap-4 colt-a border p-5 sm:grid-cols-[7rem_1fr] ${m.activ ? "border-hartie-umbra bg-hartie" : "border-hartie-umbra bg-hartie-calda opacity-70"}`}>
                <input type="hidden" name="id" value={m.id} />
                <div className="relative size-28 overflow-hidden rounded-full border-4 border-hartie-umbra bg-hartie-calda">
                  {m.poza ? (
                    <Image src={m.poza} alt={`${m.nume}`} fill sizes="112px" className="object-cover object-top" />
                  ) : (
                    <span aria-hidden="true" className="flex h-full items-center justify-center font-titlu text-h3 font-extrabold text-cerneala-slab">{initiale(m.nume)}</span>
                  )}
                </div>
                <div className="grid min-w-0 gap-3">
                  {!m.activ && <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">Scos — nu se vede pe site</p>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5"><Eticheta text="Numele" /><input name="nume" required maxLength={80} defaultValue={m.nume} className={CAMP} /></label>
                    <label className="grid gap-1.5"><Eticheta text="Rolul" /><input name="rol" maxLength={80} defaultValue={m.rol ?? ""} className={CAMP} /></label>
                  </div>
                  <label className="grid gap-1.5"><Eticheta text="O frază despre el" /><textarea name="descriere" maxLength={400} rows={3} defaultValue={m.descriere ?? ""} className={CAMP} /></label>
                  {poze && <label className="grid gap-1.5"><Eticheta text={m.poza ? "Altă poză" : "Pune o poză"} nota="lasă gol ca să rămână cum e" /><input type="file" name="poza" accept="image/jpeg,image/png,image/webp" className={fisier} /></label>}
                  <Butoane activ={m.activ} primul={i === 0} ultimul={i === toti.length - 1} cine={m.nume} />
                </div>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </Cadru>
  );
}
