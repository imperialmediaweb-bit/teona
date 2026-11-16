import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { refuzValid } from "@/lib/mesaje-firme";

export const metadata: Metadata = {
  title: "Nu mai doresc mesaje",
  robots: { index: false, follow: false },
};

/**
 * Pagina din linkul „Nu mai doresc mesaje” din e-mailurile către firme.
 * Oprirea se face la apăsarea butonului (POST), nu la deschidere: scanerele
 * de e-mail ale firmelor deschid singure toate linkurile dintr-un mesaj.
 */
type Cautare = { f?: string; s?: string; gata?: string; eroare?: string };

export default function PaginaNuMaiScrie({ searchParams }: { searchParams: Promise<Cautare> }) {
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
  const { f = "", s = "", gata, eroare } = await searchParams;
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
  if (eroare || !refuzValid(f, s)) {
    return (
      <>
        <h1 className="text-h2 text-cerneala">Linkul nu e întreg</h1>
        <p className="mt-4 text-amplu text-cerneala-moale">
          Răspundeți la e-mailul nostru cu „NU” sau scrieți-ne la{" "}
          <a href={`mailto:${EMAIL.contact}`} className="font-semibold text-caramiziu-700 underline">{EMAIL.contact}</a> și nu vă mai scriem.
        </p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-h2 text-cerneala">Nu mai doriți mesaje de la noi?</h1>
      <p className="mt-4 text-amplu text-cerneala-moale">
        Apăsați butonul și {ASOCIATIA.denumire} nu vă mai trimite e-mailuri.
      </p>
      <form action="/api/firme/nu-mai-scrie" method="post" className="mt-6">
        <input type="hidden" name="f" value={f} />
        <input type="hidden" name="s" value={s} />
        <button type="submit" className="rounded-full bg-caramiziu-700 px-6 py-3 font-titlu text-mic font-bold text-hartie hover:bg-caramiziu-800">
          Nu mai doresc mesaje
        </button>
      </form>
    </>
  );
}
