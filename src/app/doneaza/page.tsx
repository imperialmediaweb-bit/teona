import type { Metadata } from "next";
import Link from "next/link";
import {
  ASOCIATIA,
  CONTURI,
  EMAIL,
  LINKURI_EXTERNE,
  RUTE,
  SMS,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";
import Val from "@/componente/Val";
import DeCopiat from "@/componente/pagina/DeCopiat";
import DocumentDeDescarcat from "@/componente/pagina/DocumentDeDescarcat";
import Intrebari from "@/componente/pagina/Intrebari";
import FormularDonatie from "@/componente/formular/FormularDonatie";

export const metadata: Metadata = {
  title: "Donează",
  description:
    "Alege modul care ți se potrivește: card, SMS, transfer bancar sau redirecționarea impozitului. Donația ta ne ajută enorm.",
};

export default function Doneaza() {
  return (
    <>
      {/* 2.1 — antet */}
      <section className="granulatie relative overflow-hidden bg-tenta-cald pt-10 pb-20 lg:pt-16 lg:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Decor
            semn="inima"
            className="pluteste-lent absolute top-14 right-[6%] size-9 text-caramiziu-200 lg:size-12"
          />
          <Decor
            semn="stea"
            className="pluteste-lent absolute bottom-24 left-[4%] size-8 text-miere-300 lg:size-11"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:px-8">
          <div className="lg:pt-6">
            <h1 className="text-h1 text-cerneala">Donează</h1>
            <p className="mt-5 max-w-xl text-amplu text-cerneala-moale">
              Alege modul care ți se potrivește. Donația ta ne ajută enorm să
              oferim în continuare sprijin celor care au atât de mare nevoie.
            </p>

            <ul className="mt-9 grid gap-3">
              {[
                { href: "#sms", eticheta: "Donează lunar prin SMS" },
                { href: "#transfer", eticheta: "Transfer bancar" },
                { href: "#ziua-ta", eticheta: "Donează-ți ziua de naștere" },
                { href: "#firme", eticheta: "Pentru firme" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600 underline-offset-4 transition hover:underline"
                  >
                    <Pictograma nume="sageata" className="size-4 rotate-90" />
                    {link.eticheta}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 2.2 — donația cu cardul, primul bloc de pe pagină. */}
          <div>
            <h2 className="sr-only">Donează cu cardul</h2>
            <FormularDonatie />
          </div>
        </div>
      </section>

      {/* 2.3 — alte modalități */}
      <Val culoare="text-hartie" />
      <section className="bg-hartie pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Alte modalități de a dona</h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* SMS */}
            <section
              id="sms"
              className="colt-a scroll-mt-32 bg-hartie-calda p-7 shadow-[0_20px_42px_-24px_rgba(247,79,34,0.5)] sm:p-9"
            >
              <span className="colt-mic-a flex size-14 items-center justify-center bg-caramiziu-500 text-hartie shadow-[0_10px_22px_-10px_rgba(247,79,34,0.9)]">
                <Pictograma nume="telefon" className="size-7" />
              </span>
              <h3 className="mt-5 text-h3 text-cerneala">
                Donează lunar prin SMS
              </h3>
              <p className="mt-3 text-amplu text-cerneala">
                Trimite{" "}
                {/*
                  Cuvântul-cheie se scrie SUSTIN, fără diacritice. Scris
                  „SUSȚIN”, operatorul nu-l mai recunoaște și donația nu se
                  activează niciodată.
                */}
                <strong className="font-titlu font-extrabold text-caramiziu-600">
                  {SMS.text}
                </strong>{" "}
                la{" "}
                <strong className="font-titlu font-extrabold text-caramiziu-600">
                  {SMS.numar}
                </strong>{" "}
                și donezi {SMS.sumaLunara} lunar
              </p>

              <div className="mt-5 grid gap-3 text-mic text-cerneala-moale">
                <p>
                  Numărul este valabil în rețelele Digi Mobil, Orange, Telekom
                  România Mobile și Vodafone. Taxarea se face în doi pași.
                </p>
                <p>
                  Pentru a activa donația lunară, este nevoie de confirmare.
                  Mesajul de abonare și cel de confirmare sunt complet gratuite
                  și nu implică niciun cost suplimentar. Odată confirmată
                  abonarea, contribuția lunară este de 5 euro, aceasta fiind
                  taxată automat prin SMS. Dacă dorești să oprești donațiile,
                  trimite textul{" "}
                  <strong className="font-titlu font-bold text-cerneala">
                    {SMS.textOprire}
                  </strong>{" "}
                  la numărul {SMS.numar} (tarif gratuit).
                </p>
                <p>
                  Pentru mai multe informații, poți contacta asociația la
                  numărul de telefon{" "}
                  <a
                    href={`tel:${TELEFON_PRINCIPAL.apel}`}
                    className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
                  >
                    {TELEFON_PRINCIPAL.afisat}
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* Transfer bancar */}
            <section
              id="transfer"
              className="colt-b scroll-mt-32 bg-hartie-calda p-7 shadow-[0_20px_42px_-24px_rgba(42,159,163,0.45)] sm:p-9"
            >
              <span className="colt-mic-b flex size-14 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                <Pictograma nume="cladire" className="size-7" />
              </span>
              <h3 className="mt-5 text-h3 text-cerneala">Transfer bancar</h3>
              <p className="mt-3 text-cerneala-moale">
                Donezi direct în contul asociației.
              </p>

              <div className="mt-6 grid gap-3">
                {CONTURI.map((cont) => (
                  <DeCopiat
                    key={cont.iban}
                    eticheta={`${cont.banca} (${cont.moneda})`}
                    valoare={cont.iban}
                    deCopiat={cont.iban.replace(/\s/g, "")}
                  />
                ))}
              </div>

              <p className="mt-5 text-mic text-cerneala-moale">
                Titular: {ASOCIATIA.denumireLegala} · CIF: {ASOCIATIA.cif}
              </p>
            </section>

            {/* Ziua de naștere */}
            <section
              id="ziua-ta"
              className="colt-b scroll-mt-32 bg-hartie-calda p-7 shadow-[0_20px_42px_-24px_rgba(255,172,0,0.5)] sm:p-9"
            >
              <span className="colt-mic-b flex size-14 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                <Pictograma nume="joaca" className="size-7" />
              </span>
              <h3 className="mt-5 text-h3 text-cerneala">
                Donează-ți ziua de naștere
              </h3>
              <p className="mt-3 text-cerneala-moale">
                Creează o pagină de strângere de fonduri pentru ziua ta și
                invită prietenii să te sprijine.
              </p>
              <Buton
                href={LINKURI_EXTERNE.galantomZiuaTa}
                varianta="secundar"
                className="mt-6"
              >
                Creează pagina ta
              </Buton>
            </section>

            {/* Redirecționare 3,5% */}
            <section className="colt-a bg-hartie-calda p-7 shadow-[0_20px_42px_-24px_rgba(247,79,34,0.5)] sm:p-9">
              <span className="colt-mic-a flex size-14 items-center justify-center bg-caramiziu-100 text-caramiziu-600">
                <Pictograma nume="document" className="size-7" />
              </span>
              <h3 className="mt-5 text-h3 text-cerneala">
                Redirecționează 3,5% din impozit
              </h3>
              <p className="mt-3 text-cerneala-moale">
                Nu te costă nimic în plus: completezi formularul și o parte din
                impozitul pe venit ajunge la copii. Termenul este 25 mai, în
                fiecare an.
              </p>
              <Buton href={RUTE.redirectionare35} className="mt-6">
                Redirecționează
              </Buton>
            </section>
          </div>
        </div>
      </section>

      {/* 2.4 — pentru firme */}
      <Val culoare="text-tenta-turcoaz" />
      <section
        id="firme"
        className="granulatie scroll-mt-32 bg-tenta-turcoaz pb-20 lg:pb-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-3xl text-h2 text-cerneala">
            Fii partenerul nostru, implică firma ta în povestea acestor copii
            minunați.
          </h2>

          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            <li>
              <div className="colt-a flex h-full flex-col bg-hartie p-7 shadow-[0_18px_38px_-22px_rgba(42,159,163,0.45)]">
                <span className="colt-mic-a flex size-12 items-center justify-center bg-turcoaz-100 text-turcoaz-700">
                  <Pictograma nume="cladire" className="size-6" />
                </span>
                <h3 className="mt-5 text-h4 text-cerneala">Direcționează 20%</h3>
                <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                  Află cum poți direcționa o parte din impozitul pe profit către
                  copii.
                </p>
                <Buton
                  href={RUTE.directionare20}
                  varianta="contur"
                  marime="mic"
                  className="mt-5 self-start"
                >
                  Află cum
                </Buton>
              </div>
            </li>
            <li>
              <DocumentDeDescarcat
                titlu="Declarația 177"
                descriere="Modelul declarației, completat cu datele asociației."
                format="PDF"
              />
            </li>
            <li>
              <DocumentDeDescarcat
                titlu="Contract de sponsorizare"
                descriere="Modelul de contract, gata de completat de firma ta."
                format="Word"
              />
            </li>
          </ul>

          <p className="mt-8 text-cerneala-moale">
            Vrei un contract personalizat?{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
            >
              Scrie-ne
            </a>
            .
          </p>
        </div>
      </section>

      {/* 2.5 — întrebări frecvente */}
      <Val culoare="text-hartie" />
      <Intrebari
        intrebari={[
          {
            intrebare: "Pot dona lunar și opri oricând?",
            raspuns: (
              <p>
                Da. Poți dona lunar prin SMS sau prin card, iar donația lunară
                se oprește oricând, fără motivare și fără penalități. Dacă ai
                nevoie de ajutor, scrie-ne la{" "}
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
                >
                  {EMAIL.contact}
                </a>{" "}
                sau sună-ne la {TELEFON_PRINCIPAL.afisat}.
              </p>
            ),
          },
          {
            intrebare: "Primesc confirmare pentru donație?",
            raspuns: (
              <p>
                Da. Donațiile făcute online îți aduc o confirmare pe e-mail din
                partea platformei de plată. Pentru donațiile prin transfer
                bancar, extrasul tău de cont este dovada plății. Dacă ai nevoie
                de o confirmare scrisă din partea asociației, scrie-ne la{" "}
                {EMAIL.contact} și ți-o trimitem.
              </p>
            ),
          },
          {
            intrebare: "Donația se poate deduce?",
            raspuns: (
              <p>
                Donația făcută de o persoană fizică nu se deduce din impozitul
                pe venit. Există însă o variantă care nu te costă nimic: poți
                redirecționa 3,5% din impozitul pe venit către asociație, fără
                să plătești în plus. Detalii găsești la pagina{" "}
                <Link
                  href={RUTE.redirectionare35}
                  className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
                >
                  Redirecționează 3,5%
                </Link>
                . Companiile pot beneficia de facilități fiscale prin contract
                de sponsorizare, în condițiile legii.
              </p>
            ),
          },
          {
            intrebare: "Cum donez ca firmă?",
            raspuns: (
              <>
                <p>
                  Poți dona prin transfer bancar în contul asociației sau poți
                  încheia un contract de sponsorizare, care îți permite să
                  beneficiezi de facilitățile fiscale prevăzute de lege. Date
                  pentru plată:
                </p>
                <ul className="grid gap-1.5">
                  <li>Titular: {ASOCIATIA.denumireLegala}</li>
                  <li>CIF: {ASOCIATIA.cif}</li>
                  {CONTURI.map((cont) => (
                    <li key={cont.iban}>
                      Cont {cont.moneda} ({cont.banca}):{" "}
                      <span className="select-all">{cont.iban}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Pentru un contract de sponsorizare, scrie-ne la{" "}
                  {EMAIL.contact} sau sună-ne la {TELEFON_PRINCIPAL.afisat}. Ne
                  ocupăm împreună de toate documentele. De asemenea, poți
                  direcționa până la 20% din impozitul pe profit, la pagina{" "}
                  <Link
                    href={RUTE.directionare20}
                    className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
                  >
                    Direcționează 20%
                  </Link>
                  .
                </p>
              </>
            ),
          },
          {
            intrebare: "Cum opresc donația lunară prin SMS?",
            raspuns: (
              <p>
                Trimite textul{" "}
                <strong className="font-titlu font-bold text-cerneala">
                  {SMS.textOprire}
                </strong>{" "}
                la numărul {SMS.numar}. Mesajul este gratuit.
              </p>
            ),
          },
          {
            intrebare: "Unde ajunge donația mea?",
            raspuns: (
              <>
                <p>
                  Banii strânși merg către copiii și familiile din programele
                  noastre și către activitatea de zi cu zi a asociației. Sunt
                  folosiți pentru:
                </p>
                <ul className="grid list-disc gap-1.5 pl-5">
                  <li>
                    taberele pentru copii cu nevoi speciale, pentru copii
                    premianți din sistemul de protecție a copilului și pentru
                    copii care au trecut prin cancer (cazare, masă, transport,
                    activități);
                  </li>
                  <li>
                    activitățile de la Casa Teona: activități pentru copii și
                    grupuri de sprijin pentru părinți;
                  </li>
                  <li>
                    cheltuielile administrative ale centrului Casa Teona
                    (întreținere, utilități și funcționare), care păstrează
                    deschisă casa pentru copii și familii;
                  </li>
                  <li>
                    cazurile umanitare: în aceste situații nu dăm bani direct
                    beneficiarilor. Plătim noi facturile clinicilor și
                    medicamentele, iar banii ajung exact unde este nevoie.
                  </li>
                </ul>
              </>
            ),
          },
        ]}
      />
    </>
  );
}
