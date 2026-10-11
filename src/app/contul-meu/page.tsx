import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { metadate } from "@/app/seo";
import { areBazaDeDate } from "@/lib/baza";
import { areConturi } from "@/lib/cont";
import { donatorulConectat } from "@/lib/sesiune";
import { contulMeu } from "@/lib/plati/donatori";
import { areEmail } from "@/lib/email/trimite";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";
import CereLink from "@/componente/cont/CereLink";
import PanouDonator from "@/componente/cont/PanouDonator";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Contul meu",
    descriere:
      "Vezi-ți donațiile către Asociația Teona Ariana Suceava. Intri cu un link trimis pe e-mail, fără parolă.",
    cale: "/contul-meu",
  }),
  // Pagina e a unui singur om și nu are ce căuta în Google.
  robots: { index: false, follow: false },
};

type Cautare = {
  expirat?: string;
  gata?: string;
  eroare?: string;
};

export default function PaginaContulMeu({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Schelet />}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Antetul paginii.
 *
 * Simplu dinadins: `AntetPagina` e un cap de pagină cu fotografie mare, bun
 * pentru paginile publice. Aici omul vine să-și vadă donațiile, nu să fie
 * convins de ceva — o fotografie de o jumătate de ecran l-ar ține doar
 * departe de ce caută.
 */
function Cap({ titlu, text }: { titlu: string; text?: string }) {
  return (
    <section className="relative bg-hartie-calda pt-14 pb-12 lg:pt-20 lg:pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-h1 text-cerneala">{titlu}</h1>
        {text && (
          <p className="mt-4 max-w-2xl text-amplu text-cerneala-moale">
            {text}
          </p>
        )}
      </div>
    </section>
  );
}

function Schelet() {
  return <Cap titlu="Contul meu" />;
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  await connection();
  const { expirat, gata, eroare } = await searchParams;

  const pornit = areBazaDeDate() && areConturi() && areEmail();
  const email = pornit ? await donatorulConectat() : null;
  const cont = email ? await contulMeu(email) : null;

  return (
    <>
      <Cap
        titlu={cont ? "Contul meu" : "Vezi-ți donațiile"}
        text={
          cont
            ? undefined
            : "Intri cu un link trimis pe e-mail. Fără parolă, fără cont de făcut."
        }
      />

      <section className="relative bg-hartie pt-10 pb-24 lg:pb-32">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {expirat && (
            <p
              role="alert"
              className="mb-8 colt-mic-a border-2 border-caramiziu-200 bg-caramiziu-50 px-5 py-4 text-mic text-caramiziu-900"
            >
              <strong className="font-titlu font-bold">
                Linkul nu mai e bun.
              </strong>{" "}
              Fie a fost deja folosit, fie au trecut cele 20 de minute. Cere
              altul mai jos — e la fel de simplu.
            </p>
          )}
          {gata === "abonat" && (
            <p
              role="status"
              className="mb-8 colt-mic-a border-2 border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-mic text-turcoaz-900"
            >
              Gata, te-am trecut pe lista buletinului informativ.
            </p>
          )}
          {gata === "dezabonat" && (
            <p
              role="status"
              className="mb-8 colt-mic-a border-2 border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-mic text-turcoaz-900"
            >
              Gata, nu mai primești buletinul informativ.
            </p>
          )}
          {eroare === "confirmare" && (
            <p
              role="alert"
              className="mb-8 colt-mic-a border-2 border-caramiziu-200 bg-caramiziu-50 px-5 py-4 text-mic text-caramiziu-900"
            >
              Ca să ștergem datele, scrie <strong>ȘTERGE</strong> în căsuța de
              confirmare. Nu putem anula o ștergere, de aceea o cerem scrisă.
            </p>
          )}

          {!pornit ? (
            <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-8">
              <p className="text-amplu text-cerneala-moale">
                Contul donatorului nu e încă pornit pe site-ul nou. Dacă vrei
                istoricul donațiilor tale, scrie-ne la{" "}
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="font-titlu font-semibold break-all text-caramiziu-700 underline underline-offset-4"
                >
                  {EMAIL.contact}
                </a>{" "}
                sau sună la{" "}
                <a
                  href={`tel:${TELEFON_PRINCIPAL.apel}`}
                  className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-4"
                >
                  {TELEFON_PRINCIPAL.afisat}
                </a>{" "}
                și ți-l trimitem noi.
              </p>
            </div>
          ) : cont ? (
            <PanouDonator cont={cont} />
          ) : email ? (
            /*
              Sesiune validă, dar nicio donație pe adresa asta. Se întâmplă
              după o ștergere de date: cookie-ul mai există, omul nu.
            */
            <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-8">
              <p className="text-amplu text-cerneala-moale">
                Nu găsim nicio donație pe adresa asta. Dacă ți-ai șters datele,
                asta e de așteptat — nu mai avem nimic legat de tine.
              </p>
              <form action="/api/cont/iesire" method="post" className="mt-5">
                <button
                  type="submit"
                  className="min-h-11 font-titlu text-mic font-bold text-cerneala underline underline-offset-4"
                >
                  Ieși din cont
                </button>
              </form>
            </div>
          ) : (
            <CereLink />
          )}
        </div>
      </section>
    </>
  );
}
