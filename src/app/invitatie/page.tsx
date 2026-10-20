import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { metadate } from "@/app/seo";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { dinLinkulDeInvitatie } from "@/lib/invitatie";
import { MINIM_PAROLA } from "@/lib/utilizatori";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Îți pui parola",
    descriere: "Pune-ți parola pentru panoul Asociației Teona Ariana Suceava.",
    cale: "/invitatie",
  }),
  // Pagina e a unui singur om, deschisă cu un link semnat.
  robots: { index: false, follow: false },
};

/**
 * Pagina pe care omul invitat își pune parola.
 *
 * **Nu scrie numele nimănui, nici adresa.** Linkul poate ajunge greșit — pe un
 * telefon de serviciu, într-o conversație retrimisă. O pagină care ar scrie
 * „Bună, Mihaela" i-ar spune străinului pe cine a nimerit și unde lucrează.
 * Omul potrivit știe oricum că e el: el a primit mesajul.
 *
 * **Nu spune dacă linkul a fost bun și a expirat, sau n-a fost bun niciodată.**
 * Amândouă arată la fel. Diferența n-ar ajuta pe nimeni care are dreptul să
 * fie aici și ar spune cuiva care n-are dreptul că a nimerit un cont adevărat.
 *
 * **Nu arată rolul contului.** Se vede după ce intră.
 */

type Cautare = {
  u?: string;
  i?: string;
  p?: string;
  s?: string;
  gresit?: string;
};

export default function PaginaInvitatie({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Îți pui parola" />}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

function Cadru({
  titlu,
  children,
}: {
  titlu: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-hartie-calda py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-9">
          <h1 className="text-h2 text-cerneala">{titlu}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}

function Ajutor() {
  return (
    <p className="mt-5 text-mic text-cerneala-moale">
      Scrie la{" "}
      <a
        href={`mailto:${EMAIL.contact}`}
        className="font-semibold break-all text-caramiziu-700 underline underline-offset-2"
      >
        {EMAIL.contact}
      </a>{" "}
      sau sună la{" "}
      <a
        href={`tel:${TELEFON_PRINCIPAL.apel}`}
        className="font-semibold text-caramiziu-700 underline underline-offset-2"
      >
        {TELEFON_PRINCIPAL.afisat}
      </a>{" "}
      și ți se trimite altul.
    </p>
  );
}

const MESAJE: Record<string, string> = {
  scurta: `Parola are nevoie de cel puțin ${MINIM_PAROLA} semne.`,
  diferite: "Cele două parole scrise nu sunt la fel.",
  folosit:
    "Linkul ăsta a fost deja folosit, sau contul a fost oprit între timp. Dacă tu ți-ai pus parola, intră direct în panou.",
  necunoscut: "N-a mers. Mai încearcă o dată.",
};

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const cauta = await searchParams;
  const invitatie = dinLinkulDeInvitatie(cauta);

  if (!invitatie) {
    return (
      <Cadru titlu="Linkul nu mai e bun">
        <p className="mt-4 text-amplu text-cerneala-moale">
          Fie a trecut mai mult de o săptămână de când a fost trimis, fie între
          timp a plecat altul, fie adresa a fost tăiată pe drum de programul de
          e-mail.
        </p>
        <Ajutor />
      </Cadru>
    );
  }

  const gresit = cauta.gresit ? MESAJE[cauta.gresit] : undefined;

  return (
    <Cadru titlu="Îți pui parola">
      <p className="mt-4 text-amplu text-cerneala-moale">
        O alegi tu. După ce o salvezi, n-o mai știe nimeni altcineva — nici cel
        care ți-a făcut contul.
      </p>

      {gresit && (
        <p
          role="alert"
          className="mt-5 colt-mic-b border-t-4 border-caramiziu-600 bg-caramiziu-50 p-4 font-titlu font-bold text-caramiziu-800"
        >
          {gresit}
        </p>
      )}

      <form action="/api/invitatie" method="post" className="mt-6 grid gap-4">
        {/*
          Dovada merge mai departe prin formular, nu prin adresă.

          Pe POST nu ajunge în istoricul browserului și nici în jurnalul
          serverului, cum ar ajunge un link deschis.
        */}
        <input type="hidden" name="u" value={cauta.u ?? ""} />
        <input type="hidden" name="i" value={cauta.i ?? ""} />
        <input type="hidden" name="p" value={cauta.p ?? ""} />
        <input type="hidden" name="s" value={cauta.s ?? ""} />

        <label className="grid gap-1.5">
          <span className="font-titlu text-mic font-bold text-cerneala">
            Parola nouă{" "}
            <span className="font-normal text-cerneala-slab">
              — cel puțin {MINIM_PAROLA} semne
            </span>
          </span>
          <input
            name="parola"
            type="password"
            autoComplete="new-password"
            required
            minLength={MINIM_PAROLA}
            className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="font-titlu text-mic font-bold text-cerneala">
            Încă o dată
          </span>
          <input
            name="iar"
            type="password"
            autoComplete="new-password"
            required
            minLength={MINIM_PAROLA}
            className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
          />
        </label>

        <div>
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-700 sm:w-auto"
          >
            Salvează parola
          </button>
        </div>

        <p className="text-nota text-cerneala-slab">
          O parolă lungă dintr-o frază pe care o ții minte e mai bună decât una
          scurtă cu semne ciudate. Nu o scrie nimănui.
        </p>
      </form>
    </Cadru>
  );
}
