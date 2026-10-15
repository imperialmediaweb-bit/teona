"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { ANALITICE } from "@/date/analitice";
import { abonareLaAcord, citesteAcord } from "@/lib/cookieuri";

/**
 * Statisticile de vizitare, pornite numai cu acord.
 *
 * Componenta se uită la alegerea din bannerul de cookie-uri și, cât timp
 * „statistici” nu e bifat, nu randează nimic: niciun script, niciun cookie,
 * nicio cerere spre Google. Când vizitatorul bifează, `abonareLaAcord` o
 * trezește și scriptul intră pe loc, fără reîncărcarea paginii.
 *
 * Pe server starea e „fără acord”, deci în HTML-ul trimis din fabrică nu
 * există nicio urmă de Google. Alegerea e ținută în `localStorage`, unde
 * serverul n-are ce căuta.
 */
function cuAcord(): "1" | "0" {
  return citesteAcord()?.statistici ? "1" : "0";
}

export default function Analitice() {
  const acord = useSyncExternalStore(
    abonareLaAcord,
    cuAcord,
    () => "0" as const,
  );

  if (!ANALITICE || acord !== "1") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ANALITICE}`}
        strategy="afterInteractive"
      />
      <Script id="analitice" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ANALITICE}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
