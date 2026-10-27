import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { arePermisiune, esteAutentificat } from "@/lib/admin";
import { paginiCuTexte } from "@/lib/texte-pagini";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Pagini",
  robots: { index: false, follow: false },
};

/**
 * Paginile site-ului, fiecare cu ce se poate schimba pe ea.
 *
 * Înainte, ca să schimbi ceva pe „Despre noi”, trebuia să știi că textul e la
 * „Textele paginilor”, cifrele la „Cifrele”, iar sigla firmei la „Sponsori”.
 * Omul gândește invers: deschide pagina pe care o vede pe site și vrea să
 * vadă ce poate schimba acolo. Aici fiecare pagină e un card, cu butoane spre
 * fiecare lucru de pe ea. Paginile de editare sunt aceleași; s-a schimbat
 * doar drumul până la ele.
 */

type Lucru = { eticheta: string; href: string };

/** `texte` = numele paginii din `lib/texte-pagini.ts`, dacă are texte de schimbat. */
const PAGINI: ReadonlyArray<{
  nume: string;
  adresa: string;
  texte?: string;
  alte: readonly Lucru[];
}> = [
  {
    nume: "Prima pagină",
    adresa: "/",
    texte: "Prima pagină",
    alte: [
      { eticheta: "Cifrele", href: "/admin/cifre" },
      { eticheta: "Testimoniale", href: "/admin/testimoniale" },
      { eticheta: "Siglele sponsorilor", href: "/admin/sponsori" },
    ],
  },
  {
    nume: "Despre noi",
    adresa: "/despre-noi",
    texte: "Despre noi",
    alte: [{ eticheta: "Cifrele", href: "/admin/cifre" }],
  },
  { nume: "Casa Teona", adresa: "/casa-teona", texte: "Casa Teona", alte: [] },
  { nume: "Donează", adresa: "/doneaza", texte: "Donează", alte: [] },
  {
    nume: "Devino voluntar",
    adresa: "/devino-voluntar",
    texte: "Devino voluntar",
    alte: [],
  },
  {
    nume: "Redirecționează 3,5%",
    adresa: "/redirectioneaza-3-5",
    texte: "Redirecționează 3,5%",
    alte: [{ eticheta: "Documentele de descărcat", href: "/admin/documente" }],
  },
  {
    nume: "Direcționează 20% (firme)",
    adresa: "/directioneaza-20",
    texte: "Direcționează 20%",
    alte: [{ eticheta: "Contractul și Declarația 177", href: "/admin/documente" }],
  },
  {
    nume: "Sponsori și parteneri",
    adresa: "/sponsori-si-parteneri",
    texte: "Sponsori și parteneri",
    alte: [{ eticheta: "Siglele sponsorilor", href: "/admin/sponsori" }],
  },
  {
    nume: "Blog",
    adresa: "/noutati",
    alte: [{ eticheta: "Scrie pe blog", href: "/admin/scrie?fel=noutate" }],
  },
  {
    nume: "Campanii",
    adresa: "/campanii",
    alte: [{ eticheta: "Scrie o campanie", href: "/admin/scrie?fel=campanie" }],
  },
  {
    nume: "Tabere și proiecte",
    adresa: "/proiecte",
    alte: [
      { eticheta: "Descrierile taberelor", href: "/admin/scrie?fel=proiect" },
      { eticheta: "Pozele", href: "/admin/poze" },
    ],
  },
];

export default function PaginaPagini({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Pagini">Se încarcă…</Cadru>}>
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

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/pagini" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/pagini" />
      </Cadru>
    );
  }
  if (!(await arePermisiune("/admin/pagini"))) {
    return <FaraDrept titlu="Pagini" activ="/admin/pagini" />;
  }

  const cuTexte = new Set(paginiCuTexte());

  return (
    <Cadru
      titlu="Pagini"
      descriere="Alege pagina pe care vrei s-o schimbi. Pe fiecare card e tot ce se poate schimba pe ea."
      activ="/admin/pagini"
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PAGINI.map((p) => {
          const butoane: Lucru[] = [
            ...(p.texte && cuTexte.has(p.texte)
              ? [
                  {
                    eticheta: "Textele",
                    href: `/admin/texte?pagina=${encodeURIComponent(p.texte)}`,
                  },
                ]
              : []),
            ...p.alte,
          ];
          return (
            <li
              key={p.nume}
              className="flex flex-col rounded-2xl border border-hartie-umbra bg-hartie p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-titlu text-amplu font-bold text-cerneala">
                  {p.nume}
                </h2>
                <a
                  href={p.adresa}
                  target="_blank"
                  rel="noopener"
                  className="shrink-0 font-titlu text-nota font-semibold text-cerneala-slab hover:text-caramiziu-700"
                >
                  Vezi pe site ↗
                </a>
              </div>
              <p className="mt-0.5 text-nota text-cerneala-slab">
                teona-ariana.ro{p.adresa === "/" ? "" : p.adresa}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {butoane.map((b, i) => (
                  <Link
                    key={b.href + b.eticheta}
                    href={b.href}
                    prefetch={false}
                    className={`rounded-full px-4 py-2 font-titlu text-mic font-bold transition-colors ${
                      i === 0
                        ? "bg-caramiziu-700 text-hartie hover:bg-caramiziu-800"
                        : "border border-hartie-umbra text-cerneala hover:border-caramiziu-400"
                    }`}
                  >
                    {b.eticheta}
                  </Link>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </Cadru>
  );
}
