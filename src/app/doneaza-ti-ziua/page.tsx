import type { Metadata } from "next";
import { JsonLd, jsonLdFir, jsonLdIntrebari, metadate } from "@/app/seo";
import { LINKURI_EXTERNE, RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import Intrebari from "@/componente/pagina/Intrebari";
import Pasi from "@/componente/pagina/Pasi";
import TitluSectiune from "@/componente/pagina/TitluSectiune";
import FormularAniversare from "@/componente/formular/FormularAniversare";
import { areAsistent } from "@/lib/asistent";

export const metadata: Metadata = metadate({
  titlu: "Donează-ți ziua de naștere",
  descriere:
    "Îți faci o pagină de campanie cu poza și mesajul tău și o distribui prietenilor. În loc de cadouri, o tabără pentru un copil de la Asociația Teona Ariana.",
  cale: "/doneaza-ti-ziua",
});

const INTREBARI = [
  {
    intrebare: "Cât durează până apare pagina?",
    raspuns: (
      <>
        O citim înainte s-o publicăm. De obicei durează câteva ore, în zilele
        lucrătoare, și îți scriem pe e-mail când e gata.
      </>
    ),
  },
  {
    intrebare: "Unde ajung banii?",
    raspuns: (
      <>
        La asociație. Butonul de pe pagina ta duce la formularul de donație al
        site-ului, iar banii intră direct în contul asociației. Nu treci prin
        altă platformă și nu-ți trebuie cont nicăieri.
      </>
    ),
  },
  {
    intrebare: "Pot vedea cât am strâns?",
    raspuns: (
      <>
        Da. Fiecare donație făcută de pe pagina ta poartă numele campaniei
        tale, deci totalul e al tău, nu se amestecă. Scrie-ne și îți spunem
        unde a ajuns.
      </>
    ),
  },
  {
    intrebare: "Ce se întâmplă cu poza și cu datele mele?",
    raspuns: (
      <>
        Poza, titlul, mesajul și numele pe care le trimiți apar pe pagină.
        E-mailul nu apare nicăieri; îl folosim doar ca să te anunțăm. Poți cere
        oricând ștergerea paginii, scriind la contact@teona-ariana.ro.
      </>
    ),
  },
  {
    intrebare: "Trebuie să fie neapărat ziua mea de naștere?",
    raspuns: (
      <>
        Poți dedica ziua ta de naștere sau ziua de naștere a copilului tău.
        Alegi varianta potrivită în formularul de creare a paginii.
      </>
    ),
  },
];

export default function DoneazaTiZiua() {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Donează", cale: RUTE.doneaza },
          { nume: "Donează-ți ziua de naștere", cale: RUTE.ziuaTa },
        ])}
      />
      <JsonLd date={jsonLdIntrebari(INTREBARI)} />

      <AntetPagina
        scris="În loc de cadouri"
        titlu="Donează-ți ziua de naștere"
        subtitlu="E ziua ta și vrei să o sărbătorești cu sens. Spune-le prietenilor că, în loc de cadou, îți dorești să ajuți copiii cu nevoi speciale. Îți faci o pagină cu poză și câteva cuvinte despre inițiativa ta și o distribui – e atât de simplu."
        accent="miere"
        poza={{
          cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
          alt: "Opt voluntari tineri, în veste albe cu sigla asociației, în grup, la apus",
          legenda: "Prietenii fac diferența",
        }}
        pozaMica={{
          cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
          alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
        }}
        butoane={
          <Buton href="#creeaza" marime="mare">
            Creează pagina ta
            <Pictograma nume="sageata" className="size-5 rotate-90" />
          </Buton>
        }
      />

      {/* Cum funcționează */}
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-16 right-[5%] size-9 text-miere-200 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Trei pași"
            titlu="Cum funcționează"
            culoare="miere"
          />
          <div className="mt-12">
            <Pasi
              pasi={[
                {
                  text: "Completezi formularul: o poză, un titlu și câteva rânduri despre de ce o faci.",
                  pictograma: "document",
                },
                {
                  text: "Verificăm pagina și o publicăm. Îți trimitem linkul pe e-mail.",
                  pictograma: "comunicare",
                },
                {
                  text: "O distribui prietenilor. Poza ta apare în previzualizare pe Facebook și pe WhatsApp.",
                  pictograma: "maini",
                },
              ]}
            />
          </div>

          {/*
            Cardul spunea, până în octombrie 2026, „fă-ți întâi o pagină pe
            Galantom, altfel nu se vede cât ai strâns". Era adevărat când
            butonul de donație ducea acolo. De când pagina de campanie duce la
            formularul nostru (`ziua-ta/[slug]`, cu slugul în adresă),
            donațiile poartă numele campaniei și totalul se vede oricum — deci
            textul cerea omului un cont în plus, pe altă platformă, pentru
            ceva ce primea deja. Galantom rămâne ca altă cale de a dona, cum
            cere caietul la 2.3, dar nu ca pas obligatoriu.
          */}
          <Aparitie intarziere={0.1}>
            <div className="granulatie relative mt-10 overflow-hidden colt-b border border-turcoaz-100 bg-turcoaz-50 p-7 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.6)] sm:p-9">
              <Decor
                semn="unda"
                strokeWidth={0.8}
                className="absolute -top-8 -right-8 size-36 text-turcoaz-100"
              />
              <span className="colt-mic-a relative flex size-12 items-center justify-center bg-turcoaz-600 text-hartie">
                <Pictograma nume="inima" className="size-6" />
              </span>
              <h3 className="relative mt-5 text-h3 text-cerneala">
                Nu-ți trebuie cont nicăieri
              </h3>
              <p className="relative mt-3 max-w-3xl text-amplu text-cerneala-moale">
                Pagina ta stă pe site-ul asociației, iar butonul „Donează” de
                pe ea duce la formularul nostru. Fiecare donație făcută de
                acolo poartă numele campaniei tale, deci totalul e al tău și nu
                se amestecă. Prietenii tăi donează cu cardul, dintr-un singur
                loc.
              </p>
              <p className="relative mt-3 max-w-3xl text-mic text-cerneala-moale">
                Dacă preferi să donezi pe Galantom, se poate și așa — proiectul
                asociației e acolo.
              </p>
              <Buton
                href={LINKURI_EXTERNE.galantom}
                varianta="contur"
                className="relative mt-7"
              >
                Deschide Galantom
              </Buton>
            </div>
          </Aparitie>
        </div>
      </section>

      {/* Formularul */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section
        id="creeaza"
        className="scroll-mt-44 bg-hartie-calda pt-12 pb-20 lg:pt-16 lg:pb-28"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Durează câteva minute"
            titlu="Creează pagina ta"
            culoare="caramiziu"
          />
          <div className="mt-8">
            <FormularAniversare areAsistent={areAsistent()} />
          </div>
        </div>
      </section>

      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Ce ne întrebați"
            titlu="Întrebări frecvente"
            culoare="turcoaz"
          />
          <div className="mt-12">
            <Intrebari intrebari={INTREBARI} />
          </div>
        </div>
      </section>

      <IndemnFinal titlu="Dăruiește timp, dăruiește speranță!" />
    </>
  );
}
