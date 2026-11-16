import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";

export const metadata: Metadata = {
  title: "Nu mai doresc mesaje",
  robots: { index: false, follow: false },
};

/**
 * Dezabonarea pentru e-mailurile trimise de mână, din căsuța obișnuită:
 * linkul `teona-ariana.ro/nu-mai-doresc` (eventual cu `?email=`) se pune la
 * finalul mesajului. Omul își vede adresa și apasă butonul.
 */
type Cautare = { email?: string; gata?: string; gresit?: string; eroare?: string };

export default function PaginaNuMaiDoresc({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <section className="bg-hartie-calda py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-9">
          <Suspense fallback={<h1 className="text-h2 text-cerneala">Nu mai doresc mesaje</h1>}>
            <Continut searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { email = "", gata, gresit, eroare } = await searchParams;
  if (gata) {
    return (
      <>
        <h1 className="text-h2 text-cerneala">Gata. Nu vă mai scriem.</h1>
        <p className="mt-4 text-amplu text-cerneala-moale">
          Nu mai primiți e-mailuri de la {ASOCIATIA.denumire} pe această adresă. Dacă v-ați răzgândit, scrieți-ne la{" "}
          <a href={`mailto:${EMAIL.contact}`} className="font-semibold text-caramiziu-700 underline">{EMAIL.contact}</a>.
        </p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-h2 text-cerneala">Nu mai doriți mesaje de la noi?</h1>
      <p className="mt-4 text-amplu text-cerneala-moale">
        Scrieți adresa pe care v-am scris și apăsați butonul. {ASOCIATIA.denumire} nu vă mai trimite e-mailuri.
      </p>
      {gresit && <p role="alert" className="mt-4 text-mic font-semibold text-caramiziu-800">Adresa nu e scrisă corect.</p>}
      {eroare && <p role="alert" className="mt-4 text-mic font-semibold text-caramiziu-800">N-a mers acum. Scrieți-ne la {EMAIL.contact} și nu vă mai scriem.</p>}
      <form action="/api/firme/nu-mai-doresc" method="post" className="mt-6 grid gap-3 sm:max-w-md">
        <input
          name="email"
          type="email"
          required
          defaultValue={email.slice(0, 254)}
          placeholder="adresa@firma.ro"
          aria-label="Adresa de e-mail"
          className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-2.5 text-cerneala"
        />
        <div>
          <button type="submit" className="rounded-full bg-caramiziu-700 px-6 py-3 font-titlu text-mic font-bold text-hartie hover:bg-caramiziu-800">
            Nu mai doresc mesaje
          </button>
        </div>
      </form>
    </>
  );
}
