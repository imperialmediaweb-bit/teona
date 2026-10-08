import type { Metadata } from "next";
import Link from "next/link";
import {
  ASOCIATIA,
  CONTACT_FIRME,
  CONTURI,
  EMAIL,
  RUTE,
} from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import DeCopiat from "@/componente/pagina/DeCopiat";
import DocumentDeDescarcat from "@/componente/pagina/DocumentDeDescarcat";
import Intrebari from "@/componente/pagina/Intrebari";

export const metadata: Metadata = {
  title: "Direcționează 20%",
  description:
    "Firma ta poate susține copiii noștri, fără costuri suplimentare față de impozitul pe care îl plătește oricum.",
};

/**
 * 8.2 — cele două căi, fiecare cu patru pași.
 *
 * Termenele sunt lăsate goale intenționat: caietul de sarcini scrie, pentru
 * amândouă, „Termen: [de confirmat]”. Un termen fiscal greșit pe site-ul unei
 * asociații înseamnă o firmă care pierde dreptul de direcționare — așa că aici
 * nu se ghicește. Se completează când asociația confirmă datele.
 */
const CAI: ReadonlyArray<{
  titlu: string;
  text: string;
  pictograma: NumePictograma;
  pasi: ReadonlyArray<string>;
}> = [
  {
    titlu: "Declarația 177",
    text: "Direcționarea bugetului de sponsorizare nealocat din anii anteriori.",
    pictograma: "document",
    pasi: [
      "Calculezi suma disponibilă.",
      "Semnezi contractul de sponsorizare.",
      "Depui Declarația 177 la ANAF.",
      "ANAF virează suma către asociație.",
    ],
  },
  {
    titlu: "Sponsorizare din impozitul pe profit",
    text: "Pentru anul în curs, prin contract de sponsorizare.",
    pictograma: "cladire",
    pasi: [
      "Calculezi suma.",
      "Completezi contractul de sponsorizare.",
      "Îl semnezi.",
      "Virezi banii în contul asociației.",
    ],
  },
];

export default function Directioneaza20() {
  return (
    <>
      <AntetPagina
        titlu="Direcționează până la 20% din impozitul pe profit"
        subtitlu="Firma ta poate susține copiii noștri, fără costuri suplimentare față de impozitul pe care îl plătește oricum."
        poza={{
          cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
          alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
          legenda: "Tabăra RESPIRO",
        }}
        butoane={
          <>
            <Buton href="#documente" marime="mare">
              Descarcă contractul
            </Buton>
            <Buton
              href={`mailto:${EMAIL.contact}`}
              varianta="contur"
              marime="mare"
            >
              Scrie-ne
            </Buton>
          </>
        }
      />

      {/* 8.2 */}
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Două căi</h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
            {CAI.map((cale, i) => (
              <section
                key={cale.titlu}
                className={`${i % 2 === 0 ? "colt-a" : "colt-b"} bg-hartie-calda p-7 shadow-[0_20px_42px_-24px_rgba(35,35,35,0.5)] sm:p-9`}
              >
                <span
                  className={`flex size-14 items-center justify-center ${
                    i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                  } bg-caramiziu-100 text-caramiziu-600`}
                >
                  <Pictograma nume={cale.pictograma} className="size-7" />
                </span>
                <h3 className="mt-5 text-h3 text-cerneala">{cale.titlu}</h3>
                <p className="mt-2 text-cerneala-moale">{cale.text}</p>

                <ol className="mt-7 grid gap-3">
                  {cale.pasi.map((pas, j) => (
                    <li key={pas} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-caramiziu-500 font-titlu text-nota font-bold text-hartie"
                      >
                        {j + 1}
                      </span>
                      <span className="text-mic text-cerneala">{pas}</span>
                    </li>
                  ))}
                </ol>

                {/* Termenul vine de la asociație — vezi comentariul de la CAI. */}
                <p className="mt-6 text-nota text-cerneala-slab">
                  Termenul de depunere îl confirmăm împreună cu contabilitatea
                  firmei tale, pentru anul fiscal în curs.
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* 8.3 */}
      <Val culoare="text-tenta-cald" />
      <section
        id="documente"
        className="granulatie scroll-mt-32 bg-tenta-cald pb-20 lg:pb-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Documente de descărcat</h2>

          <ul className="mt-10 grid gap-4 lg:grid-cols-2">
            <li>
              <DocumentDeDescarcat
                titlu="Contract de sponsorizare"
                descriere="Modelul de contract, gata de completat de firma ta."
                format="Word"
              />
            </li>
            <li>
              <DocumentDeDescarcat
                titlu="Declarația 177"
                descriere="Modelul declarației, completat cu datele asociației."
                format="PDF"
              />
            </li>
          </ul>

          <p className="mt-6 text-mic text-cerneala-moale">
            Vrei un contract personalizat? Scrie-ne la{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              {EMAIL.contact}
            </a>{" "}
            și ne ocupăm împreună de toate documentele.
          </p>
        </div>
      </section>

      {/* 8.5 */}
      <Val culoare="text-hartie" />
      <Intrebari
        titlu="Întrebări frecvente despre Declarația 177"
        intrebari={[
          {
            intrebare: "Ce este Declarația 177?",
            raspuns: (
              <p>
                Este declarația prin care o firmă cere ANAF să redirecționeze
                către o asociație sumele de sponsorizare la care avea dreptul în
                anii anteriori, dar pe care nu le-a folosit. Banii nu ies în
                plus din firmă: sunt sume care altfel rămân la stat.
              </p>
            ),
          },
          {
            intrebare: "Cum funcționează?",
            raspuns: (
              <p>
                Firma calculează suma de sponsorizare rămasă nealocată, semnează
                un contract de sponsorizare cu asociația și depune Declarația
                177 la ANAF. ANAF virează apoi suma direct în contul asociației.
              </p>
            ),
          },
          {
            intrebare: "Ce condiții trebuie îndeplinite?",
            raspuns: (
              <>
                <p>
                  Firma trebuie să fie plătitoare de impozit pe profit sau pe
                  veniturile microîntreprinderilor, să aibă un contract de
                  sponsorizare încheiat cu asociația și să nu aibă obligații
                  fiscale restante.
                </p>
                <p>
                  Suma care poate fi direcționată și termenele se stabilesc
                  împreună cu contabilitatea firmei, pentru anul fiscal în curs.
                </p>
              </>
            ),
          },
          {
            intrebare: "Cum se depune?",
            raspuns: (
              <p>
                Declarația se depune electronic, prin Spațiul Privat Virtual sau
                prin portalul ANAF, de către firmă. Noi îți trimitem contractul
                semnat și datele asociației de care ai nevoie pentru completare.
              </p>
            ),
          },
        ]}
      />

      {/* 8.6 */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">De ce Asociația Teona Ariana</h2>
          <div className="mt-6 grid gap-4 text-amplu text-cerneala-moale">
            <p>
              Pentru copiii cu nevoi speciale și pentru familiile lor, o zi bună
              nu vine de la sine. De aceea organizăm tabere în care copiii se
              joacă, își fac prieteni și descoperă că pot, iar părinții respiră
              și află că nu sunt singuri. Am organizat 33 de tabere și am avut
              alături peste 1.500 de participanți.
            </p>
            <p>
              Bucuria nu ține doar câteva zile pe an. La Casa Teona, copiii vin
              pe tot parcursul anului la jocuri și ateliere, iar părinții găsesc
              consiliere și întâlniri de grup.
            </p>
            <p>
              Fiecare sumă direcționată ajută la acest lucru: tabere, activități
              și un loc sigur pentru copii și familiile lor.
            </p>
          </div>

          <Buton href={RUTE.sponsori} varianta="contur" className="mt-8">
            Vezi cine ne mai susține
          </Buton>
        </div>
      </section>

      {/* 8.7 */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Contact și date de cont</h2>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {CONTACT_FIRME.map((persoana, i) => (
              <li key={persoana.email}>
                <div
                  className={`flex h-full flex-col ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } bg-hartie-calda p-6 shadow-[0_16px_34px_-22px_rgba(35,35,35,0.45)]`}
                >
                  <span className="font-titlu text-amplu font-bold text-cerneala">
                    {persoana.nume}
                  </span>
                  <span className="font-titlu text-mic font-semibold text-caramiziu-600">
                    {persoana.rol}
                  </span>
                  <a
                    href={`mailto:${persoana.email}`}
                    className="mt-3 text-mic break-words text-cerneala-moale transition hover:text-caramiziu-600"
                  >
                    {persoana.email}
                  </a>
                  <a
                    href={`tel:${persoana.telefon.apel}`}
                    className="text-mic text-cerneala-moale transition hover:text-caramiziu-600"
                  >
                    {persoana.telefon.afisat}
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-3">
            <DeCopiat eticheta="Titular" valoare={ASOCIATIA.denumireLegala} />
            <DeCopiat eticheta="CIF" valoare={ASOCIATIA.cif} />
            {CONTURI.map((cont) => (
              <DeCopiat
                key={cont.iban}
                eticheta={`IBAN ${cont.banca} (${cont.moneda})`}
                valoare={cont.iban}
                deCopiat={cont.iban.replace(/\s/g, "")}
              />
            ))}
          </div>

          <p className="mt-8 text-mic text-cerneala-moale">
            Ești persoană fizică? Atunci te interesează{" "}
            <Link
              href={RUTE.redirectionare35}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              Redirecționează 3,5%
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
