import type { Metadata, Viewport } from "next";
import { Kalam, Nunito, Nunito_Sans } from "next/font/google";
import { ASOCIATIA } from "@/date/asociatie";
import Antet from "@/componente/Antet";
import BannerCookieuri from "@/componente/BannerCookieuri";
import BaraDeAnunt from "@/componente/BaraDeAnunt";
import ButonDoneazaMobil from "@/componente/ButonDoneazaMobil";
import Newsletter from "@/componente/Newsletter";
import Subsol from "@/componente/Subsol";
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

export const metadata: Metadata = {
  title: {
    default: ASOCIATIA.denumire,
    template: `%s · ${ASOCIATIA.denumire}`,
  },
  description: ASOCIATIA.fraza,
  applicationName: ASOCIATIA.denumire,
  openGraph: {
    title: ASOCIATIA.denumire,
    description: ASOCIATIA.fraza,
    locale: "ro_RO",
    type: "website",
    siteName: ASOCIATIA.denumire,
  },
  robots: { index: true, follow: true },
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
        <a
          href="#continut"
          className="sr-only rounded-full bg-cerneala px-5 py-3 font-titlu font-semibold text-hartie focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70]"
        >
          Sari la conținut
        </a>

        <BaraDeAnunt />
        <Antet />

        <main id="continut" className="flex-1">
          {children}
        </main>

        <Newsletter />
        <Subsol />

        {/* Spațiu cât butonul plutitor, ca să nu acopere sfârșitul subsolului. */}
        <div aria-hidden="true" className="h-20 sm:hidden" />

        <ButonDoneazaMobil />
        <BannerCookieuri />
      </body>
    </html>
  );
}
