import type { Metadata, Viewport } from "next";
import MicsoreazaPoza from "@/componente/admin/MicsoreazaPoza";
import TineCiorna from "@/componente/admin/TineCiorna";
import { Suspense } from "react";
import { CautareaPanoului, MeniulPanoului } from "@/componente/admin/Cadru";

/**
 * Panoul ca aplicație: manifestul și iconița de pe ecranul telefonului se
 * leagă numai aici, nu în aranjamentul site-ului. Cine instalează site-ul
 * public n-are de ce să primească panoul, și invers.
 */
export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Panou Teona",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/panou/icon-512.png" },
};

export const viewport: Viewport = {
  themeColor: "#232323",
};

export default function AranjamentPanou({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        Meniul stă aici, nu în fiecare pagină: rămâne pe loc de la o pagină la
        alta (nu se redesenează, nu-și pierde derularea, nu clipește în
        „Se încarcă…”). `div`, nu `main`: aspectul site-ului are deja un `main`.
      */}
      <div id="panou-admin" className="min-h-screen bg-[#f6f5f3] pb-16 lg:flex lg:pb-0">
        <Suspense fallback={<div className="hidden bg-[#272320] lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0" />}>
          <MeniulPanoului />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {/* Pozele mari se micșorează în browser, înainte să plece spre server. */}
      <MicsoreazaPoza />
      <TineCiorna />
      {/* Căutarea rapidă (Ctrl K), o singură fereastră pentru tot panoul. */}
      <Suspense fallback={null}>
        <CautareaPanoului />
      </Suspense>
    </>
  );
}
