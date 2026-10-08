import { cacheLife } from "next/cache";
import Link from "next/link";
import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  MENIU,
  RETELE_ASOCIATIE,
  RUTE,
  TELEFOANE,
} from "@/date/asociatie";
import Retele from "./Retele";
import Sigla from "./Sigla";
import DeschideSetariCookieuri from "./DeschideSetariCookieuri";

/**
 * Anul din rândul de copyright — „anul din copyright este cel curent” (regula
 * generală din caiet).
 *
 * Cu Cache Components activat, Next refuză `new Date()` la pregenerare: valoarea
 * s-ar îngheța la momentul build-ului. Îl punem într-o funcție cu memorie de
 * câteva ore, așa că rămâne randat pe server și se împrospătează singur.
 */
async function anulCurent() {
  "use cache";
  cacheLife("hours");
  return new Date().getFullYear();
}

/** Subsolul (12.3). Identic pe toate paginile. */
export default async function Subsol() {
  const anul = await anulCurent();

  const linkuriMeniu = MENIU.flatMap((element) =>
    element.subpagini
      ? element.subpagini.map((s) => ({ eticheta: s.eticheta, href: s.href }))
      : [{ eticheta: element.eticheta, href: element.href! }],
  );

  return (
    <footer className="granulatie relative overflow-hidden bg-caramiziu-900 text-hartie/75">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 size-[26rem] rounded-full border-2 border-hartie/8"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1.3fr]">
          <div>
            <Sigla className="text-[1.15rem]" />
            <p className="mt-5 max-w-sm text-mic leading-relaxed">
              {ASOCIATIA.fraza}
            </p>
            <p className="scris mt-5 text-amplu text-miere-300">
              „{ASOCIATIA.motto}”
            </p>
          </div>

          <nav aria-label="Meniu subsol">
            <h2 className="font-titlu text-nota font-bold tracking-wider text-hartie uppercase">
              Pagini
            </h2>
            <ul className="mt-4 grid gap-2.5">
              {linkuriMeniu.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-mic transition hover:text-miere-300"
                  >
                    {link.eticheta}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={RUTE.doneaza}
                  className="text-mic font-semibold text-miere-300 transition hover:text-miere-200"
                >
                  Donează
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-titlu text-nota font-bold tracking-wider text-hartie uppercase">
              Contact
            </h2>
            <ul className="mt-4 grid gap-2.5 text-mic">
              {TELEFOANE.map((telefon) => (
                <li key={telefon.apel}>
                  <a
                    href={`tel:${telefon.apel}`}
                    className="transition hover:text-miere-300"
                  >
                    {telefon.afisat}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${EMAIL.contact}`}
                  className="transition hover:text-miere-300"
                >
                  {EMAIL.contact}
                </a>
              </li>
            </ul>

            <ul className="mt-5 grid gap-3 text-mic">
              <li>
                <span className="block font-titlu font-semibold text-hartie">
                  {ADRESE.casaTeona.nume}
                </span>
                {ADRESE.casaTeona.strada}, {ADRESE.casaTeona.oras}{" "}
                {ADRESE.casaTeona.cod}
              </li>
              <li>
                <span className="block font-titlu font-semibold text-hartie">
                  {ADRESE.sediuSocial.nume}
                </span>
                {ADRESE.sediuSocial.strada}, {ADRESE.sediuSocial.oras}
              </li>
            </ul>

            <h2 className="mt-7 font-titlu text-nota font-bold tracking-wider text-hartie uppercase">
              Ne găsești pe
            </h2>
            <Retele
              retele={RETELE_ASOCIATIE}
              context={ASOCIATIA.denumire}
              className="mt-3 text-hartie/75"
            />
          </div>
        </div>

        <div className="mt-14 border-t border-hartie/20 pt-7">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-nota">
            <li className="font-semibold text-hartie">{ASOCIATIA.denumire}</li>
            <li aria-hidden="true">·</li>
            <li>CIF {ASOCIATIA.cif}</li>
            <li aria-hidden="true">·</li>
            <li>
              <Link
                href={RUTE.confidentialitate}
                className="transition hover:text-miere-300"
              >
                Politica de confidențialitate
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <Link href={RUTE.termeni} className="transition hover:text-miere-300">
                Termeni și condiții
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <Link
                href={RUTE.cookieuri}
                className="transition hover:text-miere-300"
              >
                Politica de cookie-uri
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <DeschideSetariCookieuri />
            </li>
          </ul>
          <p className="mt-3 text-nota text-hartie/50">
            © {anul} {ASOCIATIA.denumire}. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  );
}
