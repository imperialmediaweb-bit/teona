import type { Metadata } from "next";
import { JsonLd, jsonLdFir, jsonLdIntrebari, metadate } from "@/app/seo";
import Image from "next/image";
import Link from "next/link";
import {
  ASOCIATIA,
  CONTURI,
  EMAIL,
  RUTE,
  SMS,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import Aparitie from "@/componente/Aparitie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";
import DeCopiat from "@/componente/pagina/DeCopiat";
import DocumentDeDescarcat from "@/componente/pagina/DocumentDeDescarcat";
import Intrebari, { type Intrebare } from "@/componente/pagina/Intrebari";
import TitluSectiune from "@/componente/pagina/TitluSectiune";
import FormularDonatie from "@/componente/formular/FormularDonatie";

export const metadata: Metadata = metadate({
  titlu: "Donează",
  descriere:
    "Donează pentru copiii cu nevoi speciale din Suceava: cu cardul, lunar prin SMS cu SUSTIN la 8835, prin transfer bancar sau de ziua ta. Întrebări frecvente.",
  cale: "/doneaza",
});

/** Butonul alb, pentru fundalurile colorate: acolo portocaliul ar dispărea. */
const BUTON_ALB =
  "border-hartie bg-hartie text-caramiziu-600 hover:border-hartie hover:text-caramiziu-700";

/** Scurtăturile din antet spre celelalte modalități (2.3 cere ancore). */
const SCURTATURI: ReadonlyArray<{
  href: string;
  eticheta: string;
  pictograma: NumePictograma;
}> = [
  { href: "#sms", eticheta: "Donează lunar prin SMS", pictograma: "telefon" },
  { href: "#transfer", eticheta: "Transfer bancar", pictograma: "cladire" },
  {
    href: "#ziua-ta",
    eticheta: "Donează-ți ziua de naștere",
    pictograma: "joaca",
  },
  { href: "#firme", eticheta: "Pentru firme", pictograma: "document" },
];

/**
 * Întrebările frecvente, în afara componentei: aceeași listă ajunge și pe
 * pagină, și în datele structurate (`FAQPage`), deci nu pot diverge.
 */
const INTREBARI: ReadonlyArray<Intrebare> = [
  {
    intrebare: "Pot dona lunar și opri oricând?",
    raspuns: (
      <p>
        Da. Poți dona lunar prin SMS sau prin card, iar donația lunară se
        oprește oricând, fără motivare și fără penalități. Dacă ai nevoie de
        ajutor, scrie-ne la{" "}
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
        Da. Donațiile făcute online îți aduc o confirmare pe e-mail din partea
        platformei de plată. Pentru donațiile prin transfer bancar, extrasul tău
        de cont este dovada plății. Dacă ai nevoie de o confirmare scrisă din
        partea asociației, scrie-ne la {EMAIL.contact} și ți-o trimitem.
      </p>
    ),
  },
  {
    intrebare: "Donația se poate deduce?",
    raspuns: (
      <p>
        Donația făcută de o persoană fizică nu se deduce din impozitul pe venit.
        Există însă o variantă care nu te costă nimic: poți redirecționa 3,5%
        din impozitul pe venit către asociație, fără să plătești în plus.
        Detalii găsești la pagina{" "}
        <Link
          href={RUTE.redirectionare35}
          className="font-titlu font-semibold text-caramiziu-600 underline-offset-4 hover:underline"
        >
          Redirecționează 3,5%
        </Link>
        . Companiile pot beneficia de facilități fiscale prin contract de
        sponsorizare, în condițiile legii.
      </p>
    ),
  },
  {
    intrebare: "Cum donez ca firmă?",
    raspuns: (
      <>
        <p>
          Poți dona prin transfer bancar în contul asociației sau poți încheia
          un contract de sponsorizare, care îți permite să beneficiezi de
          facilitățile fiscale prevăzute de lege. Date pentru plată:
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
          Pentru un contract de sponsorizare, scrie-ne la {EMAIL.contact} sau
          sună-ne la {TELEFON_PRINCIPAL.afisat}. Ne ocupăm împreună de toate
          documentele. De asemenea, poți direcționa până la 20% din impozitul pe
          profit, la pagina{" "}
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
          Banii strânși merg către copiii și familiile din programele noastre și
          către activitatea de zi cu zi a asociației. Sunt folosiți pentru:
        </p>
        <ul className="grid list-disc gap-1.5 pl-5">
          <li>
            taberele pentru copii cu nevoi speciale, pentru copii premianți din
            sistemul de protecție a copilului și pentru copii care au trecut
            prin cancer (cazare, masă, transport, activități);
          </li>
          <li>
            activitățile de la Casa Teona: activități pentru copii și grupuri de
            sprijin pentru părinți;
          </li>
          <li>
            cheltuielile administrative ale centrului Casa Teona (întreținere,
            utilități și funcționare), care păstrează deschisă casa pentru copii
            și familii;
          </li>
          <li>
            cazurile umanitare: în aceste situații nu dăm bani direct
            beneficiarilor. Plătim noi facturile clinicilor și medicamentele,
            iar banii ajung exact unde este nevoie.
          </li>
        </ul>
      </>
    ),
  },
];

export default function Doneaza() {
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Donează", cale: RUTE.doneaza }])} />
      {/* 2.1 — antet, cu formularul de card (2.2) în prim-plan, în dreapta. */}
      <section className="granulatie relative isolate overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-14 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span className="pata absolute -top-32 right-[-8%] size-[28rem] rounded-full bg-caramiziu-100/60 blur-3xl" />
          <span className="pata pata-2 absolute bottom-[-8rem] left-[-8rem] size-[24rem] rounded-full bg-miere-100/70 blur-3xl" />
          <Decor
            semn="inima"
            className="pluteste-lent absolute top-10 right-[5%] hidden size-10 text-caramiziu-200 lg:block"
          />
          <Decor
            semn="stea"
            className="pluteste-lent absolute bottom-24 left-[4%] size-8 text-miere-300 lg:size-11"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
          <div className="lg:pt-4">
            <p className="scris text-amplu text-caramiziu-600">
              „{ASOCIATIA.motto}”
            </p>
            <h1 className="mt-3 text-h1 text-cerneala">Donează</h1>
            <p className="mt-6 max-w-xl text-amplu text-cerneala-moale">
              Alege modul care ți se potrivește. Donația ta ne ajută enorm să
              oferim în continuare sprijin celor care au atât de mare nevoie.
            </p>

            <ul className="mt-9 grid grid-cols-2 gap-3">
              {SCURTATURI.map((link, i) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`flex min-h-14 items-center gap-3 ${
                      i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"
                    } border border-hartie-umbra bg-hartie px-4 py-3 font-titlu text-mic font-bold text-cerneala shadow-[0_14px_30px_-20px_rgba(35,35,35,0.45)] transition-all duration-300 ease-cald hover:-translate-y-0.5 hover:text-caramiziu-600 motion-reduce:hover:translate-y-0`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-caramiziu-100 text-caramiziu-600">
                      <Pictograma nume={link.pictograma} className="size-5" />
                    </span>
                    {link.eticheta}
                  </a>
                </li>
              ))}
            </ul>

            {/* Cutia de donații de la Casa Teona: ce se vede când dai. */}
            <figure className="relative mt-12 hidden lg:block">
              <span
                aria-hidden="true"
                className="absolute -right-4 -bottom-4 h-[70%] w-[62%] colt-a bg-miere-200"
              />
              <div className="colt-b relative aspect-[4/3] overflow-hidden bg-hartie-umbra shadow-[0_26px_52px_-24px_rgba(255,172,0,0.6)]">
                <Image
                  src="/poze/2025/03/WhatsApp-Image-2025-03-18-at-15.19.20.jpeg"
                  alt="Standul de la Casa Teona: cutia de donații cu sigla asociației, un afiș „Eu creez, împreună donăm… pentru copii cu dizabilități” și brățări colorate pe un suport"
                  fill
                  sizes="(min-width: 1024px) 460px, 0px"
                  className="object-cover"
                />
              </div>
              <figcaption className="colt-mic-b absolute -bottom-3.5 left-5 bg-caramiziu-500 px-4 py-1.5 shadow-[0_10px_24px_-10px_rgba(247,79,34,0.9)]">
                <span className="scris text-corp leading-none text-hartie">
                  La Casa Teona
                </span>
              </figcaption>
            </figure>
          </div>

          {/* 2.2 — donația cu cardul, primul bloc de pe pagină. */}
          <div>
            <h2 className="sr-only">Donează cu cardul</h2>
            <FormularDonatie />
          </div>
        </div>
      </section>

      {/* 2.3 — alte modalități: patru blocuri, niciunul ca vecinul lui. */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="relative overflow-hidden bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="spirala"
            className="pluteste-lent absolute top-16 right-[4%] size-10 text-turcoaz-200 lg:size-14"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-40 left-[2%] size-10 text-miere-300 lg:size-14"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Fără card? Se poate și așa."
            titlu="Alte modalități de a dona"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* SMS — câmp de miere, cu codul scris cât cardul. */}
            <Aparitie className="h-full">
              <section
                id="sms"
                className="granulatie relative flex h-full scroll-mt-32 flex-col overflow-hidden colt-a bg-miere-300 p-7 shadow-[0_30px_60px_-28px_rgba(255,172,0,0.9)] sm:p-9"
              >
                <Decor
                  semn="stea"
                  strokeWidth={0.8}
                  className="absolute -top-12 -right-12 size-52 text-miere-200/80"
                />
                <span className="colt-mic-b relative flex size-14 items-center justify-center bg-cerneala/10 text-cerneala">
                  <Pictograma nume="telefon" className="size-7" />
                </span>
                <h3 className="relative mt-5 text-h3 text-miere-900">
                  Donează lunar prin SMS
                </h3>
                {/*
                  Cuvântul-cheie se scrie SUSTIN, fără diacritice. Scris
                  „SUSȚIN”, operatorul nu-l mai recunoaște și donația nu se
                  activează niciodată.
                */}
                <p
                  aria-hidden="true"
                  className="relative mt-5 font-titlu text-[3.2rem] leading-none font-extrabold tracking-tight text-hartie sm:text-[3.8rem]"
                >
                  {SMS.text}
                  <span className="mt-1 block text-[1.5rem] text-miere-900/80">
                    la {SMS.numar}
                  </span>
                </p>
                <p className="relative mt-4 text-amplu text-miere-900">
                  Trimite{" "}
                  <strong className="font-titlu font-extrabold">
                    {SMS.text}
                  </strong>{" "}
                  la{" "}
                  <strong className="font-titlu font-extrabold">
                    {SMS.numar}
                  </strong>{" "}
                  și donezi {SMS.sumaLunara} lunar
                </p>

                <div className="relative mt-5 grid gap-3 text-mic text-miere-900/85">
                  <p>
                    Numărul este valabil în rețelele Digi Mobil, Orange, Telekom
                    România Mobile și Vodafone. Taxarea se face în doi pași.
                  </p>
                  <p>
                    Pentru a activa donația lunară, este nevoie de confirmare.
                    Mesajul de abonare și cel de confirmare sunt complet
                    gratuite și nu implică niciun cost suplimentar. Odată
                    confirmată abonarea, contribuția lunară este de 5 euro,
                    aceasta fiind taxată automat prin SMS. Dacă dorești să
                    oprești donațiile, trimite textul{" "}
                    <strong className="font-titlu font-bold text-miere-900">
                      {SMS.textOprire}
                    </strong>{" "}
                    la numărul {SMS.numar} (tarif gratuit).
                  </p>
                  <p>
                    Pentru mai multe informații, poți contacta asociația la
                    numărul de telefon{" "}
                    <a
                      href={`tel:${TELEFON_PRINCIPAL.apel}`}
                      className="font-titlu font-bold text-miere-900 underline-offset-4 hover:underline"
                    >
                      {TELEFON_PRINCIPAL.afisat}
                    </a>
                    .
                  </p>
                </div>
              </section>
            </Aparitie>

            {/* Transfer bancar — turcoaz liniștit, cu IBAN-urile de copiat. */}
            <Aparitie intarziere={0.06} className="h-full">
              <section
                id="transfer"
                className="granulatie relative flex h-full scroll-mt-32 flex-col overflow-hidden colt-b bg-turcoaz-100 p-7 shadow-[0_30px_60px_-28px_rgba(42,159,163,0.6)] sm:p-9"
              >
                <Decor
                  semn="spirala"
                  strokeWidth={0.8}
                  className="absolute -right-12 -bottom-12 size-48 text-turcoaz-200"
                />
                <span className="colt-mic-a relative flex size-14 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                  <Pictograma nume="cladire" className="size-7" />
                </span>
                <h3 className="relative mt-5 text-h3 text-turcoaz-900">
                  Transfer bancar
                </h3>
                <p className="relative mt-3 text-amplu text-turcoaz-900/80">
                  Donezi direct în contul asociației.
                </p>

                <div className="relative mt-6 grid gap-3">
                  {CONTURI.map((cont, i) => (
                    <DeCopiat
                      key={cont.iban}
                      eticheta={`${cont.banca} (${cont.moneda})`}
                      valoare={cont.iban}
                      deCopiat={cont.iban.replace(/\s/g, "")}
                      culoare="turcoaz"
                      colt={i % 2 === 0 ? "a" : "b"}
                    />
                  ))}
                </div>

                <p className="relative mt-5 text-mic text-turcoaz-900/80">
                  Titular: {ASOCIATIA.denumireLegala} · CIF: {ASOCIATIA.cif}
                </p>
              </section>
            </Aparitie>

            {/* Ziua de naștere — cu fotografia copiilor în cerc, pe iarbă. */}
            <Aparitie intarziere={0.1} className="h-full">
              <section
                id="ziua-ta"
                className="flex h-full scroll-mt-32 flex-col overflow-hidden colt-b border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)]"
              >
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/poze/2024/11/449496204_497189886214688_2290669171247077659_n-768x1024.jpg"
                    alt="O voluntară și patru copii se țin de mână în cerc, pe iarbă, lângă o plasă de volei; un copil stă ghemuit în mijloc"
                    fill
                    sizes="(min-width: 1024px) 600px, 92vw"
                    className="object-cover"
                  />
                  <span className="colt-mic-a absolute top-4 left-4 flex size-12 items-center justify-center bg-miere-400 text-cerneala shadow-[0_10px_22px_-10px_rgba(255,172,0,0.9)]">
                    <Pictograma nume="joaca" className="size-6" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-7 sm:p-9">
                  <h3 className="text-h3 text-cerneala">
                    Donează-ți ziua de naștere
                  </h3>
                  <p className="mt-3 flex-1 text-cerneala-moale">
                    Creează o pagină de strângere de fonduri pentru ziua ta și
                    invită prietenii să te sprijine.
                  </p>
                  <Buton
                    href={RUTE.ziuaTa}
                    varianta="secundar"
                    className="mt-6 self-start"
                  >
                    Creează pagina ta
                  </Buton>
                </div>
              </section>
            </Aparitie>

            {/* 3,5% — pe culoarea de identitate, cu procentul scris mare. */}
            <Aparitie intarziere={0.14} className="h-full">
              <section className="granulatie relative flex h-full flex-col overflow-hidden colt-a bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-7 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.85)] sm:p-9">
                <span
                  aria-hidden="true"
                  className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-hartie/20"
                />
                <span className="colt-mic-b relative flex size-14 items-center justify-center bg-hartie/20 text-hartie">
                  <Pictograma nume="document" className="size-7" />
                </span>
                <p
                  aria-hidden="true"
                  className="relative mt-5 font-titlu text-[3.6rem] leading-none font-extrabold tracking-tight text-hartie"
                >
                  3,5%
                </p>
                <h3 className="relative mt-4 text-h3 text-hartie">
                  Redirecționează 3,5% din impozit
                </h3>
                <p className="relative mt-3 flex-1 text-hartie/90">
                  Nu te costă nimic în plus: completezi formularul și o parte
                  din impozitul pe venit ajunge la copii. Termenul este 25 mai,
                  în fiecare an.
                </p>
                <Buton
                  href={RUTE.redirectionare35}
                  varianta="contur"
                  className={`relative mt-6 self-start ${BUTON_ALB}`}
                >
                  Redirecționează
                </Buton>
              </section>
            </Aparitie>
          </div>
        </div>
      </section>

      {/* 2.4 — pentru firme */}
      <Val culoare="text-tenta-turcoaz" className={VAL_PESTE} />
      <section
        id="firme"
        className="granulatie relative scroll-mt-32 overflow-hidden bg-tenta-turcoaz pt-6 pb-24 lg:pt-10 lg:pb-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-14 right-[5%] size-10 text-miere-300 lg:size-14"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitluSectiune
            scris="Pentru firme"
            titlu="Fii partenerul nostru, implică firma ta în povestea acestor copii minunați."
            culoare="turcoaz"
          />

          <ul className="mt-12 grid gap-5 lg:grid-cols-3">
            <li>
              <Aparitie className="h-full">
                <div className="flex h-full flex-col overflow-hidden colt-a border border-hartie-umbra bg-hartie shadow-[0_24px_50px_-26px_rgba(42,159,163,0.5)]">
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src="/poze/2024/11/459590851_545309534736056_5697611419655887236_n.jpg"
                      alt="Copii în tricouri albe țin litere colorate care formează „Mulțumim Egger”, între două bannere ale asociației, în fața pensiunii din tabără"
                      fill
                      sizes="(min-width: 1024px) 400px, 92vw"
                      className="object-cover"
                    />
                    <span className="colt-mic-b absolute top-4 left-4 flex size-12 items-center justify-center bg-turcoaz-500 text-hartie shadow-[0_10px_22px_-10px_rgba(42,159,163,0.9)]">
                      <Pictograma nume="cladire" className="size-6" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <h3 className="text-h4 text-cerneala">Direcționează 20%</h3>
                    <p className="mt-2 flex-1 text-mic text-cerneala-moale">
                      Află cum poți direcționa o parte din impozitul pe profit
                      către copii.
                    </p>
                    <Buton
                      href={RUTE.directionare20}
                      varianta="contur"
                      className="mt-5 self-start"
                    >
                      Află cum
                      <span className="sr-only">să direcționezi 20%</span>
                      <Pictograma nume="sageata" className="size-4" />
                    </Buton>
                  </div>
                </div>
              </Aparitie>
            </li>
            <li>
              <Aparitie intarziere={0.06} className="h-full">
                <DocumentDeDescarcat
                  titlu="Declarația 177"
                  descriere="Modelul declarației, completat cu datele asociației."
                  format="PDF"
                  colt="b"
                />
              </Aparitie>
            </li>
            <li>
              <Aparitie intarziere={0.12} className="h-full">
                <DocumentDeDescarcat
                  titlu="Contract de sponsorizare"
                  descriere="Modelul de contract, gata de completat de firma ta."
                  format="Word"
                  colt="a"
                />
              </Aparitie>
            </li>
          </ul>

          {/* „Sub cele trei carduri: butonul Scrie-ne”, pentru firmele care
              vor un contract personalizat. */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Buton href={`mailto:${EMAIL.contact}`}>
              <Pictograma nume="plic" className="size-5" />
              Scrie-ne
            </Buton>
            <p className="text-cerneala-moale">
              Vrei un contract personalizat? Ne ocupăm împreună de toate
              documentele.
            </p>
          </div>
        </div>
      </section>

      {/* 2.5 — întrebări frecvente */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <JsonLd date={jsonLdIntrebari(INTREBARI)} />
      <Intrebari
        scris="Ce ne întreabă donatorii"
        poza={{
          cale: "/poze/2024/11/438814270_2663080130535965_2029375574315086726_n-766x1024.jpg",
          alt: "Copii și voluntari, la o masă plină cu hârtie creponată colorată, carioci și boluri, la un atelier creativ din tabără",
          legenda: "Atelier în tabără",
        }}
        intrebari={INTREBARI}
      />
    </>
  );
}
