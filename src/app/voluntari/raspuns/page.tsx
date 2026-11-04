import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { metadate } from "@/app/seo";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { areBazaDeDate } from "@/lib/baza";
import { apelDupaId, linkRaspunsTine } from "@/lib/voluntari";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Răspunde la apelul pentru voluntari",
    descriere: "Spune-ne dacă poți veni ca voluntar.",
    cale: "/voluntari/raspuns",
  }),
  // Pagina e a unui singur om, deschisă cu un link semnat.
  robots: { index: false, follow: false },
};

/**
 * Răspunsul la un apel pentru voluntari, din linkul primit pe e-mail sau pe
 * WhatsApp.
 *
 * Răspunsul se dă cu un buton (POST), nu la deschiderea linkului: scanerele
 * de e-mail deschid toate adresele dintr-un mesaj. Pagina nu scrie numele
 * omului — linkul poate ajunge la altcineva; scrie doar apelul.
 */

type Cautare = { a?: string; c?: string; s?: string; r?: string; gata?: string };

export default function PaginaRaspuns({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Poți veni?" />}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

function Cadru({ titlu, children }: { titlu: string; children?: React.ReactNode }) {
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
      Ne poți răspunde și la{" "}
      <a
        href={`tel:${TELEFON_PRINCIPAL.apel}`}
        className="font-semibold text-caramiziu-700 underline underline-offset-2"
      >
        {TELEFON_PRINCIPAL.afisat}
      </a>{" "}
      sau la{" "}
      <a
        href={`mailto:${EMAIL.contact}`}
        className="font-semibold break-all text-caramiziu-700 underline underline-offset-2"
      >
        {EMAIL.contact}
      </a>
      .
    </p>
  );
}

const BUTON =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 font-titlu font-bold transition-colors";

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { a = "", c = "", s = "", r, gata } = await searchParams;

  if (!linkRaspunsTine(a, c, s) || !areBazaDeDate()) {
    return (
      <Cadru titlu="Linkul nu mai e bun">
        <p className="mt-4 text-amplu text-cerneala-moale">
          Adresa a fost probabil tăiată pe drum de programul de e-mail.
        </p>
        <Ajutor />
      </Cadru>
    );
  }

  const apel = await apelDupaId(a).catch(() => null);
  if (!apel) {
    return (
      <Cadru titlu="Apelul nu mai există">
        <Ajutor />
      </Cadru>
    );
  }

  const detalii = (
    <div className="mt-5 rounded-2xl bg-hartie-calda p-5">
      <p className="font-titlu text-amplu font-bold text-cerneala">{apel.titlu}</p>
      <p className="mt-1 text-cerneala-moale">Când: {apel.cand}</p>
      {apel.unde && <p className="text-cerneala-moale">Unde: {apel.unde}</p>}
    </div>
  );

  if (gata === "pot") {
    return (
      <Cadru titlu="Mulțumim. Te așteptăm.">
        {detalii}
        <p className="mt-5 text-amplu text-cerneala-moale">
          Ți-am notat răspunsul. Te sunăm sau îți scriem cu detaliile.
        </p>
        <Ajutor />
      </Cadru>
    );
  }
  if (gata === "nu-pot") {
    return (
      <Cadru titlu="Mulțumim că ne-ai spus">
        {detalii}
        <p className="mt-5 text-amplu text-cerneala-moale">
          Ți-am notat răspunsul. Te întrebăm și data viitoare. Dacă te
          răzgândești, deschide iar linkul.
        </p>
      </Cadru>
    );
  }

  const formular = (valoare: "pot" | "nu-pot", eticheta: string, plin: boolean) => (
    <form action="/api/voluntari/raspuns" method="post">
      <input type="hidden" name="a" value={a} />
      <input type="hidden" name="c" value={c} />
      <input type="hidden" name="s" value={s} />
      <button
        type="submit"
        name="raspuns"
        value={valoare}
        className={`${BUTON} ${
          plin
            ? "bg-caramiziu-700 text-hartie hover:bg-caramiziu-600"
            : "border-2 border-hartie-umbra text-cerneala hover:border-caramiziu-400"
        }`}
      >
        {eticheta}
      </button>
    </form>
  );

  return (
    <Cadru titlu="Poți veni?">
      {detalii}
      {apel.mesaj.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="mt-4 text-amplu whitespace-pre-line text-cerneala-moale">
          {p}
        </p>
      ))}
      {(gata === "gresit" || gata === "eroare") && (
        <p role="alert" className="mt-4 font-semibold text-caramiziu-700">
          N-am putut nota răspunsul. Încearcă din nou sau sună-ne.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {r === "nu-pot" ? (
          <>
            {formular("nu-pot", "Confirm: nu pot de data asta", true)}
            {formular("pot", "Pot veni", false)}
          </>
        ) : (
          <>
            {formular("pot", "Da, pot veni", true)}
            {formular("nu-pot", "Nu pot de data asta", false)}
          </>
        )}
      </div>
      <Ajutor />
    </Cadru>
  );
}
