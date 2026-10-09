import type { Metadata } from "next";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";
import Link from "next/link";
import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import Buton from "@/componente/Buton";
import Decor from "@/componente/Decor";
import Pictograma from "@/componente/Pictograma";
import Val, { VAL_PESTE } from "@/componente/Val";

export const metadata: Metadata = metadate({
  titlu: "Raport de activitate 2025",
  descriere:
    "Raportul anual 2025 al Asociației Teona Ariana Suceava: tabere RESPIRO, Casa Teona, campanii sociale, parteneri, sponsori, venituri și cheltuieli.",
  cale: "/raport-de-activitate-2025",
});

/**
 * Raportul anual de activitate 2025 (secțiunea Transparență, 3.8).
 *
 * Conținutul e cel din raportul asociației, preluat din WordPress. Acolo era
 * un document încărcat ca text, cu tabelele destrămate la import („4Tabere
 * Respiro”, „TOTAL VENITURI673.547 lei”). Aici cifrele sunt aceleași, dar puse
 * înapoi în structura lor: perechi cifră–etichetă, tabele cu antet, capitole
 * numerotate.
 *
 * Nicio cifră nu e schimbată, rotunjită sau completată.
 *
 * Două lucruri de semnalat asociației, lăsate deliberat **așa cum sunt în
 * raport**, nu „corectate” aici:
 *
 * 1. Raportul spune „29 de tabere în perioada mai 2021 – decembrie 2025”, iar
 *    pe tot restul site-ului apare cifra verificată de 33 de tabere. Una
 *    dintre ele trebuie corectată de asociație — nu de noi, la ghici.
 * 2. Raportul listează 50 de sponsori; pe pagina Sponsori sunt 30, atâtea
 *    sigle există în arhivă. Lista de aici e cea completă.
 */

/** Câmpurile de culoare ale celor șase cifre, pe rând: niciuna ca vecina ei. */
const CAMPURI_CIFRE = [
  "granulatie bg-gradient-to-br from-caramiziu-400 to-caramiziu-600 text-hartie shadow-[0_24px_50px_-26px_rgba(247,79,34,0.8)]",
  "border border-hartie-umbra bg-hartie text-caramiziu-500 shadow-[0_18px_38px_-24px_rgba(35,35,35,0.45)]",
  "granulatie bg-miere-300 text-miere-900 shadow-[0_24px_50px_-26px_rgba(255,172,0,0.8)]",
  "granulatie bg-turcoaz-100 text-turcoaz-700 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.6)]",
  "border border-hartie-umbra bg-hartie text-caramiziu-500 shadow-[0_18px_38px_-24px_rgba(35,35,35,0.45)]",
  "granulatie bg-hartie-calda text-turcoaz-700 shadow-[0_18px_38px_-24px_rgba(42,159,163,0.4)]",
] as const;

const CIFRE_2025 = [
  { valoare: "4", eticheta: "tabere Respiro" },
  { valoare: "80", eticheta: "beneficiari direcți" },
  { valoare: "53", eticheta: "voluntari implicați" },
  { valoare: "19", eticheta: "ateliere Casa Teona" },
  { valoare: "4", eticheta: "ședințe terapie părinți" },
  { valoare: "7", eticheta: "aniversări terapeutice" },
] as const;

const VENITURI = [
  { categorie: "Donații individuale (SMS, online, 3,5%)", suma: "36.952" },
  { categorie: "Sponsorizări companii", suma: "520.243" },
  { categorie: "Evenimente și campanii caritabile", suma: "116.352" },
] as const;

const CHELTUIELI = [
  {
    categorie: "Chirie, utilități, întreținere spațiu Casa Teona",
    suma: "195.398",
  },
  { categorie: "Salarii", suma: "141.496" },
  { categorie: "Organizare tabere Respiro", suma: "154.756" },
  { categorie: "Comunicare și promovare", suma: "8.965" },
  { categorie: "Cheltuieli administrative și contabilitate", suma: "45.008" },
  { categorie: "Amortizări", suma: "12.973" },
] as const;

const CAPITOLE: ReadonlyArray<{
  numar: number;
  titlu: string;
  paragrafe?: ReadonlyArray<string>;
  liste?: ReadonlyArray<{ titlu?: string; elemente: ReadonlyArray<string> }>;
}> = [
  {
    numar: 1,
    titlu: "Despre organizație",
    paragrafe: [
      "Asociația Teona Ariana Suceava este un ONG apolitic și interconfesional, înființat pentru a sprijini copiii cu autism, sindrom Down și alte dizabilități, precum și familiile acestora.",
    ],
    liste: [
      {
        titlu: "Prin Casa Teona și proiectele conexe, oferim:",
        elemente: [
          "Terapii prin joc și stimulare senzorială",
          "Activități educative și de socializare",
          "Sprijin emoțional pentru părinți",
          "Tabere de tip Respiro",
          "Campanii sociale pentru comunități vulnerabile",
        ],
      },
    ],
  },
  {
    numar: 2,
    titlu: "Misiune și viziune",
    paragrafe: [
      "Misiune: susținerea copiilor cu dizabilități și a familiilor lor prin terapie, educație și sprijin emoțional.",
      "Viziune: o comunitate în care fiecare copil este acceptat, iar fiecare părinte se simte înțeles și sprijinit.",
    ],
  },
  {
    numar: 3,
    titlu: "Activitatea Casa Teona",
    paragrafe: [
      "În 2025, Casa Teona a funcționat ca spațiu de terapie, socializare și dezvoltare.",
      "Casa Teona a devenit pentru multe familii „a doua casă” — un loc de acceptare, liniște și speranță. Toate intervențiile sunt oferite fără costuri pentru părinți, cheltuielile fiind acoperite din donații, sponsorizări și granturi.",
    ],
    liste: [
      {
        titlu: "Servicii oferite, gratuit pentru beneficiari:",
        elemente: [
          "Jocuri senzoriale",
          "Terapie 3C",
          "Meloterapie",
          "Ateliere creative (desen, lucru manual)",
          "Stimularea motricității fine și grosiere",
          "Activități de socializare",
          "Grupuri de suport pentru părinți",
        ],
      },
      {
        titlu: "Rezultate 2025:",
        elemente: [
          "19 ateliere de socializare și dezvoltare",
          "4 ședințe de terapie de grup pentru părinți",
          "7 aniversări terapeutice organizate într-un mediu sigur și incluziv",
        ],
      },
    ],
  },
  {
    numar: 4,
    titlu: "Tabere de tip Respiro",
    paragrafe: [
      "Taberele Respiro au reprezentat principalul program intensiv al anului. Aceste tabere au oferit copiilor experiențe terapeutice integrate și părinților timp real de odihnă și reconectare.",
    ],
    liste: [
      {
        titlu: "Impact 2025:",
        elemente: [
          "4 tabere organizate în 2025",
          "29 de tabere organizate cumulat, în perioada mai 2021 – decembrie 2025",
          "80 de beneficiari direcți",
          "53 de voluntari implicați: studenți, cadre didactice, terapeuți, membri ai comunității",
        ],
      },
      {
        titlu: "Activități desfășurate:",
        elemente: [
          "Jocuri senzoriale",
          "Meloterapie",
          "Ateliere creative",
          "Terapie 3C",
          "Consiliere pentru părinți",
        ],
      },
    ],
  },
  {
    numar: 5,
    titlu: "Implicare socială și comunitară",
    liste: [
      {
        titlu: "Educație și conștientizare:",
        elemente: [
          "Sesiuni educaționale în mediul universitar",
          "Participări la conferințe",
          "Intervenții publice privind incluziunea și drepturile persoanelor cu dizabilități",
        ],
      },
      {
        titlu: "Campanii sociale:",
        elemente: [
          "Sprijin material pentru familii vulnerabile",
          "Distribuire de alimente, haine, rechizite și echipamente",
          "Intervenții în județele Suceava și Botoșani",
        ],
      },
      {
        titlu: "Evenimente de incluziune:",
        elemente: [
          "Ziua Mondială a Sindromului Down",
          "Ziua Internațională a Persoanelor cu Dizabilități",
          "Evenimente culturale și caritabile locale",
        ],
      },
    ],
  },
  {
    numar: 6,
    titlu: "Acțiuni sociale majore",
    liste: [
      {
        elemente: [
          "Colecta Națională pentru Banca de Alimente, în aprilie și în decembrie",
          "„Scrisoarea lui Moș Crăciun” — campanie dedicată copiilor",
          "„Ghiozdanul Vesel” — sprijin pentru începutul anului școlar",
        ],
      },
    ],
  },
  {
    numar: 7,
    titlu: "Vizibilitate și comunicare",
    paragrafe: [
      "Apariții media: Monitorul de Suceava, Intermedia TV, Radio Vocea Evangheliei.",
      "Prezență activă pe Facebook, Instagram și TikTok. Comunicarea online a contribuit la creșterea comunității de susținători și voluntari.",
    ],
  },
  {
    numar: 10,
    titlu: "Obiective pentru 2026",
    liste: [
      {
        elemente: [
          "Creșterea numărului de copii beneficiari ai serviciilor Casa Teona",
          "Dezvoltarea programelor de sprijin pentru părinți",
          "Extinderea campaniilor de fundraising",
          "Consolidarea parteneriatelor corporate",
          "Dotarea centrului cu echipamente terapeutice suplimentare",
        ],
      },
    ],
  },
];

const PARTENERI = [
  "DGASPC Suceava",
  "Consiliul Județean Suceava",
  "Universitatea „Ștefan cel Mare” din Suceava",
  "Asociația Institutul pentru Parteneriat Social Bucovina",
] as const;

const SPONSORI_RAPORT = [
  "Egger România",
  "GE Healthcare",
  "ElectroAxa",
  "Destine Broker de Asigurare",
  "Dasmar Thermo",
  "Asociația Copilul din Soare",
  "Imperial Media",
  "Auto Adria",
  "Autodel Holding",
  "Best Distribution",
  "Casa Group",
  "CBC Phoenix",
  "Celestin",
  "Denis Shoes",
  "EdCris",
  "Estrella Nord",
  "Evesicran",
  "FD Figurina",
  "Ferovali",
  "Fundația Assist",
  "Fundația Social Culturală Victoria",
  "General Consulting",
  "Global Design",
  "Granit CGH",
  "IT Cont Group",
  "Kriti Spedition",
  "Lincor Trans",
  "Lusek",
  "Marelvi",
  "Netcom Activ",
  "Manaz",
  "OscarShop",
  "Pasalimani",
  "Rocast Nord",
  "Romoldova",
  "Set Corporation",
  "Sistem Conect",
  "Taco Loco",
  "Tarsin",
  "Yulidey Spedition",
  "Bukovina Gerüstbau",
  "Alex Macoveiciuc Fotograf",
  "Cofetăria Scala",
  "NGGS",
] as const;

function Tabel({
  titlu,
  randuri,
  total,
}: {
  titlu: string;
  randuri: ReadonlyArray<{ categorie: string; suma: string }>;
  total: string;
}) {
  return (
    <div>
      <h3 className="text-h4 text-cerneala">{titlu}</h3>
      <div className="colt-a mt-5 overflow-hidden border border-hartie-umbra bg-hartie shadow-[0_18px_38px_-24px_rgba(35,35,35,0.5)]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-hartie-calda">
              <th
                scope="col"
                className="px-5 py-3 font-titlu text-nota font-bold tracking-wider text-cerneala-moale uppercase"
              >
                Categorie
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right font-titlu text-nota font-bold tracking-wider text-cerneala-moale uppercase"
              >
                Sumă (lei)
              </th>
            </tr>
          </thead>
          <tbody>
            {randuri.map((rand) => (
              <tr key={rand.categorie} className="border-t border-hartie-umbra">
                <td className="px-5 py-3 text-mic text-cerneala">
                  {rand.categorie}
                </td>
                <td className="px-5 py-3 text-right font-titlu text-mic font-semibold tabular-nums text-cerneala">
                  {rand.suma}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-caramiziu-200 bg-tenta-cald">
              <td className="px-5 py-3.5 font-titlu font-bold text-cerneala">
                Total
              </td>
              <td className="px-5 py-3.5 text-right font-titlu font-extrabold tabular-nums text-caramiziu-600">
                {total}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Raport2025() {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Despre noi", cale: RUTE.despre },
          { nume: "Raport de activitate 2025", cale: RUTE.raport2025 },
        ])}
      />
      <section className="granulatie relative isolate overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-12 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span className="pata absolute -top-32 right-[-8%] size-[26rem] rounded-full bg-caramiziu-100/60 blur-3xl" />
          <Decor
            semn="stea"
            className="pluteste-lent absolute top-10 right-[6%] hidden size-10 text-miere-400 lg:block"
          />
          <Decor
            semn="unda"
            className="pluteste-lent absolute bottom-16 left-[3%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`${RUTE.despre}#transparenta`}
            className="inline-flex min-h-10 items-center gap-2 font-titlu text-mic font-semibold text-caramiziu-600 transition hover:text-caramiziu-700"
          >
            <Pictograma nume="sageata" className="size-4 rotate-180" />
            Transparență
          </Link>

          <p className="mt-7 font-titlu text-nota font-bold tracking-wider text-cerneala-slab uppercase">
            {ASOCIATIA.denumire}
          </p>
          <h1 className="mt-2 text-h1 text-cerneala">
            Raport anual de activitate 2025
          </h1>
          <p className="scris mt-5 text-h4 text-caramiziu-600">
            Sprijin pentru copii. Respiro pentru părinți. Incluziune și
            comunitate. Zâmbet!
          </p>
        </div>
      </section>
      <Val culoare="text-hartie" className={VAL_PESTE} />

      {/* Cifrele anului, în câmpuri de culoare care ies peste valul
          antetului — ca banda de cifre de pe prima pagină. */}
      <section className="bg-hartie pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Cifrele anului 2025</h2>
          <ul className="relative z-20 -mt-6 grid grid-cols-2 gap-4 sm:-mt-10 sm:grid-cols-3 lg:-mt-16">
            {CIFRE_2025.map((cifra, i) => (
              <li
                key={cifra.eticheta}
                className={`relative overflow-hidden ${i % 2 === 0 ? "colt-a" : "colt-b"} px-5 py-7 text-center ${CAMPURI_CIFRE[i]}`}
              >
                <span className="block font-titlu text-[2.8rem] leading-none font-extrabold tracking-tight">
                  {cifra.valoare}
                </span>
                <span className="mt-2 block font-titlu text-nota font-bold opacity-80">
                  {cifra.eticheta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-hartie pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 text-cerneala">Rezumat</h2>
          <div className="mt-6 grid gap-4 text-cerneala-moale">
            <p>
              Anul 2025 a reprezentat un an de consolidare a serviciilor oferite
              de Asociația Teona Ariana Suceava, cu accent pe intervenții
              terapeutice pentru copii cu dizabilități și sprijin emoțional
              pentru părinți.
            </p>
            <p>
              Casa Teona a rămas un loc sigur, cald și incluziv, unde copiii
              cresc în încredere, iar părinții găsesc respiro și sprijin.
            </p>
            <p>
              Toate serviciile terapeutice și activitățile oferite în cadrul
              Casei Teona sunt gratuite pentru copii și familii, pentru a
              elimina orice barieră financiară și pentru a asigura acces egal
              tuturor beneficiarilor.
            </p>
          </div>

          <div className="mt-14 grid gap-12">
            {CAPITOLE.map((capitol) => (
              <section key={capitol.numar} className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 -left-2 font-titlu text-[5.5rem] leading-none font-extrabold tracking-tight text-caramiziu-50 select-none"
                >
                  {String(capitol.numar).padStart(2, "0")}
                </span>
                <h2 className="relative text-h3 text-cerneala">
                  {capitol.titlu}
                </h2>

                {capitol.paragrafe?.map((paragraf) => (
                  <p
                    key={paragraf.slice(0, 30)}
                    className="relative mt-4 text-cerneala-moale"
                  >
                    {paragraf}
                  </p>
                ))}

                {capitol.liste?.map((lista) => (
                  <div
                    key={lista.titlu ?? lista.elemente[0]}
                    className="relative mt-5"
                  >
                    {lista.titlu && (
                      <p className="font-titlu font-semibold text-cerneala">
                        {lista.titlu}
                      </p>
                    )}
                    <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-cerneala-moale marker:text-caramiziu-400">
                      {lista.elemente.map((element) => (
                        <li key={element}>{element}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — parteneriate */}
      <Val culoare="text-hartie-calda" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-hartie-calda pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="soare"
            className="pluteste-lent absolute top-12 right-[5%] size-9 text-miere-300 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 left-2 font-titlu text-[5.5rem] leading-none font-extrabold tracking-tight text-miere-100 select-none"
          >
            08
          </span>
          <h2 className="relative text-h3 text-cerneala">
            Parteneriate și susținere
          </h2>

          <h3 className="mt-7 font-titlu text-amplu font-bold text-cerneala">
            Parteneri instituționali
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {PARTENERI.map((partener, i) => (
              <li
                key={partener}
                className={`flex items-center gap-3 ${i % 2 === 0 ? "colt-mic-a" : "colt-mic-b"} bg-hartie px-4 py-3 font-titlu text-mic font-bold text-cerneala shadow-[0_12px_26px_-18px_rgba(35,35,35,0.5)]`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-miere-100 text-miere-700">
                  <Pictograma nume="cladire" className="size-4" />
                </span>
                {partener}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 font-titlu text-amplu font-bold text-cerneala">
            Sponsori
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SPONSORI_RAPORT.map((sponsor) => (
              <li
                key={sponsor}
                className="rounded-full border border-hartie-umbra bg-hartie px-4 py-1.5 font-titlu text-nota font-semibold text-cerneala-moale shadow-[0_8px_18px_-14px_rgba(35,35,35,0.6)]"
              >
                {sponsor}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9 — situația financiară */}
      <Val culoare="text-hartie" className={VAL_PESTE} />
      <section className="bg-hartie pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 left-2 font-titlu text-[5.5rem] leading-none font-extrabold tracking-tight text-turcoaz-50 select-none"
          >
            09
          </span>
          <h2 className="relative text-h3 text-cerneala">
            Situație financiară 2025
          </h2>
          <p className="mt-4 text-cerneala-moale">
            Cheltuielile pentru servicii terapeutice și activități sunt
            susținute integral din fonduri atrase — donații, sponsorizări și
            granturi —, beneficiarii neplătind contribuții financiare pentru
            participare. Asociația își asumă transparența financiară și
            utilizarea responsabilă a fondurilor primite.
          </p>

          <div className="mt-10 grid gap-10">
            <Tabel titlu="Venituri" randuri={VENITURI} total="673.547" />
            <Tabel titlu="Cheltuieli" randuri={CHELTUIELI} total="558.596" />
          </div>

          <p className="granulatie relative mt-8 overflow-hidden colt-a bg-turcoaz-100 px-6 py-6 font-titlu font-bold text-turcoaz-900 shadow-[0_24px_50px_-26px_rgba(42,159,163,0.6)]">
            <Decor
              semn="spirala"
              strokeWidth={0.8}
              className="absolute -right-8 -bottom-8 size-32 text-turcoaz-200"
            />
            <span className="relative block text-nota font-bold tracking-wider uppercase opacity-80">
              Rezultat financiar 2025 (excedent)
            </span>
            <span className="relative mt-1 block text-h2 tabular-nums">
              114.951 lei
            </span>
          </p>
        </div>
      </section>

      {/* 11 — mulțumiri */}
      <Val culoare="text-tenta-cald" className={VAL_PESTE} />
      <section className="granulatie relative overflow-hidden bg-tenta-cald pt-6 pb-24 lg:pt-10 lg:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Decor
            semn="inima"
            className="pluteste-lent absolute top-12 right-[5%] size-9 text-caramiziu-200 lg:size-12"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="scris text-amplu text-caramiziu-600">
            Tuturor celor care au fost alături de noi
          </p>
          <h2 className="mt-2 text-h2 text-cerneala">Mulțumiri</h2>
          <p className="mt-4 text-cerneala-moale">
            Mulțumim tuturor părinților, copiilor, voluntarilor, terapeuților,
            sponsorilor și partenerilor care au fost alături de noi.
          </p>
          <p className="mt-3 text-cerneala-moale">
            Împreună am demonstrat că atunci când comunitatea se unește, copiii
            speciali primesc șansa la o viață mai bună, iar părinții nu mai sunt
            singuri.
          </p>

          <div className="colt-a mt-10 border border-hartie-umbra bg-hartie p-7 text-mic text-cerneala-moale shadow-[0_18px_38px_-24px_rgba(35,35,35,0.5)]">
            <p className="font-titlu font-bold text-cerneala">
              {ASOCIATIA.denumireLegala}
            </p>
            <p className="mt-2">
              {ADRESE.sediuSocial.strada}, {ADRESE.sediuSocial.oras}, 720215 ·
              CIF: {ASOCIATIA.cif}
            </p>
            <p className="mt-1">
              Tel: {TELEFON_PRINCIPAL.afisat} · {EMAIL.contact}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Buton href={RUTE.doneaza} marime="mare">
              Donează
            </Buton>
            <Buton href={RUTE.despre} varianta="contur" marime="mare">
              Despre noi
            </Buton>
          </div>
        </div>
      </section>
    </>
  );
}
