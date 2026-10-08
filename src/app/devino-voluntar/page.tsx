import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL, RUTE, TELEFOANE } from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val from "@/componente/Val";
import AntetPagina from "@/componente/pagina/AntetPagina";
import Galerie from "@/componente/pagina/Galerie";
import Pasi from "@/componente/pagina/Pasi";
import FormularVoluntar from "@/componente/formular/FormularVoluntar";

export const metadata: Metadata = {
  title: "Devino voluntar",
  description:
    "Alătură-te Culegătorilor de Zâmbete și fii alături de copiii cu nevoi speciale și de familiile lor.",
};

/** 11.6 — șase fotografii cu voluntari. */
const GALERIE = [
  {
    cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
    alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
  },
  {
    cale: "/poze/2024/11/Screenshot_56-1.png",
    alt: "Un voluntar îi arată unei fetițe tricoul primit în tabără",
  },
  {
    cale: "/poze/2024/11/278495378_647322639843213_2394948498616303816_n-1024x768.jpg",
    alt: "O voluntară ajută o fetiță la un atelier de bucătărie, într-o sală de lemn din tabără",
  },
  {
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară desenează împreună cu un copil, la masă",
  },
  {
    cale: "/poze/2024/11/449597800_497189906214686_1996782188503194582_n.jpg",
    alt: "Mâna unui voluntar îi întinde o minge portocalie unei fetițe, pe o alee din tabără",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Voluntari și copii, în grup, la apus",
  },
] as const;

/** 11.6 — „Nu poți fi voluntar acum? Poți ajuta și altfel.” */
const ALTE_MODURI: ReadonlyArray<{
  titlu: string;
  text: string;
  href: string;
  pictograma: NumePictograma;
}> = [
  {
    titlu: "Donează",
    text: "O dată sau lunar, cu cardul, prin SMS sau prin transfer bancar.",
    href: RUTE.doneaza,
    pictograma: "inima",
  },
  {
    titlu: "Redirecționează 3,5%",
    text: "Din impozitul pe venit, fără niciun cost pentru tine.",
    href: RUTE.redirectionare35,
    pictograma: "document",
  },
  {
    titlu: "Direcționează 20%",
    text: "Pentru firme: din impozitul pe profit, prin contract de sponsorizare.",
    href: RUTE.directionare20,
    pictograma: "cladire",
  },
];

export default function DevinoVoluntar() {
  return (
    <>
      <AntetPagina
        titlu="Devino voluntar"
        subtitlu="Implică-te activ, schimbă vieți! Alătură-te Culegătorilor de Zâmbete și fii alături de copiii cu nevoi speciale și de familiile lor, în tabere, la Casa Teona și la alte activități ale asociației."
        poza={{
          cale: "/poze/2024/11/348477655_10078995242126230_596613811472728663_n.jpg",
          alt: "Opt voluntari în uniforme medicale, cu diplomele de participare, în fața pensiunii din tabără",
          legenda: "Culegătorii de Zâmbete",
        }}
        butoane={
          <Buton href="#formular" marime="mare">
            Completează formularul
          </Buton>
        }
      />

      {/* 11.2 și 11.3 */}
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Cum funcționează</h2>
          <Pasi
            className="mt-10 lg:grid-cols-2"
            pasi={[
              "Completezi formularul. Durează câteva minute.",
              "Te contactăm și stabilim împreună unde poți fi cel mai de folos.",
            ]}
          />

          <div className="colt-b mt-10 flex items-center gap-4 bg-miere-50 p-6 shadow-[0_16px_34px_-22px_rgba(255,172,0,0.8)]">
            <span className="colt-mic-b flex size-12 shrink-0 items-center justify-center bg-miere-400 text-cerneala">
              <Pictograma nume="familie" className="size-6" />
            </span>
            <p className="text-amplu text-cerneala">
              <span className="font-titlu font-bold">Cine poate fi voluntar:</span>{" "}
              pentru a deveni voluntar, trebuie să ai minimum 18 ani.
            </p>
          </div>
        </div>
      </section>

      {/* 11.4 — formularul */}
      <Val culoare="text-tenta-cald" />
      <section className="granulatie bg-tenta-cald pb-20 lg:pb-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-16 lg:px-8">
          <div>
            <h2 className="text-h2 text-cerneala">
              Spune-ne câte ceva despre tine
            </h2>
            <p className="mt-4 text-cerneala-moale">
              Formularul durează câteva minute. Te contactăm după ce îl citim.
            </p>
          </div>
          <FormularVoluntar />
        </div>
      </section>

      {/* 11.6 — Culegătorii de Zâmbete */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h3 text-cerneala">Culegătorii de Zâmbete</h2>
          <p className="mt-3 text-cerneala-moale">
            Vezi ce facem împreună cu voluntarii noștri.
          </p>
          {/*
            Aici vin iconițele de Facebook și Instagram ale grupului
            „Culegătorii de Zâmbete” — conturi separate de ale asociației.
            Adresele nu sunt nici în caiet, nici pe site-ul actual; se adaugă
            în clipa în care le primim de la asociație.
          */}
        </div>
      </section>

      {/* 11.6 — galerie */}
      <Galerie titlu="Din tabere și de la Casa Teona" poze={GALERIE} />

      {/* 11.6 — alte moduri de a ajuta */}
      <Val culoare="text-hartie-calda" />
      <section className="granulatie bg-hartie-calda pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">
            Nu poți fi voluntar acum? Poți ajuta și altfel.
          </h2>

          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {ALTE_MODURI.map((mod, i) => (
              <li key={mod.titlu}>
                <Link
                  href={mod.href}
                  className={`group flex h-full flex-col ${
                    i % 2 === 0 ? "colt-a" : "colt-b"
                  } bg-hartie p-7 shadow-[0_18px_38px_-22px_rgba(247,79,34,0.45)] transition-all duration-300 ease-cald hover:-translate-y-1.5 motion-reduce:hover:translate-y-0`}
                >
                  <span className="colt-mic-a flex size-12 items-center justify-center bg-caramiziu-100 text-caramiziu-600 transition-colors duration-300 group-hover:bg-caramiziu-500 group-hover:text-hartie">
                    <Pictograma nume={mod.pictograma} className="size-6" />
                  </span>
                  <h3 className="mt-5 text-h4 text-cerneala">{mod.titlu}</h3>
                  <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                    {mod.text}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600">
                    Află cum
                    <Pictograma nume="sageata" className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 11.6 — contact */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-h3 text-cerneala">Ai întrebări?</h2>
          <p className="mt-4 text-amplu text-cerneala-moale">
            Scrie-ne la{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              {EMAIL.contact}
            </a>{" "}
            sau sună-ne la{" "}
            {TELEFOANE.map((telefon, i) => (
              <span key={telefon.apel}>
                {i > 0 && " / "}
                <a
                  href={`tel:${telefon.apel}`}
                  className="font-titlu font-bold text-caramiziu-600 underline-offset-4 hover:underline"
                >
                  {telefon.afisat}
                </a>
              </span>
            ))}
            .
          </p>
        </div>
      </section>
    </>
  );
}
