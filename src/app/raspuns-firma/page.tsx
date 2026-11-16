import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ASOCIATIA, EMAIL, TELEFOANE } from "@/date/asociatie";
import { interesValid } from "@/lib/mesaje-firme";

export const metadata: Metadata = {
  title: "Vă interesează",
  robots: { index: false, follow: false },
};

/**
 * Pagina din butonul „Da, ne interesează” din e-mailurile către firme. Ca la
 * „Nu mai doresc mesaje”, nimic nu se întâmplă la deschidere (scanerele de
 * e-mail deschid singure linkurile), ci la apăsarea butonului.
 */
type Cautare = { f?: string; s?: string; gata?: string; eroare?: string };

export default function PaginaRaspunsFirma({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <section className="bg-hartie-calda py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-9">
          <Suspense fallback={<h1 className="text-h2 text-cerneala">Vă interesează</h1>}>
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
  const contact = (
    <>
      {TELEFOANE[0].afisat} ·{" "}
      <a href={`mailto:${EMAIL.fundraising}`} className="font-semibold text-caramiziu-700 underline">
        {EMAIL.fundraising}
      </a>
    </>
  );
  if (gata) {
    return (
      <>
        <h1 className="text-h2 text-cerneala">Vă mulțumim. Vă contactăm în curând.</h1>
        <p className="mt-4 text-amplu text-cerneala-moale">Dacă doriți să vorbim mai repede: {contact}.</p>
      </>
    );
  }
  if (eroare || !interesValid(f, s)) {
    return (
      <>
        <h1 className="text-h2 text-cerneala">Linkul nu e întreg</h1>
        <p className="mt-4 text-amplu text-cerneala-moale">Răspundeți la e-mailul nostru sau scrieți-ne: {contact}.</p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-h2 text-cerneala">Vă interesează o sponsorizare?</h1>
      <p className="mt-4 text-amplu text-cerneala-moale">
        Apăsați butonul și vă contactăm noi, de la {ASOCIATIA.denumire}, cu pașii următori.
      </p>
      <form action="/api/firme/raspuns" method="post" className="mt-6">
        <input type="hidden" name="f" value={f} />
        <input type="hidden" name="s" value={s} />
        <button type="submit" className="rounded-full bg-caramiziu-700 px-6 py-3 font-titlu text-mic font-bold text-hartie hover:bg-caramiziu-800">
          Da, ne interesează
        </button>
      </form>
    </>
  );
}
