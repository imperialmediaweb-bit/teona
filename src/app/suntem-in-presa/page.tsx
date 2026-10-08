import type { Metadata } from "next";
import Image from "next/image";
import { RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Pictograma from "@/componente/Pictograma";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";

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
  titlu: string;
  adresa?: string;
}> = [
  {
    publicatie: "monitorul",
    data: "20 august 2024",
    titlu:
      "24 de copii cu deficiențe de auz și vorbire au fost în Tabăra Respiro, la Vama, organizată de Asociația Teona Ariana Suceava",
  },
  {
    publicatie: "suceavaOnline",
    data: "21 martie 2024",
    titlu:
      "„Împreună, prieteni!”, un eveniment dedicat Zilei Mondiale a Sindromului Down la Suceava",
  },
  {
    publicatie: "monitorul",
    data: "14 iunie 2023",
    titlu:
      "Asociația Teona Ariana a „adoptat” 26 de elevi cu deficiențe de auz și vorbire și le-a oferit o tabără „Respiro”",
  },
  {
    publicatie: "obiectiv",
    data: "14 iunie 2023",
    titlu:
      "Asociația Teona Ariana a „adoptat” 26 de elevi cu deficiențe de auz și vorbire și le-a oferit o tabără „Respiro”",
    adresa:
      "https://www.obiectivdesuceava.ro/local/26-de-copii-cu-deficiente-de-vorbire-si-auz-au-avut-parte-de-o-saptamana-de-relaxare-oferita-de-asociatia-teona-ariana/",
  },
  {
    publicatie: "svnews",
    data: "12 mai 2023",
    titlu:
      "Tabăra RESPIRO din mai 2023, dedicată copiilor cu autism, cu sindrom Down și părinților lor, „a fost despre iubire necondiționată”",
    adresa:
      "https://www.svnews.ro/tabara-respiro-din-mai-2023-dedicata-copiilor-cu-autism-cu-sindrom-down-si-parintilor-lor-a-fost-despre-iubire-neconditionata/339507/",
  },
  {
    publicatie: "obiectiv",
    data: "17 iunie 2021",
    titlu:
      "Asociația Teona Ariana din Suceava a organizat prima tabără pentru copiii cu autism și sindrom Down",
    adresa:
      "https://www.obiectivdesuceava.ro/local/asociatia-teona-ariana-din-suceava-a-organizat-prima-tabara-pentru-copiii-cu-autism-si-sindrom-down/",
  },
];

export default function SuntemInPresa() {
  return (
    <>
      <AntetPagina
        titlu="Suntem în presă"
        subtitlu="Presa, alături de misiunea noastră. Fiecare apariție reflectă munca noastră și dorința de a crea un viitor mai bun pentru copiii aflați în nevoie."
        poza={{
          cale: "/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg",
          alt: "Un copil sare în aer pe iarbă, cu părul în vânt",
          legenda: "Tabăra RESPIRO",
        }}
      />

      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Aparițiile în presă</h2>

          <ul className="grid gap-4">
            {APARITII.map((aparitie, i) => {
              const publicatie = PUBLICATII[aparitie.publicatie];
              return (
                <li key={`${aparitie.data}-${aparitie.publicatie}`}>
                  <Aparitie intarziere={Math.min(i, 5) * 0.04}>
                    <article
                      className={`flex flex-col gap-5 ${
                        i % 2 === 0 ? "colt-a" : "colt-b"
                      } bg-hartie-calda p-6 shadow-[0_18px_38px_-22px_rgba(35,35,35,0.45)] sm:flex-row sm:items-center sm:p-7`}
                    >
                      <div className="flex h-14 w-36 shrink-0 items-center justify-start sm:justify-center">
                        <Image
                          src={publicatie.sigla}
                          alt={`Sigla ${publicatie.nume}`}
                          width={280}
                          height={120}
                          className="max-h-14 w-auto object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
                          {publicatie.nume} · {aparitie.data}
                        </p>
                        <h3 className="mt-1.5 text-h4 leading-snug text-cerneala">
                          {aparitie.titlu}
                        </h3>
                      </div>

                      {aparitie.adresa ? (
                        <Buton
                          href={aparitie.adresa}
                          varianta="contur"
                          marime="mic"
                          className="shrink-0 self-start sm:self-center"
                        >
                          Citește articolul
                          <Pictograma nume="sageata" className="size-4" />
                        </Buton>
                      ) : (
                        // Fără buton: adresa salvată nu mai funcționează, iar
                        // caietul interzice linkurile care nu duc nicăieri.
                        <span className="shrink-0 self-start rounded-full bg-hartie-umbra px-4 py-2 font-titlu text-nota font-semibold text-cerneala-slab sm:self-center">
                          Link în curs de actualizare
                        </span>
                      )}
                    </article>
                  </Aparitie>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Butoanele de la final, cerute la capitolul 9. */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-h3 text-cerneala">
            Vrei să fii parte din următoarea poveste?
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează
            </Buton>
            <Buton href={RUTE.voluntar} varianta="secundar" marime="mare">
              Devino voluntar
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
