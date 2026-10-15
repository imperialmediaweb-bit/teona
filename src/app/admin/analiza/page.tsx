import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  analize,
  profilulDonatorilor,
  profilulFirmelor,
  type ProfilDonatori,
  type ProfilFirme,
} from "@/lib/analiza/cifre";
import { areAnaliza, rezumat } from "@/lib/analiza/intreaba";
import { areVizite, vizite } from "@/lib/ga/raport";
import { cate } from "@/lib/numere-ro";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import TextScris from "@/componente/pagina/TextScris";

export const metadata: Metadata = {
  title: "Analiză",
  robots: { index: false, follow: false },
};

/**
 * Profilul donatorilor și al firmelor, plus ce înțelege un model din ele.
 *
 * **De ce există.** Tabloul de bord spune cât a intrat. Nu spune dacă oamenii
 * se întorc, câți dau o singură dată și dispar, unde se îneacă pâlnia
 * firmelor, în ce lună a anului se strâng banii. Sunt întrebările pe care un
 * fundraiser și le pune o dată pe lună și la care, până acum, răspundea
 * numărând de mână în exporturi.
 *
 * **Cifrele sunt pe pagină înaintea analizei, dinadins.** Analiza se face cu
 * un model care poate greși; cifrele, nu. Cine citește o concluzie trebuie să
 * poată verifica din ce a ieșit, pe aceeași pagină, fără să aibă încredere pe
 * cuvânt. De aceea se vede și textul exact trimis modelului.
 *
 * **Fără cheie de API, pagina rămâne utilă.** Profilurile se calculează din
 * baza de date; doar interpretarea lipsește.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const RATAT: Record<string, string> = {
  "fara-cheie":
    "Lipsește ANTHROPIC_API_KEY din Railway. Cifrele de mai jos se văd și fără ea; doar analiza are nevoie de cheie.",
  "putine-date":
    "Încă sunt prea puține donații pentru o analiză care să însemne ceva. Pe zece donații, orice tipar e zgomot.",
  "n-a-mers":
    "Analiza n-a putut fi făcută acum — modelul n-a răspuns. Încearcă din nou în câteva minute.",
};

function lei(bani: number): string {
  return scrieSuma(bani / 100);
}

function procent(parte: number, intreg: number): string {
  if (intreg <= 0) return "—";
  return `${Math.round((parte / intreg) * 100)}%`;
}

function Cifra({
  eticheta,
  valoare,
  nota,
}: {
  eticheta: string;
  valoare: string;
  nota?: string;
}) {
  return (
    <div className="colt-mic-a border border-hartie-umbra bg-hartie p-4">
      <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
        {eticheta}
      </p>
      <p className="mt-1 font-titlu text-h4 font-extrabold text-cerneala">
        {valoare}
      </p>
      {nota && <p className="mt-1 text-nota text-cerneala-moale">{nota}</p>}
    </div>
  );
}

function Tabel({
  capete,
  randuri,
}: {
  capete: [string, string];
  randuri: Array<[string, string]>;
}) {
  return (
    <table className="w-full text-mic">
      <thead>
        <tr className="border-b border-hartie-umbra">
          <th className="pb-2 text-left font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
            {capete[0]}
          </th>
          <th className="pb-2 text-right font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
            {capete[1]}
          </th>
        </tr>
      </thead>
      <tbody>
        {randuri.map(([stanga, dreapta]) => (
          <tr
            key={stanga}
            className="border-b border-hartie-umbra last:border-0"
          >
            <td className="py-2 text-cerneala-moale">{stanga}</td>
            <td className="py-2 text-right font-titlu font-bold text-cerneala">
              {dreapta}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Fisa({
  titlu,
  nota,
  children,
}: {
  titlu: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <h3 className="font-titlu text-amplu font-bold text-cerneala">{titlu}</h3>
      {nota && <p className="mt-1 text-nota text-cerneala-slab">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Sectiune({
  titlu,
  nota,
  children,
}: {
  titlu: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
          {titlu}
        </h2>
        {nota && <p className="text-nota text-cerneala-slab">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

function Donatori({ d }: { d: ProfilDonatori }) {
  const cuDonatii = d.oSinguraData + d.deDouaSauTrei + d.dePatruSauMaiMulte;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Donatori"
          valoare={String(d.donatori)}
          nota={`${d.donatii} donații încasate`}
        />
        <Cifra
          eticheta="Cât dă un om"
          valoare={lei(d.donatieMediana)}
          nota={`La mijloc. Media e ${lei(d.donatieMedie)}, trasă în sus de cele mari.`}
        />
        <Cifra
          eticheta="Se întorc"
          valoare={procent(d.deDouaSauTrei + d.dePatruSauMaiMulte, cuDonatii)}
          nota={`${d.oSinguraData} au dat o singură dată și n-au mai revenit`}
        />
        <Cifra
          eticheta="Vine lunar"
          valoare={lei(d.baniRecurentiPeLuna)}
          nota={`${d.recurentiActivi} donatori cu plată lunară activă`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Fisa
          titlu="Câte donații face un om"
          nota="Dacă aproape toți sunt în prima linie, munca de atras oameni noi se scurge."
        >
          <Tabel
            capete={["Donații", "Oameni"]}
            randuri={[
              ["O singură dată", String(d.oSinguraData)],
              ["De două-trei ori", String(d.deDouaSauTrei)],
              ["De patru sau mai multe", String(d.dePatruSauMaiMulte)],
            ]}
          />
        </Fisa>

        <Fisa
          titlu="Cât adună fiecare, în total"
          nota="Pe tranșe. Pragul de „donator mare” e 1.000 de lei."
        >
          <Tabel
            capete={["Tranșă", "Donatori"]}
            randuri={d.peTranse.map((t) => [t.eticheta, String(t.donatori)])}
          />
        </Fisa>

        <Fisa
          titlu="Semnele de atenție"
          nota="Fiecare cifră de aici e o listă de oameni pe care îi poți suna."
        >
          <Tabel
            capete={["Ce", "Câți"]}
            randuri={[
              ["S-au oprit (2+ donații, tăcere de 4 luni)", String(d.sAuOprit)],
              [
                "Donatori mari",
                `${d.donatoriMari} · ${procent(d.baniDeLaMari, d.totalBani)} din bani`,
              ],
              ["Au acord de buletin", `${d.cuAcord} din ${d.donatori}`],
              ["Au revenit după primul an", String(d.reveniti)],
              [
                "Până la a doua donație",
                d.zilePanaLaADoua === null
                  ? "încă nimeni"
                  : d.zilePanaLaADoua === 0
                    ? "sub o zi"
                    : cate(d.zilePanaLaADoua, "zi", "zile"),
              ],
            ]}
          />
          <p className="mt-3 text-nota text-cerneala-slab">
            Listele cu nume sunt la{" "}
            <Link
              href="/admin/donatori?filtru=opriti"
              className="font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Donatori
            </Link>
            .
          </p>
        </Fisa>
      </div>
    </>
  );
}

function Firme({ f }: { f: ProfilFirme }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra eticheta="Firme în evidență" valoare={String(f.firme)} />
        <Cifra
          eticheta="Au virat banii"
          valoare={`${f.pastraDinCerere.incasate}`}
          nota={`${procent(f.pastraDinCerere.incasate, f.firme)} din toate firmele intrate`}
        />
        <Cifra
          eticheta="Sponsorizarea medie"
          valoare={lei(f.sponsorizareMedie)}
          nota={`${lei(f.incasatBani)} în total, după fișe`}
        />
        <Cifra
          eticheta="Durata drumului"
          valoare={
            f.zilePanaLaBani === null
              ? "—"
              : f.zilePanaLaBani === 0
                ? "sub o zi"
                : cate(f.zilePanaLaBani, "zi", "zile")
          }
          nota="De la cerere până la bani în cont, la mijloc"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Fisa titlu="Unde stau firmele" nota="Pâlnia, de la cerere la bani.">
          <Tabel
            capete={["Stadiu", "Firme"]}
            randuri={f.peStadii.map((s) => [s.stadiu, String(s.nr)])}
          />
        </Fisa>

        <Fisa titlu="De unde au venit" nota="Ce cale aduce firme.">
          {f.peCale.length === 0 ? (
            <p className="text-mic text-cerneala-moale">Nicio firmă încă.</p>
          ) : (
            <Tabel
              capete={["Cale", "Firme"]}
              randuri={f.peCale.map((c) => [c.cale, String(c.nr)])}
            />
          )}
        </Fisa>

        <Fisa
          titlu="Blocate"
          nota="Firme fără mișcare de peste două săptămâni."
        >
          <p className="font-titlu text-h4 font-extrabold text-cerneala">
            {f.uitate}
          </p>
          <p className="mt-2 text-mic text-cerneala-moale">
            O firmă căreia i s-a trimis contractul acum trei săptămâni și care
            n-a răspuns nu e „în lucru”, e uitată.
          </p>
          <p className="mt-3 text-nota text-cerneala-slab">
            Lista e la{" "}
            <Link
              href="/admin/firme"
              className="font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Firme
            </Link>
            .
          </p>
        </Fisa>
      </div>
    </>
  );
}

/**
 * Vizitele de pe site, aduse din Google Analytics.
 *
 * **De ce aici și nu în Google Analytics.** Pentru că nimeni nu intră în
 * Google Analytics: are patruzeci de meniuri și cere învățat, iar panoul se
 * deschide oricum. Aici vin numai cele patru lucruri după care se iau
 * hotărâri — câți oameni, de unde, pe ce pagini, și ce a adus fiecare
 * campanie etichetată.
 *
 * Cifrele astea **nu sunt donații**. Google numără vizite; donațiile le
 * numără baza de date, mai sus pe pagină. Scris pe pagină, nu doar aici: cine
 * le adună din greșeală raportează de două ori aceiași oameni.
 *
 * Învelită în `Suspense`: e o cerere la Google, iar restul paginii n-are de ce
 * s-o aștepte.
 */
async function DinAnalytics() {
  const date = await vizite().catch(() => null);

  if (!date) {
    return (
      <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
        <p className="text-amplu text-cerneala-moale">
          Google Analytics n-a răspuns. Dacă tocmai s-au pus cheile, mai
          încearcă peste câteva minute; dacă nu, verifică dacă contul de
          serviciu e adăugat ca <strong>Vizualizator</strong> pe proprietatea
          GA4.
        </p>
      </div>
    );
  }

  const crestere = (acum: number, inainte: number) =>
    inainte > 0
      ? `${acum >= inainte ? "+" : ""}${Math.round(((acum - inainte) / inainte) * 100)}% față de perioada dinainte`
      : "Nu există perioadă dinainte cu care să comparăm";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Oameni pe site"
          valoare={String(date.utilizatori)}
          nota={crestere(date.utilizatori, date.inainte.utilizatori)}
        />
        <Cifra
          eticheta="Vizite"
          valoare={String(date.sesiuni)}
          nota={crestere(date.sesiuni, date.inainte.sesiuni)}
        />
        <Cifra
          eticheta="Pagini văzute"
          valoare={String(date.vizualizari)}
          nota={`Ultimele ${date.zile} de zile`}
        />
        <Cifra
          eticheta="Pagini pe vizită"
          valoare={
            date.sesiuni > 0
              ? (date.vizualizari / date.sesiuni).toFixed(1)
              : "—"
          }
          nota="Cât de mult se umblă prin site"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Fisa
          titlu="De unde vin"
          nota="Pe vizite. Aici se vede dacă o postare sau un buletin a adus oameni."
        >
          {date.surse.length === 0 ? (
            <p className="text-mic text-cerneala-moale">Încă nicio vizită.</p>
          ) : (
            <Tabel
              capete={["Cale", "Vizite"]}
              randuri={date.surse.map((s) => [s.sursa, String(s.sesiuni)])}
            />
          )}
        </Fisa>

        <Fisa titlu="Cele mai văzute pagini" nota="Pe vizualizări.">
          {date.pagini.length === 0 ? (
            <p className="text-mic text-cerneala-moale">Încă nimic.</p>
          ) : (
            <Tabel
              capete={["Pagina", "Vizualizări"]}
              randuri={date.pagini.map((p) => [p.cale, String(p.vizualizari)])}
            />
          )}
        </Fisa>

        <Fisa
          titlu="Campaniile etichetate"
          nota="Vizite venite din linkuri cu etichetă — buletinele de e-mail, de exemplu."
        >
          {date.campanii.length === 0 ? (
            <p className="text-mic text-cerneala-moale">
              Încă n-a venit nimeni printr-un link etichetat. Linkurile din
              șabloanele de e-mail poartă etichetele, deci apar aici după prima
              campanie trimisă.
            </p>
          ) : (
            <Tabel
              capete={["Campanie", "Vizite"]}
              randuri={date.campanii.map((c) => [c.nume, String(c.sesiuni)])}
            />
          )}
        </Fisa>
      </div>
    </>
  );
}

/** Cât se așteaptă răspunsul de la Google. */
function SeIncarca() {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-5 text-mic text-cerneala-moale">
      Se cer cifrele de la Google…
    </div>
  );
}

/** Ce trebuie făcut ca să meargă, când nu e legat nimic. */
function FaraAnalytics() {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <p className="max-w-3xl text-amplu text-cerneala-moale">
        Site-ul trimite deja date către Google Analytics, dar panoul nu le poate
        citi fără o cheie. E nevoie de un cont de serviciu Google, adăugat ca
        Vizualizator pe proprietatea GA4, iar în Railway de trei variabile:
      </p>
      <ul className="mt-3 grid gap-1.5 text-mic text-cerneala-moale">
        {[
          ["GA_PROPERTY_ID", "numărul proprietății GA4 (nu „G-…”)"],
          ["GA_CLIENT_EMAIL", "adresa contului de serviciu, din fișierul JSON"],
          ["GA_PRIVATE_KEY", "cheia privată din același fișier"],
        ].map(([cheie, ce]) => (
          <li key={cheie}>
            <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
              {cheie}
            </code>{" "}
            — {ce}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PaginaAnaliza({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Analiză">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string }>;
}) {
  await connection();
  const { gresit, ratat } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Analiză" activ="/admin/analiza">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Analiză" activ="/admin/analiza">
        <Intrare gresit={Boolean(gresit)} unde="/admin/analiza" />
      </Cadru>
    );
  }

  /*
    Fără bază de date rămâne partea de vizite.

    Google Analytics n-are nicio legătură cu baza noastră de date: dacă una
    cade, cealaltă n-are de ce să dispară din panou. Înainte, lipsa bazei
    golea pagina întreagă, inclusiv cifrele care veneau de la Google.
  */
  if (!areBazaDeDate()) {
    return (
      <Cadru
        titlu="Analiză"
        descriere="Vizitele de pe site. Profilurile cer baza de date."
        activ="/admin/analiza"
      >
        <Sectiune
          titlu="Vizitele de pe site"
          nota="Din Google Analytics, ultimele 28 de zile. Sunt vizite, nu donații."
        >
          {areVizite() ? (
            <Suspense fallback={<SeIncarca />}>
              <DinAnalytics />
            </Suspense>
          ) : (
            <FaraAnalytics />
          )}
        </Sectiune>

        <Sectiune titlu="Profilul donatorilor și al firmelor">
          <p className="max-w-2xl text-amplu text-cerneala-moale">
            Lipsește{" "}
            <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>
            . Fără baza de date nu există donatori și firme de profilat.
          </p>
        </Sectiune>
      </Cadru>
    );
  }

  const [donatori, firme, vechi, deVizite] = await Promise.all([
    profilulDonatorilor(),
    profilulFirmelor(),
    analize(6).catch(() => []),
    areVizite() ? vizite().catch(() => null) : Promise.resolve(null),
  ]);
  const ultima = vechi[0];
  /*
    Cifrele care s-ar trimite acum.

    Se arată și înainte de prima analiză, nu doar după: cine apasă butonul
    are dreptul să vadă ce pleacă din asociație *înainte* s-o facă, nu după.
    Când există deja o analiză, se arată cifrele salvate odată cu ea — alea
    au plecat atunci, nu cele de azi.
  */
  const acum = rezumat(donatori, firme, deVizite);

  return (
    <Cadru
      titlu="Analiză"
      descriere="Cine sunt donatorii, unde stau firmele și ce se vede în cifre."
      activ="/admin/analiza"
    >
      {ratat && RATAT[ratat] && (
        <p
          role="alert"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {RATAT[ratat]}
        </p>
      )}

      <Sectiune
        titlu="Vizitele de pe site"
        nota="Din Google Analytics, ultimele 28 de zile. Sunt vizite, nu donații."
      >
        {areVizite() ? (
          <Suspense fallback={<SeIncarca />}>
            <DinAnalytics />
          </Suspense>
        ) : (
          <FaraAnalytics />
        )}
      </Sectiune>

      <Sectiune
        titlu="Profilul donatorilor"
        nota="Toți donatorii, de la începutul evidenței."
      >
        <Donatori d={donatori} />
      </Sectiune>

      <Sectiune
        titlu="Profilul firmelor"
        nota="Sponsorizările, de la cap la coadă."
      >
        <Firme f={firme} />
      </Sectiune>

      <Sectiune
        titlu="Ce se vede în cifre"
        nota="Citite de un model, pe cifrele agregate de mai sus."
      >
        {/*
          Ce pleacă din asociație, scris pe pagină.

          Modelul rulează pe serverele altcuiva. Omul care apasă butonul are
          dreptul să știe exact ce se trimite — de aceea textul e aici, de
          deschis, nu o promisiune într-un comentariu din cod pe care n-o
          poate citi nimeni din panou.
        */}
        <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
          <p className="max-w-3xl text-mic text-cerneala-moale">
            Spre model pleacă numai cifrele de mai sus — numărători, sume și
            procente. Niciun nume, niciun e-mail, niciun telefon, nicio donație
            luată separat. I se cere să nu inventeze nicio cifră și să spună
            când datele sunt prea puține pentru o concluzie.
          </p>

          {ultima ? (
            <>
              <p className="mt-5 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                Analiza din {CAND.format(new Date(ultima.creatLa))}
              </p>
              <div className="mt-3 max-w-3xl">
                {/*
                  Modelul numerotează acțiunile; cititorul de text simplu al
                  site-ului știe numai liniuțe. Se schimbă „1." în „- " la
                  afișare, ca lista să nu ajungă un paragraf lipit.
                */}
                <TextScris
                  continut={ultima.text.replace(/^\s*\d+[.)]\s+/gm, "- ")}
                />
              </div>
            </>
          ) : (
            <p className="mt-5 text-amplu text-cerneala-moale">
              Nu s-a făcut încă nicio analiză.
            </p>
          )}

          <details className="mt-6" id="ce-se-trimite">
            <summary className="cursor-pointer font-titlu text-mic font-bold text-caramiziu-700">
              {ultima
                ? "Vezi exact ce s-a trimis"
                : "Vezi exact ce s-ar trimite"}
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-moale bg-hartie-calda p-4 text-nota whitespace-pre-wrap text-cerneala-moale">
              {ultima ? ultima.cifre : acum}
            </pre>
          </details>

          <form action="/api/admin/analiza" method="post" className="mt-6">
            <button
              type="submit"
              disabled={!areAnaliza()}
              className="rounded-full bg-caramiziu-700 px-6 py-3 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800 disabled:cursor-not-allowed disabled:bg-cerneala-slab"
            >
              {ultima ? "Fă o analiză nouă" : "Fă prima analiză"}
            </button>
            <p className="mt-2 text-nota text-cerneala-slab">
              {areAnaliza()
                ? "Durează câteva secunde. Cel mult trei pe oră — cifrele asociației nu se schimbă de la un minut la altul."
                : "Are nevoie de ANTHROPIC_API_KEY în Railway."}
            </p>
          </form>
        </div>

        {vechi.length > 1 && (
          <details className="mt-5">
            <summary className="cursor-pointer font-titlu text-mic font-bold text-caramiziu-700">
              Analizele de dinainte ({vechi.length - 1})
            </summary>
            <div className="mt-4 grid gap-5">
              {vechi.slice(1).map((a) => (
                <div
                  key={a.id}
                  className="colt-a border border-hartie-umbra bg-hartie p-5"
                >
                  <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                    {CAND.format(new Date(a.creatLa))}
                  </p>
                  <div className="mt-3 max-w-3xl">
                    <TextScris
                      continut={a.text.replace(/^\s*\d+[.)]\s+/gm, "- ")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </Sectiune>
    </Cadru>
  );
}
