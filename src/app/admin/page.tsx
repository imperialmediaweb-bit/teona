import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { numeleMetodei, rezumat } from "@/lib/plati/donatori";
import {
  apasariPeLuna,
  cereriDeLucru,
  palniaFirmelor,
  peDestinatii,
  peFrecventa,
  peLuni,
  peMetode,
} from "@/lib/statistici";
import { FELURI_CERERE, STADII_FIRMA } from "@/lib/crm";
import { DESTINATII_DONATIE } from "@/date/asociatie";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import {
  Card,
  Cifra,
  Coloane,
  DonatoriNoi,
  Felii,
  Palnie,
} from "@/componente/admin/Grafice";

export const metadata: Metadata = {
  title: "Tabloul de bord",
  robots: { index: false, follow: false },
};

/** Numele citibil al unei destinații; dacă apare una nouă, se arată ca atare. */
function numeleDestinatiei(id: string): string {
  return DESTINATII_DONATIE.find((d) => d.id === id)?.eticheta ?? id;
}

export default function PaginaTablou({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Tabloul de bord">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
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
      <Cadru titlu="Tabloul de bord" activ="/admin">
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
      <Cadru titlu="Tabloul de bord" activ="/admin">
        <Intrare gresit={Boolean(gresit)} unde="/admin" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Tabloul de bord" activ="/admin">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Fără baza de date nu există nici donații, nici firme, nici cereri de
          arătat.
        </p>
      </Cadru>
    );
  }

  const [
    cifre,
    luni,
    destinatii,
    metode,
    frecvente,
    palnie,
    deLucru,
    apasari,
  ] = await Promise.all([
    rezumat(),
    peLuni(12),
    peDestinatii(),
    peMetode(),
    peFrecventa(),
    palniaFirmelor(),
    cereriDeLucru(),
    apasariPeLuna(6),
  ]);

  const nrPalnie = new Map(palnie.map((p) => [p.stadiu, p.nr]));
  const nrDeLucru = new Map(deLucru.map((c) => [c.fel, c.nr]));
  const totalDeLucru = deLucru.reduce((s, c) => s + c.nr, 0);
  const lunar = frecvente.find((f) => f.eticheta === "Lunar")?.bani ?? 0;
  const totalFrecvente = frecvente.reduce((s, f) => s + f.bani, 0);

  return (
    <Cadru titlu="Tabloul de bord" activ="/admin">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Total strâns"
          valoare={scrieSuma(cifre.totalBani / 100)}
          nota="Toate donațiile încasate"
        />
        <Cifra
          eticheta="Luna asta"
          valoare={scrieSuma(cifre.lunaAsta / 100)}
          culoare="turcoaz"
        />
        <Cifra
          eticheta="Donatori"
          valoare={String(cifre.donatori)}
          nota={`${cifre.lunari} cu donație lunară`}
          culoare="miere"
        />
        <Cifra
          eticheta="De rezolvat"
          valoare={String(totalDeLucru)}
          nota="Cereri care așteaptă un răspuns"
          culoare="cerneala"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 lg:col-span-2">
          <Card
            titlu="Cât a intrat, lună de lună"
            nota="Ultimele 12 luni, inclusiv cele în care n-a intrat nimic."
          >
            <Coloane date={luni} />
          </Card>
        </div>

        <Card
          titlu="Donatori noi"
          nota="Oameni la prima lor donație. Arată dacă asociația crește sau se bazează pe aceiași."
        >
          <DonatoriNoi date={luni} />
        </Card>

        <Card
          titlu="Pe ce se duc banii"
          nota="Destinația aleasă de donator."
        >
          <Felii
            date={destinatii}
            titlu="Donații pe destinații"
            nume={numeleDestinatiei}
          />
        </Card>

        <Card titlu="Pe ce cale intră" nota="Inclusiv ce s-a trecut de mână.">
          <Felii
            date={metode}
            titlu="Donații pe metode de plată"
            nume={numeleMetodei}
          />
        </Card>

        <Card
          titlu="Venit previzibil"
          nota={
            totalFrecvente > 0
              ? `${Math.round((lunar / totalFrecvente) * 100)}% din bani vin din donații lunare.`
              : undefined
          }
        >
          <Felii date={frecvente} titlu="O dată față de lunar" />
        </Card>

        <Card
          titlu="Sponsorizări de la firme"
          nota="Unde a ajuns fiecare firmă."
        >
          <Palnie
            date={STADII_FIRMA.map((s) => ({
              eticheta: s.eticheta,
              nr: nrPalnie.get(s.id) ?? 0,
              culoare: {
                miere: "bg-miere-400",
                turcoaz: "bg-turcoaz-500",
                caramiziu: "bg-caramiziu-500",
                cerneala: "bg-cerneala-slab",
              }[s.culoare],
            }))}
          />
          <Link
            href="/admin/firme"
            className="mt-4 inline-block font-titlu text-mic font-bold text-caramiziu-700 underline underline-offset-4"
          >
            Vezi firmele
          </Link>
        </Card>

        <Card
          titlu="Cereri care așteaptă"
          nota="Nerezolvate, pe fel."
        >
          <ul className="grid gap-2">
            {FELURI_CERERE.map((f) => (
              <li
                key={f.id}
                className="flex items-baseline justify-between gap-3 border-b border-hartie-umbra pb-2 last:border-0"
              >
                <span className="text-mic text-cerneala-moale">
                  {f.eticheta}
                </span>
                <span className="font-titlu text-amplu font-bold text-cerneala">
                  {nrDeLucru.get(f.id) ?? 0}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/cereri"
            className="mt-4 inline-block font-titlu text-mic font-bold text-caramiziu-700 underline underline-offset-4"
          >
            Vezi cererile
          </Link>
        </Card>

        {apasari.length > 0 && (
          <Card
            titlu="Apăsări pe linkurile din afară"
            nota="Revolut și Galantom nu trec prin site, deci asta e intenția, nu donația. Nu se adună la total."
          >
            <ul className="grid gap-2">
              {apasari.map((a) => (
                <li
                  key={a.ce}
                  className="flex items-baseline justify-between gap-3 border-b border-hartie-umbra pb-2 last:border-0"
                >
                  <span className="text-mic text-cerneala-moale">{a.ce}</span>
                  <span className="font-titlu text-amplu font-bold text-cerneala">
                    {a.nr}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Cadru>
  );
}
