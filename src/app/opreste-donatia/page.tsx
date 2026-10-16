import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { metadate } from "@/app/seo";
import { EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { abonamentulDinLink } from "@/lib/oprire-lunara";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Oprește donația lunară",
    descriere:
      "Oprește-ți donația lunară către Asociația Teona Ariana Suceava.",
    cale: "/opreste-donatia",
  }),
  // Pagina e a unui singur om, deschisă cu un link semnat.
  robots: { index: false, follow: false },
};

/**
 * Oprirea donației lunare, din linkul trimis pe e-mail.
 *
 * **De ce o pagină cu buton și nu oprirea la deschiderea linkului.** Scanerele
 * de e-mail ale firmelor deschid din reflex toate adresele dintr-un mesaj, ca
 * să le verifice. Un link care ar opri donația pe GET s-ar opri singur,
 * înainte ca omul să citească mesajul — iar asociația ar pierde donatori fără
 * ca nimeni să apese nimic. De aceea linkul duce aici, iar oprirea se face
 * prin POST, de la un buton apăsat de un om.
 *
 * **De ce nu cere să intre în cont.** Semnătura din link dovedește deja atât
 * cât trebuie: că cel care a deschis-o a primit mesajul trimis pe adresa
 * donatorului. A-i mai cere și un link de intrare ar însemna încă două
 * e-mailuri pentru un gest pe care asociația îl face oricum la un telefon,
 * fără să întrebe de ce.
 */

type Cautare = { a?: string; p?: string; s?: string; eroare?: string };

export default function PaginaOprire({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Oprește donația lunară" />}>
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
      Scrie-ne la{" "}
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
      și o oprim noi, pe loc, fără să te întrebăm de ce.
    </p>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const cauta = await searchParams;
  const abonament = abonamentulDinLink(cauta);

  if (!abonament) {
    return (
      <Cadru titlu="Linkul nu mai e bun">
        <p className="mt-4 text-amplu text-cerneala-moale">
          Fie a trecut prea mult timp de când ți l-am trimis, fie adresa a fost
          tăiată pe drum de programul de e-mail. Donația lunară nu s-a oprit.
        </p>
        <p className="mt-4 text-amplu text-cerneala-moale">
          O poți opri singur din{" "}
          <Link
            href="/contul-meu"
            className="font-semibold text-caramiziu-700 underline underline-offset-4"
          >
            contul tău
          </Link>
          , fără parolă.
        </p>
        <Ajutor />
      </Cadru>
    );
  }

  if (cauta.eroare) {
    return (
      <Cadru titlu="N-am putut opri donația">
        <p className="mt-4 text-amplu text-cerneala-moale">
          Ceva n-a mers la procesatorul de plăți.{" "}
          <strong>Nu încerca de două ori</strong> — s-ar putea să se fi oprit
          totuși.
        </p>
        <Ajutor />
      </Cadru>
    );
  }

  return (
    <Cadru titlu="Oprești donația lunară?">
      <p className="mt-4 text-amplu text-cerneala-moale">
        Dacă apeși butonul, de atunci nu se mai ia nimic de pe cardul tău. Luna
        deja plătită rămâne donată.
      </p>
      <p className="mt-3 text-amplu text-cerneala-moale">
        Nu-ți cerem un motiv și nu-ți scriem după aceea ca să te răzgândești.
      </p>

      <form
        action="/api/cont/opreste"
        method="post"
        className="mt-7 flex flex-wrap items-center gap-4"
      >
        <input type="hidden" name="a" value={cauta.a ?? ""} />
        <input type="hidden" name="p" value={cauta.p ?? ""} />
        <input type="hidden" name="s" value={cauta.s ?? ""} />
        <button
          type="submit"
          className="min-h-11 rounded-full bg-cerneala px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-cerneala-moale"
        >
          Da, oprește donația lunară
        </button>
        <Link
          href={RUTE.acasa}
          className="min-h-11 font-titlu text-mic font-bold text-cerneala-moale underline underline-offset-4 hover:text-cerneala"
        >
          Nu, las-o așa
        </Link>
      </form>

      <p className="mt-7 border-t border-hartie-umbra pt-5 text-mic text-cerneala-moale">
        Dacă voiai doar să schimbi suma: oprește donația de aici și pornește
        alta,{" "}
        <Link
          href={RUTE.doneaza}
          className="font-semibold text-caramiziu-700 underline underline-offset-2"
        >
          cu cât vrei tu
        </Link>
        .
      </p>
    </Cadru>
  );
}
