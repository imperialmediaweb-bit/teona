import type { Metadata } from "next";
import { aparitiiSite } from "@/lib/aparitii";
import { siglaPublicatiei } from "@/date/aparitii-presa";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import Image from "next/image";
import { ASOCIATIA, EMAIL, RUTE, TELEFOANE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma from "@/componente/Pictograma";
import VideoIncorporat from "@/componente/VideoIncorporat";
import AntetPagina from "@/componente/pagina/AntetPagina";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = metadate({
  titlu: "Suntem în presă",
  descriere:
    "Articole despre Asociația Teona Ariana Suceava în Monitorul de Suceava, Obiectiv de Suceava, Suceava News și suceava.online: tabere RESPIRO și evenimente.",
  cale: "/suntem-in-presa",
});

/** Culoarea pastilei cu data, pe rând. */
const PASTILE = [
  "bg-caramiziu-700 text-hartie",
  "bg-miere-400 text-cerneala",
  "bg-turcoaz-600 text-hartie",
] as const;

const LINII = [
  "border-t-caramiziu-400",
  "border-t-miere-400",
  "border-t-turcoaz-400",
] as const;

export default async function SuntemInPresa() {
  const APARITII = await aparitiiSite();
  return (
    <>
      <JsonLd
        date={jsonLdFir([{ nume: "Suntem în presă", cale: RUTE.media }])}
      />
      <AntetPagina
        scris="Presa, alături de misiunea noastră"
        titlu="Suntem în presă"
        subtitlu="Fiecare apariție reflectă munca noastră și dorința de a crea un viitor mai bun pentru copiii aflați în nevoie."
        accent="turcoaz"
        poza={{
          cale: "/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg",
          // Textul vechi spunea că un copil sare în aer. Nu: o voluntară îl
          // învârte în brațe. Corectat după ce m-am uitat la poză.
          alt: "O voluntară învârte un copil în brațe, pe iarbă, în fața unei clădiri de lemn din tabără; părul îi flutură în vânt",
          legenda: "Tabăra RESPIRO",
        }}
        pozaMica={{
          cale: "/poze/2024/11/378583324_6701686126586406_7869118802634728634_n-1.jpg",
          alt: "Un copil zâmbitor, în tricoul alb al asociației, cu mâinile la cap, pe iarbă, în fața pensiunii; în spate, alți copii și voluntari",
        }}
      />

      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="unda"
            className="pluteste-lent absolute top-20 right-[3%] size-10 text-turcoaz-200 lg:size-14"
          />
          <Decor
            semn="stea"
            className="pluteste-lent absolute bottom-32 left-[2%] size-8 text-miere-300 lg:size-11"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Ce s-a scris despre noi"
            titlu="Aparițiile în presă"
            culoare="turcoaz"
          />

          <ol className="mt-12 grid gap-5">
            {APARITII.map((aparitie, i) => {
              const sigla = siglaPublicatiei(aparitie.publicatie);
              const publicatie = { nume: aparitie.publicatie, sigla };
              // Anul se scrie o singură dată, la prima apariție din anul lui:
              // lista se citește ca o cronologie, nu ca un teanc de carduri.
              const anNou = i === 0 || APARITII[i - 1].an !== aparitie.an;
              return (
                <li
                  key={`${i}-${aparitie.data}-${aparitie.publicatie}`}
                  className="grid gap-5"
                >
                  {anNou && (
                    <p
                      aria-hidden="true"
                      className={`font-titlu text-[3rem] leading-none font-extrabold tracking-tight text-caramiziu-100 ${
                        i === 0 ? "" : "mt-6"
                      }`}
                    >
                      {aparitie.an}
                    </p>
                  )}
                  <Aparitie intarziere={Math.min(i, 5) * 0.04}>
                    <article
                      className={`grid gap-5 overflow-hidden ${
                        i % 2 === 0 ? "colt-a" : "colt-b"
                      } border border-hartie-umbra bg-hartie p-5 shadow-[0_22px_46px_-26px_rgba(35,35,35,0.5)] transition-all duration-500 ease-cald hover:-translate-y-1 hover:shadow-[0_28px_52px_-24px_rgba(42,159,163,0.45)] motion-reduce:hover:translate-y-0 sm:p-6 lg:grid-cols-[10rem_1fr_auto] lg:items-center lg:gap-8`}
                    >
                      <div
                        className={`flex h-20 w-40 items-center justify-center colt-mic-a border-t-4 bg-hartie-calda px-4 lg:w-full ${LINII[i % 3]}`}
                      >
                        {publicatie.sigla ? (
                          <Image
                            src={publicatie.sigla}
                            alt={`Sigla ${publicatie.nume}`}
                            width={280}
                            height={120}
                            className="max-h-12 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-center font-titlu text-nota font-bold text-cerneala-moale">
                            {publicatie.nume}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3.5 py-1 ${PASTILE[i % 3]}`}
                          >
                            <span className="scris text-mic leading-none">
                              {aparitie.data}
                            </span>
                          </span>
                          <span className="font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                            {publicatie.nume}
                          </span>
                        </p>
                        <h3 className="mt-3 text-h4 leading-snug text-cerneala">
                          {aparitie.titlu}
                        </h3>
                      </div>

                      {aparitie.adresa ? (
                        <Buton
                          href={aparitie.adresa}
                          varianta="contur"
                          className="w-fit shrink-0"
                        >
                          {aparitie.incorporare
                            ? "Deschide pe Facebook"
                            : "Citește articolul"}
                          <Pictograma nume="sageata" className="size-4" />
                        </Buton>
                      ) : (
                        // Fără buton: adresa salvată nu mai funcționează, iar
                        // caietul interzice linkurile care nu duc nicăieri.
                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-miere-100 px-4 py-2 font-titlu text-nota font-semibold text-miere-800">
                          <span
                            aria-hidden="true"
                            className="size-2 rounded-full bg-miere-500"
                          />
                          Link în curs de actualizare
                        </span>
                      )}
                      {/*
                        Filmarea, în card, pe toată lățimea lui.

                        Stătea sub card, într-un bloc al ei, mai îngust și
                        fără chenar: arăta ca o bucată rămasă pe dinafară,
                        lipită la stânga sub un card care ținea toată lățimea.
                        O apariție în presă e un singur lucru, deci un singur
                        card.

                        `lg:col-span-3` fiindcă articolul e pe trei coloane de
                        la `lg` în sus — siglă, text, buton; fără el, filmarea
                        ar intra în coloana siglei, de zece rem.

                        Se încarcă abia la apăsare: vezi `VideoIncorporat`. Pe
                        card rămâne și butonul către postare, pentru cine nu
                        vrea player deloc.
                      */}
                      {aparitie.incorporare && (
                        <div className="lg:col-span-3">
                          <VideoIncorporat
                            adresa={aparitie.incorporare}
                            titlu={aparitie.titlu}
                          />
                        </div>
                      )}
                    </article>
                  </Aparitie>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/*
        Blocul pentru jurnaliști.

        Pagina era o listă de linkuri către ce s-a scris despre asociație —
        folositoare pentru un donator, inutilă pentru un reporter care tocmai
        a aterizat aici și are nevoie de un om de contact și de datele
        asociației scrise corect. Numele asociației și CIF-ul apar greșit în
        presă destul de des; aici sunt o dată, de unde se pot copia.

        Nimic despre „kit de presă” sau „materiale la cerere”: nu există încă
        un dosar pregătit, iar o promisiune pe care nu o poate ține nimeni e
        mai rea decât lipsa ei.
      */}
      <section className="relative overflow-hidden bg-hartie pb-24 lg:pb-32">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="granulatie relative overflow-hidden colt-a border border-hartie-umbra bg-hartie-calda p-8 sm:p-10">
            <Decor
              semn="stea"
              className="absolute top-6 right-8 size-8 text-miere-300"
            />
            <h2 className="relative text-h3 text-cerneala">
              Scrii despre noi?
            </h2>
            <p className="relative mt-4 text-amplu text-cerneala-moale">
              Răspundem la întrebări, confirmăm cifre și putem pune la
              dispoziție fotografii din tabere. Scrie la{" "}
              <a
                href={`mailto:${EMAIL.contact}`}
                className="font-titlu font-semibold text-caramiziu-700 underline-offset-4 hover:underline"
              >
                {EMAIL.contact}
              </a>{" "}
              sau sună la{" "}
              <a
                href={`tel:${TELEFOANE[0].apel}`}
                className="font-titlu font-semibold text-caramiziu-700 underline-offset-4 hover:underline"
              >
                {TELEFOANE[0].afisat}
              </a>
              .
            </p>
            <dl className="relative mt-6 grid gap-x-8 gap-y-3 text-mic sm:grid-cols-2">
              <div>
                <dt className="font-titlu font-semibold text-cerneala">
                  Denumirea completă
                </dt>
                <dd className="text-cerneala-moale">{ASOCIATIA.denumire}</dd>
              </div>
              <div>
                <dt className="font-titlu font-semibold text-cerneala">CIF</dt>
                <dd className="text-cerneala-moale">{ASOCIATIA.cif}</dd>
              </div>
              <div>
                <dt className="font-titlu font-semibold text-cerneala">
                  Ce facem
                </dt>
                <dd className="text-cerneala-moale">
                  Tabere pentru copii cu nevoi speciale și pentru părinții lor,
                  Casa Teona și cazuri umanitare, la Suceava.
                </dd>
              </div>
              <div>
                <dt className="font-titlu font-semibold text-cerneala">
                  Fotografii
                </dt>
                <dd className="text-cerneala-moale">
                  Din arhiva asociației, la cerere. Nu dăm poze cu copii fără
                  acordul părinților.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Butoanele de la final, cerute la capitolul 9. */}
      <IndemnFinal
        peste
        butoane="doua"
        titlu="Vrei să fii parte din următoarea poveste?"
      />
    </>
  );
}
