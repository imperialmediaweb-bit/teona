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

export const metadata: Metadata = metadate({
  titlu: "Donează-ți ziua de naștere",
  descriere:
    "Îți faci o pagină de campanie pe site-ul Asociației Teona Ariana Suceava, cu poza și mesajul tău, și o distribui prietenilor. În loc de cadouri, o tabără pentru un copil.",
  cale: "/doneaza-ti-ziua",
});

const INTREBARI = [
  {
    intrebare: "Cât durează până apare pagina?",
    raspuns: (
      <>
        De obicei câteva ore, în zilele lucrătoare. Fiecare pagină e citită de
        cineva din asociație înainte să apară public — e site-ul unei asociații
        de copii, iar textele și pozele nu pot apărea nevăzute. Îți scriem pe
        e-mail când e gata.
      </>
    ),
  },
  {
    intrebare: "Unde ajung banii?",
    raspuns: (
      <>
        Direct la asociație, prin Galantom, platforma pe care o folosim pentru
        donații online. Pagina de pe site-ul nostru nu încasează ea însăși bani:
        ea îi spune povestea ta și trimite mai departe la Galantom.
      </>
    ),
  },
  {
    intrebare: "Pot vedea cât am strâns?",
    raspuns: (
      <>
        Da, dacă îți faci întâi o pagină personală pe Galantom și ne dai linkul
        în formular. Atunci butonul „Donează” duce la pagina ta, iar totalul se
        vede acolo. Dacă nu, butonul duce la proiectul asociației, iar donațiile
        intră la general — fără să știm care sunt ale tale.
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
        Nu. Merge la fel de bine pentru un botez, o nuntă, o aniversare sau
        orice altă ocazie la care primești cadouri și ai prefera să nu le
        primești.
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
        subtitlu="Împlinești ani și ai tot ce-ți trebuie. Spune-le prietenilor că, în loc de un cadou, îți doresc o zi bună pentru un copil. Îți faci o pagină cu poza și cuvintele tale și o distribui — atât."
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

          {/* Partea cu Galantom, scrisă pe față. */}
          <Aparitie intarziere={0.1}>
            <div className="granulatie relative mt-10 overflow-hidden colt-b border border-turcoaz-100 bg-turcoaz-50 p-7 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.6)] sm:p-9">
              <Decor
                semn="unda"
                strokeWidth={0.8}
                className="absolute -top-8 -right-8 size-36 text-turcoaz-100"
              />
              <span className="colt-mic-a relative flex size-12 items-center justify-center bg-turcoaz-500 text-hartie">
                <Pictograma nume="inima" className="size-6" />
              </span>
              <h3 className="relative mt-5 text-h3 text-cerneala">
                Vrei să vezi cât ai strâns?
              </h3>
              <p className="relative mt-3 max-w-3xl text-amplu text-cerneala-moale">
                Fă-ți întâi o pagină personală pe Galantom și pune linkul ei în
                formular. Atunci butonul „Donează” de pe pagina ta duce acolo,
                iar totalul se vede în timp real, pe numele tău. Fără link,
                butonul duce la proiectul asociației și donațiile intră la
                general.
              </p>
              <Buton
                href={LINKURI_EXTERNE.galantomZiuaTa}
                varianta="contur"
                className="relative mt-7"
              >
                Fă-ți pagina pe Galantom
              </Buton>
            </div>
          </Aparitie>
        </div>
      </section>

      {/* Formularul */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section
        id="creeaza"
        className="scroll-mt-40 bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Durează câteva minute"
            titlu="Creează pagina ta"
            culoare="caramiziu"
          />
          <div className="mt-12">
            <FormularAniversare />
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
