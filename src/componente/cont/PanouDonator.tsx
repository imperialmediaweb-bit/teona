import Link from "next/link";
import {
  ASOCIATIA,
  CIFRE,
  DESTINATII_DONATIE,
  EMAIL,
  RUTE,
  TELEFON_PRINCIPAL,
} from "@/date/asociatie";
import { numeleMetodei, type ContulMeu } from "@/lib/plati/donatori";
import { scrieSuma } from "@/lib/suma";
import Buton from "../Buton";
import Decor from "../Decor";
import Pictograma from "../Pictograma";

/**
 * Ce vede donatorul în contul lui.
 *
 * **Despre cifre.** Tentația la un panou ca ăsta e să scrie „ai ajutat 7
 * copii”. Nu scrie, și n-o să scrie până când asociația nu dă o cifră reală
 * de cost — câți bani costă o zi de tabără pentru un copil. Până atunci,
 * orice număr de copii ar fi inventat, iar un donator care află că suma e
 * scoasă din burtă nu mai dă a doua oară. Sunt mulți bani de pierdut pentru
 * o propoziție care sună bine.
 *
 * Ce se poate spune, și e adevărat: cât a dat, de când, pe ce s-a dus, de
 * câte luni ne e alături. Și, separat și limpede atribuit, ce a făcut
 * asociația în total — nu ca realizare a lui, ci ca lucrul la care a luat
 * parte.
 */

const LUNA_AN = new Intl.DateTimeFormat("ro-RO", {
  month: "long",
  year: "numeric",
});
const ZI = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function numeDestinatie(id: string): string {
  return DESTINATII_DONATIE.find((d) => d.id === id)?.eticheta ?? id;
}

/**
 * Cum se citește fiecare destinație într-o propoziție, și ce înseamnă.
 *
 * Formularea e scrisă de mână pentru fiecare, nu derivată din etichetă cu
 * `toLowerCase()`: aceea făcea din „Casa Teona” un „casa teona”, adică un
 * nume propriu scris cu literă mică. Iar „pentru Oriunde e nevoie” n-ar fi
 * sunat a română deloc.
 */
const DESTINATII: Record<string, { cum: string; inseamna?: string }> = {
  tabere: {
    cum: "pentru tabere",
    inseamna:
      "Taberele RESPIRO: copiii se joacă, își fac prieteni și descoperă că pot, iar părinții răsuflă câteva zile.",
  },
  "casa-teona": {
    cum: "pentru Casa Teona",
    inseamna:
      "Copiii vin tot anul la jocuri și ateliere, iar părinții găsesc consiliere și întâlniri de grup.",
  },
  "cazuri-umanitare": {
    cum: "pentru cazuri umanitare",
    inseamna: "Cazurile pe care le preia asociația, unul câte unul.",
  },
  oriunde: {
    cum: "acolo unde e cea mai mare nevoie",
    inseamna:
      "Asociația hotărăște în fiecare lună unde e cel mai urgent.",
  },
};

function luniScris(n: number): string {
  if (n === 0) return "luna asta";
  if (n === 1) return "de o lună";
  if (n < 20) return `de ${n} luni`;
  return `de ${n} de luni`;
}

export default function PanouDonator({ cont }: { cont: ContulMeu }) {
  const prenume = cont.nume?.split(" ")[0] ?? null;
  const deCand = cont.primaLa ? LUNA_AN.format(new Date(cont.primaLa)) : null;

  return (
    <>
      {/* Mulțumirea. Caldă, dar fără nicio cifră pe care n-o știm. */}
      <section className="granulatie relative overflow-hidden colt-a bg-gradient-to-br from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-8 text-hartie shadow-[0_30px_60px_-28px_rgba(247,79,34,0.85)] sm:p-10">
        <Decor
          semn="inima"
          strokeWidth={0.8}
          className="pointer-events-none absolute -top-10 -right-8 size-48 text-hartie/15"
        />
        <p className="scris relative text-amplu opacity-90">
          {prenume ? `Mulțumim, ${prenume}` : "Mulțumim"}
        </p>
        <h2 className="relative mt-2 max-w-2xl font-titlu text-h3 leading-snug font-extrabold">
          {deCand ? `Ne ești alături din ${deCand}.` : "Ne ești alături."}
        </h2>
        <p className="relative mt-4 max-w-2xl text-amplu opacity-90">
          Fără oameni ca tine n-ar exista nici taberele, nici Casa Teona.{" "}
          {ASOCIATIA.motto}.
        </p>
      </section>

      {/* Cifrele lui, toate adevărate și calculate din donațiile lui. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Cifra
          eticheta="Ai dăruit în total"
          valoare={scrieSuma(cont.totalBani / 100)}
        />
        <Cifra
          eticheta={cont.donatii.length === 1 ? "Donație" : "Donații"}
          valoare={String(cont.donatii.length)}
          culoare="turcoaz"
        />
        <Cifra
          eticheta="Ne ești alături"
          valoare={luniScris(cont.luniDeAtunci)}
          culoare="miere"
        />
      </div>

      {/* Unde s-au dus banii lui. Destinația e aleasă de el, deci e a lui. */}
      <section className="mt-8 colt-b border border-hartie-umbra bg-hartie p-7 sm:p-8">
        <h3 className="font-titlu text-h4 font-bold text-cerneala">
          Unde s-au dus banii tăi
        </h3>
        <ul className="mt-5 grid gap-4">
          {cont.peDestinatii.map((d) => {
            const scris = DESTINATII[d.destinatie];
            return (
              <li key={d.destinatie}>
                <p className="font-titlu text-amplu font-bold text-caramiziu-700">
                  {scrieSuma(d.bani / 100)}{" "}
                  <span className="font-normal text-cerneala">
                    {scris?.cum ?? `pentru ${numeDestinatie(d.destinatie)}`}
                  </span>
                </p>
                {scris?.inseamna && (
                  <p className="mt-1 text-mic text-cerneala-moale">
                    {scris.inseamna}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/*
        Cifrele asociației, scrise ca ale asociației.

        Nu „ai ajutat 1.500 de participanți” — ar fi fals, și s-ar vedea. Dar
        „asta am făcut împreună cu oameni ca tine” e adevărat și spune același
        lucru fără să mintă.
      */}
      <section className="granulatie mt-6 colt-a bg-turcoaz-100 p-7 sm:p-8">
        <h3 className="font-titlu text-h4 font-bold text-turcoaz-900">
          Ce am făcut împreună cu oameni ca tine
        </h3>
        <p className="mt-1 text-mic text-turcoaz-900/70">
          Cifrele asociației, de la început până azi.
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-4">
          {CIFRE.map((c) => (
            <li key={c.eticheta}>
              <span className="block font-titlu text-h3 leading-none font-extrabold text-turcoaz-700">
                {c.valoare.toLocaleString("ro-RO")}
                {c.sufix}
              </span>
              <span className="mt-1 block text-mic text-turcoaz-900/80">
                {c.eticheta}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Istoricul. Ce caută de fapt cineva care intră aici. */}
      <section className="mt-8">
        <h3 className="font-titlu text-h4 font-bold text-cerneala">
          Donațiile tale
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-2xl text-left text-mic">
            <thead>
              <tr className="border-b border-hartie-umbra">
                <Cap>Data</Cap>
                <Cap>Sumă</Cap>
                <Cap>Pentru</Cap>
                <Cap>Cale</Cap>
              </tr>
            </thead>
            <tbody>
              {cont.donatii.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-hartie-umbra/60 last:border-0"
                >
                  <td className="py-3 pr-4 whitespace-nowrap text-cerneala-moale">
                    {d.platitaLa ? ZI.format(new Date(d.platitaLa)) : "—"}
                  </td>
                  <td className="py-3 pr-4 font-titlu font-bold whitespace-nowrap text-cerneala">
                    {scrieSuma(d.sumaBani / 100)}
                    {d.frecventa === "lunar" && (
                      <span className="ml-2 rounded-full bg-turcoaz-100 px-2 py-0.5 text-nota font-bold text-turcoaz-900">
                        lunar
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-cerneala-moale">
                    {numeDestinatie(d.destinatie)}
                  </td>
                  <td className="py-3 whitespace-nowrap text-cerneala-moale">
                    {numeleMetodei(d.procesator)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-nota text-cerneala-slab">
          Lista asta nu ține loc de chitanță fiscală. Dacă ai nevoie de una,
          scrie-ne la{" "}
          <a
            href={`mailto:${EMAIL.contact}`}
            className="underline underline-offset-2"
          >
            {EMAIL.contact}
          </a>
          .
        </p>
      </section>

      {cont.areLunara && (
        <section className="mt-8 colt-b border-2 border-turcoaz-200 bg-turcoaz-50 p-6">
          <h3 className="font-titlu text-amplu font-bold text-turcoaz-900">
            Ai o donație lunară
          </h3>
          <p className="mt-2 text-mic text-turcoaz-900/85">
            Se reînnoiește singură în fiecare lună. Dacă vrei s-o oprești sau
            să-i schimbi suma, scrie-ne la{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-semibold break-all underline underline-offset-2"
            >
              {EMAIL.contact}
            </a>{" "}
            sau sună la{" "}
            <a
              href={`tel:${TELEFON_PRINCIPAL.apel}`}
              className="font-semibold underline underline-offset-2"
            >
              {TELEFON_PRINCIPAL.afisat}
            </a>
            . O oprim fără să te întrebăm de ce.
          </p>
        </section>
      )}

      {/* Setări: acordul de buletin și ștergerea. Drepturile lui, la îndemână. */}
      <section className="mt-8 colt-a border border-hartie-umbra bg-hartie-calda p-7 sm:p-8">
        <h3 className="font-titlu text-h4 font-bold text-cerneala">
          Datele tale
        </h3>

        <form action="/api/cont/setari" method="post" className="mt-5">
          <input type="hidden" name="ce" value="buletin" />
          <input
            type="hidden"
            name="acord"
            value={cont.acordBuletin ? "nu" : "da"}
          />
          <p className="text-mic text-cerneala-moale">
            {cont.acordBuletin
              ? "Primești buletinul informativ."
              : "Nu primești buletinul informativ."}
          </p>
          <button
            type="submit"
            className="mt-2 min-h-11 rounded-full border-2 border-cerneala px-5 py-2 font-titlu text-mic font-bold text-cerneala transition-colors hover:bg-cerneala hover:text-hartie"
          >
            {cont.acordBuletin ? "Nu mai vreau buletinul" : "Vreau buletinul"}
          </button>
        </form>

        <details className="mt-7 border-t border-hartie-umbra pt-5">
          <summary className="cursor-pointer font-titlu text-mic font-bold text-cerneala">
            Șterge-mi datele
          </summary>
          <p className="mt-3 max-w-2xl text-mic text-cerneala-moale">
            Îți ștergem numele, adresa de e-mail și telefonul din evidența
            noastră. <strong>Suma și data donațiilor rămân</strong>, fără nimic
            care să ducă la tine: asociația e obligată prin lege să-și țină
            contabilitatea, iar o donație ștearsă ar lăsa o gaură în ea.
          </p>
          <p className="mt-2 max-w-2xl text-mic text-cerneala-moale">
            După asta nu mai poți intra în contul ăsta, și nu se poate întoarce
            înapoi.
          </p>
          <form
            action="/api/cont/setari"
            method="post"
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="ce" value="stergere" />
            <label className="text-mic">
              <span className="mb-1 block text-cerneala-moale">
                Scrie <strong>ȘTERGE</strong> ca să confirmi
              </span>
              <input
                name="confirmare"
                required
                className="colt-mic-a min-h-11 w-48 border-2 border-hartie-umbra bg-hartie px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 rounded-full bg-caramiziu-700 px-5 py-2 font-titlu text-mic font-bold text-hartie"
            >
              Șterge-mi datele
            </button>
          </form>
        </details>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Buton href={RUTE.doneaza}>
          Donează din nou
          <Pictograma nume="inima" className="size-4" />
        </Buton>
        <form action="/api/cont/iesire" method="post">
          <button
            type="submit"
            className="min-h-11 font-titlu text-mic font-bold text-cerneala-moale underline underline-offset-4 hover:text-cerneala"
          >
            Ieși din cont
          </button>
        </form>
        <Link
          href={RUTE.contact}
          className="min-h-11 font-titlu text-mic font-bold text-cerneala-moale underline underline-offset-4 hover:text-cerneala"
        >
          Scrie-ne
        </Link>
      </div>
    </>
  );
}

function Cifra({
  eticheta,
  valoare,
  culoare = "caramiziu",
}: {
  eticheta: string;
  valoare: string;
  culoare?: "caramiziu" | "turcoaz" | "miere";
}) {
  const clase = {
    caramiziu: "bg-caramiziu-50 text-caramiziu-800",
    turcoaz: "bg-turcoaz-50 text-turcoaz-900",
    miere: "bg-miere-100 text-cerneala",
  }[culoare];
  return (
    <div className={`colt-mic-a border border-hartie-umbra p-5 ${clase}`}>
      <p className="font-titlu text-nota font-bold tracking-wide uppercase opacity-70">
        {eticheta}
      </p>
      <p className="mt-1 font-titlu text-h4 leading-tight font-extrabold">
        {valoare}
      </p>
    </div>
  );
}

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2 pr-4 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
      {children}
    </th>
  );
}
