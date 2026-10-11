import Link from "next/link";
import { ASOCIATIA } from "@/date/asociatie";

/** Paginile panoului, în ordinea în care se folosesc. */
const PAGINI = [
  { href: "/admin", eticheta: "Tablou de bord" },
  { href: "/admin/donatori", eticheta: "Donatori" },
  { href: "/admin/firme", eticheta: "Firme" },
  { href: "/admin/cereri", eticheta: "Cereri" },
  { href: "/admin/campanii", eticheta: "Campanii" },
  { href: "/admin/email", eticheta: "Trimite un e-mail" },
] as const;

/**
 * Cadrul comun al panoului.
 *
 * Deliberat sobru și fără nimic din decorul site-ului: panoul e un instrument
 * de lucru, iar aici se văd nume, e-maile și sume. Cu cât seamănă mai puțin
 * cu pagina publică, cu atât mai greu e să confunzi una cu alta.
 */
export default function Cadru({
  titlu,
  activ,
  children,
}: {
  titlu: string;
  activ?: string;
  children: React.ReactNode;
}) {
  return (
    <div id="panou-admin" className="min-h-screen bg-hartie-calda">
      <div className="border-b border-hartie-umbra bg-hartie">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <span className="font-titlu font-extrabold text-caramiziu-700">
            {ASOCIATIA.denumire}
          </span>
          <nav aria-label="Panou" className="flex flex-wrap gap-x-5 gap-y-1">
            {PAGINI.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={activ === p.href ? "page" : undefined}
                className={`font-titlu text-mic font-bold transition-colors ${
                  activ === p.href
                    ? "text-caramiziu-700 underline underline-offset-4"
                    : "text-cerneala-moale hover:text-cerneala"
                }`}
              >
                {p.eticheta}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/*
        `div`, nu `main`.

        Paginile panoului se randează înăuntrul aspectului site-ului, care are
        deja `<main id="continut">`. Două `main` imbricate sunt HTML invalid,
        iar un cititor de ecran care sare „la conținutul principal” nu mai
        știe unde să ducă omul. Prins de proba automată, care a dat peste două
        elemente acolo unde se aștepta la unul.
      */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-h2 text-cerneala">{titlu}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
