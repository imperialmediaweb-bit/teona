import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Kalam, Nunito, Nunito_Sans } from "next/font/google";
import { ASOCIATIA } from "@/date/asociatie";
import Antet from "@/componente/Antet";
import BannerCookieuri from "@/componente/BannerCookieuri";
import BaraDeAnunt from "@/componente/BaraDeAnunt";
import Analitice from "@/componente/Analitice";
import Urma from "@/componente/Urma";
import ButonDoneazaMobil from "@/componente/ButonDoneazaMobil";
import AsistentDacaExista from "@/componente/AsistentDacaExista";
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
  /*
    Dovada că site-ul e al nostru, pentru Search Console și Bing.

    Amândouă cer fie un fișier încărcat la rădăcină, fie o etichetă `meta` în
    pagină. Eticheta se pune din variabilă de mediu, nu în cod: codul ăsta e
    public, iar valoarea e un secret slab — cine o are poate cere acces la
    datele de căutare ale site-ului. Se setează în Railway, cu codul pe care
    îl dă Google („Alternative methods → HTML tag”, partea din `content`):

        VERIFICARE_GOOGLE=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    Dacă variabila lipsește, eticheta nu se scrie deloc — o etichetă goală ar
    face verificarea să pice cu un mesaj greu de înțeles.
  */
  verification: {
    ...(process.env.VERIFICARE_GOOGLE
      ? { google: process.env.VERIFICARE_GOOGLE }
      : {}),
    ...(process.env.VERIFICARE_BING
      ? { other: { "msvalidate.01": process.env.VERIFICARE_BING } }
      : {}),
  },
};

export const viewport: Viewport = {
  themeColor: "#F74F22",
};

/**
 * Locul pe care îl ține antetul până se randează.
 *
 * Antetul citește calea paginii curente, deci stă într-un `<Suspense>`, iar un
 * `<Suspense>` fără `fallback` nu lasă nimic în HTML-ul trimis întâi: pagina
 * se desena cu conținutul lipit de marginea de sus, iar antetul apărea o
 * clipă mai târziu și împingea totul în jos cu 68–167 de pixeli. Măsurat pe
 * build-ul de producție, cu procesorul încetinit de patru ori: 1,3 secunde cu
 * pagina așezată greșit și un CLS de 0,16 — peste pragul de 0,1 de la care
 * Google consideră că o pagină „sare”, și destul cât să apeși alt buton decât
 * cel pe care l-ai țintit.
 *
 * Înălțimile sunt cele măsurate pe antetul adevărat, în starea lui desfăcută:
 * 68 px sub 360 px lățime, 72 px până la ~644, 78 px până la 1280, 167 px
 * peste. Nu sunt impuse antetului — el se strânge la derulare și trebuie să
 * poată — ci doar imitate aici. Ca să nu rămână în urmă dacă antetul se
 * schimbă, `scripts/qa/salt-layout.mjs` măsoară saltul real și pică dacă
 * trece de 0,05.
 */
function LocAntet() {
  return (
    <div
      aria-hidden="true"
      className="h-[68px] min-[360px]:h-[72px] sm:h-[78px] xl:h-[167px]"
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${nunito.variable} ${nunitoSans.variable} ${kalam.variable} h-full`}
    >
      <head>
        {/*
          Două rânduri care rulează înaintea primei desenări.

          Bara de anunț se scrie pe server, ca să-și țină locul și să nu
          împingă pagina în jos când pornește JavaScriptul. Dar cine a închis-o
          în vizita asta nu trebuie s-o mai vadă — nici măcar o clipă. Scriptul
          ăsta citește `sessionStorage` și pune clasa pe `<html>` înainte ca
          browserul să deseneze ceva; regula din `globals.css` ascunde bara pe
          baza ei. Nu se poate face din React: orice decizie luată după
          hidratare vine prea târziu, după prima desenare.

          Conținutul e scris aici, în cod, nu vine de nicăieri din afară.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(sessionStorage.getItem("teona:bara-anunt-inchisa")==="1")' +
              'document.documentElement.classList.add("fara-bara-anunt")}catch(e){}',
          }}
        />
      </head>
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
        <Suspense fallback={<LocAntet />}>
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
          <Suspense fallback={null}>
            <AsistentDacaExista />
          </Suspense>
        </Suspense>
        <BannerCookieuri />
        <Analitice />
        <Urma />
      </body>
    </html>
  );
}
