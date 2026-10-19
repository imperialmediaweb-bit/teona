import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { cautaPeste } from "@/lib/cautare";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Căutare",
  robots: { index: false, follow: false },
};

/**
 * Rezultatele căutării din bara panoului.
 *
 * Grupate pe feluri, nu amestecate după vreun scor: cine caută „Popescu” vrea
 * să vadă dintr-o privire dacă e donator, firmă sau om care a trimis un
 * formular — nu care dintre cele trei se potrivește cu 4% mai bine.
 */

const FELURI = [
  { id: "donator", eticheta: "Donatori" },
  { id: "firma", eticheta: "Firme" },
  { id: "cerere", eticheta: "Cereri" },
] as const;

export default function PaginaCautare({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Căutare">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gresit?: string }>;
}) {
  await connection();
  const { q = "", gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Căutare" activ="/admin/cauta">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/cauta">
        <Intrare gresit={Boolean(gresit)} unde="/admin" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/cauta"))) {
    return <FaraDrept titlu="Căutare" activ="/admin/cauta" />;
  }

  const cautat = q.trim();
  /*
    O căutare care cade trebuie să se vadă că a căzut.

    Prima versiune lăsa eroarea să treacă, iar pagina arăta exact ca atunci
    când nu găsise nimic — o interogare stricată s-a plimbat așa până a prins-o
    o probă. Un mesaj separat spune limpede că n-a fost căutat, nu că n-a fost
    găsit.
  */
  let gasite: Awaited<ReturnType<typeof cautaPeste>> = [];
  let aCazut = false;
  if (areBazaDeDate() && cautat.length >= 2) {
    try {
      gasite = await cautaPeste(cautat);
    } catch {
      aCazut = true;
    }
  }

  return (
    <Cadru
      titlu={cautat ? `Căutare: ${cautat}` : "Căutare"}
      descriere="Caută în donatori, firme și cereri, după nume, e-mail, telefon sau CUI."
      activ="/admin/cauta"
    >
      {aCazut ? (
        <p className="max-w-2xl text-amplu text-caramiziu-800">
          Căutarea n-a mers. Nu înseamnă că nu există nimic — înseamnă că n-am
          putut căuta. Încearcă din nou peste un minut.
        </p>
      ) : cautat.length < 2 ? (
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Scrie cel puțin două litere în câmpul de căutare din stânga.
        </p>
      ) : gasite.length === 0 ? (
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Nimic pentru „{cautat}”. Caut după nume, adresă de e-mail, telefon și
          CUI — dacă ai scris altceva, încearcă cu una dintre ele.
        </p>
      ) : (
        <div className="grid gap-9">
          {FELURI.map((fel) => {
            const ale = gasite.filter((g) => g.fel === fel.id);
            if (ale.length === 0) return null;
            return (
              <section key={fel.id}>
                <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                  {fel.eticheta} · {ale.length}
                </h2>
                <ul className="mt-3 grid gap-2">
                  {ale.map((g) => (
                    <li key={`${g.fel}-${g.unde}-${g.titlu}`}>
                      <Link
                        href={g.unde}
                        className="block colt-mic-a border border-hartie-umbra bg-hartie px-5 py-3.5 transition-colors hover:border-caramiziu-400"
                      >
                        <span className="block font-titlu font-semibold text-cerneala">
                          {g.titlu}
                        </span>
                        <span className="mt-0.5 block text-mic text-cerneala-moale">
                          {g.detaliu}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Cadru>
  );
}
