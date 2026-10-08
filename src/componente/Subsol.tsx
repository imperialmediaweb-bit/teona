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
import { anulCurent } from "@/lib/an";

const titlu =
  "font-titlu text-nota font-bold tracking-[0.1em] text-hartie uppercase";

/**
 * Linkurile din subsol au 36 px înălțime, dar zona de atins e lată: textul
 * stă pe loc, iar `-mx-2 px-2` întinde ținta cu 8 px în fiecare parte, așa
 * că și „Acasă” trece de 55 px. Cu 44 px pe înălțime fiecare, unsprezece
 * linkuri pe o singură coloană făceau subsolul de un ecran și jumătate pe
 * telefon.
 */
const linkLegal =
  "-mx-2 inline-flex min-h-9 items-center px-2 transition-colors duration-200 hover:text-miere-300";
const link = `${linkLegal} text-mic`;

/**
 * Subsolul (12.3). Identic pe toate paginile.
 *
 * Tot conținutul cerut, pe patru coloane la lățime mare și pe două pe telefon:
 * sigla și fraza, paginile pe două coloane, contactul, adresele, rețelele,
 * rândul legal. Nimic nu s-a scos; s-a schimbat doar cât spațiu ocupă.
 */
export default async function Subsol() {
  const anul = await anulCurent();

  const linkuriMeniu = MENIU.flatMap((element) =>
    element.subpagini
      ? element.subpagini.map((s) => ({ eticheta: s.eticheta, href: s.href }))
      : [{ eticheta: element.eticheta, href: element.href! }],
  );

  return (
    <footer className="granulatie relative overflow-hidden bg-caramiziu-900 text-hartie/75">
      {/* Dunga de brand, de la portocaliu la galben: subsolul începe clar. */}
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-caramiziu-500 via-miere-400 to-miere-300"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full border-2 border-hartie/8"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-7 pb-7 sm:px-6 lg:px-8 lg:pt-12 lg:pb-7">
        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.5fr_0.9fr_1fr] lg:gap-x-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Sigla peFundalInchis className="text-[44px]" />
            <p className="mt-3 text-mic leading-relaxed sm:max-w-xs">
              {ASOCIATIA.fraza}
            </p>
            <p className="scris mt-3 text-amplu text-miere-300">
              „{ASOCIATIA.motto}”
            </p>
          </div>

          <nav
            aria-label="Meniu subsol"
            className="sm:col-span-2 lg:col-span-1"
          >
            <h2 className={titlu}>Pagini</h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-2">
              {linkuriMeniu.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.eticheta}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={RUTE.doneaza}
                  className={`${link} font-semibold text-miere-300 hover:text-miere-200`}
                >
                  Donează
                </Link>
              </li>
            </ul>
          </nav>

          {/* Pe telefon, contactul și adresele stau alături de la 360 px în
              sus; sub 360, jumătatea de ecran nu mai cuprinde adresa de
              e-mail. De la 640 învelișul dispare (`contents`) și cele două
              coloane intră direct în grila mare. */}
          <div className="grid gap-x-3 gap-y-6 min-[360px]:grid-cols-2 sm:contents">
            <div>
              <h2 className={titlu}>Contact</h2>
              <ul className="mt-2 grid">
                {TELEFOANE.map((telefon) => (
                  <li key={telefon.apel}>
                    <a href={`tel:${telefon.apel}`} className={link}>
                      {telefon.afisat}
                    </a>
                  </li>
                ))}
                <li>
                  {/* Adresa de e-mail n-are unde să se rupă; pe un ecran de
                    320 px, cu două coloane, se rupe unde poate, nu împinge
                    pagina lateral. */}
                  <a
                    href={`mailto:${EMAIL.contact}`}
                    className={`${link} [overflow-wrap:anywhere]`}
                  >
                    {EMAIL.contact}
                  </a>
                </li>
              </ul>
              <Retele
                retele={RETELE_ASOCIATIE}
                context={ASOCIATIA.denumire}
                className="mt-3 text-hartie/75"
              />
            </div>

            <div>
              <h2 className={titlu}>Unde ne găsești</h2>
              <ul className="mt-2 grid gap-3 text-mic leading-snug">
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
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1 border-t border-hartie/15 pt-4 text-nota lg:mt-9 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <p className="text-hartie/60">
            © {anul}{" "}
            <span className="font-semibold text-hartie/85">
              {ASOCIATIA.denumire}
            </span>
            {" · "}CIF {ASOCIATIA.cif} · Toate drepturile rezervate.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5">
            <li>
              <Link href={RUTE.confidentialitate} className={linkLegal}>
                Politica de confidențialitate
              </Link>
            </li>
            <li>
              <Link href={RUTE.termeni} className={linkLegal}>
                Termeni și condiții
              </Link>
            </li>
            <li>
              <Link href={RUTE.cookieuri} className={linkLegal}>
                Politica de cookie-uri
              </Link>
            </li>
            <li>
              <DeschideSetariCookieuri />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
