import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { metadate } from "@/app/seo";
import { EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Intră în contul tău",
    descriere: "Deschide-ți contul de donator la Asociația Teona Ariana Suceava.",
    cale: "/contul-meu/intra",
  }),
  // Pagina e a unui singur om, deschisă cu un link semnat; jetonul din
  // adresă nu trebuie să plece spre alt site. **Nu `no-referrer`**: cu el,
  // Chrome trimite `Origin: null` la apăsarea butonului, iar filtrul
  // anti-CSRF refuză chiar formularul nostru (prins de probă).
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

/**
 * Capătul linkului din e-mail: o pagină cu un buton, nu intrarea pe loc.
 *
 * Până pe 4 noiembrie 2026 linkul deschidea contul la GET și stingea
 * jetonul. Scanerele de e-mail ale firmelor (Outlook Safe Links, Mimecast)
 * deschid din reflex toate adresele dintr-un mesaj, înaintea omului: jetonul
 * se consuma în scaner, iar omul vedea „linkul a expirat” — exact pe
 * adresele de firmă ale sponsorilor. Aceeași regulă ca la oprirea donației
 * și la răspunsul voluntarului: ce schimbă ceva se face prin POST, de la un
 * buton apăsat de un om (`/api/cont/intra`).
 */
export default function PaginaIntrare({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string }>;
}) {
  return (
    <section className="bg-hartie-calda py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-9">
          <h1 className="text-h2 text-cerneala">Intră în contul tău</h1>
          <Suspense fallback={null}>
            <Continut searchParams={searchParams} />
          </Suspense>
          <p className="mt-5 text-mic text-cerneala-moale">
            Dacă nu merge, scrie-ne la{" "}
            <a href={`mailto:${EMAIL.contact}`} className="font-semibold break-all text-caramiziu-700 underline underline-offset-2">
              {EMAIL.contact}
            </a>{" "}
            sau sună la{" "}
            <a href={`tel:${TELEFON_PRINCIPAL.apel}`} className="font-semibold text-caramiziu-700 underline underline-offset-2">
              {TELEFON_PRINCIPAL.afisat}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  // Jetonul e al cererii: numai la cerere, nu la pregenerare.
  await connection();
  const { jeton = "" } = await searchParams;
  return (
    <>
          {jeton ? (
            <>
              <p className="mt-4 text-amplu text-cerneala-moale">
                Apasă butonul și îți vezi donațiile. Linkul merge o singură
                dată și 20 de minute de când l-ai cerut.
              </p>
              <form action="/api/cont/intra" method="post" className="mt-7 flex flex-wrap items-center gap-4">
                <input type="hidden" name="jeton" value={jeton} />
                <button
                  type="submit"
                  className="min-h-11 rounded-full bg-cerneala px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-cerneala-moale"
                >
                  Intră în cont
                </button>
                <Link
                  href={RUTE.acasa}
                  className="min-h-11 font-titlu text-mic font-bold text-cerneala-moale underline underline-offset-4 hover:text-cerneala"
                >
                  Nu acum
                </Link>
              </form>
            </>
          ) : (
            <p className="mt-4 text-amplu text-cerneala-moale">
              Linkul e incomplet: adresa a fost tăiată pe drum de programul de
              e-mail. Cere altul din{" "}
              <Link href="/contul-meu" className="font-semibold text-caramiziu-700 underline underline-offset-4">
                contul tău
              </Link>
              .
            </p>
          )}
    </>
  );
}
