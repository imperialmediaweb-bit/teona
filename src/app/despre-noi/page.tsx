import type { Metadata } from "next";
import Image from "next/image";
import { ASOCIATIA, RUTE } from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Cifre from "@/componente/Cifre";
import Decor from "@/componente/Decor";
import Fotografie from "@/componente/Fotografie";
import IndemnFinal from "@/componente/IndemnFinal";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import {
  PARTENERI_FARA_SIGLA,
  PARTENERI_INSTITUTIONALI,
} from "@/date/sponsori";

export const metadata: Metadata = {
  title: "Cine suntem",
  description:
    "Aducem bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor.",
};

/**
 * 3.2 — Povestea noastră, în trei blocuri, fiecare cu fotografia lui:
 * prima tabără, Casa Teona, tabăra de anul acesta. Textul e cel din caietul
 * de sarcini, cuvânt cu cuvânt; nu e rescris și nu i se adaugă cifre.
 */
const POVESTE: ReadonlyArray<{
  titlu: string;
  paragrafe: ReadonlyArray<string>;
  poza: { cale: string; alt: string; legenda: string };
  umbra: "caramiziu" | "miere" | "turcoaz";
}> = [
  {
    titlu: "Cum am pornit",
    paragrafe: [
      "Asociația Teona Ariana Suceava a luat ființă în ianuarie 2021. Am pornit la drum cu o idee simplă: copiii cu nevoi speciale și familiile lor merită să aibă, din când în când, un loc în care să se simtă bine exact așa cum sunt. Nu aveam planuri mari, ci dorința de a face ceva concret, împreună cu oameni care gândesc la fel, indiferent de confesiune sau de opinii, pentru că bucuria nu ține de nicio etichetă.",
      "Așa au apărut taberele RESPIRO. Ne-am dorit să fie o pauză pentru copii și pentru părinții lor, și de la o tabără la alta au venit tot mai multe familii, tot mai mulți voluntari și tot mai multe prietenii. Acolo copiii se joacă, încearcă lucruri noi și se împrietenesc, iar părinții au timp să respire și să vorbească cu alți părinți. Din primele tabere am învățat ce contează cu adevărat: ritmul fiecărui copil, atenția și răbdarea.",
      "Pe drum, ne-am dorit să ajungem și la alți copii. Am început să sprijinim copii din sistemul de protecție a copilului, cu rezultate școlare deosebite, ca un „bravo” concret pentru munca lor, și să oferim burse și sprijin educațional, pentru ca fiecare copil să-și poată urma visul.",
    ],
    poza: {
      cale: "/poze/2024/11/278495378_647322639843213_2394948498616303816_n-1024x768.jpg",
      alt: "O voluntară ajută o fetiță la un atelier de bucătărie, într-o sală de lemn din tabără",
      legenda: "Tabăra RESPIRO",
    },
    umbra: "caramiziu",
  },
  {
    titlu: "Casa Teona",
    paragrafe: [
      "Apoi ne-am dorit ca bucuria să nu fie doar o vacanță. Casa Teona a devenit locul în care copiii vin pe tot parcursul anului: terapii de grup, ateliere creative, meloterapie, stimulare senzorială, activități de socializare și consiliere pentru părinți. Toate sunt gratuite, iar terapia prin joacă este adaptată fiecărui copil.",
    ],
    poza: {
      cale: "/poze/2024/11/WhatsApp-Image-2024-11-28-at-09.31.33-1.jpeg",
      alt: "Un băiețel se joacă pe podeaua interactivă de la Casa Teona, urmărind conturul unei stele proiectate pe jos",
      legenda: "Sala senzorială",
    },
    umbra: "turcoaz",
  },
  {
    titlu: "Anul acesta",
    paragrafe: [
      "Anul acesta am organizat prima tabără RESPIRO pentru copii care au trecut prin cancer și pentru familiile lor, un pas pe care ni l-am dorit de mult și care ne-a arătat cât de mult mai putem face.",
      "Motto-ul nostru, „Nimic fără Dumnezeu”, ne amintește că tot ce am realizat s-a născut din încredere, din bunătate și din faptul că am fost împreună.",
      "Povestea noastră continuă. Dacă vrei să faci parte din ea, te așteptăm.",
    ],
    poza: {
      cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
      alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
      legenda: "Prima zi de tabără",
    },
    umbra: "miere",
  },
];

/** 3.3 — trei carduri cu pictogramă, sub poveste. */
const MISIUNE: ReadonlyArray<{
  titlu: string;
  pictograma: NumePictograma;
  text?: string;
  valori?: ReadonlyArray<{ nume: string; text: string }>;
}> = [
  {
    titlu: "Misiune",
    pictograma: "inima",
    text: "Aducem bucurie și sprijin copiilor cu nevoi speciale, copiilor care au trecut prin cancer și celor din medii defavorizate, prin tabere, joacă și consiliere pentru întreaga familie.",
  },
  {
    titlu: "Viziune",
    pictograma: "infinit",
    text: "O comunitate în care fiecare copil, indiferent de dificultățile sale sau de condițiile în care s-a născut, are șansa să se joace, să învețe și să viseze liber, iar fiecare părinte știe că nu e singur.",
  },
  {
    titlu: "Valori",
    pictograma: "maini",
    valori: [
      { nume: "Incluziune", text: "fiecare copil e primit exact așa cum este." },
      { nume: "Empatie", text: "ascultăm înainte să ajutăm." },
      {
        nume: "Implicare",
        text: "lucrăm împreună cu voluntari, parteneri și companii.",
      },
      {
        nume: "Transparență",
        text: "spunem deschis ce facem și cum folosim fiecare donație.",
      },
    ],
  },
];

/**
 * 3.4 — Echipa, în ordinea cerută de caiet: conducerea, apoi echipa
 * operațională.
 *
 * Numele și rolurile sunt cele din caietul de sarcini, nu cele din exportul
 * WordPress (unde rolurile erau goale). Frazele scurte vin din `echipa.json`.
 *
 * Două lipsuri, lăsate vizibile în loc să fie umplute cu text inventat:
 * Mihaela Sfichi nu are nici fotografie, nici descriere (nu există nici pe
 * site-ul actual), iar conducerea nu are fotografii în arhiva preluată.
 * Cardul fără poză afișează inițialele, nu o siluetă de stoc.
 */
const ECHIPA: ReadonlyArray<{
  nume: string;
  rol: string;
  descriere?: string;
  poza?: string;
}> = [
  {
    nume: "Cristea Costiuc",
    rol: "Președinte",
    descriere:
      "Lider dedicat, ghidează cu pasiune misiunea asociației pentru a sprijini copiii cu dizabilități și familiile lor.",
  },
  {
    nume: "Iuliana Costiuc",
    rol: "Vicepreședinte",
    descriere:
      "Cu empatie și dedicare, sprijină echipa în realizarea obiectivelor asociației și în oferirea unui sprijin real.",
  },
  {
    nume: "Ștefan Roșu",
    rol: "Vicepreședinte",
    descriere:
      "Implicat activ în proiectele asociației, contribuie la organizarea și succesul inițiativelor pentru comunitate.",
  },
  {
    nume: "Mihaela Sfichi",
    rol: "Manager fundraising",
  },
  {
    nume: "Eudochia Pîțu",
    rol: "Coordonator voluntari",
    descriere:
      "Profesionist dedicat în domeniul asistenței sociale, cu experiență în coordonarea voluntarilor și organizarea taberelor.",
    poza: "/poze/2023/12/Screenshot_27__1_-removebg-preview__1_-removebg-preview.png",
  },
  {
    nume: "Daniel Strîmbu",
    rol: "Comunicare",
    descriere:
      "Capta atenția publicului și transmite mesajele esențiale ale asociației, într-un mod atractiv și eficient.",
    poza: "/poze/2023/12/Strimbu-Daniel-1.jpeg",
  },
];

/** Inițialele, pentru cardurile fără fotografie. */
function initiale(nume: string) {
  return nume
    .split(" ")
    .map((cuvant) => cuvant[0])
    .join("");
}

export default function DespreNoi() {
  return (
    <>
      <AntetPagina
        titlu="Cine suntem"
        subtitlu="Aducem bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor."
        poza={{
          cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
          alt: "Copii și voluntari cu căști și hamuri de escaladă, într-un parc de aventură",
          legenda: "Tabăra RESPIRO",
        }}
        urmeaza="text-hartie"
      />

      {/* 3.2 — Povestea noastră */}
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Povestea noastră</h2>

          <div className="mt-14 grid gap-20">
            {POVESTE.map((bloc, i) => (
              <Aparitie key={bloc.titlu}>
                <div
                  className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                    i % 2 === 1 ? "lg:[&>figure]:order-2" : ""
                  }`}
                >
                  <Fotografie
                    cale={bloc.poza.cale}
                    alt={bloc.poza.alt}
                    legenda={bloc.poza.legenda}
                    umbra={bloc.umbra}
                    colt={i % 2 === 0 ? "a" : "b"}
                    raport="aspect-[4/3]"
                    dimensiuni="(min-width: 1024px) 560px, 92vw"
                  />
                  <div>
                    <h3 className="text-h3 text-cerneala">{bloc.titlu}</h3>
                    <div className="mt-4 grid gap-4 text-cerneala-moale">
                      {bloc.paragrafe.map((paragraf) => (
                        <p key={paragraf.slice(0, 40)}>{paragraf}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </Aparitie>
            ))}
          </div>
        </div>
      </section>

      {/* 3.3 — Misiune, viziune, valori */}
      <Val culoare="text-tenta-turcoaz" />
      <section className="granulatie relative overflow-hidden bg-tenta-turcoaz pb-20 lg:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor
            semn="spirala"
            className="pluteste-lent absolute top-16 left-[4%] size-9 text-turcoaz-300 lg:size-12"
          />
          <Decor
            semn="inima"
            className="pluteste-lent absolute right-[6%] bottom-20 size-8 text-caramiziu-200 lg:size-11"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Misiune, viziune, valori</h2>
          <ul className="grid gap-5 lg:grid-cols-3">
            {MISIUNE.map((card, i) => (
              <li key={card.titlu}>
                <Aparitie intarziere={i * 0.06} className="h-full">
                  <article
                    className={`flex h-full flex-col ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } bg-hartie p-7 shadow-[0_18px_38px_-20px_rgba(42,159,163,0.45)]`}
                  >
                    <span
                      className={`flex size-14 items-center justify-center ${
                        i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                      } bg-turcoaz-100 text-turcoaz-700`}
                    >
                      <Pictograma nume={card.pictograma} className="size-7" />
                    </span>
                    <h3 className="mt-5 text-h4 text-cerneala">{card.titlu}</h3>

                    {card.text && (
                      <p className="mt-3 text-mic text-cerneala-moale">
                        {card.text}
                      </p>
                    )}

                    {card.valori && (
                      <ul className="mt-3 grid gap-2.5 text-mic text-cerneala-moale">
                        {card.valori.map((valoare) => (
                          <li key={valoare.nume}>
                            <span className="font-titlu font-bold text-cerneala">
                              {valoare.nume}:
                            </span>{" "}
                            {valoare.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.4 — Echipa */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Echipa</h2>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ECHIPA.map((membru, i) => (
              <li key={membru.nume}>
                <Aparitie intarziere={i * 0.04} className="h-full">
                  <article
                    className={`flex h-full flex-col items-center ${
                      i % 2 === 0 ? "colt-a" : "colt-b"
                    } bg-hartie-calda p-7 text-center shadow-[0_18px_38px_-22px_rgba(247,79,34,0.45)]`}
                  >
                    {membru.poza ? (
                      <div className="relative size-28 overflow-hidden rounded-full bg-hartie shadow-[0_12px_26px_-14px_rgba(35,35,35,0.6)]">
                        <Image
                          src={membru.poza}
                          alt={`${membru.nume}, ${membru.rol.toLowerCase()} la ${ASOCIATIA.denumire}`}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-28 items-center justify-center rounded-full bg-caramiziu-100 font-titlu text-h3 font-extrabold text-caramiziu-500"
                      >
                        {initiale(membru.nume)}
                      </span>
                    )}

                    <h3 className="mt-5 text-h4 text-cerneala">{membru.nume}</h3>
                    <p className="mt-1 font-titlu text-mic font-semibold text-caramiziu-600">
                      {membru.rol}
                    </p>
                    {membru.descriere && (
                      <p className="mt-3 text-mic text-cerneala-moale">
                        {membru.descriere}
                      </p>
                    )}
                  </article>
                </Aparitie>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.5 — aceleași cifre ca pe prima pagină, din aceeași sursă. */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pb-20 lg:pb-24">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Rezultate</h2>
          <div className="mt-12">
            <Cifre />
          </div>
        </div>
      </section>

      {/* 3.6 — Culegătorii de Zâmbete */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8">
          <div>
            <h2 className="text-h2 text-cerneala">Culegătorii de Zâmbete</h2>
            <div className="mt-5 grid gap-4 text-cerneala-moale">
              <p>
                Voluntarii sunt o parte esențială a activităților noastre. În
                tabere și la Casa Teona se joacă cu copiii, îi însoțesc pe
                parcursul zilei, ajută la organizare și îi sprijină pe părinți.
                Datorită lor, fiecare copil primește atenția de care are nevoie,
                iar activitățile se desfășoară în siguranță și cu bucurie.
              </p>
              <p>
                Dacă vrei să faci parte din echipă, te așteptăm. Alătură-te
                Culegătorilor de Zâmbete.
              </p>
            </div>

            {/*
              Caietul cere aici și iconițele de Facebook și Instagram ale
              grupului „Culegătorii de Zâmbete” — conturi separate de ale
              asociației. Adresele lor nu sunt nici în caiet, nici pe site-ul
              actual, iar o adresă ghicită duce vizitatorul la un cont străin.
              Se adaugă în clipa în care le primim.
            */}
            <Buton href={RUTE.voluntar} marime="mare" className="mt-9">
              Devino voluntar
            </Buton>
          </div>

          <ul className="grid grid-cols-2 gap-4">
            {[
              {
                cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
                alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
              },
              {
                cale: "/poze/2024/11/Screenshot_56-1.png",
                alt: "Un voluntar îi arată unei fetițe tricoul primit în tabără",
              },
              {
                cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
                alt: "Voluntari și copii, în grup, la apus",
              },
              {
                cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
                alt: "O voluntară desenează împreună cu un copil, la masă",
              },
            ].map((poza, i) => (
              <li key={poza.cale}>
                <figure
                  className={`group relative aspect-square overflow-hidden ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } bg-hartie-calda shadow-[0_20px_42px_-22px_rgba(247,79,34,0.5)]`}
                >
                  <Image
                    src={poza.cale}
                    alt={poza.alt}
                    fill
                    sizes="(min-width: 1024px) 280px, 46vw"
                    className="object-cover transition-transform duration-[1100ms] ease-cald group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                  />
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.7 — Parteneri instituționali */}
      <Val culoare="text-tenta-miere" />
      <section className="granulatie bg-tenta-miere pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Parteneri instituționali</h2>
          <p className="mt-3 max-w-2xl text-cerneala-moale">
            Colaborăm cu instituții care ne sunt alături în munca pentru copii și
            familiile lor.
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Instituțiile cu siglă: sigla, la aceeași înălțime cu celelalte. */}
            {PARTENERI_INSTITUTIONALI.map((partener) => (
              <li key={partener.nume}>
                <div className="colt-mic-a flex h-full items-center gap-4 bg-hartie px-5 py-4 shadow-[0_12px_28px_-20px_rgba(35,35,35,0.5)]">
                  <Image
                    src={partener.cale}
                    alt={`Sigla ${partener.nume}`}
                    width={120}
                    height={120}
                    className="size-12 shrink-0 object-contain"
                  />
                  <span className="font-titlu text-mic font-semibold text-cerneala">
                    {partener.nume}
                  </span>
                </div>
              </li>
            ))}

            {/*
              Restul instituțiilor nu au siglă în arhiva preluată, iar o adresă
              ghicită ar duce vizitatorul în altă parte. Apar cu numele, scris
              corect, până primim siglele și adresele de la asociație.
            */}
            {PARTENERI_FARA_SIGLA.map((partener, i) => (
              <li key={partener}>
                <div
                  className={`flex h-full items-center gap-4 ${
                    i % 2 === 0 ? "colt-mic-b" : "colt-mic-a"
                  } bg-hartie px-5 py-4 shadow-[0_12px_28px_-20px_rgba(35,35,35,0.5)]`}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-miere-100 text-miere-700">
                    <Pictograma nume="cladire" className="size-5" />
                  </span>
                  <span className="font-titlu text-mic font-semibold text-cerneala">
                    {partener}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.8 — Transparență */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div
            id="transparenta"
            className="colt-a scroll-mt-32 bg-hartie-calda p-8 shadow-[0_20px_42px_-24px_rgba(35,35,35,0.5)] sm:p-10"
          >
            <span className="colt-mic-a mb-5 inline-flex size-12 items-center justify-center bg-caramiziu-100 text-caramiziu-600">
              <Pictograma nume="document" className="size-6" />
            </span>
            <h2 className="text-h3 text-cerneala">Transparență</h2>
            <p className="mt-3 text-cerneala-moale">
              Spunem deschis ce facem și cum folosim fiecare donație.
            </p>
            <Buton href={RUTE.raport2025} className="mt-7">
              Raport de activitate 2025
            </Buton>
          </div>
        </div>
      </section>

      {/* 3.9 */}
      <IndemnFinal />
    </>
  );
}
