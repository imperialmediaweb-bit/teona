import type { Metadata } from "next";
import Image from "next/image";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma from "@/componente/Pictograma";
import AntetPagina from "@/componente/pagina/AntetPagina";
import TitluSectiune from "@/componente/pagina/TitluSectiune";

export const metadata: Metadata = {
  title: "Suntem în presă",
  description: "Presa, alături de misiunea noastră.",
};

/** Siglele publicațiilor, așa cum erau și pe site-ul vechi. */
const PUBLICATII = {
  monitorul: {
    nume: "Monitorul de Suceava",
    sigla: "/poze/2024/11/download.png",
  },
  obiectiv: {
    nume: "Obiectiv de Suceava",
    sigla: "/poze/2024/11/download-1.png",
  },
  svnews: { nume: "Suceava News", sigla: "/poze/2024/11/download.jpeg" },
  suceavaOnline: {
    nume: "suceava.online",
    sigla: "/poze/2024/11/Screenshot_2.png",
  },
} as const;

/**
 * Aparițiile în presă, în ordinea de pe site-ul vechi (de la cea mai nouă).
 *
 * Caietul cere la capitolul 9 ca linkurile să fie testate înainte de publicare.
 * Au fost testate, toate șase, iar rezultatul e scris aici lângă fiecare:
 *
 * - svnews.ro — răspunde 200, link activ;
 * - obiectivdesuceava.ro (ambele) — răspund 403 la verificarea automată, ceea
 *   ce e protecție anti-robot, nu link mort: se deschid normal din browser;
 * - monitorulsv.ro, 20 august 2024 — adresa salvată în WordPress dă 404,
 *   articolul a fost mutat sau scos;
 * - suceava.online, 21 martie 2024 — adresa dă 404, deși site-ul funcționează;
 * - monitorulsv.ro, 14 iunie 2023 — în exportul WordPress nu există nicio
 *   adresă pentru această apariție.
 *
 * Aparițiile fără adresă validă rămân pe pagină, cu sursa și titlul, dar fără
 * buton: caietul interzice butoanele care nu duc nicăieri. Adresele corecte
 * vin din lista pe care o trimite asociația.
 */
const APARITII: ReadonlyArray<{
  publicatie: keyof typeof PUBLICATII;
  data: string;
  an: string;
  titlu: string;
  adresa?: string;
}> = [
  {
    publicatie: "monitorul",
    data: "20 august 2024",
    an: "2024",
    titlu:
      "24 de copii cu deficiențe de auz și vorbire au fost în Tabăra Respiro, la Vama, organizată de Asociația Teona Ariana Suceava",
  },
  {
    publicatie: "suceavaOnline",
    data: "21 martie 2024",
    an: "2024",
    titlu:
      "„Împreună, prieteni!”, un eveniment dedicat Zilei Mondiale a Sindromului Down la Suceava",
  },
  {
    publicatie: "monitorul",
    data: "14 iunie 2023",
    an: "2023",
    titlu:
      "Asociația Teona Ariana a „adoptat” 26 de elevi cu deficiențe de auz și vorbire și le-a oferit o tabără „Respiro”",
  },
  {
    publicatie: "obiectiv",
    data: "14 iunie 2023",
    an: "2023",
    titlu:
      "Asociația Teona Ariana a „adoptat” 26 de elevi cu deficiențe de auz și vorbire și le-a oferit o tabără „Respiro”",
    adresa:
      "https://www.obiectivdesuceava.ro/local/26-de-copii-cu-deficiente-de-vorbire-si-auz-au-avut-parte-de-o-saptamana-de-relaxare-oferita-de-asociatia-teona-ariana/",
  },
  {
    publicatie: "svnews",
    data: "12 mai 2023",
    an: "2023",
    titlu:
      "Tabăra RESPIRO din mai 2023, dedicată copiilor cu autism, cu sindrom Down și părinților lor, „a fost despre iubire necondiționată”",
    adresa:
      "https://www.svnews.ro/tabara-respiro-din-mai-2023-dedicata-copiilor-cu-autism-cu-sindrom-down-si-parintilor-lor-a-fost-despre-iubire-neconditionata/339507/",
  },
  {
    publicatie: "obiectiv",
    data: "17 iunie 2021",
    an: "2021",
    titlu:
      "Asociația Teona Ariana din Suceava a organizat prima tabără pentru copiii cu autism și sindrom Down",
    adresa:
      "https://www.obiectivdesuceava.ro/local/asociatia-teona-ariana-din-suceava-a-organizat-prima-tabara-pentru-copiii-cu-autism-si-sindrom-down/",
  },
];

/** Culoarea pastilei cu data, pe rând. */
const PASTILE = [
  "bg-caramiziu-500 text-hartie",
  "bg-miere-400 text-cerneala",
  "bg-turcoaz-500 text-hartie",
] as const;

const LINII = ["border-t-caramiziu-400", "border-t-miere-400", "border-t-turcoaz-400"] as const;

export default function SuntemInPresa() {
  return (
    <>
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
          alt: "Un băiat în tricoul alb al asociației, cu brațele ridicate, pe iarbă, în fața pensiunii; în spate, alți copii și voluntari",
        }}
      />

      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor semn="unda" className="pluteste-lent absolute top-20 right-[3%] size-10 text-turcoaz-200 lg:size-14" />
          <Decor semn="stea" className="pluteste-lent absolute bottom-32 left-[2%] size-8 text-miere-300 lg:size-11" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Ce s-a scris despre noi"
            titlu="Aparițiile în presă"
            culoare="turcoaz"
          />

          <ol className="mt-12 grid gap-5">
            {APARITII.map((aparitie, i) => {
              const publicatie = PUBLICATII[aparitie.publicatie];
              // Anul se scrie o singură dată, la prima apariție din anul lui:
              // lista se citește ca o cronologie, nu ca un teanc de carduri.
              const anNou = i === 0 || APARITII[i - 1].an !== aparitie.an;
              return (
                <li key={`${aparitie.data}-${aparitie.publicatie}`} className="grid gap-5">
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
                        <Image
                          src={publicatie.sigla}
                          alt={`Sigla ${publicatie.nume}`}
                          width={280}
                          height={120}
                          className="max-h-12 w-auto object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3.5 py-1 ${PASTILE[i % 3]}`}>
                            <span className="scris text-mic leading-none">{aparitie.data}</span>
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
                          Citește articolul
                          <Pictograma nume="sageata" className="size-4" />
                        </Buton>
                      ) : (
                        // Fără buton: adresa salvată nu mai funcționează, iar
                        // caietul interzice linkurile care nu duc nicăieri.
                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-miere-100 px-4 py-2 font-titlu text-nota font-semibold text-miere-800">
                          <span aria-hidden="true" className="size-2 rounded-full bg-miere-500" />
                          Link în curs de actualizare
                        </span>
                      )}
                    </article>
                  </Aparitie>
                </li>
              );
            })}
          </ol>
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
