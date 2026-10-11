import { scrieSuma } from "@/lib/suma";

/**
 * Graficele panoului, desenate ca SVG, pe server.
 *
 * Fără bibliotecă de grafice. Recharts sau Chart.js ar aduce 100–200 kB de
 * JavaScript pentru patru forme simple, și ar face paginile astea interactive
 * degeaba: nimeni nu are nevoie să dea zoom pe donațiile unei luni. Desenate
 * aici, sunt HTML curat, se văd fără JavaScript și se tipăresc corect.
 *
 * **Accesibilitate.** Un grafic e o imagine; un om care folosește cititor de
 * ecran nu „vede" coloanele. De aceea fiecare grafic poartă cu el și tabelul
 * din care e făcut, ascuns vizual dar citit cu voce tare. Nu e o dublare
 * inutilă: e singura cale prin care cifrele ajung la toți.
 */

/**
 * Tabelul de sub grafic — nevăzut, dar citit de cititoarele de ecran.
 *
 * `sr-only` stă pe un `div`, nu pe `<table>`. Clasa ascunde punând
 * `width: 1px` și `overflow: hidden`, dar **un tabel nu se îngustează sub
 * lățimea conținutului său**: regulile de aranjare a tabelelor îi dau ca
 * lățime maximul dintre cea cerută și `min-content`. Cu `sr-only` direct pe
 * `<table>`, tabelul rămânea lat de 353 px, lățea pagina la 393 pe un ecran
 * de 390, și apărea derulare laterală.
 *
 * Partea urâtă: se vedea doar când sumele dinăuntru erau destul de lungi,
 * deci proba pica o dată da, o dată nu, și părea o problemă de sincronizare.
 * Un `div` cu `overflow: hidden` taie fără discuție.
 */
function TabelAscuns({
  titlu,
  capete,
  randuri,
}: {
  titlu: string;
  capete: string[];
  randuri: string[][];
}) {
  return (
    <div className="sr-only">
      <table>
        <caption>{titlu}</caption>
        <thead>
          <tr>
            {capete.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {randuri.map((r) => (
            <tr key={r[0]}>
              <th scope="row">{r[0]}</th>
              {r.slice(1).map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/*
  ── Culorile ────────────────────────────────────────────────────────────

  Verificate cu validatorul de palete, nu alese din ochi. Ce a ieșit la
  verificare și de ce arată graficele așa:

  **Barele dintr-o defalcare poartă toate aceeași culoare.** Înainte
  dădeam fiecărei destinații altă culoare, dintr-o listă care se relua
  ciclic — deci la a șaptea categorie două primeau aceeași culoare, ceea
  ce e de-a dreptul o greșeală. Dar chiar și fără ciclu era greșit: într-o
  defalcare categoriile n-au ordine, iar culoarea diferită nu spune nimic
  ce nu spune deja lungimea barei. Consumă singurul canal liber pe o
  informație dublată.

  **Pâlnia e o rampă.** Stadiile unei sponsorizări au ordine — cerere vine
  înaintea contractului — deci culoarea trebuie s-o arate: o singură nuanță,
  de la deschis la închis. Înainte aveau patru culori fără nicio legătură
  între ele.

  Perechea portocaliu/turcoaz a trecut toate verificările (ΔE 17,9 la
  deuteranopie, 32,0 la vedere normală). Turcoazul rămâne sub 3:1 față de
  hârtie, ceea ce e permis doar fiindcă fiecare valoare e scrisă și în
  tabelul citit de cititoarele de ecran.
*/

/** Slotul 1: banii. O singură serie, o singură culoare. */
const BANI = "#f74f22";
/** Slotul 2: oamenii. Perechea verificată cu slotul 1. */
const OAMENI = "#45bcbd";

/**
 * Rampa pâlniei, de la deschis la închis.
 *
 * Treptele 300/400/600/700/900 din caramiziu, nu 200→700: trepte prea
 * apropiate nu se disting („ΔL sub 0,06”), iar capătul deschis trebuie să
 * rămână vizibil pe hârtie albă (cel puțin 2:1).
 */
const RAMPA = ["#ff9b78", "#fd6f42", "#e03a0f", "#b82b09", "#78220f"];

export function Card({
  titlu,
  nota,
  children,
}: {
  titlu: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    /*
      `min-w-0` nu e de ornament.

      Un element dintr-o grilă are implicit `min-width: auto`, adică refuză să
      se îngusteze sub lățimea conținutului său. Fără asta, graficul dinăuntru
      cu lățime minimă împingea tot cardul la 610 px pe un ecran de 390, iar
      `overflow-x-auto` nu apuca niciodată să intre în funcțiune: nu avea ce
      depăși, fiindcă părintele creștea odată cu el.
    */
    <section className="min-w-0 rounded-card border border-hartie-umbra bg-hartie p-6">
      <h2 className="font-titlu text-amplu font-bold text-cerneala">{titlu}</h2>
      {nota && <p className="mt-1 text-nota text-cerneala-slab">{nota}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Gol({ text }: { text: string }) {
  return <p className="py-8 text-center text-mic text-cerneala-slab">{text}</p>;
}

/**
 * Coloane: cât a intrat în fiecare lună.
 *
 * Scara pornește de la zero, întotdeauna. Un grafic cu baza tăiată face ca o
 * creștere de 3% să arate ca o dublare — pe cifrele unei asociații, asta nu e
 * o alegere de design, e o minciună.
 *
 * **Nu scrie o cifră deasupra fiecărei coloane.** Douăsprezece numere
 * înghesuite nu se citesc, se uită. Sunt scrise doar două: luna cea mai bună
 * și ultima. Restul se citesc din tabelul de dedesubt, care e acolo oricum
 * pentru cititoarele de ecran — deci nicio valoare nu e ascunsă după hover,
 * care pe telefon nici nu există.
 */
export function Coloane({
  date,
}: {
  date: Array<{ eticheta: string; bani: number; donatii: number }>;
}) {
  const maxim = Math.max(1, ...date.map((d) => d.bani));
  if (date.every((d) => d.bani === 0)) {
    return <Gol text="Nicio donație încă în perioada asta." />;
  }

  const iMax = date.reduce((m, d, i) => (d.bani > date[m].bani ? i : m), 0);
  const iUltim = date.length - 1;

  return (
    <>
      {/*
        Graficul se derulează pe orizontală, pagina nu.

        La 390 px, douăsprezece coloane au ~22 px fiecare, iar o sumă n-are
        unde să se rupă — cifrele nu se taie în silabe. Cu o lățime minimă și
        derulare proprie, coloanele își păstrează lățimea utilă și pagina
        rămâne întreagă.
      */}
      <div className="-mx-2 overflow-x-auto px-2">
        <div
          aria-hidden="true"
          className="flex h-56 min-w-[34rem] items-end gap-2"
        >
          {date.map((d, i) => {
            // Cel puțin 2 px pentru o lună cu bani puțini: o coloană de zero
            // pixeli nu se distinge de o lună fără nimic.
            const inaltime =
              d.bani === 0 ? 0 : Math.max(2, (d.bani / maxim) * 100);
            const scrisa = i === iMax || i === iUltim;
            return (
              <div
                key={d.eticheta}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="h-4 text-[0.65rem] leading-none font-bold text-cerneala-moale tabular-nums">
                  {scrisa && d.bani > 0
                    ? scrieSuma(d.bani / 100).replace(" lei", "")
                    : ""}
                </span>
                {/*
                  Coloana are cel mult 24 px și e centrată în banda ei: o bară
                  care umple tot slotul citește greu și face graficul să pară
                  un zid. Capătul de sus e rotunjit 4 px, baza rămâne dreaptă
                  — bara crește dintr-o linie, nu plutește.
                */}
                <div
                  className="w-full max-w-6 rounded-t-[4px]"
                  style={{ height: `${inaltime}%`, backgroundColor: BANI }}
                />
                <span className="text-[0.65rem] leading-tight text-cerneala-slab">
                  {d.eticheta}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p aria-hidden="true" className="mt-2 text-nota text-cerneala-slab">
        Sumele sunt în lei. Scara pornește de la zero. Toate lunile sunt în
        tabelul de mai jos.
      </p>
      <TabelAscuns
        titlu="Donații încasate, pe luni"
        capete={["Luna", "Sumă", "Donații"]}
        randuri={date.map((d) => [
          d.eticheta,
          scrieSuma(d.bani / 100),
          String(d.donatii),
        ])}
      />
    </>
  );
}

/** Donatori la prima lor donație. A doua poveste, nu altă pagină. */
export function DonatoriNoi({
  date,
}: {
  date: Array<{ eticheta: string; donatoriNoi: number }>;
}) {
  const maxim = Math.max(1, ...date.map((d) => d.donatoriNoi));
  if (date.reduce((s, d) => s + d.donatoriNoi, 0) === 0) {
    return <Gol text="Niciun donator nou încă." />;
  }

  return (
    <>
      <div className="-mx-2 overflow-x-auto px-2">
        <div
          aria-hidden="true"
          className="flex h-36 min-w-[26rem] items-end gap-1.5"
        >
          {date.map((d) => (
            <div
              key={d.eticheta}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              {/*
                Aici cifrele sunt mici (unități, nu mii) și încap toate, deci
                se scriu toate: pe un grafic de numărate oameni, „3” lângă
                coloană e mai util decât orice axă.
              */}
              <span className="h-3 text-[0.65rem] leading-none font-bold text-cerneala-moale tabular-nums">
                {d.donatoriNoi || ""}
              </span>
              <div
                className="w-full max-w-5 rounded-t-[4px]"
                style={{
                  height: `${d.donatoriNoi === 0 ? 0 : Math.max(3, (d.donatoriNoi / maxim) * 100)}%`,
                  backgroundColor: OAMENI,
                }}
              />
              {/*
                Doar luna, fără an: graficul stă pe jumătate de lățime, iar
                „nov. 25" pe douăsprezece coloane n-ar încăpea. Douăsprezece
                luni la rând nu repetă niciun nume, deci nu se pierde nimic.
              */}
              <span className="text-[0.65rem] leading-none text-cerneala-slab">
                {d.eticheta.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <TabelAscuns
        titlu="Donatori la prima lor donație, pe luni"
        capete={["Luna", "Donatori noi"]}
        randuri={date.map((d) => [d.eticheta, String(d.donatoriNoi)])}
      />
    </>
  );
}

/**
 * Felii: cum se împarte un total.
 *
 * Bare orizontale, nu plăcintă. Ochiul compară lungimi mult mai bine decât
 * unghiuri, iar o plăcintă cu șase felii mici e ilizibilă — mai ales
 * tipărită alb-negru, cum ajunge un raport la un consiliu director.
 *
 * **Toate barele au aceeași culoare.** Categoriile n-au ordine între ele, iar
 * fiecare își poartă numele scris deasupra: o culoare diferită per bară n-ar
 * adăuga nimic peste ce spune lungimea, și s-ar relua ciclic de la a șaptea
 * categorie încolo, dând două categorii diferite aceeași culoare.
 */
export function Felii({
  date,
  titlu,
  nume,
}: {
  date: Array<{ eticheta: string; bani: number; nr: number }>;
  titlu: string;
  /** Traduce eticheta brută din baza de date în ceva citibil. */
  nume?: (brut: string) => string;
}) {
  const total = date.reduce((s, d) => s + d.bani, 0);
  if (total === 0) return <Gol text="Nimic de arătat încă." />;

  return (
    <>
      <ul aria-hidden="true" className="grid gap-3">
        {date.map((d) => {
          const procent = (d.bani / total) * 100;
          return (
            <li key={d.eticheta}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 font-titlu text-mic font-bold text-cerneala">
                  {nume ? nume(d.eticheta) : d.eticheta}
                </span>
                <span className="shrink-0 text-nota whitespace-nowrap text-cerneala-moale tabular-nums">
                  {scrieSuma(d.bani / 100)} · {Math.round(procent)}%
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-hartie-umbra">
                <div
                  className="h-full rounded-full"
                  style={{
                    // Zero nu primește bară. `Math.max(1, …)` dădea o dungă
                    // vizibilă unei categorii cu 0 lei, care citea ca „puțin,
                    // dar ceva". `Coloane` făcea deja distincția asta.
                    width: `${d.bani === 0 ? 0 : Math.max(1, procent)}%`,
                    backgroundColor: BANI,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <TabelAscuns
        titlu={titlu}
        capete={["Categorie", "Sumă", "Donații", "Procent"]}
        randuri={date.map((d) => [
          nume ? nume(d.eticheta) : d.eticheta,
          scrieSuma(d.bani / 100),
          String(d.nr),
          `${Math.round((d.bani / total) * 100)}%`,
        ])}
      />
    </>
  );
}

/**
 * Pâlnia sponsorizărilor: câte firme stau în fiecare stadiu.
 *
 * Stadiile au ordine — cerere, contract trimis, semnat, încasat — deci
 * culoarea o arată: aceeași nuanță, din ce în ce mai închisă. O rampă, nu
 * patru culori fără legătură între ele.
 */
export function Palnie({
  date,
}: {
  date: Array<{ eticheta: string; nr: number }>;
}) {
  const maxim = Math.max(1, ...date.map((d) => d.nr));
  if (date.every((d) => d.nr === 0)) return <Gol text="Nicio firmă încă." />;

  return (
    <>
      <ul aria-hidden="true" className="grid gap-2">
        {date.map((d, i) => (
          <li key={d.eticheta} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-mic text-cerneala-moale">
              {d.eticheta}
            </span>
            <span
              className="h-6 rounded-r-[4px]"
              style={{
                width: `${d.nr === 0 ? 0 : Math.max(4, (d.nr / maxim) * 100)}%`,
                backgroundColor: RAMPA[Math.min(i, RAMPA.length - 1)],
              }}
            />
            <span className="font-titlu font-bold text-cerneala tabular-nums">
              {d.nr}
            </span>
          </li>
        ))}
      </ul>
      <TabelAscuns
        titlu="Firme, pe stadiul sponsorizării"
        capete={["Stadiu", "Firme"]}
        randuri={date.map((d) => [d.eticheta, String(d.nr)])}
      />
    </>
  );
}

/** O cifră mare, cu eticheta ei. Rândul de sus al tabloului de bord. */
export function Cifra({
  eticheta,
  valoare,
  nota,
  culoare = "caramiziu",
}: {
  eticheta: string;
  valoare: string;
  nota?: string;
  culoare?: "caramiziu" | "turcoaz" | "miere" | "cerneala";
}) {
  const fundal = {
    caramiziu: "bg-caramiziu-50 text-caramiziu-800",
    turcoaz: "bg-turcoaz-50 text-turcoaz-900",
    miere: "bg-miere-100 text-cerneala",
    cerneala: "bg-hartie text-cerneala",
  }[culoare];

  return (
    <div className={`rounded-card border border-hartie-umbra p-5 ${fundal}`}>
      <p className="font-titlu text-nota font-bold tracking-wide uppercase opacity-70">
        {eticheta}
      </p>
      <p className="mt-1 font-titlu text-h3 leading-none font-extrabold">
        {valoare}
      </p>
      {nota && <p className="mt-1.5 text-nota opacity-75">{nota}</p>}
    </div>
  );
}
