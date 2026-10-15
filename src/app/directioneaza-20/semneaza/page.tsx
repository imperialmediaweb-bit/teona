import type { Metadata } from "next";
import Link from "next/link";
import { ASOCIATIA, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import AntetPagina from "@/componente/pagina/AntetPagina";
import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";
import FormularContractOnline from "@/componente/formular/FormularContractOnline";

export const metadata: Metadata = metadate({
  titlu: "Semnează contractul de sponsorizare online",
  descriere:
    "Completează contractul de sponsorizare cu datele firmei tale, semnează pe ecran și primești pe loc documentul pe e-mail. Asociația Teona Ariana Suceava.",
  cale: "/directioneaza-20/semneaza",
});

/**
 * Semnarea online a contractului de sponsorizare.
 *
 * Pagina pentru firme (8) explica cele două căi și dădea documentele de
 * descărcat. Drumul scurt lipsea: completezi, semnezi, gata. Aici e.
 *
 * **Modelele rămân la vedere, nu îngropate.** Cine vrea semnătură calificată
 * sau hârtie tipărită are linkurile sus, înaintea formularului — nu după el.
 * O pagină care te duce spre o singură cale, pentru că celelalte sunt mai jos,
 * nu e o alegere.
 */
export default function Semneaza() {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Direcționează 20%", cale: RUTE.directionare20 },
          {
            nume: "Semnează contractul",
            cale: `${RUTE.directionare20}/semneaza`,
          },
        ])}
      />

      <AntetPagina
        scris="Pentru firme"
        titlu="Semnează contractul de sponsorizare"
        subtitlu="Scrie CUI-ul și completează suma — îți dăm contractul gata scris, în Word sau PDF. Îl semnezi cum vrei și ni-l trimiți; îl contrasemnăm și ți-l trimitem înapoi."
        accent="turcoaz"
        poza={{
          cale: "/poze/2024/11/459590851_545309534736056_5697611419655887236_n.jpg",
          alt: "Copii în tricouri albe țin litere colorate care formează „Mulțumim Egger”, între două bannere ale asociației, în fața pensiunii din tabără",
          legenda: "Mulțumim sponsorilor",
        }}
      />

      <section className="relative overflow-hidden bg-hartie pt-4 pb-24 lg:pt-8 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor
            semn="spirala"
            className="pluteste-lent absolute top-20 right-[4%] size-10 text-turcoaz-200 lg:size-14"
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/*
            Celelalte două căi, înaintea formularului. Cine are certificat
            calificat sau cine vrea hârtie nu trebuie să citească tot
            formularul ca să afle că se putea și altfel.
          */}
          {/*
            Contractul, de citit înainte de semnat.

            Formularul cere, cu o bifă, „am citit contractul”. O bifă care
            spune asta pe o pagină unde contractul nu se vede nicăieri e o
            minciună politicoasă. Linkul stă primul, deschide documentul într-o
            filă nouă și e același text care iese semnat.
          */}
          <a
            href="/documente/contract-de-sponsorizare.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-4 colt-mic-b border-2 border-turcoaz-300 bg-turcoaz-50 px-5 py-4 font-titlu font-bold text-turcoaz-900 transition-colors hover:border-turcoaz-500"
          >
            <span>Citește contractul înainte să semnezi (se deschide în filă nouă)</span>
            <Pictograma
              nume="document"
              aria-hidden="true"
              className="size-5 shrink-0"
            />
          </a>

          <div className="mt-6 colt-b border border-hartie-umbra bg-hartie-calda p-6 sm:p-7">
            <h2 className="font-titlu text-amplu font-bold text-cerneala">
              Preferi altfel?
            </h2>
            <ul className="mt-3 grid gap-2 text-cerneala-moale">
              <li className="flex items-start gap-2.5">
                <Pictograma
                  nume="document"
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-caramiziu-700"
                />
                <span>
                  <a
                    href="/api/contract/descarca"
                    download
                    className="font-titlu font-bold text-caramiziu-700 underline-offset-4 hover:underline"
                  >
                    Descarcă modelul gol, în Word
                  </a>{" "}
                  — pentru cine preferă să-l completeze singur. Formularul de
                  mai jos ți-l dă completat cu datele firmei.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Pictograma
                  nume="document"
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-caramiziu-700"
                />
                <span>
                  <a
                    href="/documente/contract-de-sponsorizare.pdf"
                    download
                    className="font-titlu font-bold text-caramiziu-700 underline-offset-4 hover:underline"
                  >
                    Descarcă-l în PDF
                  </a>
                  , tipărește-l și semnează-l cu pixul.
                </span>
              </li>
            </ul>
            <p className="mt-4 text-mic text-cerneala-slab">
              Orice nelămurire, sună la {TELEFON_PRINCIPAL.afisat} sau scrie la{" "}
              {EMAIL.contact}. Vezi și{" "}
              <Link
                href={RUTE.directionare20}
                className="font-titlu font-semibold text-caramiziu-700 underline-offset-4 hover:underline"
              >
                pagina pentru firme
              </Link>
              , cu calculatorul și cele două căi.
            </p>
          </div>

          <div className="mt-8">
            <FormularContractOnline />
          </div>

          <p className="mt-6 max-w-2xl text-mic text-cerneala-slab">
            Datele din formular ajung la {ASOCIATIA.denumire} și se folosesc
            pentru încheierea contractului. Contractul semnat se păstrează la
            asociație, împreună cu ora semnării și adresa IP de la care a fost
            dată — fără ele, o semnătură electronică simplă n-ar putea fi
            dovedită mai târziu.
          </p>
        </div>
      </section>
    </>
  );
}
