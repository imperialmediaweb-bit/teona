import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Kalam, Nunito, Nunito_Sans } from "next/font/google";
import { ASOCIATIA } from "@/date/asociatie";
import Antet from "@/componente/Antet";
import BannerCookieuri from "@/componente/BannerCookieuri";
import BaraDeAnunt from "@/componente/BaraDeAnunt";
import ButonDoneazaMobil from "@/componente/ButonDoneazaMobil";
import Newsletter from "@/componente/Newsletter";
import Subsol from "@/componente/Subsol";
import { ADRESA_SITE, INDEXABIL, JsonLd, jsonLdAsociatie } from "./seo";
import "./globals.css";

// Fonturile sunt servite de pe domeniul nostru prin `next/font`: nicio cerere
// către Google la încărcarea paginii, deci nici cookie-uri terțe de acord.
//
// Titlurile sunt cu Nunito, nu cu Quicksand. Sigla scrie „Asociația Teona
// Ariana” cu un „a” cu două etaje și terminații ușor rotunjite; Quicksand are
// „a” geometric într-un singur etaj, mult mai lat — lângă siglă se vedea că sunt
// două scrisuri diferite. Nunito se suprapune peste literele siglei, iar Nunito
// Sans, din aceeași familie, duce textul lung. Așa avem o singură linie de
// identitate, de la siglă până la ultimul paragraf.
//
// `latin-ext` aduce ă â î ș ț; toate trei le desenează cu virgulă dedesubt, nu
// cu sedilă — verificat, nu presupus.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
});

/**
 * Metadatele comune. Fiecare pagină le completează cu ale ei prin
 * `metadate()` din `seo.tsx`; aici stau doar cele care nu se schimbă.
 *
 * `metadataBase` e adresa de la care se rezolvă `canonical`, imaginile de
 * distribuire și restul adreselor absolute — fără ea Next cădea pe
 * `localhost:3000`. Ce trebuie schimbat la lansare e scris la `ADRESA_SITE`.
 *
 * `keywords`: Google nu mai citește eticheta de ani de zile, dar alte motoare
 * și unele unelte o afișează încă; nu costă nimic. Ce contează pentru
 * căutare sunt titlurile, descrierile și textul paginilor.
 */
export const metadata: Metadata = {
  metadataBase: new URL(ADRESA_SITE),
  title: {
    default: ASOCIATIA.denumire,
    template: `%s · ${ASOCIATIA.denumire}`,
  },
  description: ASOCIATIA.fraza,
  applicationName: ASOCIATIA.denumire,
  keywords: [
    "Asociația Teona Ariana",
    "Suceava",
    "copii cu nevoi speciale",
    "copii cu dizabilități",
    "autism",
    "sindrom Down",
    "tabere RESPIRO",
    "Casa Teona",
    "ONG Suceava",
    "donație",
    "redirecționare 3,5%",
    "voluntariat",
  ],
  openGraph: {
    title: ASOCIATIA.denumire,
    description: ASOCIATIA.fraza,
    locale: "ro_RO",
    type: "website",
    siteName: ASOCIATIA.denumire,
  },
  twitter: {
    card: "summary_large_image",
    title: ASOCIATIA.denumire,
    description: ASOCIATIA.fraza,
  },
  // Pe adresa de previzualizare nu se indexează nimic — vezi `INDEXABIL`.
  robots: INDEXABIL
    ? { index: true, follow: true, "max-image-preview": "large" }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F74F22",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${nunito.variable} ${nunitoSans.variable} ${kalam.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-hartie">
        {/* Asociația, ca organizație, pe fiecare pagină: Google o leagă de
            site indiferent pe ce pagină intră prima dată. */}
        <JsonLd date={jsonLdAsociatie()} />
        <a
          href="#continut"
          className="sr-only rounded-full bg-cerneala px-5 py-3 font-titlu font-semibold text-hartie focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70]"
        >
          Sari la conținut
        </a>

        <BaraDeAnunt />
        {/*
          Antetul și butonul plutitor citesc calea paginii curente, ca să
          marcheze intrarea activă. Pe o rută care se randează la cerere —
          paginile de campanie aniversară — calea nu e cunoscută dinainte,
          iar `cacheComponents` oprește construirea dacă o componentă o cere
          în afara unui `<Suspense>`. Învelișul le lasă să se randeze după ce
          calea e știută, fără să schimbe nimic pentru paginile obișnuite.
        */}
        <Suspense>
          <Antet />
        </Suspense>

        <main id="continut" className="flex-1">
          {children}
        </main>

        <Newsletter />
        <Subsol />

        {/* Spațiu cât butonul plutitor, ca să nu acopere sfârșitul subsolului. */}
        <div aria-hidden="true" className="doar-site h-20 sm:hidden" />

        <Suspense>
          <ButonDoneazaMobil />
        </Suspense>
        <BannerCookieuri />
      </body>
    </html>
  );
}
