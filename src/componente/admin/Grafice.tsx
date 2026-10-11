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

/** Tabelul de sub grafic — nevăzut, dar citit de cititoarele de ecran. */
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
    <table className="sr-only">
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
  );
}

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
    <section className="rounded-card border border-hartie-umbra bg-hartie p-6">
      <h2 className="font-titlu text-amplu font-bold text-cerneala">{titlu}</h2>
      {nota && <p className="mt-1 text-nota text-cerneala-slab">{nota}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Coloane: cât a intrat în fiecare lună.
 *
 * Scara pornește de la zero, întotdeauna. Un grafic cu baza tăiată face ca o
 * creștere de 3% să arate ca o dublare — pe cifrele unei asociații, asta nu e
 * o alegere de design, e o minciună.
 */
export function Coloane({
  date,
}: {
  date: Array<{ eticheta: string; bani: number; donatii: number }>;
}) {
  const maxim = Math.max(1, ...date.map((d) => d.bani));
  const gol = date.every((d) => d.bani === 0);

  if (gol) {
    return (
      <p className="py-8 text-center text-mic text-cerneala-slab">
        Nicio donație încă în perioada asta.
      </p>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="flex h-56 items-end gap-1.5 sm:gap-2.5"
      >
        {date.map((d) => {
          // Minimum 2px pentru o lună cu bani puțini: o coloană de zero pixeli
          // nu se distinge de o lună fără nimic.
          const inaltime = d.bani === 0 ? 0 : Math.max(2, (d.bani / maxim) * 100);
          return (
            <div
              key={d.eticheta}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              {/*
                Suma stă deasupra coloanei tot timpul, nu doar la hover: pe
                telefon nu există hover, iar un grafic care își ascunde
                cifrele de jumătate din oameni nu e un grafic.

                `text-[0.65rem]` și nu `text-nota`: douăsprezece sume de
                felul „1.100 lei" nu încap altfel pe lățimea unui card.
              */}
              <span className="text-[0.65rem] leading-tight font-bold text-cerneala-moale tabular-nums">
                {d.bani > 0 ? scrieSuma(d.bani / 100).replace(" lei", "") : ""}
              </span>
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-caramiziu-600 to-caramiziu-400"
                style={{ height: `${inaltime}%` }}
              />
              <span className="text-[0.65rem] leading-tight text-cerneala-slab">
                {d.eticheta}
              </span>
            </div>
          );
        })}
      </div>
      <p aria-hidden="true" className="mt-2 text-nota text-cerneala-slab">
        Sumele sunt în lei. Scara pornește de la zero.
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

/** Linie de donatori noi, peste coloane: o a doua poveste, nu altă pagină. */
export function DonatoriNoi({
  date,
}: {
  date: Array<{ eticheta: string; donatoriNoi: number }>;
}) {
  const maxim = Math.max(1, ...date.map((d) => d.donatoriNoi));
  const total = date.reduce((s, d) => s + d.donatoriNoi, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-mic text-cerneala-slab">
        Niciun donator nou încă.
      </p>
    );
  }

  return (
    <>
      <div aria-hidden="true" className="flex h-36 items-end gap-1 sm:gap-2">
        {date.map((d) => (
          <div
            key={d.eticheta}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[0.65rem] leading-none font-bold text-turcoaz-700">
              {d.donatoriNoi || ""}
            </span>
            <div
              className="w-full rounded-t-sm bg-turcoaz-500"
              style={{
                height: `${d.donatoriNoi === 0 ? 0 : Math.max(3, (d.donatoriNoi / maxim) * 100)}%`,
              }}
            />
            {/*
              Doar luna, fără an: graficul ăsta stă pe jumătate de lățime, iar
              „nov. 25" pe douăsprezece coloane iese din card. Douăsprezece
              luni la rând nu repetă niciun nume, deci nu se pierde nimic.
            */}
            <span className="text-[0.65rem] leading-none text-cerneala-slab">
              {d.eticheta.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
      <TabelAscuns
        titlu="Donatori la prima lor donație, pe luni"
        capete={["Luna", "Donatori noi"]}
        randuri={date.map((d) => [d.eticheta, String(d.donatoriNoi)])}
      />
    </>
  );
}

const CULORI = [
  "bg-caramiziu-500",
  "bg-turcoaz-500",
  "bg-miere-400",
  "bg-caramiziu-300",
  "bg-turcoaz-300",
  "bg-cerneala-slab",
];

/**
 * Felii: cum se împarte un total.
 *
 * Bare orizontale, nu plăcintă. Ochiul compară lungimi mult mai bine decât
 * unghiuri, iar o plăcintă cu șase felii mici e ilizibilă — mai ales
 * tipărită alb-negru, cum ajunge un raport la un consiliu director.
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

  if (total === 0) {
    return (
      <p className="py-6 text-center text-mic text-cerneala-slab">
        Nimic de arătat încă.
      </p>
    );
  }

  return (
    <>
      <ul aria-hidden="true" className="grid gap-3">
        {date.map((d, i) => {
          const procent = (d.bani / total) * 100;
          return (
            <li key={d.eticheta}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-titlu text-mic font-bold text-cerneala">
                  {nume ? nume(d.eticheta) : d.eticheta}
                </span>
                <span className="text-nota whitespace-nowrap text-cerneala-moale">
                  {scrieSuma(d.bani / 100)} · {Math.round(procent)}%
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-hartie-umbra">
                <div
                  className={`h-full rounded-full ${CULORI[i % CULORI.length]}`}
                  style={{ width: `${Math.max(1, procent)}%` }}
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

/** Pâlnia sponsorizărilor: câte firme stau în fiecare stadiu. */
export function Palnie({
  date,
}: {
  date: Array<{ eticheta: string; nr: number; culoare: string }>;
}) {
  const maxim = Math.max(1, ...date.map((d) => d.nr));
  if (date.every((d) => d.nr === 0)) {
    return (
      <p className="py-6 text-center text-mic text-cerneala-slab">
        Nicio firmă încă.
      </p>
    );
  }
  return (
    <ul className="grid gap-2">
      {date.map((d) => (
        <li key={d.eticheta} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-mic text-cerneala-moale">
            {d.eticheta}
          </span>
          <span
            aria-hidden="true"
            className={`h-7 rounded-r-md ${d.culoare}`}
            style={{ width: `${d.nr === 0 ? 0 : Math.max(4, (d.nr / maxim) * 100)}%` }}
          />
          <span className="font-titlu font-bold text-cerneala">{d.nr}</span>
        </li>
      ))}
    </ul>
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
    <div
      className={`rounded-card border border-hartie-umbra p-5 ${fundal}`}
    >
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
